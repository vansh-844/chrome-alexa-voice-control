import OpenAI from 'openai';
import { config } from '../config/env.js';
import { getSelectors } from '../config/selectors.js';
import { LLMResponseSchema } from '../tools/schemas.js';
import { LLMResponse } from '../types/index.js';
import { DOMElement } from '../services/browser.js';

const client = new OpenAI({ apiKey: config.openaiApiKey });

const MAX_TURNS = 7;

const SYSTEM_PROMPT = `You are a browser automation assistant. Convert voice commands into complete browser tool call sequences.

## Available Tools
- navigate(url)               Navigate to a URL
- click(selector)             Click an element by CSS selector
- type(text, selector?)       Type text into focused or specified element
- press_key(key)              Press a key (e.g. "Enter", "Tab")
- wait_for_load()             Wait for page navigation to settle
- wait_for_selector(selector) Wait for an element to appear

## Rules
- Return the COMPLETE task list for the entire command in one response
- Use your knowledge of popular websites to predict CSS selectors (prefer aria-label and data-testid over class names)
- Always include wait_for_selector before clicking dynamically loaded elements
- If the task is already complete, return: { "done": true }
- Response must be JSON only — no prose

## Output Format
{ "tasks": [ { "tool": "...", ...params } ] }   — or —   { "done": true }`;

type Message = OpenAI.Chat.ChatCompletionMessageParam;

export type LLMCallResult = { done: true } | { done: false; response: LLMResponse };

export function buildInitialMessages(command: string, currentUrl: string): Message[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${command}\n\nCurrent URL: ${currentUrl}`,
    },
  ];
}

export function appendSelectorFallbackMessage(
  messages: Message[],
  assistantReply: string,
  failedSelector: string,
  failedTool: string,
  currentUrl: string,
  domSnapshot: DOMElement[],
  learnedSelectors: Record<string, string>,
  screenshotBase64: string,
): void {
  const staticSelectors = getSelectors(currentUrl);
  const allSelectors = { ...staticSelectors, ...learnedSelectors };

  messages.push({ role: 'assistant', content: assistantReply });
  messages.push({
    role: 'user',
    content: [
      {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${screenshotBase64}`, detail: 'low' },
      },
      {
        type: 'text',
        text: `Selector "${failedSelector}" used in "${failedTool}" was not found on the page.

Interactive elements currently visible:
${JSON.stringify(domSnapshot, null, 2)}

Known selectors for this page (use if relevant):
${JSON.stringify(allSelectors, null, 2)}

The screenshot above shows the current state of the browser. An unexpected popup or overlay may be blocking the page.
Please retry the full task list with corrected selectors.`,
      },
    ],
  });
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

  const result = LLMResponseSchema.parse(parsed) as LLMResponse;
  return { done: false, response: result };
}

export { MAX_TURNS };
