import { Task, ToolName } from '../types/index.js';
import { agentOpen, agentClick, agentFill, agentPress } from '../services/browser.js';

export const registry: { [K in ToolName]: (params: Extract<Task, { tool: K }>) => Promise<void> } = {
  navigate:  (params) => agentOpen(params.url),
  click:     (params) => agentClick(params.ref),
  fill:      (params) => agentFill(params.ref, params.text),
  press_key: (params) => agentPress(params.key),
  wait:      (params) => new Promise(resolve => setTimeout(resolve, params.ms)),
};
