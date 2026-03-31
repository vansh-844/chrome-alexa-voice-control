import { z } from "zod";

const NavigateSchema = z.object({
  tool: z.literal("navigate"),
  url: z.string().url(),
});

const ClickSchema = z.object({
  tool: z.literal("click"),
  ref: z.string(),
});

const FillSchema = z.object({
  tool: z.literal("fill"),
  ref: z.string(),
  text: z.string(),
});

const PressKeySchema = z.object({
  tool: z.literal("press_key"),
  key: z.string(),
});

const WaitSchema = z.object({
  tool: z.literal("wait"),
  ms: z.number().int().min(0).max(10000),
});

export const TaskSchema = z.discriminatedUnion("tool", [
  NavigateSchema,
  ClickSchema,
  FillSchema,
  PressKeySchema,
  WaitSchema,
]);

export const LLMResponseSchema = z.object({
  tasks: z.array(TaskSchema),
});

export type TaskSchemaType = z.infer<typeof TaskSchema>;
export type LLMResponseSchemaType = z.infer<typeof LLMResponseSchema>;
