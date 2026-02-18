"""
AI Agent endpoint — agentic loop with tool calling.

Flow:
  1. Frontend sends {message, workspaceId, model, chatHistory}
  2. Backend builds messages with system prompt + tool schemas
  3. Calls HuggingFace chat/completions
  4. If AI returns tool_calls → execute them via executor, feed results back
  5. Loop until AI gives a final text response (max 10 iterations)
  6. Return final response to frontend
"""

import json
import logging
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from ...config import settings
from ...database import get_db
from ..deps import get_current_user
from ...models.user import User
from .tools.definitions import TOOL_SCHEMAS
from .tools.executor import execute_tool

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Constants ────────────────────────────────────────────────────────────────
MODELS = {
    "kimi": "moonshotai/Kimi-K2.5:fireworks-ai",
    "qwen": "Qwen/Qwen3-Coder-Next:novita",
}

HF_API_URL = "https://router.huggingface.co/v1/chat/completions"
MAX_AGENT_ITERATIONS = 10

SYSTEM_PROMPT = """You are FinePro AI, a project management assistant.
You have tools to read and write workspace data (tasks, members, spaces).

Response formatting rules:
- Be concise and direct. No filler words, no dashes (—), no unnecessary padding.
- When mentioning a member, always use this exact format: @[MemberName](member:userId)
  Example: @[Mohammed anfas](member:3es4e2ml781i)
- When mentioning a task you created or found, use this exact format: #[TaskTitle](task:taskId)
  Example: #[Fix navbar](task:tsk_abc123)
- Keep responses short. One or two sentences max for confirmations.

Tool usage rules:
- Call get_spaces before create_task to find the correct space_id.
- Call get_members before assigning a task to resolve the name to an ID.
- Do NOT make up data. Only report what the tools return.
- If the request is ambiguous, ask for clarification.
"""



# ── Request / Response schemas ───────────────────────────────────────────────
class ChatHistoryItem(BaseModel):
    role: str
    content: str


class AiAgentRequest(BaseModel):
    message: str
    workspaceId: str
    model: Literal["kimi", "qwen"] = "qwen"
    chatHistory: Optional[List[ChatHistoryItem]] = None


class AiAgentResponse(BaseModel):
    content: str
    role: str = "assistant"
    tool_calls_made: Optional[List[str]] = None  # names of tools that were invoked


# ── Endpoint ─────────────────────────────────────────────────────────────────
@router.post("", response_model=AiAgentResponse)
async def ai_agent_chat(
    body: AiAgentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Agentic AI chat with tool calling."""

    hf_token = settings.HF_TOKEN
    if not hf_token:
        raise HTTPException(status_code=500, detail="HF_TOKEN is not configured on the server.")

    model_id = MODELS[body.model]
    workspace_id = body.workspaceId
    user_id = str(current_user.id)

    # Build conversation messages
    user_context = f"Current User: {current_user.name} (ID: {str(current_user.id)})"
    
    refined_prompt = SYSTEM_PROMPT + f"\n\nContext:\n{user_context}\n"
    refined_prompt += "If the user says 'me' or 'assign to myself', use the Current User ID.\n"
    refined_prompt += "If the user specifies a name or role (e.g. 'developer'), call get_members to find the ID. Do NOT guess.\n"
    refined_prompt += "Spaces (e.g. 'jjkjdsfd') are just containers. They do NOT restrict which members can be assigned. You can assign ANY workspace member to ANY space.\n"
    refined_prompt += "If no space is specified, the system will pick the default. You don't need to ask."

    messages = [{"role": "system", "content": refined_prompt}]

    # Add chat history
    if body.chatHistory:
        for item in body.chatHistory:
            role = "assistant" if item.role == "ai" else "user"
            messages.append({"role": role, "content": item.content})

    # Add current user message
    messages.append({"role": "user", "content": body.message})

    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/json",
    }

    tools_used: List[str] = []

    # ── Agent loop ───────────────────────────────────────────────────────
    for iteration in range(MAX_AGENT_ITERATIONS):
        payload = {
            "model": model_id,
            "messages": messages,
            "tools": TOOL_SCHEMAS,
            "tool_choice": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(HF_API_URL, headers=headers, json=payload)

            if response.status_code != 200:
                error_text = response.text
                try:
                    error_data = response.json()
                    error_text = error_data.get("error", error_text)
                except Exception:
                    pass
                logger.error(f"HF API error {response.status_code}: {error_text}")
                raise HTTPException(status_code=response.status_code, detail=error_text)

            data = response.json()
            choice = data["choices"][0]
            assistant_msg = choice["message"]

            # ── Check for tool calls ─────────────────────────────────────
            tool_calls = assistant_msg.get("tool_calls")

            if not tool_calls:
                # AI gave a final text response — we're done
                final_content = assistant_msg.get("content", "")
                return AiAgentResponse(
                    content=final_content,
                    role="assistant",
                    tool_calls_made=tools_used if tools_used else None,
                )

            # ── Execute each tool call ───────────────────────────────────
            # Append the assistant message (with tool_calls) to history
            messages.append(assistant_msg)

            for tool_call in tool_calls:
                fn = tool_call["function"]
                tool_name = fn["name"]
                try:
                    tool_args = json.loads(fn["arguments"]) if isinstance(fn["arguments"], str) else fn["arguments"]
                except json.JSONDecodeError:
                    tool_args = {}

                logger.info(f"Agent loop [{iteration}] calling tool: {tool_name}({tool_args})")
                tools_used.append(tool_name)

                # Execute the tool
                result = await execute_tool(
                    name=tool_name,
                    arguments=tool_args,
                    db=db,
                    workspace_id=workspace_id,
                    user_id=user_id,
                )

                # Append tool result as a message
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": result,
                })

        except httpx.RequestError as exc:
            logger.error(f"HF request failed: {exc}")
            raise HTTPException(status_code=502, detail=f"Failed to reach AI service: {exc}")

    # If we hit max iterations, return what we have
    return AiAgentResponse(
        content="I ran into a complex situation and reached my processing limit. Could you try rephrasing your request?",
        role="assistant",
        tool_calls_made=tools_used if tools_used else None,
    )
