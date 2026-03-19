import { Page } from 'puppeteer-core';
import { Task } from '../types/index.js';
import { registry } from './registry.js';

export type ExecutorResult =
  | { success: true; completedTasks: Task[] }
  | { success: false; failedSelector: string; failedTool: string; completedTasks: Task[] };

function isSelectorError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('failed to find element') ||
    msg.includes('no element found') ||
    msg.includes('waiting for selector') ||
    msg.includes('element is not attached')
  );
}

/**
 * Runs all tasks sequentially. If a selector-based task fails to find its
 * element, returns the failed selector so the caller can retry with fallbacks.
 */
export async function executeTasks(page: Page, tasks: Task[]): Promise<ExecutorResult> {
  const completedTasks: Task[] = [];

  for (const task of tasks) {
    const selector = 'selector' in task && task.selector ? task.selector : null;

    try {
      const handler = registry[task.tool] as (page: Page, params: typeof task) => Promise<void>;
      await Promise.race([
        handler(page, task),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Handler timeout')), 2000)),
      ]);
      completedTasks.push(task);
    } catch (err) {
      if (selector && isSelectorError(err)) {
        // Failed task is NOT pushed — only the tasks that ran before it are kept
        return { success: false, failedSelector: selector, failedTool: task.tool, completedTasks };
      }
      return {
        success: false,
        failedSelector: '',
        failedTool: '',
        completedTasks,
      } as ExecutorResult; // Unexpected error, let caller handle it
    }
  }

  return { success: true, completedTasks };
}
