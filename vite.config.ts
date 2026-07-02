import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        // Loaded at runtime via chrome.sidePanel.setOptions, so it's not
        // referenced by the manifest and crxjs won't bundle it on its own.
        panel: 'src/popup/index.html',
        offscreen: 'src/offscreen/index.html',
        welcome: 'src/welcome/index.html',
      },
    },
  },
})
