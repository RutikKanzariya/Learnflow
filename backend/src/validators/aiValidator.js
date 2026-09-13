import { z } from "zod";

export const tutorSchema = z.object({
  body: z.object({
    question: z
      .string()
      .trim()
      .min(3, "Question must be at least 3 characters")
      .max(
        1000,
        "Question cannot exceed 1000 characters"
      ),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const roadmapSchema = z.object({
  body: z.object({
    goal: z
      .string()
      .trim()
      .min(3, "Goal must be at least 3 characters")
      .max(
        500,
        "Goal cannot exceed 500 characters"
      ),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const aiQuizSchema = z.object({
  body: z.object({
    lessonId: z
      .string()
      .min(1, "Lesson ID is required"),

    topic: z
      .string()
      .trim()
      .min(2, "Topic must be at least 2 characters")
      .max(
        200,
        "Topic cannot exceed 200 characters"
      ),
  }),

  params: z.object({}),

  query: z.object({}),
});