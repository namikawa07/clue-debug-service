"""
OpenAI-compatible tool schemas for the AI agent.
Each tool maps to an existing backend service method.
"""

TOOL_SCHEMAS = [
    # ── Tasks ─────────────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_tasks",
            "description": "Get a list of tasks in the workspace. Can filter by status, priority, assignee, epic, or team. Use this to see what tasks exist, check progress, or find specific tasks.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["todo", "in_progress", "review", "done", "blocked"],
                        "description": "Filter tasks by status"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["critical", "high", "medium", "low"],
                        "description": "Filter tasks by priority"
                    },
                    "assigned_to": {
                        "type": "string",
                        "description": "Filter by assignee user ID"
                    },
                    "search": {
                        "type": "string",
                        "description": "Search in task title or description"
                    },
                    "epic_id": {
                        "type": "string",
                        "description": "Filter tasks by epic ID"
                    },
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new task in the workspace. You must provide a title. Use get_spaces to find space_id, get_members to find assignee, get_epics to find epic_id.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Title of the task"
                    },
                    "description": {
                        "type": "string",
                        "description": "Detailed description of the task"
                    },
                    "space_id": {
                        "type": "string",
                        "description": "ID of the space (use get_spaces to find this)"
                    },
                    "epic_id": {
                        "type": "string",
                        "description": "ID of the epic (use get_epics to find this)"
                    },
                    "assigned_to": {
                        "type": "string",
                        "description": "User ID to assign the task to (use get_members to find this)"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["critical", "high", "medium", "low"],
                        "description": "Task priority, defaults to medium"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["todo", "in_progress", "review", "done", "blocked"],
                        "description": "Task status, defaults to todo"
                    },
                    "due_date": {
                        "type": "string",
                        "description": "Due date in ISO format (e.g. 2026-02-21T00:00:00Z)"
                    },
                    "task_type": {
                        "type": "string",
                        "enum": ["task", "frontend", "backend", "design", "testing", "devops", "documentation"],
                        "description": "Type of task"
                    },
                    "estimated_hours": {
                        "type": "number",
                        "description": "Estimated hours to complete"
                    }
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update an existing task. Use get_tasks first to find the task ID. You can change status, priority, assignee, due date, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "ID of the task to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "New title"
                    },
                    "description": {
                        "type": "string",
                        "description": "New description"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["todo", "in_progress", "review", "done", "blocked"],
                        "description": "New status"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["critical", "high", "medium", "low"],
                        "description": "New priority"
                    },
                    "assigned_to": {
                        "type": "string",
                        "description": "New assignee user ID"
                    },
                    "due_date": {
                        "type": "string",
                        "description": "New due date in ISO format"
                    }
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Delete a task permanently. Use get_tasks first to find the task ID. Ask for confirmation before deleting.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "ID of the task to delete"
                    }
                },
                "required": ["task_id"]
            }
        }
    },

    # ── Members ───────────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_members",
            "description": "Get all members of the current workspace. Returns each member's user ID, name, email, and role. Use this to resolve member names to IDs before assigning tasks.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },

    # ── Spaces ────────────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_spaces",
            "description": "Get all spaces (projects) in the current workspace. Returns each space's ID, name, description, and status.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_space",
            "description": "Create a new space (project) in the workspace. A default 'General' epic will be auto-created.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the space"
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of the space"
                    }
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_space",
            "description": "Update a space's name or description.",
            "parameters": {
                "type": "object",
                "properties": {
                    "space_id": {
                        "type": "string",
                        "description": "ID of the space to update"
                    },
                    "name": {
                        "type": "string",
                        "description": "New name"
                    },
                    "description": {
                        "type": "string",
                        "description": "New description"
                    }
                },
                "required": ["space_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_space",
            "description": "Delete a space and all its epics/tasks. This is destructive — ask for confirmation first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "space_id": {
                        "type": "string",
                        "description": "ID of the space to delete"
                    }
                },
                "required": ["space_id"]
            }
        }
    },

    # ── Epics ─────────────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_epics",
            "description": "Get all epics in a space. If no space_id given, uses current page context. Returns epic ID, title, description, task count.",
            "parameters": {
                "type": "object",
                "properties": {
                    "space_id": {
                        "type": "string",
                        "description": "Space ID to get epics for (defaults to current space from page context)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_epic",
            "description": "Create a new epic in a space. Epics group related tasks together.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Title of the epic"
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of the epic"
                    },
                    "space_id": {
                        "type": "string",
                        "description": "Space ID (defaults to current space from page context)"
                    }
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_epic",
            "description": "Update an epic's title or description.",
            "parameters": {
                "type": "object",
                "properties": {
                    "epic_id": {
                        "type": "string",
                        "description": "ID of the epic to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "New title"
                    },
                    "description": {
                        "type": "string",
                        "description": "New description"
                    }
                },
                "required": ["epic_id"]
            }
        }
    },

    # ── Teams ─────────────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_teams",
            "description": "Get all teams in the workspace with their members. Returns team ID, name, description, and member list.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_team",
            "description": "Create a new team in the workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Team name"
                    },
                    "description": {
                        "type": "string",
                        "description": "Team description"
                    }
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_team",
            "description": "Update a team's name or description.",
            "parameters": {
                "type": "object",
                "properties": {
                    "team_id": {
                        "type": "string",
                        "description": "ID of the team to update"
                    },
                    "name": {
                        "type": "string",
                        "description": "New team name"
                    },
                    "description": {
                        "type": "string",
                        "description": "New description"
                    }
                },
                "required": ["team_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_team",
            "description": "Delete a team. Ask for confirmation first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "team_id": {
                        "type": "string",
                        "description": "ID of the team to delete"
                    }
                },
                "required": ["team_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_team_member",
            "description": "Add a workspace member to a team. Use get_members to find the member_id and get_teams to find the team_id.",
            "parameters": {
                "type": "object",
                "properties": {
                    "team_id": {
                        "type": "string",
                        "description": "ID of the team"
                    },
                    "member_id": {
                        "type": "string",
                        "description": "Workspace member ID (NOT user ID — use get_members to find this)"
                    }
                },
                "required": ["team_id", "member_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "remove_team_member",
            "description": "Remove a member from a team.",
            "parameters": {
                "type": "object",
                "properties": {
                    "team_id": {
                        "type": "string",
                        "description": "ID of the team"
                    },
                    "member_id": {
                        "type": "string",
                        "description": "Workspace member ID to remove"
                    }
                },
                "required": ["team_id", "member_id"]
            }
        }
    },

    # ── Intelligent Planner ───────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "plan_project",
            "description": """Intelligent project planner. Takes a high-level project description and generates a comprehensive execution plan with spaces, epics, tasks, team assignments, and timelines.

Use this when the user gives a big-picture instruction like:
- "Build a website for CompanyX with great UI/UX, tested, deliver in 2 weeks"
- "Set up a mobile app project with backend API"
- "Plan a marketing campaign launch"

The planner will:
1. Analyze available teams and members
2. Create a structured plan with phases/epics
3. Generate detailed tasks with effort estimates
4. Assign tasks to appropriate team members based on skills
5. Set realistic deadlines within the given timeline
6. Return the plan for review before execution

IMPORTANT: After calling plan_project, present the plan to the user and ask for confirmation before executing it with create_space, create_epic, create_task etc.""",
            "parameters": {
                "type": "object",
                "properties": {
                    "description": {
                        "type": "string",
                        "description": "High-level project description. Include: what to build, quality requirements, deadline if any."
                    },
                    "deadline_days": {
                        "type": "integer",
                        "description": "Number of days to complete the project (e.g. 14 for 2 weeks)"
                    },
                    "space_id": {
                        "type": "string",
                        "description": "Existing space to plan within (optional — will create new space if not provided)"
                    }
                },
                "required": ["description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "execute_plan",
            "description": "Execute a project plan in one shot. Creates space (if needed), all epics, and all tasks in a single transaction. Only call AFTER user approves the plan from plan_project. Pass the full plan JSON you generated.",
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_id": {
                        "type": "string",
                        "description": "The plan_id from plan_project"
                    },
                    "plan": {
                        "type": "object",
                        "description": "The full plan object with space_name, space_description, and epics array. Each epic has title, description, and tasks array. Each task has title, description, priority, task_type, assigned_to (user_id), estimated_hours, due_date.",
                        "properties": {
                            "space_name": {"type": "string"},
                            "space_description": {"type": "string"},
                            "epics": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string"},
                                        "description": {"type": "string"},
                                        "tasks": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "title": {"type": "string"},
                                                    "description": {"type": "string"},
                                                    "priority": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                                                    "task_type": {"type": "string", "enum": ["task", "frontend", "backend", "design", "testing", "devops", "documentation"]},
                                                    "assigned_to": {"type": "string", "description": "User ID from workspace members"},
                                                    "estimated_hours": {"type": "number"},
                                                    "due_date": {"type": "string", "description": "YYYY-MM-DD format"}
                                                },
                                                "required": ["title"]
                                            }
                                        }
                                    },
                                    "required": ["title", "tasks"]
                                }
                            }
                        },
                        "required": ["epics"]
                    }
                },
                "required": ["plan_id", "plan"]
            }
        }
    },
]
