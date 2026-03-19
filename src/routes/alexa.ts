import { Router, Request, Response } from 'express';
import { browserService } from '../services/browser.js';
import {
  buildInitialMessages,
  appendSelectorFallbackMessage,
  callLLM,
  MAX_TURNS,
} from '../services/llm.js';
import { executeTasks } from '../tools/executor.js';
import { memoryService } from '../services/memory.js';
import { Task } from '../types/index.js';

export const alexaRouter = Router();

function extractSelectorsFromTasks(tasks: Task[]): Record<string, string> {
  const selectors: Record<string, string> = {};
  tasks.forEach((task, i) => {
    if ('selector' in task && task.selector) {
      selectors[`${task.tool}_${i}`] = task.selector;
    }
  });
  return selectors;
}

alexaRouter.post('/command', async (req: Request, res: Response) => {
  const { command } = req.body as { command?: string };

  if (!command) {
    res.status(400).json({ success: false, message: 'command is required' });
    return;
  }

  try {
    const page = await browserService.getPage();

    // Cache hit — skip LLM entirely
    const cachedTasks = memoryService.lookupTask(command);
    if (cachedTasks) {
      const execResult = await executeTasks(page, cachedTasks);
      if (execResult.success) {
        res.json({ success: true, message: 'Task completed.' });
        return;
      }
      // Cache miss on execution — fall through to LLM
    }

    const messages = buildInitialMessages(command, page.url());
    const taskStack: Task[] = [];

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const llmResult = await callLLM(messages);

      if (llmResult.done) {
        res.json({ success: true, message: 'Task completed.' });
        return;
      }

      const { tasks } = llmResult.response;
      const lastAssistantReply = JSON.stringify(llmResult.response);

      const execResult = await executeTasks(page, tasks);

      // Push only the tasks that actually ran successfully before any failure
      taskStack.push(...execResult?.completedTasks);

      if (execResult?.success) {
        memoryService.saveTask(command, taskStack);
        // On a corrected retry, persist the working selectors for future use
        if (turn > 0) {
          const learned = extractSelectorsFromTasks(taskStack);
          memoryService.saveLearnedSelectors(page.url(), learned);
        }
        res.json({ success: true, message: 'Task completed.' });
        return;
      }

      // A selector failed — gather context and let LLM retry
      const [domSnapshot, screenshotBase64] = await Promise.all([
        browserService.getDOMSnapshot(page),
        browserService.getScreenshot(page),
      ]);

      const learnedSelectors = memoryService.getLearnedSelectors(page.url());

      appendSelectorFallbackMessage(
        messages,
        lastAssistantReply,
        execResult.failedSelector,
        execResult.failedTool,
        page.url(),
        domSnapshot,
        learnedSelectors,
        screenshotBase64,
      );
    }

    res.json({
      success: false,
      message: `Could not complete task after ${MAX_TURNS} attempts.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
});
