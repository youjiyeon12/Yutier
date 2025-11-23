import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  //GitHub Actions용 경로 설정
  base: '/Yutier/',
  //개발 서버 설정(로컬에서만 사용됨)
  server: {
    proxy: {
      '/api': process.env.VITE_API_URL,
    }
  }
})
