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
