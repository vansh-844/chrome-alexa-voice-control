import OpenAI from 'openai';
import { config } from '../config/env.js';
import { LLMResponseSchema } from '../tools/schemas.js';
import { LLMResponse } from '../types/index.js';
import { SnapshotResult } from '../services/browser.js';

const client = new OpenAI({ apiKey: config.openaiApiKey });

const MAX_TURNS = 5;

const SYSTEM_PROMPT = `You are a browser automation assistant. You control a real browser via voice commands.

Each turn you receive the current page's accessibility tree. Elements have refs (@e1, @e2, …).
Refs are valid only for the current snapshot — they change after any navigation.

Available Tools (each task must have a "tool" field with one of these exact values):

{ "tool": "navigate",  "url": "https://example.com" }
{ "tool": "click",     "ref": "e5" }
{ "tool": "fill",      "ref": "e5", "text": "hello" }
{ "tool": "press_key", "key": "Enter" }
{ "tool": "wait",      "ms": 1000 }

Rules:
- Every task object MUST have a "tool" field — never use the tool name as a key
- Only use refs from the snapshot provided to you — never invent refs
- Return only actions up to the next navigation or major DOM change
- After a navigate, you will receive a new snapshot automatically
- If done: return { "done": true }
- JSON only, no prose.

Output format:
{ "tasks": [ { "tool": "click", "ref": "e5" }, { "tool": "press_key", "key": "Enter" } ] }
or
{ "done": true }`;

type Message = OpenAI.Chat.ChatCompletionMessageParam;

export type LLMCallResult = { done: true } | { done: false; response: LLMResponse };

export function buildInitialMessages(command: string, snapshot: SnapshotResult): Message[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${command}\n\nCurrent URL: ${snapshot.data.origin}\n\nAccessibility tree:\n${snapshot.data.snapshot}`,
    },
  ];
}

export function appendSnapshotMessage(
  messages: Message[],
  assistantReply: string,
  snapshot: SnapshotResult,
  failure?: { failedRef: string | null; failedTool: string },
): void {
  messages.push({ role: 'assistant', content: assistantReply });

  let text = '';
  if (failure) {
    const refDesc = failure.failedRef
      ? `Ref ${failure.failedRef} in ${failure.failedTool}`
      : `Tool ${failure.failedTool}`;
    text += `${refDesc} was not found. Here is the updated accessibility tree — retry using refs from this snapshot.\n\n`;
  }
  text += `Current URL: ${snapshot.data.origin}\n\nAccessibility tree:\n${snapshot.data.snapshot}`;

  messages.push({ role: 'user', content: text });
}

export async function callLLM(messages: Message[]): Promise<LLMCallResult> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  if (parsed['done'] === true) {
    return { done: true };
  }

  const parseResult = LLMResponseSchema.safeParse(parsed);
  if (!parseResult.success) {
    throw new Error(
      `LLM returned invalid task structure: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
    );
  }
  return { done: false, response: parseResult.data };
}

export { MAX_TURNS };
