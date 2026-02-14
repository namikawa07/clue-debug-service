import z from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { createSupabaseClient } from "@/lib/supabase-server";
import { createSpaceSchema, updateSpaceSchema } from "../schemas";
import { Space } from "../types";
import { TaskStatus } from "@/features/tasks/types";

const app = new Hono()
    .post(
        "/",
        zValidator("json", createSpaceSchema),
        async (c) => {
            const supabase = await createSupabaseClient();

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { name, workspaceId, teamId } = c.req.valid("json");

            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('user_id', user.id)
                .single();

            if (memberError || !member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { data: space, error: createError } = await supabase
                .from('spaces')
                .insert({
                    name,
                    image_url: null,
                    workspace_id: workspaceId,
                    team_id: teamId || null,
                })
                .select()
                .single();

            if (createError) {
                return c.json({ error: createError.message }, 500);
            }

            return c.json({
                data: space,
            });
        }
    )
    .get(
        "/",
        zValidator("query", z.object({ workspaceId: z.string(), teamId: z.string().nullish() })),
        async (c) => {
            const supabase = await createSupabaseClient();

            const { workspaceId, teamId } = c.req.valid("query");

            if (!workspaceId) {
                return c.json({
                    error: "Missing workspace ID",
                }, 400);
            }

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('user_id', user.id)
                .single();

            if (memberError || !member) {
                return c.json({
                    error: "Unauthorized",
                }, 401);
            }

            let query = supabase
                .from('spaces')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (teamId) {
                query = query.eq('team_id', teamId);
            }

            const { data: spaces, error: spacesError } = await query;

            if (spacesError) {
                return c.json({ error: spacesError.message }, 500);
            }

            return c.json({
                data: {
                    documents: spaces || [],
                    total: spaces?.length || 0,
                }
            });
        }
    )
    .get(
        "/:spaceId",
        async (c) => {
            const supabase = await createSupabaseClient();
            const { spaceId } = c.req.param();

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { data: space, error: spaceError } = await supabase
                .from('spaces')
                .select('*')
                .eq('id', spaceId)
                .single();

            if (spaceError || !space) {
                return c.json({ error: "Space not found" }, 404);
            }

            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('workspace_id', space.workspace_id)
                .eq('user_id', user.id)
                .single();

            if (memberError || !member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            return c.json({ data: space });
        }
    )
    .patch(
        "/:spaceId",
        zValidator("json", updateSpaceSchema),
        async (c) => {
            const supabase = await createSupabaseClient();

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { spaceId } = c.req.param();
            const { name, teamId } = c.req.valid("json");

            const { data: existingSpace, error: spaceError } = await supabase
                .from('spaces')
                .select('*')
                .eq('id', spaceId)
                .single();

            if (spaceError || !existingSpace) {
                return c.json({ error: "Space not found" }, 404);
            }

            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('workspace_id', existingSpace.workspace_id)
                .eq('user_id', user.id)
                .single();

            if (memberError || !member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const updateData: Record<string, unknown> = {
                name,
                updated_at: new Date().toISOString(),
            };

            if (teamId !== undefined) {
                updateData.team_id = teamId || null;
            }

            const { data: space, error: updateError } = await supabase
                .from('spaces')
                .update(updateData)
                .eq('id', spaceId)
                .select()
                .single();

            if (updateError) {
                return c.json({ error: updateError.message }, 500);
            }

            return c.json({
                data: space
            });
        }
    )
    .delete(
        "/:spaceId",
        async (c) => {
            const supabase = await createSupabaseClient();

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { spaceId } = c.req.param();

            const { data: existingSpace, error: spaceError } = await supabase
                .from('spaces')
                .select('*')
                .eq('id', spaceId)
                .single();

            if (spaceError || !existingSpace) {
                return c.json({ error: "Space not found" }, 404);
            }

            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('workspace_id', existingSpace.workspace_id)
                .eq('user_id', user.id)
                .single();

            if (memberError || !member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { error: deleteError } = await supabase
                .from('spaces')
                .delete()
                .eq('id', spaceId);

            if (deleteError) {
                return c.json({ error: deleteError.message }, 500);
            }

            return c.json({ data: { id: existingSpace.id } });
        }
    )
    .get(
        "/:spaceId/analytics",
        async (c) => {
            const supabase = await createSupabaseClient();

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { spaceId } = c.req.param();

            const { data: space, error: spaceError } = await supabase
                .from('spaces')
                .select('*')
                .eq('id', spaceId)
                .single();

            if (spaceError || !space) {
                return c.json({ error: "Space not found" }, 404);
            }

            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('workspace_id', space.workspace_id)
                .eq('user_id', user.id)
                .single();

            if (memberError || !member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const now = new Date();
            const thisMonthStart = startOfMonth(now);
            const thisMonthEnd = endOfMonth(now);
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const lastMonthEnd = endOfMonth(subMonths(now, 1));

            // This month tasks
            const { data: thisMonthTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .gte('created_at', thisMonthStart.toISOString())
                .lte('created_at', thisMonthEnd.toISOString());

            // Last month tasks
            const { data: lastMonthTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .gte('created_at', lastMonthStart.toISOString())
                .lte('created_at', lastMonthEnd.toISOString());

            const taskCount = thisMonthTasks?.length || 0;
            const taskDifference = taskCount - (lastMonthTasks?.length || 0);

            // This month assigned tasks
            const { data: thisMonthAssignedTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .eq('assignee_id', member.id)
                .gte('created_at', thisMonthStart.toISOString())
                .lte('created_at', thisMonthEnd.toISOString());

            const { data: lastMonthAssignedTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .eq('assignee_id', member.id)
                .gte('created_at', lastMonthStart.toISOString())
                .lte('created_at', lastMonthEnd.toISOString());

            const assignedTaskCount = thisMonthAssignedTasks?.length || 0;
            const assignedTaskDifference = assignedTaskCount - (lastMonthAssignedTasks?.length || 0);

            // This month incomplete tasks
            const { data: thisMonthIncompleteTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .neq('status', TaskStatus.DONE)
                .gte('created_at', thisMonthStart.toISOString())
                .lte('created_at', thisMonthEnd.toISOString());

            const { data: lastMonthIncompleteTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .neq('status', TaskStatus.DONE)
                .gte('created_at', lastMonthStart.toISOString())
                .lte('created_at', lastMonthEnd.toISOString());

            const incompleteTaskCount = thisMonthIncompleteTasks?.length || 0;
            const incompleteTaskDifference = incompleteTaskCount - (lastMonthIncompleteTasks?.length || 0);

            // This month completed tasks
            const { data: thisMonthCompletedTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .eq('status', TaskStatus.DONE)
                .gte('created_at', thisMonthStart.toISOString())
                .lte('created_at', thisMonthEnd.toISOString());

            const { data: lastMonthCompletedTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .eq('status', TaskStatus.DONE)
                .gte('created_at', lastMonthStart.toISOString())
                .lte('created_at', lastMonthEnd.toISOString());

            const completedTaskCount = thisMonthCompletedTasks?.length || 0;
            const completedTaskDifference = completedTaskCount - (lastMonthCompletedTasks?.length || 0);

            // This month overdue tasks
            const { data: thisMonthOverdueTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .neq('status', TaskStatus.DONE)
                .lt('due_date', now.toISOString())
                .gte('created_at', thisMonthStart.toISOString())
                .lte('created_at', thisMonthEnd.toISOString());

            const { data: lastMonthOverdueTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('space_id', spaceId)
                .neq('status', TaskStatus.DONE)
                .lt('due_date', now.toISOString())
                .gte('created_at', lastMonthStart.toISOString())
                .lte('created_at', lastMonthEnd.toISOString());

            const overdueTaskCount = thisMonthOverdueTasks?.length || 0;
            const overdueTaskDifference = overdueTaskCount - (lastMonthOverdueTasks?.length || 0);

            return c.json({
                data: {
                    taskCount,
                    taskDifference,
                    assignedTaskCount,
                    assignedTaskDifference,
                    completedTaskCount,
                    completedTaskDifference,
                    incompleteTaskCount,
                    incompleteTaskDifference,
                    overdueTaskCount,
                    overdueTaskDifference,
                }
            });
        }
    );

export default app;
