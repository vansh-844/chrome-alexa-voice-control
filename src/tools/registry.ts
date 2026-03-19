import { Page } from 'puppeteer-core';
import { Task, ToolName } from '../types/index.js';

type ToolHandler<T extends Task> = (page: Page, params: T) => Promise<void>;

type ToolRegistry = {
  [K in ToolName]: ToolHandler<Extract<Task, { tool: K }>>;
};

export const registry: ToolRegistry = {
  navigate: async (page, params) => {
    await page.goto(params.url, { waitUntil: 'domcontentloaded' });
  },

  click: async (page, params) => {
    await page.click(params.selector);
  },

  type: async (page, params) => {
    if (params.selector) {
      await page.click(params.selector);
    }
    await page.keyboard.type(params.text);
  },

  press_key: async (page, params) => {
    await page.keyboard.press(params.key as Parameters<typeof page.keyboard.press>[0]);
  },

  wait_for_load: async (page) => {
    await page.waitForNavigation({ waitUntil: 'load' });
  },
  wait_for_selector: async (page, params) => {
    await page.waitForSelector(params.selector);
  },
};
