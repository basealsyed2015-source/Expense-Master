import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // .env is loaded here — process.env in a static config runs too early and ignores WRANGLER_* vars
  const env = loadEnv(mode, process.cwd(), '')

  return {
  // Clear dist on each build so Cloudflare `_routes.json` is regenerated. A stale
  // `_routes.json` (e.g. from an old partial exclude list) makes the plugin skip
  // regeneration and leaves `/tailwind.css` routed to the worker → broken styles.
  build: {
    emptyOutDir: true,
  },
  plugins: [
    build(),
    devServer({
      adapter: () =>
        adapter({
          proxy: {
            configPath: env.WRANGLER_CONFIG_PATH || 'wrangler.toml',
            ...(env.WRANGLER_PERSIST_PATH
              ? { persist: { path: env.WRANGLER_PERSIST_PATH } }
              : {}),
          },
        }),
      entry: 'src/index.tsx'
    })
  ]
  }
})
