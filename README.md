# GrowEasy AI CSV Importer

AI-powered CSV importer that maps arbitrary lead exports (Facebook, Google Ads, Excel, CRM dumps) into standardized **GrowEasy CRM** records.

**Author:** Eykagra — [eykagragangwar2004@gmail.com](mailto:eykagragangwar2004@gmail.com)

**Live repo:** [github.com/Eykagra/Eykagra_GrowEasy](https://github.com/Eykagra/Eykagra_GrowEasy)

## Architecture

```
┌─────────────┐   preview (client)    ┌──────────────┐
│   Next.js   │ ────────────────────► │  Papa Parse  │
│  Frontend   │                       └──────────────┘
└──────┬──────┘
       │ confirm → POST /api/import/stream
       ▼
┌─────────────┐   up to 4 batches     ┌──────────────┐
│   Express   │   (100 rows max)      │   Gemini     │
│   Backend   │ ── round-robin ─────► │   Mistral    │
└─────────────┘   3 parallel/wave     └──────────────┘
```

## Features

- Drag & drop and file picker upload
- Client-side CSV preview (sticky headers, scrollable table)
- Confirm-before-import — no AI calls until user confirms
- AI field mapping with **parallel batch processing** (up to 3 batches at once)
- **Load balancing** across Gemini + Mistral when both keys are set
- NDJSON streaming progress during import
- Dark mode (no flash on load)
- Skipped record tracking with reasons
- Health endpoints for uptime monitoring
- Deployable on **Vercel** (frontend) + **Render** (backend)

## Prerequisites

- Node.js 20+
- [Gemini API key](https://aistudio.google.com/apikey) (supports `AIza` and `AQ.` keys)
- [Mistral API key](https://console.mistral.ai) (optional — fallback + parallel distribution)

## Quick Start

### 1. Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` — add at least `GEMINI_API_KEY`. Add `MISTRAL_API_KEY` for fallback and parallel distribution.

### 3. Run locally

```bash
# Terminal 1 — Backend (port 4000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Sample CSVs

| File | Rows | Use case |
|------|------|----------|
| `samples/facebook_leads.csv` | 5 | Quick smoke test |
| `samples/facebook_leads_30.csv` | 30 | 2 parallel batches |
| `samples/facebook_leads_100.csv` | 100 | Full 4-batch test |
| `samples/facebook_leads_120.csv` | 120 | Truncation warning |
| `samples/google_ads_export.csv` | — | Google Ads format |

## Health Checks

| Service | Endpoint |
|---------|----------|
| Backend | `GET /health` or `GET /api/health` |
| Frontend | `GET /api/health` |

```bash
curl http://localhost:4000/health
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (Render ping) |
| `GET` | `/api/health` | Same health check |
| `POST` | `/api/import` | Import CSV, JSON response |
| `POST` | `/api/import/stream` | Import with NDJSON progress |

## Batch Processing

| Setting | Default | Description |
|---------|---------|-------------|
| `BATCH_SIZE` | 25 | Rows per AI call |
| `MAX_BATCHES` | 4 | Max batches per import |
| `PARALLEL_BATCHES` | 3 | Concurrent batches per wave |
| **Max rows** | **100** | 25 × 4 |

Batches are distributed round-robin: batch 1 → Gemini, batch 2 → Mistral, etc.

## CRM Output Fields

`created_at`, `name`, `email`, `country_code`, `mobile_without_country_code`, `company`, `city`, `state`, `country`, `lead_owner`, `crm_status`, `crm_note`, `data_source`, `possession_time`, `description`

**Status values:** `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`

## Deployment

### Option A — Both on Vercel (recommended, one domain)

Uses [Vercel Services](https://vercel.com/docs/services) — frontend + backend from one repo.

1. Import repo at [vercel.com](https://vercel.com)
2. Set **Framework Preset** to **Services** (Vercel auto-detects `frontend` + `backend`)
3. Root `vercel.json` routes:
   - `/` → Next.js frontend
   - `/api/*` → Express backend
   - `/health` → backend health check
4. Add env vars in Vercel project settings:
   - `GEMINI_API_KEY`, `MISTRAL_API_KEY` (and other backend vars)
   - Leave `NEXT_PUBLIC_API_URL` **empty** (same-origin API calls)
5. Deploy

Ping health: `https://your-app.vercel.app/health`

### Option B — Split (Render + Vercel)

**Backend → Render:** root `backend`, health path `/health`, see `backend/render.yaml`

**Frontend → Vercel:** root `frontend`, set `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`

CORS auto-allows `*.vercel.app` domains.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | Google Gemini key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model |
| `MISTRAL_API_KEY` | — | Mistral key (fallback + load balance) |
| `MISTRAL_MODEL` | `mistral-small-latest` | Mistral model |
| `AI_PRIMARY` | `gemini` | Primary provider for round-robin order |
| `BATCH_SIZE` | `25` | Rows per batch |
| `MAX_BATCHES` | `4` | Max batches per import |
| `PARALLEL_BATCHES` | `3` | Parallel batches per wave |
| `MAX_RETRIES` | `3` | Retries per batch |
| `PORT` | `4000` | Server port (Render sets automatically) |
| `HOST` | `0.0.0.0` | Bind address for cloud |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origins (comma-separated) |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend URL |
| `NEXT_PUBLIC_BATCH_SIZE` | `25` | Display / client limits |
| `NEXT_PUBLIC_MAX_BATCHES` | `4` | Display / client limits |
| `NEXT_PUBLIC_PARALLEL_BATCHES` | `3` | Display / client limits |

## Testing

```bash
cd backend && npm test
cd ../frontend && npm run build
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/          # import, health
│   │   ├── services/        # AI, batch processor, CSV
│   │   ├── config/          # AI + batch config
│   │   └── prompts/         # extraction prompt
│   └── render.yaml
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── vercel.json
└── samples/
```

## License

MIT