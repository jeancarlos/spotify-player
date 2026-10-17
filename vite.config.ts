/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

import { VitePWA } from 'vite-plugin-pwa'

// Dev server injects an inline HMR preamble, so the CSP is only applied to the build.
const CSP =
  "default-src 'self'; script-src 'self' https://api.deezer.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; media-src https:; connect-src 'self' https://api.deezer.com https://lrclib.net https://*.wikipedia.org; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"

export default defineConfig(() => ({
  base: '/',
  plugins: [
    react(),
    {
      name: 'inject-csp',
      apply: 'build' as const,
      transformIndexHtml: () => [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend' as const,
        },
      ],
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'apple-touch-icon.png',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'robots.txt',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Vinyla',
        short_name: 'Vinyla',
        description: 'A modern music player with Deezer previews and a vinyl touch',
        theme_color: '#FF6B4A',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        categories: ['music', 'entertainment', 'utilities'],
        lang: 'pt-BR',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Home',
            short_name: 'Home',
            description: 'Ir para a página inicial',
            url: '/',
            icons: [{ src: 'favicon-32x32.png', sizes: '32x32' }],
          },
          {
            name: 'Artistas',
            short_name: 'Artistas',
            description: 'Buscar e explorar artistas',
            url: '/artists',
            icons: [{ src: 'favicon-32x32.png', sizes: '32x32' }],
          },
          {
            name: 'Favoritos',
            short_name: 'Favoritos',
            description: 'Ver minhas músicas favoritas',
            url: '/favorites',
            icons: [{ src: 'favicon-32x32.png', sizes: '32x32' }],
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: '127.0.0.1',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    testTimeout: 15000,
    globals: true,
    setupFiles: './src/test-setup.ts',
    exclude: ['node_modules', '.*/**', 'tests-e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
}))
