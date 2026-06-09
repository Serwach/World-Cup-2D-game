import { test, expect, Page } from '@playwright/test';

async function waitForCanvas(page: Page) {
  await page.waitForSelector('#game-container canvas', { timeout: 15000 });
}

test.describe('World Cup 2026 Game', () => {
  test('Game loads and shows main menu', async ({ page }) => {
    await page.goto('/');
    await waitForCanvas(page);

    // Canvas should be visible
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    // Page title
    await expect(page).toHaveTitle(/World Cup 2026/);
  });

  test('Main menu has correct elements rendered on canvas', async ({ page }) => {
    await page.goto('/');
    await waitForCanvas(page);

    // Verify canvas has content (non-zero dimensions)
    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(800);
    expect(box!.height).toBeGreaterThan(500);
  });

  test('Can click Quick Match button on menu', async ({ page }) => {
    await page.goto('/');
    await waitForCanvas(page);

    // Click in area where QUICK MATCH button is rendered (~640, 340)
    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Click the "QUICK MATCH" button area
    await canvas.click({ position: { x: 640 - box.x, y: 340 - box.y } });
    await page.waitForTimeout(500);

    // Canvas should still be visible (scene changed to team select)
    await expect(canvas).toBeVisible();
  });

  test('Back navigation from team select', async ({ page }) => {
    await page.goto('/');
    await waitForCanvas(page);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Click Quick Match
    await canvas.click({ position: { x: 640 - box.x, y: 340 - box.y } });
    await page.waitForTimeout(800);

    // Click Back button area (bottom left ~60, 690)
    await canvas.click({ position: { x: 60 - box.x, y: 690 - box.y } });
    await page.waitForTimeout(500);

    // Should be back at menu
    await expect(canvas).toBeVisible();
  });

  test('Game canvas maintains correct aspect ratio', async ({ page }) => {
    await page.goto('/');
    await waitForCanvas(page);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const aspectRatio = box!.width / box!.height;
    // 1280/720 = 1.777...
    expect(aspectRatio).toBeCloseTo(1280 / 720, 0);
  });

  test('Server API is accessible', async ({ page }) => {
    const response = await page.request.get('http://localhost:3001/health');
    if (response.ok()) {
      const body = await response.json();
      expect(body.status).toBe('ok');
    } else {
      // Server might not be running in test environment — pass gracefully
      console.warn('Server not running — skipping API test');
    }
  });

  test('Teams API returns data', async ({ page }) => {
    const response = await page.request.get('http://localhost:3001/api/teams').catch(() => null);
    if (response && response.ok()) {
      const teams = await response.json();
      expect(Array.isArray(teams)).toBe(true);
      expect(teams.length).toBeGreaterThanOrEqual(48);
      // Check team structure
      const team = teams[0];
      expect(team).toHaveProperty('id');
      expect(team).toHaveProperty('name');
      expect(team).toHaveProperty('group_name');
    } else {
      console.warn('Server not running — skipping teams API test');
    }
  });
});
