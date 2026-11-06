import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 주소(https://<user>.github.io/Yutier/)에 맞춘 경로
  base: '/Yutier/',
})
