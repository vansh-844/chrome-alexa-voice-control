import { execFile } from 'child_process';

export type SnapshotResult = {
  success: boolean;
  data: {
    origin: string;
    refs: Record<string, unknown>;
    snapshot: string;
  };
  error: string | null;
};

const CLI_TIMEOUT_MS = 10_000;

function run(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = execFile(
      'agent-browser',
      args,
      { timeout: CLI_TIMEOUT_MS },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message));
        } else {
          resolve(stdout);
        }
      },
    );
    void proc;
  });
}

export async function agentOpen(url: string): Promise<void> {
  await run(['navigate', url, '--headed']);
}

export async function agentSnapshot(): Promise<SnapshotResult> {
  const stdout = await run(['snapshot', '-i', '--json']);
  return JSON.parse(stdout) as SnapshotResult;
}

export async function agentClick(ref: string): Promise<void> {
  await run(['click', ref]);
}

export async function agentFill(ref: string, text: string): Promise<void> {
  await run(['fill', ref, text]);
}

export async function agentPress(key: string): Promise<void> {
  await run(['press', key]);
}
