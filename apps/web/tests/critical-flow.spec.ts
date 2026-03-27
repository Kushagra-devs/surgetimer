import { test, expect } from '@playwright/test';

test('judge and overlay routes render', async ({ page }) => {
  await page.goto('/judge');
  await expect(page.getByText('Judge Control Panel')).toBeVisible();

  await page.goto('/overlay/live');
  await expect(page.locator('body')).toContainText('Awaiting');
});

test('dashboard, hardware console, and spectator live render', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Live Competition Dashboard')).toBeVisible();
  await expect(page.getByText('Realtime Status')).toBeVisible();

  await page.goto('/hardware-console');
  await expect(page.getByText('Realtime Hardware Monitor')).toBeVisible();
  await expect(page.getByText('Layman Hardware Tutorial')).toBeVisible();

  await page.goto('/live');
  await expect(page.locator('body')).toContainText('Live Arena');
});
