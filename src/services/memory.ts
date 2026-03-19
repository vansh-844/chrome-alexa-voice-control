import fs from 'fs';
import path from 'path';
import { Task } from '../types/index.js';

const MEMORY_DIR = path.resolve(process.cwd(), 'memory');
const SELECTORS_FILE = path.join(MEMORY_DIR, 'selectors.json');
const TASKS_FILE = path.join(MEMORY_DIR, 'tasks.json');

function ensureMemoryDir(): void {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

function readJSON<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(filePath: string, data: unknown): void {
  ensureMemoryDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getSelectorKey(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const domain = hostname.replace(/^www\./, '');
    return `${domain}:${pathname}`;
  } catch {
    return url;
  }
}

function normalizeCommand(cmd: string): string {
  return cmd.toLowerCase().trim().replace(/\s+/g, ' ');
}

class MemoryService {
  getLearnedSelectors(url: string): Record<string, string> {
    const all = readJSON<Record<string, Record<string, string>>>(SELECTORS_FILE, {});
    return all[getSelectorKey(url)] ?? {};
  }

  saveLearnedSelectors(url: string, selectors: Record<string, string>): void {
    const all = readJSON<Record<string, Record<string, string>>>(SELECTORS_FILE, {});
    const key = getSelectorKey(url);
    all[key] = { ...(all[key] ?? {}), ...selectors };
    writeJSON(SELECTORS_FILE, all);
  }

  lookupTask(command: string): Task[] | null {
    const all = readJSON<Record<string, Task[]>>(TASKS_FILE, {});
    return all[normalizeCommand(command)] ?? null;
  }

  saveTask(command: string, tasks: Task[]): void {
    const all = readJSON<Record<string, Task[]>>(TASKS_FILE, {});
    all[normalizeCommand(command)] = tasks;
    writeJSON(TASKS_FILE, all);
  }
}

export const memoryService = new MemoryService();
