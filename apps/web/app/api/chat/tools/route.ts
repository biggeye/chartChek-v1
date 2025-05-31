export const runtime = 'nodejs';
import { toolRegistry } from '~/components/chat/tools';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { toolName, parameters } = await req.json();
    if (!toolName || typeof toolName !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid toolName' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Explicitly cast toolRegistry for string lookup
    const tool = (toolRegistry as Record<string, any>)[toolName];
    if (!tool) {
      return new Response(JSON.stringify({ error: `Tool '${toolName}' not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Validate parameters using the tool's schema if available
    let parsedParams = parameters;
    if (tool.parameters && typeof tool.parameters.parse === 'function') {
      try {
        parsedParams = tool.parameters.parse(parameters);
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Parameter validation failed', details: err instanceof Error ? err.message : err }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    // Execute the tool
    const result = await tool.execute(parsedParams);
    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', details: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
