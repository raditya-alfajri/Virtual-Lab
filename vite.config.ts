import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { apiRoutes } from './dev/api-routes.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The API functions read their keys from process.env, as they do on Vercel.
  // Only VITE_-prefixed variables ever reach the browser bundle.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    process.env[key] ??= value
  }
  return { plugins: [react(), tailwindcss(), apiRoutes()] }
})
