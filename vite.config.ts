// FILE: vite.config.js

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),

    // @quasar/plugin-vite options list:
    // https://github.com/quasarframework/quasar/blob/dev/vite-plugin/index.d.ts
    quasar({
      sassVariables: fileURLToPath(
        new URL('./src/quasar-variables.sass', import.meta.url)
      )
    })
  ],
  define: {
    'process.env': {}
  },
  server: {
    port: 3001, // ⬅️ PUERTO DEL FRONTEND (desarrollo)
    host: true, // Permite conexiones externas
    strictPort: true, // Si el puerto está ocupado, no cambia automáticamente
  }
})
