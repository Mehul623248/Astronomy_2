import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite' // Add this

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Add this
  ],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    }
  }
})
