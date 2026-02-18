"""
Tool executor — dispatches AI tool calls to the appropriate backend services.
"""

import json
import logging
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.task_service import TaskService
from app.services.member_service import MemberService
from app.services.space_service import SpaceService
from app.schemas.task import TaskCreate, TaskUpdate
from app.models.enums import TaskStatus, Priority, TaskType

logger = logging.getLogger(__name__)


async def execute_tool(
    name: str,
    arguments: dict,
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
) -> str:
    """
    Execute a tool by name and return a JSON string result.
    This bridges AI tool calls → existing backend services.
    """
    try:
        if name == "get_tasks":
            return await _get_tasks(arguments, db, workspace_id)

        elif name == "create_task":
            return await _create_task(arguments, db, workspace_id, user_id)

        elif name == "update_task":
            return await _update_task(arguments, db, user_id)

        elif name == "get_members":
            return await _get_members(db, workspace_id)

        elif name == "get_spaces":
            return await _get_spaces(db, workspace_id)

        else:
            return json.dumps({"error": f"Unknown tool: {name}"})

    except Exception as e:
        logger.error(f"Tool '{name}' failed: {e}", exc_info=True)
        # vital: rollback to clear the transaction state for subsequent queries
        await db.rollback()
        return json.dumps({"error": str(e)})


# ── Individual tool implementations ──────────────────────────────────────────

async def _get_tasks(args: dict, db: AsyncSession, workspace_id: str) -> str:
    service = TaskService(db)

    status = TaskStatus(args["status"]) if args.get("status") else None
    priority = Priority(args["priority"]) if args.get("priority") else None

    tasks = await service.get_by_workspace(
        workspace_id=workspace_id,
        status=status,
        priority=priority,
        assigned_to=args.get("assigned_to"),
        search=args.get("search"),
        limit=20,
    )

    result = []
    for t in tasks:
        result.append({
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "status": t.status.value if t.status else "todo",
            "priority": t.priority.value if t.priority else "medium",
            "assigned_to": str(t.assigned_to) if t.assigned_to else None,
            "assignee_name": t.assigned_user.name if t.assigned_user else None,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "space_id": str(t.space_id) if t.space_id else None,
        })

    return json.dumps({"tasks": result, "count": len(result)})


async def _create_task(args: dict, db: AsyncSession, workspace_id: str, user_id: str) -> str:
    service = TaskService(db)

    space_id = args.get("space_id")
    space_service = SpaceService(db)
    workspace_spaces = await space_service.get_by_workspace(workspace_id)
    
    if not workspace_spaces:
        return json.dumps({"error": "No spaces found in workspace. Create a space first."})

    # Logic for space resolution
    target_space = None
    if space_id:
        target_space = next((s for s in workspace_spaces if s.id == space_id), None)
        if not target_space:
             target_space = next((s for s in workspace_spaces if s.name.lower() == space_id.lower()), None)
    
    # Default space preference
    if not target_space:
        target_space = next((s for s in workspace_spaces if s.id == "2wiv30eii8p6"), None)

    if not target_space:
        target_space = workspace_spaces[0]
        logger.info(f"Using default space: {target_space.name} ({target_space.id})")

    space_id = target_space.id

    # Specific user mapping
    assigned_to = args.get("assigned_to")
    if assigned_to and assigned_to.lower() == "developer":
        assigned_to = "3es4e2ml781i"  # Mohammed anfas K P

    # Default Epic
    epic_id = args.get("epic_id") or "hgna1d85xl"

    # Parse optional enums
    priority = Priority(args["priority"]) if args.get("priority") else Priority.MEDIUM
    status = TaskStatus(args["status"]) if args.get("status") else TaskStatus.TODO
    task_type = TaskType(args["task_type"]) if args.get("task_type") else TaskType.TASK

    # Parse due_date
    due_date = None
    if args.get("due_date"):
        try:
            due_date = datetime.fromisoformat(args["due_date"].replace("Z", "+00:00"))
        except ValueError:
            pass

    task_data = TaskCreate(
        title=args["title"],
        description=args.get("description"),
        priority=priority,
        status=status,
        task_type=task_type,
        assigned_to=assigned_to,
        epic_id=epic_id,
        due_date=due_date,
        estimated_hours=args.get("estimated_hours"),
        space_id=space_id,
        created_by=user_id,
    )

    task = await service.create(space_id=space_id, data=task_data, user_id=user_id)

    return json.dumps({
        "success": True,
        "task": {
            "id": task.id,
            "title": task.title,
            "status": task.status.value if task.status else "todo",
            "priority": task.priority.value if task.priority else "medium",
            "assigned_to": str(task.assigned_to) if task.assigned_to else None,
            "epic_id": str(task.epic_id) if task.epic_id else None,
            "space_id": str(task.space_id) if task.space_id else None,
            "due_date": task.due_date.isoformat() if task.due_date else None,
        }
    })


async def _update_task(args: dict, db: AsyncSession, user_id: str) -> str:
    service = TaskService(db)

    task_id = args.get("task_id")
    if not task_id:
        return json.dumps({"error": "task_id is required"})

    update_fields = {}
    if args.get("title"):
        update_fields["title"] = args["title"]
    if args.get("description"):
        update_fields["description"] = args["description"]
    if args.get("status"):
        update_fields["status"] = TaskStatus(args["status"])
    if args.get("priority"):
        update_fields["priority"] = Priority(args["priority"])
    if args.get("assigned_to"):
        update_fields["assigned_to"] = args["assigned_to"]
    if args.get("due_date"):
        try:
            update_fields["due_date"] = datetime.fromisoformat(args["due_date"].replace("Z", "+00:00"))
        except ValueError:
            pass

    task_update = TaskUpdate(**update_fields)
    task = await service.update(task_id=task_id, data=task_update, user_id=user_id)

    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})

    return json.dumps({
        "success": True,
        "task": {
            "id": task.id,
            "title": task.title,
            "status": task.status.value if task.status else "todo",
            "priority": task.priority.value if task.priority else "medium",
            "assigned_to": str(task.assigned_to) if task.assigned_to else None,
        }
    })


async def _get_members(db: AsyncSession, workspace_id: str) -> str:
    service = MemberService(db)
    members = await service.list_workspace_members(workspace_id)

    result = []
    for m in members:
        result.append({
            "member_id": m.id,
            "user_id": str(m.user_id),
            "name": m.user.name if m.user else "Unknown",
            "email": m.user.email if m.user else "",
            "role": m.role.value if m.role else "member",
        })

    return json.dumps({"members": result, "count": len(result)})


async def _get_spaces(db: AsyncSession, workspace_id: str) -> str:
    service = SpaceService(db)
    spaces = await service.get_by_workspace(workspace_id)

    result = []
    for s in spaces:
        result.append({
            "id": s.id,
            "name": s.name,
            "description": s.description or "",
            "status": s.status.value if s.status else "planning",
        })

    return json.dumps({"spaces": result, "count": len(result)})
