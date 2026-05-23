/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
      },
      manifest: {
        name: 'Spoter',
        short_name: 'Spoter',
        description: 'A modern Spotify player with a vinyl touch',
        theme_color: '#44aa00',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
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
    exclude: ['node_modules', '.claude/**', 'tests-e2e/**'],
    coverage: { provider: 'v8', include: ['src/**/*.{ts,tsx}'] },
  },
})
