import { describe, it, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');
const TMP = resolve(ROOT, 'tests/.tmp-validate');
const SCRIPT = resolve(ROOT, 'scripts/validate-posts.mjs');

function runValidation(
  contentFiles: string[],
  pageFiles: string[],
  opts?: { skipContentDir?: boolean; skipPagesDir?: boolean },
): string {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const contentDir = resolve(TMP, 'src/content/blog');
  const pagesDir = resolve(TMP, 'src/pages/blog');

  if (!opts?.skipContentDir) mkdirSync(contentDir, { recursive: true });
  if (!opts?.skipPagesDir) mkdirSync(pagesDir, { recursive: true });

  for (const f of contentFiles) writeFileSync(resolve(contentDir, f), '');
  for (const f of pageFiles) writeFileSync(resolve(pagesDir, f), '');

  const result = spawnSync('node', [SCRIPT, TMP], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return (result.stdout ?? '') + (result.stderr ?? '');
}

describe('validate-posts', () => {
  afterAll(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('logs success when MDX and page slugs match', () => {
    const output = runValidation(
      ['demo-shader.mdx', 'test-post.mdx'],
      ['demo-shader.astro', 'test-post.astro'],
    );
    expect(output).toContain('[ok]');
  });

  it('warns on orphaned MDX with no matching page', () => {
    const output = runValidation(
      ['demo-shader.mdx', 'orphan.mdx'],
      ['demo-shader.astro'],
    );
    expect(output).toContain('orphaned content');
    expect(output).toContain('orphan.mdx');
  });

  it('warns on orphaned page with no matching MDX', () => {
    const output = runValidation(
      ['demo-shader.mdx'],
      ['demo-shader.astro', 'orphan.astro'],
    );
    expect(output).toContain('orphaned page');
    expect(output).toContain('orphan.astro');
  });

  it('reports both orphan types simultaneously', () => {
    const output = runValidation(
      ['only-mdx.mdx'],
      ['only-page.astro'],
    );
    expect(output).toContain('orphaned content');
    expect(output).toContain('orphaned page');
  });

  it('handles empty content directory gracefully', () => {
    const output = runValidation([], [], { skipContentDir: true });
    expect(output).toContain('[ok]');
  });

  it('handles empty pages directory gracefully', () => {
    const output = runValidation([], [], { skipPagesDir: true });
    expect(output).toContain('[ok]');
  });
});
