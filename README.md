# BRAINROT AI

A Gen Z brainrot chatbot with adaptive personality and roast mode. The app owns its personality layer and supports any OpenAI-compatible chat API, including hosted providers and local inference servers.

## Requirements
- Python 3.10+
- Node.js 18+
- An API key for your chosen chat provider (unless using a local endpoint)

## 1. Configure the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:
- `LLM_BASE_URL`: OpenAI-compatible API base URL
- `LLM_API_KEY`: your provider key
- `LLM_MODEL`: model name supported by your provider

Do not put API keys in the frontend or commit `.env`.

For a local OpenAI-compatible server, set its base URL and model name accordingly. The backend defaults to `http://localhost:11434/v1` and `llama3.2` as an example configuration, but you must have a compatible server/model running.

## 2. Run the backend

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Health check: http://127.0.0.1:8000/health

## 3. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

## Deploy to Vercel (one project, two services)

The root `vercel.json` deploys both apps as **Vercel Services** on one domain:

- `/` → Vite frontend
- `/api/*` → FastAPI backend
- `/health` → FastAPI health check

Because both run on the same origin, the frontend calls `/api/chat` directly and CORS is not involved.

### 1. Import the repo

In Vercel, choose **Add New → Project** and import this repo. Keep the **Root Directory** as the repository root so Vercel reads `vercel.json`.

### 2. Add environment variables

Project → **Settings → Environment Variables** (Production and Preview):

| Variable | Value |
| --- | --- |
| `LLM_BASE_URL` | e.g. `https://api.groq.com/openai/v1` |
| `LLM_API_KEY` | your provider key |
| `LLM_MODEL` | e.g. `openai/gpt-oss-120b` |
| `LLM_MAX_TOKENS` | `800` |
| `CORS_ORIGINS` | your Vercel URL, e.g. `https://your-app.vercel.app` |

Optional: `LLM_REASONING_EFFORT`.

Do **not** set `VITE_API_URL` for the Vercel deployment. Same-origin `/api` calls are what you want.

### 3. Deploy and test

After deploying:

- `https://<project>.vercel.app/` → chat UI
- `https://<project>.vercel.app/health` → `{"ok":true,...}`

### Local development

The frontend defaults to `http://127.0.0.1:8000` in dev. To point it somewhere else, set `VITE_API_URL` in `frontend/.env.local`.

### Notes

- `backend/data.txt` is bundled with the backend service.
- `maxDuration` is set to 60 seconds in `vercel.json`.
- If you prefer two separate Vercel projects, set the backend Root Directory to `backend` and set `VITE_API_URL` in the frontend project to the backend URL.

## Personality modes
- **Adaptive**: medium-high brainrot; funny when casual, accurate and short when technical.
- **Roast**: high brainrot with surgical roasts, then the actual answer.
- **Uncensored**: maximum brainrot, unhinged group-chat energy, still lands the correct answer.

The voice lives in `backend/persona.py` (slang bank, style anchors, mode prompts), so you can tune brainrot density without touching the API wiring.

## What "our own LLM" means in this MVP
This first version is our own chatbot product and personality system, using a configurable model backend. It does not claim that model weights were trained from scratch. Next steps are to collect consented example conversations, build a curated training set, evaluate models, then fine-tune an open-weight model with LoRA/QLoRA and serve it locally.

## Troubleshooting
- `LLM_API_KEY` missing: set it in `backend/.env`. For local inference, some servers accept a placeholder key; configure it according to your server.
- Model not found: set `LLM_MODEL` to a model name your provider supports.
- CORS: frontend dev server is allowed by default at `http://localhost:5173`; change `CORS_ORIGINS` if needed.
