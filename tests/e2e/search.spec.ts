import { test, expect } from '@playwright/test';

test.describe('search modal', () => {
  test('Cmd+K / Ctrl+K opens search modal', async ({ page }) => {
    await page.goto('/');
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.locator('#search-modal')).not.toHaveAttribute('hidden', '');
  });

  test('typing produces results', async ({ page }) => {
    await page.goto('/');
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.locator('#search-modal')).not.toHaveAttribute('hidden', '');

    await page.locator('#search-input').fill('shader');
    // Wait for Pagefind results to load (debounce + async fetch)
    await expect(page.locator('.search-modal__result').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Escape closes modal', async ({ page }) => {
    await page.goto('/');
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.locator('#search-modal')).not.toHaveAttribute('hidden', '');

    await page.keyboard.press('Escape');
    await expect(page.locator('#search-modal')).toHaveAttribute('hidden', '');
  });

  test('backdrop click closes modal', async ({ page }) => {
    await page.goto('/');
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.locator('#search-modal')).not.toHaveAttribute('hidden', '');

    // Click on the backdrop overlay
    await page.locator('.search-modal__backdrop').click({ force: true });
    await expect(page.locator('#search-modal')).toHaveAttribute('hidden', '');
  });
});
