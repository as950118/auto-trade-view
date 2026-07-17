import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.REACT_APP_API_URL || 'https://localhost:8000'

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'REACT_APP_'],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})

