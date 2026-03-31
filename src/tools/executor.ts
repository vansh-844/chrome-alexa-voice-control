import { Task } from '../types/index.js';
import { registry } from './registry.js';

export type ExecutorResult =
  | { success: true;  completedTasks: Task[] }
  | { success: false; failedRef: string | null; failedTool: string; error: string; completedTasks: Task[] };

function isRefError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('not found') || msg.includes('unknown ref');
}

export async function executeTasks(tasks: Task[]): Promise<ExecutorResult> {
  const completedTasks: Task[] = [];

  for (const task of tasks) {
    const ref = ('ref' in task && task.ref) ? task.ref : null;

    try {
      const handler = registry[task.tool] as (params: typeof task) => Promise<void>;
      await Promise.race([
        handler(task),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Handler timeout')), 2000)),
      ]);
      completedTasks.push(task);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const isRef = (task.tool === 'click' || task.tool === 'fill') && isRefError(err);
      return {
        success: false,
        failedRef: isRef ? ref : null,
        failedTool: task.tool,
        error,
        completedTasks,
      };
    }
  }

  return { success: true, completedTasks };
}
