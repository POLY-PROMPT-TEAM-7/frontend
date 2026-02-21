# KG Study Tool Demo Web

Demo-ready Next.js web app for the KG Study Tool experience:

- Upload study materials
- Trigger extraction
- Explore an interactive knowledge graph
- Use filters/search/details and Study Path
- Export PNG snapshots

The app is designed to be **offline-demoable**. The browser only calls Next.js `/api/*` routes. Those routes proxy to `API_BASE_URL`, and the included `stub-api/` service provides a deterministic FastAPI implementation of the API contract.

## Stack

- Next.js App Router + TypeScript (strict)
- Tailwind v4
- Zustand
- react-force-graph-2d
- FastAPI stub API
- Docker Compose (`web` + `api`)
- Playwright smoke tests

## Quick Start (Local)

1. Install dependencies

```bash
pnpm install
```

2. Start the stub API (terminal A)

```bash
cd stub-api
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

3. Start the web app (terminal B)

```bash
pnpm dev
```

4. Open `http://localhost:3000`

## Quick Start (Docker)

```bash
docker compose up --build
```

Then open:

- Web: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

```env
API_BASE_URL=http://localhost:8000
```

Docker compose uses:

```env
API_BASE_URL=http://api:8000
```

## API Contract (Web-facing)

The browser talks only to these Next routes:

- `POST /api/upload`
- `POST /api/extract`
- `GET /api/graph/:graphId`
- `GET /api/node/:graphId/:nodeId`
- `GET /api/search/:graphId?q=...`
- `GET /api/health`
- `GET /api/demo/graph`

Route handlers proxy to the external API base URL server-side. Multipart upload is forwarded via `request.formData()` without manually setting `Content-Type`.

## Demo Script (Judge Flow)

1. Open landing page `/`.
2. Click **Upload materials** to enter `/app`.
3. Click **Load demo graph** (works even if API is down).
4. Use search for `Photosynthesis`.
5. Show details panel + Study Path panel.
6. Toggle filters (entity/relationship types).
7. Click **Export PNG**.

Optional API-backed flow:

1. Upload a `.txt`/`.pdf`/`.pptx`/`.docx` file.
2. Click **Build Knowledge Graph**.
3. Observe queued/processing/complete extraction status.

## Offline Mode

If the API is unreachable:

- `/api/health` marks API unavailable.
- `/app` shows offline banner.
- Demo graph remains fully usable via `/api/demo/graph` and bundled JSON.

## Playwright Smoke Tests

Install browsers once:

```bash
npx playwright install
```

Run tests:

```bash
npx playwright test
```

The smoke suite uses stable `data-testid` selectors and avoids direct canvas coordinate clicks.

## Switching to a Real API Later

1. Keep browser requests pointed at Next `/api/*` routes.
2. Set `API_BASE_URL` to your real backend.
3. Ensure the backend contract matches the payload types in `src/lib/types.ts`.
4. Keep `stub-api/` for local demos and CI smoke workflows.
