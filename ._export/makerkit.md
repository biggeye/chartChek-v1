# MakerKit Next.js + Supabase Turbo – Documentation Summary

**MakerKit Turbo** is a full-stack SaaS boilerplate built with Next.js (App Router) and Supabase. It uses a Turborepo monorepo architecture and integrates modern tools like Shadcn UI (Tailwind CSS), React Query, Zod, Lucide icons, and Nodemailer/Resend for emails ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=1,for%20edge%20runtimes)). The kit provides out-of-the-box features (auth, teams, billing, etc.) with a modular, extensible codebase. This summary outlines the main documentation sections – *Installation*, *Configuration*, *Customization*, *Development*, *API*, *Data Fetching*, and more – with high-level overviews. Detailed guidance is provided for **Development**, **API**, and **Data Fetching**.

## Installation

**Project Setup & Requirements:** MakerKit Turbo requires Node.js and uses **PNPM** as the package manager in a Turborepo monorepo ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=1,for%20edge%20runtimes)). The main repository contains an `apps` folder (Next.js application) and a `packages` folder (shared modules and service APIs) ([Navigating the your Next.js Supabase Turbo Starter Kit codebase](https://makerkit.dev/docs/next-supabase-turbo/installation/navigating-codebase#:~:text=The%20main%20directories%20in%20the,project%20are)) ([Navigating the your Next.js Supabase Turbo Starter Kit codebase](https://makerkit.dev/docs/next-supabase-turbo/installation/navigating-codebase#:~:text=)). Before running the project, ensure you have **Docker** installed and running (Supabase runs in a Docker container for local development).

**Cloning the Repository:** Use your MakerKit license to access the GitHub repo and clone it. Once cloned, copy the sample environment files (`.env.example`) to your local `.env` files (e.g. `.env.local`) and fill in required variables (Supabase keys, etc.). MakerKit uses multiple env files: a base `.env` for shared vars and environment-specific files like `.env.development` and `.env.production` ([Environment Variables in the Next.js Supabase Starter Kit](https://makerkit.dev/docs/next-supabase-turbo/configuration/environment-variables#:~:text=Environment%20variables%20are%20defined%20in,package)). Sensitive secrets are usually set via your deployment environment or in untracked local files ([Environment Variables in the Next.js Supabase Starter Kit](https://makerkit.dev/docs/next-supabase-turbo/configuration/environment-variables#:~:text=2,is%20not%20committed%20to%20Git)).

**Starting the Development Environment:** MakerKit provides scripts to streamline local setup:

- **Start Supabase:** Run `pnpm run supabase:web:start` to launch the local Supabase stack (database, authentication, storage) in Docker ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=1)). This starts Supabase’s services locally so you can work without deploying to Supabase.
- **Start Next.js app:** In another terminal, run `pnpm dev` to start the Next.js development server ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=2)). By default this launches two services:
  1. **Web Application (Next.js)** – the main app on [http://localhost:3000](http://localhost:3000) ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=This%20command%20launches%3A)).
  2. **Dev Tools** – an optional debugging UI on [http://localhost:3010](http://localhost:3010) ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=This%20command%20launches%3A)) (see *Developer Tools* section for details). You will primarily use the main app.

- **(Optional) Start Stripe:** If you plan to test billing, you can also start the Stripe emulator or CLI (`pnpm run stripe` or similar) as instructed, though this is optional ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=To%20run%20the%20project%2C%20follow,optional%20for%20billing%20system%20testing)) ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=Start%20the%20Next)).

Once running, MakerKit auto-seeds the database with some test data. You can log in with a sample **user account** (e.g. **email:** `test@makerkit.dev`, **password:** `testingpassword`) ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=Quick%20Start%20Credentials)). The kit uses an internal mail capture service (Mailpit) at [localhost:54324](http://localhost:54324) to catch outgoing emails (for email confirmations, etc.) ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=,testingpassword)). A **Super Admin** user is also pre-created (email `super-admin@makerkit.dev`, password `testingpassword`) for administrative access ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=)). Note that Super Admin login requires MFA by default – a test TOTP secret is provided in the docs for development use ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=)) ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=Makerkit%20forces%20MFA%20%28multi,following%20steps%20to%20pass%20MFA)).

**Common Commands:** MakerKit uses PNPM workspaces with many convenient scripts (run these from the repository root unless noted):
- `pnpm dev`: Start the Next.js app (and dev tools) for development ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=2)).
- `pnpm build`: Build the application for production.
- `pnpm lint` / `pnpm test`: Lint the codebase and run tests (the kit includes a testing setup).
- `pnpm --filter web run supabase:reset`: Reset the local Supabase DB (reseed with initial data) ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=Ensure%20it%27s%20working%3A%20Please%20try,DB%20with%20the%20following%20command)).
- `pnpm --filter web run supabase:stop`: Stop the local Supabase Docker container.
- `pnpm --filter web run supabase:db:diff -f <name>`: Generate a new migration by diffing schema changes (see **Development > Migrations**).
- `pnpm --filter web run supabase:db:push`: Push local migrations to the remote Supabase instance (for staging/prod) ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=Pushing%20the%20migration%20to%20the,remote%20Supabase%20instance)).

**Updating the Codebase:** If MakerKit releases updates, you can pull the latest changes and apply them to your project. Keep your customizations primarily in configuration (or separate modules) to simplify merging updates. The docs provide a guide for upgrading (including from v1 or updating dependencies like Next.js 15 or Tailwind CSS v4).

**Project Structure:** MakerKit is organized as a monorepo with clearly separated concerns ([Navigating the your Next.js Supabase Turbo Starter Kit codebase](https://makerkit.dev/docs/next-supabase-turbo/installation/navigating-codebase#:~:text=Project%20Structure)):
- **`apps/web`** – The Next.js application (the main SaaS web app). This is where pages (App Router routes) and Next.js config live. You can add additional apps (e.g., `apps/admin`) if needed.
- **`packages`** – Reusable modules (“kits”) for shared logic and domain-specific functionality ([Navigating the your Next.js Supabase Turbo Starter Kit codebase](https://makerkit.dev/docs/next-supabase-turbo/installation/navigating-codebase#:~:text=)). All apps can import these packages. Key packages include:
  - `@kit/ui`: UI components and styles (built on Shadcn UI and Tailwind) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,and%20logic%20for%20managing%20subscriptions)).
  - `@kit/shared`: Utility code shared across the app (helpers, hooks, logging, etc.) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,and%20logic%20for%20managing%20subscriptions)).
  - `@kit/supabase`: Supabase client utilities and database logic (e.g. schema types, RPC calls) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,that%20defines%20the%20schema%20and)).
  - `@kit/i18n`: Internationalization utilities (for translations).
  - `@kit/auth`: Authentication logic (integrates Supabase auth).
  - `@kit/accounts` and `@kit/team-accounts`: Personal and team account management logic (organization handling, roles, invitations) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,defines%20the%20schema%20and%20logic)).
  - `@kit/billing` and `@kit/billing-gateway`: Billing schema definition and integration logic (abstracts providers like Stripe, Lemon Squeezy) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=managing%20Supabase%20,email%20package)) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,abstracts%20the%20Lemon%20Squeezy%20API)).
  - `@kit/notifications`: In-app notification system logic ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,and%20logic%20for%20managing%20notifications)).
  - `@kit/admin`: Admin panel logic for “super admin” features (user management, etc.) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,and%20logic%20for%20managing%20notifications)).
  - `@kit/cms` with `@kit/keystatic` / `@kit/wordpress`: Content management integrations (either Git-based Keystatic or WordPress) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=The%20CMSs%20that%20can%20be,added%20to%20the%20application)).
  - `@kit/email-templates` and `@kit/mailers`: Pre-built email templates (using react.email) and email sending logic (supports multiple providers via SMTP or APIs) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=subscriptions%20%2A%20%40kit%2Fbilling,Sentry)).
  - `@kit/monitoring`: Monitoring/analytics integration (e.g. Sentry) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=%28e,js%20specific%20utilities)).
  - `@kit/next`: Next.js-specific helpers (e.g. for routing, middleware).
  - *Planned:* `@kit/plugins` and `@kit/analytics` for extensibility and unified analytics in the future ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=Also%20planned%20%28post)) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,package%20to%20track%20user%20behavior)).

This modular structure means you can customize or even remove features by adjusting which packages are used. All packages are TypeScript and share types, and many use Zod for schema validation. The **codebase navigation** guide in documentation points out key files and patterns for understanding how these pieces fit together.

## Configuration

**Environment Variables:** Configuration in MakerKit primarily happens via environment variables and config files. The project uses **Zod** to validate configuration at startup, ensuring required settings are present and well-formed ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=Application%20Configuration)). There are separate env files for different environments (development, production) and a base `.env` for common settings ([Environment Variables in the Next.js Supabase Starter Kit](https://makerkit.dev/docs/next-supabase-turbo/configuration/environment-variables#:~:text=1,variables%20of%20the%20CI%2FCD%20system)). Secret keys (like API keys) should be kept out of Git – use `.env.local` for local secrets and set them in your deployment environment for production ([Environment Variables in the Next.js Supabase Starter Kit](https://makerkit.dev/docs/next-supabase-turbo/configuration/environment-variables#:~:text=2,is%20not%20committed%20to%20Git)).

Core environment variables include:
- **App basics:** `NEXT_PUBLIC_APP_NAME` (application name), `NEXT_PUBLIC_APP_URL` (base URL), etc., which define branding and URLs.
- **Supabase:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` for client access, and `SUPABASE_SERVICE_ROLE_KEY` for privileged server access.
- **Auth settings:** e.g. `NEXT_PUBLIC_ALLOW_SIGNUPS` (feature flag to allow open signups or not), OAuth client IDs if using third-party logins.
- **Stripe or Billing:** Stripe secret/public keys or Lemon Squeezy keys depending on provider, to enable the billing module.
- **Email:** SMTP credentials or Resend API key for sending emails.
- **Misc:** reCAPTCHA or hCaptcha site keys (if using CAPTCHA), Sentry DSN (for monitoring), etc.

**Application Config Files:** In `apps/web/config/`, MakerKit defines structured config files (in TypeScript) for various aspects of the app ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=Application%20Configuration)). These provide a centralized way to adjust behavior:
- **`app.config.ts`** – Global app configuration (app name, default locale, descriptions, etc.) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=The%20configuration%20is%20defined%20in,find%20the%20following%20configuration%20files)).
- **`auth.config.ts`** – Authentication methods and settings (enable/disable magic links, OAuth providers, MFA requirements, etc.) ([Environment Variables in the Next.js Supabase Starter Kit](https://makerkit.dev/docs/next-supabase-turbo/configuration/environment-variables#:~:text=3)).
- **`billing.config.ts`** – Defines the *billing schema* for your plans and products (more in **Billing** section) and which provider to use.
- **`feature-flags.config.ts`** – Toggle features on/off (e.g. enable Teams, enable Notifications, etc.) for conditional functionality ([Environment Variables in the Next.js Supabase Starter Kit](https://makerkit.dev/docs/next-supabase-turbo/configuration/environment-variables#:~:text=6)) ([Environment Variables in the Next.js Supabase Starter Kit](https://makerkit.dev/docs/next-supabase-turbo/configuration/environment-variables#:~:text=Notifications)).
- **`paths.config.ts`** – Centralizes route paths or API endpoint paths used in the app (for consistency if routes change) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=The%20configuration%20is%20defined%20in,find%20the%20following%20configuration%20files)).
- **`personal-account-sidebar.config.ts` & `team-account-sidebar.config.ts`** – Define the navigation menu items for personal account vs. team account sections of the app (links, icons, order) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,links%2C%20icons%2C%20etc)).
- **`navigation.config.ts`** (if present) – Can define top-level navigation preferences (e.g. use a top navbar vs. side drawer layout).

Because these configs are code, they allow conditional logic or computed values. MakerKit’s defaults are sensible, but you can modify them to fit your needs. For example, you could remove “Teams” by turning off the team feature flag, which would hide team-related UI and disable team account creation.

**Feature Flags:** Feature flags (set via environment or `feature-flags.config.ts`) let you enable/disable major features:
- *Teams:* Control whether organization accounts are enabled.
- *Notifications:* Enable in-app notifications system.
- *Billing:* Enable subscription billing UI and enforcement.
- *OAuth providers:* (Often configured via env like `NEXT_PUBLIC_ENABLE_GITHUB_LOGIN`, etc.)
- *AI features:* (If any experimental LLM features are included, toggled via config – MakerKit v2 hints at some AI starter integration, but not core.)

**Account & Team Navigation:** The account sidebar configurations allow customizing the menu items for users. For instance, you can remove a section, rename labels, or add new links (perhaps to new features you add) by editing these config files. The default setup includes sections for Profile, Settings, Billing, etc., in personal account, and Team management, Invitations, etc., in team account.

**Validation:** The configuration loader will validate the env variables using Zod schemas and fail to start if required config is missing or invalid ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=Application%20Configuration)). This helps catch misconfiguration early.

In summary, **most customization in MakerKit can be achieved by configuration rather than modifying code**, which makes upgrading the base kit easier down the line ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=These%20control%20everything%20from%20your,and%20you%27re%20good%20to%20go)) ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=While%20Makerkit%20is%20highly%20customizable%2C,of%20Makerkit%20in%20the%20future)).

## Customization

MakerKit is designed to be highly customizable, allowing you to tailor the app’s look, feel, and enabled features **without extensive code changes**. Key customization areas include environment-based settings, branding (styles and graphics), layout, and feature configuration ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=One%20of%20Makerkit%27s%20greatest%20strengths,key%20areas%20you%20can%20personalize)) ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=Branding%20and%20Design)).

**1. Environment Variables (App Identity & Features):** The quickest way to make MakerKit “yours” is by adjusting environment variables for things like the **application name, meta tags, and enabled features** ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=Environment%20Variables)). For example, set your `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_DESCRIPTION`, and update any default URLs or contact emails. Feature flags (as described above) can turn entire subsystems on/off (e.g. disable signups for a private beta, or disable billing if launching a free version initially) ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=Feature%20Configuration)). Most such changes require no code edits – the app reads these values and adapts accordingly.

**2. Branding & Design:** MakerKit uses **Tailwind CSS** with **Shadcn UI** components for styling. You can easily reskin the app:
- **Color Theme:** The default design uses a Shadcn UI theme. To customize, edit the Tailwind CSS variables in `apps/web/styles/shadcn-ui.css` to match your brand palette ([Updating the Shadcn theme in your Makerkit Application | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/customization/theme#:~:text=Makerkit%20uses%20Shadcn%20UI%20and,theme%20according%20to%20its%20guidelines)) ([Updating the Shadcn theme in your Makerkit Application | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/customization/theme#:~:text=For%20example%2C%20the%20default%20theme,has%20the%20following%20CSS%20variable)). You can either manually adjust colors or copy a premade theme from the Shadcn UI library ([Updating the Shadcn theme in your Makerkit Application | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/customization/theme#:~:text=%60apps%2Fweb%2Fstyles%2Fshadcn)). For Tailwind v4, you might need to express colors in `hsl()` format per Shadcn’s requirements ([Updating the Shadcn theme in your Makerkit Application | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/customization/theme#:~:text=One%20difference%20with%20the%20Shadcn,function)).
- **Logo & Favicon:** Replace the logo assets (e.g., in `public/` folder) with your own logos. Update any references to the logo in the layout components if needed. The documentation has a guide for updating the logo image and ensuring the favicon and social sharing images are updated.
- **Fonts:** MakerKit supports custom fonts. By default it may use a system font or a default webfont. You can include a Google Font or any other by updating the font in the global CSS and Tailwind config, or by using Next.js’s built-in font optimization (e.g. `next/font`) in `_app` or layout.
- **Light/Dark Mode:** The kit supports dark mode. Tailwind + Shadcn make it easy to adjust or disable. You can customize color shades for dark mode in the CSS theme or choose to default to one mode.

**3. Layout & Navigation:** MakerKit offers multiple navigation layouts:
- **Sidebar vs Header:** You can choose between a sidebar navigation (typical dashboard style) or a top navigation bar. The default might be a sidebar for authenticated areas. The *Layout Style* config or documentation provides instructions to switch to a header layout if desired ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=Layout%20and%20Navigation)).
- **Menu Items:** As mentioned in *Configuration*, you can add or remove navigation links in user or team menus by editing the sidebar config files ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=Choose%20how%20your%20app%20looks,and%20feels)). For example, if you don’t need a “Billing” section (perhaps your app is free), you can remove that link.
- **Marketing Pages:** The kit likely includes or allows adding marketing pages (landing page, pricing page, etc.) either within the Next.js app or via an external site. If internal, they can be placed as public routes (e.g. `/pricing`) and styled differently (perhaps using a different layout without the dashboard chrome).

**4. Feature Enablement/Disablement:** Through config, you can turn off features you don’t need initially:
- **Auth Methods:** Only want email/password and Google OAuth? You can disable magic links or other providers in `auth.config.ts` and not provide those keys.
- **Teams:** Single-user app? Turn off team accounts (the UI and API related to teams will be hidden).
- **Billing:** If not charging users yet, you can disable billing so that subscription UI is hidden and billing-related routes are inactive.
- **Notifications:** If you don’t need the notification center right away, keep it off via feature flag.

These toggles let you start simple and then enable features as your product grows, without having to refactor code.

**5. Content Management System:** For editable content (marketing pages, help center docs, etc.), MakerKit supports two approaches:
- **Keystatic** (default) – a Git-based CMS where content (like Markdown/MDX files) is stored in the repo and editable through a special interface. This keeps content versioned and simple ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=Content%20Management)).
- **WordPress** – integration for using a WordPress backend for content if preferred ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=Content%20Management)). If you opt for WordPress, you’d configure the `@kit/wordpress` package and likely set API endpoints to fetch WP content.

By default, MakerKit may use Keystatic for things like Terms of Service, Privacy Policy pages, etc., stored in the repository so you can edit them easily.

**Where to Start:** The documentation recommends a sensible order for implementing customizations ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=Where%20to%20Start%3F)):
1. **Set up env variables** for basic config (app name, allowed auth, etc.) – this sets the foundation.
2. **Theme & Styles:** Apply your color theme and logo to immediately give the app your branding ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=1,set%20up%20your%20basic%20configuration)).
3. **Fonts & Layout:** Adjust typography and decide on a navigation layout style that fits your UX.
4. **Feature flags:** Turn off anything you won’t use initially, to declutter the app.
5. **Content & Pages:** Update or add marketing content (like the landing page text, about page, etc.) via the chosen CMS method.

Most customizations can be done through configuration rather than forking the code, ensuring you can still update MakerKit’s core easily ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=While%20Makerkit%20is%20highly%20customizable%2C,of%20Makerkit%20in%20the%20future)). Take it step by step; you don’t need to change everything at once.

## Development

The **Development** section of MakerKit’s docs provides a roadmap for building your application on top of the boilerplate. The typical development workflow involves:

1. **Initial Setup & Customization:** After installation, set up your env variables and basic branding so the running app feels like yours (e.g. name, logo) ([How to approach local development | Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/development/approaching-local-development#:~:text=Generally%20speaking%2C%20you%20will%20be,doing%20the%20following)). This also includes enabling any core features you know you’ll need (teams, etc.) and disabling others (to simplify initial development).

2. **Designing the Database (Schema & Migrations):** Your app will have its own domain-specific data. MakerKit suggests **planning and implementing your database schema early**:
   - Write your tables, relationships, and functions using SQL migration files. The kit uses Supabase’s **declarative migration** system: you define schema SQL in files under `apps/web/supabase/schemas/*.sql` for each feature or domain ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=Declarative%20schema)) ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=create%20table%20if%20not%20exists,integrations)).
   - **Do not edit schema via Supabase Studio UI directly on remote** – instead, modify the local schema files and generate migrations ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=1)) ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=Do%20not%20use%20Supabase%20Studio,recommendation)). This ensures schema changes are version-controlled.
   - Use the Supabase CLI (wrapped by PNPM scripts) to create migrations. For example, after adding a new table in your schema file, run `pnpm --filter web run supabase:db:diff -f "<migration_name>"` to diff the local schema against the current DB and produce a migration file ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=We%20can%20now%20use%20Supabase%27s,a%20migration%20file%20for%20us)). The migration SQL will be placed under `apps/web/supabase/migrations/` ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=2,using%20the%20diffing%20feature)).
   - Apply the migration locally: usually restarting Supabase (or running `supabase db reset`) will apply new migrations. MakerKit provides `pnpm run supabase:web:reset` which stops, resets, and starts Supabase with the latest schema, reseeding data if needed ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=1,to%20the%20remote%20Supabase%20instance)).
   - Once satisfied, **push migrations to remote** (when deploying) with `pnpm --filter web run supabase:db:push`, so your production Supabase gets the new schema ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=Pushing%20the%20migration%20to%20the,remote%20Supabase%20instance)).
   
   This workflow ensures your database changes are **declarative and repeatable**. Always double-check generated migration files for correctness before pushing to production ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=,file)). (Supabase’s diff tool is helpful but can have caveats, so verify the SQL.)

3. **Routing & Pages:** Add new pages or routes in the Next.js App directory. MakerKit’s `apps/web/app/` folder is structured by feature (e.g., there might be an `(dashboard)` segment for the authenticated app). To add a new page, create a folder and page file under `app/`. For example, to add a “Projects” feature:
   - Define the DB schema (e.g., a `projects` table) and run a migration.
   - Create a route, e.g. `app/(dashboard)/projects/page.tsx` for a list page, `app/(dashboard)/projects/[id]/page.tsx` for a detail page.
   - MakerKit likely includes layout components for the dashboard that will automatically include new routes in the navigation if the config is updated.
   - Secure the route (if needed) by ensuring only logged-in users can access it (the kit’s default layout may already enforce that by checking session).

4. **Fetching Data from the DB:** To display data on your new pages, use MakerKit’s patterns for **data fetching** (see the **Data Fetching** section below). Typically, you will:
   - Use **Server Components** (in Next.js 13+) to load data from Supabase on the server side for initial page render.
   - Leverage MakerKit’s provided utilities like the `ServerDataLoader` component for common data queries with pagination ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=Now%20that%20our%20database%20supports,data%20from%20the%20Supabase%20database)) ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=Please%20check%20the%20documentation%20for,about%20how%20to%20use%20it)). For example, loading a list of tasks as shown in the docs:
     - First, load any needed context like the user’s workspace (account info) via a helper (`loadUserWorkspace()` in the example) ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=const%20client%20%3D%20getSupabaseServerClient)) ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=const%20,loadUserWorkspace)).
     - Then use `<ServerDataLoader>` to query a table (like `'tasks'`) with filters and pagination, and automatically get reactive results ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=)) ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=where%3D)). You pass it the Supabase client and query parameters, and it handles fetching that data on the server.
     - The data can then be rendered in a table or list. The example uses a `<TasksTable>` component to display results and includes a search form that filters the query ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=)) ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=)).
   - MakerKit’s data loader supports pagination out of the box (e.g., passing `page` and seeing results, likely using range queries under the hood). It also supports full-text search filtering as shown by the `title: { textSearch: "%...%" }` filter in the example ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=where%3D)).
   - Alternatively, you can call Supabase directly via the server client in any server component or use the pre-built **API service functions** (see **API** section) to retrieve data.

5. **Writing Data (Mutations):** To allow users to create or modify data (e.g. adding a new Task), MakerKit encourages using **Server Actions** (Next.js server actions) with forms:
   - **Server Action Functions:** Define an async function with `'use server'` at the top to mark it as a server action (so it can be called from the client) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=Writing%20a%20Server%20Action%20to,Add%20a%20Task)) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=Server%20Actions%20are%20defined%20by,side)). For example, `async function addTaskAction(data) { 'use server'; ... }`. This function will run on the server when invoked from the client.
   - **Validation:** Use Zod to define a schema for the input data (e.g., `WriteTaskSchema` for a new task) and validate inside the action. In the docs example, they parse the `params` with the Zod schema to ensure it matches expected fields ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=%27use%20server%27%3B)) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=logger.info%28task%2C%20)). MakerKit provides a helper `requireUser()` to ensure the user is authenticated and get their info (like user ID) in server-side code ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=const%20client%20%3D%20getSupabaseServerClient)).
   - **Database Write:** Use the Supabase server client (`const client = getSupabaseServerClient()`) to perform inserts/updates. In the example, `client.from('tasks').insert({...task, account_id: auth.data.id})` is used to create a new task linked to the user’s account ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=logger.info%28task%2C%20)) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=const%20,await%20client)). Proper error handling and logging are demonstrated (using a logger to log successes/errors) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=const%20,await%20client)).
   - **Revalidation:** After a successful mutation, call Next.js revalidation to update any cached server component data. For instance, `revalidatePath('/home', 'page')` is called to refresh the home page data ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=)) (so the new task appears without a full reload).
   - **Client-side Form:** Create a React component for the form (possibly using the MakerKit UI form components which wrap react-hook-form). The example uses a `TaskForm` component with `react-hook-form` and the Zod schema for client-side validation as well ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=export%20function%20TaskForm%28props%3A%20)) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=const%20form%20%3D%20useForm%28)). When the form is submitted, it calls `await addTaskAction(formData)` to execute the server action, then closes the dialog.
   - **UI Components:** MakerKit includes pre-built form components (`<Form>, <FormField>, <FormLabel>`, etc. from `@kit/ui/form`) to quickly build forms with consistent styling ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=import%20)) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=FormItem%2C)). It likely also includes a modal/dialog component (the example references `NewTaskDialog`) to show the form in a popup.

   By following this pattern – Zod schema, server action, form – you can add any create/update functionality. The MakerKit docs walk through adding a task as a concrete example from defining schema to hooking up the form ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=1)) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=4)).

6. **Other Development Tasks:**
   - **Database Functions & Webhooks:** If your app needs custom Postgres functions or triggers, you can add them to your schema SQL files. MakerKit’s `@kit/database-webhooks` package provides patterns for handling DB triggers (e.g., call a function after an insert to send a notification) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=%28e,js%20specific%20utilities)) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=%2A%20%40kit%2Fdatabase,js%20specific%20utilities)). You can define Postgres **Functions** or use Supabase’s **Edge Functions** (if needed for things like scheduled jobs), though edge functions would be separate from the Next.js app.
   - **RBAC (Roles & Permissions):** MakerKit uses Supabase’s Row-Level Security (RLS) and role-based access control for multi-tenant data. The docs likely have guidance on enabling RLS policies on tables so that, for example, users can only see their own data or their team’s data. Supabase RLS uses the JWT’s `role` or custom claims. MakerKit might provide some default policies or a pattern to follow (e.g., requiring `account_id` field match the user’s account). Always update or add RLS policies when you add new tables to enforce security.
   - **Marketing & Legal Pages:** For completeness, ensure you update the default legal pages (terms/privacy) with your own content. These might be in `apps/web/content` or similar (perhaps managed by Keystatic). Also, if you have an external marketing site, you can integrate sign-up links or use a subdomain for the app vs. website as needed (the *External Marketing Website* doc suggests how to handle using a separate marketing site and linking it to the app login flow).
   - **SEO:** MakerKit likely includes SEO best practices (Next.js 13 uses the `generateMetadata` function as seen in the example to set page titles ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=export%20const%20generateMetadata%20%3D%20async,))). Ensure you update metadata (titles, descriptions, social images) in config or in each page’s `generateMetadata`. The kit might also integrate a sitemap generator or other SEO helpers.
   - **Adding Turborepo Packages/Apps:** If you want to extend the project by adding another app (for example, a separate admin dashboard as its own Next.js app) or a new shared package, MakerKit supports that. You’d create a new folder under `apps/` or `packages/` and use the Turborepo configuration to include it. The documentation includes recipes for adding a new package or app ([How to approach local development | Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/development/approaching-local-development#:~:text=,21)). This could be useful if you are building a companion mobile app with Next.js or an API microservice in the same repo.

In summary, **development with MakerKit** involves configuring your features, evolving the database schema with migrations, adding new pages/routes, and using the provided patterns to fetch and mutate data. The docs emphasize that 90% of your work will be the cycle of *“design schema -> add route -> fetch data -> build form to write data”*, which the kit streamlines ([How to approach local development | Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/development/approaching-local-development#:~:text=Generally%20speaking%2C%20you%20will%20be,doing%20the%20following)) ([How to approach local development | Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/development/approaching-local-development#:~:text=routes,forms%20to%20create%20new%20data)). The remaining 10% are more advanced or custom features that you can build on top of this solid foundation.

## API

MakerKit provides a set of **server-side API utilities** (sometimes called “Services API”) to interact with your application’s data and Supabase. These are not external HTTP APIs, but rather TypeScript modules in the `packages` that you can use within your code (for example, in server actions, route handlers, or server components) to perform common operations. They encapsulate Supabase queries for specific entities, making your code cleaner.

**Available Service APIs:** The main APIs included in the boilerplate cover core SaaS domain entities:
- **Account API (`@kit/accounts`):** Methods to retrieve or manipulate a user’s personal account data ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=A%20quick%20introduction%20to%20the,Account%20API%20in%20Makerkit)) ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=To%20use%20the%20Account%20API%2C,the%20database%20from%20the%20server)). For example:
  - `getAccountWorkspace()` – get the user’s account workspace info (profile, settings). *This is used in layouts to get account context* ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=Get%20the%20account%20workspace%20data)).
  - `loadUserAccounts()` – list all accounts a user belongs to (their personal account plus any teams) ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=Load%20the%20user%20accounts)).
  - `getSubscription(accountId)` – fetch subscription details for a given account (joins the relevant billing tables) ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=Get%20the%20subscription%20data)).
  - `getCustomerId(accountId)` – retrieve the Stripe (or other provider) customer ID for billing for that account ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=Get%20the%20billing%20customer%20ID)).
- **Team Account API (`@kit/team-accounts`):** Similar to Account API, but for organization accounts (teams). Likely includes methods to get team info, list team members, invitations, roles, etc.
- **Authentication API (`@kit/auth`):** Utilities related to authentication flows not covered by Supabase’s own client. Possibly methods to trigger password reset, verify OTP for MFA, etc.
- **User Workspace API:** This might provide an aggregated view of a user’s context – e.g., active account (personal or selected team) and combined data. The naming is a bit unclear, but it could fetch everything needed for a user’s workspace page.
- **Account Workspace API:** Perhaps related to above – could be methods for switching workspace or retrieving data for the currently active account (personal or team).
- **OTP API (`@kit/auth/otp`):** Handles generation and verification of one-time passwords for MFA or other verification (ties into Supabase’s OTP SMS/email or TOTP setup).

Each of these APIs is typically exposed via a factory function like `createXyzApi(supabaseClient)` which returns an object with methods.

**Using the APIs:** To use a service API, import its creation function and supply a **Supabase client**. For example, to use the Account API in a server context ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=To%20use%20the%20Account%20API%2C,the%20database%20from%20the%20server)):

```ts
import { createAccountsApi } from '@kit/accounts/api';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

const client = getSupabaseServerClient();
const accountsApi = createAccountsApi(client);

// Now call methods, e.g.:
const accounts = await accountsApi.loadUserAccounts();
```

In a **Server Component**, you can call this in a data-fetching function or directly inside the component (since it’s async). In a **Server Action**, you would do similarly after `'use server'` ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=If%20you%27re%20in%20a%20Server,Action%20context%2C%20you%27d%20use)). The example above shows retrieving the Supabase server client and constructing the API object ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=import%20,kit%2Faccounts%2Fapi)) ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=import%20,client)). 

Because these API methods run on the server (using the server-side Supabase client), they can safely use the service role if needed (for example, to get data not exposed via RLS to the user’s anon role). MakerKit provides both a normal server client (`getSupabaseServerClient()`) which operates under the user’s session (honoring RLS with the user’s JWT) and an **admin client** (`getSupabaseServerAdminClient()`) which uses the service role key for elevated permissions ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=To%20use%20the%20Server%20Admin%2C,function)) ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=The%20,function)). The admin client should be used *sparingly* and only in secure server code where you need to bypass RLS (for example, in the admin panel) ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=The%20,function)). In most cases, the regular server client is used so that RLS and user permissions apply as normal.

**Example – Account API:** Once you have `accountsApi`, you could call `await accountsApi.getSubscription(accountId)` to get the subscription and subscription_items for a user’s account ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=Get%20the%20subscription%20data)), or `accountsApi.getCustomerId(accountId)` to get their Stripe customer ID ([Account API | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/api/account-api#:~:text=Get%20the%20billing%20customer%20ID)). The Account API aggregates calls to the `profiles`, `subscriptions`, etc., so you don’t have to write those queries each time.

**Why use Service APIs?** These APIs encapsulate common database interactions, following DRY principles. For instance, multiple parts of the app might need to load a user’s accounts (for switching context) – having a single `loadUserAccounts()` method ensures consistent behavior. They also abstract the underlying database details; if the schema changes, you can update these API functions rather than find & replace raw queries throughout your code.

**Building Custom APIs:** You can create your own service APIs for new features. For example, if you add a `projects` module, you might create `createProjectsApi(client)` with methods like `getProject(projectId)`, `listProjects(accountId)`, etc. Following MakerKit’s pattern, you’d place it in a package (e.g., `packages/projects/api.ts`) and use it similarly.

**API Route Handlers (External API):** Although the “API” section in docs is mainly about internal service APIs, MakerKit also supports creating external API endpoints (using Next.js Route Handlers in the App Router). You might do this to expose some functionality to external clients or webhooks. Route handlers live in the Next.js app under `app/api/`. MakerKit encourages using **Server Actions for internal use** over route handlers, but when you need a route (e.g., a webhook endpoint from Stripe, or an embed script endpoint), you can use Next.js route files.

To simplify writing route handlers, MakerKit provides an `enhanceRouteHandler` utility similar to `enhanceAction`:
```ts
import { enhanceRouteHandler } from '@kit/next/routes';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const RequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const POST = enhanceRouteHandler(
  async ({ body, user, request }) => {
    // "body" is validated against RequestSchema
    // "user" is the authenticated user (if required)
    // ... perform the action (e.g., create a resource)
    return NextResponse.json({ success: true });
  },
  { schema: RequestSchema, captcha: true }
);
```
This example defines a POST route that expects an email and password in the JSON body, ensures the user is authenticated, and optionally checks a CAPTCHA token ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=API%20Route%20handlers%20are%20added,DELETE)) ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=export%20const%20POST%20%3D%20enhanceRouteHandler)). The `enhanceRouteHandler` options support the same `schema` validation and `captcha` protection (and implicitly user auth check) that enhanceAction does ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=Using%20the%20enhanceRouteHandler%20utility)) ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=If%20you%20want%20to%20protect,true)). When you call this API from a frontend (via `fetch`), you’d include the `captchaToken` and a CSRF token if required (see below).

MakerKit’s route handler utility handles some boilerplate:
- It attaches the Supabase auth context so `user` is available (if the request includes the user’s session cookie or auth header).
- It validates the request body against the Zod schema, so you can assume `body` is correct type.
- It can enforce that a CAPTCHA was solved by validating the token server-side.
- It likely also integrates CSRF protection for non-`/api` routes.

**CSRF Protection:** For security, MakerKit has CSRF tokens in place for mutating requests made from pages outside the Next.js `/api` folder ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=When%20calling%20the%20API%20route,This%20is%20required%20if)). If you define a custom route under (say) `/app/account/route.ts` (which is outside `/api` namespace), by default MakerKit’s middleware might block unsafe methods without a valid CSRF token. The docs indicate:
- Routes inside `/api/*` are considered external and are not CSRF-protected (they’re meant for external use or are public APIs) ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=2,folder)).
- Routes outside `/api` (like an action route co-located with pages) require a CSRF token for POST, PUT, DELETE requests ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=When%20calling%20the%20API%20route,This%20is%20required%20if)).
- MakerKit provides a hook `useCsrfToken()` to retrieve the current CSRF token in a form, so you can include it with the request ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=import%20,kit%2Fauth%2Fcaptcha%2Fclient)).
- When using `enhanceAction` or `enhanceRouteHandler`, I suspect the CSRF check is automatically handled if `captcha` or other flags are enabled. But explicitly, the docs show how to get `const csrfToken = useCsrfToken();` and include it in a fetch or action call alongside the captcha token ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=const%20captchaToken%20%3D%20useCaptchaToken)) ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=%7D%29%20%3D)).

**Captcha Protection:** MakerKit integrates optional CAPTCHA (likely hCaptcha or reCAPTCHA) to prevent spam submissions on critical actions (signup, contact forms, etc.). As shown:
- Use the `useCaptchaToken()` hook in your form component to get a `captchaToken` ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=The%20captcha%20token%20can%20be,kit%2Fauth%2Fcaptcha%2Fclient)).
- Pass `captcha: true` in `enhanceAction` or `enhanceRouteHandler` options to enforce that the token is present and valid ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=If%20you%20want%20to%20protect,true)) ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=)).
- Include the `captchaToken` in the action call or fetch request body when invoking the server action/route ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=Now%2C%20when%20calling%20the%20server,we%20can%20pass%20the%20captcha)) ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=schema%3A%20ZodSchema%2C)).
- The enhance utilities will verify the token server-side (likely by calling the CAPTCHA provider’s verify API using a secret key stored in env).

By using these built-in protections, your forms and API endpoints are more secure against CSRF and bot abuse without a lot of custom code.

In essence, the **API layer of MakerKit** provides two things:
1. **Internal API Helpers** – convenient functions to interact with your data (Accounts, Teams, etc.) on the server side, promoting code reuse.
2. **Utilities for building new APIs** – patterns and helpers (enhancers, hooks) to create your own server actions and route handlers safely and efficiently, with best practices (validation, auth, security) baked in.

## Data Fetching

Data fetching in MakerKit leverages Next.js App Router features and Supabase’s capabilities to handle different scenarios, whether it’s server-rendered data, client-side state, or real-time updates ([Data Fetching in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching#:~:text=Makerkit%20provides%20a%20robust%20approach,data%20fetching%20clean%20and%20efficient)) ([Data Fetching in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching#:~:text=,Captcha%20protection%20for%20API%20Routes)). The framework distinguishes between **server-side data fetching** (for initial page loads and secure data) and **client-side data management** (for interactivity or caching beyond initial load). MakerKit’s approach includes:

- **Supabase Client Management:** Understanding which Supabase client to use depending on environment (browser vs server).
- **Server Components Data Fetching:** Using async server components or helper utilities to load data on the server for page rendering.
- **Server Actions:** Using Next.js Server Actions for mutations and to revalidate data (discussed earlier in Development).
- **Route Handlers:** Creating API endpoints when needed (discussed in API).
- **React Query (TanStack Query):** For client-side data fetching/caching of less critical or highly interactive data.
- **Real-time Updates:** Supabase subscriptions can be used for real-time feeds (though not heavily covered in docs, Supabase supports LISTEN/NOTIFY via its client).
- **CSRF & Captcha:** Ensuring secure data submissions.

### Supabase Clients (Browser vs Server)

MakerKit uses Supabase for all database and auth needs, and it provides separate clients for browser and server:
- **Browser Client:** In React components on the client (if needed), use the `useSupabase()` hook to get the Supabase client tied to the user’s session ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=Using%20the%20Supabase%20client%20in,the%20browser)) ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=import%20,supabase)). This client uses the anon public key and user’s JWT (via cookies) to make authenticated requests. Example:
  ```js
  import { useSupabase } from '@kit/supabase/hooks/use-supabase';
  function MyComponent() {
    const supabase = useSupabase();
    // e.g., supabase.from('table').select(...) on client (rare, mostly use server)
  }
  ```
  Typically, you might not need to query directly from the client often because of server components, but it's available (e.g., for using Supabase’s client-side auth functions or real-time subscriptions).
- **Server Client:** On the server (in server components, actions, route handlers), use `getSupabaseServerClient()` to obtain a server-side Supabase client ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=import%20,client)). This client can read the user's session from cookies and perform queries with that context. Use it whenever fetching data in server code; for example:
  ```ts
  const client = getSupabaseServerClient();
  const { data, error } = await client.from('my_table').select('*').eq('account_id', userId);
  ```
- **Admin Client:** In special cases, MakerKit provides `getSupabaseServerAdminClient()` which uses the service role key (full DB permissions) ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=To%20use%20the%20Server%20Admin%2C,function)). This should **only be used in secure backend code** where you need to bypass normal RLS rules (e.g., in a backend cron job or an admin-only API) ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=The%20,function)). Always be cautious and implement your own checks if using the admin client, since it can read/write any data.

MakerKit ensures that in all these clients, the Supabase JWT (user session) is properly forwarded. The difference is primarily in privileges (admin vs normal) and environment (browser uses local storage/cookies vs server uses env keys).

Older versions of MakerKit had multiple clients depending on context (Server Actions vs Route vs Component) but v2 unifies this with the single `getSupabaseServerClient()` for all server contexts ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=Depending%20on%20where%20your%20code,js%20application)) ([Supabase Clients in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/supabase-clients#:~:text=1.%20Browser%20,with%20Supabase%20from%20the%20server)). So you don’t need to worry about which server context you’re in – use the one function anywhere on the server.

### Data Loading in Server Components

Next.js App Router allows server components to fetch data during rendering. MakerKit leverages this for initial page loads and SEO-friendly content:
- You can write an async server component that calls Supabase (via the server client or a service API). Because the component runs on the server, it can safely use secrets and full DB access.
- MakerKit’s **`ServerDataLoader`** (from `@makerkit/data-loader-supabase-nextjs`) is a utility component that abstracts common patterns ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=Now%20that%20our%20database%20supports,data%20from%20the%20Supabase%20database)). It likely handles fetching data and returning a React Node (or Render Props) with the result. The example in docs uses it to load tasks with pagination ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=)) ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=where%3D)).
- Usage pattern:
  ```jsx
  <ServerDataLoader
    client={client}
    table="tasks"
    page={page}
    where={{ account_id: { eq: user.id } }}
  >
    {tasks => tasks ? <TasksTable data={tasks} /> : <EmptyState />}
  </ServerDataLoader>
  ```
  (The actual syntax might differ, but conceptually, it fetches and then renders children with the data.)
- **Pagination & Filtering:** The data loader likely supports passing `page` (page number) and constructs range queries using Supabase’s `range` or `limit/offset`. It also supports filter conditions via a simple object (mapped to SQL operators) as shown with `textSearch` for a full-text search on title ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=where%3D)).
- For more complex queries (joins or multi-step fetches), you can always bypass the data loader and call your service APIs or Supabase directly inside `async` functions that you then `use()` (using React’s experimental `use()` utility as seen at line 96 of the snippet, which might allow handling promises in JSX) ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=import%20,react)).
- **Real-time:** If you need real-time updates (like live updating lists), Supabase’s client can subscribe to changes (using `supabase.channel` with PostgreSQL changes). You would likely integrate that on the client side (within a client component) or possibly via server-sent events. This isn’t explicitly covered in the summary docs, but Supabase makes it possible.

### Client-side Data & React Query

MakerKit includes **React Query** for client-side state management and data fetching ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=1,for%20edge%20runtimes)) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=match%20at%20L82%204,for%20edge%20runtimes)). In Next.js App Router, you will mostly fetch data in server components, but React Query can still be useful:
- For data that changes after initial load due to user interaction without navigation (e.g., infinite scroll, or updating local state optimistically).
- For caching responses of external APIs or less critical data that you choose to load on the client side.

MakerKit likely sets up React Query provider in the app (maybe in `providers` or as part of dev tools). You can define React Query hooks to fetch data from either your Next.js API routes or directly from Supabase (using the anon key).

Example use case: a search-as-you-type feature might use React Query to fetch suggestions from an API endpoint as the user types, instead of a server component for each keystroke.

If your page uses a mix of server-rendered and client-fetched data, be mindful of consistency. Usually, rely on server components for primary data and use client fetch (with React Query) for secondary interactive features.

### Server Actions (for Mutations)

Server Actions were discussed in the Development section. To reiterate key points in context of data fetching:
- They are essentially an easier alternative to API routes for handling form submissions or any client-to-server invocation, *without* manually creating an API endpoint.
- They integrate with React’s streaming and cache invalidation. MakerKit uses `enhanceAction` to automatically call `revalidatePath` or similar when needed so that your UI reflects changes ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=)).
- By writing server actions, you offload data writes to the server and then fetch updated data via server components – this keeps the data flow predictable (source of truth on server).
- The `enhanceAction` utility in MakerKit adds improvements:
  - It automatically checks if the user is logged in (preventing unauthorized actions) ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=This%20utility%20helps%20us%20with,three%20main%20things)).
  - Validates input with Zod schema before running your logic ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=1,exception%20to%20the%20monitoring%20provider)).
  - Validates CAPTCHA if enabled ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=Using%20a%20Captcha%20token%20protection)).
  - Reports exceptions to monitoring if configured ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=This%20utility%20helps%20us%20with,three%20main%20things)).
  
  Using `enhanceAction`, your server action might look like:
  ```ts
  'use server';
  import { enhanceAction } from '@kit/next/actions';
  import { z } from 'zod';
  const Schema = z.object({ title: z.string() });
  export const addProject = enhanceAction(
    async (data, user) => {
      // data is validated, user is authenticated
      const client = getSupabaseServerClient();
      await client.from('projects').insert({ title: data.title, account_id: user.id });
      return { success: true };
    },
    { schema: Schema }
  );
  ```
  This example would insert a project and automatically ensure only logged-in users can call it and that `title` is provided and a string.

- On the client, you call `addProject({ title })` directly (as if it were a function) and it executes on the server.

Server Actions and `enhanceAction` help maintain a clear separation: **server for data mutation, client for UI**. They reduce the need for Redux or heavy state management on the client for form handling.

### API Route Handlers (for Data Fetching)

For cases where you need to expose an API (for third-party clients or webhooks), use Next.js Route Handlers as covered in the API section. They allow full control over request/response and can be used to fetch or mutate data from external calls.

If you create route handlers that fetch data (GET requests), you might use them to implement a REST API for your app. But note, these will still typically interact with the same Supabase and service APIs under the hood.

MakerKit’s documentation encourages using route handlers sparingly (only when needed externally), and favoring server components/actions for in-app data needs ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=Using%20the%20enhanceRouteHandler%20utility)). This reduces the amount of code and duplication.

### Security: CSRF & Captcha Recap

Any data fetching or mutation that involves forms or external calls should consider security:
- **CSRF**: When using fetch from your front-end to a route handler outside `/api`, include the CSRF token (from `useCsrfToken()`) in the request headers or body as expected by the server ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=Passing%20the%20CSRF%20Token%20to,API%20Routes)) ([Using API Route Handlers in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/route-handlers#:~:text=import%20,kit%2Fauth%2Fcaptcha%2Fclient)). MakerKit likely expects the token in a header or JSON field; check the docs for the exact implementation.
- **Captcha**: To prevent spam, utilize `useCaptchaToken()` on forms and ensure your server actions/routes require it for sensitive operations (signups, etc.) ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=Using%20a%20Captcha%20token%20protection)) ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=The%20captcha%20token%20can%20be,kit%2Fauth%2Fcaptcha%2Fclient)). The backend will verify it – your job is to pass the token correctly.

### Summary of Data Fetching Patterns

- **Page Load (SSR)**: Use server components (and MakerKit data loaders/service APIs) to fetch everything needed to render the page HTML. This ensures fast load and SEO.
- **After Load (CSR)**: Use React Query or Supabase client for any dynamic fetching after initial load (if needed), or to subscribe to changes.
- **Mutations**: Use Server Actions enhanced with MakerKit utilities for any create/update/delete. This gives you instant access to updated data by reusing server component queries (thanks to revalidation).
- **External Access**: Use Route Handlers for webhooks or public APIs, with `enhanceRouteHandler` for similar benefits as actions.
- **Preventing Issues**: Make use of provided CSRF and Captcha hooks to secure endpoints. MakerKit’s approach ensures even if you expose an endpoint, only authorized and human requests do the sensitive things.

With these patterns, MakerKit achieves **clean and efficient data fetching** in a full-stack app ([Data Fetching in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/data-fetching#:~:text=Makerkit%20provides%20a%20robust%20approach,data%20fetching%20clean%20and%20efficient)). You get the benefits of Next.js streaming and caching, Supabase’s real-time and RLS features, and a structured approach that separates concerns (UI vs data vs backend logic). Whether loading data for a dashboard, updating a record via a form, or exposing an API for a JS widget, the documentation’s guidance helps implement it in a robust way.

## Billing

The **Billing** section of MakerKit covers how to integrate and configure a subscription billing system for your SaaS. MakerKit supports Stripe out-of-the-box and also provides an abstraction (Billing Schema) to allow other providers like Lemon Squeezy to be used with minimal changes ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=The%20Makerkit%20Billing%20schema%20is,products%2C%20plans%2C%20and%20pricing%20models)) ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=A%20billing%20schema%20in%20Makerkit,It%27s%20designed%20to%20be)).

**Billing Schema:** At the heart of MakerKit’s billing integration is a **declarative billing schema** defined (likely in `billing.config.ts` or a separate file) using Zod for validation ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=The%20Makerkit%20Billing%20schema%20is,products%2C%20plans%2C%20and%20pricing%20models)). This schema describes your products, plans, and pricing:
- It is **provider-agnostic** – you describe plans once, and the schema can work for Stripe, Lemon Squeezy, etc. by mapping to those services' products ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=A%20billing%20schema%20in%20Makerkit,It%27s%20designed%20to%20be)).
- It supports various pricing models: free plans, flat monthly/yearly subscriptions, metered usage, and **per-seat pricing** ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=1,seat%20cost%2C%20etc)) ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=,Per%20Seat%20Billing)).
- Example components in the schema:
  - **Provider:** e.g. `"stripe"` or `"lemon_squeezy"`.
  - **Products:** high-level offerings (e.g. "Basic", "Pro").
  - **Plans:** specific plans for each product (e.g. "Basic Monthly", "Basic Yearly", with prices).
  - **Items:** line items or features of plans (e.g. number of users included, price per extra user if per-seat, etc.) ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=A%20billing%20schema%20typically%20consists,of%20the%20following%20components)).

The schema is validated at startup to ensure no misconfiguration (like missing prices or invalid combinations) ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=plans%2C%20and%20pricing%20models)).

**Using the Schema in the App:** MakerKit uses the billing schema to drive the UI:
- Pricing pages and plan selectors in the app are generated based on the schema ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=How%20Makerkit%20uses%20the%20billing,schema)). This means if you update pricing or add a plan, the frontend automatically reflects it.
- Internally, when a user subscribes or changes plans, the app refers to this schema to know what options exist and perhaps to enforce any limits.

However, **actual payment processing is handled by the provider**:
- For example, MakerKit might provide a checkout component that redirects to Stripe Checkout or opens a Stripe Elements form, using the product IDs from the schema. Once the payment is done, webhooks from Stripe inform the app (via Supabase functions or Next.js route handlers) to update the user’s subscription status.
- Metered billing: If you mark a plan item as metered or per-seat, MakerKit will display it accordingly, but Stripe is responsible for metering usage. MakerKit provides the hooks to update Stripe about usage or to adjust quantities (like user count) automatically ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=However%2C%20it%27s%20worth%20mentioning%20that,Stripe%20dashboard)) ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=the%20actual%20billing%20logic%20will,handled%20by%20the%20payment%20provider)). For per-seat, MakerKit automatically updates the subscription quantity in Stripe when team members are added or removed (since it knows to tie quantity to number of users) ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=the%20actual%20billing%20logic%20will,handled%20by%20the%20payment%20provider)).

**Configuring Stripe:** To use Stripe:
- Set your Stripe Secret Key and Public Key in env variables.
- Possibly run the Stripe dev server (the docs mentioned an optional step to start Stripe locally, perhaps meaning using the Stripe CLI to forward webhooks).
- MakerKit’s `@kit/stripe` package handles interacting with Stripe’s API (e.g., creating customers for new accounts, syncing subscription status) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,abstracts%20the%20Lemon%20Squeezy%20API)).
- The boilerplate likely includes a Stripe webhook handler (maybe at `/api/webhooks/stripe`) that listens for events like `checkout.session.completed` or `invoice.paid` and then updates Supabase (the `subscriptions` table, etc.).

**Configuring Lemon Squeezy:** Similarly, to use Lemon Squeezy, provide those API keys and the kit’s `@kit/lemon-squeezy` will abstract its API ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,abstracts%20the%20Lemon%20Squeezy%20API)). The billing schema remains the same structure; only the gateway implementation differs.

**Personal vs Team Billing:** MakerKit supports both personal account subscriptions and team account subscriptions:
- **Personal Account Billing:** Each user’s personal account can have a subscription (often for individual plans).
- **Organization Billing:** Team accounts can have a subscription that covers all members (usually for business plans). MakerKit handles linking subscriptions to either the personal account or the team (likely via an `account_id` field on subscription records, which could point to either a personal account or a team account).
- The UI will show billing settings in both personal and team settings pages accordingly.

**Upgrading/Downgrading & Trials:** The kit probably includes flows for upgrading/downgrading plans (with proration handled by Stripe) and may support trial periods (Stripe handles trial logic, but the schema could include a trial duration, which the UI might show).

**Payment Settings in App:** The billing UI (maybe at `/account/billing` route) will allow:
- Entering payment info (or redirecting to Stripe’s hosted billing portal).
- Viewing current plan, usage (if metered, e.g., seats in use out of allowed).
- Changing plans (calls Stripe to create a new Checkout or updates subscription).

**Quota Enforcement:** MakerKit likely relies on your code plus maybe RLS policies to enforce limits (e.g., if the free plan allows 1 project, the UI should prevent creating more if on free; or a nightly job could deactivate over-limit usage). The kit might not enforce quotas out of the box beyond UI hints, but it gives you the hooks (the billing schema could define limits per plan which you can check in your business logic).

In conclusion, the **Billing integration** in MakerKit is designed to be **flexible and provider-neutral**. By editing the billing schema config, you define your pricing structure in one place ([Payments and Billing in Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/payments-billing#:~:text=A%20billing%20schema%20in%20Makerkit,It%27s%20designed%20to%20be)). With the Stripe (or other) integration packages enabled, the kit takes care of creating customers, handling webhooks, and exposing plan info to the app. This allows you to focus on deciding what plans to offer and how to market them, rather than writing a lot of billing code.

## Content

MakerKit provides a content management solution for marketing pages, documentation, or other CMS needs of your SaaS. As mentioned, it supports **Keystatic** (a Git-based CMS) by default and also a **WordPress** integration as an alternative ([Customization in Next.js Supabase Turbo](https://makerkit.dev/docs/next-supabase-turbo/customization#:~:text=Content%20Management)).

**Keystatic (Git-based CMS):** Keystatic is a content management tool where content (markdown, JSON, etc.) lives in your repository and non-developers can edit it via a user-friendly interface which generates pull requests. In MakerKit:
- You likely have a `content` directory (or similar) where markdown files for pages (like Home page text, About, FAQs, blog posts, etc.) reside.
- Keystatic config (if present, perhaps under `apps/web/keystatic.config.ts`) defines which content can be edited. For example, a collection for blog posts with fields like title, body; singleton entries for things like the About page.
- When running locally or on a special admin URL, authorized users could edit content via Keystatic UI, and those changes go through Git.
- This approach keeps content version-controlled and is great for documentation or any text that doesn’t change per user.

**WordPress (Headless CMS):** If enabled:
- MakerKit’s `@kit/wordpress` package would fetch content from a WordPress instance via REST or GraphQL.
- You might configure WordPress endpoints/credentials in env variables.
- This is useful if you prefer a traditional CMS editorial workflow for marketing site or blog, while still having the main app in Next.js.

**Usage in Next.js:** Regardless of CMS, MakerKit likely uses static generation or server-side fetching for content pages:
- A marketing homepage could be a Next.js page that pulls content from Keystatic files at build time or uses getServerSideProps (if in pages directory) / or a server component reading the content file.
- If WordPress, the page would fetch from WP API on server side and render.

**Docs and Help Pages:** If your SaaS includes a docs portal or help center, you can use these CMS features to manage those pages. MakerKit being a starter, might not include a full docs site, but the content support is there to build one.

**Customization:** You decide which route uses which CMS:
- Example: Use Keystatic for “legal” pages (since they rarely change and PR workflow is fine) – so Terms and Privacy MD files in the repo.
- Use WordPress for a blog – so non-devs can publish posts frequently.

**Toggle CMS:** The `@kit/cms` package likely decides which backend to use based on config (maybe an env like `CMS_PROVIDER=keystatic` or `wordpress`). The packages `@kit/keystatic` and `@kit/wordpress` each implement the CMS interface ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=The%20CMSs%20that%20can%20be,added%20to%20the%20application)). You’d include one of them.

In summary, **Content management** in MakerKit is flexible. By default, you can manage content in Git (which is simple and free). If needed, you can integrate a full CMS. Either way, content is treated as data that can be fetched and rendered in your Next.js pages, keeping a separation between application logic and marketing content.

## UI Components

MakerKit comes with a rich library of **UI components** to help you build the frontend quickly and consistently. These components, provided in the `@kit/ui` package, are built on **Shadcn UI** (a set of accessible, themeable components using Radix UI under the hood) and tailored for SaaS needs ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=1,for%20edge%20runtimes)) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,and%20logic%20for%20managing%20subscriptions)).

Some categories of UI components included:
- **Forms:** Form layout components (`Form`, `FormField`, `FormLabel`, `FormControl`, `FormMessage`, etc.) for building forms with validation feedback easily ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=import%20)) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=FormItem%2C)). These integrate with React Hook Form and Zod for seamless client-side validation.
- **Inputs:** Various input components such as text `Input`, `Textarea`, select dropdowns, checkboxes, radio buttons, toggles, etc., styled consistently with the theme ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=)).
- **Buttons:** A primary `Button` component (and possibly variants like `SecondaryButton`, icon buttons) for all clickable actions ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=import%20,nextjs)).
- **Modals/Dialogs:** A `Dialog` component to show pop-up modals (like the New Task form example). Likely includes headless state management tied to Radix Dialog.
- **Layout:** Components for page layout such as `PageHeader`, `PageBody` wrappers, a `Sidebar` navigation component, `Navbar` for top bar, etc.
- **Feedback/Display:** Components like `Alert`, `Toast` (possibly integrated with a notifications system), `Spinner` or loading indicator, `If` conditional render helper ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=import%20,kit%2Fui%2Fheading)), etc.
- **Typography:** Components like `Heading` for different levels, `Text`/`Paragraph`, and `<Trans>` for translated text as seen in code (the `<Trans>` component wraps i18n translation strings) ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=)).
- **Tables and Lists:** Possibly a `Table` component for listing data (or usage of Headless UI for tables).
- **Icons:** The kit uses **Lucide icons** (an open-source icon library) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=3,for%20edge%20runtimes)). Likely there’s an `Icon` component to render Lucide icons easily (or you import icons from Lucide package directly).
- **Notifications UI:** If notifications feature is enabled, there might be a bell icon component and a dropdown/list to show notifications.
- **Avatar/User Image:** Components to display user profile pictures or initials.

These components are themeable via the CSS custom properties (so when you update the Shadcn theme, they all update).

**Adding New Components:** If you need a component not provided, MakerKit is set up to easily integrate new Shadcn UI components:
- The docs mention an **“Adding Shadcn UI components”** guide ([Updating the Shadcn theme in your Makerkit Application | Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/customization/theme#:~:text=,Layout%20Style)). Typically, you would run a CLI from shadcn (or copy from their site) to add, say, a calendar or date picker, into your project’s components, then integrate it with the kit’s styling.
- All components reside in the `packages/ui` directory, so new components should be added there to be accessible across the monorepo.

**Usage:** Using the UI kit is straightforward – import from `@kit/ui`:
```tsx
import { Button, Input, Form, FormField, FormLabel, FormControl } from '@kit/ui';

// in JSX
<Form onSubmit={...}>
  <FormField name="email">
    <FormLabel>Email</FormLabel>
    <FormControl><Input type="email" {...register('email')} /></FormControl>
    <FormMessage /> 
  </FormField>
  <Button type="submit">Submit</Button>
</Form>
```
This would render a styled form. All kit UI components are built to work well together and handle accessibility (e.g., FormLabel ties to Input via ARIA, etc.).

By providing a consistent set of components, MakerKit ensures a unified look and feel. It also speeds development since you don’t have to assemble basic UI elements from scratch. If you follow the docs and use these components, your app will maintain design consistency and save you maintenance effort (especially when updating theme or styles globally).

## Notifications

The **Notifications** feature in MakerKit likely refers to an in-app notification system where users can receive and view notifications (e.g., alerts about activity in their account). This could include:
- **Email Notifications:** For important events (though those are covered in the Emails section, here it’s probably about UI notifications).
- **In-App Notification Center:** A UI in the app (often an icon in the navbar) where a user sees notifications (like “You have a new message” or “Your subscription is about to expire”). MakerKit’s `@kit/notifications` package manages the schema and logic for notifications ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,and%20logic%20for%20managing%20notifications)).

**Schema & Storage:** Notifications might be stored in a `notifications` table in the database (with fields like account_id, title, body, read_at, etc.). The notifications package would define this schema and possibly a Supabase function or trigger to insert notifications on certain events.

**Generating Notifications:** Notifications can be generated by:
- Backend events: e.g., a database webhook (via `@kit/database-webhooks`) after someone creates a resource could insert a notification for related users.
- System events: e.g., subscription about to end could generate a notification.
- Admin: admin might send notifications to users (if such feature exists).

**Notification Delivery:** If the notifications are important, MakerKit might also send them via email (duplicating the message). But in-app, the user would see a bell icon with a badge count of unread notifications.

**UI and Usage:** The notification UI might include:
- A bell icon in the header that lights up or shows a count when there are unread notifications.
- A dropdown or page listing notifications. Possibly a `Mark as read` button or auto-mark on clicking one.
- The Notification items could contain a message and maybe a link (e.g., click it to navigate to the relevant item/page).

**Real-time:** Supabase’s real-time can be used to live update notifications. If the `notifications` table has realtime enabled, a user could get a push update when a new notification row appears (via the browser Supabase client subscription). MakerKit might have integrated that, meaning notifications could appear without a refresh if, say, another user triggers one.

**Configuration:** There might be a feature flag to enable/disable notifications globally (perhaps if your app doesn’t need it, you turn it off in feature flags).

Since notifications involve both the UI component and possibly email or device push, MakerKit focuses on the infrastructure:
- Provides the DB and API to create and fetch notifications.
- Leaves it to you to decide when to create them (some default ones may be in place, like welcome notification for new user).

As part of customization, you can define what triggers notifications. For example, you might integrate an external service or just have server actions insert into `notifications` table whenever a notable event occurs.

In summary, the Notifications module gives your app a built-in way to communicate events to users on the platform, improving engagement and awareness. It’s integrated with the user accounts (likely separate notifications per personal account or team account) and can be extended or disabled as needed.

## Translations

MakerKit is internationalization-ready, allowing you to support multiple languages in your SaaS. The `@kit/i18n` package provides translation utilities and likely uses **i18next** or a similar library under the hood ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,logic%20for%20managing%20payment%20gateways)).

**i18n Setup:** The kit probably uses JSON resource files for translations, organized by namespace (e.g., `common.json`, `auth.json`, `emails.json`, etc.) and by locale. There might be a default `en` (English) translation provided for all interface strings.

**Usage in Code:** We saw usage of a `<Trans>` component in the code examples ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=)). This suggests:
- They might be using react-i18next, where `<Trans i18nKey="common:homeTabLabel" />` will look up a key in the translation files.
- Alternatively, they have a custom `Trans` component that wraps i18n translations for use in JSX.

Also, `createI18nServerInstance()` was called in a server component to generate translations on the server for metadata ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=export%20const%20generateMetadata%20%3D%20async,)), indicating server-side translation capability for things like page titles (Next.js requires any dynamic text in `generateMetadata` to be resolved on server).

**Adding Languages:** To add a new language, you’d:
- Create a folder for that locale (e.g., `public/locales/es/` if using i18next file structure) and provide translations for each namespace JSON.
- Update a config (maybe in `app.config.ts` or i18n config) to list the supported locales (so that Next.js knows to offer them).
- The kit might include language switcher UI by default (or at least an example on how to switch locale, possibly via a dropdown that sets a cookie or part of the URL).

**Default Language:** Probably English is default. The config might have `defaultLocale: 'en'`.

**Translation Keys:** All user-facing text in the UI components and pages is likely keyed. For example, `common:login` might correspond to "Login", etc., in English file. The presence of keys like `'tasks:tasksTabLabel'` and `'common:homeTabDescription'` in code ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=)) ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=title%3D%7B)) shows that texts are not hard-coded.

**Server/Client Rendering:** Next.js 13 can handle multilingual routes if configured (either with subpaths or domain). MakerKit might not set up complicated routing for i18n, but it allows dynamic switching. The `withI18n` or similar HOC may be used for wrapping components with translations loaded ([Learn how to load data from the Supabase database](https://makerkit.dev/docs/next-supabase-turbo/development/loading-data-from-database#:~:text=import%20,server)).

**Translations of Emails:** The Emails system (below) likely also leverages i18n for templates. There may be keys for email subject lines, body content in different languages.

**Community Contributions:** If MakerKit has a community, translations for common languages might be contributed. Always check if there are already translation files for languages you need.

In summary, the translations support in MakerKit means your SaaS can be multilingual with relatively low effort: just supply the text in other languages. The structure and tools to toggle languages and load appropriate messages are already integrated.

## Emails

Email functionality in MakerKit covers sending system emails to users for various events (welcome emails, password resets, notifications, etc.) as well as the ability to customize email templates.

Key points:
- MakerKit includes **email templates** in the `@kit/email-templates` package ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=subscriptions%20%2A%20%40kit%2Fbilling,Sentry)), built with **React Email (react.email)**. This means email contents are defined as React components which get rendered to HTML for the actual email.
- **Nodemailer** is used for sending emails via SMTP, and **Resend** (an email sending service) is also supported for edge runtime compatibility ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=3,for%20edge%20runtimes)). Essentially, you can choose to send emails through SMTP (e.g., using Gmail, SendGrid, Mailgun) or via an API like Resend. The `@kit/mailers` package abstracts these providers ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=react.email%20package.%20,and%20logic%20for%20managing%20content)).

**Out-of-the-box Emails:** Typically, a SaaS kit will provide templates for:
- **Verification Email:** when a new user signs up (if email confirmation is required) – containing a Supabase magic link or OTP code.
- **Password Reset Email:** sent when user requests a password reset.
- **Invitation Email:** if team accounts exist, inviting a user to join a team.
- **Notification Emails:** possibly for certain notifications (like “You have a new message” or usage alerts).
- **Welcome/Onboarding Email:** a greeting when a user first signs up (nice to have).
- **Receipts or Billing Emails:** possibly outside scope (Stripe can handle receipts), but MakerKit might send an email when a subscription is about to expire or failed payment (or that could be Stripe’s job).

**Template Customization:** The email templates are React components (using JSX to compose the email layout, styles inlined via react.email).
- They likely reside in the codebase (perhaps in `packages/email-templates/templates/` directory).
- You can edit these to change wording, branding (logo in email, colors).
- Because they use translation keys, you can also simply adjust text via the i18n files if it’s internationalized.

**Email Configuration:** In env or config you’ll specify:
- SMTP server settings (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc.) if using Nodemailer SMTP.
- Or Resend API key if using Resend.
- `EMAIL_FROM` address that all emails come from (e.g., no-reply@yourapp.com).
- The kit likely falls back to a development email catcher (like **Mailpit** which we saw running on localhost for dev) so that in dev you don’t accidentally send real emails – it was capturing sign-up emails in the local environment ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=,testingpassword)).

**Triggering Emails:** MakerKit ties into Supabase Auth for certain triggers:
- Supabase can send its own emails for magic links and resets if configured, but given MakerKit has custom templates, it might intercept those flows and send via its system for more control.
- For instance, upon user sign-up, a server action or webhook could send the welcome email using the template and mailer.
- Invitations: likely when an invite is created, MakerKit calls the mailer to send an invitation email with an accept link.

**Testing Emails:** In dev, use the Mailpit UI (Inbucket) to see the emails that were “sent” ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=,testingpassword)). In staging/production, those would actually go out via the configured provider.

**Edge Runtime Consideration:** If deploying to Vercel Edge or Cloudflare Workers, you cannot use Node libraries like Nodemailer (they rely on Node.js API). That’s why MakerKit mentions Resend (which works via HTTP calls) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=3,for%20edge%20runtimes)). So if you deploy entirely on edge, you’d set `USE_RESEND` (for example) and the mailer will use Resend’s REST API to send emails, which is edge-compatible.

**Deliverability:** It’s up to you to configure DNS (SPF, DKIM) for your sending domain when going live, to ensure emails don’t land in spam. MakerKit likely has notes on that in "Going to Production".

In summary, the **Emails** system is well-integrated: you have professionally designed templates that you can tweak, multi-language support if needed, and flexible sending options. It covers all the typical user email communications for a SaaS and lets you extend for any custom emails you might need to send.

## Monitoring

Monitoring and error tracking are important for a production SaaS, and MakerKit includes provisions for this via the `@kit/monitoring` package ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=%28e,js%20specific%20utilities)). 

**Error Tracking:** MakerKit likely integrates with providers like **Sentry** or others:
- Sentry DSN could be an env variable; if provided, the kit initializes Sentry in both frontend and backend.
- The `enhanceAction` utility already hints at sending caught exceptions to a monitoring provider ([Using Server Actions in the Next.js Supabase SaaS Kit](https://makerkit.dev/docs/next-supabase-turbo/data-fetching/server-actions#:~:text=1,exception%20to%20the%20monitoring%20provider)). So if an error occurs in a server action, it might automatically report it (as long as monitoring is configured).
- The monitoring package probably wraps Sentry (or a chosen service) in a unified way. Perhaps also supporting alternative like LogRocket or simple logging.

**Performance Monitoring:** It might capture performance metrics (web vitals, response times). Sentry also offers performance monitoring, which could be enabled.

**Logging:** A `getLogger()` function is present, returning a logger (maybe Winston or Pino) configured for the app ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=const%20task%20%3D%20WriteTaskSchema)). MakerKit uses it to log events like “Task added successfully” or errors on the server ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=logger.info%28task%2C%20)) ([Learn how to write data to the Supabase database in your Next.js app](https://makerkit.dev/docs/next-supabase-turbo/development/writing-data-to-database#:~:text=.insert%28)). In development, this might log to console; in production, it could log to files or external log services.
- This logger might also integrate with the monitoring – e.g., critical errors logged could be forwarded to Sentry as well.

**Analytics (Basic):** While there’s a separate Analytics section, monitoring sometimes includes page view tracking or user behavior analytics. The kit might include a simple integration for something like Google Analytics or Fathom (just by adding the script). But more likely, “Analytics” is handled separately (see next section).

**Health Checks:** Possibly includes endpoints or scripts to check system health (like a /api/health route to ping DB, etc., not sure if included by default).

**Third-Party Service Hooks:** Monitoring could also integrate with something like **Baselime** (mentioned in the packages list) ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=%28e,js%20specific%20utilities)) which is a serverless monitoring solution. The presence of Baselime suggests support for monitoring on edge or serverless environments.

**Setting Up:** To configure monitoring:
- Provide the service DSN/keys in environment (e.g., SENTRY_DSN).
- Toggle any feature flag if needed (like `ENABLE_SENTRY`).
- On production deploy, ensure source maps are uploaded if using Sentry (the kit’s build may do it if configured).

**Dev Tools:** MakerKit’s Dev Tools (port 3010 application) might include a monitoring console or logs viewer? The Dev Tools documentation would clarify. It could be a small app to view logs, trigger test events (like sending a test email, etc.). This is speculative, but the dev tools app likely helps with some debugging tasks.

In summary, MakerKit’s Monitoring ensures that when your app is live, you can catch errors and track issues proactively. By plugging in a service like Sentry, you’ll get error notifications, and the kit’s instrumentation means you have minimal work to do to start monitoring your app’s health.

## Super Admin

The **Super Admin** panel is an administration interface for the owners of the SaaS (you and your team) to manage the system. MakerKit includes a Super Admin role (as evidenced by the seeded `super-admin@makerkit.dev` user with MFA) ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=)) and likely an interface restricted to that role.

**Super Admin vs Regular Admin:** The kit differentiates between:
- *Admin package (`@kit/admin`)*: This could be meant for the "super admin" of the whole application (not to be confused with team admins). It likely provides a separate set of pages or an app where you can oversee all users, accounts, and data.
- Within a team, there might be roles, but “Super Admin” here is the ultimate level - the SaaS owner.

**Features of Super Admin panel:**
- **User Management:** View all users in the system, their email, signup date, status, etc. Possibly edit or delete users, reset passwords, or toggle features for a user.
- **Account Management:** View all personal accounts and team accounts. For teams, maybe adjust quotas, assign plan overrides, etc.
- **Impersonation:** Sometimes admin panels allow impersonating a user to see what they see. Not sure if MakerKit has this, but it’s useful for support.
- **Billing Overview:** See who’s on what plan, usage stats, revenue numbers. Possibly integrated if you want to monitor subscriptions.
- **System Settings:** Some global settings might be adjustable from the admin UI (though most config is code/env, you might expose some via UI if needed).
- **Feature Flags UI:** If one wanted, the super admin panel could toggle feature flags at runtime (the kit has feature flags config, but maybe not UI by default).
- **Announcements/Notifications:** Send a notification or email to all users (for maintenance announcements).
- **Monitoring info:** maybe see recent errors or logs in a dashboard (if integrated).

**Access Control:** Only the user marked as Super Admin (or users with a certain boolean flag in profile) can access this area. MakerKit enforces MFA for Super Admin for extra security ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=)).

**Implementation:** The Super Admin could be implemented as:
- A separate Next.js route group protected by a middleware that checks user role.
- Possibly even as a separate Next.js app in the monorepo (some kits separate the admin app). But given it’s mentioned in docs, likely part of the main app under something like `/admin` route.

**Usage in Dev:** Use the provided super-admin credentials to log in and explore this panel. Immediately change the credentials and secret in production.

For you building on MakerKit, the Super Admin panel is convenient for maintenance tasks without directly poking at the database. You can extend it by adding pages or actions if you need to manage custom entities.

## Analytics

The **Analytics** section refers to tracking and analyzing user behavior and app usage. MakerKit mentions an upcoming unified analytics package ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=,package%20to%20track%20user%20behavior)), but even without that, it supports integration with analytics tools.

Possible aspects:
- **Analytics API:** The docs say “Learn how to use the Analytics API in your Makerkit project to track user behavior” ([Documentation for the SaaS Starter Kit Next.js and Supabase V2](https://makerkit.dev/docs/next-supabase-turbo#:~:text=Introducing%20how%20Makerkit%20handles%20monitoring,js%20Supabase%20Turbo)) ([Documentation for the SaaS Starter Kit Next.js and Supabase V2](https://makerkit.dev/docs/next-supabase-turbo#:~:text=panel%20allows%20you%20to%20manage,Going%20to)). This suggests there might be a built-in way to log events (page views, feature usage) to a database or external service.
- The upcoming `@kit/analytics` package might, for example, capture events like “User created project” or “User invited teammate” and store them (maybe in a Supabase `analytics_events` table) or send to an external analytics (like Segment or PostHog).
- Currently, one could just include something like Google Analytics by adding the script tag in `_app` or using Google Tag Manager.

If MakerKit has an Analytics module:
- It could provide a function like `trackEvent(userId, eventName, properties)` that writes to a table or calls an API.
- The Super Admin or Dev Tools might let you query these events.

**Why Analytics:** This helps you as the SaaS owner understand feature adoption, funnel conversion, etc. It’s not directly user-facing, but crucial for product decisions.

**Set Up:** Possibly just enabling it via config and providing any necessary keys (if using a third-party service). If it’s a simple internal solution, just turning on the feature flag might start logging certain actions by default.

**Privacy:** Ensure to update your privacy policy if tracking user behavior, and provide an opt-out if necessary (especially for EU/GDPR compliance, maybe integrate a cookie consent if GA is used).

In summary, the Analytics part of MakerKit is there to help instrument your app. You can capture metrics to make data-driven improvements. While the kit may include basic analytics, you can always integrate a full tool like Segment or Mixpanel depending on your needs.

## Plugins

The **Plugins** section likely refers to extending MakerKit with third-party or custom modules, possibly via a plugin architecture. MakerKit’s roadmap mentions moving existing plugins to a separate package ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=Also%20planned%20%28post)), implying some plugin system is planned or in place.

Potential interpretation:
- **Feature Modules:** They might call certain optional features “plugins”. E.g., maybe an AI writing assistant could be a plugin, or a chat widget integration, etc. 
- The plugin system could allow dropping in new packages that auto-register routes or functionality.

Since it’s listed but not elaborated, currently it might be a placeholder. However, in the context of MakerKit:
- *Plugins* could be things like integrating third-party services (CRM, chat, analytics) by just enabling a package. 
- There might not be much to do for the user; it’s more of a developer convenience to have pre-built integrations.

As of now, likely the advice is: The architecture is modular enough that you can treat any new feature as a “plugin” package. The MakerKit team may in future provide official plugins (e.g., a plugin for a **Chatbot** or **Feedback widget**).

In your development, if you think of a feature that not all users would want, you can implement it in a similar decoupled way:
- Create a package for it under `packages/`, encapsulate all needed code (UI, API, DB migrations), and conditionally include it (behind a feature flag maybe).

This way, the core app remains lean and you enable the plugin only if needed. For example, a “CMS Plugin” (which they did as `@kit/cms`), or an “AI Plugin” for AI features.

The Plugin section of docs might enumerate some available plugins or how to create one. Since it’s probably minimal now, we’ll conclude that MakerKit’s design encourages plugin-like extensions, and future updates will formalize this approach.

## Going to Production

This section provides guidance on preparing and deploying your MakerKit application to a production environment.

**Environment Setup:** Ensure all production environment variables are set. This includes:
- Supabase keys (pointing to your production Supabase project).
- Stripe or billing provider keys (live mode keys).
- Email SMTP/API keys (production email service).
- Any OAuth client IDs (Google, GitHub, etc.) for production domains.
- Set `NODE_ENV=production` and any other production flags.

MakerKit likely suggests storing these in your hosting provider’s config (e.g., Vercel Environment Variables or Docker secrets). The docs might have a checklist ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=When%20you%27re%20ready%20to%20deploy,ensure%20everything%20is%20properly%20configured)) to verify before launch.

**Building for Production:** Use `pnpm build` to build the Next.js app. Run database migrations on Supabase (the `db push` command) before or as part of deployment.

**Deployment Targets:**
- **Vercel:** MakerKit is well-suited to Vercel (the Next.js maintainer). Simply connect your repo to Vercel, add env vars, and it can build and deploy. Vercel will handle the Next.js app (the Supabase part stays external on Supabase cloud). The docs mention it’s easily deployable to Vercel and supports edge, implying SSR pages can run on Vercel’s Edge if configured ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=customize%20the%20application%20to%20your,needs)).
- **Cloudflare Workers:** Since they mention edge rendering and Cloudflare ([Technical Details of the Next.js Supabase SaaS Boilerplate](https://makerkit.dev/docs/next-supabase-turbo/installation/technical-details#:~:text=customize%20the%20application%20to%20your,needs)), you could deploy the Next.js app on Cloudflare Pages/Workers using the appropriate adapter. If doing so, use Resend for emails (because Workers can’t use Node libraries).
- **Docker:** Alternatively, you can containerize the Next.js app and run it on AWS, Fly.io, etc. MakerKit’s turborepo might have a Docker file or you can create one easily for the web app.
- **Supabase Hosting for functions:** Note, the Next.js app itself is separate from Supabase. Supabase hosts the DB and maybe can host some Edge Functions, but you still need to host the Next.js front-end.

**Database Migration on Prod:** Running `supabase db push` applies all new migrations to the Supabase project ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=Pushing%20the%20migration%20to%20the,remote%20Supabase%20instance)). Do this carefully (preferably when app is in maintenance mode or off to avoid issues). The Supabase project should have **Replication** or backup enabled as needed. The docs likely say to push the schema after you deploy or as part of CI.

**Domain and URLs:** Set your production domain in env (`NEXT_PUBLIC_APP_URL`). Configure CORS or redirect settings if needed (Supabase might need the domain in its allowed list for auth callbacks). If using a separate marketing site domain and app subdomain, ensure those are configured (and cookies can be shared if needed for auth).

**Performance & Monitoring:** Make sure monitoring is enabled in prod (Sentry DSN set). Set up alerts for errors. Also, if using something like Vercel Analytics or any performance tracking, enable it.

**Security Checklist:**
- Enforce HTTPS (most platforms do by default).
- Set cookies to secure and sameSite as appropriate (Supabase should handle auth cookies securely).
- Use strong secrets for JWT, encryption keys if any.
- Admin credentials: change the default super admin email/password to something secure; set up MFA properly for your account.
- If your app is invite-only, keep signups disabled or behind a feature flag until you open up.

**Scaling:** MakerKit on Vercel will scale automatically. Supabase can scale (choose appropriate plan and enable Row Level Security for multi-tenant data safety). If you expect high load, consider caching layer or CDNs for assets (Next.js already handles static assets, Vercel CDN covers that).

**SEO & Social:** Fill in any missing SEO metadata for production (social sharing image URLs that point to your domain, etc.). Ensure the sitemap is generated and submit to search consoles if SEO is relevant.

**Testing Production:** After deploying, test critical flows (signup, login, payment) on the live environment with test accounts or Stripe test mode to ensure all connections (Supabase, Stripe webhooks, email sending) work outside localhost.

The **Going to Production** docs likely provide a step-by-step deployment guide and highlight things like setting environment variables, running database migrations, and checking off configuration for third-party services ([Going to Production with Makerkit Next.js Supabase Turbo](https://makerkit.dev/courses/nextjs-turbo/deploy-production#:~:text=Going%20to%20Production%20with%20Makerkit,One%20of)).

## Recipes

The Recipes section probably contains short guides or examples for specific use-cases or “How do I…?” scenarios. These might include:
- **How to add a new page or route** (which we covered conceptually).
- **How to add a cron job or scheduled task** – maybe using Supabase Edge Functions or an external scheduler.
- **Implementing a specific OAuth provider** – e.g., adding a new OAuth integration beyond the defaults.
- **Using Next.js middleware** – for things like custom logging or redirects.
- **Custom domain for Supabase storage** – if serving images via a CDN.
- **Integrating a third-party service** – like Slack notifications or a different payment gateway.

These recipes complement the core docs by addressing common modifications one might do. They’re likely formatted as standalone how-to articles in the docs.

We won’t detail each (as they are varied), but if you have a particular scenario, check the Recipes section – there’s a good chance an example exists. If not, MakerKit’s community (Discord/forums) or general Next.js knowledge will help, since the kit aligns closely with standard Next.js practices.

## Developer Tools

MakerKit includes a secondary application for **Developer Tools**, which runs on localhost:3010 in development ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=This%20command%20launches%3A)). This Dev Tools app is meant to assist developers working on the project. Features it might provide:
- **Email preview:** Perhaps an interface to preview the email templates with dummy data, so you can see what emails look like without actually sending them.
- **Database browser:** Maybe a simple viewer for the local Supabase DB (though Supabase Studio could be used too).
- **Logs viewer:** Real-time logs from the app or Supabase.
- **Feature toggling:** In dev, quickly flip feature flags to test different configurations.
- **Testing triggers:** Buttons to simulate events (e.g., “Send test welcome email to X”, or “Generate 10 fake users”).
- **LLM rules (if applicable):** There was mention of “LLMs rules” in the docs navigation, which suggests guidance on using Large Language Models in the context of MakerKit. Possibly Dev Tools might include something for that if AI features are included.

Given `LLMs rules` appears in installation menu ([Introduction to Next.js Supabase SaaS Kit Turbo Repository](https://makerkit.dev/docs/next-supabase-turbo/installation/introduction#:~:text=,22)), maybe MakerKit has some AI integration guidelines (like don’t expose API keys, etc.). If the project intended to have AI features (the presence of AI Starters link in nav hints at some optional AI module), developer tools might help with prompts or testing those.

In any case, the Developer Tools app is optional and for your convenience. In production, you wouldn’t deploy it. It’s decoupled so that leaving it out of a build is easy.

When developing, keep an eye on the Dev Tools output in the terminal – it might log useful info or show if something is misconfigured.

## Troubleshooting

Finally, the Troubleshooting section addresses common issues and their solutions. Some likely topics:
- **Module not found / Build errors:** e.g., the Windows-specific issue with `react-dom/client` that was mentioned ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=If%20you%27re%20hitting%20issues%20with,related%20issues%20with%20Node.js)). The docs might tell Windows users to install certain dependencies or polyfills.
- **Database connection issues:** If Supabase local isn’t starting or you get errors connecting, ensure Docker is running and you allocated enough memory ([Running the Next.js Supabase Turbo project](https://makerkit.dev/docs/next-supabase-turbo/installation/running-project#:~:text=)).
- **Supabase migrations issues:** If diff tool isn’t working or a migration fails, see the known caveats link ([How to create new migrations and update the database schema in your Next.js Supabase application](https://makerkit.dev/docs/next-supabase-turbo/development/migrations#:~:text=,file)) and adjust. Possibly drop the DB and reset if dev schema gets messy.
- **Auth issues:** If email confirmations aren’t arriving – check Mailpit, check SMTP configuration. If users can’t login – maybe the JWT secret in Supabase is not matching the NEXT_PUBLIC_SUPABASE_ANON_KEY used by the app (Supabase manages this normally).
- **Stripe webhooks:** If testing Stripe locally, need to use the Stripe CLI to forward webhooks to your `localhost` since Stripe can’t reach it otherwise.
- **Next.js issues:** Sometimes, clearing `.next` cache or reinstalling node_modules if weird front-end issues occur.
- **Deployment problems:** e.g., Vercel build fails due to environment variables not set, or Supabase network issues – double-check env and possibly add a delay for Supabase to warm up if needed.

The troubleshooting guide is a good first stop if something isn’t working as expected. MakerKit’s community channels (Discord) are also valuable for help on uncommon issues.

---

This concludes the structured summary of the MakerKit Next.js + Supabase Turbo documentation. It covered all main sections at a high level, and provided in-depth information for **Development**, **API**, and **Data Fetching** aspects to aid in using MakerKit effectively. With this, a developer (or an LLM assistant in an IDE) should have a clear roadmap of the kit’s capabilities and how to utilize them when building a SaaS application.