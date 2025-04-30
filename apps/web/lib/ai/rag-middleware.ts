import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import OpenAI from "openai-edge"; // or '@vercel/ai'
import { Pool } from "pg";

// Initialize OpenAI client (Edge)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Postgres connection pool (with pgvector extension)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Run on the Edge runtime
export const runtime = "edge";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  if (!url.pathname.startsWith("/api/chat")) {
    return NextResponse.next();
  }

  const body = await req.json();
  const { messages: origMessages, context, userId, vectorSearch } = body;
  let messages = [...origMessages];

  // 1) Apply contextual override if provided
  if (context && typeof context === 'string') {
    messages = [{ role: 'system', content: context }, ...messages];
  }

  // 2) RAG pipeline: classification + hypothetical answer + vector search
  if (vectorSearch) {
    // Extract last user message
    const lastUser = origMessages.filter(m => m.role === 'user').slice(-1)[0];
    if (lastUser) {
      // Flatten content to plain text
      const text =
        typeof lastUser.content === 'string'
          ? lastUser.content
          : Array.isArray(lastUser.content)
          ? lastUser.content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join('\n')
          : '';

      // 2.1) Classify as question/statement/other
      const classRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Classify the following as question, statement, or other:' },
          { role: 'user', content: text }
        ]
      });
      const classification = classRes.choices[0].message.content.trim().toLowerCase();

      if (classification === 'question') {
        // 2.2) Generate hypothetical answer for richer embeddings
        const hypoRes = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: "Answer the user's question:" },
            { role: 'user', content: text }
          ]
        });
        const hypotheticalAnswer = hypoRes.choices[0].message.content;

        // 2.3) Embed the hypothetical answer
        const embRes = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: hypotheticalAnswer
        });
        const embedding = embRes.data[0].embedding;

        // 2.4) Vector search in Postgres
        const vsRes = await pool.query(
          `SELECT id, content
           FROM documents
           ORDER BY embedding <=> $1
           LIMIT 5`,
          [embedding]
        );
        const snippets = vsRes.rows.map(r => r.content).join("\n---\n");

        // 2.5) Prepend relevant docs as a system message
        messages.unshift({
          role: 'system',
          content: `Relevant documents to help answer your question:\n\n${snippets}`
        });
      }
    }
  }

  // 3) Call the LLM
  const chatRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages
  });
  const aiMessage = chatRes.choices[0].message;

  // 4) Log chat history
  await pool.query(
    `INSERT INTO chat_history (user_id, messages, response)
     VALUES ($1, $2, $3)`,
    [userId, JSON.stringify(messages), JSON.stringify(aiMessage)]
  );

  // Return AI response
  return NextResponse.json(aiMessage);
}