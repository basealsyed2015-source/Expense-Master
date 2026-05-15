import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  // Clear dist on each build so Cloudflare `_routes.json` is regenerated. A stale
  // `_routes.json` (e.g. from an old partial exclude list) makes the plugin skip
  // regeneration and leaves `/tailwind.css` routed to the worker → broken styles.
  build: {
    emptyOutDir: true,
  },
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})
