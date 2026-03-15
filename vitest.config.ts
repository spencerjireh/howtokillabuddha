import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@/': resolve(__dirname, 'src') + '/',
      '@components/': resolve(__dirname, 'src/components') + '/',
      '@layouts/': resolve(__dirname, 'src/layouts') + '/',
      '@styles/': resolve(__dirname, 'src/styles') + '/',
      '@art/': resolve(__dirname, 'src/art') + '/',
      'astro:content': resolve(__dirname, 'tests/helpers/astro-content-mock.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
});
