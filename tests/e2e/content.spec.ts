import { test, expect } from '@playwright/test';

test.describe('content rendering', () => {
  test('/blog/demo-shader/ renders with title "The Art System"', async ({ page }) => {
    await page.goto('/blog/demo-shader/');
    await expect(page.locator('h1')).toContainText('The Art System');
  });

  test('code blocks have Shiki syntax highlighting classes', async ({ page }) => {
    await page.goto('/blog/demo-shader/');

    // Shiki wraps code in <pre> with a theme class
    const codeBlock = page.locator('pre.astro-code, pre.shiki, pre[data-language]').first();
    await expect(codeBlock).toBeVisible();
  });

  test('shader canvas or fallback gradient present in hero', async ({ page }) => {
    await page.goto('/blog/demo-shader/');

    // Either a <canvas> from ShaderCanvas or a fallback <div> with gradient
    const canvas = page.locator('.hero canvas, .hero__canvas');
    const fallback = page.locator('.hero div[aria-hidden="true"]');

    const hasCanvas = await canvas.count() > 0;
    const hasFallback = await fallback.count() > 0;

    expect(hasCanvas || hasFallback).toBe(true);
  });
});
