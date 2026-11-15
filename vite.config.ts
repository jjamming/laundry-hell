import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/laundry-hell/', // GitHub Pages 프로젝트 경로
  plugins: [react()],
})
