import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = 'http://localhost:5173';
const routes = [
  { name: 'session', url: `${base}/session/6a25a2fa00144f7ea600` },
  { name: 'dashboard', url: `${base}/dashboard` },
];

const viewports = [
  { name: 'mobile-320', width: 320, height: 844 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
];

const outDir = path.resolve('tmp/responsive-qa');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const qaEmail = process.env.QA_EMAIL;
const qaPassword = process.env.QA_PASSWORD;

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.width < 768,
    hasTouch: viewport.width < 768,
  });
  const page = await context.newPage();
  let authStatus = 'not-attempted';
  let authError = null;

  try {
    await page.goto(`${base}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    if (qaEmail && qaPassword) {
      authStatus = 'attempted';
      await page.locator('input[name="email"]').fill(qaEmail);
      await page.locator('input[name="password"]').fill(qaPassword);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 30000 });
      await page.waitForTimeout(1500);
      authStatus = 'logged-in';
    } else {
      authStatus = 'missing-env';
    }
  } catch (err) {
    authStatus = 'failed';
    authError = err.message;
    // If auth fails, the route captures below will show the resulting page.
  }

  for (const route of routes) {
    const label = `${route.name}-${viewport.name}`;
    const screenshot = path.join(outDir, `${label}.png`);
    let title = '';
    let url = '';
    let text = '';
    let error = null;

    try {
      await page.goto(route.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      title = await page.title();
      url = page.url();
      text = (await page.locator('body').innerText({ timeout: 5000 })).slice(0, 1200);
      await page.screenshot({ path: screenshot, fullPage: true });
    } catch (err) {
      error = err.message;
      try {
        await page.screenshot({ path: screenshot, fullPage: true });
      } catch {}
    }

    results.push({
      route: route.name,
      viewport: viewport.name,
      size: `${viewport.width}x${viewport.height}`,
      url,
      title,
      screenshot,
      error,
      authStatus,
      authError,
      textPreview: text.replace(/\s+/g, ' ').trim(),
    });
  }

  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
