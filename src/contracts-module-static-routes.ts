import type { Hono } from 'hono'
import contractsAppJs from './contracts-module/js/app.js?raw'
import contractsDashboardJs from './contracts-module/js/dashboard.js?raw'

/**
 * Serve contracts JS from the Worker (bundled from src/contracts-module/js).
 * Do not add copies under public/contracts-module/js — static files there override this route and hide edits.
 */
export function registerContractsStaticRoutes(app: Hono) {
  app.get('/contracts-module/js/app.js', (c) =>
    c.newResponse(contractsAppJs, 200, {
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate'
      }
    })
  )
  app.get('/contracts-module/js/dashboard.js', (c) =>
    c.newResponse(contractsDashboardJs, 200, {
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate'
      }
    })
  )
}
