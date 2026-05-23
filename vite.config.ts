/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // @ts-expect-error - Conflito de tipagem entre Vite 8 e Vitest 2
  plugins: [react()],
  server: {
    host: '127.0.0.1',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    exclude: ['node_modules', '.claude/**'],
    coverage: { provider: 'v8', include: ['src/**/*.{ts,tsx}'] },
  },
})
