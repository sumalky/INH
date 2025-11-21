const { test, expect } = require('@playwright/test');

test('take screenshot', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.screenshot({ path: 'screenshot.png' });
});
