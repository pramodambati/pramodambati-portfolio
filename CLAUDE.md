# CLAUDE.md

This file   provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **Bun** (a `bun.lockb`/`bun.lock` is committed). npm works too.

```bash
bun dev              # Next.js dev server with Turbopack (http://localhost:3000)
bun run build        # Production build — the only "test" gate (see below)
bun run start        # Serve the production build
bun run lint         # next lint (ESLint 9, flat config)
bun run format:all   # Prettier with both .prettierrc and .prettierrc.json
bun run knip         # Find unused files / exports / dependencies
bun run test-telegram  # One-off script to discover your Telegram chat ID (src/validate/testTelegram.ts)
```

There is **no unit test suite**. Per CONTRIBUTING.md, the verification gate before pushing is a successful `bun run build`. A Husky pre-commit hook runs `lint-staged` (Prettier + `eslint --fix` on staged files).

## Environment

Copy `.env.example` to `.env`. Required for the two API routes to function:
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (contact form), `GEMINI_API_KEY` (chat). `NEXT_PUBLIC_*` vars feed the site URL and Umami analytics. Routes degrade gracefully (return 500) when keys are missing rather than crashing.

## Architecture

Next.js 15 App Router portfolio site, React 19, Tailwind CSS v4, Shadcn UI (new-york style), TypeScript strict. Path alias `@/*` → `src/*`.

**Three sources of truth, kept separate:**

1. **`src/config/*`** — All site *content and settings* live here as typed TS/TSX modules (`Hero.tsx`, `Projects.tsx`, `Meta.tsx`, `ChatPrompt.ts`, `Navbar.tsx`, etc.). This is the customization layer; editing the site usually means editing config, not components. `Meta.tsx` exports `siteConfig` and a `generateMetadata(path)` helper used by every page.

2. **`src/data/{blog,projects,journey}/*.mdx`** — Long-form content as MDX with frontmatter. Loaded at build time, not imported.

3. **`src/components/*`** — Presentation only, grouped by feature (`landing/`, `blog/`, `projects/`, `experience/`, `gears/`, `common/`) plus generated Shadcn primitives in `components/ui/` and tech-stack icons in `components/technologies/`.

**MDX content pipeline (`src/lib/blog.ts`, `src/lib/project.ts`):** These read the `.mdx` files from disk with `fs` + `gray-matter` (so they are server-only). They expose `getXBySlug`, `getAllX`, `getPublishedX` (filters on `frontmatter.isPublished`), tag/technology filtering, and related-content scoring by shared tags/technologies. Dynamic routes `app/blog/[slug]` and `app/projects/[slug]` call `generateStaticParams` from the slug helpers, so all content is statically generated. Project next/previous navigation is derived from the *order in `config/Projects.tsx`*, not from the filesystem.

**API routes (`src/app/api/*/route.ts`):** Two POST endpoints, each self-contained. Both implement the same pattern: an in-memory `Map`-based rate limiter (5 req/min per client IP, IP resolved from `x-forwarded-for`/`x-real-ip`/`cf-connecting-ip`) and Zod request validation.
- `api/contact` validates the form and relays it to Telegram via the Bot API.
- `api/chat` proxies to Google Gemini (`gemini-2.0-flash`, streaming SSE). It prepends `systemPrompt` from `config/ChatPrompt.ts`, sanitizes user input against a list of prompt-injection patterns, and re-streams Gemini's SSE to the client. Note the in-memory rate-limit state does **not** survive serverless cold starts.

**Analytics (type-safe Umami):** `src/types/analytics.ts` is the single source of truth — the `AnalyticsEventData` map defines every allowed event and its payload shape; `AnalyticsEvent`, event-name union, and `useUmami().trackEvent` all derive from it, so a wrong payload is a compile error. Components emit events via `useUmami()`, or via the `track` prop on the wrapped `Button` / `TrackedLink` common components. Tracking calls no-op silently when the Umami script hasn't loaded (ad blockers).

**Root layout (`app/layout.tsx`)** wires global providers/chrome around every page: `ThemeProvider` (next-themes, system default), `ReactLenis` (smooth scroll), `ViewTransitions` (next-view-transitions — use its `Link`, not `next/link`, for page transitions), plus persistent `Navbar`, `Footer`, `ChatBubble`, `Quote`, `OnekoCat`, and Umami.

## Conventions (from CONTRIBUTING.md)

- **PascalCase** for components, types, and feature directories; **camelCase** for hooks (`useMobile.ts`), utils, and config helpers; **kebab-case** for MDX content files.
- Tailwind classes only — no inline styles; theme colors come from CSS variables in `src/app/globals.css`. Mobile-first.
- New MDX blog/project files must include the required frontmatter (`title`, `description`, `date`, `tags`/`technologies`, `isPublished`) or `getXBySlug` throws and the entry is dropped.
- Add Shadcn primitives via the CLI (config in `components.json`, icon library is `lucide`). Add tech-stack icons as new components under `components/technologies/` following the existing SVG component pattern.
- Conventional Commits (`feat(scope): ...`, `fix(scope): ...`).
- `next.config.ts` allow-lists remote image hostnames — add new external image hosts there or `next/image` will reject them.
