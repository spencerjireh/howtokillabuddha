import { test, expect } from '@playwright/test';

test.describe('accessibility', () => {
  test('skip-to-content link is visible on Tab', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test('all images have alt text or aria-hidden', async ({ page }) => {
    await page.goto('/blog/demo-shader/');

    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      const role = await img.getAttribute('role');
      expect(
        alt !== null || ariaHidden === 'true' || role === 'presentation',
        `Image missing alt text: ${await img.getAttribute('src')}`,
      ).toBe(true);
    }
  });

  test('heading hierarchy has no skipped levels', async ({ page }) => {
    await page.goto('/blog/demo-shader/');

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let lastLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
      const level = parseInt(tagName.replace('h', ''), 10);
      // Each heading should be at most 1 level deeper than the previous
      if (lastLevel > 0) {
        expect(
          level <= lastLevel + 1,
          `Heading level skipped: h${lastLevel} followed by h${level}`,
        ).toBe(true);
      }
      lastLevel = level;
    }
  });
});
