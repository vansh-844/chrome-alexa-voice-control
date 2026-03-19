import puppeteer, { Browser, Page } from 'puppeteer-core';
import { config } from '../config/env.js';

export type DOMElement = {
  tag: string;
  text?: string;
  ariaLabel?: string;
  id?: string;
  testId?: string;
  classes?: string;
  href?: string;
};

class BrowserService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async connect(): Promise<void> {
    // this.browser = await puppeteer.launch({
    //   executablePath: config.chromeExecutablePath,
    //   headless: false,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // });
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:8002',
      defaultViewport: null, // Use existing viewport size
    });
    this.browser = browser;
  }

  async getPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser is not connected. Call connect() first.');
    }

    if (!this.page || this.page.isClosed()) {
      this.page = await this.browser.newPage();
    }

    return this.page;
  }

  async getDOMSnapshot(page: Page): Promise<DOMElement[]> {
    return page.evaluate(() => {
      const QUERY = 'a, button, [role="button"], input[type="button"], input[type="submit"]';
      const dialogEl = document.querySelector('[role="dialog"], .modal, [aria-modal="true"]');
      const elements = Array.from(
        dialogEl ? dialogEl.querySelectorAll(QUERY) : document.querySelectorAll(QUERY)
      );

      const results: Array<{
        tag: string;
        text?: string;
        ariaLabel?: string;
        id?: string;
        testId?: string;
        classes?: string;
        href?: string;
      }> = [];

      for (const el of elements) {
        if (results.length >= 60) break;

        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const text = el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 60) || undefined;
        const ariaLabel = el.getAttribute('aria-label') || undefined;
        const id = el.getAttribute('id') || undefined;
        const testId = el.getAttribute('data-testid') || undefined;
        const classArr = Array.from(el.classList).slice(0, 3);
        const classes = classArr.length > 0 ? classArr.join(' ') : undefined;
        const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') || undefined : undefined;

        if (!text && !ariaLabel && !id && !testId) continue;

        results.push({ tag: el.tagName.toLowerCase(), text, ariaLabel, id, testId, classes, href });
      }

      return results;
    });
  }

  async getScreenshot(page: Page): Promise<string> {
    const result = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 });
    return result as string;
  }

  async disconnect(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

export const browserService = new BrowserService();
