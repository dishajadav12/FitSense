# Replit Agent Guide — FitSense

## Overview

FitSense is a context-aware outfit recommendation app. Users upload clothing items to a virtual closet, provide context (weather, occasion), and receive AI-powered outfit suggestions. The app is built with Next.js (App Router) on the frontend and Convex as the backend/database layer.

The project is in early stages — the landing page and dashboard layout exist as scaffolding with placeholder UI. The Convex schema and basic queries/mutations are defined but not yet wired into the frontend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend — Next.js App Router
- **Framework:** Next.js 14 with the App Router (`app/` directory)
- **Styling:** Tailwind CSS with custom CSS variables for theming (dark/light mode support via `prefers-color-scheme`)
- **UI Components:** Shadcn/ui is configured (`components.json`) with the "new-york" style, using Radix UI primitives. Components use the `@/components` path alias but live under `client/src/` based on tsconfig paths.
- **Font:** Inter via `next/font/google`
- **Pages:**
  - `app/page.tsx` — Landing page with link to dashboard
  - `app/dashboard/page.tsx` — Main dashboard with three placeholder sections: closet upload, context input, outfit result

### Backend — Convex
- **Convex** is the primary backend, handling database, queries, and mutations
- **Client Provider:** `app/ConvexClientProvider.tsx` wraps the app with `ConvexProvider` using `NEXT_PUBLIC_CONVEX_URL` environment variable
- **Schema** (`convex/schema.ts`):
  - `closet` table: `userId` (string), `imageUrl` (string), `type` (string — "top", "bottom", "shoes", etc.), `tags` (array of strings)
  - `outfits` table: `userId` (string), `topId` (reference to closet), `bottomId` (reference to closet), `shoesId` (reference to closet), `dateWorn` (optional string)
- **Functions:**
  - `convex/closet.ts` — `get` query (all items) and `add` mutation (insert clothing item with placeholder user)
  - `convex/outfits.ts` — `get` query (all outfits)
- **Auth:** Not yet implemented. User ID is hardcoded as `"placeholder_user"` in mutations.

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

### Build System
- `script/build.ts` exists for a separate esbuild + Vite build pipeline (likely leftover from a previous Express-based architecture). The current app uses `next dev` / `next build` as defined in package.json scripts.
- Run `npx convex dev` separately to sync Convex functions during development.

### Key Architectural Decisions
1. **Convex over traditional REST API + Postgres:** Convex provides real-time reactivity, serverless functions, and a managed database — eliminating the need for a separate backend server. This simplifies deployment but couples the app to Convex's platform.
2. **Next.js App Router:** Chosen for server components support, file-based routing, and modern React patterns. RSC is set to `false` in shadcn config, so client components are the default for interactive UI.
3. **Shadcn/ui:** Provides copy-paste component primitives built on Radix UI. Components are owned by the project (not a dependency), making customization easy.

## External Dependencies

### Services
- **Convex** — Backend-as-a-service for database, real-time queries, and mutations. Requires `NEXT_PUBLIC_CONVEX_URL` environment variable to be set.

### Key npm Packages
- `convex` — Convex client SDK
- `next` — Next.js framework (v14)
- `react` / `react-dom` — React 18
- `tailwindcss` / `postcss` / `autoprefixer` — CSS toolchain
- `lucide-react` — Icon library
- `clsx` / `tailwind-merge` — Utility class helpers

### Environment Variables Required
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL (required for the app to connect to Convex)

### AI Pipeline — Gemini + MiniMax
- **Gemini Vision** (via Replit AI Integrations) — Analyzes closet item photos to generate rich text descriptions (color, fabric, pattern, fit, style). Used in `app/api/analyze-closet/route.ts`. Uses `gemini-2.5-flash` model with inline image data.
- **MiniMax M2** — Text-only LLM that receives Gemini's visual descriptions + user context to create 3 outfit combinations, selecting specific closet items by ID. Used in `convex/outfits.ts`.
- **MiniMax image-01** — Generates try-on images using the outfit descriptions + user profile photo as character reference. Used in `convex/outfits.ts`.
- **Flow:** Dashboard → Gemini analyzes all closet images → enriched descriptions sent to Convex action → MiniMax M2 creates outfits → MiniMax image-01 generates try-on images
- **Environment variables:** `AI_INTEGRATIONS_GEMINI_BASE_URL`, `AI_INTEGRATIONS_GEMINI_API_KEY` (auto-managed by Replit), `MINIMAX_API_KEY` (secret)

### Not Yet Integrated But Referenced
- The `package-lock.json` references many packages (drizzle-orm, express, passport, openai, stripe, etc.) from a prior or parallel architecture. The current Next.js + Convex setup does not use these. Focus on the `package.json` dependencies as the source of truth.