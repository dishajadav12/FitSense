# FitSense — AI-Powered Outfit Recommendations

FitSense is a context-aware styling app for women. Upload your wardrobe, set your occasion and mood, and let AI build three complete outfit ideas from clothes you already own — complete with a virtual try-on image.

---

## What It Does

- **Digital Closet** — Upload photos of your clothing items. Google Gemini Vision analyzes each piece for color, fabric, pattern, fit, and style.
- **Smart Outfit Generation** — Tell the app your occasion (Work, Date, Casual, Party), mood level, and city. It checks live weather, then uses MiniMax M2 to create three tailored outfit combinations from your actual closet items.
- **Virtual Try-On** — MiniMax image-01 generates a photorealistic try-on image for each outfit using your profile photo as a character reference.
- **Recent Looks** — Past outfit generations are saved and browsable on the landing page.
- **Onboarding Flow** — New users set a name and optional profile photo before entering the app.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Shadcn/ui + Radix UI |
| Backend / DB | Convex (real-time, serverless) |
| AI Vision | Google Gemini 2.5 Flash |
| AI Styling | MiniMax M2 (text) |
| AI Try-On | MiniMax image-01 |

---

## AI Pipeline

```
User uploads closet photo
        ↓
Gemini Vision analyzes image
(color, fabric, pattern, style)
        ↓
User sets occasion + mood + city
        ↓
Weather API fetches live conditions
        ↓
MiniMax M2 selects 3 outfit combos
from closet items
        ↓
MiniMax image-01 generates
try-on photo per outfit
        ↓
Results displayed + saved to history
```

---

## Project Structure

```
app/
  page.tsx                  # Landing page + onboarding flow
  layout.tsx                # Root layout with Convex provider
  globals.css               # Tailwind base styles + CSS variables
  dashboard/
    page.tsx                # Main dashboard (closet, styling, results)
  api/
    analyze-closet/route.ts # Gemini Vision API route
    weather/route.ts        # Weather API route

convex/
  schema.ts                 # Database schema (closet, outfits, profile)
  closet.ts                 # Closet queries, mutations, file upload
  outfits.ts                # Outfit generation action + history query
  profile.ts                # User profile query/mutation

public/
  demo/                     # 20 seeded women's clothing images (PNG)
  landing/                  # Landing page hero + feature images
```

---

## Database Schema (Convex)

**`closet`** — Individual clothing items
- `userId` (string), `imageUrl` (string), `label` (string), `type` (string: top / bottom / dress / shoes / outerwear / handbag), `tags` (string[])

**`outfits`** — Generated outfit sessions
- `userId` (string), `occasion` (string), `weatherSummary` (string), `results` (array of outfit objects with `outfitText`, `reason`, `tryOnImageBase64`)

**`profile`** — User profile
- `userId` (string), `name` (string), `photoUrl` (optional string)

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL (set in `.env.local`) |
| `MINIMAX_API_KEY` | MiniMax API key for M2 + image-01 |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Auto-managed by Replit AI Integrations |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Auto-managed by Replit AI Integrations |

---

## Running Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Convex** (first time only)
   ```bash
   npx convex dev
   ```
   This creates a deployment and sets `NEXT_PUBLIC_CONVEX_URL` in `.env.local`.

3. **Start the app**
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:3000`.

> Both `npm run dev` and `npx convex dev` need to run simultaneously in development. On Replit, the workflow handles Next.js while Convex syncs automatically.

---

## Key Design Decisions

- **Convex over REST + Postgres** — Real-time reactivity, managed serverless functions, and built-in file storage. No separate backend server needed.
- **Gemini for vision, MiniMax for generation** — Gemini 2.5 Flash provides the best clothing analysis; MiniMax M2 handles outfit reasoning and image-01 handles photorealistic try-on generation.
- **Demo closet seeded in Convex** — 20 AI-generated women's clothing PNGs (`public/demo/`) are stored as path references and bypass Convex file storage lookup to avoid invalid storage ID errors.
- **Auth deferred** — User ID is currently hardcoded as `"demo"`. Authentication is a planned future addition.
- **App Router + Client Components** — All interactive pages use `"use client"` since Convex hooks (`useQuery`, `useMutation`, `useAction`) require client-side rendering.
