import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./client/src/test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.replit', 'attached_assets'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
