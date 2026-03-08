import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <-- MANA SHU QATOR "MENI TARMOQDA KO'RSAT" DEGANI
    port: 5173, // Portni o'zgarmas qilib qo'yamiz
  }
})