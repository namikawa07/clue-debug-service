"""
AI Agent endpoint — proxies chat completions to Hugging Face Router API.
Keeps HF_TOKEN server-side only.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal, Union
import httpx
import logging

from ...config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Model mapping ────────────────────────────────────────────────────────────
MODELS = {
    "kimi": "moonshotai/Kimi-K2.5:fireworks-ai",
    "qwen": "Qwen/Qwen3-Coder-Next:novita",
}

HF_API_URL = "https://router.huggingface.co/v1/chat/completions"


# ── Request / Response schemas ───────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: Union[str, list]          # string for most cases, list for Kimi image messages


class AiAgentRequest(BaseModel):
    model: Literal["kimi", "qwen"]
    messages: List[ChatMessage]


class AiAgentResponse(BaseModel):
    content: str
    role: str = "assistant"


# ── Endpoint ─────────────────────────────────────────────────────────────────
@router.post("", response_model=AiAgentResponse)
async def ai_agent_chat(body: AiAgentRequest):
    """Forward a chat-completion request to Hugging Face and return the reply."""

    hf_token = settings.HF_TOKEN
    if not hf_token:
        raise HTTPException(status_code=500, detail="HF_TOKEN is not configured on the server.")

    model_id = MODELS[body.model]

    payload = {
        "model": model_id,
        "messages": [msg.model_dump() for msg in body.messages],
    }

    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(HF_API_URL, headers=headers, json=payload)

        if response.status_code != 200:
            detail = response.json().get("error", response.text)
            logger.error(f"HF API error {response.status_code}: {detail}")
            raise HTTPException(status_code=response.status_code, detail=detail)

        data = response.json()
        ai_message = data["choices"][0]["message"]

        return AiAgentResponse(content=ai_message["content"], role=ai_message.get("role", "assistant"))

    except httpx.RequestError as exc:
        logger.error(f"HF request failed: {exc}")
        raise HTTPException(status_code=502, detail=f"Failed to reach AI service: {exc}")
