# DocMind — Complete Project Context

> **Purpose:** This document explains every file, module, and data flow in the DocMind codebase. Paste it into ChatGPT (or any AI assistant) to get accurate explanations of how the project works.

---

## Table of Contents

1. [What Is DocMind?](#1-what-is-docmind)
2. [Tech Stack](#2-tech-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [End-to-End User Flows](#4-end-to-end-user-flows)
5. [Project Directory Structure](#5-project-directory-structure)
6. [Environment Variables](#6-environment-variables)
7. [Database Schema (Prisma)](#7-database-schema-prisma)
8. [Backend / Server Libraries (`src/lib/`)](#8-backend--server-libraries-srclib)
9. [API Routes (`src/app/api/`)](#9-api-routes-srcappapi)
10. [Frontend Pages & Layouts](#10-frontend-pages--layouts)
11. [React Components](#11-react-components)
12. [Configuration Files](#12-configuration-files)
13. [Key Design Decisions](#13-key-design-decisions)
14. [Local Development Setup](#14-local-development-setup)
15. [Glossary](#15-glossary)

---

## 1. What Is DocMind?

**DocMind** is an AI-powered document intelligence platform. Users can:

1. **Sign up / sign in** via Clerk authentication
2. **Upload PDF documents** (max 16 MB) via UploadThing
3. **Automatically process** each PDF in the background (extract text → chunk → embed → store in Pinecone)
4. **Chat with their documents** using RAG (Retrieval-Augmented Generation): the app retrieves relevant text chunks via vector search, then asks Google Gemini to answer based on those excerpts

The core value proposition: answers are **grounded in the user's uploaded PDF**, not generic LLM hallucinations.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 16** (App Router) | Full-stack React app, API routes, SSR |
| Language | **TypeScript** | Type safety |
| UI | **React 19**, **Tailwind CSS v4** | Components and styling |
| Auth | **Clerk** (`@clerk/nextjs`) | User sign-in/sign-up, session management |
| Database | **PostgreSQL** + **Prisma 7** | Users, documents, chunks, chats, messages |
| File Storage | **UploadThing** | PDF upload hosting |
| Vector DB | **Pinecone** | Semantic search over document chunks |
| AI (Chat) | **Google Gemini** via **Vercel AI SDK** (`ai`, `@ai-sdk/google`) | Streaming chat responses |
| AI (Embeddings) | **Google Gemini Embedding** (`gemini-embedding-001`) | Vector embeddings for RAG |
| Background Jobs | **Inngest** | Async PDF processing pipeline |
| PDF Parsing | **pdf-parse** | Extract text from uploaded PDFs |

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (React)                                │
│  Landing → Auth → Dashboard (upload + list) → Document Chat UI          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Clerk Auth    │     │ UploadThing     │     │ /api/chat       │
│ (sessions)    │     │ (PDF storage)   │     │ (RAG + stream)  │
└───────────────┘     └────────┬────────┘     └────────┬────────┘
                               │                       │
                               ▼                       ▼
                    ┌──────────────────────────────────────────┐
                    │           PostgreSQL (Prisma)             │
                    │  User, Document, DocumentChunk, Chat,     │
                    │  Message                                  │
                    └──────────────────────────────────────────┘
                               │
                               ▼ (Inngest event: document/process)
                    ┌──────────────────────────────────────────┐
                    │     Inngest Function: processDocument    │
                    │  1. Fetch PDF from UploadThing URL        │
                    │  2. Extract text (pdf-parse)              │
                    │  3. Chunk text                          │
                    │  4. Generate embeddings (Gemini)        │
                    │  5. Upsert vectors → Pinecone             │
                    │  6. Save chunks → PostgreSQL              │
                    │  7. Mark document READY                   │
                    └──────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────────────────┐
                    │              Pinecone Index               │
                    │  Vectors with metadata: documentId,       │
                    │  userId, chunkIndex                       │
                    └──────────────────────────────────────────┘
```

### RAG Chat Flow (when user asks a question)

```
User message
    → POST /api/chat
    → Embed query (Gemini, RETRIEVAL_QUERY mode)
    → Pinecone similarity search (filtered by documentId + userId)
    → Fetch chunk text from DB if not in Pinecone metadata
    → Build system prompt with retrieved excerpts
    → Stream Gemini response (gemini-2.5-flash)
    → Save USER + ASSISTANT messages to PostgreSQL
```

---

## 4. End-to-End User Flows

### Flow A: New User Uploads a PDF

1. User visits `/` → redirected to `/dashboard` if already signed in
2. User signs up at `/sign-up` (Clerk)
3. On first dashboard visit, `getOrCreateUser()` creates a `User` row in Postgres (Clerk ID as primary key)
4. User drops PDF on `DocumentUpload` component → UploadThing uploads file
5. UploadThing `onUploadComplete` callback:
   - Creates `Document` with `status: PROCESSING`
   - Sends Inngest event `document/process`
6. User is redirected to `/documents/{id}/chat`
7. `ProcessingStatus` component polls every 5s via `router.refresh()` until status changes
8. Inngest `processDocument` function runs pipeline → sets `status: READY`
9. Chat UI unlocks; user can ask questions

### Flow B: Chatting with a Document

1. User types question in `DocumentChat` component
2. Client calls `useChat` hook with `TextStreamChatTransport` → `POST /api/chat`
3. Server:
   - Validates auth + document ownership + document is READY
   - Creates/finds `Chat` record
   - Saves user message to DB
   - Retrieves top-K relevant chunks from Pinecone
   - Builds RAG system prompt
   - Streams Gemini response
   - On finish, saves assistant message to DB
4. Client displays streaming text in chat bubbles

### Flow C: Returning User

1. Dashboard shows `DocumentsGrid` with all user's documents
2. Each `DocumentCard` links to `/documents/{id}/chat`
3. Chat page loads last 12 messages from most recent chat session

---

## 5. Project Directory Structure

```
docmind/
├── .env.example              # Template for required env vars
├── .env.local                # Local secrets (NEVER commit)
├── package.json              # Dependencies and npm scripts
├── next.config.ts            # Next.js config (external packages for PDF)
├── prisma.config.ts          # Prisma 7 config (schema path, DIRECT_URL)
├── tailwind.config.ts        # Tailwind theme extensions
├── postcss.config.mjs        # PostCSS for Tailwind v4
├── tsconfig.json             # TypeScript paths (@/* → src/*)
├── PROJECT_CONTEXT.md        # This file
├── README.md                 # Quick start guide
├── AGENTS.md / CLAUDE.md     # AI agent rules for Next.js 16
│
├── prisma/
│   └── schema.prisma         # Database models and enums
│
├── src/
│   ├── proxy.ts              # Auth middleware (Next.js 16 — replaces middleware.ts)
│   │
│   ├── generated/prisma/     # Auto-generated Prisma client (postinstall)
│   │
│   ├── lib/                  # Server-side business logic
│   │   ├── config.ts         # Tunable constants (chunk size, top-K, etc.)
│   │   ├── gemini.ts         # Gemini model names and temperature
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── user.ts           # getOrCreateUser (Clerk → DB sync)
│   │   ├── pdf.ts            # PDF text extraction
│   │   ├── chunker.ts        # Text chunking algorithm
│   │   ├── embeddings.ts     # Gemini embedding generation
│   │   ├── pinecone.ts       # Pinecone client + auto-create index
│   │   ├── retrieval.ts      # RAG vector search
│   │   ├── prompt.ts         # System prompt builder for chat
│   │   ├── inngest.ts        # Inngest client
│   │   ├── inngest-functions.ts  # Background job: processDocument
│   │   ├── document-processing.ts # Trigger Inngest event
│   │   ├── uploadthing.ts    # Client-side UploadThing components
│   │   └── format.ts         # UI formatting helpers
│   │
│   └── app/                  # Next.js App Router
│       ├── layout.tsx        # Root layout (ClerkProvider, fonts)
│       ├── page.tsx          # Landing page
│       ├── globals.css       # CSS variables, animations, theme
│       │
│       ├── (auth)/           # Auth route group (no URL segment)
│       │   ├── layout.tsx
│       │   ├── sign-in/[[...sign-in]]/page.tsx
│       │   └── sign-up/[[...sign-up]]/page.tsx
│       │
│       ├── (dashboard)/      # Protected dashboard routes
│       │   ├── layout.tsx    # Header with logo + UserButton
│       │   ├── loading.tsx   # Dashboard skeleton
│       │   ├── dashboard/page.tsx
│       │   └── documents/
│       │       ├── page.tsx  # Redirects to /dashboard
│       │       └── [documentId]/chat/
│       │           ├── page.tsx
│       │           └── loading.tsx
│       │
│       ├── components/       # Shared React components
│       │   ├── logo.tsx
│       │   ├── document-upload.tsx
│       │   ├── documents-list.tsx
│       │   ├── document-card.tsx
│       │   ├── document-chat.tsx
│       │   ├── chat-page-content.tsx
│       │   ├── processing-status.tsx
│       │   ├── status-badge.tsx
│       │   ├── navigation-progress.tsx
│       │   └── skeletons.tsx
│       │
│       └── api/              # API route handlers
│           ├── chat/route.ts
│           ├── documents/create/route.ts
│           ├── inngest/route.ts
│           └── uploadthing/
│               ├── core.ts   # UploadThing file router
│               └── route.ts  # UploadThing HTTP handler
│
└── .github/workflows/ci.yml  # CI: lint, type-check, build
```

---

## 6. Environment Variables

Copy `.env.example` → `.env.local`. Required keys:

| Variable | Service | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL | Prisma runtime connection (used in `src/lib/prisma.ts`) |
| `DIRECT_URL` | PostgreSQL | Prisma migrations/direct connection (`prisma.config.ts`) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI | Chat + embeddings |
| `PINECONE_API_KEY` | Pinecone | Vector database |
| `PINECONE_INDEX` | Pinecone | Index name (default: `knowledge-base`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | Client-side auth |
| `CLERK_SECRET_KEY` | Clerk | Server-side auth |
| `UPLOADTHING_SECRET` | UploadThing | File upload auth |
| `UPLOADTHING_APP_ID` | UploadThing | App identifier |
| `INNGEST_EVENT_KEY` | Inngest | Send events |
| `INNGEST_SIGNING_KEY` | Inngest | Verify webhook signatures |

**Optional tuning** (all have defaults in code):

- `GEMINI_CHAT_MODEL` (default: `gemini-2.5-flash`)
- `GEMINI_EMBEDDING_MODEL` (default: `gemini-embedding-001`)
- `GEMINI_EMBEDDING_DIMENSIONS` (default: `768`)
- `CHAT_TEMPERATURE` (default: `0.5`)
- `CHUNK_SIZE` (default: `1000` chars)
- `CHUNK_OVERLAP` (default: `100` chars)
- `EMBEDDING_BATCH_SIZE` (default: `20`)
- `EMBEDDING_PARALLEL_WAVES` (default: `3`)
- `RETRIEVAL_TOP_K` (default: `6`)
- `MIN_RELEVANCE_SCORE` (default: `0.35`)
- `CHAT_HISTORY_LIMIT` (default: `12` messages)

---

## 7. Database Schema (Prisma)

**File:** `prisma/schema.prisma`

Prisma client is generated to `src/generated/prisma/` (not the default `node_modules` location).

### Models

#### `User`
- `id` — Clerk user ID (NOT auto-generated; comes from Clerk)
- `email` — unique
- `plan` — enum: `FREE` | `PRO` (default FREE; PRO not implemented yet)
- Relations: `documents[]`, `chats[]`

#### `Document`
- `id` — cuid
- `userId` — owner
- `filename`, `fileUrl` (UploadThing URL), `fileSize` (bytes)
- `status` — `PROCESSING` | `READY` | `FAILED`
- `pageCount` — filled after PDF processing
- Relations: `chunks[]`, `chats[]`
- Index: `[userId, createdAt DESC]` for fast dashboard listing

#### `DocumentChunk`
- `id` — cuid
- `documentId`, `content` (original text), `chunkIndex`, `tokenEstimate`
- `pineconeId` — vector ID in Pinecone (format: `{documentId}_chunk_{index}`)
- Cascade delete when document is deleted

#### `Chat`
- One chat session per user per document (multiple allowed, but UI uses most recent)
- Relations: `messages[]`

#### `Message`
- `role` — `USER` | `ASSISTANT`
- `content` — plain text
- Ordered by `createdAt` for history

---

## 8. Backend / Server Libraries (`src/lib/`)

### `config.ts`
Centralized tunable constants read from environment variables with sensible defaults:
- PDF chunking: `CHUNK_SIZE`, `CHUNK_OVERLAP`
- Embedding ingestion: `EMBEDDING_BATCH_SIZE`, `EMBEDDING_PARALLEL_WAVES`
- RAG retrieval: `RETRIEVAL_TOP_K`, `MIN_RELEVANCE_SCORE`
- Chat: `CHAT_HISTORY_LIMIT`

### `gemini.ts`
Exports model configuration:
- `GEMINI_CHAT_MODEL` — default `gemini-2.5-flash`
- `GEMINI_EMBEDDING_MODEL` — default `gemini-embedding-001`
- `GEMINI_EMBEDDING_DIMENSIONS` — default `768`
- `CHAT_TEMPERATURE` — default `0.5`

### `prisma.ts`
Creates a singleton `PrismaClient` using the `@prisma/adapter-pg` driver adapter with `DATABASE_URL`. In development, stores client on `globalThis` to survive hot reloads.

### `user.ts`
**`getOrCreateUser()`** — React `cache()`-wrapped server function:
1. Gets `userId` from Clerk `auth()`
2. Looks up user in DB
3. If missing, fetches Clerk profile and creates user with `plan: FREE`
4. Used by dashboard, upload middleware, and chat pages

### `pdf.ts`
**`extractTextFromPDF(fileUrl)`**:
1. Configures pdf-parse worker (required for Next.js server)
2. Fetches PDF from UploadThing URL
3. Parses with `PDFParse` class
4. Returns `{ text, pageCount }`
5. Always destroys parser in `finally` block

### `chunker.ts`
**`chunkText(text, chunkSize, overlap)`**:
- Normalizes whitespace
- Sliding window: slices text into chunks of `chunkSize` characters with `overlap` overlap
- Returns `TextChunk[]` with `{ content, index, tokenEstimate }`
- Token estimate = `ceil(content.length / 4)` (rough heuristic)

### `embeddings.ts`
Uses Vercel AI SDK `embed` / `embedMany` with Google provider:
- **`generateEmbedding(text, mode)`** — single embedding; mode `"query"` or `"passage"`
- **`generateEmbeddings(texts, mode)`** — batch embeddings
- Sets Google-specific options: `taskType` (`RETRIEVAL_QUERY` vs `RETRIEVAL_DOCUMENT`) and `outputDimensionality`
- Error handling: API key errors and quota errors throw `NonRetriableError` (Inngest won't retry)

### `pinecone.ts`
- Initializes Pinecone client with `PINECONE_API_KEY`
- **`ensurePineconeIndex()`** — auto-creates serverless index if missing (cosine metric, configurable cloud/region)
- **`getPineconeIndex()`** — returns ready index handle
- Index dimension matches `GEMINI_EMBEDDING_DIMENSIONS`

### `retrieval.ts`
**`retrieveRelevantChunks(query, documentId, userId, topK?)`**:
1. Embeds query in `"query"` mode
2. Queries Pinecone with filter: `documentId` AND `userId` (security: users only see their own chunks)
3. Filters matches below `MIN_RELEVANCE_SCORE`
4. Falls back to PostgreSQL for chunk text if not stored in Pinecone metadata
5. Returns sorted chunks by `chunkIndex`

### `prompt.ts`
**`buildSystemPrompt(chunks, filename)`**:
- Builds a detailed system prompt instructing Gemini to:
  - Synthesize answers (not copy-paste excerpts)
  - Admit when excerpts lack information
  - Use short quotes only when exact wording matters
- Wraps each chunk in `<excerpt>` XML tags for structure

### `inngest.ts`
Creates Inngest client: `{ id: "docmind", name: "DocMind" }`

### `inngest-functions.ts`
**`processDocument`** — main background pipeline:

| Step | Name | Action |
|------|------|--------|
| 1 | `extract-text` | Download PDF, extract text + page count |
| 2 | `chunk-text` | Split into chunks |
| 3 | `embed-store-{n}` | Batch embed + upsert Pinecone + insert DB chunks (parallel waves) |
| 4 | `mark-ready` | Set document `status: READY`, save `pageCount` |

- Retries: 3
- On failure: sets `status: FAILED` via `onFailure` handler and catch block
- Pinecone record ID format: `{documentId}_chunk_{chunkIndex}`
- Pinecone metadata: `{ documentId, userId, chunkIndex }`

### `document-processing.ts`
**`triggerDocumentProcessing({ documentId, fileUrl, userId })`**:
- Sends Inngest event `document/process`
- Fire-and-forget (`void`); errors logged but don't block upload

### `uploadthing.ts`
Re-exports typed `UploadButton` and `UploadDropzone` components bound to `OurFileRouter` type.

### `format.ts`
- **`formatFileSize(bytes)`** — human-readable B/KB/MB
- **`formatRelativeDate(date)`** — "Just now", "5m ago", "3d ago", or formatted date

---

## 9. API Routes (`src/app/api/`)

### `POST /api/chat` — RAG Chat (streaming)

**File:** `src/app/api/chat/route.ts`

**Request body:**
```json
{
  "messages": [/* UIMessage[] from AI SDK */],
  "documentId": "cuid...",
  "chatId": "optional-cuid"
}
```

**Logic:**
1. Auth check via Clerk
2. Extract last user message text from `messages` array
3. Parallel: fetch document + create/find chat
4. Verify document belongs to user and status is `READY`
5. Parallel: retrieve chunks + save user message
6. Build system prompt, trim history to `CHAT_HISTORY_LIMIT`
7. `streamText()` with Gemini → `toTextStreamResponse()`
8. Response header `X-Chat-Id` contains chat session ID
9. `onFinish` saves assistant message to DB

**`maxDuration`:** 60 seconds (Vercel/serverless limit)

### `GET /api/chat?documentId=&chatId=` — Load Chat History

Returns `{ chatId, messages }` as UIMessage format. If no chat exists, returns `{ chatId: null, messages: [] }`.

### `POST /api/documents/create` — Manual Document Record

**File:** `src/app/api/documents/create/route.ts`

Fallback API if UploadThing callback didn't create the DB record. Accepts `{ filename, fileUrl, fileSize }`, deduplicates by `fileUrl`, creates document, triggers Inngest.

### `GET/POST /api/uploadthing` — UploadThing Handler

**Files:** `src/app/api/uploadthing/route.ts`, `core.ts`

**`pdfUploader` route:**
- Accepts PDF, max 16 MB, 1 file
- Middleware: `getOrCreateUser()` → passes `userId`
- `onUploadComplete`: create Document + trigger Inngest
- Returns `{ documentId }` as server data

### `GET/POST/PUT /api/inngest` — Inngest Webhook

**File:** `src/app/api/inngest/route.ts`

Registers `processDocument` function. In local dev, run `npm run dev:inngest` to connect Inngest dev server.

---

## 10. Frontend Pages & Layouts

### `src/app/layout.tsx` — Root Layout
- Wraps app in `ClerkProvider`
- Loads Inter font, global CSS, UploadThing styles
- Metadata: title "DocMind — Chat with your PDFs"

### `src/app/page.tsx` — Landing Page
- Server component: redirects authenticated users to `/dashboard`
- Marketing hero + 3 feature cards + sign-in/sign-up CTAs

### `src/app/(auth)/layout.tsx`
- Centered auth layout with logo header and gradient background

### `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Renders Clerk `<SignIn />` with custom card styling

### `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Renders Clerk `<SignUp />`

### `src/app/(dashboard)/layout.tsx`
- Sticky header: Logo + Clerk `UserButton`
- `NavigationProgress` bar for route transitions
- Main content area max-width 5xl

### `src/app/(dashboard)/dashboard/page.tsx`
- **Dashboard home:** upload zone + document stats + document grid
- Uses React `Suspense` with skeleton fallbacks for async server components

### `src/app/(dashboard)/documents/page.tsx`
- Simple redirect to `/dashboard`

### `src/app/(dashboard)/documents/[documentId]/chat/page.tsx`
- Wraps `ChatPageContent` in Suspense
- Dynamic route param: `documentId`

### Loading States
- `(dashboard)/loading.tsx` — dashboard skeleton
- `documents/[documentId]/chat/loading.tsx` — chat page skeleton

---

## 11. React Components

### Server Components (fetch data on server)

| Component | File | Purpose |
|-----------|------|---------|
| `DocumentStats` | `documents-list.tsx` | Counts documents by status (total/ready/processing) |
| `DocumentsGrid` | `documents-list.tsx` | Lists user's documents as cards |
| `ChatPageContent` | `chat-page-content.tsx` | Loads document + chat history, renders chat or processing UI |
| `DocumentCard` | `document-card.tsx` | Link card showing filename, size, pages, status |

### Client Components (`"use client"`)

| Component | File | Purpose |
|-----------|------|---------|
| `DocumentUpload` | `document-upload.tsx` | UploadThing dropzone; redirects to chat after upload |
| `DocumentChat` | `document-chat.tsx` | Full chat UI using `useChat` + streaming |
| `ProcessingStatus` | `processing-status.tsx` | Spinner + auto-refresh every 5s while PROCESSING |
| `NavigationProgress` | `navigation-progress.tsx` | Top loading bar on internal navigation |
| `LinkPendingIndicator` | `navigation-progress.tsx` | Dims link text while navigating |

### Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `Logo` | `logo.tsx` | Brand logo with gradient icon; links to dashboard or home |
| `StatusBadge` | `status-badge.tsx` | Colored pill: Ready / Processing / Failed |
| `DocumentsListSkeleton` | `skeletons.tsx` | Loading placeholder for document list |
| `ChatPageSkeleton` | `skeletons.tsx` | Loading placeholder for chat page |
| `StatsSkeleton` | `skeletons.tsx` | Loading placeholder for stats row |

### `DocumentChat` Details
- Uses `@ai-sdk/react` `useChat` hook
- Transport: `TextStreamChatTransport` pointing to `/api/chat`
- Passes `{ documentId, chatId }` in request body
- Suggestion chips for empty state
- Auto-scrolls to bottom on new messages
- Shows typing indicator while streaming

### `ChatPageContent` Details
- Server component: validates document ownership
- Dynamically imports `DocumentChat` (code splitting)
- Shows `ProcessingStatus` while PROCESSING
- Shows error UI when FAILED
- Only renders chat when READY

---

## 12. Configuration Files

### `src/proxy.ts` (Next.js 16 Middleware)
- Uses Clerk `clerkMiddleware`
- **Public routes** (no auth required): `/`, `/sign-in`, `/sign-up`, `/api/inngest`, `/api/uploadthing`
- All other routes: `auth.protect()`
- Note: In Next.js 16, `middleware.ts` was renamed to `proxy.ts`

### `next.config.ts`
```ts
serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"]
```
Required because pdf-parse uses native/worker modules that can't be bundled.

### `prisma.config.ts`
- Loads `.env.local` via dotenv
- Schema path: `prisma/schema.prisma`
- Migrations path: `prisma/migrations`
- Uses `DIRECT_URL` for datasource (direct DB connection for migrations)

### `tailwind.config.ts`
- Content: `./src/**/*.{js,ts,jsx,tsx,mdx}`
- Custom animations: `fade-in`, `pulse-soft`
- Border radius tied to CSS variable `--radius`

### `src/app/globals.css`
- Tailwind v4 with `@import "tailwindcss"`
- CSS custom properties for light/dark theme (accent indigo, success green, etc.)
- Utility classes: `.mesh-gradient`, `.glass`, `.scrollbar-thin`
- Keyframe animations: fade-in, pulse-soft, shimmer, spin-slow

### `tsconfig.json`
- Path alias: `@/*` → `./src/*`
- Strict mode enabled
- Next.js plugin for type generation

### `package.json` Scripts
| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Development server |
| `dev:inngest` | `inngest-cli dev -u localhost:3000/api/inngest` | Local Inngest dev server |
| `build` | `next build` | Production build |
| `lint` | `eslint . --max-warnings 0` | Linting |
| `type-check` | `tsc --noEmit` | TypeScript validation |
| `prisma:generate` | `prisma generate` | Regenerate Prisma client |
| `postinstall` | `prisma generate` | Auto-generate on npm install |

---

## 13. Key Design Decisions

1. **Dual storage for chunks:** Text in PostgreSQL, vectors in Pinecone. Pinecone metadata is minimal (IDs only); full text fetched from DB when needed.

2. **User isolation:** Every Pinecone query filters by both `documentId` AND `userId`. Every DB query filters by `userId`.

3. **Idempotent uploads:** Both UploadThing callback and `/api/documents/create` check for existing document by `fileUrl` before creating.

4. **Inngest steps:** Each pipeline stage is an Inngest `step.run()` for durability, retries, and observability.

5. **Embedding modes:** Google Gemini uses different `taskType` for queries vs documents (`RETRIEVAL_QUERY` vs `RETRIEVAL_DOCUMENT`) for better retrieval quality.

6. **Chat history trimming:** Only last N messages sent to model (configurable) to control token usage and cost.

7. **Processing UX:** Client polls via `router.refresh()` every 5 seconds instead of WebSockets — simple and effective for MVP.

8. **Clerk ID as User PK:** No separate UUID; Clerk's user ID is the database primary key, avoiding sync issues.

9. **Next.js 16 conventions:** Uses `proxy.ts` instead of deprecated `middleware.ts`.

10. **Plan enum exists but PRO features not implemented:** `User.plan` is stored but unused in business logic.

---

## 14. Local Development Setup

```bash
# 1. Clone and install
npm ci

# 2. Environment
cp .env.example .env.local
# Fill in all API keys

# 3. Database
npx prisma migrate dev   # if migrations exist
# or: npx prisma db push

# 4. Run (two terminals)
npm run dev              # Terminal 1: Next.js on :3000
npm run dev:inngest      # Terminal 2: Inngest dev server

# 5. Open http://localhost:3000
```

**Required external services:**
- PostgreSQL database (local or Neon)
- Clerk app (auth)
- UploadThing app (file uploads)
- Google AI Studio API key (Gemini)
- Pinecone account (vector index — auto-created on first use)
- Inngest account (background jobs — dev server works locally)

---

## 15. Glossary

| Term | Meaning |
|------|---------|
| **RAG** | Retrieval-Augmented Generation — LLM answers using retrieved context |
| **Embedding** | Numeric vector representing text meaning for similarity search |
| **Chunk** | A slice of document text (~1000 chars) used for retrieval |
| **Pinecone** | Managed vector database for similarity search |
| **Inngest** | Background job/workflow platform (like a durable task queue) |
| **UploadThing** | File upload service with Next.js integration |
| **Clerk** | Authentication-as-a-service (sign-in, sessions, user management) |
| **AI SDK** | Vercel's library for streaming LLM responses (`useChat`, `streamText`) |
| **UIMessage** | AI SDK message format with `parts` array (text, tools, etc.) |
| **Proxy** | Next.js 16 name for middleware (runs before every matched route) |
| **CUID** | Collision-resistant unique ID used for documents, chunks, chats |

---

## Quick Reference: File → Responsibility

| File | One-line summary |
|------|------------------|
| `src/proxy.ts` | Protect routes with Clerk auth |
| `src/lib/prisma.ts` | Database client |
| `src/lib/user.ts` | Sync Clerk user to DB |
| `src/lib/pdf.ts` | Extract PDF text |
| `src/lib/chunker.ts` | Split text into chunks |
| `src/lib/embeddings.ts` | Generate Gemini embeddings |
| `src/lib/pinecone.ts` | Vector DB client |
| `src/lib/retrieval.ts` | Search relevant chunks for RAG |
| `src/lib/prompt.ts` | Build chat system prompt |
| `src/lib/inngest-functions.ts` | PDF processing pipeline |
| `src/app/api/chat/route.ts` | Chat API (RAG + stream) |
| `src/app/api/uploadthing/core.ts` | Upload config + post-upload hook |
| `src/app/components/document-upload.tsx` | Upload UI |
| `src/app/components/document-chat.tsx` | Chat UI |
| `src/app/components/chat-page-content.tsx` | Chat page server wrapper |
| `src/app/(dashboard)/dashboard/page.tsx` | Main dashboard |
| `prisma/schema.prisma` | Database schema |

---

*Generated for DocMind v0.1.0 — Next.js 16 + React 19 + Prisma 7*
