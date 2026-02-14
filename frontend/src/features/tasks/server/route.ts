import z from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createSupabaseClient } from "@/lib/supabase-server";
import { TaskStatus } from "../types";
import { updateTaskSchema } from "../schemas";
import { createTaskSchema } from "../schemas";

const app = new Hono()
  .delete("/:taskId", async (c) => {
    const supabase = await createSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { taskId } = c.req.param();

    // Get task to delete
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return c.json({ error: "Task not found" }, 404);
    }

    // Check if user is a member of this workspace
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('workspace_id', task.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Delete task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      return c.json({ error: deleteError.message }, 500);
    }

    return c.json({ data: { $id: task.id } });
  })
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        spaceId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.nativeEnum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish(),
        teamId: z.string().nullish(),
      })
    ),
    async (c) => {
      const supabase = await createSupabaseClient();

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { workspaceId, spaceId, status, search, assigneeId, dueDate, teamId } =
        c.req.valid("query");

      if (!workspaceId) {
        return c.json({ error: "Missing workspaceId" }, 400);
      }

      // Check if user is a member of this workspace
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Build query
      let query = supabase
        .from('tasks')
        .select(`
          *,
          *,
          space:spaces (
            id,
            name,
            image_url
          ),
          assigned_user:profiles (
            id,
            name,
            email,
            avatar_color
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (spaceId) {
        query = query.eq('space_id', spaceId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (assigneeId) {
        query = query.eq('assignee_id', assigneeId);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      if (dueDate) {
        query = query.lte('due_date', dueDate);
      }

      const { data: tasks, error: tasksError } = await query;

      if (tasksError) {
        return c.json({ error: tasksError.message }, 500);
      }

      return c.json({
        data: {
          documents: tasks || [],
          total: tasks?.length || 0,
        }
      });
    }
  )
  .post(
    "/",
    zValidator("json", createTaskSchema),
    async (c) => {
      const supabase = await createSupabaseClient();

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { name, status, spaceId, assigneeId, dueDate, description } = c.req.valid("json");

      // Get space to check workspace
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .select('workspace_id')
        .eq('id', spaceId)
        .single();

      if (spaceError || !space) {
        return c.json({ error: "Space not found" }, 404);
      }

      // Check if user is a member of this workspace
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', space.workspace_id)
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get next position
      const { data: lastTask } = await supabase
        .from('tasks')
        .select('position')
        .eq('workspace_id', space.workspace_id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (lastTask?.[0]?.position || 0) + 1;

      // Create task
      const { data: task, error: createError } = await supabase
        .from('tasks')
        .insert({
          title: name,
          status: status || TaskStatus.TODO,
          space_id: spaceId,
          workspace_id: space.workspace_id,
          assignee_id: assigneeId || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          description: description || null,
          position: nextPosition,
          priority: 'MEDIUM',
        })
        .select(`
          *,
          space:spaces (
            id,
            name,
            image_url
          ),
          assigned_user:profiles (
            id,
            name,
            email,
            avatar_color
          )
        `)
        .single();

      if (createError) {
        return c.json({ error: createError.message }, 500);
      }

      return c.json({ data: task });
    }
  )
  .patch(
    "/:taskId",
    zValidator("json", updateTaskSchema),
    async (c) => {
      const supabase = await createSupabaseClient();

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { taskId } = c.req.param();
      const { name, status, assigneeId, dueDate, description } = c.req.valid("json");

      // Get existing task
      const { data: existingTask, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !existingTask) {
        return c.json({ error: "Task not found" }, 404);
      }

      // Check if user is a member of this workspace
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', existingTask.workspace_id)
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Update task
      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.title = name;
      if (status !== undefined) updateData.status = status;
      if (assigneeId !== undefined) updateData.assignee_id = assigneeId;
      if (dueDate !== undefined) updateData.due_date = dueDate ? new Date(dueDate).toISOString() : null;
      if (description !== undefined) updateData.description = description;

      const { data: task, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select(`
          *,
          space:spaces (
            id,
            name,
            image_url
          ),
          assigned_user:profiles (
            id,
            name,
            email,
            avatar_color
          )
        `)
        .single();

      if (updateError) {
        return c.json({ error: updateError.message }, 500);
      }

      return c.json({ data: task });
    }
  )
  .patch(
    "/:taskId/bulk-update",
    zValidator(
      "json",
      z.object({
        tasks: z.array(
          z.object({
            id: z.string(),
            status: z.nativeEnum(TaskStatus).optional(),
            position: z.number().optional(),
          })
        ),
      })
    ),
    async (c) => {
      const supabase = await createSupabaseClient();

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { tasks } = c.req.valid("json");

      // Get first task to determine workspace
      const { data: firstTask, error: firstTaskError } = await supabase
        .from('tasks')
        .select('workspace_id')
        .eq('id', tasks[0].id)
        .single();

      if (firstTaskError || !firstTask) {
        return c.json({ error: "Task not found" }, 404);
      }

      // Check if user is a member of this workspace
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', firstTask.workspace_id)
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Bulk update tasks
      const updatePromises = tasks.map(task => {
        const updateData: Record<string, any> = {};
        if (task.status !== undefined) updateData.status = task.status;
        if (task.position !== undefined) updateData.position = task.position;

        return supabase
          .from('tasks')
          .update(updateData)
          .eq('id', task.id);
      });

      const results = await Promise.all(updatePromises);

      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        return c.json({ error: "Some updates failed" }, 500);
      }

      return c.json({ data: { success: true } });
    }
  );

export default app;