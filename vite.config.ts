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
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'apple-touch-icon.png',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'spoter-logo-cor-small.svg',
        'robots.txt',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico}'],
      },
      manifest: {
        name: 'Spoter - Spotify Player',
        short_name: 'Spoter',
        description: 'A modern Spotify player with a vinyl touch',
        theme_color: '#44aa00',
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
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
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
            description: 'Ver meus artistas favoritos',
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
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('framer-motion') || id.includes('@base-ui/react')) {
              return 'vendor-ui';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor-others';
          }
        },
      },
    },
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
    globals: true,
    setupFiles: './src/test-setup.ts',
    exclude: ['node_modules', '.claude/**', 'tests-e2e/**'],
    coverage: { provider: 'v8', include: ['src/**/*.{ts,tsx}'] },
  },
} as any)
