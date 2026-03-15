import { readdirSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CONTENT_DIR = resolve(ROOT, 'src/content/blog');
const PAGES_DIR = resolve(ROOT, 'src/pages/blog');

let hasErrors = false;

// Get all MDX slugs
const mdxFiles = existsSync(CONTENT_DIR)
  ? readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'))
  : [];
const mdxSlugs = mdxFiles.map((f) => basename(f, '.mdx'));

// Get all page slugs
const pageFiles = existsSync(PAGES_DIR)
  ? readdirSync(PAGES_DIR).filter((f) => f.endsWith('.astro'))
  : [];
const pageSlugs = pageFiles.map((f) => basename(f, '.astro'));

// Check for orphaned MDX files (no matching page)
for (const slug of mdxSlugs) {
  if (!pageSlugs.includes(slug)) {
    console.warn(`[warn] orphaned content: src/content/blog/${slug}.mdx has no matching page file`);
    hasErrors = true;
  }
}

// Check for orphaned page files (no matching MDX)
for (const slug of pageSlugs) {
  if (!mdxSlugs.includes(slug)) {
    console.warn(`[warn] orphaned page: src/pages/blog/${slug}.astro has no matching content file`);
    hasErrors = true;
  }
}

if (!hasErrors) {
  console.log('[ok] all blog posts have matching content and page files');
}
