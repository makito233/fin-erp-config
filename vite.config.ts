import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isUserOrOrgSite = repoName.endsWith('.github.io')
const base = isUserOrOrgSite || repoName === '' ? '/' : `/${repoName}/`

export default defineConfig({
  base,
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
