import { z } from "zod";

const NavigateSchema = z.object({
  tool: z.literal("navigate"),
  url: z.string().url(),
});

const ClickSchema = z.object({
  tool: z.literal("click"),
  selector: z.string(),
});

const TypeSchema = z.object({
  tool: z.literal("type"),
  text: z.string(),
  selector: z.string().optional(),
});

const PressKeySchema = z.object({
  tool: z.literal("press_key"),
  key: z.string(),
});

const WaitForLoadSchema = z.object({
  tool: z.literal("wait_for_load"),
});

const WaitForSelectorSchema = z.object({
  tool: z.literal("wait_for_selector"),
  selector: z.string(),
});

export const TaskSchema = z.discriminatedUnion("tool", [
  NavigateSchema,
  ClickSchema,
  TypeSchema,
  PressKeySchema,
  WaitForLoadSchema,
  WaitForSelectorSchema,
]);

export const LLMResponseSchema = z.object({
  tasks: z.array(TaskSchema),
});

export type TaskSchemaType = z.infer<typeof TaskSchema>;
export type LLMResponseSchemaType = z.infer<typeof LLMResponseSchema>;
