import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
const native = process.env.FORMDA_NATIVE === '1';

export default defineConfig({
  base: native ? '/' : '/formda/',
  worker: { format: 'es' },
  build: { outDir: native ? 'dist-native' : 'dist' },
  server: {
    watch: {
      ignored: [
        '**/coverage/**',
        '**/docs/**',
        '**/.playwright-mcp/**',
        '**/reference/**',
        '**/test-results/**',
      ],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      disable: native,
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Formda · Kişisel spor ve beslenme koçun',
        short_name: 'Formda',
        description: 'Kişisel spor ve beslenme koçun. Verilerin cihazında kalır.',
        lang: 'tr',
        theme_color: '#087e83',
        background_color: '#f3f6f4',
        display: 'standalone',
        orientation: 'portrait-primary',
        id: '/formda/',
        start_url: '/formda/',
        scope: '/formda/',
        icons: [
          {
            src: 'icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,woff2,png,svg,json}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5000000,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 90 },
    },
  },
});
