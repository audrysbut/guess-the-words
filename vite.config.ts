import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon-32.png', 'favicon-16.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Atspėk Žodžius',
        short_name: 'Atspėk Žodžius',
        description: 'Multiplayer word guessing game',
        theme_color: '#6366f1',
        background_color: '#1e1b4b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/guess-the-words/',
        scope: '/guess-the-words/',
        icons: [
          {
            src: '/guess-the-words/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/guess-the-words/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/guess-the-words/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  base: '/guess-the-words/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 4200,
  },
})
