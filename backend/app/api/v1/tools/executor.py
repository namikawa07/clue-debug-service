"""
Tool executor — dispatches AI tool calls to the appropriate backend services.
"""

import json
import logging
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

import uuid
from app.services.task_service import TaskService
from app.services.member_service import MemberService
from app.services.space_service import SpaceService
from app.services.epic_service import EpicService
from app.services.team_service import TeamService
from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.space import SpaceCreate, SpaceUpdate
from app.schemas.epic import EpicCreate, EpicUpdate
from app.schemas.team import TeamCreate, TeamUpdate
from app.models.enums import TaskStatus, Priority, TaskType

# In-memory plan cache (plans are short-lived, cleared after execution)
_plan_cache: dict[str, dict] = {}

logger = logging.getLogger(__name__)


async def execute_tool(
    name: str,
    arguments: dict,
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
    page_context: dict | None = None,
) -> str:
    """
    Execute a tool by name and return a JSON string result.
    page_context carries the user's current URL context (space_id, epic_id, task_id).
    """
    ctx = page_context or {}
    try:
        # Tasks
        if name == "get_tasks":
            return await _get_tasks(arguments, db, workspace_id)
        elif name == "create_task":
            return await _create_task(arguments, db, workspace_id, user_id, ctx)
        elif name == "update_task":
            return await _update_task(arguments, db, user_id)
        elif name == "delete_task":
            return await _delete_task(arguments, db, user_id)

        # Members
        elif name == "get_members":
            return await _get_members(db, workspace_id)

        # Spaces
        elif name == "get_spaces":
            return await _get_spaces(db, workspace_id)
        elif name == "create_space":
            return await _create_space(arguments, db, workspace_id, user_id)
        elif name == "update_space":
            return await _update_space(arguments, db, user_id)
        elif name == "delete_space":
            return await _delete_space(arguments, db, user_id)

        # Epics
        elif name == "get_epics":
            return await _get_epics(arguments, db, ctx)
        elif name == "create_epic":
            return await _create_epic(arguments, db, user_id, ctx)
        elif name == "update_epic":
            return await _update_epic(arguments, db, user_id)

        # Teams
        elif name == "get_teams":
            return await _get_teams(db, workspace_id)
        elif name == "create_team":
            return await _create_team(arguments, db, workspace_id)
        elif name == "update_team":
            return await _update_team(arguments, db)
        elif name == "delete_team":
            return await _delete_team(arguments, db)
        elif name == "add_team_member":
            return await _add_team_member(arguments, db)
        elif name == "remove_team_member":
            return await _remove_team_member(arguments, db)

        # Planner
        elif name == "plan_project":
            return await _plan_project(arguments, db, workspace_id, user_id, ctx)
        elif name == "execute_plan":
            return await _execute_plan(arguments, db, workspace_id, user_id)

        else:
            return json.dumps({"error": f"Unknown tool: {name}"})

    except Exception as e:
        logger.error(f"Tool '{name}' failed: {e}", exc_info=True)
        await db.rollback()
        return json.dumps({"error": str(e)})


# ── Task tools ────────────────────────────────────────────────────────────────

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

    # Filter by epic_id if provided
    if args.get("epic_id"):
        tasks = [t for t in tasks if str(t.epic_id) == args["epic_id"]]

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
            "epic_id": str(t.epic_id) if t.epic_id else None,
        })

    return json.dumps({"tasks": result, "count": len(result)})


async def _create_task(args: dict, db: AsyncSession, workspace_id: str, user_id: str, page_context: dict | None = None) -> str:
    service = TaskService(db)
    ctx = page_context or {}

    space_id = args.get("space_id") or ctx.get("space_id")
    space_service = SpaceService(db)
    workspace_spaces = await space_service.get_by_workspace(workspace_id)

    if not workspace_spaces:
        return json.dumps({"error": "No spaces found in workspace. Create a space first."})

    target_space = None
    if space_id:
        target_space = next((s for s in workspace_spaces if s.id == space_id), None)
        if not target_space:
             target_space = next((s for s in workspace_spaces if s.name.lower() == space_id.lower()), None)

    if not target_space:
        target_space = workspace_spaces[0]
        logger.info(f"Using default space: {target_space.name} ({target_space.id})")

    space_id = target_space.id

    assigned_to = args.get("assigned_to")
    if assigned_to and assigned_to.lower() == "developer":
        assigned_to = "3es4e2ml781i"

    epic_id = args.get("epic_id") or ctx.get("epic_id")
    if not epic_id:
        epic_service = EpicService(db)
        epics = await epic_service.get_by_space(space_id)
        if epics:
            epic_id = epics[0].id

    priority = Priority(args["priority"]) if args.get("priority") else Priority.MEDIUM
    status = TaskStatus(args["status"]) if args.get("status") else TaskStatus.TODO
    task_type = TaskType(args["task_type"]) if args.get("task_type") else TaskType.TASK

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


async def _delete_task(args: dict, db: AsyncSession, user_id: str) -> str:
    task_id = args.get("task_id")
    if not task_id:
        return json.dumps({"error": "task_id is required"})

    service = TaskService(db)
    result = await service.delete(task_id=task_id, user_id=user_id)

    if not result:
        return json.dumps({"error": f"Task {task_id} not found"})

    return json.dumps({"success": True, "message": f"Task {task_id} deleted"})


# ── Member tools ──────────────────────────────────────────────────────────────

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


# ── Space tools ───────────────────────────────────────────────────────────────

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


async def _create_space(args: dict, db: AsyncSession, workspace_id: str, user_id: str) -> str:
    from app.models.space import Space
    from app.models.epic import Epic

    name = args.get("name")
    if not name:
        return json.dumps({"error": "name is required"})

    # Create space and default epic in a single transaction to avoid
    # partial-creation issues from multiple commits
    space = Space(
        workspace_id=workspace_id,
        name=name,
        description=args.get("description"),
        tech_stack={},
        created_by=user_id,
    )
    db.add(space)
    await db.flush()  # Get the generated ID without committing

    default_epic = Epic(
        space_id=space.id,
        title="General",
        description="Default epic for general tasks",
    )
    db.add(default_epic)

    await db.commit()
    await db.refresh(space)
    await db.refresh(default_epic)

    logger.info(f"Created space '{name}' ({space.id}) with default epic ({default_epic.id})")

    return json.dumps({
        "success": True,
        "space": {
            "id": space.id,
            "name": space.name,
            "description": space.description or "",
            "default_epic_id": default_epic.id,
        }
    })


async def _update_space(args: dict, db: AsyncSession, user_id: str) -> str:
    space_id = args.get("space_id")
    if not space_id:
        return json.dumps({"error": "space_id is required"})

    service = SpaceService(db)
    update_fields = {}
    if args.get("name"):
        update_fields["name"] = args["name"]
    if args.get("description"):
        update_fields["description"] = args["description"]

    space_update = SpaceUpdate(**update_fields)
    space = await service.update(space_id=space_id, data=space_update, user_id=user_id)

    if not space:
        return json.dumps({"error": f"Space {space_id} not found"})

    return json.dumps({
        "success": True,
        "space": {"id": space.id, "name": space.name, "description": space.description or ""}
    })


async def _delete_space(args: dict, db: AsyncSession, user_id: str) -> str:
    space_id = args.get("space_id")
    if not space_id:
        return json.dumps({"error": "space_id is required"})

    service = SpaceService(db)
    result = await service.delete(space_id=space_id, user_id=user_id)

    if not result:
        return json.dumps({"error": f"Space {space_id} not found"})

    return json.dumps({"success": True, "message": f"Space {space_id} deleted"})


# ── Epic tools ────────────────────────────────────────────────────────────────

async def _get_epics(args: dict, db: AsyncSession, page_context: dict) -> str:
    space_id = args.get("space_id") or page_context.get("space_id")
    if not space_id:
        return json.dumps({"error": "space_id is required (provide it or navigate to a space)"})

    service = EpicService(db)
    epics = await service.get_by_space_with_counts(space_id)

    return json.dumps({"epics": epics, "count": len(epics)})


async def _create_epic(args: dict, db: AsyncSession, user_id: str, page_context: dict) -> str:
    space_id = args.get("space_id") or page_context.get("space_id")
    if not space_id:
        return json.dumps({"error": "space_id is required (provide it or navigate to a space)"})

    service = EpicService(db)
    epic_data = EpicCreate(
        title=args["title"],
        description=args.get("description"),
        space_id=space_id,
    )

    epic = await service.create(data=epic_data, user_id=user_id)

    return json.dumps({
        "success": True,
        "epic": {
            "id": epic.id,
            "title": epic.title,
            "description": epic.description or "",
            "space_id": str(epic.space_id),
        }
    })


async def _update_epic(args: dict, db: AsyncSession, user_id: str) -> str:
    epic_id = args.get("epic_id")
    if not epic_id:
        return json.dumps({"error": "epic_id is required"})

    service = EpicService(db)
    update_fields = {}
    if args.get("title"):
        update_fields["title"] = args["title"]
    if args.get("description"):
        update_fields["description"] = args["description"]

    epic_update = EpicUpdate(**update_fields)
    epic = await service.update(epic_id=epic_id, data=epic_update, user_id=user_id)

    if not epic:
        return json.dumps({"error": f"Epic {epic_id} not found"})

    return json.dumps({
        "success": True,
        "epic": {"id": epic.id, "title": epic.title, "description": epic.description or ""}
    })


# ── Team tools ────────────────────────────────────────────────────────────────

async def _get_teams(db: AsyncSession, workspace_id: str) -> str:
    service = TeamService(db)
    teams = await service.list_workspace_teams(workspace_id)

    result = []
    for team in teams:
        members = []
        if hasattr(team, 'team_memberships') and team.team_memberships:
            for tm in team.team_memberships:
                member = tm if hasattr(tm, 'user') else None
                if member and hasattr(member, 'user') and member.user:
                    members.append({
                        "member_id": member.id,
                        "name": member.user.name,
                        "email": member.user.email,
                    })

        result.append({
            "id": team.id,
            "name": team.name,
            "description": team.description or "",
            "member_count": len(members),
            "members": members,
        })

    return json.dumps({"teams": result, "count": len(result)})


async def _create_team(args: dict, db: AsyncSession, workspace_id: str) -> str:
    service = TeamService(db)

    team_data = TeamCreate(
        name=args["name"],
        description=args.get("description"),
        workspace_id=workspace_id,
    )

    team = await service.create(data=team_data)

    return json.dumps({
        "success": True,
        "team": {
            "id": team.id,
            "name": team.name,
            "description": team.description or "",
        }
    })


async def _update_team(args: dict, db: AsyncSession) -> str:
    team_id = args.get("team_id")
    if not team_id:
        return json.dumps({"error": "team_id is required"})

    service = TeamService(db)
    update_fields = {}
    if args.get("name"):
        update_fields["name"] = args["name"]
    if args.get("description"):
        update_fields["description"] = args["description"]

    team_update = TeamUpdate(**update_fields)
    team = await service.update(team_id=team_id, data=team_update)

    if not team:
        return json.dumps({"error": f"Team {team_id} not found"})

    return json.dumps({
        "success": True,
        "team": {"id": team.id, "name": team.name, "description": team.description or ""}
    })


async def _delete_team(args: dict, db: AsyncSession) -> str:
    team_id = args.get("team_id")
    if not team_id:
        return json.dumps({"error": "team_id is required"})

    service = TeamService(db)
    result = await service.delete_team(team_id=team_id)

    if not result:
        return json.dumps({"error": f"Team {team_id} not found"})

    return json.dumps({"success": True, "message": f"Team {team_id} deleted"})


async def _add_team_member(args: dict, db: AsyncSession) -> str:
    team_id = args.get("team_id")
    member_id = args.get("member_id")
    if not team_id or not member_id:
        return json.dumps({"error": "team_id and member_id are required"})

    service = TeamService(db)
    result = await service.add_member(team_id=team_id, member_id=member_id)

    if not result:
        return json.dumps({"error": "Failed to add member (already in team or invalid IDs)"})

    return json.dumps({"success": True, "message": f"Member {member_id} added to team {team_id}"})


async def _remove_team_member(args: dict, db: AsyncSession) -> str:
    team_id = args.get("team_id")
    member_id = args.get("member_id")
    if not team_id or not member_id:
        return json.dumps({"error": "team_id and member_id are required"})

    service = TeamService(db)
    result = await service.remove_member(team_id=team_id, member_id=member_id)

    if not result:
        return json.dumps({"error": "Failed to remove member (not in team or invalid IDs)"})

    return json.dumps({"success": True, "message": f"Member {member_id} removed from team {team_id}"})


# ── Planner tools ─────────────────────────────────────────────────────────────

async def _plan_project(args: dict, db: AsyncSession, workspace_id: str, user_id: str, page_context: dict) -> str:
    """
    Gather comprehensive workspace context — members with workload,
    teams with composition, existing spaces/epics — and return it
    so the AI can generate an intelligent project plan.
    """
    from sqlalchemy import select, func
    from app.models.task import Task as TaskModel

    description = args.get("description", "")
    deadline_days = args.get("deadline_days")
    target_space_id = args.get("space_id") or page_context.get("space_id")

    # ── Gather members with current workload ──
    member_service = MemberService(db)
    members = await member_service.list_workspace_members(workspace_id)

    # Count active tasks per user (todo + in_progress)
    workload_query = (
        select(TaskModel.assigned_to, func.count(TaskModel.id))
        .where(
            TaskModel.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
            TaskModel.assigned_to.isnot(None),
        )
        .group_by(TaskModel.assigned_to)
    )
    workload_rows = (await db.execute(workload_query)).all()
    workload_map = {str(row[0]): row[1] for row in workload_rows}

    member_list = []
    for m in members:
        uid = str(m.user_id)
        member_list.append({
            "member_id": m.id,
            "user_id": uid,
            "name": m.user.name if m.user else "Unknown",
            "email": m.user.email if m.user else "",
            "role": m.role.value if m.role else "member",
            "active_tasks": workload_map.get(uid, 0),
        })

    # ── Gather teams ──
    team_service = TeamService(db)
    teams = await team_service.list_workspace_teams(workspace_id)

    team_list = []
    for team in teams:
        team_members = []
        if hasattr(team, 'team_memberships') and team.team_memberships:
            for tm in team.team_memberships:
                if hasattr(tm, 'user') and tm.user:
                    team_members.append({
                        "member_id": tm.id,
                        "user_id": str(tm.user_id),
                        "name": tm.user.name,
                    })
        team_list.append({
            "id": team.id,
            "name": team.name,
            "description": team.description or "",
            "members": team_members,
        })

    # ── Gather spaces ──
    space_service = SpaceService(db)
    spaces = await space_service.get_by_workspace(workspace_id)
    space_list = [{"id": s.id, "name": s.name, "status": s.status.value if s.status else "planning"} for s in spaces]

    # ── Existing epics in target space ──
    epic_list = []
    if target_space_id:
        epic_service = EpicService(db)
        epics = await epic_service.get_by_space_with_counts(target_space_id)
        epic_list = epics  # Already dicts with task_count

    # ── Generate plan_id ──
    plan_id = f"plan_{uuid.uuid4().hex[:8]}"
    today = datetime.now().strftime("%Y-%m-%d")

    _plan_cache[plan_id] = {
        "description": description,
        "deadline_days": deadline_days,
        "target_space_id": target_space_id,
        "workspace_id": workspace_id,
        "user_id": user_id,
    }

    return json.dumps({
        "plan_id": plan_id,
        "project_description": description,
        "deadline_days": deadline_days,
        "today": today,
        "workspace_context": {
            "members": member_list,
            "total_members": len(member_list),
            "teams": team_list,
            "spaces": space_list,
            "target_space_id": target_space_id,
            "existing_epics": epic_list,
        },
        "instructions": (
            "Generate a project plan using ONLY the real members/teams above.\n\n"
            "Return your plan with a ```json block containing this EXACT structure:\n"
            "```json\n"
            '{"plan_id": "<plan_id>",\n'
            ' "space_name": "Project Name",\n'
            ' "space_description": "...",\n'
            ' "epics": [\n'
            '   {"title": "Phase 1: Design", "description": "...",\n'
            '    "tasks": [\n'
            '      {"title": "...", "description": "...", "priority": "high",\n'
            '       "task_type": "design", "assigned_to": "<user_id from above>",\n'
            '       "estimated_hours": 4, "due_date": "YYYY-MM-DD"}\n'
            "    ]}\n"
            " ]}\n"
            "```\n\n"
            "Planning rules:\n"
            "- Spread work EVENLY — check active_tasks counts; assign less to busy members\n"
            "- Each task: 2-8 hours, specific and actionable\n"
            "- Phases: Design → Backend → Frontend → Testing → Deployment\n"
            "- task_type must be: frontend, backend, design, testing, devops, or documentation\n"
            "- priority: critical for blockers, high for core features, medium for standard, low for nice-to-have\n"
            "- due_date in YYYY-MM-DD, spread across the timeline\n"
            f"- TODAY is {today}, deadline in {deadline_days or '?'} days\n"
            "- If target_space_id exists, omit space_name/space_description\n\n"
            "Present the plan as a readable table, THEN include the json block.\n"
            "Ask: 'Should I execute this plan?' The user must confirm before you call execute_plan."
        ),
    })


async def _execute_plan(args: dict, db: AsyncSession, workspace_id: str, user_id: str) -> str:
    """
    Execute a full project plan in ONE backend transaction.
    Creates space (if needed), all epics, and all tasks at once.
    """
    from app.models.space import Space
    from app.models.epic import Epic
    from app.models.task import Task as TaskModel

    plan_id = args.get("plan_id")
    if not plan_id or plan_id not in _plan_cache:
        return json.dumps({
            "error": "Invalid or expired plan_id. Call plan_project again."
        })

    plan_context = _plan_cache.pop(plan_id)

    # Parse the plan JSON from the AI's argument
    plan_json = args.get("plan")
    if not plan_json:
        return json.dumps({"error": "plan JSON is required. Pass the plan object from your generated plan."})

    # Handle both string and dict
    if isinstance(plan_json, str):
        try:
            plan = json.loads(plan_json)
        except json.JSONDecodeError as e:
            return json.dumps({"error": f"Invalid plan JSON: {e}"})
    else:
        plan = plan_json

    epics_data = plan.get("epics", [])
    if not epics_data:
        return json.dumps({"error": "Plan has no epics. Nothing to create."})

    target_space_id = plan_context.get("target_space_id")
    created = {"space": None, "epics": [], "tasks": []}
    errors = []

    try:
        # ── Step 1: Create space if needed ──
        if not target_space_id:
            space_name = plan.get("space_name", plan_context.get("description", "New Project")[:100])
            space = Space(
                workspace_id=workspace_id,
                name=space_name,
                description=plan.get("space_description", ""),
                tech_stack={},
                created_by=user_id,
            )
            db.add(space)
            await db.flush()
            target_space_id = space.id
            created["space"] = {"id": space.id, "name": space.name}
            logger.info(f"Plan: created space '{space.name}' ({space.id})")

        # ── Step 2: Create all epics ──
        epic_id_map = {}  # index → epic.id
        for i, epic_data in enumerate(epics_data):
            epic = Epic(
                space_id=target_space_id,
                title=epic_data.get("title", f"Phase {i+1}"),
                description=epic_data.get("description", ""),
            )
            db.add(epic)
            await db.flush()
            epic_id_map[i] = epic.id
            created["epics"].append({"id": epic.id, "title": epic.title})
            logger.info(f"Plan: created epic '{epic.title}' ({epic.id})")

        # ── Step 3: Create all tasks ──
        for i, epic_data in enumerate(epics_data):
            epic_id = epic_id_map[i]
            for task_data in epic_data.get("tasks", []):
                # Parse due_date
                due_date = None
                if task_data.get("due_date"):
                    try:
                        due_date = datetime.fromisoformat(
                            task_data["due_date"].replace("Z", "+00:00")
                        )
                    except ValueError:
                        pass

                # Parse enums safely
                try:
                    priority = Priority(task_data.get("priority", "medium"))
                except ValueError:
                    priority = Priority.MEDIUM
                try:
                    task_type = TaskType(task_data.get("task_type", "task"))
                except ValueError:
                    task_type = TaskType.TASK

                task = TaskModel(
                    space_id=target_space_id,
                    epic_id=epic_id,
                    title=task_data.get("title", "Untitled Task"),
                    description=task_data.get("description", ""),
                    priority=priority,
                    task_type=task_type,
                    status=TaskStatus.TODO,
                    assigned_to=task_data.get("assigned_to"),
                    estimated_hours=task_data.get("estimated_hours"),
                    due_date=due_date,
                    created_by=user_id,
                )
                db.add(task)
                await db.flush()
                created["tasks"].append({
                    "id": task.id,
                    "title": task.title,
                    "epic": epic_data.get("title", ""),
                    "assigned_to": task.assigned_to,
                    "priority": priority.value,
                    "due_date": task_data.get("due_date"),
                })

        # ── Commit everything ──
        await db.commit()
        logger.info(
            f"Plan executed: {len(created['epics'])} epics, {len(created['tasks'])} tasks"
        )

    except Exception as e:
        await db.rollback()
        logger.error(f"Plan execution failed: {e}", exc_info=True)
        return json.dumps({
            "error": f"Plan execution failed: {str(e)}",
            "partial_created": created,
        })

    return json.dumps({
        "success": True,
        "summary": {
            "space": created["space"],
            "epics_created": len(created["epics"]),
            "tasks_created": len(created["tasks"]),
            "epics": created["epics"],
            "tasks": created["tasks"],
        },
        "message": (
            f"Project plan executed successfully! "
            f"Created {len(created['epics'])} epics and {len(created['tasks'])} tasks"
            f"{' in new space: ' + created['space']['name'] if created['space'] else ''}."
        ),
    })
