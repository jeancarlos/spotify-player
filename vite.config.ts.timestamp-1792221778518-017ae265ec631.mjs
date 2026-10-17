// vite.config.ts
import { defineConfig } from "file:///home/jean/PROJECTS/vinyla-player-demo/node_modules/vite/dist/node/index.js";
import react from "file:///home/jean/PROJECTS/vinyla-player-demo/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { VitePWA } from "file:///home/jean/PROJECTS/vinyla-player-demo/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "/home/jean/PROJECTS/vinyla-player-demo";
var CSP = "default-src 'self'; script-src 'self' https://api.deezer.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src https:; connect-src 'self' https://api.deezer.com https://lrclib.net https://*.wikipedia.org; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
var vite_config_default = defineConfig(() => ({
  base: "/",
  plugins: [
    react(),
    {
      name: "inject-csp",
      apply: "build",
      transformIndexHtml: () => [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content: CSP },
          injectTo: "head-prepend"
        }
      ]
    },
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "apple-touch-icon.png",
        "favicon-32x32.png",
        "favicon-16x16.png",
        "robots.txt"
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,ico}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: "Vinyla",
        short_name: "Vinyla",
        description: "A modern music player with Deezer previews and a vinyl touch",
        theme_color: "#FF6B4A",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        categories: ["music", "entertainment", "utilities"],
        lang: "pt-BR",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        shortcuts: [
          {
            name: "Home",
            short_name: "Home",
            description: "Ir para a p\xE1gina inicial",
            url: "/",
            icons: [{ src: "favicon-32x32.png", sizes: "32x32" }]
          },
          {
            name: "Artistas",
            short_name: "Artistas",
            description: "Buscar e explorar artistas",
            url: "/artists",
            icons: [{ src: "favicon-32x32.png", sizes: "32x32" }]
          },
          {
            name: "Favoritos",
            short_name: "Favoritos",
            description: "Ver minhas m\xFAsicas favoritas",
            url: "/favorites",
            icons: [{ src: "favicon-32x32.png", sizes: "32x32" }]
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("framer-motion")) {
              return "vendor-ui";
            }
            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            return "vendor-others";
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    host: "127.0.0.1"
  },
  resolve: {
    alias: { "@": path.resolve(__vite_injected_original_dirname, "./src") }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts",
    exclude: ["node_modules", ".*/**", "tests-e2e/**"],
    coverage: { provider: "v8", include: ["src/**/*.{ts,tsx}"], thresholds: { 100: true } }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9qZWFuL1BST0pFQ1RTL3ZpbnlsYS1wbGF5ZXItZGVtb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvamVhbi9QUk9KRUNUUy92aW55bGEtcGxheWVyLWRlbW8vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvamVhbi9QUk9KRUNUUy92aW55bGEtcGxheWVyLWRlbW8vdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSdcblxuLy8gRGV2IHNlcnZlciBpbmplY3RzIGFuIGlubGluZSBITVIgcHJlYW1ibGUsIHNvIHRoZSBDU1AgaXMgb25seSBhcHBsaWVkIHRvIHRoZSBidWlsZC5cbmNvbnN0IENTUCA9XG4gIFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJyBodHRwczovL2FwaS5kZWV6ZXIuY29tOyBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tOyBmb250LXNyYyBodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tOyBpbWctc3JjICdzZWxmJyBkYXRhOiBibG9iOiBodHRwczo7IG1lZGlhLXNyYyBodHRwczo7IGNvbm5lY3Qtc3JjICdzZWxmJyBodHRwczovL2FwaS5kZWV6ZXIuY29tIGh0dHBzOi8vbHJjbGliLm5ldCBodHRwczovLyoud2lraXBlZGlhLm9yZzsgd29ya2VyLXNyYyAnc2VsZic7IG1hbmlmZXN0LXNyYyAnc2VsZic7IG9iamVjdC1zcmMgJ25vbmUnOyBiYXNlLXVyaSAnc2VsZic7IGZvcm0tYWN0aW9uICdzZWxmJ1wiXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoKSA9PiAoe1xuICBiYXNlOiAnLycsXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHtcbiAgICAgIG5hbWU6ICdpbmplY3QtY3NwJyxcbiAgICAgIGFwcGx5OiAnYnVpbGQnIGFzIGNvbnN0LFxuICAgICAgdHJhbnNmb3JtSW5kZXhIdG1sOiAoKSA9PiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0YWc6ICdtZXRhJyxcbiAgICAgICAgICBhdHRyczogeyAnaHR0cC1lcXVpdic6ICdDb250ZW50LVNlY3VyaXR5LVBvbGljeScsIGNvbnRlbnQ6IENTUCB9LFxuICAgICAgICAgIGluamVjdFRvOiAnaGVhZC1wcmVwZW5kJyBhcyBjb25zdCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgaW5jbHVkZUFzc2V0czogW1xuICAgICAgICAnZmF2aWNvbi5zdmcnLFxuICAgICAgICAnZmF2aWNvbi5pY28nLFxuICAgICAgICAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLFxuICAgICAgICAnZmF2aWNvbi0zMngzMi5wbmcnLFxuICAgICAgICAnZmF2aWNvbi0xNngxNi5wbmcnLFxuICAgICAgICAncm9ib3RzLnR4dCcsXG4gICAgICBdLFxuICAgICAgd29ya2JveDoge1xuICAgICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsc3ZnLHBuZyx3ZWJwLGljb30nXSxcbiAgICAgICAgY2xlYW51cE91dGRhdGVkQ2FjaGVzOiB0cnVlLFxuICAgICAgICBza2lwV2FpdGluZzogdHJ1ZSxcbiAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgIG5hbWU6ICdWaW55bGEnLFxuICAgICAgICBzaG9ydF9uYW1lOiAnVmlueWxhJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIG1vZGVybiBtdXNpYyBwbGF5ZXIgd2l0aCBEZWV6ZXIgcHJldmlld3MgYW5kIGEgdmlueWwgdG91Y2gnLFxuICAgICAgICB0aGVtZV9jb2xvcjogJyNGRjZCNEEnLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2ZmZmZmZicsXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdC1wcmltYXJ5JyxcbiAgICAgICAgc3RhcnRfdXJsOiAnLycsXG4gICAgICAgIGNhdGVnb3JpZXM6IFsnbXVzaWMnLCAnZW50ZXJ0YWlubWVudCcsICd1dGlsaXRpZXMnXSxcbiAgICAgICAgbGFuZzogJ3B0LUJSJyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdmYXZpY29uLnN2ZycsXG4gICAgICAgICAgICBzaXplczogJ2FueScsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2Uvc3ZnK3htbCcsXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2FuZHJvaWQtY2hyb21lLTE5MngxOTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2FuZHJvaWQtY2hyb21lLTUxMng1MTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2FuZHJvaWQtY2hyb21lLTUxMng1MTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgc2hvcnRjdXRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ0hvbWUnLFxuICAgICAgICAgICAgc2hvcnRfbmFtZTogJ0hvbWUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJciBwYXJhIGEgcFx1MDBFMWdpbmEgaW5pY2lhbCcsXG4gICAgICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgICAgIGljb25zOiBbeyBzcmM6ICdmYXZpY29uLTMyeDMyLnBuZycsIHNpemVzOiAnMzJ4MzInIH1dLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ0FydGlzdGFzJyxcbiAgICAgICAgICAgIHNob3J0X25hbWU6ICdBcnRpc3RhcycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0J1c2NhciBlIGV4cGxvcmFyIGFydGlzdGFzJyxcbiAgICAgICAgICAgIHVybDogJy9hcnRpc3RzJyxcbiAgICAgICAgICAgIGljb25zOiBbeyBzcmM6ICdmYXZpY29uLTMyeDMyLnBuZycsIHNpemVzOiAnMzJ4MzInIH1dLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ0Zhdm9yaXRvcycsXG4gICAgICAgICAgICBzaG9ydF9uYW1lOiAnRmF2b3JpdG9zJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmVyIG1pbmhhcyBtXHUwMEZBc2ljYXMgZmF2b3JpdGFzJyxcbiAgICAgICAgICAgIHVybDogJy9mYXZvcml0ZXMnLFxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogJ2Zhdmljb24tMzJ4MzIucG5nJywgc2l6ZXM6ICczMngzMicgfV0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rcyhpZDogc3RyaW5nKSB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItcmVhY3QnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlY2hhcnRzJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItY2hhcnRzJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdmcmFtZXItbW90aW9uJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItdWknXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXF1ZXJ5J1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1pY29ucydcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yLW90aGVycydcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA2MDAsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6ICcxMjcuMC4wLjEnLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHsgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSB9LFxuICB9LFxuICB0ZXN0OiB7XG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBzZXR1cEZpbGVzOiAnLi9zcmMvdGVzdC1zZXR1cC50cycsXG4gICAgZXhjbHVkZTogWydub2RlX21vZHVsZXMnLCAnLiovKionLCAndGVzdHMtZTJlLyoqJ10sXG4gICAgY292ZXJhZ2U6IHsgcHJvdmlkZXI6ICd2OCcsIGluY2x1ZGU6IFsnc3JjLyoqLyoue3RzLHRzeH0nXSwgdGhyZXNob2xkczogeyAxMDA6IHRydWUgfSB9LFxuICB9LFxufSkpXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUVqQixTQUFTLGVBQWU7QUFMeEIsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTSxNQUNKO0FBRUYsSUFBTyxzQkFBUSxhQUFhLE9BQU87QUFBQSxFQUNqQyxNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1Asb0JBQW9CLE1BQU07QUFBQSxRQUN4QjtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsT0FBTyxFQUFFLGNBQWMsMkJBQTJCLFNBQVMsSUFBSTtBQUFBLFVBQy9ELFVBQVU7QUFBQSxRQUNaO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGVBQWU7QUFBQSxRQUNiO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFT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
