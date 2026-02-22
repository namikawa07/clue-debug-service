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
MAX_AGENT_ITERATIONS = 25

SYSTEM_PROMPT = """You are FinePro AI, a comprehensive project management assistant.
You have tools to manage: tasks, spaces, epics, teams, and members.

Workspace hierarchy: Workspace → Spaces → Epics → Tasks
- Tasks MUST belong to an epic. Epics belong to spaces.
- Teams are groups of workspace members. Members can be in multiple teams.

Response formatting rules:
- Be concise and direct. No filler words, no dashes, no unnecessary padding.
- When mentioning a member, always use: @[MemberName](member:userId)
- When mentioning a task, always use: #[TaskTitle](task:taskId)
- Keep responses short. One or two sentences max for confirmations.

Tool usage rules:
- Call get_spaces before create_task if you need a space_id.
- Call get_members before assigning tasks to resolve names to IDs.
- Call get_teams to see existing teams and their members.
- Call get_epics to see epics in a space before creating tasks.
- For destructive operations (delete_task, delete_space, delete_team), confirm with the user first.
- Do NOT make up data. Only report what the tools return.
- If the request is ambiguous, ask for clarification.

Team-aware features:
- You can create teams, add/remove members, and list team compositions.
- When users ask about team workload, use get_tasks filtered by assignee for each team member.
- When users want to assign work to a team, get the team members first, then assign appropriately.

Intelligent project planning:
- When users give high-level project instructions (e.g. "build a website for X in 2 weeks"), use plan_project.
- plan_project returns workspace context (members, teams, spaces). YOU generate the detailed plan.
- Present the plan in a clear table/list format showing epics, tasks, assignments, and timeline.
- Ask the user to confirm before calling execute_plan.
- After confirmation, call execute_plan, then use create_space, create_epic, create_task to build everything.
- Spread tasks across team members. Set realistic deadlines. Include testing and deployment.
"""



# ── Request / Response schemas ───────────────────────────────────────────────
class ChatHistoryItem(BaseModel):
    role: str
    content: str


class PageContextItem(BaseModel):
    pageName: Optional[str] = None
    spaceId: Optional[str] = None
    epicId: Optional[str] = None
    taskId: Optional[str] = None


class AiAgentRequest(BaseModel):
    message: str
    workspaceId: str
    model: Literal["kimi", "qwen"] = "qwen"
    chatHistory: Optional[List[ChatHistoryItem]] = None
    pageContext: Optional[PageContextItem] = None


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
    refined_prompt += "If no space is specified, the system will pick the default. You don't need to ask.\n"

    # ── Page context — tells the AI where the user currently is ───
    page_context = body.pageContext
    if page_context:
        refined_prompt += f"\nCurrent page context:\n"
        refined_prompt += f"- Page: {page_context.pageName or 'unknown'}\n"
        if page_context.spaceId:
            refined_prompt += f"- Current space_id: {page_context.spaceId}\n"
        if page_context.epicId:
            refined_prompt += f"- Current epic_id: {page_context.epicId}\n"
        if page_context.taskId:
            refined_prompt += f"- Current task_id: {page_context.taskId}\n"
        refined_prompt += "When the user says 'here', 'this space', 'this epic', or similar, use the IDs from the page context above.\n"
        refined_prompt += "When creating tasks and the user doesn't specify a space, use the current space_id from page context if available.\n"

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
                    page_context={
                        "space_id": page_context.spaceId if page_context else None,
                        "epic_id": page_context.epicId if page_context else None,
                        "task_id": page_context.taskId if page_context else None,
                    },
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
