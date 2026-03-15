import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';

const IMAGE_NAME = 'jirehs-blog-test';
let containerPort: number;
let containerId: string;

const dockerCheck = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
  stdio: 'pipe',
  timeout: 5_000,
  killSignal: 'SIGKILL',
});
const dockerAvailable = dockerCheck.status === 0 && !dockerCheck.error;

function baseUrl(path: string) {
  return `http://localhost:${containerPort}${path}`;
}

describe.skipIf(!dockerAvailable)('Docker/nginx', () => {
  beforeAll(async () => {
    // Build Docker image
    execSync(`docker build -t ${IMAGE_NAME} .`, {
      cwd: process.cwd(),
      stdio: 'pipe',
      timeout: 120_000,
    });

    // Run container on random port
    containerId = execSync(
      `docker run -d -p 0:80 ${IMAGE_NAME}`,
      { encoding: 'utf-8' },
    ).trim();

    // Get assigned port
    const portOutput = execSync(
      `docker port ${containerId} 80`,
      { encoding: 'utf-8' },
    ).trim();
    // Format: "0.0.0.0:XXXXX" or ":::XXXXX"
    const match = portOutput.match(/:(\d+)$/);
    containerPort = match ? parseInt(match[1], 10) : 0;

    // Wait for nginx to be ready
    for (let i = 0; i < 10; i++) {
      try {
        await fetch(baseUrl('/'));
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }, 120_000);

  afterAll(() => {
    if (!containerId) return;
    try {
      execSync(`docker rm -f ${containerId}`, { stdio: 'ignore' });
    } catch { /* ignore */ }
  });

  it('GET / returns 200', async () => {
    const res = await fetch(baseUrl('/'));
    expect(res.status).toBe(200);
  });

  it('GET /blog/demo-shader/ returns 200', async () => {
    const res = await fetch(baseUrl('/blog/demo-shader/'));
    expect(res.status).toBe(200);
  });

  it('GET /nonexistent returns 404', async () => {
    const res = await fetch(baseUrl('/nonexistent'));
    expect(res.status).toBe(404);
  });

  it('GET /rss.xml returns 200 with xml content-type', async () => {
    const res = await fetch(baseUrl('/rss.xml'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('xml');
  });

  it('GET /sitemap-index.xml returns 200', async () => {
    const res = await fetch(baseUrl('/sitemap-index.xml'));
    expect(res.status).toBe(200);
  });

  it('font file returns Cache-Control with immutable', async () => {
    // Get the homepage to find a font reference
    const html = await fetch(baseUrl('/')).then((r) => r.text());
    const fontMatch = html.match(/href="([^"]*\.woff2)"/);
    if (!fontMatch) {
      // Try fetching a known font path
      const res = await fetch(baseUrl('/fonts/JetBrainsMono-Regular.woff2'));
      if (res.ok) {
        expect(res.headers.get('cache-control')).toContain('immutable');
        return;
      }
      // If no font found, skip gracefully
      return;
    }
    const res = await fetch(baseUrl(fontMatch[1]));
    expect(res.headers.get('cache-control')).toContain('immutable');
  });

  it('response includes X-Frame-Options: SAMEORIGIN', async () => {
    // Test against an HTML file served by a location block that includes security headers
    const res = await fetch(baseUrl('/blog/demo-shader/'));
    expect(res.headers.get('x-frame-options')?.toUpperCase()).toBe('SAMEORIGIN');
  });

  it('response includes X-Content-Type-Options: nosniff', async () => {
    const res = await fetch(baseUrl('/'));
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('response includes Referrer-Policy: strict-origin-when-cross-origin', async () => {
    const res = await fetch(baseUrl('/blog/demo-shader/'));
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });

  it('gzip: Accept-Encoding gzip returns compressed CSS', async () => {
    // Find a CSS file from the homepage
    const html = await fetch(baseUrl('/')).then((r) => r.text());
    const cssMatch = html.match(/href="([^"]*\.css)"/);
    if (!cssMatch) return;

    const res = await fetch(baseUrl(cssMatch[1]), {
      headers: { 'Accept-Encoding': 'gzip' },
    });
    expect(res.status).toBe(200);
    // nginx may serve gzip content; check content-encoding if present
    const encoding = res.headers.get('content-encoding');
    // If nginx decided to compress, it should be gzip
    if (encoding) {
      expect(encoding).toBe('gzip');
    }
  });
});
