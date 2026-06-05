# docmind

AI-powered document intelligence platform for uploading, indexing, searching, and chatting with documents using RAG.

## Getting Started

1. Copy environment variables:

```bash
cp .env.example .env.local
```

Fill in your API keys in `.env.local` (never commit this file).

2. Install dependencies and run the dev server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript validation |
| `npm run prisma:validate` | Validate Prisma schema |
| `npm run prisma:generate` | Generate Prisma client |

## Git Workflow

- `main` — production-ready code
- `develop` — integration branch
- `feature/*` — feature branches (PR into `develop`)

CI runs on every push and pull request via GitHub Actions.

## Deploy on Vercel

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme). See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.
