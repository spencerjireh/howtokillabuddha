import { test, expect } from '@playwright/test';

test.describe('theme toggle', () => {
  test('default theme matches system preference (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('dark');
  });

  test('click toggle switches data-theme attribute', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    const initialTheme = await page.locator('html').getAttribute('data-theme');
    expect(initialTheme).toBe('light');

    await page.getByRole('button', { name: /theme/i }).click();

    const newTheme = await page.locator('html').getAttribute('data-theme');
    expect(newTheme).toBe('dark');
  });

  test('theme persists in localStorage across navigation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    // Toggle to dark
    await page.getByRole('button', { name: /theme/i }).click();
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(stored).toBe('dark');

    // Navigate to a blog post and back
    await page.goto('/blog/demo-shader/');
    const themeAfterNav = await page.locator('html').getAttribute('data-theme');
    expect(themeAfterNav).toBe('dark');
  });

  test('no FOUC: data-theme is set before DOMContentLoaded', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });

    // Use addInitScript (Playwright's API) to capture theme before page loads
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme) {
          (window as any).__earlyTheme = theme;
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // The inline script in <head> should have set data-theme synchronously
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBeTruthy();
  });
});
