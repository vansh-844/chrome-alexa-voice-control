import { Router, Request, Response } from 'express';
import { agentSnapshot } from '../services/browser.js';
import {
  buildInitialMessages,
  appendSnapshotMessage,
  callLLM,
  MAX_TURNS,
} from '../services/llm.js';
import { executeTasks } from '../tools/executor.js';

export const alexaRouter = Router();

alexaRouter.post('/command', async (req: Request, res: Response) => {
  const { command } = req.body as { command?: string };

  if (!command) {
    res.status(400).json({ success: false, message: 'command is required' });
    return;
  }

  try {
    let snapshot = await agentSnapshot();
    const messages = buildInitialMessages(command, snapshot);

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const llmResult = await callLLM(messages);

      if (llmResult.done) {
        res.json({ success: true, message: 'Task completed.' });
        return;
      }

      const { tasks } = llmResult.response;
      const lastAssistantReply = JSON.stringify(llmResult.response);

      const execResult = await executeTasks(tasks);
      snapshot = await agentSnapshot();

      appendSnapshotMessage(
        messages,
        lastAssistantReply,
        snapshot,
        execResult.success
          ? undefined
          : { failedRef: execResult.failedRef, failedTool: execResult.failedTool },
      );
    }

    res.json({
      success: false,
      message: `Could not complete task after ${MAX_TURNS} attempts.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('alexa error:', message);
    res.status(500).json({ success: false, message });
  }
});
