import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Servido no GitHub Pages em /neuralempire/ (deploy automático a cada push — ver .github/workflows/deploy.yml)
  base: '/neuralempire/',
  // Muda a cada build → prova visual de que o PWA instalado atualizou após um push
  define: { __BUILD_ID__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Neural Empire',
        short_name: 'NeuralEmpire',
        description:
          'Construa o maior laboratório de IA do mundo aprendendo machine learning de verdade.',
        lang: 'pt-BR',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0d1117',
        theme_color: '#0d1117',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache do app inteiro (JS/CSS/HTML/ícones/datasets) → offline após o 1º load.
        globPatterns: ['**/*.{js,css,html,svg,png,csv,woff2}'],
        // Pyodide + numpy/pandas/sklearn (~60 MB) vêm do CDN e ficam no Cache Storage
        // no primeiro uso. CacheFirst: depois disso nunca mais toca a rede.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pyodide-v314',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
