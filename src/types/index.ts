export type ToolName =
  | 'navigate'
  | 'click'
  | 'type'
  | 'press_key'
  | 'wait_for_load'
  | 'wait_for_selector';

export type Task =
  | { tool: 'navigate'; url: string }
  | { tool: 'click'; selector: string }
  | { tool: 'type'; text: string; selector?: string }
  | { tool: 'press_key'; key: string }
  | { tool: 'wait_for_load' }
  | { tool: 'wait_for_selector'; selector: string };

export interface LLMResponse {
  tasks: Task[];
}
