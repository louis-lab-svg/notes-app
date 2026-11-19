import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Adresse de l'appli une fois en ligne : https://<ton-pseudo>.github.io/notes-app/
// Si tu renommes le dépôt GitHub, change aussi le nom ici.
const REPO = 'notes-app';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? `/${REPO}/` : '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate', // une nouvelle version en ligne s'installe toute seule
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Notes',
        short_name: 'Notes',
        description: 'Prise de notes Markdown avec liens et graphe',
        lang: 'fr',
        display: 'standalone', // s'ouvre comme une vraie appli, sans la barre du navigateur
        theme_color: '#7c5cff',
        background_color: '#ffffff',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tous les fichiers de l'appli sont gardés sur l'appareil → marche hors connexion.
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
    }),
  ],
}));
