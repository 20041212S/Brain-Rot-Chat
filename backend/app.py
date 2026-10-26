import os
from typing import Literal
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from dataset import brainrot_dataset
from persona import build_system_prompt
from web_search import get_live_internet_intel

load_dotenv()

app = FastAPI(title="BRAINROT AI API", version="0.1.0")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=12000)

class ChatRequest(BaseModel):
    messages: list[Message] = Field(min_length=1, max_length=40)

@app.get("/health")
async def health():
    return {
        "ok": True,
        "name": "BRAINROT AI",
        "version": "0.1.0",
        "dataset_examples": brainrot_dataset.total_examples,
    }

@app.post("/api/chat")
async def chat(req: ChatRequest):
    base_url = os.getenv("LLM_BASE_URL", "").strip().rstrip("/")
    api_key = os.getenv("LLM_API_KEY", "").strip()
    model = os.getenv("LLM_MODEL", "").strip()
    if not base_url or not model:
        raise HTTPException(status_code=503, detail="Configure LLM_BASE_URL and LLM_MODEL in backend/.env.")
    if not api_key or api_key == "replace_me":
        raise HTTPException(status_code=503, detail="Configure LLM_API_KEY in backend/.env. Keep it on the backend, never in the frontend.")

    last_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
    examples = brainrot_dataset.get_relevant_examples(last_user_msg, limit=2)
    few_shot_prompt = brainrot_dataset.format_few_shot_prompt(examples)

    # Search live internet for slang, memes, and online culture
    internet_intel = await get_live_internet_intel(last_user_msg)
    intel_prompt = f"LIVE INTERNET INTEL:\n{internet_intel}" if internet_intel else ""

    full_system_prompt = build_system_prompt(few_shot_prompt, intel_prompt)

    if internet_intel:
        print(f"[UNCENSORED] Fetched live internet intel for: '{last_user_msg[:40]}'")

    temperature = 0.95

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": full_system_prompt},
            *[m.model_dump() for m in req.messages],
        ],
        "temperature": temperature,
        "max_tokens": int(os.getenv("LLM_MAX_TOKENS", "800")),
    }
    reasoning_effort = os.getenv("LLM_REASONING_EFFORT", "").strip()
    if reasoning_effort:
        payload["reasoning_effort"] = reasoning_effort
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
        if response.status_code >= 400:
            detail = response.text[:1200]
            raise HTTPException(status_code=502, detail=f"Model provider error ({response.status_code}): {detail}")
        data = response.json()
        answer = data["choices"][0]["message"]["content"]
        return {
            "reply": answer,
            "model": model,
            "mode": "uncensored",
        }
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Could not get a valid model response: {exc.__class__.__name__}")
