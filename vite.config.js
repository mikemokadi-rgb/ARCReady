import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        // In dev, proxy /api/claude -> Anthropic API server-side (bypasses CORS)
        '/api/claude': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => '/v1/messages',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // Inject API key server-side so it never appears in browser
              proxyReq.setHeader('x-api-key', env.VITE_ANTHROPIC_API_KEY || '')
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.removeHeader('x-api-key') // remove browser-sent key
              proxyReq.setHeader('x-api-key', env.VITE_ANTHROPIC_API_KEY || '')
            })
          },
        },
      },
    },
  }
})