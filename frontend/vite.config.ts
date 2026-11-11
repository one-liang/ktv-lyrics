import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 後端位址可用環境變數 KTV_API 改（預設 8000）
const api = process.env.KTV_API ?? 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': api,
    },
  },
})
