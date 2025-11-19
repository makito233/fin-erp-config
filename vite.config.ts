import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/ft': {
        target: 'https://financial-troubleshooter-prod.internal.glovoapp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ft/, ''),
      },
    },
  },
})

