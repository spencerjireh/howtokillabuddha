import { test, expect } from '@playwright/test';

test.describe('error and edge-case paths', () => {
  test('404 page renders for non-existent route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('.not-found__message')).toContainText('Nothing here');
    await expect(page.locator('.not-found__link')).toBeVisible();
  });

  test('search shows "No results" for gibberish query', async ({ page }) => {
    await page.goto('/');
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.locator('#search-modal')).not.toHaveAttribute('hidden', '');

    await page.locator('#search-input').fill('zzzzxqjkmnop');
    await expect(page.locator('.search-modal__no-results')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('.search-modal__no-results')).toContainText('No results');
  });
});
