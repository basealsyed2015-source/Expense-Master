import type { Context } from 'hono'
import contractsAppJs from './contracts-module/js/app.js?raw'
import contractsDashboardJs from './contracts-module/js/dashboard.js?raw'

type UserInfo = {
  userId: number | null
  tenantId: number | null
  roleId: number | null
  tokenRoleId: number | null
}

type GetUserInfo = (c: Context) => Promise<UserInfo>

/**
 * Serve contracts JS from the Worker (bundled from src/contracts-module/js).
 * Do not add copies under public/contracts-module/js — static files there override this route and hide edits.
 */
export function registerContractsStaticRoutes(app: any, getUserInfo: GetUserInfo) {
  app.get('/contracts-module/js/app.js', async (c) => {
    const userInfo = await getUserInfo(c)
    if (!userInfo.userId) return c.newResponse('Unauthorized', 401)
    return c.newResponse(contractsAppJs, 200, {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate'
    })
  })
  app.get('/contracts-module/js/dashboard.js', async (c) => {
    const userInfo = await getUserInfo(c)
    if (!userInfo.userId) return c.newResponse('Unauthorized', 401)
    return c.newResponse(contractsDashboardJs, 200, {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate'
    })
  })
}
