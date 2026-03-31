export type ToolName = 'navigate' | 'click' | 'fill' | 'press_key' | 'wait';

export type Task =
  | { tool: 'navigate';  url: string }
  | { tool: 'click';     ref: string }
  | { tool: 'fill';      ref: string; text: string }
  | { tool: 'press_key'; key: string }
  | { tool: 'wait';      ms: number };

export interface LLMResponse { tasks: Task[]; }
