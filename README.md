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

## Deploy to Vercel

Deploy the frontend and backend as **two Vercel projects**. Vercel auto-detects the FastAPI `app` in `backend/app.py`, so no custom handler is needed.

### Backend project

1. In Vercel, choose **Add New → Project** and import this repo.
2. Set **Root Directory** to `backend`.
3. Keep the framework preset as **FastAPI** and leave build settings on default.
4. Add these Environment Variables (Production and Preview):

| Variable | Value |
| --- | --- |
| `LLM_BASE_URL` | e.g. `https://api.groq.com/openai/v1` |
| `LLM_API_KEY` | your provider key |
| `LLM_MODEL` | e.g. `openai/gpt-oss-120b` |
| `LLM_MAX_TOKENS` | `800` |
| `CORS_ORIGINS` | your frontend URL, e.g. `https://your-app.vercel.app` |

Optional: `LLM_REASONING_EFFORT`.

5. Deploy, then open `https://<backend-project>.vercel.app/health`. It should return `{"ok":true,...}`.

`backend/data.txt` is a copy of the slang dataset so it gets bundled into the serverless function. `backend/vercel.json` sets the function timeout to 60 seconds.

### Point the frontend at the backend

In the **frontend** Vercel project, add:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://<backend-project>.vercel.app` |

Vite reads `VITE_*` variables at build time, so **redeploy the frontend** after adding it.

### CORS notes

- `CORS_ORIGINS` is comma-separated: `https://your-app.vercel.app,http://localhost:5173`.
- Preview deployments use a different URL each time. Add the preview origin to `CORS_ORIGINS`, or set `CORS_ORIGINS=*` since the API uses no cookies.

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
