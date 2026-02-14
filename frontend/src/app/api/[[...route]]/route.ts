import { Hono } from "hono";
import { handle } from "hono/vercel";

import members from "@/features/members/server/route";
import workspaces from "@/features/workspaces/server/route";
import spaces from "@/features/spaces/server/route";
import tasks from "@/features/tasks/server/route";
import notes from "@/features/notes/server/route";
import teams from "@/features/teams/server/route";

const app = new Hono().basePath("/api");

const routes = app
    .route("/workspaces", workspaces)
    .route("/members", members)
    .route("/spaces", spaces)
    .route("/tasks", tasks)
    .route("/notes", notes)
    .route("/teams", teams);

export const GET = handle(routes);
export const POST = handle(routes);
export const PATCH = handle(routes);
export const DELETE = handle(routes);

export type AppType = typeof routes;