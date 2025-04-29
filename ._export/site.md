Project Overview

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Boilerplate:** MakerKit.dev
- **Database/Auth:** Supabase (PostgreSQL)
- **State Management:** Zustand
- **UI/UX:** Reuse existing components in `/components/*` and `/components/ui/*`
- **KIPU EMR Integration:** For behavioral health/substance abuse records management

---

## 🔑 Core Guidelines

- **Remove All Mock Data:** No mock data should remain in production code.
- **Always Reference Specs:**
  - MakerKit boilerplate: `/makerkit.md`
  - ChartChek app: `/apps/web/README.md`
- **Deliver Only Application-Specific Code:** No generic or speculative solutions.
- **Full File Refactors:** When refactoring, provide the complete file logic unless explicitly told otherwise.
- **Ask Before Acting:** If scope, logic, or infrastructure is unclear, request clarification before writing code.

---

## 🧑‍💻 Data Fetching Patterns

### Server Components (Default)
- Use for all SSR/data fetching unless client interactivity is required.
- Use `getSupabaseServerClient` from `@kit/supabase/server-client` for direct DB access:
  ```js
  import { getSupabaseServerClient } from '@kit/supabase/server-client';
  export default async function MyServerComponent() {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('table').select('*');
    // Handle data/error
  }
Client Components (When Needed)
Use "use client" at the top.
Use React Query for all client-side data fetching/mutations:
useSupabase for client instance
useQuery for reads
useMutation for writes
Always handle loading and error states.
🔗 KIPU EMR Integration
Service Layer: Only access KIPU API directly in /lib/kipu/service/*.
All Other Logic: Place in /lib/services.
Do Not Modify: KIPU auth logic in /lib/kipu/auth/*.
Follow Patterns: Use server/auth functions for headers, signatures, etc.
🛡️ API Route Handlers
Use route.ts in App Router for API endpoints.
Use enhanceRouteHandler from @kit/next/routes for:
User state (auth)
Zod schema validation
Captcha protection (add { captcha: true } if needed)
Example:
ts
CopyInsert
import { z } from 'zod';
import { enhanceRouteHandler } from '@kit/next/routes';
export const POST = enhanceRouteHandler(
  async ({ body, user, request }) => { /* ... */ },
  { schema: ZodSchema }
);
For non-/api/* routes, also pass x-csrf-token in headers.
⚡ Server Actions
Use 'use server' at the top of server action files.
Use enhanceAction from @kit/next/actions for:
Auth enforcement (injects user)
Zod schema validation
Captcha validation ({ captcha: true })
Example:
js
CopyInsert
import { z } from 'zod';
import { enhanceAction } from '@kit/next/actions';
export const myServerAction = enhanceAction(
  async (data, user) => { return { success: true }; },
  { schema: ZodSchema, captcha: true }
);
Client must get captcha token with useCaptchaToken and pass it in action params.
🔒 Environment Variables
CAPTCHA_SECRET_TOKEN (server, CI/CD)
NEXT_PUBLIC_CAPTCHA_SITE_KEY (client, CI/CD)
Never commit secrets to .env files in source control.
📝 Best Practices
Reuse Components: Always check /components/* and /components/ui/* before creating new ones.
Service Layer Separation: Only direct KIPU API access in /lib/kipu/service/*; all other business logic in /lib/services.
Strictly Follow MakerKit and Project Patterns: Never guess at logic, references, or file locations.
Remove All Mock Data: No mock data in production.
Last verified: 2025-04-27

CopyInsert

This block reflects the actual project structure, MakerKit conventions, and all critical requirements for ChartChek. Copy and use as your single source of truth.