import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const taskRouter = createTRPCRouter({
  // Project-related endpoints
  createProject: protectedProcedure
    .input(z.object({ name: z.string(), description: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          userId: ctx.session.user.id,
        },
      });
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }),

  createTask: protectedProcedure
    .input(z.object({ text: z.string(), projectId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.task.create({
        data: {
          title: input.text,
          status: "Open",
          userId: ctx.session.user.id,
          projectId: input.projectId,
        },
      });

      return "Task created!";
    }),

  getTasks: protectedProcedure
    .input(
      z.object({
        showCompleted: z.boolean(),
        projectId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return await ctx.db.task.findMany({
        where: {
          userId,
          projectId: input.projectId,
          ...(input.showCompleted ? {} : { status: { not: "completed" } }),
        },
        orderBy: {
          task_id: "asc",
        },
      });
    }),

  updateTaskStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        status: z.enum(["pending", "completed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.update({
        where: { task_id: input.taskId },
        data: { status: input.status },
      });
    }),

  updateTaskCategory: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        category: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.update({
        where: { task_id: input.taskId },
        data: { category: input.category },
      });
    }),

  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    return tasks.map((t) => t.category!);
  }),

  updateTaskText: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.update({
        where: { task_id: input.taskId },
        data: { title: input.text },
      });
    }),

  bulkCreateTasks: protectedProcedure
    .input(
      z.object({
        tasks: z.array(z.string()),
        projectId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.db.task.createMany({
        data: input.tasks.map((text) => ({
          title: text,
          status: "Open",
          userId,
          projectId: input.projectId,
        })),
      });

      return "Tasks created!";
    }),

  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.delete({
        where: { task_id: input.taskId },
      });
    }),

  bulkDeleteTasks: protectedProcedure
    .input(z.object({ taskIds: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.task.deleteMany({
        where: {
          task_id: { in: input.taskIds },
          userId: ctx.session.user.id, // Ensure user owns all tasks
        },
      });
      return "Tasks deleted!";
    }),

  bulkUpdateTaskCategory: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.number()),
        category: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.task.updateMany({
        where: {
          task_id: { in: input.taskIds },
          userId: ctx.session.user.id, // Ensure user owns all tasks
        },
        data: {
          category: input.category,
        },
      });
      return "Categories updated!";
    }),
});
