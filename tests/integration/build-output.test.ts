import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve(__dirname, '../../dist');

describe('build output', () => {
  beforeAll(() => {
    if (!existsSync(DIST)) {
      throw new Error(
        'dist/ does not exist. Run "npm run build" before running integration tests.',
      );
    }
  });

  it('dist/index.html exists and links to /blog/demo-shader', () => {
    const html = readFileSync(resolve(DIST, 'index.html'), 'utf-8');
    expect(html).toContain('/blog/demo-shader');
  });

  it('dist/blog/demo-shader/index.html exists and is non-empty', () => {
    const path = resolve(DIST, 'blog/demo-shader/index.html');
    expect(existsSync(path)).toBe(true);
    const html = readFileSync(path, 'utf-8');
    expect(html.length).toBeGreaterThan(0);
  });

  it('dist/rss.xml contains <rss and at least one <item>', () => {
    const xml = readFileSync(resolve(DIST, 'rss.xml'), 'utf-8');
    expect(xml).toContain('<rss');
    expect(xml).toContain('<item>');
  });

  it('dist/sitemap-index.xml contains <sitemapindex>', () => {
    const xml = readFileSync(resolve(DIST, 'sitemap-index.xml'), 'utf-8');
    expect(xml).toContain('<sitemapindex');
  });

  it('dist/pagefind/ exists with pagefind.js', () => {
    const pagefindDir = resolve(DIST, 'pagefind');
    expect(existsSync(pagefindDir)).toBe(true);
    const files = readdirSync(pagefindDir);
    expect(files.some((f) => f.includes('pagefind'))).toBe(true);
  });

  it('dist/404.html exists and contains "404"', () => {
    const html = readFileSync(resolve(DIST, '404.html'), 'utf-8');
    expect(html).toContain('404');
  });

  it('dist/index.html does NOT link to the draft post', () => {
    const html = readFileSync(resolve(DIST, 'index.html'), 'utf-8');
    expect(html).not.toContain('/blog/test-post');
  });

  it('dist/blog/test-post/index.html exists (page built even though draft)', () => {
    const path = resolve(DIST, 'blog/test-post/index.html');
    expect(existsSync(path)).toBe(true);
  });
});
