import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://mariahdavalos.github.io/healthcare-scheduling/, a
// subpath, so asset URLs need this prefix baked in at build time.
export default defineConfig({
  base: '/healthcare-scheduling/',
  plugins: [react()],
})
