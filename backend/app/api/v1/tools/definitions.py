"""
OpenAI-compatible tool schemas for the AI agent.
Each tool maps to an existing backend service method.
"""

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_tasks",
            "description": "Get a list of tasks in the workspace. Can filter by status, priority, or assignee. Use this to see what tasks exist, check progress, or find specific tasks.",
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
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new task in the workspace. You must provide a title and space_id. Use get_spaces first to find the right space_id, and get_members to find the right assignee user_id.",
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
                        "description": "ID of the space to create the task in (use get_spaces to find this)"
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
                "required": ["title", "space_id"]
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
            "name": "get_members",
            "description": "Get all members of the current workspace. Returns each member's user ID, name, email, and role. Use this to resolve member names to IDs before assigning tasks.",
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
            "name": "get_spaces",
            "description": "Get all spaces (projects) in the current workspace. Returns each space's ID, name, description, and status. Use this to find the space_id before creating tasks.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
]
