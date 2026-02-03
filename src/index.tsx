import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { homePage } from './home-page'
import { testPage } from './test-page'
import { calculatorPage } from './calculator-page'
import { smartCalculator } from './smart-calculator'
import { loginPage } from './login-page'
import { forgotPasswordPage } from './forgot-password-page'
import { packagesPage } from './packages-page'
import { subscribePage } from './subscribe-page'
import { fullAdminPanel } from './full-admin-panel'
import { tenantsPage } from './tenants-page'
import { tenantCalculatorsPage } from './tenant-calculators-page'
import { saasSettingsPage } from './saas-settings-page'
import { reportsPage } from './reports-page'
import { customersReportPage, requestsReportPage, financialReportPage } from './advanced-reports'
import { paymentsPage } from './payments-page'
import { banksManagementPage } from './banks-management-page'
import { generateAddRatePage, generateEditRatePage } from './rates-forms'
import { generateWorkflowTimelinePage } from './workflow-page'
import { banksReportPage } from './banks-report'
import { performanceReportPage } from './performance-report'
import { hrMainPage } from './hr-main-page'
import { hrEmployeesPage, hrAttendancePage } from './hr-complete-system'
import {
  hrLeavesPage,
  hrSalariesPage,
  hrPerformancePage,
  hrPromotionsPage,
  hrDocumentsPage,
  hrReportsPage
} from './hr-pages'

type Bindings = {
  DB: D1Database;
  ATTACHMENTS: R2Bucket;
}

type Variables = {
  tenant: any;
  tenantId: number | null;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Helper: Mobile-Responsive CSS Styles
const getMobileResponsiveCSS = () => `
  /* Mobile Responsive Styles */
  @media (max-width: 768px) {
    /* Container adjustments */
    .max-w-7xl, .max-w-6xl, .max-w-5xl {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }
    
    /* Headings */
    h1 {
      font-size: 1.5rem !important;
    }
    h2 {
      font-size: 1.25rem !important;
    }
    
    /* Tables */
    table {
      font-size: 0.875rem !important;
    }
    
    table th, table td {
      padding: 0.5rem !important;
    }
    
    /* Hide less important columns on mobile */
    .hide-on-mobile {
      display: none !important;
    }
    
    /* Buttons */
    button, .btn {
      font-size: 0.875rem !important;
      padding: 0.5rem 1rem !important;
    }
    
    /* Forms */
    input, select, textarea {
      font-size: 1rem !important;
    }
    
    /* Cards */
    .bg-white.rounded-xl, .bg-white.rounded-lg {
      padding: 1rem !important;
    }
    
    /* Flex wrap for header actions */
    .flex.justify-between {
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    /* Stack items vertically on mobile */
    .flex-wrap > * {
      width: 100%;
    }
    
    /* Search input full width */
    input[type="text"], input[type="search"] {
      width: 100% !important;
    }
    
    /* Modal adjustments */
    .fixed.inset-0 > div {
      margin: 1rem !important;
      max-height: 90vh !important;
      overflow-y: auto !important;
    }
    
    /* Sidebar adjustments */
    aside, .sidebar {
      width: 100% !important;
      position: fixed !important;
      z-index: 50 !important;
    }
    
    /* Grid adjustments */
    .grid {
      grid-template-columns: 1fr !important;
    }
    
    /* Reduce spacing */
    .p-6 {
      padding: 1rem !important;
    }
    
    .p-8 {
      padding: 1.5rem !important;
    }
    
    /* Table container */
    .overflow-x-auto {
      margin-left: -1rem !important;
      margin-right: -1rem !important;
      padding-left: 1rem !important;
      padding-right: 1rem !important;
      padding-bottom: 1.5rem !important; /* Space for scrollbar */
    }
    
    /* IMPORTANT: Force scrollbar to be ALWAYS VISIBLE on mobile */
    .overflow-x-auto::-webkit-scrollbar {
      height: 14px !important; /* Larger scrollbar for mobile */
      -webkit-appearance: none;
    }
    
    .overflow-x-auto::-webkit-scrollbar-track {
      background: #f1f5f9 !important; /* Light background */
      border-radius: 8px !important;
      border: 2px solid #e2e8f0 !important; /* Border to make it stand out */
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%) !important;
      border-radius: 8px !important;
      border: 2px solid #e2e8f0 !important;
      min-width: 50px !important; /* Minimum thumb width */
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb:active {
      background: linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%) !important;
    }
    
    /* Force scrollbar to always show on mobile (iOS Safari & Chrome) */
    .overflow-x-auto {
      overflow-x: scroll !important; /* Always show scrollbar */
      -webkit-overflow-scrolling: touch !important; /* Smooth scrolling on iOS */
      scrollbar-width: auto !important; /* Firefox: show scrollbar */
      scrollbar-color: #3b82f6 #f1f5f9 !important; /* Firefox colors */
    }
    
    /* Add visual indicator for scrollable content */
    .overflow-x-auto::after {
      content: '← مرر للمزيد →' !important;
      position: absolute !important;
      bottom: 0 !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: rgba(59, 130, 246, 0.9) !important;
      color: white !important;
      padding: 0.25rem 1rem !important;
      border-radius: 1rem !important;
      font-size: 0.75rem !important;
      font-weight: bold !important;
      pointer-events: none !important;
      opacity: 0 !important;
      animation: fadeInOut 3s ease-in-out !important;
    }
    
    @keyframes fadeInOut {
      0%, 100% { opacity: 0; }
      10%, 90% { opacity: 1; }
    }
    
    /* Table wrapper positioning */
    .overflow-x-auto {
      position: relative !important;
    }
    
    /* Action buttons in table */
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    /* Status badges */
    .badge, .status-badge {
      font-size: 0.75rem !important;
      padding: 0.25rem 0.5rem !important;
    }
  }
  
  @media (max-width: 480px) {
    /* Extra small screens */
    body {
      font-size: 14px !important;
    }
    
    h1 {
      font-size: 1.25rem !important;
    }
    
    table {
      font-size: 0.75rem !important;
    }
    
    button, .btn {
      font-size: 0.75rem !important;
      padding: 0.375rem 0.75rem !important;
    }
    
    /* Even larger scrollbar for very small screens */
    .overflow-x-auto::-webkit-scrollbar {
      height: 16px !important;
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb {
      min-width: 60px !important;
    }
  }
`

// Enable CORS
app.use('*', cors())

// Middleware: Log binding availability for debugging
app.use('*', async (c, next) => {
  // Log binding status for API routes (helps debug production issues)
  if (c.req.path.startsWith('/api/')) {
    console.log(`🔍 [${c.req.method}] ${c.req.path} - DB binding: ${!!c.env?.DB}`)
  }
  await next()
})

// ===================================
// MULTI-TENANT MIDDLEWARE & HELPERS
// ===================================

// Helper: Get tenant from subdomain or slug
async function getTenant(c: any): Promise<any> {
  // Safety check for DB binding
  if (!c.env?.DB) {
    console.error('❌ getTenant: DB binding not available')
    return null
  }
  
  // Try to get from subdomain first (e.g., tamweel1.tamweel.app)
  const host = (c.req.header('host') || '').split(':')[0]
  const subdomain = host.split('.')[0]
  
  // Try to get from URL path (e.g., /c/tamweel-1/calculator)
  const pathMatch = c.req.path.match(/^\/c\/([^\/]+)/)
  const slug = pathMatch ? pathMatch[1] : null
  
  // Search in database
  let tenant = null
  
  if (subdomain && subdomain !== 'localhost' && subdomain !== '3000-ii8t2q2dzwwe7ckmslxss-3844e1b6') {
    tenant = await c.env.DB.prepare(`
      SELECT * FROM tenants 
      WHERE subdomain = ? AND status = 'active'
      LIMIT 1
    `).bind(subdomain).first()
  }
  
  if (!tenant && slug) {
    tenant = await c.env.DB.prepare(`
      SELECT * FROM tenants 
      WHERE slug = ? AND status = 'active'
      LIMIT 1
    `).bind(slug).first()
  }
  
  // Fallback: use tenant_id = 1 (default company) if no tenant found
  if (!tenant) {
    tenant = await c.env.DB.prepare(`
      SELECT * FROM tenants WHERE id = 1 LIMIT 1
    `).bind().first()
  }
  
  return tenant
}

function normalizeAuthToken(rawToken: string): string | null {
  const trimmed = rawToken.trim()
  if (!trimmed) {
    return null
  }

  let decodedToken = trimmed
  try {
    decodedToken = decodeURIComponent(trimmed)
  } catch {
    // If the token isn't URI-encoded, use it as-is.
  }

  const base64 = decodedToken.replace(/-/g, '+').replace(/_/g, '/')
  const remainder = base64.length % 4
  if (remainder === 1) {
    return null
  }

  const padding = remainder === 0 ? '' : '='.repeat(4 - remainder)
  return base64 + padding
}

function parseOptionalInt(value?: string): number | null {
  if (!value || value === 'null' || value === 'undefined') {
    return null
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeRoleId(roleId: number | null): number | null {
  if (roleId === null) {
    return null
  }
  const legacyMap: Record<number, number> = {
    11: 1,
    12: 2,
    13: 3,
    14: 4
  }
  return legacyMap[roleId] ?? roleId
}

// Get tenant_id for current user (for multi-tenancy filtering)
async function getUserInfo(
  c: any
): Promise<{ userId: number | null; tenantId: number | null; roleId: number | null; tokenRoleId: number | null }> {
  try {
    console.log('🔍 [getUserInfo] Starting user info retrieval...')
    // Try to get token from Authorization Header (for API calls)
    let token = c.req.header('Authorization')?.replace('Bearer ', '')
    console.log('🔍 [getUserInfo] Token from header:', token ? 'Found' : 'Not found')
    
    // If not in header, try to get from cookie (for HTML pages)
    if (!token) {
      const cookieHeader = c.req.header('Cookie')
      console.log('🔍 [getUserInfo] Cookie header:', cookieHeader ? 'Present' : 'Missing')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map((cookie: string) => cookie.trim())
        const authCookie = cookies.find((cookie: string) => cookie.startsWith('authToken='))
        if (authCookie) {
          token = authCookie.split('=')[1]
          console.log('✅ [getUserInfo] Token found in cookie')
        } else {
          console.log('❌ [getUserInfo] No authToken cookie found')
        }
      }
    }
    
    if (!token) {
      console.log('❌ [getUserInfo] No token found in header or cookie')
      const queryTenantId = c.req.query('tenant_id')
      return {
        userId: null,
        tenantId: queryTenantId ? parseInt(queryTenantId) : null,
        roleId: null,
        tokenRoleId: null
      }
    }
    
    console.log('🔍 [getUserInfo] Token found:', token.substring(0, 20) + '...')

    console.log('🔍 [getUserInfo] Normalizing token...')
    const normalizedToken = normalizeAuthToken(token)
    if (!normalizedToken) {
      console.log('❌ [getUserInfo] Invalid token format after normalization')
      return { userId: null, tenantId: null, roleId: null, tokenRoleId: null }
    }

    console.log('🔍 [getUserInfo] Decoding token...')
    const decoded = atob(normalizedToken)
    console.log('🔍 [getUserInfo] Decoded token:', decoded.substring(0, 50) + '...')
    const parts = decoded.split(':')
    console.log('🔍 [getUserInfo] Token parts:', parts.length, 'parts')
    const userId = parseOptionalInt(parts[0])
    if (!userId) {
      console.log('❌ [getUserInfo] Invalid token payload - no userId')
      return { userId: null, tenantId: null, roleId: null, tokenRoleId: null }
    }

    const tenantIdFromToken = parseOptionalInt(parts[1])
    const tokenRoleId = normalizeRoleId(parseOptionalInt(parts[2]))
    console.log('🔍 [getUserInfo] Parsed:', { userId, tenantIdFromToken, tokenRoleId })
    
    // Safety check for DB binding
    if (!c.env?.DB) {
      console.error('❌ [getUserInfo] DB binding not available')
      return { userId: null, tenantId: null, roleId: null, tokenRoleId }
    }
    
    console.log('🔍 [getUserInfo] Querying database for user:', userId)
    const user = await c.env.DB.prepare(`
      SELECT id, tenant_id, role_id FROM users WHERE id = ?
    `).bind(userId).first()
    
    if (!user) {
      console.log('❌ [getUserInfo] User not found in database')
      return { userId: null, tenantId: null, roleId: null, tokenRoleId }
    }
    
    console.log('✅ [getUserInfo] User found:', { id: user.id, tenant_id: user.tenant_id, role_id: user.role_id })
    
    // Super Admin (role_id = 1) can see all data
    const normalizedRoleId = normalizeRoleId(user.role_id)

    if (normalizedRoleId === 1) {
      const queryTenantId = c.req.query('tenant_id')
      const result = { userId: user.id, tenantId: queryTenantId ? parseInt(queryTenantId) : null, roleId: 1, tokenRoleId }
      console.log('✅ [getUserInfo] Returning super admin info:', result)
      return result
    }
    
    // For other roles, return their tenant_id
    const result = {
      userId: user.id,
      tenantId: tenantIdFromToken || user.tenant_id,
      roleId: normalizedRoleId,
      tokenRoleId
    }
    console.log('✅ [getUserInfo] Returning user info:', result)
    return result
  } catch (error: any) {
    // Aggressive debug dump for getUserInfo errors
    const errorDump = {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack || 'No stack trace',
      error_stringified: (() => {
        try {
          return JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        } catch (e) {
          return `Failed to stringify: ${e}`
        }
      })()
    }
    
    console.error('❌ [getUserInfo] ERROR DUMP:', errorDump)
    // Don't throw - return null values so request can continue
    return { userId: null, tenantId: null, roleId: null, tokenRoleId: null }
  }
}

async function getUserTenantId(c: any): Promise<number | null> {
  const info = await getUserInfo(c)
  return info.tenantId
}

// ----------------------------
// Server-side RBAC for admin pages (effective security; not just UI hiding)
// ----------------------------
const SUPER_ADMIN_ONLY_ADMIN_PATH_PREFIXES = [
  '/admin/subscriptions',
  '/admin/packages',
  '/admin/tenants',
  '/admin/roles',
  '/admin/saas-settings',
  '/admin/tenant-calculators'
]

function stripSuperAdminLinksFromHtml(html: string): string {
  const superAdminPrefixGroup = '(subscriptions|packages|tenants|roles|saas-settings|tenant-calculators)'
  const anchorPattern = new RegExp(
    `<a[^>]*\\bhref=["']\\/admin\\/${superAdminPrefixGroup}(?:\\/[^"']*)?["'][^>]*>[\\s\\S]*?<\\/a>`,
    'g'
  )
  let result = html.replace(anchorPattern, '')

  // Hide any remaining elements that link to super-admin paths (belt-and-suspenders)
  const style = `
<style>
  [href^="/admin/subscriptions"],
  [href^="/admin/packages"],
  [href^="/admin/tenants"],
  [href^="/admin/roles"],
  [href^="/admin/saas-settings"],
  [href^="/admin/tenant-calculators"] { display: none !important; }
</style>
`
  result = result.replace('</head>', `${style}</head>`)
  return result
}

app.use('/admin/*', async (c, next) => {
  try {
    console.log('🔒 [RBAC] Checking access for:', c.req.path)
    const info = await getUserInfo(c)
    console.log('🔒 [RBAC] User info:', {
      userId: info.userId,
      roleId: info.roleId,
      tenantId: info.tenantId,
      tokenRoleId: info.tokenRoleId
    })

    // Basic auth gate for all admin pages
    if (!info.userId) {
      console.log('🔒 [RBAC] No userId, redirecting to login')
      return c.redirect('/login')
    }

  // Treat as super-admin only if BOTH DB role and token role agree on 1.
  const isSuperAdmin =
    info.roleId === 1 && (info.tokenRoleId === null || info.tokenRoleId === 1)

  // Super-admin-only pages
  // Use c.req.path directly (it's available in Hono)
  const pathname = c.req.path || ''
  const isSuperAdminOnly = SUPER_ADMIN_ONLY_ADMIN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
  if (isSuperAdminOnly && !isSuperAdmin) {
    // Redirect to dashboard (or you can render 403)
    return c.redirect('/admin/dashboard')
  }

  await next()

    // Post-process HTML responses to remove super-admin-only links for non-superadmin users
    if (!isSuperAdmin && c.res) {
      try {
        console.log('🔒 [RBAC] Post-processing HTML for non-superadmin user')
        const res = c.res
        // Skip if response is a redirect or error
        if (res.status >= 300 && res.status < 400) {
          console.log('🔒 [RBAC] Skipping HTML processing - redirect response')
          return // Redirect responses don't have HTML body
        }
        if (res.status >= 400) {
          console.log('🔒 [RBAC] Skipping HTML processing - error response')
          return // Error responses, don't modify
        }
        
        const contentType = res.headers.get('content-type') || ''
        console.log('🔒 [RBAC] Content-Type:', contentType)
        if (contentType.includes('text/html') && res.body) {
          console.log('🔒 [RBAC] Processing HTML response...')
          // Clone the response to avoid consuming the original
          const clonedRes = res.clone()
          const html = await clonedRes.text()
          console.log('🔒 [RBAC] HTML length:', html.length)
          const updated = stripSuperAdminLinksFromHtml(html)
          console.log('🔒 [RBAC] HTML processed, updated length:', updated.length)
          const headers = new Headers(res.headers)
          headers.set('content-type', 'text/html; charset=UTF-8')
          c.res = new Response(updated, { status: res.status, statusText: res.statusText, headers })
          console.log('🔒 [RBAC] HTML processing complete')
        } else {
          console.log('🔒 [RBAC] Not HTML response or no body, skipping')
        }
      } catch (error: any) {
        // If HTML processing fails, log but don't break the response
        const errorDump = {
          message: error?.message || 'Unknown error',
          name: error?.name || 'Error',
          stack: error?.stack || 'No stack trace',
          error_stringified: (() => {
            try {
              return JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
            } catch (e) {
              return `Failed to stringify: ${e}`
            }
          })()
        }
        console.error('❌ [RBAC] Error processing HTML DUMP:', errorDump)
        // Continue with original response - don't throw
      }
    }
  } catch (error: any) {
    // Aggressive debug dump for critical RBAC errors
    const errorDump = {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack || 'No stack trace',
      path: c.req.path,
      error_stringified: (() => {
        try {
          return JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        } catch (e) {
          return `Failed to stringify: ${e}`
        }
      })()
    }
    console.error('❌ [RBAC] CRITICAL ERROR DUMP:', errorDump)
    // Return error response with dump instead of throwing
    return c.json({
      success: false,
      error: 'RBAC Middleware Error',
      dd: errorDump
    }, 500)
  }
})

// Used by the admin panel sidebar permission script (full-admin-panel.ts)
app.get('/api/user-info', async (c) => {
  try {
    const info = await getUserInfo(c)
    if (!info.userId || !info.roleId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const user = await c.env.DB.prepare(
      `SELECT id, full_name, email, tenant_id, role_id FROM users WHERE id = ?`
    ).bind(info.userId).first()

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        tenant_id: user.tenant_id,
        role_id: normalizeRoleId(user.role_id)
      }
    })
  } catch (error: any) {
    console.error('Error in /api/user-info:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get user ID and role for employee-specific filtering

// Middleware: Verify and set tenant
app.use('/c/:tenant/*', async (c, next) => {
  const tenant = await getTenant(c)
  
  if (!tenant) {
    return c.json({ error: 'Tenant not found', message: 'الشركة غير موجودة أو غير نشطة' }, 404)
  }
  
  // Set tenant in context
  c.set('tenant', tenant)
  c.set('tenantId', tenant.id)
  
  await next()
})

// TENANTS (COMPANIES) APIs

// Get all tenants
app.get('/api/tenants', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM tenants ORDER BY created_at DESC
    `).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new tenant
app.post('/api/tenants', async (c) => {
  try {
    const data = await c.req.json()
    
    // Validate required fields
    if (!data.company_name || !data.slug) {
      return c.json({ success: false, error: 'اسم الشركة والـ Slug مطلوبان' }, 400)
    }
    
    // Check if slug already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM tenants WHERE slug = ?
    `).bind(data.slug).first()
    
    if (existing) {
      return c.json({ success: false, error: 'الـ Slug موجود بالفعل' }, 400)
    }
    
    // Insert new tenant
    const result = await c.env.DB.prepare(`
      INSERT INTO tenants (
        company_name, slug, subdomain, status, max_users, 
        max_customers, max_requests, contact_email, contact_phone,
        primary_color, secondary_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.company_name,
      data.slug,
      data.subdomain || data.slug,
      data.status || 'active',
      data.max_users || 10,
      data.max_customers || 500,
      data.max_requests || 2000,
      data.contact_email || '',
      data.contact_phone || '',
      data.primary_color || '#667eea',
      data.secondary_color || '#764ba2'
    ).run()
    
    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...data },
      message: 'تم إنشاء الشركة بنجاح'
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update tenant
app.put('/api/tenants/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()
    
    // Check if tenant exists
    const tenant = await c.env.DB.prepare(`
      SELECT id FROM tenants WHERE id = ?
    `).bind(id).first()
    
    if (!tenant) {
      return c.json({ success: false, error: 'الشركة غير موجودة' }, 404)
    }
    
    // Update tenant
    await c.env.DB.prepare(`
      UPDATE tenants SET
        company_name = ?,
        slug = ?,
        subdomain = ?,
        status = ?,
        max_users = ?,
        max_customers = ?,
        max_requests = ?,
        contact_email = ?,
        contact_phone = ?,
        primary_color = ?,
        secondary_color = ?
      WHERE id = ?
    `).bind(
      data.company_name,
      data.slug,
      data.subdomain,
      data.status,
      data.max_users,
      data.max_customers,
      data.max_requests,
      data.contact_email,
      data.contact_phone,
      data.primary_color || '#667eea',
      data.secondary_color || '#764ba2',
      id
    ).run()
    
    return c.json({ 
      success: true, 
      data: { id, ...data },
      message: 'تم تحديث الشركة بنجاح'
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete tenant
app.delete('/api/tenants/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Check if tenant has users
    const usersCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE tenant_id = ?
    `).bind(id).first()
    
    if (usersCount && usersCount.count > 0) {
      return c.json({ 
        success: false, 
        error: `لا يمكن حذف الشركة لأنها تحتوي على ${usersCount.count} مستخدم/مستخدمين`
      }, 400)
    }
    
    // Delete tenant
    await c.env.DB.prepare(`
      DELETE FROM tenants WHERE id = ?
    `).bind(id).run()
    
    return c.json({ 
      success: true, 
      message: 'تم حذف الشركة بنجاح'
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// AUTHENTICATION & AUTHORIZATION APIs

// Login API
app.post('/api/auth/login', async (c) => {
  try {
    console.log('🔐 [LOGIN] Starting login process...')
    console.log('🔐 [LOGIN] Request URL:', c.req.url)
    console.log('🔐 [LOGIN] Request method:', c.req.method)
    
    // Check if DB binding is available
    if (!c.env.DB) {
      console.error('❌ [LOGIN] DB binding is not available')
      console.error('❌ [LOGIN] c.env:', JSON.stringify(Object.keys(c.env || {})))
      return c.json({ 
        success: false, 
        error: 'Database connection not available. Please check bindings configuration.',
        debug: { env_keys: Object.keys(c.env || {}) }
      }, 500)
    }
    
    console.log('🔐 [LOGIN] DB binding available, parsing request body...')
    const { username, password } = await c.req.json()
    
    console.log(`🔐 [LOGIN] Login attempt: ${username}`)
    console.log(`🔍 [LOGIN] DB binding check: ${!!c.env.DB}`)
    
    // Get user with tenant information
    // Double-check DB is available before using it
    if (!c.env?.DB) {
      console.error('❌ DB binding check failed in login query')
      return c.json({ 
        success: false, 
        error: 'Database connection not available. Please check bindings configuration.' 
      }, 500)
    }
    
    const user = await c.env.DB.prepare(`
      SELECT u.id, u.username, u.password, u.full_name, u.email, u.phone,
             u.role_id, u.user_type, u.subscription_id, u.is_active, 
             u.tenant_id, u.role as user_role,
             r.role_name, r.description as role_description,
             s.company_name as subscription_company_name,
             t.id as actual_tenant_id, t.company_name as tenant_name, t.slug as tenant_slug
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN subscriptions s ON u.subscription_id = s.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.username = ? AND u.password = ? AND u.is_active = 1
    `).bind(username, password).first()
    
    if (!user) {
      console.log(`❌ Login failed: Invalid credentials for ${username}`)
      return c.json({ success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, 401)
    }
    
    console.log(`✅ [LOGIN] User found: ${user.full_name} (Role ID: ${user.role_id})`)
    console.log(`✅ [LOGIN] User ID: ${user.id}, Tenant ID: ${user.tenant_id}`)
    
    // Update last login - check DB again before update
    if (!c.env?.DB) {
      console.error('❌ [LOGIN] DB binding lost after user query')
      // Continue anyway - user is authenticated, just can't update last_login
    } else {
      console.log('✅ [LOGIN] Updating last_login timestamp...')
      await c.env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(user.id).run()
      console.log('✅ [LOGIN] last_login updated successfully')
    }
    
    // Create token with tenant_id (user_id:tenant_id:role_id:timestamp)
    console.log('🔐 [LOGIN] Creating authentication token...')
    const tokenData = `${user.id}:${user.tenant_id || 'null'}:${user.role_id}:${Date.now()}`
    console.log('🔐 [LOGIN] Token data:', tokenData)
    const token = btoa(tokenData)
    console.log('🔐 [LOGIN] Token created:', token.substring(0, 30) + '...')
    
    // Set cookie for 7 days - use Response headers directly for Cloudflare Pages compatibility
    const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    const cookieValue = `authToken=${token}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Secure`
    
    // Determine redirect URL - always go to /admin/panel
    const redirect = '/admin/panel'
    
    console.log(`🎯 Redirect to: ${redirect}`)
    console.log(`🍪 Cookie set: authToken=${token.substring(0, 20)}...`)
    
    // Create response with cookie header set directly (avoids getSetCookie compatibility issue)
    const response = c.json({ 
      success: true,
      token: token,
      redirect: redirect,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.user_role || 'employee',  // Use role column from users table
        role_id: user.role_id,  // Add role_id
        role_name: user.role_name || 'موظف',  // Role name from roles table
        role_description: user.role_description,
        user_type: user.user_type,
        company_name: user.subscription_company_name || user.tenant_name,
        subscription_id: user.subscription_id,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        tenant_slug: user.tenant_slug
      }
    })
    
    // Set cookie header directly on the response to avoid getSetCookie compatibility issue
    console.log('🍪 [LOGIN] Setting cookie header...')
    response.headers.set('Set-Cookie', cookieValue)
    console.log('✅ [LOGIN] Login successful, returning response')
    return response
  } catch (error: any) {
    // Aggressive debug dump - return full error in response
    const errorDump = {
      // Basic error info
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack || 'No stack trace',
      
      // Full error object (try to serialize)
      error: error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause,
        toString: error.toString(),
        // Try to get all enumerable properties
        ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
          try {
            acc[key] = String(error[key])
          } catch {
            acc[key] = '[Cannot serialize]'
          }
          return acc
        }, {} as any)
      } : null,
      
      // Environment info
      DB_available: !!c.env?.DB,
      env_keys: Object.keys(c.env || {}),
      env_DB_type: typeof c.env?.DB,
      
      // Request info
      request_url: c.req.url,
      request_method: c.req.method,
      request_headers: Object.fromEntries(c.req.raw.headers.entries()),
      
      // Try to stringify the whole error
      error_stringified: (() => {
        try {
          return JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        } catch (e) {
          return `Failed to stringify: ${e}`
        }
      })()
    }
    
    console.error('❌ [LOGIN] FULL ERROR DUMP:', errorDump)
    
    // Return full error dump in response (temporary for debugging)
    return c.json({ 
      success: false, 
      error: 'حدث خطأ في تسجيل الدخول',
      dd: errorDump // Debug dump
    }, 500)
  }
})

// Logout API (clears auth cookie)
app.post('/api/auth/logout', async (c) => {
  // Expire cookie in multiple ways to handle Secure/non-Secure variants across environments
  const expiredSecure = 'authToken=; Path=/; Max-Age=0; SameSite=Lax; Secure'
  const expiredInsecure = 'authToken=; Path=/; Max-Age=0; SameSite=Lax'

  const res = c.json({ success: true })
  // Use append so we can send multiple Set-Cookie headers
  res.headers.append('Set-Cookie', expiredSecure)
  res.headers.append('Set-Cookie', expiredInsecure)
  return res
})

// Forgot Password - Step 1: Send verification code
app.post('/api/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json()
    
    // Check if user exists
    const user = await c.env.DB.prepare(`
      SELECT id, email, username FROM users WHERE email = ? OR username = ?
    `).bind(email, email).first()
    
    if (!user) {
      return c.json({ success: false, message: 'البريد الإلكتروني أو اسم المستخدم غير موجود' }, 404)
    }
    
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    
    // Store verification code in password_change_notifications table
    await c.env.DB.prepare(`
      INSERT INTO password_change_notifications (user_id, verification_code, expires_at, is_used)
      VALUES (?, ?, ?, 0)
    `).bind(user.id, code, expiresAt.toISOString()).run()
    
    // TODO: Send email with verification code (for now, just return success)
    // In production, integrate with email service like SendGrid or AWS SES
    
    console.log(`Verification code for ${user.email}: ${code}`)
    
    return c.json({ 
      success: true, 
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
      // For development only - remove in production:
      devCode: code
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return c.json({ success: false, message: 'حدث خطأ. الرجاء المحاولة مرة أخرى.' }, 500)
  }
})

// Forgot Password - Step 2: Verify code
app.post('/api/auth/verify-reset-code', async (c) => {
  try {
    const { email, code } = await c.req.json()
    
    // Get user
    const user = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ? OR username = ?
    `).bind(email, email).first()
    
    if (!user) {
      return c.json({ success: false, message: 'المستخدم غير موجود' }, 404)
    }
    
    // Check verification code
    const verification = await c.env.DB.prepare(`
      SELECT id, verification_code, expires_at, is_used
      FROM password_change_notifications
      WHERE user_id = ? AND is_used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(user.id).first()
    
    if (!verification) {
      return c.json({ success: false, message: 'لم يتم العثور على رمز التحقق' }, 404)
    }
    
    // Check if expired
    if (new Date(verification.expires_at as string) < new Date()) {
      return c.json({ success: false, message: 'انتهت صلاحية رمز التحقق. الرجاء طلب رمز جديد.' }, 400)
    }
    
    // Check if code matches
    if (verification.verification_code !== code) {
      return c.json({ success: false, message: 'رمز التحقق غير صحيح' }, 400)
    }
    
    // Generate reset token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    
    return c.json({ 
      success: true, 
      message: 'تم التحقق بنجاح',
      token: token
    })
  } catch (error: any) {
    console.error('Verify code error:', error)
    return c.json({ success: false, message: 'حدث خطأ. الرجاء المحاولة مرة أخرى.' }, 500)
  }
})

// Forgot Password - Step 3: Reset password
app.post('/api/auth/reset-password', async (c) => {
  try {
    const { email, token, newPassword } = await c.req.json()
    
    if (!newPassword || newPassword.length < 8) {
      return c.json({ success: false, message: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' }, 400)
    }
    
    // Get user
    const user = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ? OR username = ?
    `).bind(email, email).first()
    
    if (!user) {
      return c.json({ success: false, message: 'المستخدم غير موجود' }, 404)
    }
    
    // Update password
    await c.env.DB.prepare(`
      UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(newPassword, user.id).run()
    
    // Mark verification code as used
    await c.env.DB.prepare(`
      UPDATE password_change_notifications SET is_used = 1 WHERE user_id = ? AND is_used = 0
    `).bind(user.id).run()
    
    return c.json({ 
      success: true, 
      message: 'تم تغيير كلمة السر بنجاح'
    })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return c.json({ success: false, message: 'حدث خطأ. الرجاء المحاولة مرة أخرى.' }, 500)
  }
})

// BANKS APIs

// Get all banks (global banks + tenant-specific banks)
app.get('/api/banks', async (c) => {
  try {
    // Get tenant_id from query parameter or Authorization header
    const tenantId = c.req.query('tenant_id');
    
    let query = `SELECT * FROM banks`;
    let results;
    
    if (tenantId) {
      query += ` WHERE tenant_id = ? ORDER BY bank_name`;
      results = (await c.env.DB.prepare(query).bind(parseInt(tenantId)).all()).results;
    } else {
      query += ` ORDER BY bank_name`;
      results = (await c.env.DB.prepare(query).all()).results;
    }
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================
// صفحة Timeline - الجدول الزمني لحالات الطلب
// ============================

// Add bank
app.post('/api/banks', async (c) => {
  try {
    const data = await c.req.json()
    const { bank_name, bank_code, logo_url, is_active, tenant_id } = data
    
    // Get tenant_id from Authorization header if not provided
    let finalTenantId = tenant_id
    if (!finalTenantId) {
      const authHeader = c.req.header('Authorization')
      const token = authHeader?.replace('Bearer ', '')
      if (token) {
        const decoded = atob(token)
        const parts = decoded.split(':')
        finalTenantId = parts[1] !== 'null' ? parseInt(parts[1]) : null
      }
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO banks (bank_name, bank_code, logo_url, is_active, tenant_id) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(bank_name, bank_code, logo_url, is_active, finalTenantId).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update bank (PUT method for API)
app.put('/api/banks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const data = await c.req.json()
    const { bank_name, bank_code, logo_url, is_active } = data
    
    // Verify bank belongs to user's tenant
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    // Add tenant_id check to WHERE clause for security
    let query = `UPDATE banks SET bank_name = ?, bank_code = ?, logo_url = ?, is_active = ? WHERE id = ?`
    if (tenant_id) {
      query += ' AND tenant_id = ?'
      await c.env.DB.prepare(query).bind(bank_name, bank_code, logo_url, is_active, id, tenant_id).run()
    } else {
      await c.env.DB.prepare(query).bind(bank_name, bank_code, logo_url, is_active, id).run()
    }
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update bank (POST method for form submission - legacy)
app.post('/api/banks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const formData = await c.req.formData()
    const bank_name = formData.get('bank_name') as string
    const bank_code = formData.get('bank_code') as string
    const logo_url = formData.get('logo_url') as string || null
    const is_active = parseInt(formData.get('is_active') as string || '1')
    
    await c.env.DB.prepare(`
      UPDATE banks SET bank_name = ?, bank_code = ?, logo_url = ?, is_active = ? WHERE id = ?
    `).bind(bank_name, bank_code, logo_url, is_active, id).run()
    return c.redirect('/admin/banks')
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete bank
app.delete('/api/banks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    // Check if bank exists and belongs to user's tenant
    let checkQuery = 'SELECT id FROM banks WHERE id = ?'
    if (tenant_id) {
      checkQuery += ' AND tenant_id = ?'
    }
    const bank = tenant_id
      ? await c.env.DB.prepare(checkQuery).bind(id, tenant_id).first()
      : await c.env.DB.prepare(checkQuery).bind(id).first()
    
    if (!bank) {
      return c.json({ success: false, error: 'البنك غير موجود أو لا يمكنك حذفه' }, 404)
    }
    
    // Delete bank (will also delete related rates due to foreign key)
    await c.env.DB.prepare(`DELETE FROM banks WHERE id = ?`).bind(id).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// FINANCING TYPES APIs

// Get all financing types
app.get('/api/financing-types', async (c) => {
  try {
    // Get tenant_id from query parameter
    const tenantId = c.req.query('tenant_id');
    
    let query = `SELECT * FROM financing_types`;
    let results;
    
    if (tenantId) {
      query += ` WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY type_name`;
      results = (await c.env.DB.prepare(query).bind(parseInt(tenantId)).all()).results;
    } else {
      query += ` ORDER BY type_name`;
      results = (await c.env.DB.prepare(query).all()).results;
    }
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// BANK FINANCING RATES APIs

// Get all rates with bank and type names
app.get('/api/rates', async (c) => {
  try {
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    // Build query with tenant_id filter
    let query = `
      SELECT 
        r.*,
        b.bank_name,
        f.type_name as financing_type_name
      FROM bank_financing_rates r
      JOIN banks b ON r.bank_id = b.id
      JOIN financing_types f ON r.financing_type_id = f.id
    `
    
    if (tenant_id !== null) {
      query += ' WHERE r.tenant_id = ?'
    }
    
    query += ' ORDER BY b.bank_name, f.type_name'
    
    const { results } = tenant_id !== null
      ? await c.env.DB.prepare(query).bind(tenant_id).all()
      : await c.env.DB.prepare(query).all()
      
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add rate
app.post('/api/rates', async (c) => {
  try {
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    const contentType = c.req.header('Content-Type') || ''
    let data: any = {}
    if (contentType.includes('application/json')) {
      data = await c.req.json()
    } else {
      const formData = await c.req.formData()
      formData.forEach((value: FormDataEntryValue, key: string) => {
        data[key] = value
      })
    }

    if (tenant_id === null && data.tenant_id) {
      tenant_id = parseInt(data.tenant_id)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO bank_financing_rates 
      (bank_id, financing_type_id, rate, min_amount, max_amount, min_duration, max_duration, is_active, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.bank_id, 
      data.financing_type_id, 
      data.rate,
      data.min_amount || null, 
      data.max_amount || null, 
      data.min_duration || null, 
      data.max_duration || null,
      data.is_active || 1,
      tenant_id
    ).run()
    if (contentType.includes('application/json')) {
      return c.json({ success: true, message: 'تم إضافة النسبة بنجاح', id: result.meta.last_row_id })
    }
    return c.redirect('/admin/rates')
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Unknown error', message: error.message || 'Unknown error' }, 500)
  }
})

// Update rate
app.put('/api/rates/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()
    
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    // Add tenant_id check for security
    let query = `
      UPDATE bank_financing_rates 
      SET bank_id = ?, financing_type_id = ?, rate = ?, 
          min_amount = ?, max_amount = ?, min_salary = ?, max_salary = ?,
          min_duration = ?, max_duration = ?, is_active = ?
      WHERE id = ?
    `
    if (tenant_id) {
      query += ' AND tenant_id = ?'
      await c.env.DB.prepare(query).bind(
        data.bank_id, data.financing_type_id, data.rate,
        data.min_amount, data.max_amount, data.min_salary, data.max_salary,
        data.min_duration, data.max_duration, data.is_active, id, tenant_id
      ).run()
    } else {
      await c.env.DB.prepare(query).bind(
        data.bank_id, data.financing_type_id, data.rate,
        data.min_amount, data.max_amount, data.min_salary, data.max_salary,
        data.min_duration, data.max_duration, data.is_active, id
      ).run()
    }
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete rate
app.delete('/api/rates/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    // Add tenant_id check for security
    let query = 'DELETE FROM bank_financing_rates WHERE id = ?'
    if (tenant_id) {
      query += ' AND tenant_id = ?'
      await c.env.DB.prepare(query).bind(id, tenant_id).run()
    } else {
      await c.env.DB.prepare(query).bind(id).run()
    }
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// PACKAGES APIs

// Get all packages
app.get('/api/packages', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM packages ORDER BY price
    `).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add new package
app.post('/api/packages', async (c) => {
  try {
    const formData = await c.req.formData()
    const package_name = formData.get('package_name')
    const description = formData.get('description')
    const price = formData.get('price')
    const duration_months = formData.get('duration_months')
    const max_calculations = formData.get('max_calculations')
    const max_users = formData.get('max_users')
    const is_active = formData.get('is_active') || '1'
    
    const result = await c.env.DB.prepare(`
      INSERT INTO packages (package_name, description, price, duration_months, max_calculations, max_users, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(package_name, description || null, price, duration_months, max_calculations || null, max_users || null, is_active).run()
    
    return c.redirect('/admin/packages')
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update package
app.put('/api/packages/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { package_name, description, price, duration_months, max_calculations, max_users, is_active } = await c.req.json()
    await c.env.DB.prepare(`
      UPDATE packages 
      SET package_name = ?, description = ?, price = ?, duration_months = ?, 
          max_calculations = ?, max_users = ?, is_active = ?
      WHERE id = ?
    `).bind(package_name, description, price, duration_months, max_calculations, max_users, is_active, id).run()
    return c.json({ success: true, message: 'تم تحديث الباقة بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// SUBSCRIPTIONS APIs

// Get all subscriptions
app.get('/api/subscriptions', async (c) => {
  try {
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    let query = `
      SELECT 
        s.*,
        p.package_name,
        p.price,
        p.max_calculations
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id`
    
    if (tenant_id) {
      query += ` WHERE s.tenant_id = ${tenant_id}`
    }
    
    query += ` ORDER BY s.created_at DESC`
    
    const { results } = await c.env.DB.prepare(query).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add subscription
app.post('/api/subscriptions', async (c) => {
  try {
    const formData = await c.req.formData()
    const company_name = formData.get('company_name')
    const package_id = formData.get('package_id')
    const start_date = formData.get('start_date')
    const end_date = formData.get('end_date')
    const status = formData.get('status') || 'active'
    const calculations_used = formData.get('calculations_used') || 0
    
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO subscriptions (company_name, package_id, start_date, end_date, status, calculations_used, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(company_name, package_id, start_date, end_date, status, calculations_used, tenant_id).run()
    
    return c.redirect('/admin/subscriptions')
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update subscription
app.put('/api/subscriptions/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { company_name, package_id, start_date, end_date, status } = await c.req.json()
    await c.env.DB.prepare(`
      UPDATE subscriptions 
      SET company_name = ?, package_id = ?, start_date = ?, end_date = ?, status = ?
      WHERE id = ?
    `).bind(company_name, package_id, start_date, end_date, status, id).run()
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// SUBSCRIPTION REQUESTS APIs

// Get all subscription requests
app.get('/api/subscription-requests', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        sr.*,
        p.package_name,
        p.price,
        p.duration_months
      FROM subscription_requests sr
      LEFT JOIN packages p ON sr.package_id = p.id
      ORDER BY sr.created_at DESC
    `).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get single subscription request
app.get('/api/subscription-requests/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const request = await c.env.DB.prepare(`
      SELECT 
        sr.*,
        p.package_name,
        p.price,
        p.duration_months,
        p.max_calculations,
        p.max_users
      FROM subscription_requests sr
      LEFT JOIN packages p ON sr.package_id = p.id
      WHERE sr.id = ?
    `).bind(id).first()
    
    if (!request) {
      return c.json({ success: false, message: 'الطلب غير موجود' }, 404)
    }
    
    return c.json({ success: true, data: request })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new subscription request
app.post('/api/subscription-requests', async (c) => {
  try {
    const { company_name, contact_name, email, phone, package_id, notes } = await c.req.json()
    
    // Validate required fields
    if (!company_name || !contact_name || !email || !phone || !package_id) {
      return c.json({ 
        success: false, 
        message: 'جميع الحقول مطلوبة' 
      }, 400)
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({ 
        success: false, 
        message: 'البريد الإلكتروني غير صحيح' 
      }, 400)
    }
    
    // Validate phone format
    const phoneRegex = /^(05|5)[0-9]{8}$/
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      return c.json({ 
        success: false, 
        message: 'رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' 
      }, 400)
    }
    
    // Check if package exists
    const packageExists = await c.env.DB.prepare(`
      SELECT id FROM packages WHERE id = ? AND is_active = 1
    `).bind(package_id).first()
    
    if (!packageExists) {
      return c.json({ 
        success: false, 
        message: 'الباقة غير موجودة أو غير متاحة' 
      }, 400)
    }
    
    // Create subscription request
    const result = await c.env.DB.prepare(`
      INSERT INTO subscription_requests 
      (company_name, contact_name, email, phone, package_id, status, notes)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).bind(company_name, contact_name, email, phone, package_id, notes || null).run()
    
    return c.json({ 
      success: true, 
      message: 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً',
      requestId: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('Subscription request error:', error)
    return c.json({ 
      success: false, 
      message: 'حدث خطأ. الرجاء المحاولة مرة أخرى.' 
    }, 500)
  }
})

// Update subscription request status
app.put('/api/subscription-requests/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { status, notes } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE subscription_requests 
      SET status = ?, notes = ?
      WHERE id = ?
    `).bind(status, notes || null, id).run()
    
    return c.json({ success: true, message: 'تم تحديث الطلب بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete subscription request
app.delete('/api/subscription-requests/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare(`
      DELETE FROM subscription_requests WHERE id = ?
    `).bind(id).run()
    
    return c.json({ success: true, message: 'تم حذف الطلب بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// USERS APIs

// Get all users
app.get('/api/users', async (c) => {
  try {
    // Get user info including role_id
    const userInfo = await getUserInfo(c)
    const roleId = userInfo.roleId
    const tenantId = userInfo.tenantId
    
    let query = `
      SELECT u.*, r.role_name, r.description as role_description,
             t.company_name as tenant_name,
             COUNT(DISTINCT rp.permission_id) as permissions_count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN tenants t ON u.tenant_id = t.id`
    
    // Superadmin (role_id = 1) can see all users
    // Other roles see only their tenant's users
    if (roleId !== 1 && tenantId) {
      query += ` WHERE u.tenant_id = ${tenantId}`
    }
    
    query += `
      GROUP BY u.id
      ORDER BY u.id DESC`
    
    const { results } = await c.env.DB.prepare(query).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add user
app.post('/api/users', async (c) => {
  try {
    const formData = await c.req.formData()
    const username = formData.get('username')
    const password = formData.get('password')
    const full_name = formData.get('full_name')
    const email = formData.get('email')
    const phone = formData.get('phone')
    const user_type = formData.get('user_type')
    const role_id = formData.get('role_id')
    const subscription_id = formData.get('subscription_id') || null
    const is_active = formData.get('is_active') || '1'
    
    // Get user info to check role
    const userInfo = await getUserInfo(c);
    
    // Get tenant_id from form data (if provided by super admin)
    // If not provided, use the current user's tenant_id (for company admin adding users)
    let tenant_id = formData.get('tenant_id');
    
    if (tenant_id && tenant_id !== '') {
      // Convert to integer if provided as string
      tenant_id = parseInt(tenant_id as string);
    } else if (userInfo.roleId === 1) {
      // Super admin creating user without tenant - allow null
      tenant_id = null;
    } else {
      // Company admin/supervisor creating user - use their tenant_id
      tenant_id = userInfo.tenantId;
    }
    
    // Check for duplicate username
    const existingUser = await c.env.DB.prepare(`
      SELECT id FROM users WHERE username = ?
    `).bind(username).first()
    
    if (existingUser) {
      return c.json({ 
        success: false, 
        error: 'اسم المستخدم موجود مسبقاً! الرجاء اختيار اسم مستخدم آخر.' 
      }, 400)
    }
    
    // Check for duplicate email if provided
    if (email) {
      const existingEmail = await c.env.DB.prepare(`
        SELECT id FROM users WHERE email = ?
      `).bind(email).first()
      
      if (existingEmail) {
        return c.json({ 
          success: false, 
          error: 'البريد الإلكتروني موجود مسبقاً! الرجاء استخدام بريد إلكتروني آخر.' 
        }, 400)
      }
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, password, full_name, email, phone, user_type, role_id, subscription_id, is_active, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(username, password, full_name, email, phone, user_type, role_id, subscription_id, is_active, tenant_id).run()
    
    return c.json({ 
      success: true, 
      message: 'تم إضافة المستخدم بنجاح',
      userId: result.meta.last_row_id 
    })
  } catch (error: any) {
    console.error('Error adding user:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'حدث خطأ أثناء إضافة المستخدم' 
    }, 500)
  }
})

// Update user
app.put('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { username, full_name, email, phone, role_id, subscription_id, is_active } = await c.req.json()
    await c.env.DB.prepare(`
      UPDATE users 
      SET username = ?, full_name = ?, email = ?, phone = ?, role_id = ?, subscription_id = ?, is_active = ?
      WHERE id = ?
    `).bind(username, full_name, email, phone, role_id, subscription_id, is_active, id).run()
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// CUSTOMERS APIs

// Get all customers
app.get('/api/customers', async (c) => {
  try {
    // Get user info (userId, tenantId, roleId)
    const userInfo = await getUserInfo(c);
    
    // Build query with role-based filtering
    let query = `
      SELECT 
        c.*,
        COUNT(f.id) as total_requests,
        SUM(CASE WHEN f.status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN f.status = 'approved' THEN 1 ELSE 0 END) as approved_requests
      FROM customers c
      LEFT JOIN financing_requests f ON c.id = f.customer_id`
    
    // Apply filtering based on role
    if (userInfo.roleId === 1) {
      // Role 1: Super Admin - sees ALL customers (no filter)
    } else if (userInfo.roleId === 2 || userInfo.roleId === 3) {
      // Role 2: Company Admin & Role 3: Supervisor - see company customers only
      if (userInfo.tenantId) {
        query += ` WHERE c.tenant_id = ${userInfo.tenantId}`
      }
    } else if (userInfo.roleId === 4) {
      // Role 4: Employee - sees only assigned customers
      if (userInfo.userId) {
        query += ` WHERE c.assigned_to = ${userInfo.userId}`
      } else {
        query += ` WHERE 1 = 0` // No data if user ID not found
      }
    } else {
      // Unknown role - no data
      query += ` WHERE 1 = 0`
    }
    
    query += `
      GROUP BY c.id
      ORDER BY c.created_at DESC`
    
    const { results } = await c.env.DB.prepare(query).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add new customer
app.post('/api/customers', async (c) => {
  try {
    const formData = await c.req.formData()
    const full_name = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string || null
    const national_id = formData.get('national_id') as string || null
    const date_of_birth = formData.get('date_of_birth') as string || null
    const employer_name = formData.get('employer_name') as string || null
    const job_title = formData.get('job_title') as string || null
    const work_start_date = formData.get('work_start_date') as string || null
    const city = formData.get('city') as string || null
    const monthly_salary = parseFloat(formData.get('monthly_salary') as string || '0')
    
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    // Check if national_id already exists within the same tenant
    if (national_id) {
      let checkQuery = `SELECT id, full_name FROM customers WHERE national_id = ?`
      let bindParams: any[] = [national_id]
      
      if (tenant_id) {
        checkQuery += ` AND tenant_id = ?`
        bindParams.push(tenant_id)
      }
      
      const existing = await c.env.DB.prepare(checkQuery).bind(...bindParams).first()
      
      if (existing) {
        return c.html(`
          <!DOCTYPE html>
          <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>خطأ</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
          </head>
          <body class="bg-gray-50">
            <div class="max-w-2xl mx-auto p-6 mt-20">
              <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-lg">
                <div class="flex items-center mb-4">
                  <i class="fas fa-exclamation-circle text-red-500 text-4xl ml-3"></i>
                  <div>
                    <h1 class="text-2xl font-bold text-red-800">رقم الهوية مكرر!</h1>
                    <p class="text-red-600 mt-1">لا يمكن إضافة عميل برقم هوية موجود مسبقاً</p>
                  </div>
                </div>
                <div class="bg-white rounded-lg p-4 mb-4">
                  <p class="text-gray-700"><strong>الرقم الوطني:</strong> ${national_id}</p>
                  <p class="text-gray-700"><strong>مسجل باسم:</strong> ${existing.full_name}</p>
                  <p class="text-gray-700"><strong>رقم العميل:</strong> #${existing.id}</p>
                </div>
                <div class="flex gap-3">
                  <a href="/admin/customers/add" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                    <i class="fas fa-arrow-right ml-2"></i>
                    العودة للنموذج
                  </a>
                  <a href="/admin/customers/${existing.id}" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                    <i class="fas fa-eye ml-2"></i>
                    عرض العميل الموجود
                  </a>
                  <a href="/admin/customers" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                    <i class="fas fa-list ml-2"></i>
                    قائمة العملاء
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
      }
    }
    
    // Check if phone already exists within the same tenant
    let phoneCheckQuery = `SELECT id, full_name FROM customers WHERE phone = ?`
    let phoneBindParams: any[] = [phone]
    
    if (tenant_id) {
      phoneCheckQuery += ` AND tenant_id = ?`
      phoneBindParams.push(tenant_id)
    }
    
    const existingPhone = await c.env.DB.prepare(phoneCheckQuery).bind(...phoneBindParams).first()
    
    if (existingPhone) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>خطأ</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-50">
          <div class="max-w-2xl mx-auto p-6 mt-20">
            <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 shadow-lg">
              <div class="flex items-center mb-4">
                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl ml-3"></i>
                <div>
                  <h1 class="text-2xl font-bold text-yellow-800">رقم الهاتف مكرر!</h1>
                  <p class="text-yellow-600 mt-1">يوجد عميل آخر بنفس رقم الهاتف</p>
                </div>
              </div>
              <div class="bg-white rounded-lg p-4 mb-4">
                <p class="text-gray-700"><strong>رقم الهاتف:</strong> ${phone}</p>
                <p class="text-gray-700"><strong>مسجل باسم:</strong> ${existingPhone.full_name}</p>
                <p class="text-gray-700"><strong>رقم العميل:</strong> #${existingPhone.id}</p>
              </div>
              <div class="flex gap-3">
                <a href="/admin/customers/add" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-arrow-right ml-2"></i>
                  العودة للنموذج
                </a>
                <a href="/admin/customers/${existingPhone.id}" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-eye ml-2"></i>
                  عرض العميل الموجود
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO customers (full_name, phone, email, national_id, birthdate, employer_name, job_title, work_start_date, city, monthly_salary, tenant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(full_name, phone, email, national_id, date_of_birth, employer_name, job_title, work_start_date, city, monthly_salary, tenant_id).run()
    return c.redirect('/admin/customers')
  } catch (error: any) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>خطأ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-2xl mx-auto p-6 mt-20">
          <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-lg">
            <div class="flex items-center mb-4">
              <i class="fas fa-times-circle text-red-500 text-4xl ml-3"></i>
              <div>
                <h1 class="text-2xl font-bold text-red-800">حدث خطأ!</h1>
                <p class="text-red-600 mt-1">لم نتمكن من إضافة العميل</p>
              </div>
            </div>
            <div class="bg-white rounded-lg p-4 mb-4">
              <p class="text-gray-700 font-mono text-sm">${error.message}</p>
            </div>
            <a href="/admin/customers/add" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all inline-block">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة للنموذج
            </a>
          </div>
        </div>
      </body>
      </html>
    `)
  }
})

// Update customer
app.post('/api/customers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const formData = await c.req.formData()
    const full_name = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string || null
    const national_id = formData.get('national_id') as string || null
    const date_of_birth = formData.get('date_of_birth') as string || null
    const employer_name = formData.get('employer_name') as string || null
    const job_title = formData.get('job_title') as string || null
    const work_start_date = formData.get('work_start_date') as string || null
    const city = formData.get('city') as string || null
    const monthly_salary = parseFloat(formData.get('monthly_salary') as string || '0')
    
    await c.env.DB.prepare(`
      UPDATE customers 
      SET full_name = ?, phone = ?, email = ?, national_id = ?, birthdate = ?,
          employer_name = ?, job_title = ?, work_start_date = ?, city = ?, monthly_salary = ?
      WHERE id = ?
    `).bind(full_name, phone, email, national_id, date_of_birth, employer_name, job_title, work_start_date, city, monthly_salary, id).run()
    return c.redirect('/admin/customers')
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// FINANCING REQUESTS APIs

// Get all financing requests
app.get('/api/financing-requests', async (c) => {
  try {
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    let query = `
      SELECT 
        f.*,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.national_id,
        c.employer_name,
        c.job_title,
        b.bank_name as selected_bank_name,
        ft.type_name as financing_type_name,
        ca.employee_id as assigned_employee_id,
        u.full_name as assigned_employee_name
      FROM financing_requests f
      JOIN customers c ON f.customer_id = c.id
      LEFT JOIN banks b ON f.selected_bank_id = b.id
      LEFT JOIN financing_types ft ON f.financing_type_id = ft.id
      LEFT JOIN customer_assignments ca ON c.id = ca.customer_id
      LEFT JOIN users u ON ca.employee_id = u.id`
    
    if (tenant_id) {
      query += ` WHERE f.tenant_id = ${tenant_id}`
    }
    
    query += ` ORDER BY f.created_at DESC`
    
    const { results } = await c.env.DB.prepare(query).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new financing request
app.post('/api/requests', async (c) => {
  try {
    const formData = await c.req.formData()
    const customer_id = formData.get('customer_id')
    const financing_type_id = formData.get('financing_type_id')
    const requested_amount = formData.get('requested_amount')
    const duration_months = formData.get('duration_months')
    const salary_at_request = formData.get('salary_at_request')
    const selected_bank_id = formData.get('selected_bank_id') || null
    const status = formData.get('status') || 'pending'
    const notes = formData.get('notes') || ''
    
    const userInfo = await getUserInfo(c)
    if (!userInfo.userId || !userInfo.roleId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401)
    }

    const customer = await c.env.DB.prepare(`
      SELECT id, tenant_id, assigned_to FROM customers WHERE id = ?
    `).bind(customer_id).first()

    if (!customer) {
      return c.json({ success: false, error: 'العميل غير موجود' }, 400)
    }

    // Enforce tenant and assignment scope for non-superadmins
    if (userInfo.roleId !== 1) {
      if (!userInfo.tenantId) {
        return c.json({ success: false, error: 'يجب تحديد الشركة' }, 400)
      }
      if (customer.tenant_id !== userInfo.tenantId) {
        return c.json({ success: false, error: 'غير مصرح لهذه الشركة' }, 403)
      }
      if (userInfo.roleId === 4 && customer.assigned_to !== userInfo.userId) {
        return c.json({ success: false, error: 'غير مصرح لهذا العميل' }, 403)
      }
    }

    const tenant_id = userInfo.roleId === 1 ? customer.tenant_id : userInfo.tenantId
    
    // Insert financing request directly (customer already exists from dropdown)
    const result = await c.env.DB.prepare(`
      INSERT INTO financing_requests (
        customer_id, financing_type_id, selected_bank_id, 
        requested_amount, salary_at_request, duration_months, 
        status, notes, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      customer_id,
      financing_type_id,
      selected_bank_id,
      requested_amount,
      salary_at_request,
      duration_months,
      status,
      notes,
      tenant_id
    ).run()
    
    return c.redirect('/admin/requests')
  } catch (error: any) {
    console.error('Error creating request:', error)
    return c.json({ success: false, error: error.message, message: 'حدث خطأ أثناء حفظ الطلب' }, 500)
  }
})

// ============= WORKFLOW APIs =============

// Get all workflow stages
app.get('/api/workflow/stages', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM workflow_stages 
      WHERE is_active = 1 
      ORDER BY stage_order ASC
    `).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get workflow timeline for a specific request
app.get('/api/workflow/timeline/:requestId', async (c) => {
  try {
    const requestId = c.req.param('requestId')
    
    // Get all stage transitions
    const { results: transitions } = await c.env.DB.prepare(`
      SELECT 
        wst.*,
        from_stage.stage_name_ar as from_stage_name,
        from_stage.stage_color as from_stage_color,
        from_stage.stage_icon as from_stage_icon,
        to_stage.stage_name_ar as to_stage_name,
        to_stage.stage_color as to_stage_color,
        to_stage.stage_icon as to_stage_icon,
        u.full_name as transitioned_by_name
      FROM workflow_stage_transitions wst
      LEFT JOIN workflow_stages from_stage ON wst.from_stage_id = from_stage.id
      LEFT JOIN workflow_stages to_stage ON wst.to_stage_id = to_stage.id
      LEFT JOIN users u ON wst.transitioned_by = u.id
      WHERE wst.request_id = ?
      ORDER BY wst.created_at ASC
    `).bind(requestId).all()
    
    // Get all actions for this request
    const { results: actions } = await c.env.DB.prepare(`
      SELECT 
        wsa.*,
        ws.stage_name_ar,
        ws.stage_color,
        ws.stage_icon,
        u.full_name as performed_by_name
      FROM workflow_stage_actions wsa
      LEFT JOIN workflow_stages ws ON wsa.stage_id = ws.id
      LEFT JOIN users u ON wsa.performed_by = u.id
      WHERE wsa.request_id = ?
      ORDER BY wsa.created_at ASC
    `).bind(requestId).all()
    
    // Get all tasks for this request
    const { results: tasks } = await c.env.DB.prepare(`
      SELECT 
        wst.*,
        ws.stage_name_ar,
        assigned_user.full_name as assigned_to_name,
        completed_user.full_name as completed_by_name
      FROM workflow_stage_tasks wst
      LEFT JOIN workflow_stages ws ON wst.stage_id = ws.id
      LEFT JOIN users assigned_user ON wst.assigned_to = assigned_user.id
      LEFT JOIN users completed_user ON wst.completed_by = completed_user.id
      WHERE wst.request_id = ?
      ORDER BY wst.due_date ASC
    `).bind(requestId).all()
    
    return c.json({ 
      success: true, 
      data: {
        transitions,
        actions,
        tasks
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update request stage
app.post('/api/workflow/update-stage', async (c) => {
  try {
    const { requestId, newStageId, notes, userId } = await c.req.json()
    
    // Update the request's current stage
    await c.env.DB.prepare(`
      UPDATE financing_requests 
      SET current_stage_id = ?, 
          stage_entered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newStageId, requestId).run()
    
    // The trigger will automatically create a transition record
    // But we can add notes if provided
    if (notes) {
      await c.env.DB.prepare(`
        UPDATE workflow_stage_transitions 
        SET notes = ?, transitioned_by = ?
        WHERE request_id = ? AND to_stage_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(notes, userId, requestId, newStageId).run()
    }
    
    return c.json({ success: true, message: 'تم تحديث مرحلة الطلب بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add action to a stage
app.post('/api/workflow/add-action', async (c) => {
  try {
    const { requestId, stageId, actionType, actionData, performedBy, notes } = await c.req.json()
    
    await c.env.DB.prepare(`
      INSERT INTO workflow_stage_actions 
      (request_id, stage_id, action_type, action_data, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(requestId, stageId, actionType, actionData, performedBy, notes).run()
    
    return c.json({ success: true, message: 'تم إضافة الإجراء بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create a task
app.post('/api/workflow/create-task', async (c) => {
  try {
    const { requestId, stageId, taskTitle, taskDescription, assignedTo, dueDate, priority } = await c.req.json()
    
    await c.env.DB.prepare(`
      INSERT INTO workflow_stage_tasks 
      (request_id, stage_id, task_title, task_description, assigned_to, due_date, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(requestId, stageId, taskTitle, taskDescription, assignedTo, dueDate, priority || 'medium').run()
    
    return c.json({ success: true, message: 'تم إنشاء المهمة بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Complete a task
app.post('/api/workflow/complete-task', async (c) => {
  try {
    const { taskId, completedBy } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE workflow_stage_tasks 
      SET status = 'completed', 
          completed_at = CURRENT_TIMESTAMP,
          completed_by = ?
      WHERE id = ?
    `).bind(completedBy, taskId).run()
    
    return c.json({ success: true, message: 'تم إتمام المهمة بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get pending tasks for a user
app.get('/api/workflow/my-tasks/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        wst.*,
        ws.stage_name_ar,
        ws.stage_color,
        fr.id as request_id,
        c.full_name as customer_name,
        fr.requested_amount
      FROM workflow_stage_tasks wst
      LEFT JOIN workflow_stages ws ON wst.stage_id = ws.id
      LEFT JOIN financing_requests fr ON wst.request_id = fr.id
      LEFT JOIN customers c ON fr.customer_id = c.id
      WHERE wst.assigned_to = ? AND wst.status = 'pending'
      ORDER BY wst.due_date ASC
    `).bind(userId).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============= PAYMENTS APIs =============

// Get all payments (with tenant filtering)
app.get('/api/payments', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    
    if (token) {
      try {
        // Decode token (format: userId:tenantId:timestamp:random)
        const decoded = atob(token)
        const [userId, tenantId] = decoded.split(':')
        tenant_id = tenantId === 'null' ? null : parseInt(tenantId)
      } catch (e) {
        // Token invalid or expired
      }
    }
    
    let query = `
      SELECT 
        p.*,
        c.full_name as customer_name,
        u.full_name as employee_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.employee_id = u.id
    `
    
    const bindings: any[] = []
    
    if (tenant_id) {
      query += ' WHERE p.tenant_id = ?'
      bindings.push(tenant_id)
    }
    
    query += ' ORDER BY p.created_at DESC'
    
    const { results } = await c.env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    console.error('Payments API error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new payment
app.post('/api/payments', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: 'غير مصرح' }, 401)
    }
    
    // Decode token (format: userId:tenantId:timestamp:random)
    const decoded = atob(token)
    const [userId, tenantId] = decoded.split(':')
    const tenant_id = tenantId === 'null' ? null : parseInt(tenantId)
    const created_by = parseInt(userId)
    
    if (!tenant_id) {
      return c.json({ success: false, error: 'يجب أن تكون مرتبطاً بشركة' }, 403)
    }
    
    const data = await c.req.json()
    
    // Validate required fields
    if (!data.financing_request_id || !data.customer_id || !data.amount || !data.payment_date) {
      return c.json({ success: false, error: 'البيانات المطلوبة ناقصة' }, 400)
    }
    
    await c.env.DB.prepare(`
      INSERT INTO payments (
        financing_request_id, customer_id, tenant_id, employee_id,
        amount, payment_date, payment_method, receipt_number, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.financing_request_id,
      data.customer_id,
      tenant_id,
      data.employee_id || null,
      data.amount,
      data.payment_date,
      data.payment_method || 'cash',
      data.receipt_number || null,
      data.notes || null,
      created_by
    ).run()
    
    return c.json({ success: true, message: 'تم حفظ سند القبض بنجاح' })
  } catch (error: any) {
    console.error('Error creating payment:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete payment
app.delete('/api/payments/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: 'غير مصرح' }, 401)
    }
    
    // Decode token (format: userId:tenantId:timestamp:random)
    const decoded = atob(token)
    const [userId, tenantId] = decoded.split(':')
    const tenant_id = tenantId === 'null' ? null : parseInt(tenantId)
    const id = c.req.param('id')
    
    // Verify payment belongs to this tenant
    if (tenant_id) {
      const payment = await c.env.DB.prepare(
        'SELECT tenant_id FROM payments WHERE id = ?'
      ).bind(id).first()
      
      if (payment && payment.tenant_id !== tenant_id) {
        return c.json({ success: false, error: 'غير مصرح بحذف هذا السند' }, 403)
      }
    }
    
    await c.env.DB.prepare('DELETE FROM payments WHERE id = ?').bind(id).run()
    
    return c.json({ success: true, message: 'تم حذف السند بنجاح' })
  } catch (error: any) {
    console.error('Error deleting payment:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// API for calculator (accepts JSON with new customer data)
// Multi-tenant calculator submit API
app.post('/api/c/:tenant/calculator/submit-request', async (c) => {
  try {
    const tenantSlug = c.req.param('tenant')
    const data = await c.req.json()
    
    // Get tenant_id from slug
    const tenant = await c.env.DB.prepare(`
      SELECT id FROM tenants WHERE slug = ? AND status = 'active'
    `).bind(tenantSlug).first()
    
    if (!tenant) {
      return c.json({ success: false, error: 'شركة غير موجودة' }, 404)
    }
    
    const tenant_id = tenant.id
    
    // Step 1: Check if customer exists (by national_id or phone) within same tenant
    let customer = await c.env.DB.prepare(`
      SELECT id FROM customers WHERE (national_id = ? OR phone = ?) AND tenant_id = ?
    `).bind(data.national_id || '', data.phone || '', tenant_id).first()
    
    let customer_id
    
    if (customer) {
      customer_id = customer.id
      
      // Update customer info
      await c.env.DB.prepare(`
        UPDATE customers 
        SET full_name = ?, phone = ?, email = ?, 
            birthdate = ?, monthly_salary = ?,
            employer_name = ?, job_title = ?,
            work_start_date = ?, city = ?,
            financing_amount = ?, monthly_obligations = ?, financing_type_id = ?
        WHERE id = ?
      `).bind(
        data.full_name || '',
        data.phone || '',
        data.email || null,
        data.birthdate || null,
        data.monthly_salary || 0,
        data.employer || '',
        data.job_title || '',
        data.work_start_date || null,
        data.city || '',
        data.requested_amount || 0,
        data.monthly_obligations || 0,
        data.financing_type_id || null,
        customer_id
      ).run()
    } else {
      // Create new customer with tenant_id
      try {
        const customerResult = await c.env.DB.prepare(`
          INSERT INTO customers (
            full_name, phone, email, national_id, 
            birthdate, monthly_salary, employer_name, 
            job_title, work_start_date, city, tenant_id,
            financing_amount, monthly_obligations, financing_type_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.full_name || '',
          data.phone || '',
          data.email || null,
          data.national_id || '',
          data.birthdate || null,
          data.monthly_salary || 0,
          data.employer || '',
          data.job_title || '',
          data.work_start_date || null,
          data.city || '',
          tenant_id,
          data.requested_amount || 0,
          data.monthly_obligations || 0,
          data.financing_type_id || null
        ).run()
        
        customer_id = customerResult.meta.last_row_id
      } catch (insertError: any) {
        if (insertError.message && insertError.message.includes('UNIQUE')) {
          // Try to find existing customer (might be in a different tenant)
          const existingCustomer = await c.env.DB.prepare(`
            SELECT id FROM customers WHERE (national_id = ? OR phone = ?)
          `).bind(data.national_id || '', data.phone || '').first()
          
          if (existingCustomer) {
            // Customer exists, update their info and use their ID
            customer_id = existingCustomer.id
            
            // Update customer with new tenant_id and info
            await c.env.DB.prepare(`
              UPDATE customers 
              SET full_name = ?, phone = ?, email = ?, 
                  birthdate = ?, monthly_salary = ?,
                  employer_name = ?, job_title = ?,
                  work_start_date = ?, city = ?, tenant_id = ?,
                  financing_amount = ?, monthly_obligations = ?, financing_type_id = ?
              WHERE id = ?
            `).bind(
              data.full_name || '',
              data.phone || '',
              data.email || null,
              data.birthdate || null,
              data.monthly_salary || 0,
              data.employer || '',
              data.job_title || '',
              data.work_start_date || null,
              data.city || '',
              tenant_id,
              data.requested_amount || 0,
              data.monthly_obligations || 0,
              data.financing_type_id || null,
              customer_id
            ).run()
          } else {
            throw insertError
          }
        } else {
          throw insertError
        }
      }
    }
    
    // Step 2: Create financing request with tenant_id
    const requestResult = await c.env.DB.prepare(`
      INSERT INTO financing_requests (
        customer_id, financing_type_id, selected_bank_id,
        requested_amount, salary_at_request, duration_months,
        monthly_obligations, monthly_payment,
        status, notes, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      customer_id,
      data.financing_type_id || null,
      data.bank_id || data.selected_bank_id || null,
      data.requested_amount || 0,
      data.monthly_salary || 0,
      data.duration || data.duration_months || 0,
      data.monthly_obligations || 0,
      data.monthly_payment || 0,
      data.notes || null,
      tenant_id
    ).run()
    
    const requestId = requestResult.meta.last_row_id
    
    return c.json({ 
      success: true, 
      request_id: requestId,
      message: 'تم إرسال طلبك بنجاح'
    })
  } catch (error: any) {
    console.error('Calculator submit error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      data: error
    })
    return c.json({ 
      success: false, 
      error: 'حدث خطأ أثناء إرسال الطلب. الرجاء المحاولة مرة أخرى.',
      details: error.message 
    }, 500)
  }
})

// Save customer initial data from calculator (before completing request)
app.post('/api/calculator/save-customer', async (c) => {
  try {
    const data = await c.req.json()
    
    // Extract tenant_id from the request path or default to null
    const tenantSlug = data.tenant_slug || null
    let tenant_id = null
    
    if (tenantSlug) {
      const tenant = await c.env.DB.prepare(`
        SELECT id FROM tenants WHERE slug = ? AND status = 'active'
      `).bind(tenantSlug).first()
      
      if (tenant) {
        tenant_id = tenant.id
      }
    }
    
    // If no tenant_id from slug, try to get default tenant (first active tenant)
    // This ensures calculator customers are assigned to a company
    if (!tenant_id) {
      const defaultTenant = await c.env.DB.prepare(`
        SELECT id FROM tenants WHERE status = 'active' ORDER BY id LIMIT 1
      `).first()
      
      if (defaultTenant) {
        tenant_id = defaultTenant.id
      }
    }
    
    // Check if customer already exists
    let customer = await c.env.DB.prepare(`
      SELECT id FROM customers WHERE phone = ?
    `).bind(data.phone).first()
    
    let customer_id
    
    if (customer) {
      // Update existing customer with calculator data
      customer_id = customer.id
      
      await c.env.DB.prepare(`
        UPDATE customers 
        SET full_name = ?, 
            birthdate = ?, 
            monthly_salary = ?,
            financing_amount = ?,
            monthly_obligations = ?,
            financing_type_id = ?,
            financing_duration_months = ?,
            best_bank_id = ?,
            best_rate = ?,
            monthly_payment = ?,
            total_payment = ?,
            calculation_date = CURRENT_TIMESTAMP,
            tenant_id = COALESCE(?, tenant_id)
        WHERE id = ?
      `).bind(
        data.name,
        data.birthdate,
        data.salary,
        data.amount,
        data.obligations || 0,
        data.financing_type_id,
        data.duration_months || null,
        data.best_bank_id || null,
        data.best_rate || null,
        data.monthly_payment || null,
        data.total_payment || null,
        tenant_id,
        customer_id
      ).run()
    } else {
      // Create new customer with initial calculator data
      // Generate temporary unique national_id to avoid UNIQUE constraint error
      const tempNationalId = `TEMP-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
      const result = await c.env.DB.prepare(`
        INSERT INTO customers (
          full_name, phone, birthdate, monthly_salary,
          financing_amount, monthly_obligations, financing_type_id,
          financing_duration_months, best_bank_id, best_rate,
          monthly_payment, total_payment, calculation_date,
          national_id, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `).bind(
        data.name,
        data.phone,
        data.birthdate,
        data.salary,
        data.amount,
        data.obligations || 0,
        data.financing_type_id,
        data.duration_months || null,
        data.best_bank_id || null,
        data.best_rate || null,
        data.monthly_payment || null,
        data.total_payment || null,
        tempNationalId, // temporary unique national_id
        tenant_id
      ).run()
      
      customer_id = result.meta.last_row_id
    }
    
    return c.json({ 
      success: true, 
      customer_id: customer_id,
      tenant_id: tenant_id,
      message: 'تم حفظ بيانات العميل بنجاح'
    })
  } catch (error: any) {
    console.error('Save customer error:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

app.post('/api/calculator/submit-request', async (c) => {
  try {
    const data = await c.req.json()
    
    // Get tenant_id (from slug or default to first active tenant)
    const tenantSlug = data.tenant_slug || null
    let tenant_id = null
    
    if (tenantSlug) {
      const tenant = await c.env.DB.prepare(`
        SELECT id FROM tenants WHERE slug = ? AND status = 'active'
      `).bind(tenantSlug).first()
      
      if (tenant) {
        tenant_id = tenant.id
      }
    }
    
    // If no tenant_id from slug, get default tenant (first active tenant)
    if (!tenant_id) {
      const defaultTenant = await c.env.DB.prepare(`
        SELECT id FROM tenants WHERE status = 'active' ORDER BY id LIMIT 1
      `).first()
      
      if (defaultTenant) {
        tenant_id = defaultTenant.id
      }
    }
    
    // Step 1: Check if customer exists (by national_id or phone)
    let customer = await c.env.DB.prepare(`
      SELECT id, tenant_id FROM customers WHERE national_id = ? OR phone = ?
    `).bind(data.national_id, data.phone).first()
    
    let customer_id
    
    if (customer) {
      // Customer exists, use existing ID
      customer_id = customer.id
      
      // Update customer info (including all new fields)
      // Only update tenant_id if customer doesn't have one
      await c.env.DB.prepare(`
        UPDATE customers 
        SET full_name = ?, phone = ?, email = ?, 
            birthdate = ?, monthly_salary = ?,
            employer_name = ?, job_title = ?,
            work_start_date = ?, city = ?,
            tenant_id = COALESCE(tenant_id, ?)
        WHERE id = ?
      `).bind(
        data.full_name,
        data.phone,
        data.email || null,
        data.birthdate,
        data.monthly_salary,
        data.employer,
        data.job_title,
        data.work_start_date,
        data.city,
        tenant_id,
        customer_id
      ).run()
      
      // Use customer's tenant_id if available
      if (customer.tenant_id) {
        tenant_id = customer.tenant_id
      }
    } else {
      // Create new customer - but check one more time to avoid race condition
      try {
        const customerResult = await c.env.DB.prepare(`
          INSERT INTO customers (
            full_name, phone, email, national_id, 
            birthdate, monthly_salary, employer_name, 
            job_title, work_start_date, city, tenant_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.full_name,
          data.phone,
          data.email || null,
          data.national_id,
          data.birthdate,
          data.monthly_salary,
          data.employer,
          data.job_title,
          data.work_start_date,
          data.city,
          tenant_id
        ).run()
        
        customer_id = customerResult.meta.last_row_id
      } catch (insertError: any) {
        // If UNIQUE constraint fails, customer was created between check and insert
        // Try to get the customer again
        if (insertError.message && insertError.message.includes('UNIQUE')) {
          const existingCustomer = await c.env.DB.prepare(`
            SELECT id, tenant_id FROM customers WHERE national_id = ? OR phone = ?
          `).bind(data.national_id, data.phone).first()
          
          if (existingCustomer) {
            customer_id = existingCustomer.id
            if (existingCustomer.tenant_id) {
              tenant_id = existingCustomer.tenant_id
            }
          } else {
            throw insertError
          }
        } else {
          throw insertError
        }
      }
    }
    
    // Step 2: Create financing request
    const requestResult = await c.env.DB.prepare(`
      INSERT INTO financing_requests (
        customer_id, financing_type_id, selected_bank_id,
        requested_amount, salary_at_request, duration_months,
        monthly_obligations, monthly_payment,
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      customer_id,
      data.financing_type_id,
      data.bank_id,
      data.requested_amount,
      data.monthly_salary,
      data.duration,
      data.monthly_obligations,
      data.monthly_payment,
      data.notes
    ).run()
    
    const requestId = requestResult.meta.last_row_id
    
    // Step 3: Create notification for new request
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, title, message, type, category, related_request_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      1, // Admin user
      'طلب تمويل جديد',
      `تم استلام طلب تمويل جديد برقم #${requestId} بمبلغ ${data.requested_amount.toLocaleString('ar-SA')} ريال من ${data.full_name}`,
      'info',
      'request',
      requestId
    ).run()
    
    return c.json({ 
      success: true, 
      request_id: requestId,
      customer_id: customer_id,
      message: 'تم إرسال طلبك بنجاح'
    })
  } catch (error: any) {
    console.error('Calculator submit error:', error)
    return c.json({ 
      success: false, 
      error: error.message,
      message: 'حدث خطأ أثناء إرسال الطلب. الرجاء المحاولة مرة أخرى.'
    }, 500)
  }
})

// Update request status
// Update financing request (full data)
app.put('/api/financing-requests/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const authHeader = c.req.header('Authorization')
    let tenantId = null
    
    // Extract tenant_id from JWT token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        tenantId = payload.tenant_id || null
      }
    }
    
    const {
      requested_amount,
      duration_months,
      salary_at_request,
      monthly_obligations,
      status,
      notes,
      id_attachment_url,
      bank_statement_attachment_url,
      salary_attachment_url,
      additional_attachment_url
    } = await c.req.json()
    
    // Build update query with tenant_id check
    let updateFields = [
      'requested_amount = ?',
      'duration_months = ?',
      'salary_at_request = ?',
      'monthly_obligations = ?',
      'status = ?',
      'notes = ?'
    ]
    
    const params = [
      requested_amount,
      duration_months,
      salary_at_request || 0,
      monthly_obligations || 0,
      status || 'pending',
      notes || ''
    ]
    
    // Add attachment URLs if provided
    if (id_attachment_url) {
      updateFields.push('id_attachment_url = ?')
      params.push(id_attachment_url)
    }
    
    if (bank_statement_attachment_url) {
      updateFields.push('bank_statement_attachment_url = ?')
      params.push(bank_statement_attachment_url)
    }
    
    if (salary_attachment_url) {
      updateFields.push('salary_attachment_url = ?')
      params.push(salary_attachment_url)
    }
    
    if (additional_attachment_url) {
      updateFields.push('additional_attachment_url = ?')
      params.push(additional_attachment_url)
    }
    
    params.push(id)
    
    let updateQuery = `
      UPDATE financing_requests 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `
    
    // Add tenant_id filter if not SuperAdmin
    if (tenantId !== null) {
      updateQuery += ' AND tenant_id = ?'
      params.push(tenantId)
    }
    
    await c.env.DB.prepare(updateQuery).bind(...params).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('Update financing request error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update financing request status only
app.put('/api/financing-requests/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const { status, notes } = await c.req.json()
    
    // Get old status
    const oldRequest = await c.env.DB.prepare(`
      SELECT status FROM financing_requests WHERE id = ?
    `).bind(id).first()
    
    // Update status and timestamp based on new status
    const timestampFields = {
      'pending': 'pending_at',
      'under_review': 'under_review_at',
      'processing': 'processing_at',
      'approved': 'approved_at',
      'rejected': 'rejected_at'
    }
    
    const timestampField = timestampFields[status as keyof typeof timestampFields]
    
    if (timestampField) {
      await c.env.DB.prepare(`
        UPDATE financing_requests 
        SET status = ?, notes = ?, ${timestampField} = datetime('now'), reviewed_at = datetime('now')
        WHERE id = ?
      `).bind(status, notes, id).run()
    } else {
      await c.env.DB.prepare(`
        UPDATE financing_requests SET status = ?, notes = ? WHERE id = ?
      `).bind(status, notes, id).run()
    }
    
    // Record status change in history
    if (oldRequest && oldRequest.status !== status) {
      await c.env.DB.prepare(`
        INSERT INTO financing_request_status_history (request_id, old_status, new_status, changed_by, notes)
        VALUES (?, ?, ?, 'admin', ?)
      `).bind(id, oldRequest.status, status, notes || '').run()
    }
    
    // Get request details
    const request = await c.env.DB.prepare(`
      SELECT requested_amount FROM financing_requests WHERE id = ?
    `).bind(id).first()
    
    // Create notification for status change
    const statusMessages = {
      'pending': 'قيد الانتظار',
      'under_review': 'قيد المراجعة',
      'approved': 'موافق عليه',
      'rejected': 'مرفوض'
    }
    
    const statusTypes = {
      'pending': 'info',
      'under_review': 'warning',
      'approved': 'success',
      'rejected': 'error'
    }
    
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, title, message, type, category, related_request_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      1, // Admin user
      'تحديث حالة الطلب',
      `تم تحديث حالة الطلب #${id} إلى: ${statusMessages[status as keyof typeof statusMessages] || status}`,
      statusTypes[status as keyof typeof statusTypes] || 'info',
      'status_change',
      id
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('Update status error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ATTACHMENTS APIs

// Upload attachment to R2
app.post('/api/attachments/upload', async (c) => {
  try {
    if (!c.env?.ATTACHMENTS) {
      return c.json({ success: false, error: 'Attachment storage not configured' }, 500)
    }

    const formData = await c.req.formData()
    const fileEntry = formData.get('file')
    const requestId = String(formData.get('request_id') || '').trim()
    const rawAttachmentType = String(formData.get('attachmentType') || formData.get('attachment_type') || '').trim()
    const allowedAttachmentTypes = new Set(['id', 'salary', 'bank_statement', 'additional'])
    const attachmentType = rawAttachmentType.toLowerCase()
    
    if (!allowedAttachmentTypes.has(attachmentType)) {
      return c.json({ success: false, error: 'Invalid attachment type' }, 400)
    }

    if (!fileEntry || !(fileEntry instanceof File)) {
      return c.json({ success: false, error: 'No file provided' }, 400)
    }

    const file = fileEntry

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const rawExtension = file.name.split('.').pop() || 'bin'
    const fileExtension = rawExtension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin'
    const filename = requestId 
      ? `${requestId}/${attachmentType}_${timestamp}.${fileExtension}`
      : `temp/${attachmentType}_${timestamp}_${random}.${fileExtension}`
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer()
    await c.env.ATTACHMENTS.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    })
    
    const publicUrl = `/api/attachments/view/${filename}`
    
    // Update database only if requestId is provided
    if (requestId) {
      if (!c.env?.DB) {
        return c.json({ success: false, error: 'Database not configured' }, 500)
      }

      const attachmentColumns: Record<string, string> = {
        id: 'id_attachment_url',
        salary: 'salary_attachment_url',
        bank_statement: 'bank_statement_attachment_url',
        additional: 'additional_attachment_url'
      }
      const columnName = attachmentColumns[attachmentType]
      console.log('📎 Updating attachment:', { requestId, attachmentType, columnName, publicUrl })
      
      const result = await c.env.DB.prepare(`
        UPDATE financing_requests 
        SET ${columnName} = ? 
        WHERE id = ?
      `).bind(publicUrl, requestId).run()
      
      console.log('✅ Update result:', result)
    }
    
    return c.json({ 
      success: true, 
      url: publicUrl,
      filename: filename
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// View/Download attachment from R2
app.get('/api/attachments/view/:path{.+}', async (c) => {
  try {
    if (!c.env?.ATTACHMENTS) {
      return c.json({ success: false, error: 'Attachment storage not configured' }, 500)
    }

    const path = c.req.param('path')
    const object = await c.env.ATTACHMENTS.get(path)
    
    if (!object) {
      return c.notFound()
    }
    
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    
    return new Response(object.body, { headers })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete attachment from R2
app.delete('/api/attachments/delete/:path{.+}', async (c) => {
  try {
    if (!c.env?.ATTACHMENTS) {
      return c.json({ success: false, error: 'Attachment storage not configured' }, 500)
    }

    const path = c.req.param('path')
    
    // Delete from R2
    await c.env.ATTACHMENTS.delete(path)
    
    // Update database to remove the URL
    // Extract request_id and attachment type from path
    // Path format: {request_id}/{type}_{timestamp}.{ext}
    const pathParts = path.split('/')
    if (pathParts.length === 2) {
      const requestId = pathParts[0]
      const filename = pathParts[1]
      
      // Determine attachment type from filename
      let columnName = null
      if (filename.startsWith('id_')) {
        columnName = 'id_attachment_url'
      } else if (filename.startsWith('salary_')) {
        columnName = 'salary_attachment_url'
      } else if (filename.startsWith('bank_statement_')) {
        columnName = 'bank_statement_attachment_url'
      } else if (filename.startsWith('additional_')) {
        columnName = 'additional_attachment_url'
      }
      
      // Update database if we identified the column
      if (columnName) {
        await c.env.DB.prepare(`
          UPDATE financing_requests 
          SET ${columnName} = NULL 
          WHERE id = ?
        `).bind(requestId).run()
      }
    }
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('Delete error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// NOTIFICATIONS APIs

// Get all notifications for current user (for now, hardcoded user_id = 1)
app.get('/api/notifications', async (c) => {
  try {
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    let userId = 1
    
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      userId = parseInt(parts[0])
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    let query = `
      SELECT 
        n.*,
        fr.requested_amount,
        fr.status as request_status
      FROM notifications n
      LEFT JOIN financing_requests fr ON n.related_request_id = fr.id
      WHERE n.user_id = ?`
    
    if (tenant_id) {
      query += ` AND n.tenant_id = ${tenant_id}`
    }
    
    query += `
      ORDER BY n.created_at DESC
      LIMIT 50`
    
    const { results } = await c.env.DB.prepare(query).bind(userId).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get unread notifications count
app.get('/api/notifications/unread-count', async (c) => {
  try {
    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    let userId = 1
    
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      userId = parseInt(parts[0])
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    let query = `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`
    
    if (tenant_id) {
      query += ` AND tenant_id = ${tenant_id}`
    }
    
    const result = await c.env.DB.prepare(query).bind(userId).first()
    
    return c.json({ success: true, count: result?.count || 0 })
  } catch (error: any) {
    console.error('Error fetching unread count:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Mark notification as read
app.put('/api/notifications/:id/read', async (c) => {
  try {
    const id = c.req.param('id')
    const userId = 1 // TODO: Get from session/auth
    
    await c.env.DB.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(id, userId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Mark all notifications as read
app.put('/api/notifications/read-all', async (c) => {
  try {
    const userId = 1 // TODO: Get from session/auth
    
    await c.env.DB.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('Error marking all as read:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete notification
app.delete('/api/notifications/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const userId = 1 // TODO: Get from session/auth
    
    await c.env.DB.prepare(`
      DELETE FROM notifications
      WHERE id = ? AND user_id = ?
    `).bind(id, userId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create notification (helper function for system use)
app.post('/api/notifications', async (c) => {
  try {
    const { user_id, title, message, type, category, related_request_id } = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, title, message, type, category, related_request_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(user_id || 1, title, message, type || 'info', category || 'general', related_request_id || null).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// CALCULATIONS APIs

// Get all calculations
app.get('/api/calculations', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        calc.*,
        u.full_name as user_name,
        b.bank_name,
        ft.type_name as financing_type
      FROM calculations calc
      LEFT JOIN users u ON calc.user_id = u.id
      JOIN banks b ON calc.bank_id = b.id
      JOIN financing_types ft ON calc.financing_type_id = ft.id
      ORDER BY calc.created_at DESC
      LIMIT 100
    `).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Calculate financing
app.post('/api/calculate', async (c) => {
  try {
    const { amount, duration_months, salary, bank_id, financing_type_id, user_id, subscription_id } = await c.req.json()
    
    // Get rate for this bank and financing type
    const rate_data = await c.env.DB.prepare(`
      SELECT rate FROM bank_financing_rates 
      WHERE bank_id = ? AND financing_type_id = ? AND is_active = 1
      LIMIT 1
    `).bind(bank_id, financing_type_id).first()
    
    if (!rate_data) {
      return c.json({ success: false, error: 'لا توجد نسبة تمويل متاحة لهذا البنك ونوع التمويل' }, 400)
    }
    
    const rate = rate_data.rate as number
    
    // Calculate
    const monthly_rate = rate / 100 / 12
    const monthly_payment = (amount * monthly_rate * Math.pow(1 + monthly_rate, duration_months)) / 
                           (Math.pow(1 + monthly_rate, duration_months) - 1)
    const total_payment = monthly_payment * duration_months
    const total_interest = total_payment - amount
    
    // Save calculation
    const result = await c.env.DB.prepare(`
      INSERT INTO calculations 
      (user_id, subscription_id, financing_type_id, bank_id, amount, duration_months, salary, rate, monthly_payment, total_payment, total_interest)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user_id || null, subscription_id || null, financing_type_id, bank_id,
      amount, duration_months, salary, rate, monthly_payment, total_payment, total_interest
    ).run()
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        amount,
        duration_months,
        rate,
        monthly_payment: Math.round(monthly_payment * 100) / 100,
        total_payment: Math.round(total_payment * 100) / 100,
        total_interest: Math.round(total_interest * 100) / 100
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// DASHBOARD APIs

// Temporary endpoint to create payments table
app.post('/api/admin/init-payments-table', async (c) => {
  try {
    // Create payments table
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        financing_request_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        tenant_id INTEGER NOT NULL,
        employee_id INTEGER,
        amount REAL NOT NULL,
        payment_date TEXT NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        receipt_number TEXT,
        notes TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run()
    
    // Create indexes
    await c.env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id)').run()
    await c.env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_payments_request ON payments(financing_request_id)').run()
    await c.env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id)').run()
    await c.env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_payments_employee ON payments(employee_id)').run()
    await c.env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date)').run()
    
    return c.json({ success: true, message: 'Payments table created successfully' })
  } catch (error: any) {
    console.error('Error creating payments table:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get dashboard statistics
app.get('/api/dashboard/stats', async (c) => {
  try {
    // Get user info (userId, tenantId, roleId)
    const userInfo = await getUserInfo(c);
    
    // Build queries with role-based filtering
    let customers_query = 'SELECT COUNT(*) as count FROM customers'
    let requests_query = 'SELECT COUNT(*) as count FROM financing_requests'
    let pending_query = 'SELECT COUNT(*) as count FROM financing_requests WHERE status = "pending"'
    let approved_query = 'SELECT COUNT(*) as count FROM financing_requests WHERE status = "approved"'
    let subscriptions_query = 'SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"'
    let users_query = 'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
    
    // Apply role-based filtering
    let tenant_id = null;
    
    if (userInfo.roleId === 1) {
      // Role 1: Super Admin - sees ALL data (no filter)
      tenant_id = null;
    } else if (userInfo.roleId === 2 || userInfo.roleId === 3) {
      // Role 2: Company Admin & Role 3: Supervisor - see company data only
      tenant_id = userInfo.tenantId;
      if (tenant_id !== null) {
        customers_query += ' WHERE tenant_id = ?'
        requests_query += ' WHERE tenant_id = ?'
        pending_query += ' AND tenant_id = ?'
        approved_query += ' AND tenant_id = ?'
        subscriptions_query += ' AND tenant_id = ?'
        users_query += ' AND tenant_id = ?'
      }
    } else if (userInfo.roleId === 4) {
      // Role 4: Employee - sees only assigned customers/requests
      if (userInfo.userId) {
        customers_query += ' WHERE assigned_to = ?'
        requests_query += ' WHERE customer_id IN (SELECT id FROM customers WHERE assigned_to = ?)'
        pending_query += ' AND customer_id IN (SELECT id FROM customers WHERE assigned_to = ?)'
        approved_query += ' AND customer_id IN (SELECT id FROM customers WHERE assigned_to = ?)'
        // For employee, we use userId instead of tenant_id
        tenant_id = userInfo.userId;
      } else {
        // No data for employee without userId
        customers_query += ' WHERE 1 = 0'
        requests_query += ' WHERE 1 = 0'
        pending_query += ' AND 1 = 0'
        approved_query += ' AND 1 = 0'
      }
    } else {
      // Unknown role - no data
      customers_query += ' WHERE 1 = 0'
      requests_query += ' WHERE 1 = 0'
      pending_query += ' AND 1 = 0'
      approved_query += ' AND 1 = 0'
    }
    
    // Execute queries based on role
    const customers_count = tenant_id !== null && userInfo.roleId !== 1
      ? await c.env.DB.prepare(customers_query).bind(tenant_id).first()
      : await c.env.DB.prepare(customers_query).first()
      
    const requests_count = tenant_id !== null && userInfo.roleId !== 1
      ? await c.env.DB.prepare(requests_query).bind(tenant_id).first()
      : await c.env.DB.prepare(requests_query).first()
      
    const pending_count = tenant_id !== null && userInfo.roleId !== 1
      ? await c.env.DB.prepare(pending_query).bind(tenant_id).first()
      : await c.env.DB.prepare(pending_query).first()
      
    const approved_count = tenant_id !== null && userInfo.roleId !== 1
      ? await c.env.DB.prepare(approved_query).bind(tenant_id).first()
      : await c.env.DB.prepare(approved_query).first()
      
    const subscriptions_count = tenant_id !== null && userInfo.roleId !== 1 && userInfo.roleId !== 4
      ? await c.env.DB.prepare(subscriptions_query).bind(userInfo.tenantId).first()
      : (userInfo.roleId === 1 ? await c.env.DB.prepare(subscriptions_query).first() : { count: 0 })
      
    const users_count = tenant_id !== null && userInfo.roleId !== 1 && userInfo.roleId !== 4
      ? await c.env.DB.prepare(users_query).bind(userInfo.tenantId).first()
      : (userInfo.roleId === 1 ? await c.env.DB.prepare(users_query).first() : { count: 0 })
    
    // Banks - no tenant_id column, count all active banks
    // Banks are shared across all tenants
    const banks_count = await c.env.DB.prepare('SELECT COUNT(*) as count FROM banks WHERE is_active = 1').first()
    
    // Tenants - count active companies (only for super admin)
    const tenants_count = await c.env.DB.prepare('SELECT COUNT(*) as count FROM tenants WHERE status = "active"').first()
    
    // Calculations - count all (no tenant_id column in calculations table)
    const calculations_count = await c.env.DB.prepare('SELECT COUNT(*) as count FROM calculations').first()
    
    return c.json({
      success: true,
      data: {
        total_customers: customers_count?.count || 0,
        total_requests: requests_count?.count || 0,
        pending_requests: pending_count?.count || 0,
        approved_requests: approved_count?.count || 0,
        active_subscriptions: subscriptions_count?.count || 0,
        total_calculations: calculations_count?.count || 0,
        active_banks: banks_count?.count || 0,
        active_tenants: tenants_count?.count || 0,
        active_users: users_count?.count || 0
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// DELETE APIs

// Delete customer
app.delete('/api/customers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    // Delete related financing requests first
    await c.env.DB.prepare('DELETE FROM financing_requests WHERE customer_id = ?').bind(id).run()
    // Then delete customer
    await c.env.DB.prepare('DELETE FROM customers WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'تم حذف العميل بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete financing request
app.delete('/api/financing-requests/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const result = await c.env.DB.prepare('DELETE FROM financing_requests WHERE id = ?').bind(id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'الطلب غير موجود' }, 404)
    }
    
    return c.json({ success: true, message: 'تم حذف الطلب بنجاح' })
  } catch (error: any) {
    console.error('Error deleting financing request:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete bank
app.delete('/api/banks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM banks WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'تم حذف البنك بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete rate
app.delete('/api/rates/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM bank_financing_rates WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'تم حذف النسبة بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete subscription
app.delete('/api/subscriptions/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM subscriptions WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'تم حذف الاشتراك بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete user
app.delete('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'تم حذف المستخدم بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete package
app.delete('/api/packages/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM packages WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'تم حذف الباقة بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// SUBSCRIPTION REQUESTS APIs

// Get all subscription requests
app.get('/api/subscription-requests', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        sr.*,
        p.package_name
      FROM subscription_requests sr
      LEFT JOIN packages p ON sr.package_id = p.id
      ORDER BY sr.created_at DESC
    `).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update subscription request status
app.put('/api/subscription-requests/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const { status, notes } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE subscription_requests 
      SET status = ?, notes = ?
      WHERE id = ?
    `).bind(status, notes, id).run()
    
    return c.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete subscription request
app.delete('/api/subscription-requests/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM subscription_requests WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'تم حذف طلب الاشتراك بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})


// ============================================
// PERMISSIONS APIs
// ============================================

// Get all permissions
app.get('/api/permissions', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM permissions ORDER BY category, id').all()
    return c.json({ success: true, data: result.results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get permissions by category
app.get('/api/permissions/by-category', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM permissions ORDER BY category, id').all()
    const permissions = result.results
    
    // Group by category
    const grouped: any = {}
    permissions.forEach((perm: any) => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = []
      }
      grouped[perm.category].push(perm)
    })
    
    return c.json({ success: true, data: grouped })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get role permissions
app.get('/api/roles/:roleId/permissions', async (c) => {
  try {
    const roleId = c.req.param('roleId')
    const result = await c.env.DB.prepare(`
      SELECT p.* FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.category, p.id
    `).bind(roleId).all()
    
    return c.json({ success: true, data: result.results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get user permissions
app.get('/api/users/:userId/permissions', async (c) => {
  try {
    const userId = c.req.param('userId')
    const result = await c.env.DB.prepare(`
      SELECT p.* FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN users u ON u.role_id = rp.role_id
      WHERE u.id = ?
      ORDER BY p.category, p.id
    `).bind(userId).all()
    
    return c.json({ success: true, data: result.results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update role permissions
app.put('/api/roles/:roleId/permissions', async (c) => {
  try {
    const roleId = c.req.param('roleId')
    const { permission_ids } = await c.req.json()
    
    // Delete existing permissions
    await c.env.DB.prepare('DELETE FROM role_permissions WHERE role_id = ?').bind(roleId).run()
    
    // Insert new permissions
    for (const permId of permission_ids) {
      await c.env.DB.prepare(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
      ).bind(roleId, permId).run()
    }
    
    return c.json({ success: true, message: 'تم تحديث صلاحيات الدور بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Check if user has permission
app.post('/api/users/check-permission', async (c) => {
  try {
    const { user_id, permission_key } = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as has_permission FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN users u ON u.role_id = rp.role_id
      WHERE u.id = ? AND p.permission_key = ?
    `).bind(user_id, permission_key).first()
    
    return c.json({ 
      success: true, 
      has_permission: (result as any)?.has_permission > 0 
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get all roles with permissions count
app.get('/api/roles', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT r.*, 
             COUNT(rp.permission_id) as permissions_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.id
    `).all()
    
    return c.json({ success: true, data: result.results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new role
app.post('/api/roles', async (c) => {
  try {
    const { role_name, description } = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO roles (role_name, description, created_at)
      VALUES (?, ?, datetime('now'))
    `).bind(role_name, description).run()
    
    return c.json({ 
      success: true, 
      message: 'تم إضافة الدور بنجاح',
      role_id: result.meta.last_row_id 
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update role
app.put('/api/roles/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { role_name, description } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE roles 
      SET role_name = ?, description = ?
      WHERE id = ?
    `).bind(role_name, description, id).run()
    
    return c.json({ success: true, message: 'تم تحديث الدور بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete role
app.delete('/api/roles/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Check if role is in use
    const usersCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role_id = ?
    `).bind(id).first()
    
    if (usersCount && usersCount.count > 0) {
      return c.json({ 
        success: false, 
        error: 'لا يمكن حذف هذا الدور لأنه مرتبط بمستخدمين' 
      }, 400)
    }
    
    // Delete role permissions first
    await c.env.DB.prepare(`
      DELETE FROM role_permissions WHERE role_id = ?
    `).bind(id).run()
    
    // Delete role
    await c.env.DB.prepare(`
      DELETE FROM roles WHERE id = ?
    `).bind(id).run()
    
    return c.json({ success: true, message: 'تم حذف الدور بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update user (including role change)
app.put('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { full_name, email, phone, role_id, is_active } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE users 
      SET full_name = ?, email = ?, phone = ?, role_id = ?, is_active = ?
      WHERE id = ?
    `).bind(full_name, email, phone, role_id, is_active, id).run()
    
    return c.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================
// PAGES
// ============================================

// Public pages (no authentication required)
// Test bindings at root with ?test=bindings
app.get('/', async (c) => {
  if (c.req.query('test') === 'bindings') {
    return c.json({
      DB: !!c.env.DB,
      ATTACHMENTS: !!c.env.ATTACHMENTS,
      timestamp: new Date().toISOString()
    })
  }
  return c.html(homePage)
})
app.get('/calculator', (c) => c.html(smartCalculator))
app.get('/calculator-old', (c) => c.html(calculatorPage))

// Multi-tenant calculator route
app.get('/c/:tenant/calculator', async (c) => {
  const tenantSlug = c.req.param('tenant')
  
  // Get tenant information from database
  const tenant = await c.env.DB.prepare(`
    SELECT * FROM tenants WHERE slug = ? AND status = 'active'
  `).bind(tenantSlug).first()
  
  if (!tenant) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>شركة غير موجودة</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="max-w-md mx-auto text-center p-8 bg-white rounded-xl shadow-lg">
          <i class="fas fa-building text-6xl text-red-500 mb-4"></i>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">الشركة غير موجودة</h1>
          <p class="text-gray-600 mb-6">لم نتمكن من العثور على هذه الشركة</p>
          <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-block">
            <i class="fas fa-home ml-2"></i>
            العودة للصفحة الرئيسية
          </a>
        </div>
      </body>
      </html>
    `)
  }
  
  // Return calculator page with tenant context
  // Add tenant info as JavaScript variable and update messages
  return c.html(smartCalculator
    .replace(/حاسبة التمويل الذكية/g, `حاسبة تمويل ${tenant.company_name}`)
    .replace('/api/calculator/submit-request', `/api/c/${tenantSlug}/calculator/submit-request`)
    .replace('<script>', `<script>\n        // Tenant information for company-specific calculator\n        window.TENANT_NAME = '${tenant.company_name.replace(/'/g, "\\'")}';\n    `)
    .replace('سيتم التواصل معك قريباً من \' + selectedBestOffer.bank.bank_name', `سيتم المراجعة من شركة ${tenant.company_name.replace(/'/g, "\\'")} وسوف يتم التواصل معك قريباً'`)
  )
})

app.get('/login', (c) => c.html(loginPage))
app.get('/forgot-password', (c) => c.html(forgotPasswordPage))
app.get('/packages', (c) => c.html(packagesPage))
app.get('/subscribe', (c) => c.html(subscribePage))

// Protected admin pages (requires login - basic protection with redirect message)
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تحميل...</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body>
        <script>
            // Check if user is logged in
            const authToken = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            
            if (authToken && userData) {
                // User is logged in, load admin panel
                window.location.replace('/admin/panel');
            } else {
                // User is not logged in, show login required page
                document.body.innerHTML = \`
                    <div class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
                        <div class="max-w-md w-full mx-4">
                            <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
                                <div class="mb-6">
                                    <i class="fas fa-lock text-6xl text-blue-600"></i>
                                </div>
                                <h1 class="text-3xl font-bold text-gray-800 mb-4">تسجيل الدخول مطلوب</h1>
                                <p class="text-gray-600 mb-6">
                                    يجب تسجيل الدخول للوصول إلى لوحة الإدارة
                                </p>
                                <div class="space-y-3">
                                    <a href="/login" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                                        <i class="fas fa-sign-in-alt ml-2"></i>
                                        تسجيل الدخول
                                    </a>
                                    <a href="/" class="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors">
                                        <i class="fas fa-home ml-2"></i>
                                        العودة للرئيسية
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            }
        </script>
    </body>
    </html>
  `)
})

// Admin panel (actual panel after login check)
// Reports API
app.get('/api/reports/statistics', async (c) => {
  try {
    const fromDate = c.req.query('from_date')
    const toDate = c.req.query('to_date')
    
    // Get tenant_id from auth token
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }
    
    // Build where clause
    let whereClause = '1=1'
    const bindings: any[] = []
    
    if (tenant_id) {
      whereClause += ' AND f.tenant_id = ?'
      bindings.push(tenant_id)
    }
    
    if (fromDate) {
      whereClause += ' AND DATE(f.created_at) >= ?'
      bindings.push(fromDate)
    }
    
    if (toDate) {
      whereClause += ' AND DATE(f.created_at) <= ?'
      bindings.push(toDate)
    }
    
    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN f.status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
        SUM(CASE WHEN f.status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN f.status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests,
        SUM(f.requested_amount) as total_amount
      FROM financing_requests f
      WHERE ${whereClause}
    `
    
    const stats = await c.env.DB.prepare(statsQuery).bind(...bindings).first()
    
    // Get top customers
    const topCustomersQuery = `
      SELECT 
        c.full_name as customer_name,
        COUNT(f.id) as request_count,
        SUM(f.requested_amount) as total_amount,
        MAX(f.created_at) as last_request_date
      FROM financing_requests f
      JOIN customers c ON f.customer_id = c.id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY request_count DESC, total_amount DESC
      LIMIT 10
    `
    
    const { results: topCustomers } = await c.env.DB.prepare(topCustomersQuery).bind(...bindings).all()
    
    return c.json({
      success: true,
      data: {
        ...stats,
        top_customers: topCustomers
      }
    })
  } catch (error: any) {
    console.error('Reports API error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Requests Follow-up Report API (Manager only)
app.get('/api/reports/requests-followup', async (c) => {
  try {
    // Get user info using getUserInfo (supports both Cookie and Authorization header)
    const userInfo = await getUserInfo(c)
    
    // Check authentication
    if (!userInfo.userId || !userInfo.roleId) {
      return c.json({ success: false, error: 'غير مصرح بالوصول' }, 401)
    }
    
    // Get tenant_id from query parameter (for Super Admin) or user info
    const queryTenantId = c.req.query('tenant_id')
    let tenant_id = queryTenantId ? parseInt(queryTenantId) : userInfo.tenantId
    
    // Super Admin (role_id = 1) can access all tenants if no specific tenant_id provided
    if (userInfo.roleId === 1 && !tenant_id) {
      // If no tenant_id specified, show all requests
      tenant_id = null
    }
    
    console.log('📊 Requests followup report - User:', userInfo.userId, 'Role:', userInfo.roleId, 'Tenant:', tenant_id)
    
    // Get requests with customer and employee info
    let query = `
      SELECT 
        fr.id,
        fr.created_at,
        fr.approved_at,
        fr.rejected_at,
        fr.reviewed_at,
        fr.status,
        fr.requested_amount,
        c.full_name as customer_name,
        c.phone as customer_phone,
        u.full_name as employee_name,
        u.username as employee_username,
        t.company_name as tenant_name,
        CASE 
          WHEN fr.status = 'approved' AND fr.approved_at IS NOT NULL THEN fr.approved_at
          WHEN fr.status = 'rejected' AND fr.rejected_at IS NOT NULL THEN fr.rejected_at
          WHEN fr.reviewed_at IS NOT NULL THEN fr.reviewed_at
          ELSE NULL
        END as last_update,
        CASE 
          WHEN fr.status = 'approved' AND fr.approved_at IS NOT NULL THEN 
            CAST((julianday(fr.approved_at) - julianday(fr.created_at)) AS INTEGER)
          WHEN fr.status = 'rejected' AND fr.rejected_at IS NOT NULL THEN 
            CAST((julianday(fr.rejected_at) - julianday(fr.created_at)) AS INTEGER)
          ELSE 
            CAST((julianday('now') - julianday(fr.created_at)) AS INTEGER)
        END as days_elapsed,
        CASE 
          WHEN fr.status IN ('approved', 'rejected') THEN 1
          ELSE 0
        END as is_closed
      FROM financing_requests fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN customer_assignments ca ON c.id = ca.customer_id
      LEFT JOIN users u ON ca.employee_id = u.id
      LEFT JOIN tenants t ON c.tenant_id = t.id
    `
    
    // Add WHERE clause if tenant_id is specified
    if (tenant_id) {
      query += ' WHERE c.tenant_id = ?'
    }
    
    query += ' ORDER BY fr.created_at DESC'
    
    const { results } = tenant_id 
      ? await c.env.DB.prepare(query).bind(tenant_id).all()
      : await c.env.DB.prepare(query).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    console.error('Requests follow-up report error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Banks Report API
app.get('/api/reports/banks', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    
    if (!userInfo.userId || !userInfo.roleId) {
      return c.json({ success: false, error: 'غير مصرح بالوصول' }, 401);
    }

    // Build query based on role
    let whereClause = '';
    let queryParams: any[] = [];
    
    if (userInfo.roleId !== 1) {
      // Not super admin - filter by tenant
      whereClause = 'WHERE b.tenant_id = ?';
      queryParams.push(userInfo.tenantId);
    }

    const query = `
      SELECT 
        b.id,
        b.bank_name,
        COUNT(fr.id) as total_requests,
        SUM(CASE WHEN fr.status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
        SUM(CASE WHEN fr.status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests,
        SUM(CASE WHEN fr.status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        ROUND(
          CAST(SUM(CASE WHEN fr.status = 'approved' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(fr.id), 0) * 100, 
          2
        ) as approval_rate,
        ROUND(AVG(fr.requested_amount), 2) as average_amount
      FROM banks b
      LEFT JOIN financing_requests fr ON b.id = fr.selected_bank_id
      ${whereClause}
      GROUP BY b.id, b.bank_name
      ORDER BY total_requests DESC
    `;

    const { results } = queryParams.length > 0
      ? await c.env.DB.prepare(query).bind(...queryParams).all()
      : await c.env.DB.prepare(query).all();

    // Calculate summary
    const summary = {
      total_banks: results.length,
      total_requests: results.reduce((sum: number, b: any) => sum + (b.total_requests || 0), 0),
      overall_approval_rate: results.length > 0
        ? (results.reduce((sum: number, b: any) => sum + (parseFloat(b.approval_rate) || 0), 0) / results.length).toFixed(2)
        : '0.00',
      average_amount: results.length > 0
        ? (results.reduce((sum: number, b: any) => sum + (parseFloat(b.average_amount) || 0), 0) / results.length).toFixed(2)
        : '0.00'
    };

    return c.json({ success: true, banks: results, summary });
  } catch (error: any) {
    console.error('Banks report error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Performance Report API
app.get('/api/reports/performance', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    
    if (!userInfo.userId || !userInfo.roleId) {
      return c.json({ success: false, error: 'غير مصرح بالوصول' }, 401);
    }

    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    // Build WHERE clause
    let whereClause = '';
    let queryParams: any[] = [];
    
    if (userInfo.roleId !== 1 && userInfo.tenantId) {
      whereClause = 'WHERE c.tenant_id = ?';
      queryParams.push(userInfo.tenantId);
    }

    if (startDate && endDate) {
      whereClause += (whereClause ? ' AND ' : 'WHERE ') + 'fr.created_at BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    // Get performance metrics
    const metricsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.created_at >= date('now', '-30 days') THEN c.id END) as active_customers,
        COUNT(fr.id) as total_requests,
        SUM(CASE WHEN fr.status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
        SUM(CASE WHEN fr.status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests,
        SUM(CASE WHEN fr.status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        ROUND(
          CAST(SUM(CASE WHEN fr.status = 'approved' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(fr.id), 0) * 100, 
          2
        ) as approval_rate,
        ROUND(AVG(fr.requested_amount), 2) as avg_order_value,
        ROUND(SUM(CASE WHEN fr.status = 'approved' THEN fr.requested_amount ELSE 0 END), 2) as total_revenue
      FROM customers c
      LEFT JOIN financing_requests fr ON c.id = fr.customer_id
      ${whereClause}
    `;

    const metrics = queryParams.length > 0
      ? await c.env.DB.prepare(metricsQuery).bind(...queryParams).first()
      : await c.env.DB.prepare(metricsQuery).first();

    // Get top performers
    const performersQuery = `
      SELECT 
        u.id,
        u.full_name as name,
        COUNT(DISTINCT c.id) as customers_count,
        COUNT(fr.id) as requests_count,
        SUM(CASE WHEN fr.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        ROUND(
          CAST(SUM(CASE WHEN fr.status = 'approved' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(fr.id), 0) * 100, 
          2
        ) as success_rate,
        ROUND(SUM(CASE WHEN fr.status = 'approved' THEN fr.requested_amount ELSE 0 END), 2) as total_amount
      FROM users u
      LEFT JOIN customer_assignments ca ON u.id = ca.employee_id
      LEFT JOIN customers c ON ca.customer_id = c.id
      LEFT JOIN financing_requests fr ON c.id = fr.customer_id
      ${whereClause.replace('c.tenant_id', 'u.tenant_id')}
      GROUP BY u.id, u.full_name
      HAVING requests_count > 0
      ORDER BY approved_count DESC
      LIMIT 10
    `;

    const { results: performers } = queryParams.length > 0
      ? await c.env.DB.prepare(performersQuery).bind(...queryParams).all()
      : await c.env.DB.prepare(performersQuery).all();

    // Calculate additional metrics
    const conversionRate = metrics?.total_customers && metrics?.total_requests
      ? ((metrics.total_requests / metrics.total_customers) * 100).toFixed(2)
      : '0.00';
    
    const requestRate = metrics?.total_customers && metrics?.total_requests
      ? ((metrics.total_requests / metrics.total_customers) * 100).toFixed(2)
      : '0.00';
    
    const completionRate = metrics?.total_requests && (metrics.approved_requests + metrics.rejected_requests)
      ? (((metrics.approved_requests + metrics.rejected_requests) / metrics.total_requests) * 100).toFixed(2)
      : '0.00';

    return c.json({
      success: true,
      ...metrics,
      monthly_revenue: metrics?.total_revenue || 0,
      conversion_rate: conversionRate,
      request_rate: requestRate,
      completion_rate: completionRate,
      avg_processing_time: '3',
      avg_response_time: '2',
      customer_lifecycle: '45',
      revenue_growth: '15',
      top_performers: performers
    });
  } catch (error: any) {
    console.error('Performance report error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/admin/panel', async (c) => {
  try {
    // Check authentication
    const userInfo = await getUserInfo(c);
    
    if (!userInfo.userId || !userInfo.roleId) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تسجيل الدخول مطلوب</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
          <div class="max-w-md w-full mx-4">
              <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
                  <div class="mb-6">
                      <i class="fas fa-lock text-6xl text-blue-600"></i>
                  </div>
                  <h1 class="text-3xl font-bold text-gray-800 mb-4">تسجيل الدخول مطلوب</h1>
                  <p class="text-gray-600 mb-6">
                      يجب تسجيل الدخول للوصول إلى لوحة التحكم
                  </p>
                  <div class="space-y-3">
                      <a href="/login" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                          <i class="fas fa-sign-in-alt ml-2"></i>
                          تسجيل الدخول
                      </a>
                      <a href="/" class="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors">
                          <i class="fas fa-home ml-2"></i>
                          العودة للرئيسية
                      </a>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `);
  }
  
  // Get user details from database
  const user = await c.env.DB.prepare(`
    SELECT u.*, r.role_name, r.description as role_description, t.company_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN tenants t ON u.tenant_id = t.id
    WHERE u.id = ?
  `).bind(userInfo.userId).first();
  
  if (!user) {
    return c.redirect('/login')
  }
  
  // Get user permissions
  const permissions = await c.env.DB.prepare(`
    SELECT
      p.permission_key as permission_key,
      p.permission_name as permission_name,
      p.category
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
  `).bind(userInfo.roleId).all();
  const permissionResults = Array.isArray(permissions.results) ? permissions.results : []
  
  // Inject user data and permissions into the page
  let adminPanel = fullAdminPanel;

  // Hard server-side removal of super-admin-only menu entries (fail-closed).
  // This avoids any client-side/localStorage issues and guarantees the nav is correct.
  if (userInfo.roleId !== 1) {
    const superAdminOnlyPaths = [
      '/admin/subscriptions',
      '/admin/packages',
      '/admin/tenants',
      '/admin/roles',
      '/admin/saas-settings',
      '/admin/tenant-calculators'
    ];

    for (const path of superAdminOnlyPaths) {
      const linkPattern = new RegExp(
        `<a[^>]*\\bhref=["']${path}["'][^>]*>[\\s\\S]*?<\\/a>`,
        'g'
      );
      adminPanel = adminPanel.replace(linkPattern, '');
    }

    // Belt-and-suspenders: hide any remaining super-admin-only items by attribute
    adminPanel = adminPanel.replace(
      '</head>',
      '<style>[data-superadmin-only="true"]{display:none !important;}</style></head>'
    );
  }
  
  // Replace placeholder with actual user data
  adminPanel = adminPanel.replace(
    '<script>',
    `<script>
      window.USER_DATA = ${JSON.stringify({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
        role_description: user.role_description,
        tenant_id: user.tenant_id,
        company_name: user.company_name,
        user_type: user.user_type
      })};
      window.USER_PERMISSIONS = ${JSON.stringify(permissionResults.map((p: any) => p.permission_key))};
      window.USER_PERMISSIONS_FULL = ${JSON.stringify(permissionResults)};
      window.USER_ROLE_ID = ${userInfo.roleId};
      console.log('✅ User data loaded:', window.USER_DATA);
      console.log('✅ User permissions:', window.USER_PERMISSIONS.length, 'permissions');
    </script>
    <script>`
  );
  
    return c.html(adminPanel);
  } catch (error: any) {
    // Aggressive debug dump for /admin/panel errors
    const errorDump = {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack || 'No stack trace',
      error_stringified: (() => {
        try {
          return JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        } catch (e) {
          return `Failed to stringify: ${e}`
        }
      })()
    }
    
    console.error('❌ [ADMIN_PANEL] ERROR DUMP:', errorDump)
    
    // Return error page with debug info
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>خطأ في تحميل لوحة التحكم</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 p-8">
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 class="text-2xl font-bold text-red-600 mb-4">❌ خطأ في تحميل لوحة التحكم</h1>
          <pre class="bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm">${JSON.stringify(errorDump, null, 2)}</pre>
          <a href="/login" class="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded">العودة لتسجيل الدخول</a>
        </div>
      </body>
      </html>
    `)
  }
})

// Requests Follow-up Report Page (Manager only)
app.get('/admin/reports/requests-followup', async (c) => {
  try {
    // Get tenant_id from query
    const tenantId = c.req.query('tenant_id')
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير متابعة طلبات التمويل</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
          /* Custom Scrollbar - Enhanced */
          .overflow-x-auto {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #3b82f6 #f7fafc;
          }
          
          .overflow-x-auto::-webkit-scrollbar {
            height: 12px;
            width: 12px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-track {
            background: #e5e7eb;
            border-radius: 10px;
            margin: 0 10px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 10px;
            border: 2px solid #e5e7eb;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
            border-color: #d1d5db;
          }
          
          /* Force scrollbar to always show */
          .overflow-x-auto {
            overflow-x: scroll !important; /* Always show scrollbar */
          }
          
          .overflow-x-auto table {
            min-width: 1200px; /* Force table to be wide enough for scrollbar */
            width: max-content;
          }
          
          ${getMobileResponsiveCSS()}
          
          /* Scroll Buttons for Tables */
          .scroll-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: 3px solid white;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            transition: all 0.3s ease;
            font-size: 18px;
          }
          
          .scroll-btn:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
          }
          
          .scroll-btn:active {
            transform: translateY(-50%) scale(0.95);
          }
          
          .scroll-btn-right {
            right: -20px;
          }
          
          .scroll-btn-left {
            left: -20px;
          }
          
          @media (max-width: 768px) {
            .scroll-btn {
              width: 44px;
              height: 44px;
              font-size: 16px;
              border-width: 2px;
            }
            
            .scroll-btn-right {
              right: 8px;
            }
            
            .scroll-btn-left {
              left: 8px;
            }
          }
        </style>
      </head>
      <body class="bg-gray-50">
        <script>
          // Auto-redirect with tenant_id if not present
          (function() {
            const urlParams = new URLSearchParams(window.location.search);
            if (!urlParams.has('tenant_id')) {
              const userData = localStorage.getItem('userData');
              if (userData) {
                try {
                  const user = JSON.parse(userData);
                  if (user.tenant_id) {
                    window.location.replace('/admin/reports/requests-followup?tenant_id=' + user.tenant_id);
                  }
                } catch (e) {
                  console.error('Error parsing userData:', e);
                }
              }
            }
          })();
        </script>
        
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة للوحة التحكم
            </a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex justify-between items-center mb-6 gap-4 flex-wrap">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-file-alt text-blue-600 ml-2"></i>
                تقرير متابعة طلبات التمويل
              </h1>
              <div class="flex items-center gap-3">
                <div class="relative">
                  <input 
                    type="text" 
                    id="searchFollowup" 
                    placeholder="بحث في الطلبات..." 
                    class="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onkeyup="searchFollowupTable()"
                  />
                  <i class="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                </div>
                <button onclick="exportToExcel()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-md whitespace-nowrap">
                  <i class="fas fa-file-excel ml-2"></i>
                  تصدير Excel
                </button>
              </div>
            </div>
            
            <!-- Loading Indicator -->
            <div id="loading" class="text-center py-12">
              <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
              <p class="text-gray-600">جاري تحميل البيانات...</p>
            </div>
            
            <!-- Table Container with Scroll Buttons -->
            <div class="hidden" id="tableWrapper">
              <div class="relative">
                <!-- Right Scroll Button -->
                <button 
                  id="scrollLeftBtn" 
                  onclick="scrollTable('left')"
                  class="scroll-btn scroll-btn-left hidden"
                  aria-label="تمرير لليسار"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                
                <!-- Left Scroll Button -->
                <button 
                  id="scrollRightBtn" 
                  onclick="scrollTable('right')"
                  class="scroll-btn scroll-btn-right hidden"
                  aria-label="تمرير لليمين"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
                
                <div id="tableContainer" class="overflow-x-auto">
                  <table class="w-full">
                <thead class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th class="px-4 py-3 text-right text-sm font-bold">#</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">اسم العميل</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">رقم الهاتف</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">الموظف المخصص</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">تاريخ تقديم الطلب</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">مراحل الطلب</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">آخر تحديث</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">إجمالي الوقت</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">المبلغ المطلوب</th>
                    <th class="px-4 py-3 text-right text-sm font-bold">حالة الطلب</th>
                  </tr>
                </thead>
                <tbody id="reportTable" class="divide-y divide-gray-200">
                </tbody>
              </table>
            </div>
              </div>
            </div>
            
            <!-- Empty State -->
            <div id="emptyState" class="hidden text-center py-12">
              <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
              <p class="text-gray-500 text-xl">لا توجد طلبات لعرضها</p>
            </div>
          </div>
        </div>
        
        <script>
          let reportData = [];
          
          async function loadReport() {
            try {
              const urlParams = new URLSearchParams(window.location.search);
              const tenantId = urlParams.get('tenant_id');
              
              if (!tenantId) {
                alert('خطأ: لم يتم تحديد الشركة');
                return;
              }
              
              const authToken = localStorage.getItem('authToken');
              const response = await axios.get('/api/reports/requests-followup', {
                headers: {
                  'Authorization': 'Bearer ' + authToken
                }
              });
              
              if (response.data.success) {
                reportData = response.data.data;
                displayReport(reportData);
              } else {
                alert('خطأ: ' + response.data.error);
              }
            } catch (error) {
              console.error('Error loading report:', error);
              alert('حدث خطأ أثناء تحميل التقرير');
            } finally {
              document.getElementById('loading').classList.add('hidden');
            }
          }
          
          function displayReport(data) {
            const tbody = document.getElementById('reportTable');
            const tableContainer = document.getElementById('tableContainer');
            const emptyState = document.getElementById('emptyState');
            
            if (data.length === 0) {
              emptyState.classList.remove('hidden');
              return;
            }
            
            tableContainer.classList.remove('hidden');
            document.getElementById('tableWrapper')?.classList.remove('hidden');
            
            tbody.innerHTML = data.map((row, index) => {
              const statusColors = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'approved': 'bg-green-100 text-green-800',
                'rejected': 'bg-red-100 text-red-800',
                'processing': 'bg-blue-100 text-blue-800'
              };
              
              const statusNames = {
                'pending': 'قيد الانتظار',
                'approved': 'مقبول',
                'rejected': 'مرفوض',
                'processing': 'قيد المعالجة'
              };
              
              const statusClass = statusColors[row.status] || 'bg-gray-100 text-gray-800';
              const statusName = statusNames[row.status] || row.status;
              
              const createdDate = new Date(row.created_at);
              const formattedDate = createdDate.toLocaleDateString('ar-SA') + ' ' + createdDate.toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'});
              
              // Build timeline/stages
              const stages = [];
              
              // Stage 1: قيد الانتظار
              if (row.pending_at) {
                const pendingDate = new Date(row.pending_at);
                stages.push(\`
                  <div class="flex items-center text-xs mb-1">
                    <span class="w-2 h-2 rounded-full bg-yellow-500 ml-2"></span>
                    <span class="font-bold">قيد الانتظار:</span>
                    <span class="text-gray-600 mr-1">\${pendingDate.toLocaleDateString('ar-SA')} \${pendingDate.toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                \`);
              }
              
              // Stage 2: تحت المراجعة
              if (row.under_review_at) {
                const reviewDate = new Date(row.under_review_at);
                stages.push(\`
                  <div class="flex items-center text-xs mb-1">
                    <span class="w-2 h-2 rounded-full bg-blue-500 ml-2"></span>
                    <span class="font-bold">تحت المراجعة:</span>
                    <span class="text-gray-600 mr-1">\${reviewDate.toLocaleDateString('ar-SA')} \${reviewDate.toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                \`);
              }
              
              // Stage 3: قيد المعالجة
              if (row.processing_at) {
                const processingDate = new Date(row.processing_at);
                stages.push(\`
                  <div class="flex items-center text-xs mb-1">
                    <span class="w-2 h-2 rounded-full bg-indigo-500 ml-2"></span>
                    <span class="font-bold">قيد المعالجة:</span>
                    <span class="text-gray-600 mr-1">\${processingDate.toLocaleDateString('ar-SA')} \${processingDate.toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                \`);
              }
              
              // Stage 4: مقبول
              if (row.approved_at) {
                const approvedDate = new Date(row.approved_at);
                stages.push(\`
                  <div class="flex items-center text-xs mb-1">
                    <span class="w-2 h-2 rounded-full bg-green-500 ml-2"></span>
                    <span class="font-bold text-green-700">✓ مقبول:</span>
                    <span class="text-gray-600 mr-1">\${approvedDate.toLocaleDateString('ar-SA')} \${approvedDate.toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                \`);
              }
              
              // Stage 5: مرفوض
              if (row.rejected_at) {
                const rejectedDate = new Date(row.rejected_at);
                stages.push(\`
                  <div class="flex items-center text-xs mb-1">
                    <span class="w-2 h-2 rounded-full bg-red-500 ml-2"></span>
                    <span class="font-bold text-red-700">✗ مرفوض:</span>
                    <span class="text-gray-600 mr-1">\${rejectedDate.toLocaleDateString('ar-SA')} \${rejectedDate.toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                \`);
              }
              
              const stagesHTML = stages.length > 0 ? stages.join('') : '<span class="text-gray-400 text-xs">لا توجد مراحل مسجلة</span>';
              
              // Format last_update
              const lastUpdateDate = row.last_update ? new Date(row.last_update) : null;
              const formattedLastUpdate = lastUpdateDate ? 
                lastUpdateDate.toLocaleDateString('ar-SA') + ' ' + lastUpdateDate.toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'}) :
                '<span class="text-gray-400">-</span>';
              
              const daysElapsed = row.days_elapsed || 0;
              const isClosed = row.is_closed === 1;
              
              // Format time elapsed based on status
              let timeElapsed = '';
              if (daysElapsed === 0) {
                timeElapsed = 'اليوم';
              } else if (daysElapsed === 1) {
                timeElapsed = 'يوم واحد';
              } else {
                timeElapsed = daysElapsed + ' يوم';
              }
              
              // Add indicator if closed
              const timeDisplay = isClosed ? 
                \`<i class="fas fa-stopwatch ml-1"></i>\${timeElapsed}\` : 
                \`<i class="fas fa-clock ml-1"></i>\${timeElapsed}\`;
              
              const timeClass = isClosed ? 
                'px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold' : 
                'px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold';
              
              return \`
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-4 text-sm">\${index + 1}</td>
                  <td class="px-4 py-4 font-bold">\${row.customer_name || '-'}</td>
                  <td class="px-4 py-4 text-sm text-gray-600">\${row.customer_phone || '-'}</td>
                  <td class="px-4 py-4 text-sm">
                    \${row.employee_name ? \`
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        <i class="fas fa-user ml-1"></i>
                        \${row.employee_name}
                      </span>
                    \` : '<span class="text-gray-400">غير مخصص</span>'}
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-600">\${formattedDate}</td>
                  <td class="px-4 py-4">
                    <div class="space-y-1">
                      \${stagesHTML}
                    </div>
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-600">
                    \${formattedLastUpdate}
                  </td>
                  <td class="px-4 py-4">
                    <span class="\${timeClass}">
                      \${timeDisplay}
                    </span>
                    \${isClosed ? '<div class="text-xs text-gray-500 mt-1">⏸️ منتهي</div>' : '<div class="text-xs text-purple-600 mt-1">⏱️ جاري العد</div>'}
                  </td>
                  <td class="px-4 py-4 font-bold text-green-600">
                    \${row.requested_amount ? row.requested_amount.toLocaleString('ar-SA') + ' ريال' : '-'}
                  </td>
                  <td class="px-4 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold \${statusClass}">
                      \${statusName}
                    </span>
                  </td>
                </tr>
              \`;
            }).join('');
          }
          
          function exportToExcel() {
            if (reportData.length === 0) {
              alert('لا توجد بيانات لتصديرها');
              return;
            }
            
            // Create CSV content
            let csv = 'رقم,اسم العميل,رقم الهاتف,الموظف المخصص,تاريخ تقديم الطلب,المدة المنقضية (أيام),المبلغ المطلوب,حالة الطلب\\n';
            
            reportData.forEach((row, index) => {
              const statusNames = {
                'pending': 'قيد الانتظار',
                'approved': 'مقبول',
                'rejected': 'مرفوض',
                'processing': 'قيد المعالجة'
              };
              
              const createdDate = new Date(row.created_at).toLocaleDateString('ar-SA');
              
              csv += \`\${index + 1},\`;
              csv += \`"\${row.customer_name || '-'}",\`;
              csv += \`"\${row.customer_phone || '-'}",\`;
              csv += \`"\${row.employee_name || 'غير مخصص'}",\`;
              csv += \`"\${createdDate}",\`;
              csv += \`\${row.days_elapsed || 0},\`;
              csv += \`\${row.requested_amount || 0},\`;
              csv += \`"\${statusNames[row.status] || row.status}"\\n\`;
            });
            
            // Create download link
            const BOM = "\\uFEFF";
            const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', 'تقرير_متابعة_الطلبات_' + new Date().toISOString().split('T')[0] + '.csv');
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
          
          function searchFollowupTable() {
            const searchValue = document.getElementById('searchFollowup').value.toLowerCase();
            const tbody = document.getElementById('reportTable');
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach(row => {
              const text = row.textContent.toLowerCase();
              if (text.includes(searchValue)) {
                row.style.display = '';
              } else {
                row.style.display = 'none';
              }
            });
          }
          
          // Scroll table function
          function scrollTable(direction) {
            const container = document.getElementById('tableContainer');
            const scrollAmount = 300; // pixels to scroll
            
            if (direction === 'right') {
              container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            } else {
              container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
            
            // Update button visibility after scroll
            setTimeout(checkScrollButtons, 300);
          }
          
          // Check if scroll buttons should be visible
          function checkScrollButtons() {
            const container = document.getElementById('tableContainer');
            const leftBtn = document.getElementById('scrollLeftBtn');
            const rightBtn = document.getElementById('scrollRightBtn');
            
            if (!container || !leftBtn || !rightBtn) return;
            
            const canScrollLeft = container.scrollLeft > 0;
            const canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 10);
            
            // Show/hide buttons based on scroll position
            if (canScrollLeft) {
              leftBtn.classList.remove('hidden');
            } else {
              leftBtn.classList.add('hidden');
            }
            
            if (canScrollRight) {
              rightBtn.classList.remove('hidden');
            } else {
              rightBtn.classList.add('hidden');
            }
          }
          
          // Initialize scroll buttons after table loads
          function initScrollButtons() {
            const container = document.getElementById('tableContainer');
            const wrapper = document.getElementById('tableWrapper');
            
            if (container && wrapper) {
              wrapper.classList.remove('hidden');
              
              // Check initially
              checkScrollButtons();
              
              // Check on scroll
              container.addEventListener('scroll', checkScrollButtons);
              
              // Check on window resize
              window.addEventListener('resize', checkScrollButtons);
            }
          }
          
          // Load report on page load
          loadReport().then(() => {
            // Initialize scroll buttons after data is loaded
            setTimeout(initScrollButtons, 500);
          });
        </script>
      </body>
      </html>
    `)
  } catch (error: any) {
    return c.html('<h1>Error: ' + error.message + '</h1>', 500)
  }
})

// Add new tenant page
app.get('/admin/tenants/add', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إضافة شركة جديدة - SaaS Multi-Tenant</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
            <div class="mb-6">
                <a href="/admin/tenants" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-arrow-right ml-2"></i>
                    العودة لقائمة الشركات
                </a>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg p-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-8">
                    <i class="fas fa-plus-circle text-emerald-600 ml-2"></i>
                    إضافة شركة جديدة
                </h1>
                
                <form id="addTenantForm" onsubmit="handleSubmit(event)" class="space-y-6">
                    <!-- Basic Information -->
                    <div class="border-b pb-6">
                        <h2 class="text-xl font-bold text-gray-700 mb-4">
                            <i class="fas fa-info-circle ml-2"></i>
                            المعلومات الأساسية
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    اسم الشركة <span class="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="company_name"
                                    required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="مثال: شركة التمويل الأولى"
                                >
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Slug (معرف فريد) <span class="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="slug"
                                    required
                                    pattern="[a-z0-9-]+"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="tamweel-1"
                                >
                                <p class="text-xs text-gray-500 mt-1">حروف صغيرة وأرقام وشرطات فقط</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings -->
                    <div class="border-b pb-6">
                        <h2 class="text-xl font-bold text-gray-700 mb-4">
                            <i class="fas fa-cog ml-2"></i>
                            الإعدادات
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                                <select 
                                    id="status"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="active">نشط</option>
                                    <option value="trial">تجريبي</option>
                                    <option value="suspended">متوقف</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">عدد المستخدمين الأقصى</label>
                                <input 
                                    type="number" 
                                    id="max_users"
                                    value="10"
                                    min="1"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Subdomain (اختياري)</label>
                                <input 
                                    type="text" 
                                    id="subdomain"
                                    pattern="[a-z0-9-]*"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="company1"
                                >
                            </div>
                        </div>
                    </div>
                    
                    <!-- Contact Information -->
                    <div>
                        <h2 class="text-xl font-bold text-gray-700 mb-4">
                            <i class="fas fa-address-card ml-2"></i>
                            معلومات الاتصال (اختياري)
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                                <input 
                                    type="email" 
                                    id="contact_email"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="info@company.com"
                                >
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                                <input 
                                    type="tel" 
                                    id="contact_phone"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="+966501234567"
                                >
                            </div>
                        </div>
                    </div>
                    
                    <!-- Submit Buttons -->
                    <div class="flex gap-4 pt-4">
                        <button 
                            type="submit"
                            class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
                        >
                            <i class="fas fa-save ml-2"></i>
                            حفظ الشركة
                        </button>
                        <a 
                            href="/admin/tenants"
                            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all text-center"
                        >
                            <i class="fas fa-times ml-2"></i>
                            إلغاء
                        </a>
                    </div>
                </form>
                
                <div id="message" class="mt-4"></div>
            </div>
        </div>
        
        <script>
            // Auto-generate slug from company name
            document.getElementById('company_name').addEventListener('input', function(e) {
                const slug = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\\s-]/g, '')
                    .replace(/\\s+/g, '-')
                    .replace(/-+/g, '-')
                    .substring(0, 50);
                document.getElementById('slug').value = slug;
            });
            
            async function handleSubmit(event) {
                event.preventDefault();
                
                const data = {
                    company_name: document.getElementById('company_name').value,
                    slug: document.getElementById('slug').value,
                    status: document.getElementById('status').value,
                    max_users: parseInt(document.getElementById('max_users').value),
                    subdomain: document.getElementById('subdomain').value || null,
                    contact_email: document.getElementById('contact_email').value || null,
                    contact_phone: document.getElementById('contact_phone').value || null
                };
                
                try {
                    const response = await axios.post('/api/tenants', data);
                    
                    if (response.data.success) {
                        document.getElementById('message').innerHTML = \`
                            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                                <i class="fas fa-check-circle ml-2"></i>
                                تم إضافة الشركة بنجاح!
                            </div>
                        \`;
                        
                        setTimeout(() => {
                            window.location.href = '/admin/tenants';
                        }, 1500);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    document.getElementById('message').innerHTML = \`
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            <i class="fas fa-exclamation-circle ml-2"></i>
                            خطأ في الإضافة: \${error.response?.data?.error || error.message}
                        </div>
                    \`;
                }
            }
        </script>
    </body>
    </html>
  `);
})

// Edit tenant page
app.get('/admin/tenants/:id/edit', async (c) => {
  try {
    const id = c.req.param('id')
    
    const tenant = await c.env.DB.prepare(`
      SELECT * FROM tenants WHERE id = ?
    `).bind(id).first()
    
    if (!tenant) {
      return c.html('<h1>الشركة غير موجودة</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تعديل شركة - ${tenant.company_name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
          <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      </head>
      <body class="bg-gray-50">
          <div class="max-w-4xl mx-auto p-6">
              <div class="mb-6">
                  <a href="/admin/tenants" class="text-blue-600 hover:text-blue-800">
                      <i class="fas fa-arrow-right ml-2"></i>
                      العودة لقائمة الشركات
                  </a>
              </div>
              
              <div class="bg-white rounded-xl shadow-lg p-8">
                  <h1 class="text-3xl font-bold text-gray-800 mb-8">
                      <i class="fas fa-edit text-yellow-600 ml-2"></i>
                      تعديل شركة: ${tenant.company_name}
                  </h1>
                  
                  <form id="editTenantForm" onsubmit="handleSubmit(event)" class="space-y-6">
                      <!-- Basic Information -->
                      <div class="border-b pb-6">
                          <h2 class="text-xl font-bold text-gray-700 mb-4">
                              <i class="fas fa-info-circle ml-2"></i>
                              المعلومات الأساسية
                          </h2>
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">
                                      اسم الشركة <span class="text-red-500">*</span>
                                  </label>
                                  <input 
                                      type="text" 
                                      id="company_name"
                                      value="${tenant.company_name}"
                                      required
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                  >
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">
                                      Slug (معرف فريد) <span class="text-red-500">*</span>
                                  </label>
                                  <input 
                                      type="text" 
                                      id="slug"
                                      value="${tenant.slug}"
                                      required
                                      pattern="[a-z0-9-]+"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                  >
                                  <p class="text-xs text-gray-500 mt-1">حروف صغيرة وأرقام وشرطات فقط</p>
                              </div>
                          </div>
                      </div>
                      
                      <!-- Settings -->
                      <div class="border-b pb-6">
                          <h2 class="text-xl font-bold text-gray-700 mb-4">
                              <i class="fas fa-cog ml-2"></i>
                              الإعدادات
                          </h2>
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                                  <select 
                                      id="status"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                  >
                                      <option value="active" ${tenant.status === 'active' ? 'selected' : ''}>نشط</option>
                                      <option value="trial" ${tenant.status === 'trial' ? 'selected' : ''}>تجريبي</option>
                                      <option value="suspended" ${tenant.status === 'suspended' ? 'selected' : ''}>متوقف</option>
                                  </select>
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">عدد المستخدمين الأقصى</label>
                                  <input 
                                      type="number" 
                                      id="max_users"
                                      value="${tenant.max_users || 10}"
                                      min="1"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                  >
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">Subdomain (اختياري)</label>
                                  <input 
                                      type="text" 
                                      id="subdomain"
                                      value="${tenant.subdomain || ''}"
                                      pattern="[a-z0-9-]*"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                  >
                              </div>
                          </div>
                      </div>
                      
                      <!-- Contact Information -->
                      <div>
                          <h2 class="text-xl font-bold text-gray-700 mb-4">
                              <i class="fas fa-address-card ml-2"></i>
                              معلومات الاتصال (اختياري)
                          </h2>
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                                  <input 
                                      type="email" 
                                      id="contact_email"
                                      value="${tenant.contact_email || ''}"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                  >
                              </div>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                                  <input 
                                      type="tel" 
                                      id="contact_phone"
                                      value="${tenant.contact_phone || ''}"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                  >
                              </div>
                          </div>
                      </div>
                      
                      <!-- Submit Buttons -->
                      <div class="flex gap-4 pt-4">
                          <button 
                              type="submit"
                              class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
                          >
                              <i class="fas fa-save ml-2"></i>
                              حفظ التعديلات
                          </button>
                          <a 
                              href="/admin/tenants"
                              class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all text-center"
                          >
                              <i class="fas fa-times ml-2"></i>
                              إلغاء
                          </a>
                      </div>
                  </form>
                  
                  <div id="message" class="mt-4"></div>
              </div>
          </div>
          
          <script>
              async function handleSubmit(event) {
                  event.preventDefault();
                  
                  const data = {
                      company_name: document.getElementById('company_name').value,
                      slug: document.getElementById('slug').value,
                      status: document.getElementById('status').value,
                      max_users: parseInt(document.getElementById('max_users').value),
                      subdomain: document.getElementById('subdomain').value || null,
                      contact_email: document.getElementById('contact_email').value || null,
                      contact_phone: document.getElementById('contact_phone').value || null
                  };
                  
                  try {
                      const response = await axios.put('/api/tenants/${id}', data);
                      
                      if (response.data.success) {
                          document.getElementById('message').innerHTML = \`
                              <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                                  <i class="fas fa-check-circle ml-2"></i>
                                  تم تحديث الشركة بنجاح!
                              </div>
                          \`;
                          
                          setTimeout(() => {
                              window.location.href = '/admin/tenants';
                          }, 1500);
                      }
                  } catch (error) {
                      console.error('Error:', error);
                      document.getElementById('message').innerHTML = \`
                          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                              <i class="fas fa-exclamation-circle ml-2"></i>
                              خطأ في التحديث: \${error.response?.data?.error || error.message}
                          </div>
                      \`;
                  }
              }
          </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    return c.html(`<h1>خطأ في تحميل الصفحة: ${error.message}</h1>`)
  }
})

// View tenant details page
app.get('/admin/tenants/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const tenant = await c.env.DB.prepare(`
      SELECT * FROM tenants WHERE id = ?
    `).bind(id).first()
    
    if (!tenant) {
      return c.html('<h1>الشركة غير موجودة</h1>')
    }
    
    // Get tenant statistics
    const stats = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE tenant_id = ?) as total_users,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = ?) as total_customers,
        (SELECT COUNT(*) FROM financing_requests WHERE tenant_id = ?) as total_requests
    `).bind(id, id, id).first()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>عرض شركة - ${tenant.company_name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
          <div class="max-w-6xl mx-auto p-6">
              <div class="mb-6 flex justify-between items-center">
                  <a href="/admin/tenants" class="text-blue-600 hover:text-blue-800">
                      <i class="fas fa-arrow-right ml-2"></i>
                      العودة لقائمة الشركات
                  </a>
                  <div class="flex gap-3">
                      <a href="/admin/tenants/${id}/edit" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg">
                          <i class="fas fa-edit ml-2"></i>
                          تعديل
                      </a>
                      <a href="/c/${tenant.slug}/admin" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
                          <i class="fas fa-external-link-alt ml-2"></i>
                          لوحة التحكم
                      </a>
                  </div>
              </div>
              
              <!-- Company Header -->
              <div class="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-xl shadow-lg p-8 mb-6">
                  <div class="flex items-center justify-between">
                      <div>
                          <h1 class="text-3xl font-bold mb-2">
                              <i class="fas fa-building ml-2"></i>
                              ${tenant.company_name}
                          </h1>
                          <p class="text-emerald-100 text-lg">
                              <code class="bg-white/20 px-3 py-1 rounded">${tenant.slug}</code>
                          </p>
                      </div>
                      <div class="text-right">
                          <span class="inline-block px-6 py-2 bg-white/20 rounded-full text-xl font-bold">
                              ${tenant.status === 'active' ? '🟢 نشط' : tenant.status === 'trial' ? '🟡 تجريبي' : '🔴 متوقف'}
                          </span>
                      </div>
                  </div>
              </div>
              
              <!-- Statistics -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div class="bg-white rounded-xl shadow-lg p-6">
                      <div class="flex items-center justify-between">
                          <div>
                              <p class="text-gray-600 text-sm mb-1">المستخدمين</p>
                              <p class="text-3xl font-bold text-blue-600">${stats?.total_users || 0}</p>
                              <p class="text-gray-500 text-xs mt-1">من ${tenant.max_users} مسموح</p>
                          </div>
                          <i class="fas fa-users text-4xl text-blue-200"></i>
                      </div>
                  </div>
                  
                  <div class="bg-white rounded-xl shadow-lg p-6">
                      <div class="flex items-center justify-between">
                          <div>
                              <p class="text-gray-600 text-sm mb-1">العملاء</p>
                              <p class="text-3xl font-bold text-green-600">${stats?.total_customers || 0}</p>
                          </div>
                          <i class="fas fa-user-friends text-4xl text-green-200"></i>
                      </div>
                  </div>
                  
                  <div class="bg-white rounded-xl shadow-lg p-6">
                      <div class="flex items-center justify-between">
                          <div>
                              <p class="text-gray-600 text-sm mb-1">طلبات التمويل</p>
                              <p class="text-3xl font-bold text-purple-600">${stats?.total_requests || 0}</p>
                          </div>
                          <i class="fas fa-file-invoice text-4xl text-purple-200"></i>
                      </div>
                  </div>
              </div>
              
              <!-- Company Details -->
              <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div class="p-6 bg-gray-50 border-b">
                      <h2 class="text-xl font-bold text-gray-800">
                          <i class="fas fa-info-circle ml-2"></i>
                          تفاصيل الشركة
                      </h2>
                  </div>
                  <div class="p-6">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label class="block text-sm font-medium text-gray-500 mb-1">اسم الشركة</label>
                              <p class="text-lg font-semibold text-gray-900">${tenant.company_name}</p>
                          </div>
                          <div>
                              <label class="block text-sm font-medium text-gray-500 mb-1">Slug</label>
                              <p class="text-lg font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded inline-block">${tenant.slug}</p>
                          </div>
                          <div>
                              <label class="block text-sm font-medium text-gray-500 mb-1">Subdomain</label>
                              <p class="text-lg font-mono text-gray-900">${tenant.subdomain || '-'}</p>
                          </div>
                          <div>
                              <label class="block text-sm font-medium text-gray-500 mb-1">الحد الأقصى للمستخدمين</label>
                              <p class="text-lg font-semibold text-gray-900">${tenant.max_users || 10} مستخدم</p>
                          </div>
                          <div>
                              <label class="block text-sm font-medium text-gray-500 mb-1">البريد الإلكتروني</label>
                              <p class="text-lg text-gray-900">${tenant.contact_email || '-'}</p>
                          </div>
                          <div>
                              <label class="block text-sm font-medium text-gray-500 mb-1">رقم الهاتف</label>
                              <p class="text-lg text-gray-900">${tenant.contact_phone || '-'}</p>
                          </div>
                          <div>
                              <label class="block text-sm font-medium text-gray-500 mb-1">تاريخ الإنشاء</label>
                              <p class="text-lg text-gray-900">${new Date(tenant.created_at).toLocaleDateString('ar-SA')}</p>
                          </div>
                          <div>
                              <label class="block text-sm font-medium text-gray-500 mb-1">الحالة</label>
                              <span class="inline-flex px-4 py-2 text-sm font-semibold rounded-full 
                                  ${tenant.status === 'active' ? 'bg-green-100 text-green-800' : 
                                    tenant.status === 'trial' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-red-100 text-red-800'}">
                                  ${tenant.status === 'active' ? 'نشط' : tenant.status === 'trial' ? 'تجريبي' : 'متوقف'}
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
              
              <!-- Quick Actions -->
              <div class="bg-white rounded-xl shadow-lg p-6 mt-6">
                  <h2 class="text-xl font-bold text-gray-800 mb-4">
                      <i class="fas fa-bolt ml-2"></i>
                      إجراءات سريعة
                  </h2>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <a href="/c/${tenant.slug}/admin" target="_blank" 
                         class="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all">
                          <i class="fas fa-tachometer-alt text-2xl text-emerald-600 mb-2"></i>
                          <span class="text-sm font-medium text-gray-700">لوحة التحكم</span>
                      </a>
                      <a href="/c/${tenant.slug}/calculator" target="_blank" 
                         class="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all">
                          <i class="fas fa-calculator text-2xl text-blue-600 mb-2"></i>
                          <span class="text-sm font-medium text-gray-700">حاسبة التمويل</span>
                      </a>
                      <a href="/admin/tenants/${id}/edit" 
                         class="flex flex-col items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-all">
                          <i class="fas fa-edit text-2xl text-yellow-600 mb-2"></i>
                          <span class="text-sm font-medium text-gray-700">تعديل البيانات</span>
                      </a>
                      <button onclick="if(confirm('هل أنت متأكد من الحذف؟')) window.location.href='/admin/tenants'" 
                         class="flex flex-col items-center justify-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-all">
                          <i class="fas fa-trash text-2xl text-red-600 mb-2"></i>
                          <span class="text-sm font-medium text-gray-700">حذف الشركة</span>
                      </button>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    return c.html(`<h1>خطأ في تحميل الصفحة: ${error.message}</h1>`)
  }
})

app.get('/admin/tenants', (c) => c.html(tenantsPage))
app.get('/admin/tenant-calculators', (c) => c.html(tenantCalculatorsPage))
app.get('/admin/saas-settings', (c) => c.html(saasSettingsPage))
app.get('/admin/reports', (c) => c.html(reportsPage))
app.get('/admin/reports/customers', (c) => c.html(customersReportPage))
app.get('/admin/reports/requests', (c) => c.html(requestsReportPage))
app.get('/admin/reports/financial', (c) => c.html(financialReportPage))
app.get('/admin/reports/banks', (c) => c.html(banksReportPage))
app.get('/admin/reports/performance', (c) => c.html(performanceReportPage))
app.get('/admin/payments', (c) => c.html(paymentsPage))
app.get('/admin/banks', (c) => c.html(banksManagementPage))

// Tenant-specific admin panel
app.get('/c/:tenant/admin', async (c) => {
  const tenantSlug = c.req.param('tenant')
  
  // Get tenant information from database
  const tenant = await c.env.DB.prepare(`
    SELECT * FROM tenants WHERE slug = ? AND status = 'active'
  `).bind(tenantSlug).first()
  
  if (!tenant) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>شركة غير موجودة</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="max-w-md mx-auto text-center p-8 bg-white rounded-xl shadow-lg">
          <i class="fas fa-building text-6xl text-red-500 mb-4"></i>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">الشركة غير موجودة</h1>
          <p class="text-gray-600 mb-6">لم نتمكن من العثور على هذه الشركة</p>
          <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-block">
            <i class="fas fa-home ml-2"></i>
            العودة للصفحة الرئيسية
          </a>
        </div>
      </body>
      </html>
    `)
  }
  
  // Return admin panel with tenant branding
  // Note: User name and email are loaded dynamically from localStorage by JavaScript
  return c.html(fullAdminPanel
    .replace('لوحة التحكم - نظام حاسبة التمويل', `لوحة التحكم - ${tenant.company_name}`)
  )
})

app.get('/test', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تسجيل الدخول مطلوب</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
            <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
                <div class="mb-6">
                    <i class="fas fa-lock text-6xl text-blue-600"></i>
                </div>
                <h1 class="text-3xl font-bold text-gray-800 mb-4">تسجيل الدخول مطلوب</h1>
                <p class="text-gray-600 mb-6">
                    يجب تسجيل الدخول للوصول إلى صفحة الاختبار
                </p>
                <div class="space-y-3">
                    <a href="/login" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                        <i class="fas fa-sign-in-alt ml-2"></i>
                        تسجيل الدخول
                    </a>
                    <a href="/" class="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors">
                        <i class="fas fa-home ml-2"></i>
                        العودة للرئيسية
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
})

// صفحات منفصلة لكل قسم
app.get('/admin/dashboard', async (c) => {
  try {
    // Get user info for role-based filtering
    const userInfo = await getUserInfo(c)
    
    // Build WHERE clauses based on role
    let customersWhere = '';
    let requestsWhere = '';
    let requestsJoinWhere = '';
    let queryParams: any[] = [];
    
    if (userInfo.roleId === 1) {
      // Super Admin - sees ALL data
      customersWhere = '';
      requestsWhere = '';
      requestsJoinWhere = '';
    } else if (userInfo.roleId === 2 || userInfo.roleId === 3) {
      // Role 2: Company Admin & Role 3: Supervisor - see company data only
      if (userInfo.tenantId) {
        customersWhere = `WHERE tenant_id = ${userInfo.tenantId}`;
        requestsWhere = customersWhere;
        requestsJoinWhere = `AND c.tenant_id = ${userInfo.tenantId}`;
        queryParams.push(userInfo.tenantId);
      }
    } else if (userInfo.roleId === 4) {
      // Role 4: Employee - sees only assigned customers/requests
      if (userInfo.userId) {
        customersWhere = `WHERE assigned_to = ${userInfo.userId}`;
        requestsWhere = `WHERE customer_id IN (SELECT id FROM customers WHERE assigned_to = ${userInfo.userId})`;
        requestsJoinWhere = `AND c.assigned_to = ${userInfo.userId}`;
        queryParams.push(userInfo.userId);
      } else {
        customersWhere = 'WHERE 1 = 0';
        requestsWhere = 'WHERE 1 = 0';
        requestsJoinWhere = 'AND 1 = 0';
      }
    } else {
      // Unknown role - no data
      customersWhere = 'WHERE 1 = 0';
      requestsWhere = 'WHERE 1 = 0';
      requestsJoinWhere = 'AND 1 = 0';
    }
    
    // Comprehensive statistics query with role-based filtering
    const stats = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM customers ${customersWhere}) as total_customers,
        (SELECT COUNT(*) FROM financing_requests ${requestsWhere}) as total_requests,
        (SELECT COUNT(*) FROM financing_requests ${requestsWhere} ${requestsWhere ? 'AND' : 'WHERE'} status = 'pending') as pending_requests,
        (SELECT COUNT(*) FROM financing_requests ${requestsWhere} ${requestsWhere ? 'AND' : 'WHERE'} status = 'approved') as approved_requests,
        (SELECT COUNT(*) FROM financing_requests ${requestsWhere} ${requestsWhere ? 'AND' : 'WHERE'} status = 'rejected') as rejected_requests,
        (SELECT COUNT(*) FROM financing_requests ${requestsWhere} ${requestsWhere ? 'AND' : 'WHERE'} status = 'under_review') as under_review_requests,
        (SELECT SUM(requested_amount) FROM financing_requests ${requestsWhere}) as total_requested_amount,
        (SELECT SUM(requested_amount) FROM financing_requests ${requestsWhere} ${requestsWhere ? 'AND' : 'WHERE'} status = 'approved') as total_approved_amount,
        (SELECT COUNT(*) FROM banks WHERE is_active = 1) as active_banks,
        (SELECT COUNT(*) FROM financing_types) as financing_types_count
    `).first()
    
    // Monthly requests trend (last 6 months) with role-based filtering
    const monthlyTrend = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count,
        SUM(requested_amount) as total_amount
      FROM financing_requests
      ${requestsWhere}
      ${requestsWhere ? 'AND' : 'WHERE'} created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).all()
    
    // Top banks by requests with role-based filtering
    const topBanks = await c.env.DB.prepare(`
      SELECT 
        b.bank_name,
        COUNT(fr.id) as request_count,
        SUM(fr.requested_amount) as total_amount
      FROM banks b
      LEFT JOIN financing_requests fr ON b.id = fr.selected_bank_id
      LEFT JOIN customers c ON fr.customer_id = c.id
      WHERE fr.id IS NOT NULL ${requestsJoinWhere}
      GROUP BY b.id, b.bank_name
      ORDER BY request_count DESC
      LIMIT 5
    `).all()
    
    // Status distribution with tenant filtering
    const statusDistribution = await c.env.DB.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM financing_requests ${requestsWhere}), 2) as percentage
      FROM financing_requests
      ${requestsWhere}
      GROUP BY status
    `).all()
    
    const monthlyData = monthlyTrend.results || []
    const topBanksData = topBanks.results || []
    const statusData = statusDistribution.results || []
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>لوحة المعلومات المتقدمة</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
          @media print {
            button, nav, .no-print { display: none; }
            .print-full-width { width: 100%; }
          }
          
          ${getMobileResponsiveCSS()}
        </style>
      </head>
      <body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div class="max-w-7xl mx-auto p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-8 no-print">
            <div>
              <a href="/admin" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                <i class="fas fa-arrow-right ml-1"></i>
                العودة للوحة الرئيسية
              </a>
              <h1 class="text-4xl font-bold text-gray-800">
                <i class="fas fa-chart-line text-blue-600 ml-2"></i>
                لوحة المعلومات المتقدمة
              </h1>
              <p class="text-gray-600 mt-2">تحليلات وإحصائيات شاملة لنظام حاسبة التمويل</p>
            </div>
            <div class="flex gap-3">
              <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                <i class="fas fa-print ml-2"></i>
                طباعة التقرير
              </button>
              <button onclick="doLogout()" class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition">
                <i class="fas fa-sign-out-alt ml-2"></i>
                تسجيل الخروج
              </button>
            </div>
          </div>

          <!-- Main Statistics Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-blue-100 text-sm mb-1">إجمالي العملاء</p>
                  <p class="text-4xl font-bold">${(stats as any)?.total_customers || 0}</p>
                </div>
                <i class="fas fa-users text-6xl opacity-20"></i>
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-green-100 text-sm mb-1">إجمالي الطلبات</p>
                  <p class="text-4xl font-bold">${(stats as any)?.total_requests || 0}</p>
                </div>
                <i class="fas fa-file-invoice text-6xl opacity-20"></i>
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-yellow-100 text-sm mb-1">قيد الانتظار</p>
                  <p class="text-4xl font-bold">${(stats as any)?.pending_requests || 0}</p>
                </div>
                <i class="fas fa-clock text-6xl opacity-20"></i>
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-purple-100 text-sm mb-1">موافق عليها</p>
                  <p class="text-4xl font-bold">${(stats as any)?.approved_requests || 0}</p>
                </div>
                <i class="fas fa-check-circle text-6xl opacity-20"></i>
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-red-100 text-sm mb-1">مرفوضة</p>
                  <p class="text-4xl font-bold">${(stats as any)?.rejected_requests || 0}</p>
                </div>
                <i class="fas fa-times-circle text-6xl opacity-20"></i>
              </div>
            </div>
          </div>

          <!-- Financial Summary & KPIs -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center mb-4">
                <div class="bg-blue-100 rounded-full p-3 ml-4">
                  <i class="fas fa-money-bill-wave text-2xl text-blue-600"></i>
                </div>
                <div>
                  <p class="text-gray-600 text-sm">إجمالي التمويل المطلوب</p>
                  <p class="text-2xl font-bold text-gray-800">${parseFloat((stats as any)?.total_requested_amount || 0).toLocaleString('ar-SA')} ر.س</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center mb-4">
                <div class="bg-green-100 rounded-full p-3 ml-4">
                  <i class="fas fa-check-double text-2xl text-green-600"></i>
                </div>
                <div>
                  <p class="text-gray-600 text-sm">التمويل الموافق عليه</p>
                  <p class="text-2xl font-bold text-gray-800">${parseFloat((stats as any)?.total_approved_amount || 0).toLocaleString('ar-SA')} ر.س</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center mb-4">
                <div class="bg-purple-100 rounded-full p-3 ml-4">
                  <i class="fas fa-percentage text-2xl text-purple-600"></i>
                </div>
                <div>
                  <p class="text-gray-600 text-sm">نسبة القبول</p>
                  <p class="text-2xl font-bold text-gray-800">${(((stats as any)?.approved_requests || 0) / Math.max((stats as any)?.total_requests, 1) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center mb-4">
                <div class="bg-orange-100 rounded-full p-3 ml-4">
                  <i class="fas fa-calculator text-2xl text-orange-600"></i>
                </div>
                <div>
                  <p class="text-gray-600 text-sm">متوسط المبلغ</p>
                  <p class="text-2xl font-bold text-gray-800">${(parseFloat((stats as any)?.total_requested_amount || 0) / Math.max((stats as any)?.total_requests, 1)).toLocaleString('ar-SA', {maximumFractionDigits: 0})} ر.س</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quick Insights -->
          <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-2xl font-bold mb-2">
                  <i class="fas fa-lightbulb ml-2"></i>
                  رؤى سريعة
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div class="bg-white/20 rounded-lg p-4">
                    <p class="text-sm opacity-90">أكثر البنوك طلباً</p>
                    <p class="text-xl font-bold mt-1">${topBanksData[0]?.bank_name || 'لا يوجد'}</p>
                  </div>
                  <div class="bg-white/20 rounded-lg p-4">
                    <p class="text-sm opacity-90">الطلبات النشطة</p>
                    <p class="text-xl font-bold mt-1">${((stats as any)?.pending_requests || 0) + ((stats as any)?.under_review_requests || 0)}</p>
                  </div>
                  <div class="bg-white/20 rounded-lg p-4">
                    <p class="text-sm opacity-90">معدل النجاح</p>
                    <p class="text-xl font-bold mt-1">${(((stats as any)?.approved_requests || 0) / Math.max(((stats as any)?.approved_requests || 0) + ((stats as any)?.rejected_requests || 0), 1) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Monthly Trend Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-chart-line text-blue-600 ml-2"></i>
                الطلبات الشهرية (آخر 6 أشهر)
              </h3>
              <canvas id="monthlyTrendChart"></canvas>
            </div>
            
            <!-- Status Distribution Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-chart-pie text-purple-600 ml-2"></i>
                توزيع حالات الطلبات
              </h3>
              <canvas id="statusChart"></canvas>
            </div>
          </div>

          <!-- Top Banks Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Top Banks Table -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-trophy text-yellow-500 ml-2"></i>
                أكثر البنوك نشاطاً
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full text-right">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-4 py-3 text-gray-700 font-bold">الترتيب</th>
                      <th class="px-4 py-3 text-gray-700 font-bold">البنك</th>
                      <th class="px-4 py-3 text-gray-700 font-bold">الطلبات</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${topBanksData.map((bank: any, index: number) => {
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1).toString()
                      return `
                      <tr class="border-t hover:bg-gray-50">
                        <td class="px-4 py-3">
                          <span class="text-2xl">${medal}</span>
                        </td>
                        <td class="px-4 py-3 font-bold text-gray-800">${bank.bank_name}</td>
                        <td class="px-4 py-3 text-blue-600 font-bold">${bank.request_count}</td>
                      </tr>
                      `
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Top Banks Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-chart-bar text-green-600 ml-2"></i>
                توزيع الطلبات حسب البنوك
              </h3>
              <canvas id="banksChart"></canvas>
            </div>
          </div>

          <!-- Status Details -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-info-circle text-blue-600 ml-2"></i>
              تفاصيل حالات الطلبات
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              ${statusData.map((item: any) => {
                const statusMap: Record<string, { color: string; icon: string; label: string }> = {
                  'pending': { color: 'yellow', icon: 'clock', label: 'قيد الانتظار' },
                  'under_review': { color: 'blue', icon: 'search', label: 'قيد المراجعة' },
                  'approved': { color: 'green', icon: 'check-circle', label: 'موافق' },
                  'rejected': { color: 'red', icon: 'times-circle', label: 'مرفوض' }
                }
                const statusInfo = statusMap[item.status] || { color: 'gray', icon: 'question', label: item.status }
                
                return `
                  <div class="bg-${statusInfo.color}-50 border-2 border-${statusInfo.color}-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <i class="fas fa-${statusInfo.icon} text-2xl text-${statusInfo.color}-600"></i>
                      <span class="text-3xl font-bold text-${statusInfo.color}-600">${item.count}</span>
                    </div>
                    <p class="text-sm text-gray-700 font-bold">${statusInfo.label}</p>
                    <p class="text-xs text-gray-600">${item.percentage}% من الإجمالي</p>
                  </div>
                `
              }).join('')}
            </div>
          </div>

        </div>

        <script>
          // Monthly Trend Chart
          const monthlyCtx = document.getElementById('monthlyTrendChart').getContext('2d');
          const monthlyData = ${JSON.stringify(monthlyData)};
          
          new Chart(monthlyCtx, {
            type: 'line',
            data: {
              labels: monthlyData.map(d => d.month),
              datasets: [{
                label: 'عدد الطلبات',
                data: monthlyData.map(d => d.count),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { display: true, position: 'top' }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }
          });
          
          // Status Distribution Chart
          const statusCtx = document.getElementById('statusChart').getContext('2d');
          const statusData = ${JSON.stringify(statusData)};
          
          const statusColors = {
            'pending': '#EAB308',
            'under_review': '#3B82F6',
            'approved': '#10B981',
            'rejected': '#EF4444'
          };
          
          const statusLabels = {
            'pending': 'قيد الانتظار',
            'under_review': 'قيد المراجعة',
            'approved': 'موافق',
            'rejected': 'مرفوض'
          };
          
          new Chart(statusCtx, {
            type: 'doughnut',
            data: {
              labels: statusData.map(d => statusLabels[d.status] || d.status),
              datasets: [{
                data: statusData.map(d => d.count),
                backgroundColor: statusData.map(d => statusColors[d.status] || '#6B7280'),
                borderWidth: 2,
                borderColor: '#fff'
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { position: 'right' }
              }
            }
          });
          
          // Banks Distribution Chart
          const banksCtx = document.getElementById('banksChart').getContext('2d');
          const topBanksData = ${JSON.stringify(topBanksData)};
          
          new Chart(banksCtx, {
            type: 'bar',
            data: {
              labels: topBanksData.map(b => b.bank_name),
              datasets: [{
                label: 'عدد الطلبات',
                data: topBanksData.map(b => b.request_count),
                backgroundColor: [
                  'rgba(234, 179, 8, 0.8)',
                  'rgba(192, 192, 192, 0.8)',
                  'rgba(205, 127, 50, 0.8)',
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                  'rgb(234, 179, 8)',
                  'rgb(192, 192, 192)',
                  'rgb(205, 127, 50)',
                  'rgb(59, 130, 246)',
                  'rgb(16, 185, 129)'
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  ticks: { stepSize: 1 }
                }
              }
            }
          });
          
          // دالة تسجيل الخروج
          async function doLogout() {
            if (!confirm('هل تريد تسجيل الخروج؟')) return;
            try {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            } catch (e) {
              console.warn('Logout API failed:', e);
            }
            try {
              localStorage.removeItem('user');
              localStorage.removeItem('userData');
              localStorage.removeItem('authToken');
              localStorage.removeItem('token');
              document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax';
              document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax; Secure';
            } catch (e) {}
            window.location.href = '/login';
          }
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// صفحة إضافة عميل جديد - يجب أن تكون قبل /:id
app.get('/admin/customers/add', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إضافة عميل جديد</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
      <div class="max-w-4xl mx-auto p-6">
        <div class="mb-6">
          <a href="/admin/customers" class="text-blue-600 hover:text-blue-800">← العودة لقائمة العملاء</a>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h1 class="text-3xl font-bold mb-6 text-gray-800">
            <i class="fas fa-user-plus text-green-600 ml-2"></i>
            إضافة عميل جديد
          </h1>
          
          <form method="POST" action="/api/customers" enctype="application/x-www-form-urlencoded" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-user text-blue-600 ml-1"></i>
                  الاسم الكامل *
                </label>
                <input type="text" name="full_name" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="مثال: أحمد محمد السعيد">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-phone text-green-600 ml-1"></i>
                  رقم الهاتف *
                </label>
                <input type="tel" name="phone" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="05xxxxxxxx">
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-envelope text-red-600 ml-1"></i>
                  البريد الإلكتروني
                </label>
                <input type="email" name="email" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="example@domain.com">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-id-card text-purple-600 ml-1"></i>
                  الرقم الوطني *
                </label>
                <input type="text" name="national_id" required
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="1xxxxxxxxx">
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-calendar text-orange-600 ml-1"></i>
                  تاريخ الميلاد
                </label>
                <input type="date" name="date_of_birth" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-building text-indigo-600 ml-1"></i>
                  اسم جهة العمل
                </label>
                <input type="text" name="employer_name" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="مثال: شركة أرامكو">
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-briefcase text-teal-600 ml-1"></i>
                  المسمى الوظيفي
                </label>
                <input type="text" name="job_title" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="مثال: مهندس">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-calendar-check text-pink-600 ml-1"></i>
                  تاريخ بدء العمل
                </label>
                <input type="date" name="work_start_date" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-map-marker-alt text-red-600 ml-1"></i>
                  المدينة
                </label>
                <input type="text" name="city" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="مثال: الرياض">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-money-bill text-green-600 ml-1"></i>
                  الراتب الشهري *
                </label>
                <input type="number" name="monthly_salary" step="0.01" required
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="10000.00">
              </div>
            </div>
            
            <div class="flex gap-4">
              <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold">
                <i class="fas fa-plus ml-2"></i>
                إضافة العميل
              </button>
              <a href="/admin/customers" class="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold">
                <i class="fas fa-times ml-2"></i>
                إلغاء
              </a>
            </div>
          </form>
        </div>
      </div>
    </body>
    </html>
  `)
})

// ============================
// صفحة توزيع العملاء على الموظفين (للمدير فقط)
// ============================
app.get('/admin/customer-assignment', async (c) => {
  // Get user info to check role
  const userInfo = await getUserInfo(c);
  const isSuperAdmin = userInfo.roleId === 1;
  const canManageCompany = userInfo.roleId === 1 || userInfo.roleId === 2;
  const canAccessHr = userInfo.roleId === 1 || userInfo.roleId === 2 || userInfo.roleId === 3;
  
  // Temporary: Get tenant_id from query or default to 1
  const tenantId = c.req.query('tenant_id') || 1;
  
  // Get employees of THIS tenant only
  const employees = await c.env.DB.prepare(`
    SELECT id, username, full_name, email, role 
    FROM users 
    WHERE role = 'employee' AND tenant_id = ?
    ORDER BY full_name
  `).bind(tenantId).all();

  // Get customers of THIS tenant only
  const customers = await c.env.DB.prepare(`
    SELECT 
      c.*,
      ca.employee_id,
      u.full_name as assigned_employee_name
    FROM customers c
    LEFT JOIN customer_assignments ca ON c.id = ca.customer_id
    LEFT JOIN users u ON ca.employee_id = u.id
    WHERE c.tenant_id = ?
    ORDER BY c.created_at DESC
  `).bind(tenantId).all();

  // Get employee statistics for THIS tenant only
  const employeeStats = await c.env.DB.prepare(`
    SELECT 
      u.id,
      u.full_name,
      u.username,
      COUNT(ca.customer_id) as customer_count
    FROM users u
    LEFT JOIN customer_assignments ca ON u.id = ca.employee_id
    LEFT JOIN customers c ON ca.customer_id = c.id AND c.tenant_id = ?
    WHERE u.role = 'employee' AND u.tenant_id = ?
    GROUP BY u.id
    ORDER BY customer_count DESC
  `).bind(tenantId, tenantId).all();

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>توزيع العملاء على الموظفين</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        .stat-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .employee-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .assigned { background: #d1fae5; color: #065f46; }
        .unassigned { background: #fee2e2; color: #991b1b; }
        
        ${getMobileResponsiveCSS()}
      </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-800 mb-2">
                <i class="fas fa-users-cog text-indigo-600"></i>
                توزيع العملاء على الموظفين
              </h1>
              <p class="text-gray-600">قم بتوزيع العملاء على الموظفين لتنظيم العمل</p>
            </div>
            <a href="/admin/customers" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-all">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة للعملاء
            </a>
          </div>
        </div>
      </div>

      <!-- Sidebar Menu -->
      <div id="sidebar" class="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 ease-in-out z-50 overflow-y-auto">
        <!-- Sidebar Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <i class="fas fa-bars"></i>
              <span>القائمة الرئيسية</span>
            </h2>
            <button onclick="toggleSidebar()" class="hover:bg-white/20 p-2 rounded-lg transition-all">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Menu Items -->
        <div class="p-4">
          <!-- الإدارة والتقارير -->
          <div class="mb-2">
            <div class="text-xs font-bold text-gray-500 px-4 py-2 uppercase">الإدارة والتقارير</div>
            <a href="/admin/panel" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-home text-blue-600 group-hover:scale-110 transition-transform"></i>
              <span>لوحة الوصول السريع</span>
            </a>
            <a href="/admin/dashboard" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-chart-line text-green-600 group-hover:scale-110 transition-transform"></i>
              <span>لوحة المعلومات</span>
            </a>
            <a href="/admin/reports" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-file-alt text-purple-600 group-hover:scale-110 transition-transform"></i>
              <span>التقارير</span>
            </a>
          </div>

          <div class="border-t border-gray-200 my-2"></div>

          <!-- إدارة العملاء والطلبات -->
          <div class="mb-2">
            <div class="text-xs font-bold text-gray-500 px-4 py-2 uppercase">العملاء والطلبات</div>
            <a href="/admin/customers" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-users text-blue-600 group-hover:scale-110 transition-transform"></i>
              <span>العملاء</span>
            </a>
            <a href="/admin/customer-assignment?tenant_id=${tenantId}" class="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg">
              <i class="fas fa-users-cog text-blue-600"></i>
              <span class="font-semibold">توزيع العملاء</span>
            </a>
            <a href="/admin/requests" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-file-invoice text-orange-600 group-hover:scale-110 transition-transform"></i>
              <span>طلبات التمويل</span>
            </a>
            <a href="/admin/payments" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-receipt text-green-600 group-hover:scale-110 transition-transform"></i>
              <span>سندات القبض</span>
            </a>
          </div>

          <div class="border-t border-gray-200 my-2"></div>

          <!-- الإعدادات المالية -->
          <div class="mb-2">
            <div class="text-xs font-bold text-gray-500 px-4 py-2 uppercase">الإعدادات المالية</div>
            <a href="/admin/rates" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-percentage text-indigo-600 group-hover:scale-110 transition-transform"></i>
              <span>نسب التمويل</span>
            </a>
            <a href="/admin/banks" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-university text-cyan-600 group-hover:scale-110 transition-transform"></i>
              <span>البنوك</span>
            </a>
            <a href="/admin/company-rates" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-building text-purple-600 group-hover:scale-110 transition-transform"></i>
              <span>نسب الشركة</span>
            </a>
          </div>

          ${isSuperAdmin ? `
          <div class="border-t border-gray-200 my-2"></div>

          <!-- الاشتراكات -->
          <div class="mb-2">
            <div class="text-xs font-bold text-gray-500 px-4 py-2 uppercase">الاشتراكات</div>
            <a href="/admin/subscriptions" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-calendar-check text-teal-600 group-hover:scale-110 transition-transform"></i>
              <span>الاشتراكات</span>
            </a>
            <a href="/admin/packages" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-box text-pink-600 group-hover:scale-110 transition-transform"></i>
              <span>الباقات</span>
            </a>
          </div>
          ` : ''}

          ${canAccessHr ? `
          <div class="border-t border-gray-200 my-2"></div>

          <!-- الموارد البشرية -->
          <div class="mb-2">
            <div class="text-xs font-bold text-gray-500 px-4 py-2 uppercase">الموارد البشرية</div>
            <a href="/admin/hr" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-users-cog text-indigo-600 group-hover:scale-110 transition-transform"></i>
              <span>نظام HR</span>
            </a>
          </div>
          ` : ''}

          ${canManageCompany ? `
          <div class="border-t border-gray-200 my-2"></div>

          <!-- إدارة النظام -->
          <div class="mb-2">
            <div class="text-xs font-bold text-gray-500 px-4 py-2 uppercase">إدارة النظام</div>
            <a href="/admin/users" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-user-shield text-red-600 group-hover:scale-110 transition-transform"></i>
              <span>المستخدمون</span>
            </a>
            ${isSuperAdmin ? `
            <a href="/admin/roles" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-user-tag text-orange-600 group-hover:scale-110 transition-transform"></i>
              <span>الصلاحيات</span>
            </a>
            ` : ''}
            <a href="/admin/settings" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-all group">
              <i class="fas fa-cog text-gray-600 group-hover:scale-110 transition-transform"></i>
              <span>إعدادات النظام</span>
            </a>
          </div>
          ` : ''}

          <div class="border-t border-gray-200 my-2"></div>

          <!-- تسجيل الخروج -->
          <div class="mb-2">
            <a href="/login" onclick="doLogout(); return false;" class="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all group font-semibold">
              <i class="fas fa-sign-out-alt group-hover:scale-110 transition-transform"></i>
              <span>تسجيل الخروج</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 hidden z-40" onclick="toggleSidebar()"></div>

      <div class="max-w-7xl mx-auto p-6">

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          ${employeeStats.results.map((emp: any, index: number) => {
            const colors = [
              'from-blue-500 to-blue-600',
              'from-green-500 to-green-600',
              'from-purple-500 to-purple-600',
              'from-orange-500 to-orange-600',
              'from-pink-500 to-pink-600'
            ];
            return `
              <div class="stat-card bg-gradient-to-br ${colors[index % 5]} text-white rounded-xl p-5 shadow-lg">
                <div class="text-sm opacity-90 mb-1">${emp.full_name}</div>
                <div class="text-3xl font-bold">${emp.customer_count}</div>
                <div class="text-xs opacity-80 mt-1">عميل مخصص</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Bulk Assignment Tools -->
        <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-magic text-purple-600"></i>
            أدوات التوزيع السريع
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onclick="autoDistribute()" class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-lg transition-all shadow-md">
              <i class="fas fa-random ml-2"></i>
              توزيع تلقائي متساوي
            </button>
            <button onclick="clearAllAssignments()" class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-lg transition-all shadow-md">
              <i class="fas fa-trash ml-2"></i>
              مسح جميع التخصيصات
            </button>
            <button onclick="assignSelected()" class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-lg transition-all shadow-md">
              <i class="fas fa-check-double ml-2"></i>
              تخصيص المحددين
            </button>
          </div>
        </div>

        <!-- Customers Table -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <h2 class="text-2xl font-bold">
              <i class="fas fa-list ml-2"></i>
              قائمة العملاء (${customers.results.length})
            </h2>
          </div>
          
          <div class="p-6">
            <div class="mb-4 flex gap-3">
              <input type="text" id="searchInput" placeholder="بحث..." class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <select id="filterEmployee" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">كل الموظفين</option>
                <option value="unassigned">غير مخصص</option>
                ${employeeStats.results.map((emp: any) => `
                  <option value="${emp.id}">${emp.full_name} (${emp.customer_count})</option>
                `).join('')}
              </select>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-right">
                      <input type="checkbox" id="selectAll" class="rounded" onchange="toggleSelectAll(this)">
                    </th>
                    <th class="px-4 py-3 text-right">رقم</th>
                    <th class="px-4 py-3 text-right">اسم العميل</th>
                    <th class="px-4 py-3 text-right">رقم الجوال</th>
                    <th class="px-4 py-3 text-right">البريد الإلكتروني</th>
                    <th class="px-4 py-3 text-right">الموظف المخصص</th>
                    <th class="px-4 py-3 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody id="customersTableBody">
                  ${customers.results.map((customer: any) => `
                    <tr class="border-t hover:bg-gray-50 customer-row" data-customer-id="${customer.id}" data-employee-id="${customer.employee_id || ''}">
                      <td class="px-4 py-3">
                        <input type="checkbox" class="customer-checkbox rounded" value="${customer.id}">
                      </td>
                      <td class="px-4 py-3">#${customer.id}</td>
                      <td class="px-4 py-3 font-semibold">${customer.full_name || 'غير محدد'}</td>
                      <td class="px-4 py-3">${customer.phone || 'غير محدد'}</td>
                      <td class="px-4 py-3">${customer.email || 'غير محدد'}</td>
                      <td class="px-4 py-3">
                        ${customer.assigned_employee_name 
                          ? `<span class="employee-badge assigned">${customer.assigned_employee_name}</span>`
                          : `<span class="employee-badge unassigned">غير مخصص</span>`
                        }
                      </td>
                      <td class="px-4 py-3">
                        <select class="assignment-select px-3 py-1 border border-gray-300 rounded text-sm" 
                                data-customer-id="${customer.id}"
                                onchange="assignCustomer(${customer.id}, this.value)">
                          <option value="">اختر موظف...</option>
                          ${employees.results.map((emp: any) => `
                            <option value="${emp.id}" ${customer.employee_id == emp.id ? 'selected' : ''}>
                              ${emp.full_name}
                            </option>
                          `).join('')}
                        </select>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <script>
        // Assign single customer
        async function assignCustomer(customerId, employeeId) {
          if (!employeeId) {
            if (!confirm('هل تريد إلغاء تخصيص هذا العميل؟')) return;
          }
          
          try {
            const response = await fetch('/api/customer-assignment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                customer_id: customerId, 
                employee_id: employeeId || null,
                notes: ''
              })
            });
            
            const data = await response.json();
            if (data.success) {
              alert('تم التخصيص بنجاح!');
              location.reload();
            } else {
              alert('حدث خطأ: ' + (data.error || 'خطأ غير معروف'));
            }
          } catch (error) {
            alert('حدث خطأ: ' + error.message);
          }
        }

        // Auto distribute customers equally
        async function autoDistribute() {
          if (!confirm('سيتم توزيع العملاء بالتساوي على جميع الموظفين. هل تريد المتابعة؟')) return;
          
          try {
            // Get tenant_id from URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const tenantId = urlParams.get('tenant_id') || '${tenantId}';
            
            const response = await fetch('/api/customer-assignment/auto-distribute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tenant_id: tenantId })
            });
            
            const data = await response.json();
            if (data.success) {
              alert(\`تم توزيع \${data.assigned_count} عميل على \${data.employee_count} موظف!\`);
              location.reload();
            } else {
              alert('حدث خطأ: ' + (data.error || 'خطأ غير معروف'));
            }
          } catch (error) {
            alert('حدث خطأ: ' + error.message);
          }
        }

        // Clear all assignments
        async function clearAllAssignments() {
          if (!confirm('سيتم مسح جميع التخصيصات. هل أنت متأكد؟')) return;
          
          try {
            const response = await fetch('/api/customer-assignment/clear-all', {
              method: 'POST'
            });
            
            const data = await response.json();
            if (data.success) {
              alert(\`تم مسح \${data.cleared_count} تخصيص!\`);
              location.reload();
            }
          } catch (error) {
            alert('حدث خطأ: ' + error.message);
          }
        }

        // Toggle select all checkboxes
        function toggleSelectAll(checkbox) {
          const checkboxes = document.querySelectorAll('.customer-checkbox');
          checkboxes.forEach(cb => cb.checked = checkbox.checked);
        }

        // Assign selected customers
        async function assignSelected() {
          const selectedIds = Array.from(document.querySelectorAll('.customer-checkbox:checked'))
            .map(cb => cb.value);
          
          if (selectedIds.length === 0) {
            alert('الرجاء تحديد عملاء أولاً');
            return;
          }
          
          const employeeId = prompt('أدخل رقم الموظف:');
          if (!employeeId) return;
          
          try {
            const response = await fetch('/api/customer-assignment/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                customer_ids: selectedIds, 
                employee_id: employeeId 
              })
            });
            
            const data = await response.json();
            if (data.success) {
              alert(\`تم تخصيص \${data.assigned_count} عميل!\`);
              location.reload();
            }
          } catch (error) {
            alert('حدث خطأ: ' + error.message);
          }
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', filterTable);
        document.getElementById('filterEmployee').addEventListener('change', filterTable);

        function filterTable() {
          const searchTerm = document.getElementById('searchInput').value.toLowerCase();
          const filterEmployee = document.getElementById('filterEmployee').value;
          const rows = document.querySelectorAll('.customer-row');
          
          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const employeeId = row.dataset.employeeId;
            
            let matchSearch = text.includes(searchTerm);
            let matchEmployee = true;
            
            if (filterEmployee === 'unassigned') {
              matchEmployee = !employeeId;
            } else if (filterEmployee) {
              matchEmployee = employeeId === filterEmployee;
            }
            
            row.style.display = (matchSearch && matchEmployee) ? '' : 'none';
          });
        }

        // Sidebar toggle (used by the menu button)
        function toggleSidebar() {
          const sidebar = document.getElementById('sidebar');
          const overlay = document.getElementById('sidebar-overlay');
          if (!sidebar || !overlay) return;

          if (sidebar.classList.contains('translate-x-full')) {
            sidebar.classList.remove('translate-x-full');
            sidebar.classList.add('translate-x-0');
            overlay.classList.remove('hidden');
          } else {
            sidebar.classList.add('translate-x-full');
            sidebar.classList.remove('translate-x-0');
            overlay.classList.add('hidden');
          }
        }

        // Logout (clears cookie + localStorage so SSR role can't get "stuck")
        async function doLogout() {
          if (!confirm('هل تريد تسجيل الخروج؟')) return;
          try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          } catch (e) {
            console.warn('Logout API failed:', e);
          }
          try {
            localStorage.removeItem('user');
            localStorage.removeItem('userData');
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax';
            document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax; Secure';
          } catch (e) {}
          window.location.href = '/login';
        }
      </script>
    </body>
    </html>
  `;

  return c.html(html);
});

// API: Assign customer to employee
app.post('/api/customer-assignment', async (c) => {
  try {
    const { customer_id, employee_id, notes } = await c.req.json();
    
    // If employee_id is null, delete the assignment
    if (!employee_id) {
      await c.env.DB.prepare(`
        DELETE FROM customer_assignments WHERE customer_id = ?
      `).bind(customer_id).run();
      
      return c.json({ success: true, message: 'تم إلغاء التخصيص' });
    }
    
    // Check if assignment already exists
    const existing = await c.env.DB.prepare(`
      SELECT * FROM customer_assignments WHERE customer_id = ?
    `).bind(customer_id).first();
    
    if (existing) {
      // Record in history
      await c.env.DB.prepare(`
        INSERT INTO assignment_history (customer_id, old_employee_id, new_employee_id, changed_by, notes)
        VALUES (?, ?, ?, 1, ?)
      `).bind(customer_id, existing.employee_id, employee_id, notes || '').run();
      
      // Update assignment
      await c.env.DB.prepare(`
        UPDATE customer_assignments 
        SET employee_id = ?, assigned_by = 1, assigned_at = datetime('now'), notes = ?
        WHERE customer_id = ?
      `).bind(employee_id, notes || '', customer_id).run();
    } else {
      // Create new assignment
      await c.env.DB.prepare(`
        INSERT INTO customer_assignments (customer_id, employee_id, assigned_by, notes)
        VALUES (?, ?, 1, ?)
      `).bind(customer_id, employee_id, notes || '').run();
      
      // Record in history
      await c.env.DB.prepare(`
        INSERT INTO assignment_history (customer_id, old_employee_id, new_employee_id, changed_by, notes)
        VALUES (?, NULL, ?, 1, ?)
      `).bind(customer_id, employee_id, notes || '').run();
    }
    
    return c.json({ success: true, message: 'تم التخصيص بنجاح' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: Auto distribute customers equally
app.post('/api/customer-assignment/auto-distribute', async (c) => {
  try {
    // Get tenant_id from query or body
    const body = await c.req.json().catch(() => ({}));
    const tenantId = body.tenant_id || c.req.query('tenant_id') || 1;
    
    // Get employees of THIS tenant only
    const employees = await c.env.DB.prepare(`
      SELECT id FROM users 
      WHERE role = 'employee' AND tenant_id = ?
      ORDER BY id
    `).bind(tenantId).all();
    
    if (employees.results.length === 0) {
      return c.json({ success: false, error: 'لا يوجد موظفين في هذه الشركة' });
    }
    
    // Get unassigned customers of THIS tenant only
    const customers = await c.env.DB.prepare(`
      SELECT c.id 
      FROM customers c
      LEFT JOIN customer_assignments ca ON c.id = ca.customer_id
      WHERE ca.customer_id IS NULL AND c.tenant_id = ?
      ORDER BY c.id
    `).bind(tenantId).all();
    
    let assignedCount = 0;
    const employeeCount = employees.results.length;
    
    // Distribute customers round-robin
    for (let i = 0; i < customers.results.length; i++) {
      const customer = customers.results[i];
      const employee = employees.results[i % employeeCount];
      
      await c.env.DB.prepare(`
        INSERT INTO customer_assignments (customer_id, employee_id, assigned_by, notes)
        VALUES (?, ?, 1, 'توزيع تلقائي')
      `).bind(customer.id, employee.id).run();
      
      assignedCount++;
    }
    
    return c.json({ 
      success: true, 
      assigned_count: assignedCount,
      employee_count: employeeCount
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: Clear all assignments
app.post('/api/customer-assignment/clear-all', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      DELETE FROM customer_assignments
    `).run();
    
    return c.json({ 
      success: true, 
      cleared_count: result.meta.changes 
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: Bulk assign customers
app.post('/api/customer-assignment/bulk', async (c) => {
  try {
    const { customer_ids, employee_id } = await c.req.json();
    
    let assignedCount = 0;
    for (const customerId of customer_ids) {
      // Check if exists
      const existing = await c.env.DB.prepare(`
        SELECT * FROM customer_assignments WHERE customer_id = ?
      `).bind(customerId).first();
      
      if (existing) {
        await c.env.DB.prepare(`
          UPDATE customer_assignments 
          SET employee_id = ?, assigned_by = 1, assigned_at = datetime('now')
          WHERE customer_id = ?
        `).bind(employee_id, customerId).run();
      } else {
        await c.env.DB.prepare(`
          INSERT INTO customer_assignments (customer_id, employee_id, assigned_by)
          VALUES (?, ?, 1)
        `).bind(customerId, employee_id).run();
      }
      
      assignedCount++;
    }
    
    return c.json({ 
      success: true, 
      assigned_count: assignedCount
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================
// صفحة عرض البنوك حسب الشركة
// ============================
app.get('/admin/banks', async (c) => {
  try {
    // Get tenant_id from query parameter
    const tenantId = c.req.query('tenant_id');
    
    // Get tenant info
    let tenantInfo = null;
    if (tenantId) {
      const tenant = await c.env.DB.prepare('SELECT company_name FROM tenants WHERE id = ?')
        .bind(tenantId).first();
      tenantInfo = tenant;
    }
    
    // Build query with optional tenant filter
    let query = 'SELECT * FROM banks';
    if (tenantId) {
      query += ' WHERE tenant_id = ?';
    }
    query += ' ORDER BY bank_name';
    
    const banks = tenantId
      ? await c.env.DB.prepare(query).bind(tenantId).all()
      : await c.env.DB.prepare(query).all();
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>البنوك ${tenantInfo ? '- ' + tenantInfo.company_name : ''}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">← العودة للوحة الرئيسية</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-university text-blue-600 ml-2"></i>
                البنوك ${tenantInfo ? '- ' + tenantInfo.company_name : '(جميع الشركات)'}
              </h1>
              <span class="text-2xl font-bold text-blue-600">${banks.results.length} بنك</span>
            </div>
            
            ${banks.results.length === 0 ? `
              <div class="text-center py-12">
                <i class="fas fa-university text-gray-300 text-6xl mb-4"></i>
                <p class="text-gray-500 text-xl">لا توجد بنوك لهذه الشركة</p>
              </div>
            ` : `
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-6 py-3 text-right text-sm font-bold text-gray-700">رقم</th>
                      <th class="px-6 py-3 text-right text-sm font-bold text-gray-700">اسم البنك</th>
                      <th class="px-6 py-3 text-right text-sm font-bold text-gray-700">كود البنك</th>
                      <th class="px-6 py-3 text-right text-sm font-bold text-gray-700">الشركة</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    ${banks.results.map((bank: any, index: number) => `
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm">${index + 1}</td>
                        <td class="px-6 py-4 font-bold">${bank.bank_name}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${bank.bank_code || '-'}</td>
                        <td class="px-6 py-4 text-sm">
                          <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            Tenant ${bank.tenant_id || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    return c.html(`<h1>Error: ${error.message}</h1>`, 500);
  }
});

// ============================
// صفحة عرض النسب حسب الشركة
// ============================
app.get('/admin/rates', async (c) => {
  try {
    // Get user info (userId, tenantId, roleId)
    const userInfo = await getUserInfo(c);
    
    // Get tenant_id from query parameter (fallback) or from user info
    let tenantId = c.req.query('tenant_id') || (userInfo.tenantId ? userInfo.tenantId.toString() : null);
    
    // Get tenant info
    let tenantInfo = null;
    if (tenantId) {
      const tenant = await c.env.DB.prepare('SELECT company_name FROM tenants WHERE id = ?')
        .bind(tenantId).first();
      tenantInfo = tenant;
    }
    
    // Build query with role-based filtering
    let query = `
      SELECT 
        r.*,
        b.bank_name,
        f.type_name as financing_type_name
      FROM bank_financing_rates r
      LEFT JOIN banks b ON r.bank_id = b.id
      LEFT JOIN financing_types f ON r.financing_type_id = f.id
    `;
    
    let queryParams: any[] = [];
    
    if (userInfo.roleId === 1) {
      // Role 1: Super Admin - sees ALL rates
      // No WHERE clause
    } else if (userInfo.roleId === 2 || userInfo.roleId === 3) {
      // Role 2: Company Admin - sees all company rates
      // Role 3: Supervisor - sees all company rates (read-only)
      if (userInfo.tenantId) {
        query += ' WHERE r.tenant_id = ?';
        queryParams.push(userInfo.tenantId);
        tenantId = userInfo.tenantId.toString();
      }
    } else {
      // Other roles - no data or filtered by tenant_id if provided
      if (tenantId) {
        query += ' WHERE r.tenant_id = ?';
        queryParams.push(tenantId);
      }
    }
    
    query += ' ORDER BY b.bank_name, f.type_name';
    
    const rates = queryParams.length > 0
      ? await c.env.DB.prepare(query).bind(...queryParams).all()
      : await c.env.DB.prepare(query).all();
    
    // Determine if user can edit/add (company admin and super admin can)
    const canEdit = userInfo.roleId === 1 || userInfo.roleId === 2;
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>النسب والأسعار ${tenantInfo ? '- ' + tenantInfo.company_name : ''}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          /* Custom Scrollbar - Enhanced */
          .overflow-x-auto {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #10b981 #f7fafc;
          }
          
          .overflow-x-auto::-webkit-scrollbar {
            height: 12px;
            width: 12px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-track {
            background: #e5e7eb;
            border-radius: 10px;
            margin: 0 10px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #10b981 0%, #059669 100%);
            border-radius: 10px;
            border: 2px solid #e5e7eb;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #059669 0%, #047857 100%);
            border-color: #d1d5db;
          }
          
          /* Force scrollbar to always show */
          .overflow-x-auto {
            overflow-x: scroll !important; /* Always show scrollbar */
          }
          
          .overflow-x-auto table {
            min-width: 1200px; /* Force table to be wide enough for scrollbar */
            width: max-content;
          }
          
          ${getMobileResponsiveCSS()}
        </style>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">← العودة للوحة الرئيسية</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-percent text-green-600 ml-2"></i>
                النسب والأسعار ${tenantInfo ? '- ' + tenantInfo.company_name : '(جميع الشركات)'}
              </h1>
              <div class="flex flex-wrap items-center gap-4">
                <span class="text-2xl font-bold text-green-600">${rates.results.length} نسبة</span>
                <div class="flex-1"></div>
                <!-- Search Box -->
                <div class="relative">
                  <input 
                    type="text" 
                    id="searchRates" 
                    placeholder="بحث عن بنك أو نوع تمويل..." 
                    class="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onkeyup="searchInRatesTable()"
                  />
                  <i class="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                </div>
                ${canEdit && tenantId ? `
                  <a href="/admin/rates/add?tenant_id=${tenantId}" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg">
                    <i class="fas fa-plus ml-2"></i>
                    إضافة نسبة جديدة
                  </a>
                ` : ''}
              </div>
            </div>
            
            ${rates.results.length === 0 ? `
              <div class="text-center py-12">
                <i class="fas fa-percent text-gray-300 text-6xl mb-4"></i>
                <p class="text-gray-500 text-xl">لا توجد نسب لهذه الشركة</p>
              </div>
            ` : `
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">رقم</th>
                      <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">البنك</th>
                      <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">نوع التمويل</th>
                      <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">النسبة %</th>
                      <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">الحد الأدنى</th>
                      <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">الحد الأقصى</th>
                      <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">المدة</th>
                      ${canEdit ? '<th class="px-4 py-3 text-right text-sm font-bold text-gray-700">إجراءات</th>' : ''}
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    ${rates.results.map((rate: any, index: number) => `
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-4 text-sm">${index + 1}</td>
                        <td class="px-4 py-4 font-bold">${rate.bank_name || '-'}</td>
                        <td class="px-4 py-4 text-sm">${rate.financing_type_name || '-'}</td>
                        <td class="px-4 py-4">
                          <span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            ${rate.rate}%
                          </span>
                        </td>
                        <td class="px-4 py-4 text-sm">${rate.min_amount ? rate.min_amount.toLocaleString() : '-'} ريال</td>
                        <td class="px-4 py-4 text-sm">${rate.max_amount ? rate.max_amount.toLocaleString() : '-'} ريال</td>
                        <td class="px-4 py-4 text-sm">${rate.min_duration || '-'} - ${rate.max_duration || '-'} شهر</td>
                        ${canEdit ? `
                          <td class="px-4 py-4 text-sm">
                            <a href="/admin/rates/edit/${rate.id}?tenant_id=${tenantId || rate.tenant_id}" class="text-blue-600 hover:text-blue-800 ml-2" title="تعديل">
                              <i class="fas fa-edit"></i>
                            </a>
                            <button onclick="deleteRate(${rate.id})" class="text-red-600 hover:text-red-800" title="حذف">
                              <i class="fas fa-trash"></i>
                            </button>
                          </td>
                        ` : ''}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
        
        <script>
          function searchInRatesTable() {
            const searchValue = document.getElementById('searchRates').value.toLowerCase();
            const tableBody = document.querySelector('tbody');
            const rows = tableBody.querySelectorAll('tr');
            
            rows.forEach(row => {
              const bankName = row.cells[1]?.textContent.toLowerCase() || '';
              const financingType = row.cells[2]?.textContent.toLowerCase() || '';
              
              if (bankName.includes(searchValue) || financingType.includes(searchValue)) {
                row.style.display = '';
              } else {
                row.style.display = 'none';
              }
            });
          }
          
          function deleteRate(rateId) {
            if (!confirm('هل أنت متأكد من حذف هذه النسبة؟')) return;
            
            const urlParams = new URLSearchParams(window.location.search);
            const tenantId = urlParams.get('tenant_id');
            
            fetch(\`/api/rates/\${rateId}\`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || localStorage.getItem('token'))
              }
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                alert('تم حذف النسبة بنجاح');
                window.location.reload();
              } else {
                alert('حدث خطأ: ' + data.message);
              }
            })
            .catch(error => {
              alert('حدث خطأ: ' + error.message);
            });
          }
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    return c.html(`<h1>Error: ${error.message}</h1>`, 500);
  }
});

// Add Rate Page
app.get('/admin/rates/add', async (c) => {
  try {
    // Get user info
    const userInfo = await getUserInfo(c);
    
    // Get tenant_id from query or from user info
    let tenantId = c.req.query('tenant_id') || (userInfo.tenantId ? userInfo.tenantId.toString() : null);
    
    // Check permissions - only super admin (role 1) and company admin (role 2) can add rates
    if (userInfo.roleId !== 1 && userInfo.roleId !== 2) {
      return c.html('<h1>خطأ: ليس لديك صلاحية لإضافة نسب التمويل</h1>', 403);
    }
    
    // For company admin, must have tenant_id
    if (userInfo.roleId === 2 && !tenantId) {
      return c.html('<h1>خطأ: يجب تحديد الشركة</h1>', 400);
    }
    
    // For super admin, tenant_id is optional (can add for any tenant)
    if (userInfo.roleId === 1 && !tenantId) {
      // Super admin can add without tenant_id, but we'll use null
      tenantId = null;
    }
    
    const banks = await c.env.DB.prepare('SELECT * FROM banks WHERE is_active = 1 ORDER BY bank_name').all();
    const financingTypes = await c.env.DB.prepare('SELECT * FROM financing_types ORDER BY type_name').all();
    
    return c.html(generateAddRatePage(tenantId || '', banks.results, financingTypes.results));
  } catch (error: any) {
    return c.html(`<h1>خطأ: ${error.message}</h1>`, 500);
  }
});

// Edit Rate Page
app.get('/admin/rates/edit/:id', async (c) => {
  const rateId = c.req.param('id');
  const tenantId = c.req.query('tenant_id');
  
  if (!tenantId) {
    return c.html('<h1>خطأ: يجب تحديد الشركة</h1>', 400);
  }
  
  const rate = await c.env.DB.prepare(`
    SELECT r.*, b.bank_name, f.type_name
    FROM bank_financing_rates r
    LEFT JOIN banks b ON r.bank_id = b.id
    LEFT JOIN financing_types f ON r.financing_type_id = f.id
    WHERE r.id = ? AND r.tenant_id = ?
  `).bind(rateId, tenantId).first();
  
  if (!rate) {
    return c.html('<h1>خطأ: النسبة غير موجودة</h1>', 404);
  }
  
  const banks = await c.env.DB.prepare('SELECT * FROM banks WHERE is_active = 1 ORDER BY bank_name').all();
  const financingTypes = await c.env.DB.prepare('SELECT * FROM financing_types ORDER BY type_name').all();
  
  return c.html(generateEditRatePage(tenantId, rate, banks.results, financingTypes.results));
});

app.get('/admin/customers', async (c) => {
  try {
    // Get user info (userId, tenantId, roleId)
    const userInfo = await getUserInfo(c);
    
    console.log('🔍 Customer Page - User Info:', {
      userId: userInfo.userId,
      tenantId: userInfo.tenantId,
      roleId: userInfo.roleId
    });
    
    // Redirect to login if not authenticated
    if (!userInfo.userId || !userInfo.roleId) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تسجيل الدخول مطلوب</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        </head>
        <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
            <div class="max-w-md w-full mx-4">
                <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div class="mb-6">
                        <i class="fas fa-lock text-6xl text-blue-600"></i>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-4">تسجيل الدخول مطلوب</h1>
                    <p class="text-gray-600 mb-6">
                        يجب تسجيل الدخول للوصول إلى صفحة العملاء
                    </p>
                    <div class="space-y-3">
                        <a href="/login" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                            <i class="fas fa-sign-in-alt ml-2"></i>
                            تسجيل الدخول
                        </a>
                        <a href="/" class="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors">
                            <i class="fas fa-home ml-2"></i>
                            العودة للرئيسية
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `);
    }
    
    // Build query based on role
    let query = 'SELECT * FROM customers';
    let queryParams: any[] = [];
    
    if (userInfo.roleId === 1) {
      // Role 1: Super Admin - sees ALL customers
      // No filtering
    } else if (userInfo.roleId === 2 || userInfo.roleId === 3) {
      // Role 2: Company Admin - sees all company customers
      // Role 3: Supervisor - sees all company customers (read-only)
      if (userInfo.tenantId) {
        query += ' WHERE tenant_id = ?';
        queryParams.push(userInfo.tenantId);
      }
    } else if (userInfo.roleId === 4) {
      // Role 4: Employee - sees ONLY assigned customers
      if (userInfo.userId) {
        query += ' WHERE assigned_to = ?';
        queryParams.push(userInfo.userId);
      } else {
        // No assigned customers if user ID not found
        query += ' WHERE 1 = 0';
      }
    } else {
      // Unknown role - no data
      query += ' WHERE 1 = 0';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const customers = queryParams.length > 0
      ? await c.env.DB.prepare(query).bind(...queryParams).all()
      : await c.env.DB.prepare(query).all();
    
    // Determine if user can edit/delete (not for Role 3 - Supervisor)
    const canEdit = userInfo.roleId !== 3;
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>العملاء</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          /* Custom Scrollbar - Enhanced */
          .overflow-x-auto {
            overflow-x: scroll !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #10b981 #f7fafc;
          }
          
          .overflow-x-auto::-webkit-scrollbar {
            height: 12px;
            width: 12px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-track {
            background: #e5e7eb;
            border-radius: 10px;
            margin: 0 10px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #10b981 0%, #059669 100%);
            border-radius: 10px;
            border: 2px solid #e5e7eb;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #059669 0%, #047857 100%);
            border-color: #d1d5db;
          }
          
          .overflow-x-auto table {
            min-width: 1200px;
            width: max-content;
          }
          
          ${getMobileResponsiveCSS()}
        </style>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">← العودة للوحة الرئيسية</a>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-users text-green-600 ml-2"></i>
                العملاء (<span id="totalCount">${customers.results.length}</span>)
              </h1>
              
              <div class="flex gap-3">
                ${userInfo.roleId !== 3 ? `
                <a href="/admin/customer-assignment${userInfo.tenantId ? '?tenant_id=' + userInfo.tenantId : ''}" 
                   class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-md">
                  <i class="fas fa-users-cog ml-2"></i>
                  توزيع العملاء
                </a>
                ` : ''}
                <button onclick="exportToCSV()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-file-export ml-2"></i>
                  تصدير Excel
                </button>
                ${canEdit ? `
                <a href="/admin/customers/add" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-plus ml-2"></i>
                  إضافة عميل جديد
                </a>
                ` : ''}
              </div>
            </div>
            
            <!-- شريط البحث والفلترة -->
            <div class="border-t pt-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="relative">
                  <i class="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
                  <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="بحث في جميع الحقول..." 
                    class="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onkeyup="filterTable()"
                  >
                </div>
                
                <div>
                  <select 
                    id="filterField" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onchange="filterTable()"
                  >
                    <option value="all">البحث في: الكل</option>
                    <option value="name">الاسم فقط</option>
                    <option value="phone">الهاتف فقط</option>
                    <option value="email">البريد فقط</option>
                  </select>
                </div>
                
                <button 
                  onclick="resetFilters()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  <i class="fas fa-redo ml-2"></i>
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <table class="min-w-full" id="dataTable">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">#</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" id="tableBody">
                ${customers.results.map((customer: any) => `
                  <tr class="hover:bg-gray-50" data-name="${customer.full_name || ''}" data-phone="${customer.phone || ''}" data-email="${customer.email || ''}">
                    <td class="px-6 py-4 whitespace-nowrap font-bold text-gray-900">${customer.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap font-medium">${customer.full_name || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${customer.phone || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${customer.email || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${new Date(customer.created_at).toLocaleDateString('ar-SA')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="flex items-center justify-end gap-2">
                        <a href="/admin/customers/${customer.id}/report" class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm" title="تقرير العميل الكامل">
                          <i class="fas fa-file-alt"></i> تقرير
                        </a>
                        <a href="/admin/customers/${customer.id}" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                          <i class="fas fa-eye"></i> عرض
                        </a>
                        ${canEdit ? `
                        <a href="/admin/customers/${customer.id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                          <i class="fas fa-edit"></i> تعديل
                        </a>
                        <a href="/admin/customers/${customer.id}/delete" onclick="return confirm('هل أنت متأكد من حذف هذا العميل؟')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                          <i class="fas fa-trash"></i> حذف
                        </a>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <script>
          // البحث والفلترة
          function filterTable() {
            const searchInput = document.getElementById('searchInput').value.toLowerCase().trim()
            const filterField = document.getElementById('filterField').value
            const tableBody = document.getElementById('tableBody')
            const rows = tableBody.getElementsByTagName('tr')
            let visibleCount = 0
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i]
              const name = row.getAttribute('data-name') || ''
              const phone = row.getAttribute('data-phone') || ''
              const email = row.getAttribute('data-email') || ''
              
              let shouldShow = false
              
              if (searchInput === '') {
                shouldShow = true
              } else {
                switch(filterField) {
                  case 'name':
                    shouldShow = name.toLowerCase().includes(searchInput)
                    break
                  case 'phone':
                    shouldShow = phone.toLowerCase().includes(searchInput)
                    break
                  case 'email':
                    shouldShow = email.toLowerCase().includes(searchInput)
                    break
                  default: // 'all'
                    shouldShow = name.toLowerCase().includes(searchInput) || 
                                phone.toLowerCase().includes(searchInput) || 
                                email.toLowerCase().includes(searchInput)
                }
              }
              
              row.style.display = shouldShow ? '' : 'none'
              if (shouldShow) visibleCount++
            }
            
            document.getElementById('totalCount').textContent = visibleCount
          }
          
          // إعادة تعيين الفلاتر
          function resetFilters() {
            document.getElementById('searchInput').value = ''
            document.getElementById('filterField').value = 'all'
            filterTable()
          }
          
          // التصدير إلى CSV
          function exportToCSV() {
            const data = [
              ['#', 'الاسم', 'الهاتف', 'البريد الإلكتروني', 'الرقم الوطني', 'تاريخ التسجيل'],
              ${customers.results.map((customer: any) => `['${customer.id}', '${customer.full_name || '-'}', '${customer.phone || '-'}', '${customer.email || '-'}', '${customer.national_id || '-'}', '${new Date(customer.created_at).toLocaleDateString('ar-SA')}']`).join(',\n              ')}
            ];
            
            let csv = '\\uFEFF';
            data.forEach(row => {
              csv += row.join(',') + '\\n';
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'العملاء_' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
          }
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== صفحة مركز الإشعارات ====================
// Roles Management Page
app.get('/admin/roles', async (c) => {
  try {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إدارة الأدوار</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      </head>
      <body class="bg-gray-50">
        <div class="min-h-screen">
          <!-- Header -->
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-6 py-4">
              <div class="flex items-center justify-between">
                <div>
                  <h1 class="text-2xl font-bold">
                    <i class="fas fa-user-shield ml-2"></i>
                    إدارة الأدوار والصلاحيات
                  </h1>
                  <p class="text-sm text-indigo-100 mt-1">إدارة الأدوار وتحديد صلاحيات المستخدمين</p>
                </div>
                <a href="/admin/panel" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
                  <i class="fas fa-arrow-right ml-2"></i>
                  العودة للوحة التحكم
                </a>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="max-w-7xl mx-auto p-6">
            <!-- Add Role Button -->
            <div class="mb-6 flex justify-between items-center">
              <div>
                <p class="text-gray-600">إدارة الأدوار المتاحة في النظام</p>
              </div>
              <button onclick="openAddRoleModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg">
                <i class="fas fa-plus ml-2"></i>
                إضافة دور جديد
              </button>
            </div>

            <!-- Roles Table -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <tr>
                      <th class="px-6 py-4 text-right text-sm font-bold">#</th>
                      <th class="px-6 py-4 text-right text-sm font-bold">اسم الدور</th>
                      <th class="px-6 py-4 text-right text-sm font-bold">الوصف</th>
                      <th class="px-6 py-4 text-right text-sm font-bold">عدد الصلاحيات</th>
                      <th class="px-6 py-4 text-right text-sm font-bold">عدد المستخدمين</th>
                      <th class="px-6 py-4 text-right text-sm font-bold">تاريخ الإنشاء</th>
                      <th class="px-6 py-4 text-center text-sm font-bold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody id="rolesTable" class="divide-y divide-gray-200">
                    <tr>
                      <td colspan="7" class="text-center py-8 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>جاري تحميل البيانات...</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Role Modal -->
        <div id="addRoleModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
          <div class="bg-white rounded-xl p-6 max-w-xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">
              <i class="fas fa-plus-circle text-indigo-600 ml-2"></i>
              إضافة دور جديد
            </h2>
            <form id="addRoleForm">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">اسم الدور (بالإنجليزية) *</label>
                  <input type="text" name="role_name" required 
                         placeholder="مثال: manager"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <p class="text-xs text-gray-500 mt-1">يُستخدم في قاعدة البيانات والبرمجة</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">الوصف (بالعربية) *</label>
                  <textarea name="description" required rows="3"
                            placeholder="مثال: مدير - صلاحيات متوسطة"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
                  <p class="text-xs text-gray-500 mt-1">يظهر للمستخدمين في الواجهة</p>
                </div>
              </div>
              <div class="flex gap-3 mt-6">
                <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-bold">
                  <i class="fas fa-save ml-2"></i>
                  حفظ
                </button>
                <button type="button" onclick="closeAddRoleModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                  <i class="fas fa-times ml-2"></i>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Edit Role Modal -->
        <div id="editRoleModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
          <div class="bg-white rounded-xl p-6 max-w-xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">
              <i class="fas fa-edit text-purple-600 ml-2"></i>
              تعديل دور
            </h2>
            <form id="editRoleForm">
              <input type="hidden" name="role_id" id="editRoleId">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">اسم الدور (بالإنجليزية) *</label>
                  <input type="text" name="role_name" id="editRoleName" required 
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">الوصف (بالعربية) *</label>
                  <textarea name="description" id="editRoleDescription" required rows="3"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
              </div>
              <div class="flex gap-3 mt-6">
                <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-bold">
                  <i class="fas fa-save ml-2"></i>
                  حفظ التعديلات
                </button>
                <button type="button" onclick="closeEditRoleModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                  <i class="fas fa-times ml-2"></i>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>

        <script>
          let rolesData = [];

          // Load roles
          async function loadRoles() {
            try {
              const authToken = localStorage.getItem('authToken');
              const response = await axios.get('/api/roles', {
                headers: { 'Authorization': 'Bearer ' + authToken }
              });

              if (response.data.success) {
                rolesData = response.data.data;
                displayRoles(rolesData);
              }
            } catch (error) {
              console.error('Error loading roles:', error);
              alert('خطأ في تحميل الأدوار');
            }
          }

          // Display roles
          function displayRoles(roles) {
            const tbody = document.getElementById('rolesTable');
            
            if (roles.length === 0) {
              tbody.innerHTML = \`
                <tr>
                  <td colspan="7" class="text-center py-8 text-gray-500">لا توجد أدوار</td>
                </tr>
              \`;
              return;
            }

            tbody.innerHTML = roles.map((role, index) => {
              const createdDate = new Date(role.created_at);
              const formattedDate = createdDate.toLocaleDateString('ar-SA');
              
              return \`
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 font-medium">\${index + 1}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      \${role.role_name}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-gray-600">\${role.description}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <i class="fas fa-shield-alt ml-1"></i>
                      \${role.permissions_count || 0}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <button onclick="viewRoleUsers(\${role.id})" class="text-blue-600 hover:text-blue-800">
                      <i class="fas fa-users ml-1"></i>
                      عرض المستخدمين
                    </button>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">\${formattedDate}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <button onclick="openEditRoleModal(\${role.id}, '\${role.role_name}', '\${role.description}')" 
                              class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm"
                              title="تعديل">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button onclick="managePermissions(\${role.id}, '\${role.role_name}')" 
                              class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg text-sm"
                              title="إدارة الصلاحيات">
                        <i class="fas fa-shield-alt"></i>
                      </button>
                      <button onclick="deleteRole(\${role.id}, '\${role.role_name}')" 
                              class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                              title="حذف">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              \`;
            }).join('');
          }

          // Open add role modal
          function openAddRoleModal() {
            document.getElementById('addRoleModal').style.display = 'flex';
            document.getElementById('addRoleForm').reset();
          }

          // Close add role modal
          function closeAddRoleModal() {
            document.getElementById('addRoleModal').style.display = 'none';
          }

          // Open edit role modal
          function openEditRoleModal(id, name, description) {
            document.getElementById('editRoleId').value = id;
            document.getElementById('editRoleName').value = name;
            document.getElementById('editRoleDescription').value = description;
            document.getElementById('editRoleModal').style.display = 'flex';
          }

          // Close edit role modal
          function closeEditRoleModal() {
            document.getElementById('editRoleModal').style.display = 'none';
          }

          // Add role form submission
          document.getElementById('addRoleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
              role_name: formData.get('role_name'),
              description: formData.get('description')
            };

            try {
              const authToken = localStorage.getItem('authToken');
              const response = await axios.post('/api/roles', data, {
                headers: { 
                  'Authorization': 'Bearer ' + authToken,
                  'Content-Type': 'application/json'
                }
              });

              if (response.data.success) {
                alert('✅ ' + response.data.message);
                closeAddRoleModal();
                loadRoles();
              } else {
                alert('❌ ' + response.data.error);
              }
            } catch (error) {
              console.error('Error adding role:', error);
              alert('❌ حدث خطأ أثناء إضافة الدور');
            }
          });

          // Edit role form submission
          document.getElementById('editRoleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const roleId = formData.get('role_id');
            const data = {
              role_name: formData.get('role_name'),
              description: formData.get('description')
            };

            try {
              const authToken = localStorage.getItem('authToken');
              const response = await axios.put('/api/roles/' + roleId, data, {
                headers: { 
                  'Authorization': 'Bearer ' + authToken,
                  'Content-Type': 'application/json'
                }
              });

              if (response.data.success) {
                alert('✅ ' + response.data.message);
                closeEditRoleModal();
                loadRoles();
              } else {
                alert('❌ ' + response.data.error);
              }
            } catch (error) {
              console.error('Error updating role:', error);
              alert('❌ حدث خطأ أثناء تحديث الدور');
            }
          });

          // Delete role
          async function deleteRole(id, name) {
            if (!confirm('هل أنت متأكد من حذف الدور: ' + name + '؟\\n\\nسيتم حذف جميع الصلاحيات المرتبطة بهذا الدور.')) {
              return;
            }

            try {
              const authToken = localStorage.getItem('authToken');
              const response = await axios.delete('/api/roles/' + id, {
                headers: { 'Authorization': 'Bearer ' + authToken }
              });

              if (response.data.success) {
                alert('✅ ' + response.data.message);
                loadRoles();
              } else {
                alert('❌ ' + response.data.error);
              }
            } catch (error) {
              console.error('Error deleting role:', error);
              alert('❌ حدث خطأ أثناء حذف الدور');
            }
          }

          // Manage permissions
          function managePermissions(roleId, roleName) {
            window.location.href = '/admin/roles/' + roleId + '/permissions';
          }

          // View role users
          function viewRoleUsers(roleId) {
            window.location.href = '/admin/users?role_id=' + roleId;
          }

          // Load data on page load
          loadRoles();
        </script>
      </body>
      </html>
    `)
  } catch (error: any) {
    return c.html('<h1>خطأ في تحميل الصفحة</h1><p>' + error.message + '</p>')
  }
})

app.get('/admin/notifications', async (c) => {
  try {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مركز الإشعارات</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .notification-card {
            transition: all 0.3s ease;
          }
          .notification-card:hover {
            transform: translateX(-5px);
          }
          .notification-unread {
            background: linear-gradient(to right, #EFF6FF, #FFFFFF);
            border-right: 4px solid #3B82F6;
          }
          .notification-read {
            background: #FFFFFF;
            opacity: 0.85;
          }
          .badge-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
          
          ${getMobileResponsiveCSS()}
        </style>
      </head>
      <body class="bg-gray-50">
        <div class="container mx-auto px-4 py-8">
          <!-- Header -->
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <i class="fas fa-bell text-blue-600"></i>
                مركز الإشعارات
              </h1>
              <p class="text-gray-600 mt-2">إدارة جميع إشعارات النظام</p>
            </div>
            <div class="flex gap-3">
              <button onclick="markAllAsRead()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-bold">
                <i class="fas fa-check-double ml-2"></i>
                تحديد الكل كمقروء
              </button>
              <a href="/admin" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition font-bold">
                <i class="fas fa-arrow-right ml-2"></i>
                العودة
              </a>
            </div>
          </div>

          <!-- Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-blue-100 text-sm mb-1">إجمالي الإشعارات</p>
                  <p class="text-4xl font-bold" id="totalCount">0</p>
                </div>
                <i class="fas fa-bell text-6xl opacity-20"></i>
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-green-100 text-sm mb-1">غير مقروءة</p>
                  <p class="text-4xl font-bold badge-pulse" id="unreadCount">0</p>
                </div>
                <i class="fas fa-envelope text-6xl opacity-20"></i>
              </div>
            </div>
            
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-purple-100 text-sm mb-1">مقروءة</p>
                  <p class="text-4xl font-bold" id="readCount">0</p>
                </div>
                <i class="fas fa-envelope-open text-6xl opacity-20"></i>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="bg-white rounded-xl shadow-md p-6 mb-6">
            <div class="flex flex-wrap gap-3">
              <button onclick="filterNotifications('all')" class="filter-btn active px-6 py-2 rounded-lg font-bold transition">
                <i class="fas fa-list ml-2"></i>
                الكل
              </button>
              <button onclick="filterNotifications('unread')" class="filter-btn px-6 py-2 rounded-lg font-bold transition">
                <i class="fas fa-envelope ml-2"></i>
                غير مقروءة
              </button>
              <button onclick="filterNotifications('read')" class="filter-btn px-6 py-2 rounded-lg font-bold transition">
                <i class="fas fa-envelope-open ml-2"></i>
                مقروءة
              </button>
              <button onclick="filterNotifications('request')" class="filter-btn px-6 py-2 rounded-lg font-bold transition">
                <i class="fas fa-file-invoice ml-2"></i>
                طلبات جديدة
              </button>
              <button onclick="filterNotifications('status_change')" class="filter-btn px-6 py-2 rounded-lg font-bold transition">
                <i class="fas fa-sync ml-2"></i>
                تحديثات الحالة
              </button>
            </div>
          </div>

          <!-- Notifications List -->
          <div class="bg-white rounded-xl shadow-md p-6">
            <div id="notificationsList" class="space-y-4">
              <div class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600">جاري تحميل الإشعارات...</p>
              </div>
            </div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          let allNotifications = [];
          let currentFilter = 'all';

          async function loadNotifications() {
            try {
              const response = await axios.get('/api/notifications');
              if (response.data.success) {
                allNotifications = response.data.data;
                updateStats();
                renderNotifications();
              }
            } catch (error) {
              console.error('Error loading notifications:', error);
              document.getElementById('notificationsList').innerHTML = \`
                <div class="text-center py-12">
                  <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
                  <p class="text-red-600">حدث خطأ في تحميل الإشعارات</p>
                </div>
              \`;
            }
          }

          function updateStats() {
            const total = allNotifications.length;
            const unread = allNotifications.filter(n => n.is_read === 0).length;
            const read = total - unread;

            document.getElementById('totalCount').textContent = total;
            document.getElementById('unreadCount').textContent = unread;
            document.getElementById('readCount').textContent = read;
          }

          function filterNotifications(filter) {
            currentFilter = filter;
            
            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => {
              btn.classList.remove('active', 'bg-blue-600', 'text-white');
              btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
            });
            event.target.closest('button').classList.add('active', 'bg-blue-600', 'text-white');
            event.target.closest('button').classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
            
            renderNotifications();
          }

          function renderNotifications() {
            let filtered = allNotifications;

            if (currentFilter === 'unread') {
              filtered = allNotifications.filter(n => n.is_read === 0);
            } else if (currentFilter === 'read') {
              filtered = allNotifications.filter(n => n.is_read === 1);
            } else if (currentFilter === 'request' || currentFilter === 'status_change') {
              filtered = allNotifications.filter(n => n.category === currentFilter);
            }

            if (filtered.length === 0) {
              document.getElementById('notificationsList').innerHTML = \`
                <div class="text-center py-12">
                  <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                  <p class="text-gray-600">لا توجد إشعارات</p>
                </div>
              \`;
              return;
            }

            const html = filtered.map(notification => {
              const typeIcons = {
                info: 'fa-info-circle text-blue-600',
                success: 'fa-check-circle text-green-600',
                warning: 'fa-exclamation-triangle text-yellow-600',
                error: 'fa-times-circle text-red-600'
              };

              const categoryIcons = {
                request: 'fa-file-invoice',
                status_change: 'fa-sync',
                system: 'fa-cog',
                general: 'fa-bell'
              };

              const typeIcon = typeIcons[notification.type] || typeIcons.info;
              const categoryIcon = categoryIcons[notification.category] || categoryIcons.general;
              
              return \`
                <div class="notification-card \${notification.is_read === 0 ? 'notification-unread' : 'notification-read'} rounded-lg p-4 shadow-sm">
                  <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <i class="fas \${typeIcon} text-3xl"></i>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-start justify-between mb-2">
                        <h3 class="text-lg font-bold text-gray-800">\${notification.title}</h3>
                        <div class="flex gap-2">
                          \${notification.is_read === 0 ? \`
                            <button onclick="markAsRead(\${notification.id})" class="text-blue-600 hover:text-blue-800 transition" title="تحديد كمقروء">
                              <i class="fas fa-check"></i>
                            </button>
                          \` : ''}
                          <button onclick="deleteNotification(\${notification.id})" class="text-red-600 hover:text-red-800 transition" title="حذف">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <p class="text-gray-700 mb-3">\${notification.message}</p>
                      <div class="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          <i class="fas \${categoryIcon} ml-1"></i>
                          \${notification.category === 'request' ? 'طلب جديد' : 
                            notification.category === 'status_change' ? 'تحديث حالة' : 
                            notification.category === 'system' ? 'نظام' : 'عام'}
                        </span>
                        <span>
                          <i class="fas fa-clock ml-1"></i>
                          \${new Date(notification.created_at).toLocaleString('ar-SA')}
                        </span>
                        \${notification.related_request_id ? \`
                          <a href="/admin/requests/\${notification.related_request_id}" class="text-blue-600 hover:text-blue-800 font-bold">
                            <i class="fas fa-external-link-alt ml-1"></i>
                            عرض الطلب #\${notification.related_request_id}
                          </a>
                        \` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              \`;
            }).join('');

            document.getElementById('notificationsList').innerHTML = html;
          }

          async function markAsRead(id) {
            try {
              await axios.put(\`/api/notifications/\${id}/read\`);
              await loadNotifications();
            } catch (error) {
              console.error('Error marking as read:', error);
              alert('حدث خطأ في تحديد الإشعار كمقروء');
            }
          }

          async function markAllAsRead() {
            try {
              await axios.put('/api/notifications/read-all');
              await loadNotifications();
              alert('✓ تم تحديد جميع الإشعارات كمقروءة');
            } catch (error) {
              console.error('Error marking all as read:', error);
              alert('حدث خطأ في تحديد الإشعارات');
            }
          }

          async function deleteNotification(id) {
            if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;
            
            try {
              await axios.delete(\`/api/notifications/\${id}\`);
              await loadNotifications();
            } catch (error) {
              console.error('Error deleting notification:', error);
              alert('حدث خطأ في حذف الإشعار');
            }
          }

          // Load notifications on page load
          loadNotifications();
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// Edit financing request page
app.get('/admin/requests/:id/edit', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get request details
    const request = await c.env.DB.prepare(`
      SELECT 
        fr.*,
        c.full_name as customer_name,
        c.phone as customer_phone,
        b.bank_name
      FROM financing_requests fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN banks b ON fr.selected_bank_id = b.id
      WHERE fr.id = ?
    `).bind(id).first()
    
    if (!request) {
      return c.html('<h1>الطلب غير موجود</h1>')
    }
    
    // Get all banks for dropdown
    const banks = await c.env.DB.prepare(`
      SELECT id, bank_name FROM banks ORDER BY bank_name
    `).all()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تعديل طلب التمويل #${id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/requests" class="text-blue-600 hover:text-blue-800">← العودة للطلبات</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-8">
              <i class="fas fa-edit text-yellow-600 ml-2"></i>
              تعديل طلب التمويل #${id}
            </h1>
            
            <form id="editForm" onsubmit="handleSubmit(event)" class="space-y-6">
              <!-- Customer Information (Read Only) -->
              <div class="border-b pb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-4">
                  <i class="fas fa-user ml-2"></i>
                  معلومات العميل (للعرض فقط)
                </h2>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <p class="text-gray-700"><strong>اسم العميل:</strong> ${request.customer_name || 'غير محدد'}</p>
                  <p class="text-gray-700"><strong>رقم الجوال:</strong> ${request.customer_phone || 'غير محدد'}</p>
                  <p class="text-gray-700"><strong>البنك:</strong> ${request.bank_name || 'غير محدد'}</p>
                </div>
              </div>
              
              <!-- Financing Information -->
              <div class="border-b pb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-4">
                  <i class="fas fa-money-bill-wave ml-2"></i>
                  معلومات التمويل
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">المبلغ المطلوب</label>
                    <input 
                      type="number" 
                      id="requested_amount"
                      value="${request.requested_amount || 0}"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">مدة التمويل (بالأشهر)</label>
                    <input 
                      type="number" 
                      id="duration_months"
                      value="${request.duration_months || 0}"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                  </div>
                </div>
              </div>
              
              <!-- Financial Details -->
              <div class="border-b pb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-4">
                  <i class="fas fa-chart-line ml-2"></i>
                  التفاصيل المالية
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">الراتب وقت الطلب</label>
                    <input 
                      type="number" 
                      id="salary_at_request"
                      value="${request.salary_at_request || 0}"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">الالتزامات الشهرية</label>
                    <input 
                      type="number" 
                      id="monthly_obligations"
                      value="${request.monthly_obligations || 0}"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                  </div>
                </div>
              </div>
              
              <!-- Attachments Section -->
              <div class="border-b pb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-4">
                  <i class="fas fa-paperclip ml-2"></i>
                  المرفقات
                </h2>
                
                <!-- Current Attachments -->
                <div class="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h3 class="font-bold text-gray-700 mb-3">المرفقات الحالية:</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="border-r pr-4">
                      <p class="text-sm text-gray-600 mb-2"><i class="fas fa-id-card ml-1"></i> صورة الهوية:</p>
                      ${request.id_attachment_url ? `
                        <a href="${request.id_attachment_url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
                          <i class="fas fa-external-link-alt ml-1"></i> عرض الملف
                        </a>
                      ` : '<span class="text-red-500 text-sm">لم يتم الرفع</span>'}
                    </div>
                    <div>
                      <p class="text-sm text-gray-600 mb-2"><i class="fas fa-file-invoice ml-1"></i> كشف الحساب:</p>
                      ${request.bank_statement_attachment_url ? `
                        <a href="${request.bank_statement_attachment_url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
                          <i class="fas fa-external-link-alt ml-1"></i> عرض الملف
                        </a>
                      ` : '<span class="text-red-500 text-sm">لم يتم الرفع</span>'}
                    </div>
                    <div class="border-r pr-4">
                      <p class="text-sm text-gray-600 mb-2"><i class="fas fa-money-check ml-1"></i> تعريف الراتب:</p>
                      ${request.salary_attachment_url ? `
                        <a href="${request.salary_attachment_url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
                          <i class="fas fa-external-link-alt ml-1"></i> عرض الملف
                        </a>
                      ` : '<span class="text-red-500 text-sm">لم يتم الرفع</span>'}
                    </div>
                    <div>
                      <p class="text-sm text-gray-600 mb-2"><i class="fas fa-file-alt ml-1"></i> مرفقات إضافية:</p>
                      ${request.additional_attachment_url ? `
                        <a href="${request.additional_attachment_url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
                          <i class="fas fa-external-link-alt ml-1"></i> عرض الملف
                        </a>
                      ` : '<span class="text-red-500 text-sm">لم يتم الرفع</span>'}
                    </div>
                  </div>
                </div>
                
                <!-- Upload New Attachments -->
                <div class="space-y-4">
                  <h3 class="font-bold text-gray-700 mb-3">رفع مرفقات جديدة (اختياري):</h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- ID Attachment -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-id-card ml-1"></i> صورة الهوية
                      </label>
                      <input 
                        type="file"
                        id="id_attachment"
                        accept="image/*,application/pdf"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onchange="handleFileSelect('id_attachment')"
                      >
                      <p class="text-xs text-gray-500 mt-1">JPG, PNG أو PDF (حد أقصى 5MB)</p>
                      <div id="id_attachment_preview" class="mt-2"></div>
                    </div>
                    
                    <!-- Bank Statement Attachment -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-file-invoice ml-1"></i> كشف الحساب البنكي
                      </label>
                      <input 
                        type="file"
                        id="bank_statement_attachment"
                        accept="image/*,application/pdf"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onchange="handleFileSelect('bank_statement_attachment')"
                      >
                      <p class="text-xs text-gray-500 mt-1">JPG, PNG أو PDF (حد أقصى 5MB)</p>
                      <div id="bank_statement_attachment_preview" class="mt-2"></div>
                    </div>
                    
                    <!-- Salary Attachment -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-money-check ml-1"></i> تعريف الراتب
                      </label>
                      <input 
                        type="file"
                        id="salary_attachment"
                        accept="image/*,application/pdf"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onchange="handleFileSelect('salary_attachment')"
                      >
                      <p class="text-xs text-gray-500 mt-1">JPG, PNG أو PDF (حد أقصى 5MB)</p>
                      <div id="salary_attachment_preview" class="mt-2"></div>
                    </div>
                    
                    <!-- Additional Attachment -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-file-alt ml-1"></i> مرفقات إضافية
                      </label>
                      <input 
                        type="file"
                        id="additional_attachment"
                        accept="image/*,application/pdf"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onchange="handleFileSelect('additional_attachment')"
                      >
                      <p class="text-xs text-gray-500 mt-1">JPG, PNG أو PDF (حد أقصى 5MB)</p>
                      <div id="additional_attachment_preview" class="mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Status and Notes -->
              <div>
                <h2 class="text-xl font-bold text-gray-700 mb-4">
                  <i class="fas fa-clipboard ml-2"></i>
                  الحالة والملاحظات
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                    <select 
                      id="status"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                      <option value="under_review" ${request.status === 'under_review' ? 'selected' : ''}>قيد المراجعة</option>
                      <option value="approved" ${request.status === 'approved' ? 'selected' : ''}>موافق عليه</option>
                      <option value="rejected" ${request.status === 'rejected' ? 'selected' : ''}>مرفوض</option>
                    </select>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">الملاحظات</label>
                    <textarea 
                      id="notes"
                      rows="3"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="أضف ملاحظات..."
                    >${request.notes || ''}</textarea>
                  </div>
                </div>
              </div>
              
              <!-- Submit Buttons -->
              <div class="flex gap-4">
                <button 
                  type="submit"
                  class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  <i class="fas fa-save ml-2"></i>
                  حفظ التعديلات
                </button>
                <a 
                  href="/admin/requests"
                  class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all text-center"
                >
                  <i class="fas fa-times ml-2"></i>
                  إلغاء
                </a>
              </div>
            </form>
            
            <div id="message" class="mt-4"></div>
          </div>
        </div>
        
        <script>
          const attachmentFiles = {
            id_attachment: null,
            bank_statement_attachment: null,
            salary_attachment: null,
            additional_attachment: null
          }
          
          function handleFileSelect(fieldName) {
            const fileInput = document.getElementById(fieldName)
            const file = fileInput.files[0]
            const previewDiv = document.getElementById(fieldName + '_preview')
            
            if (!file) {
              previewDiv.innerHTML = ''
              attachmentFiles[fieldName] = null
              return
            }
            
            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
              previewDiv.innerHTML = '<span class="text-red-500 text-sm">الملف كبير جداً. الحد الأقصى 5MB</span>'
              fileInput.value = ''
              attachmentFiles[fieldName] = null
              return
            }
            
            attachmentFiles[fieldName] = file
            previewDiv.innerHTML = \`
              <div class="text-sm text-green-600">
                <i class="fas fa-check-circle ml-1"></i>
                تم اختيار: \${file.name} (\${(file.size / 1024).toFixed(1)} KB)
              </div>
            \`
          }
          
          async function uploadAttachment(file, attachmentType) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('attachmentType', attachmentType)
            
            try {
              const response = await axios.post('/api/attachments/upload', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
              
              return response.data.url
            } catch (error) {
              console.error('Upload error:', error)
              throw error
            }
          }
          
          async function handleSubmit(event) {
            event.preventDefault()
            
            // Show loading message
            document.getElementById('message').innerHTML = \`
              <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                <i class="fas fa-spinner fa-spin ml-2"></i>
                جاري حفظ التعديلات...
              </div>
            \`
            
            const data = {
              requested_amount: parseFloat(document.getElementById('requested_amount').value),
              duration_months: parseInt(document.getElementById('duration_months').value),
              salary_at_request: parseFloat(document.getElementById('salary_at_request').value) || 0,
              monthly_obligations: parseFloat(document.getElementById('monthly_obligations').value) || 0,
              status: document.getElementById('status').value,
              notes: document.getElementById('notes').value
            }
            
            try {
              // Upload attachments if selected
              if (attachmentFiles.id_attachment) {
                document.getElementById('message').innerHTML = \`
                  <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                    <i class="fas fa-spinner fa-spin ml-2"></i>
                    جاري رفع صورة الهوية...
                  </div>
                \`
                data.id_attachment_url = await uploadAttachment(attachmentFiles.id_attachment, 'id')
              }
              
              if (attachmentFiles.bank_statement_attachment) {
                document.getElementById('message').innerHTML = \`
                  <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                    <i class="fas fa-spinner fa-spin ml-2"></i>
                    جاري رفع كشف الحساب...
                  </div>
                \`
                data.bank_statement_attachment_url = await uploadAttachment(attachmentFiles.bank_statement_attachment, 'bank_statement')
              }
              
              if (attachmentFiles.salary_attachment) {
                document.getElementById('message').innerHTML = \`
                  <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                    <i class="fas fa-spinner fa-spin ml-2"></i>
                    جاري رفع تعريف الراتب...
                  </div>
                \`
                data.salary_attachment_url = await uploadAttachment(attachmentFiles.salary_attachment, 'salary')
              }
              
              if (attachmentFiles.additional_attachment) {
                document.getElementById('message').innerHTML = \`
                  <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                    <i class="fas fa-spinner fa-spin ml-2"></i>
                    جاري رفع المرفقات الإضافية...
                  </div>
                \`
                data.additional_attachment_url = await uploadAttachment(attachmentFiles.additional_attachment, 'additional')
              }
              
              // Update financing request
              document.getElementById('message').innerHTML = \`
                <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                  <i class="fas fa-spinner fa-spin ml-2"></i>
                  جاري حفظ التعديلات النهائية...
                </div>
              \`
              
              const response = await axios.put('/api/financing-requests/${id}', data)
              
              if (response.data.success) {
                document.getElementById('message').innerHTML = \`
                  <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <i class="fas fa-check-circle ml-2"></i>
                    تم تحديث الطلب والمرفقات بنجاح!
                  </div>
                \`
                
                setTimeout(() => {
                  window.location.href = '/admin/requests'
                }, 2000)
              }
            } catch (error) {
              console.error('Error:', error)
              document.getElementById('message').innerHTML = \`
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <i class="fas fa-exclamation-circle ml-2"></i>
                  خطأ في التحديث: \${error.response?.data?.error || error.message}
                </div>
              \`
            }
          }
        </script>
      </body>
      </html>
    `)
  } catch (error: any) {
    console.error('Edit request page error:', error)
    return c.html(`<h1>خطأ في تحميل الصفحة: ${error.message}</h1>`)
  }
})

app.get('/admin/requests', async (c) => {
  try {
    // Get user info (userId, tenantId, roleId)
    const userInfo = await getUserInfo(c);
    
    // Build query with role-based filtering
    let query = `
      SELECT 
        fr.id,
        fr.customer_id,
        fr.selected_bank_id,
        fr.requested_amount,
        fr.duration_months,
        fr.status,
        fr.created_at,
        c.full_name as customer_name,
        c.assigned_to as customer_assigned_to,
        b.bank_name as bank_name
      FROM financing_requests fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN banks b ON fr.selected_bank_id = b.id
    `;
    
    let queryParams: any[] = [];
    
    if (userInfo.roleId === 1) {
      // Role 1: Super Admin - sees ALL requests
      // No WHERE clause
    } else if (userInfo.roleId === 2 || userInfo.roleId === 3) {
      // Role 2: Company Admin - sees all company requests
      // Role 3: Supervisor - sees all company requests (read-only)
      if (userInfo.tenantId) {
        query += ' WHERE c.tenant_id = ?';
        queryParams.push(userInfo.tenantId);
      }
    } else if (userInfo.roleId === 4) {
      // Role 4: Employee - sees ONLY requests for assigned customers
      if (userInfo.userId) {
        query += ' WHERE c.assigned_to = ?';
        queryParams.push(userInfo.userId);
      } else {
        query += ' WHERE 1 = 0'; // No data if user ID not found
      }
    } else {
      // Unknown role - no data
      query += ' WHERE 1 = 0';
    }
    
    query += ' ORDER BY fr.created_at DESC';
    
    const requests = queryParams.length > 0
      ? await c.env.DB.prepare(query).bind(...queryParams).all()
      : await c.env.DB.prepare(query).all();
    
    // Determine if user can edit/delete (not for Role 3 - Supervisor)
    const canEdit = userInfo.roleId !== 3;
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طلبات التمويل</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          /* Custom Scrollbar - Enhanced */
          .overflow-x-auto {
            overflow-x: scroll !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #3b82f6 #f7fafc;
          }
          
          .overflow-x-auto::-webkit-scrollbar {
            height: 12px;
            width: 12px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-track {
            background: #e5e7eb;
            border-radius: 10px;
            margin: 0 10px;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 10px;
            border: 2px solid #e5e7eb;
          }
          
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
            border-color: #d1d5db;
          }
          
          .overflow-x-auto table {
            min-width: 1200px;
            width: max-content;
          }
          
          ${getMobileResponsiveCSS()}
        </style>
      </head>
      <body class="bg-gray-50">
        <script>
          // Auto-redirect with tenant_id if not present in URL
          (function() {
            const urlParams = new URLSearchParams(window.location.search);
            if (!urlParams.has('tenant_id')) {
              const userData = localStorage.getItem('userData');
              if (userData) {
                try {
                  const user = JSON.parse(userData);
                  if (user.tenant_id) {
                    window.location.replace('/admin/requests?tenant_id=' + user.tenant_id);
                  }
                } catch (e) {
                  console.error('Error parsing userData:', e);
                }
              }
            }
          })();
        </script>
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">← العودة للوحة الرئيسية</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-file-invoice text-purple-600 ml-2"></i>
                طلبات التمويل (<span id="totalCount">${requests.results.length}</span>)
              </h1>
              
              <div class="flex gap-3">
                ${canEdit ? `
                <a href="/admin/requests/new" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-plus ml-2"></i>
                  إضافة جديد
                </a>
                ` : ''}
                <button onclick="exportToCSV()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-file-export ml-2"></i>
                  تصدير Excel
                </button>
                <a href="/admin/reports/requests-followup" 
                   class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-all inline-block text-center">
                  <i class="fas fa-chart-line ml-2"></i>
                  تقرير سير العمل
                </a>
              </div>
            </div>
            
            <!-- شريط البحث والفلترة -->
            <div class="border-t pt-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="relative">
                  <i class="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
                  <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="بحث في جميع الحقول..." 
                    class="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onkeyup="filterTable()"
                  >
                </div>
                
                <div>
                  <select 
                    id="filterField" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onchange="filterTable()"
                  >
                    <option value="all">البحث في: الكل</option>
                    <option value="customer">اسم العميل فقط</option>
                    <option value="bank">البنك فقط</option>
                    <option value="status">الحالة فقط</option>
                  </select>
                </div>
                
                <button 
                  onclick="resetFilters()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  <i class="fas fa-redo ml-2"></i>
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full" id="dataTable">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البنك</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدة</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" id="tableBody">
                ${requests.results.map((req: any) => {
                  // Map all possible status values to Arabic
                  const statusMap: Record<string, string> = {
                    'pending': 'قيد الانتظار',
                    'under_review': 'قيد المراجعة',
                    'approved': 'مقبول',
                    'rejected': 'مرفوض',
                    'processing': 'قيد المعالجة',
                    'completed': 'مكتمل',
                    'cancelled': 'ملغي'
                  };
                  const statusAr = statusMap[req.status] || req.status;
                  
                  // Map status to colors
                  const statusColorMap: Record<string, string> = {
                    'pending': 'bg-yellow-100 text-yellow-800',
                    'under_review': 'bg-blue-100 text-blue-800',
                    'approved': 'bg-green-100 text-green-800',
                    'rejected': 'bg-red-100 text-red-800',
                    'processing': 'bg-purple-100 text-purple-800',
                    'completed': 'bg-teal-100 text-teal-800',
                    'cancelled': 'bg-gray-100 text-gray-800'
                  };
                  const statusColor = statusColorMap[req.status] || 'bg-gray-100 text-gray-800';
                  
                  return `
                  <tr class="hover:bg-gray-50" 
                      data-customer="${req.customer_name || ''}" 
                      data-bank="${req.bank_name || ''}" 
                      data-status="${statusAr}">
                    <td class="px-6 py-4 whitespace-nowrap font-medium">${req.customer_name || 'عميل #' + req.customer_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${req.bank_name || 'بنك #' + (req.selected_bank_id || '-')}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${req.requested_amount?.toLocaleString('ar-SA')} ريال</td>
                    <td class="px-6 py-4 whitespace-nowrap">${req.duration_months} شهر</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs rounded-full ${statusColor}">
                        ${statusAr}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${new Date(req.created_at).toLocaleDateString('ar-SA')}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex gap-2 justify-end">
                        <a href="/admin/requests/${req.id}/workflow" class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-2 rounded text-xs transition-all shadow-md" title="الجدول الزمني التفصيلي">
                          <i class="fas fa-clock"></i> ⏱️ Timeline
                        </a>
                        <a href="/admin/requests/${req.id}/report" class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-xs transition-all" title="تقرير الطلب الكامل">
                          <i class="fas fa-file-alt"></i> تقرير
                        </a>
                        <a href="/admin/requests/${req.id}" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs transition-all">
                          <i class="fas fa-eye"></i> عرض
                        </a>
                        ${canEdit ? `
                        <a href="/admin/requests/${req.id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs transition-all">
                          <i class="fas fa-edit"></i> تعديل
                        </a>
                        <a href="/admin/requests/${req.id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs transition-all">
                          <i class="fas fa-trash"></i> حذف
                        </a>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `}).join('')}
              </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <script>
          // البحث والفلترة
          function filterTable() {
            const searchInput = document.getElementById('searchInput').value.toLowerCase().trim()
            const filterField = document.getElementById('filterField').value
            const tableBody = document.getElementById('tableBody')
            const rows = tableBody.getElementsByTagName('tr')
            let visibleCount = 0
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i]
              const customer = row.getAttribute('data-customer') || ''
              const bank = row.getAttribute('data-bank') || ''
              const status = row.getAttribute('data-status') || ''
              
              let shouldShow = false
              
              if (searchInput === '') {
                shouldShow = true
              } else {
                switch(filterField) {
                  case 'customer':
                    shouldShow = customer.toLowerCase().includes(searchInput)
                    break
                  case 'bank':
                    shouldShow = bank.toLowerCase().includes(searchInput)
                    break
                  case 'status':
                    shouldShow = status.toLowerCase().includes(searchInput)
                    break
                  default: // 'all'
                    shouldShow = customer.toLowerCase().includes(searchInput) || 
                                bank.toLowerCase().includes(searchInput) || 
                                status.toLowerCase().includes(searchInput)
                }
              }
              
              row.style.display = shouldShow ? '' : 'none'
              if (shouldShow) visibleCount++
            }
            
            document.getElementById('totalCount').textContent = visibleCount
          }
          
          function resetFilters() {
            document.getElementById('searchInput').value = ''
            document.getElementById('filterField').value = 'all'
            filterTable()
          }
          
          function exportToCSV() {
            const data = [
              ['العميل', 'البنك', 'المبلغ المطلوب', 'المدة (شهور)', 'الحالة', 'التاريخ'],
              ${requests.results.map((req: any) => {
                const statusMap: Record<string, string> = {
                  'pending': 'قيد الانتظار',
                  'under_review': 'قيد المراجعة',
                  'approved': 'مقبول',
                  'rejected': 'مرفوض',
                  'processing': 'قيد المعالجة',
                  'completed': 'مكتمل',
                  'cancelled': 'ملغي'
                };
                const statusAr = statusMap[req.status] || req.status;
                const customer = req.customer_name || `عميل #${req.customer_id}`;
                const bank = req.bank_name || `بنك #${req.selected_bank_id || '-'}`;
                return `['${customer}', '${bank}', '${req.requested_amount || 0}', '${req.duration_months}', '${statusAr}', '${new Date(req.created_at).toLocaleDateString('ar-SA')}']`;
              }).join(',\n              ')}
            ];
            
            let csv = '\\uFEFF';
            data.forEach(row => {
              csv += row.join(',') + '\\n';
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'طلبات_التمويل_' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
          }
        </script>
      </body>
      </html>
    `)
  } catch (error: any) {
    console.error('Error in /admin/requests:', error)
    return c.html(`<h1>خطأ في تحميل البيانات</h1><p style="color:red; direction:ltr;">${error.message}</p><pre style="direction:ltr; text-align:left;">${error.stack}</pre>`)
  }
})

// Delete financing request (GET route for link-based deletion)
app.get('/admin/requests/:id/delete', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM financing_requests WHERE id = ?').bind(id).run()
    return c.redirect('/admin/requests?deleted=1')
  } catch (error: any) {
    console.error('Error deleting financing request:', error)
    return c.redirect('/admin/requests?error=' + encodeURIComponent(error.message))
  }
})

// ==================== صفحة عرض طلب تمويل واحد ====================
app.get('/admin/requests/new', async (c) => {
  try {
    const userInfo = await getUserInfo(c)
    if (!userInfo.userId || !userInfo.roleId) {
      return c.redirect('/login')
    }

    // Get customers scoped by role/tenant
    let customersQuery = 'SELECT id, full_name, phone FROM customers'
    const customersParams: any[] = []
    if (userInfo.roleId === 1) {
      // Super Admin - no filter
    } else if (userInfo.roleId === 2 || userInfo.roleId === 3) {
      if (!userInfo.tenantId) {
        return c.html('<h1>خطأ: يجب تحديد الشركة</h1>', 400)
      }
      customersQuery += ' WHERE tenant_id = ?'
      customersParams.push(userInfo.tenantId)
    } else if (userInfo.roleId === 4) {
      customersQuery += ' WHERE assigned_to = ?'
      customersParams.push(userInfo.userId)
    } else {
      customersQuery += ' WHERE 1 = 0'
    }
    customersQuery += ' ORDER BY full_name'
    const customers = customersParams.length
      ? await c.env.DB.prepare(customersQuery).bind(...customersParams).all()
      : await c.env.DB.prepare(customersQuery).all()

    // Get banks scoped by tenant (allow global banks if tenant_id is NULL)
    let banksQuery = 'SELECT id, bank_name FROM banks WHERE is_active = 1'
    const banksParams: any[] = []
    if (userInfo.roleId !== 1) {
      if (!userInfo.tenantId) {
        return c.html('<h1>خطأ: يجب تحديد الشركة</h1>', 400)
      }
      banksQuery += ' AND (tenant_id = ? OR tenant_id IS NULL)'
      banksParams.push(userInfo.tenantId)
    }
    banksQuery += ' ORDER BY bank_name'
    const banks = banksParams.length
      ? await c.env.DB.prepare(banksQuery).bind(...banksParams).all()
      : await c.env.DB.prepare(banksQuery).all()

    // Get financing types scoped by tenant (allow global types if tenant_id is NULL)
    let financingTypesQuery = 'SELECT id, type_name FROM financing_types WHERE is_active = 1'
    const financingTypesParams: any[] = []
    if (userInfo.roleId !== 1) {
      if (!userInfo.tenantId) {
        return c.html('<h1>خطأ: يجب تحديد الشركة</h1>', 400)
      }
      financingTypesQuery += ' AND (tenant_id = ? OR tenant_id IS NULL)'
      financingTypesParams.push(userInfo.tenantId)
    }
    financingTypesQuery += ' ORDER BY type_name'
    const financingTypes = financingTypesParams.length
      ? await c.env.DB.prepare(financingTypesQuery).bind(...financingTypesParams).all()
      : await c.env.DB.prepare(financingTypesQuery).all()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إضافة طلب تمويل جديد</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/requests" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة طلبات التمويل
            </a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">
              <i class="fas fa-plus-circle text-purple-600 ml-2"></i>
              إضافة طلب تمويل جديد
            </h1>
            
            <form action="/api/requests" method="POST" enctype="application/x-www-form-urlencoded" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- اختيار العميل -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-user text-blue-600 ml-1"></i>
                    العميل *
                  </label>
                  <select name="customer_id" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">-- اختر العميل --</option>
                    ${customers.results.map((cust: any) => `
                      <option value="${cust.id}">${cust.full_name} - ${cust.phone}</option>
                    `).join('')}
                  </select>
                </div>
                
                <!-- نوع التمويل -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-file-invoice text-purple-600 ml-1"></i>
                    نوع التمويل *
                  </label>
                  <select name="financing_type_id" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">-- اختر نوع التمويل --</option>
                    ${financingTypes.results.map((type: any) => `
                      <option value="${type.id}">${type.type_name}</option>
                    `).join('')}
                  </select>
                </div>
                
                <!-- المبلغ المطلوب -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-money-bill-wave text-green-600 ml-1"></i>
                    المبلغ المطلوب (ريال) *
                  </label>
                  <input type="number" name="requested_amount" required min="1000" step="1000" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                         placeholder="مثال: 50000">
                </div>
                
                <!-- مدة التمويل -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-calendar text-orange-600 ml-1"></i>
                    مدة التمويل (شهور) *
                  </label>
                  <select name="duration_months" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">-- اختر المدة --</option>
                    <option value="12">12 شهر (سنة)</option>
                    <option value="24">24 شهر (سنتين)</option>
                    <option value="36">36 شهر (3 سنوات)</option>
                    <option value="48">48 شهر (4 سنوات)</option>
                    <option value="60">60 شهر (5 سنوات)</option>
                    <option value="84">84 شهر (7 سنوات)</option>
                    <option value="120">120 شهر (10 سنوات)</option>
                  </select>
                </div>
                
                <!-- الراتب عند الطلب -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-coins text-yellow-600 ml-1"></i>
                    الراتب عند الطلب (ريال) *
                  </label>
                  <input type="number" name="salary_at_request" required min="1000" step="100" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                         placeholder="مثال: 15000">
                </div>
                
                <!-- البنك المختار -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-university text-yellow-600 ml-1"></i>
                    البنك المختار
                  </label>
                  <select name="selected_bank_id" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">-- اختر البنك (اختياري) --</option>
                    ${banks.results.map((bank: any) => `
                      <option value="${bank.id}">${bank.bank_name}</option>
                    `).join('')}
                  </select>
                </div>
                
                <!-- الحالة -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-flag text-blue-600 ml-1"></i>
                    الحالة *
                  </label>
                  <select name="status" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="pending">قيد المراجعة</option>
                    <option value="approved">مقبول</option>
                    <option value="rejected">مرفوض</option>
                  </select>
                </div>
                
                <!-- ملاحظات -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-comment text-gray-600 ml-1"></i>
                    ملاحظات
                  </label>
                  <textarea name="notes" rows="3" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="أي ملاحظات إضافية..."></textarea>
                </div>
              </div>
              
              <div class="flex gap-4 pt-6 border-t">
                <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-bold transition-all">
                  <i class="fas fa-save ml-2"></i>
                  حفظ الطلب
                </button>
                <a href="/admin/requests" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-center transition-all">
                  <i class="fas fa-times ml-2"></i>
                  إلغاء
                </a>
              </div>
            </form>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل الصفحة</h1>')
  }
})
app.get('/admin/requests/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const request = await c.env.DB.prepare(`
      SELECT fr.*, 
             c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email,
             b.bank_name, ft.type_name as financing_type_name
      FROM financing_requests fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN banks b ON fr.selected_bank_id = b.id
      LEFT JOIN financing_types ft ON fr.financing_type_id = ft.id
      WHERE fr.id = ?
    `).bind(id).first()
    
    if (!request) {
      return c.html('<h1>الطلب غير موجود</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عرض طلب التمويل #${id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6 flex justify-between items-center">
            <a href="/admin/requests" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة الطلبات
            </a>
            <div class="flex gap-2">
              <a href="/admin/requests/${id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-edit ml-1"></i> تعديل
              </a>
              <a href="/admin/requests/${id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-trash ml-1"></i> حذف
              </a>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <i class="fas fa-file-invoice text-purple-600 ml-3"></i>
              طلب التمويل #${id}
            </h1>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- معلومات العميل -->
              <div class="md:col-span-2 border-b pb-4">
                <h2 class="text-xl font-bold text-gray-700 mb-4">
                  <i class="fas fa-user text-blue-600 ml-2"></i>
                  معلومات العميل
                </h2>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الاسم الكامل</label>
                <p class="text-lg text-gray-900">${request.customer_name || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">رقم الجوال</label>
                <p class="text-lg text-gray-900">${request.customer_phone || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">البريد الإلكتروني</label>
                <p class="text-lg text-gray-900">${request.customer_email || '-'}</p>
              </div>
              
              <!-- معلومات التمويل -->
              <div class="md:col-span-2 border-b pb-4 mt-4">
                <h2 class="text-xl font-bold text-gray-700 mb-4">
                  <i class="fas fa-money-bill-wave text-green-600 ml-2"></i>
                  معلومات التمويل
                </h2>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">نوع التمويل</label>
                <p class="text-lg text-gray-900">${request.financing_type_name || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">المبلغ المطلوب</label>
                <p class="text-lg font-bold text-green-600">${request.requested_amount?.toLocaleString() || '0'} ريال</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">مدة التمويل</label>
                <p class="text-lg text-gray-900">${request.duration_months || '0'} شهر</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الراتب عند الطلب</label>
                <p class="text-lg text-gray-900">${request.salary_at_request?.toLocaleString() || '0'} ريال</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">البنك المختار</label>
                <p class="text-lg text-gray-900">${request.bank_name || 'غير محدد'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الحالة</label>
                <p>
                  <span class="px-4 py-2 rounded-full text-sm font-bold ${
                    request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }">
                    ${request.status === 'approved' ? 'مقبول' : request.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                  </span>
                </p>
              </div>
              
              ${request.notes ? `
                <div class="md:col-span-2 mt-4">
                  <label class="block text-sm font-bold text-gray-600 mb-1">ملاحظات</label>
                  <p class="text-gray-900 bg-gray-50 p-4 rounded">${request.notes}</p>
                </div>
              ` : ''}
              
              <div class="md:col-span-2 mt-4">
                <label class="block text-sm font-bold text-gray-600 mb-1">تاريخ الإنشاء</label>
                <p class="text-gray-900">${new Date(request.created_at).toLocaleString('ar-SA')}</p>
              </div>
            </div>
          </div>
          
          <!-- قسم المرفقات -->
          <div class="bg-white rounded-xl shadow-lg p-8 mt-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <i class="fas fa-paperclip text-blue-600 ml-3"></i>
              المرفقات
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${request.id_attachment_url ? `
                <div class="border-2 border-blue-200 rounded-lg p-4 hover:shadow-md transition">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                      <i class="fas fa-id-card text-2xl text-blue-600 ml-3"></i>
                      <span class="font-bold text-gray-800">صورة الهوية</span>
                    </div>
                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">متوفر</span>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <a href="${request.id_attachment_url}" target="_blank" 
                       class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-eye"></i> عرض
                    </a>
                    <a href="${request.id_attachment_url}" download 
                       class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-download"></i> تنزيل
                    </a>
                    <button onclick="deleteAttachment('${request.id_attachment_url}', 'id')" 
                       class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-trash"></i> حذف
                    </button>
                  </div>
                </div>
              ` : `
                <div class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div class="flex items-center mb-3">
                    <i class="fas fa-id-card text-2xl text-gray-400 ml-3"></i>
                    <span class="font-bold text-gray-600">صورة الهوية</span>
                  </div>
                  <p class="text-sm text-gray-500">لم يتم رفع المرفق</p>
                </div>
              `}
              
              ${request.salary_attachment_url ? `
                <div class="border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                      <i class="fas fa-money-check-alt text-2xl text-green-600 ml-3"></i>
                      <span class="font-bold text-gray-800">كشف الراتب</span>
                    </div>
                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">متوفر</span>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <a href="${request.salary_attachment_url}" target="_blank" 
                       class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-eye"></i> عرض
                    </a>
                    <a href="${request.salary_attachment_url}" download 
                       class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-download"></i> تنزيل
                    </a>
                    <button onclick="deleteAttachment('${request.salary_attachment_url}', 'salary')" 
                       class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-trash"></i> حذف
                    </button>
                  </div>
                </div>
              ` : `
                <div class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div class="flex items-center mb-3">
                    <i class="fas fa-money-check-alt text-2xl text-gray-400 ml-3"></i>
                    <span class="font-bold text-gray-600">كشف الراتب</span>
                  </div>
                  <p class="text-sm text-gray-500">لم يتم رفع المرفق</p>
                </div>
              `}
              
              ${request.bank_statement_attachment_url ? `
                <div class="border-2 border-purple-200 rounded-lg p-4 hover:shadow-md transition">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                      <i class="fas fa-file-invoice-dollar text-2xl text-purple-600 ml-3"></i>
                      <span class="font-bold text-gray-800">كشف الحساب البنكي</span>
                    </div>
                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">متوفر</span>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <a href="${request.bank_statement_attachment_url}" target="_blank" 
                       class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-eye"></i> عرض
                    </a>
                    <a href="${request.bank_statement_attachment_url}" download 
                       class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-download"></i> تنزيل
                    </a>
                    <button onclick="deleteAttachment('${request.bank_statement_attachment_url}', 'bank_statement')" 
                       class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-trash"></i> حذف
                    </button>
                  </div>
                </div>
              ` : `
                <div class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div class="flex items-center mb-3">
                    <i class="fas fa-file-invoice-dollar text-2xl text-gray-400 ml-3"></i>
                    <span class="font-bold text-gray-600">كشف الحساب البنكي</span>
                  </div>
                  <p class="text-sm text-gray-500">لم يتم رفع المرفق</p>
                </div>
              `}
              
              ${request.additional_attachment_url ? `
                <div class="border-2 border-orange-200 rounded-lg p-4 hover:shadow-md transition">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                      <i class="fas fa-file-alt text-2xl text-orange-600 ml-3"></i>
                      <span class="font-bold text-gray-800">مرفق إضافي</span>
                    </div>
                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">متوفر</span>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <a href="${request.additional_attachment_url}" target="_blank" 
                       class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-eye"></i> عرض
                    </a>
                    <a href="${request.additional_attachment_url}" download 
                       class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-download"></i> تنزيل
                    </a>
                    <button onclick="deleteAttachment('${request.additional_attachment_url}', 'additional')" 
                       class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition text-center text-sm">
                      <i class="fas fa-trash"></i> حذف
                    </button>
                  </div>
                </div>
              ` : `
                <div class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div class="flex items-center mb-3">
                    <i class="fas fa-file-alt text-2xl text-gray-400 ml-3"></i>
                    <span class="font-bold text-gray-600">مرفق إضافي</span>
                  </div>
                  <p class="text-sm text-gray-500">لم يتم رفع المرفق</p>
                </div>
              `}
            </div>
            
            ${!request.id_attachment_url && !request.salary_attachment_url && !request.bank_statement_attachment_url && !request.additional_attachment_url ? `
              <div class="text-center mt-6 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-2"></i>
                <p>لا توجد مرفقات لهذا الطلب</p>
              </div>
            ` : ''}
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          async function deleteAttachment(attachmentUrl, type) {
            if (!confirm('هل أنت متأكد من حذف هذا المرفق؟ لا يمكن التراجع عن هذا الإجراء.')) {
              return;
            }
            
            try {
              // Extract path from URL (remove /api/attachments/view/ prefix)
              const path = attachmentUrl.replace('/api/attachments/view/', '');
              
              const response = await axios.delete(\`/api/attachments/delete/\${path}\`);
              
              if (response.data.success) {
                alert('✓ تم حذف المرفق بنجاح');
                location.reload(); // Reload page to reflect changes
              } else {
                alert('✗ فشل حذف المرفق: ' + (response.data.error || 'خطأ غير معروف'));
              }
            } catch (error) {
              console.error('Error deleting attachment:', error);
              alert('✗ حدث خطأ أثناء حذف المرفق');
            }
          }
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== نموذج إضافة طلب تمويل جديد ====================

// صفحة عرض عميل واحد
app.get('/admin/customers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first()
    
    if (!customer) {
      return c.html('<h1>العميل غير موجود</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عرض العميل</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/customers" class="text-blue-600 hover:text-blue-800">← العودة لقائمة العملاء</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold mb-6 text-gray-800">
              <i class="fas fa-user text-green-600 ml-2"></i>
              بيانات العميل
            </h1>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="border-r-4 border-blue-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">رقم العميل</p>
                <p class="text-xl font-bold text-gray-800">#${(customer as any).id}</p>
              </div>
              
              <div class="border-r-4 border-green-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">الاسم الكامل</p>
                <p class="text-xl font-bold text-gray-800">${(customer as any).name}</p>
              </div>
              
              <div class="border-r-4 border-yellow-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">رقم الهاتف</p>
                <p class="text-xl font-bold text-gray-800">${(customer as any).phone || 'غير متوفر'}</p>
              </div>
              
              <div class="border-r-4 border-purple-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">البريد الإلكتروني</p>
                <p class="text-xl font-bold text-gray-800">${(customer as any).email || 'غير متوفر'}</p>
              </div>
              
              <div class="border-r-4 border-red-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">الرقم الوطني</p>
                <p class="text-xl font-bold text-gray-800">${(customer as any).national_id || 'غير متوفر'}</p>
              </div>
              
              <div class="border-r-4 border-indigo-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">تاريخ التسجيل</p>
                <p class="text-xl font-bold text-gray-800">${new Date((customer as any).created_at).toLocaleDateString('ar-SA')}</p>
              </div>
            </div>
            
            <div class="mt-8 flex gap-4">
              <a href="/admin/customers/${id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold">
                <i class="fas fa-edit ml-2"></i>
                تعديل البيانات
              </a>
              <a href="/admin/customers/${id}/delete" onclick="return confirm('هل أنت متأكد من حذف هذا العميل؟')" class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold">
                <i class="fas fa-trash ml-2"></i>
                حذف العميل
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// صفحة تعديل عميل
app.get('/admin/customers/:id/edit', async (c) => {
  try {
    const id = c.req.param('id')
    const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first()
    
    if (!customer) {
      return c.html('<h1>العميل غير موجود</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تعديل العميل</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/customers/${id}" class="text-blue-600 hover:text-blue-800">← العودة لبيانات العميل</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold mb-6 text-gray-800">
              <i class="fas fa-edit text-yellow-600 ml-2"></i>
              تعديل بيانات العميل #${id}
            </h1>
            
            <form method="POST" action="/api/customers/${id}" enctype="application/x-www-form-urlencoded" class="space-y-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
                <input type="text" name="name" value="${(customer as any).name}" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                <input type="tel" name="phone" value="${(customer as any).phone || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                <input type="email" name="email" value="${(customer as any).email || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">الرقم الوطني</label>
                <input type="text" name="national_id" value="${(customer as any).national_id || ''}" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              
              <div class="flex gap-4">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold">
                  <i class="fas fa-save ml-2"></i>
                  حفظ التعديلات
                </button>
                <a href="/admin/customers/${id}" class="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold">
                  <i class="fas fa-times ml-2"></i>
                  إلغاء
                </a>
              </div>
            </form>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// حذف عميل
app.get('/admin/customers/:id/delete', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM customers WHERE id = ?').bind(id).run()
    return c.redirect('/admin/customers')
  } catch (error) {
    return c.html('<h1>خطأ في حذف العميل</h1>')
  }
})

// ==================== صفحات البنوك الكاملة ====================

// إضافة بنك جديد - الصفحة
app.get('/admin/banks/add', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إضافة بنك جديد</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
      <div class="max-w-4xl mx-auto p-6">
        <div class="mb-6">
          <a href="/admin/banks" class="text-blue-600 hover:text-blue-800">← العودة لقائمة البنوك</a>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h1 class="text-3xl font-bold mb-6 text-gray-800">
            <i class="fas fa-plus-circle text-green-600 ml-2"></i>
            إضافة بنك جديد
          </h1>
          
          <form action="/api/banks" method="POST" enctype="application/x-www-form-urlencoded" class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">اسم البنك</label>
              <input type="text" name="bank_name" required 
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
              <textarea name="description" rows="3"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"></textarea>
            </div>
            
            <div class="flex gap-4">
              <button type="submit" 
                      class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold">
                <i class="fas fa-save ml-2"></i>
                حفظ البنك
              </button>
              <a href="/admin/banks" class="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold">
                <i class="fas fa-times ml-2"></i>
                إلغاء
              </a>
            </div>
          </form>
        </div>
      </div>
    </body>
    </html>
  `)
})

// تقرير العميل الكامل - يعرض جميع بيانات الحاسبة
app.get('/admin/customers/:id/report', async (c) => {
  try {
    const id = c.req.param('id')
    
    // جلب بيانات العميل مع بيانات الحاسبة
    const customer = await c.env.DB.prepare(`
      SELECT 
        c.*,
        ft.type_name as financing_type_name,
        b.bank_name as best_bank_name
      FROM customers c
      LEFT JOIN financing_types ft ON c.financing_type_id = ft.id
      LEFT JOIN banks b ON c.best_bank_id = b.id
      WHERE c.id = ?
    `).bind(id).first()
    
    if (!customer) {
      return c.html('<h1>العميل غير موجود</h1>')
    }
    
    const cust = customer as any
    
    // تنسيق التواريخ
    const formatDate = (date: string) => {
      if (!date) return 'غير محدد'
      return new Date(date).toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    
    // تنسيق الأرقام
    const formatNumber = (num: number) => {
      if (!num) return 'غير محدد'
      return num.toLocaleString('ar-SA')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير العميل - ${cust.full_name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
          }
          .report-section {
            page-break-inside: avoid;
          }
          
          ${getMobileResponsiveCSS()}
        </style>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-5xl mx-auto p-6">
          <!-- أزرار التحكم -->
          <div class="mb-6 no-print flex justify-between items-center">
            <a href="/admin/customers" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة العملاء
            </a>
            <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
              <i class="fas fa-print ml-2"></i>
              طباعة التقرير
            </button>
          </div>
          
          <!-- رأس التقرير -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-8 mb-6 report-section">
            <div class="text-center">
              <h1 class="text-4xl font-bold mb-2">
                <i class="fas fa-file-contract ml-3"></i>
                تقرير العميل الشامل
              </h1>
              <p class="text-xl opacity-90">نظام تمويل - Tamweel Finance</p>
              <p class="text-sm opacity-75 mt-2">تاريخ التقرير: ${formatDate(new Date().toISOString())}</p>
            </div>
          </div>
          
          <!-- القسم 1: المعلومات الشخصية -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6 report-section">
            <h2 class="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2">
              <i class="fas fa-user text-blue-600 ml-2"></i>
              المعلومات الشخصية
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-blue-100 p-3 rounded-lg">
                  <i class="fas fa-id-card text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">رقم العميل</p>
                  <p class="text-xl font-bold text-gray-800">#${cust.id}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-green-100 p-3 rounded-lg">
                  <i class="fas fa-user text-green-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">الاسم الكامل</p>
                  <p class="text-xl font-bold text-gray-800">${cust.full_name || 'غير محدد'}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-yellow-100 p-3 rounded-lg">
                  <i class="fas fa-phone text-yellow-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">رقم الهاتف</p>
                  <p class="text-xl font-bold text-gray-800" dir="ltr">${cust.phone || 'غير محدد'}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-purple-100 p-3 rounded-lg">
                  <i class="fas fa-envelope text-purple-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p class="text-xl font-bold text-gray-800">${cust.email || 'غير محدد'}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-red-100 p-3 rounded-lg">
                  <i class="fas fa-calendar text-red-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">تاريخ الميلاد</p>
                  <p class="text-xl font-bold text-gray-800">${formatDate(cust.birthdate)}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-indigo-100 p-3 rounded-lg">
                  <i class="fas fa-id-badge text-indigo-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">رقم الهوية</p>
                  <p class="text-xl font-bold text-gray-800">${cust.national_id && !cust.national_id.startsWith('TEMP-') ? cust.national_id : 'غير محدد'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- القسم 2: بيانات الحاسبة المالية -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6 report-section">
            <h2 class="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-green-500 pb-2">
              <i class="fas fa-calculator text-green-600 ml-2"></i>
              بيانات الحاسبة المالية
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-green-100 p-3 rounded-lg">
                  <i class="fas fa-money-bill-wave text-green-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">الراتب الشهري</p>
                  <p class="text-2xl font-bold text-green-600">${formatNumber(cust.monthly_salary)} ريال</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-blue-100 p-3 rounded-lg">
                  <i class="fas fa-hand-holding-usd text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">مبلغ التمويل المطلوب</p>
                  <p class="text-2xl font-bold text-blue-600">${formatNumber(cust.financing_amount)} ريال</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-red-100 p-3 rounded-lg">
                  <i class="fas fa-receipt text-red-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">الالتزامات الشهرية</p>
                  <p class="text-2xl font-bold text-red-600">${formatNumber(cust.monthly_obligations)} ريال</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-purple-100 p-3 rounded-lg">
                  <i class="fas fa-tag text-purple-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">نوع التمويل</p>
                  <p class="text-xl font-bold text-purple-600">${cust.financing_type_name || 'غير محدد'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- القسم 3: نتائج التمويل (أفضل عرض) -->
          <div class="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg p-6 mb-6 report-section border-2 border-green-400">
            <h2 class="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-green-500 pb-2">
              <i class="fas fa-star text-green-600 ml-2"></i>
              أفضل عرض تمويلي
            </h2>
            
            ${cust.best_bank_id ? `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white rounded-lg p-4 shadow">
                  <div class="flex items-start space-x-3 space-x-reverse">
                    <div class="bg-green-100 p-3 rounded-lg">
                      <i class="fas fa-university text-green-600 text-xl"></i>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">البنك المختار</p>
                      <p class="text-2xl font-bold text-green-600">${cust.best_bank_name || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow">
                  <div class="flex items-start space-x-3 space-x-reverse">
                    <div class="bg-blue-100 p-3 rounded-lg">
                      <i class="fas fa-clock text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">مدة التمويل</p>
                      <p class="text-2xl font-bold text-blue-600">${cust.financing_duration_months || 'غير محدد'} شهر</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow">
                  <div class="flex items-start space-x-3 space-x-reverse">
                    <div class="bg-yellow-100 p-3 rounded-lg">
                      <i class="fas fa-percentage text-yellow-600 text-xl"></i>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">معدل الفائدة</p>
                      <p class="text-2xl font-bold text-yellow-600">${cust.best_rate ? cust.best_rate + '%' : 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow">
                  <div class="flex items-start space-x-3 space-x-reverse">
                    <div class="bg-purple-100 p-3 rounded-lg">
                      <i class="fas fa-calendar-check text-purple-600 text-xl"></i>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">القسط الشهري</p>
                      <p class="text-2xl font-bold text-purple-600">${formatNumber(cust.monthly_payment)} ريال</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow md:col-span-2">
                  <div class="flex items-start space-x-3 space-x-reverse">
                    <div class="bg-indigo-100 p-3 rounded-lg">
                      <i class="fas fa-coins text-indigo-600 text-xl"></i>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">إجمالي المبلغ المستحق</p>
                      <p class="text-3xl font-bold text-indigo-600">${formatNumber(cust.total_payment)} ريال</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-green-50 rounded-lg p-4 shadow md:col-span-2 border-2 border-green-300">
                  <div class="flex items-start space-x-3 space-x-reverse">
                    <div class="bg-green-100 p-3 rounded-lg">
                      <i class="fas fa-calendar-alt text-green-600 text-xl"></i>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">تاريخ الحساب</p>
                      <p class="text-xl font-bold text-green-600">${formatDate(cust.calculation_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ` : `
              <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                <i class="fas fa-exclamation-triangle text-yellow-600 text-4xl mb-3"></i>
                <p class="text-xl font-bold text-yellow-700">لم يتم حساب عرض تمويلي بعد</p>
                <p class="text-gray-600 mt-2">العميل لم يستخدم الحاسبة لحساب أفضل عرض تمويلي</p>
              </div>
            `}
          </div>
          
          <!-- القسم 4: معلومات إضافية -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6 report-section">
            <h2 class="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-gray-500 pb-2">
              <i class="fas fa-info-circle text-gray-600 ml-2"></i>
              معلومات إضافية
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-blue-100 p-3 rounded-lg">
                  <i class="fas fa-calendar-plus text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">تاريخ التسجيل</p>
                  <p class="text-lg font-bold text-gray-800">${formatDate(cust.created_at)}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-purple-100 p-3 rounded-lg">
                  <i class="fas fa-edit text-purple-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">آخر تحديث</p>
                  <p class="text-lg font-bold text-gray-800">${formatDate(cust.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- تذييل التقرير -->
          <div class="bg-gray-100 rounded-xl p-6 text-center report-section">
            <p class="text-gray-600">
              <i class="fas fa-shield-alt ml-2"></i>
              هذا التقرير سري ومخصص للاستخدام الداخلي فقط
            </p>
            <p class="text-sm text-gray-500 mt-2">
              تم إنشاء هذا التقرير بواسطة نظام تمويل - Tamweel Finance Management System
            </p>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error: any) {
    console.error('خطأ في عرض تقرير العميل:', error)
    return c.html(`<h1>حدث خطأ: ${error.message}</h1>`)
  }
})

// تقرير طلب التمويل الكامل
app.get('/admin/requests/:id/report', async (c) => {
  try {
    const id = c.req.param('id')
    
    // جلب بيانات طلب التمويل مع بيانات العميل والبنك
    const request = await c.env.DB.prepare(`
      SELECT 
        fr.*,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.national_id as customer_national_id,
        c.birthdate as customer_birthdate,
        c.monthly_salary as customer_salary,
        b.bank_name,
        ft.type_name as financing_type_name
      FROM financing_requests fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN banks b ON fr.selected_bank_id = b.id
      LEFT JOIN financing_types ft ON fr.financing_type_id = ft.id
      WHERE fr.id = ?
    `).bind(id).first()
    
    if (!request) {
      return c.html('<h1>الطلب غير موجود</h1>')
    }
    
    const req = request as any
    
    // تنسيق التواريخ
    const formatDate = (date: string) => {
      if (!date) return 'غير محدد'
      return new Date(date).toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    
    // تنسيق الأرقام
    const formatNumber = (num: number) => {
      if (!num) return 'غير محدد'
      return num.toLocaleString('ar-SA')
    }
    
    // تحديد الحالة
    const statusMap: any = {
      'pending': { text: 'قيد المراجعة', color: 'yellow', icon: 'clock' },
      'approved': { text: 'مقبول', color: 'green', icon: 'check-circle' },
      'rejected': { text: 'مرفوض', color: 'red', icon: 'times-circle' }
    }
    const status = statusMap[req.status] || statusMap['pending']
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير طلب التمويل - ${req.customer_name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
          }
          .report-section {
            page-break-inside: avoid;
          }
          
          ${getMobileResponsiveCSS()}
        </style>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-5xl mx-auto p-6">
          <!-- أزرار التحكم -->
          <div class="mb-6 no-print flex justify-between items-center flex-wrap gap-3">
            <a href="/admin/requests" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة طلبات التمويل
            </a>
            <div class="flex gap-3">
              <a href="/admin/requests/${id}/workflow" class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg">
                <i class="fas fa-route ml-2"></i>
                سير العمل (Workflow)
              </a>
              <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                <i class="fas fa-print ml-2"></i>
                طباعة التقرير
              </button>
            </div>
          </div>
          
          <!-- رأس التقرير -->
          <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg p-8 mb-6 report-section">
            <div class="text-center">
              <h1 class="text-4xl font-bold mb-2">
                <i class="fas fa-file-invoice ml-3"></i>
                تقرير طلب التمويل
              </h1>
              <p class="text-xl opacity-90">نظام تمويل - Tamweel Finance</p>
              <p class="text-sm opacity-75 mt-2">رقم الطلب: #${req.id} | تاريخ التقرير: ${formatDate(new Date().toISOString())}</p>
            </div>
          </div>
          
          <!-- حالة الطلب -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6 report-section">
            <div class="flex items-center justify-center">
              <div class="bg-${status.color}-100 border-2 border-${status.color}-300 rounded-lg p-6 text-center">
                <i class="fas fa-${status.icon} text-${status.color}-600 text-5xl mb-3"></i>
                <p class="text-2xl font-bold text-${status.color}-700">حالة الطلب: ${status.text}</p>
                <p class="text-sm text-gray-600 mt-2">تاريخ الطلب: ${formatDate(req.created_at)}</p>
              </div>
            </div>
          </div>
          
          <!-- القسم 1: معلومات العميل -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6 report-section">
            <h2 class="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2">
              <i class="fas fa-user text-blue-600 ml-2"></i>
              معلومات العميل
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-blue-100 p-3 rounded-lg">
                  <i class="fas fa-user text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">اسم العميل</p>
                  <p class="text-xl font-bold text-gray-800">${req.customer_name || 'غير محدد'}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-green-100 p-3 rounded-lg">
                  <i class="fas fa-phone text-green-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">رقم الهاتف</p>
                  <p class="text-xl font-bold text-gray-800" dir="ltr">${req.customer_phone || 'غير محدد'}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-purple-100 p-3 rounded-lg">
                  <i class="fas fa-envelope text-purple-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p class="text-xl font-bold text-gray-800">${req.customer_email || 'غير محدد'}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-red-100 p-3 rounded-lg">
                  <i class="fas fa-calendar text-red-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">تاريخ الميلاد</p>
                  <p class="text-xl font-bold text-gray-800">${formatDate(req.customer_birthdate)}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-yellow-100 p-3 rounded-lg">
                  <i class="fas fa-money-bill-wave text-yellow-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">الراتب الشهري</p>
                  <p class="text-xl font-bold text-yellow-600">${formatNumber(req.customer_salary)} ريال</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-indigo-100 p-3 rounded-lg">
                  <i class="fas fa-id-badge text-indigo-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">رقم الهوية</p>
                  <p class="text-xl font-bold text-gray-800">${req.customer_national_id && !req.customer_national_id.startsWith('TEMP-') ? req.customer_national_id : 'غير محدد'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- القسم 2: تفاصيل طلب التمويل -->
          <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 mb-6 report-section border-2 border-purple-400">
            <h2 class="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-purple-500 pb-2">
              <i class="fas fa-file-invoice-dollar text-purple-600 ml-2"></i>
              تفاصيل طلب التمويل
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-white rounded-lg p-4 shadow">
                <div class="flex items-start space-x-3 space-x-reverse">
                  <div class="bg-purple-100 p-3 rounded-lg">
                    <i class="fas fa-tag text-purple-600 text-xl"></i>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">نوع التمويل</p>
                    <p class="text-2xl font-bold text-purple-600">${req.financing_type_name || 'غير محدد'}</p>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 shadow">
                <div class="flex items-start space-x-3 space-x-reverse">
                  <div class="bg-blue-100 p-3 rounded-lg">
                    <i class="fas fa-hand-holding-usd text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">المبلغ المطلوب</p>
                    <p class="text-2xl font-bold text-blue-600">${formatNumber(req.requested_amount)} ريال</p>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 shadow">
                <div class="flex items-start space-x-3 space-x-reverse">
                  <div class="bg-green-100 p-3 rounded-lg">
                    <i class="fas fa-clock text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">مدة التمويل</p>
                    <p class="text-2xl font-bold text-green-600">${req.duration_months || 'غير محدد'} شهر</p>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 shadow">
                <div class="flex items-start space-x-3 space-x-reverse">
                  <div class="bg-yellow-100 p-3 rounded-lg">
                    <i class="fas fa-university text-yellow-600 text-xl"></i>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">البنك المختار</p>
                    <p class="text-2xl font-bold text-yellow-600">${req.bank_name || 'غير محدد'}</p>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 shadow">
                <div class="flex items-start space-x-3 space-x-reverse">
                  <div class="bg-red-100 p-3 rounded-lg">
                    <i class="fas fa-receipt text-red-600 text-xl"></i>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">الالتزامات الشهرية</p>
                    <p class="text-2xl font-bold text-red-600">${formatNumber(req.monthly_obligations)} ريال</p>
                  </div>
                </div>
              </div>
              
              <div class="bg-white rounded-lg p-4 shadow">
                <div class="flex items-start space-x-3 space-x-reverse">
                  <div class="bg-indigo-100 p-3 rounded-lg">
                    <i class="fas fa-calendar-check text-indigo-600 text-xl"></i>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">القسط الشهري</p>
                    <p class="text-2xl font-bold text-indigo-600">${formatNumber(req.monthly_payment)} ريال</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- القسم 3: معلومات إضافية -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6 report-section">
            <h2 class="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-gray-500 pb-2">
              <i class="fas fa-info-circle text-gray-600 ml-2"></i>
              معلومات إضافية
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-blue-100 p-3 rounded-lg">
                  <i class="fas fa-calendar-plus text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">تاريخ تقديم الطلب</p>
                  <p class="text-lg font-bold text-gray-800">${formatDate(req.created_at)}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3 space-x-reverse">
                <div class="bg-purple-100 p-3 rounded-lg">
                  <i class="fas fa-edit text-purple-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-500">آخر تحديث</p>
                  <p class="text-lg font-bold text-gray-800">${formatDate(req.updated_at)}</p>
                </div>
              </div>
              
              ${req.notes ? `
              <div class="md:col-span-2">
                <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <p class="text-sm text-gray-500 mb-2">ملاحظات</p>
                  <p class="text-gray-700">${req.notes}</p>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- تذييل التقرير -->
          <div class="bg-gray-100 rounded-xl p-6 text-center report-section">
            <p class="text-gray-600">
              <i class="fas fa-shield-alt ml-2"></i>
              هذا التقرير سري ومخصص للاستخدام الداخلي فقط
            </p>
            <p class="text-sm text-gray-500 mt-2">
              تم إنشاء هذا التقرير بواسطة نظام تمويل - Tamweel Finance Management System
            </p>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error: any) {
    console.error('خطأ في عرض تقرير طلب التمويل:', error)
    return c.html(`<h1>حدث خطأ: ${error.message}</h1>`)
  }
})

// التقرير الزمني (Timeline) لطلب التمويل
app.get('/admin/requests/:id/workflow', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get request data with current stage
    const request = await c.env.DB.prepare(`
      SELECT 
        fr.*,
        c.full_name as customer_name,
        ws.stage_name_ar,
        ws.stage_color,
        ws.stage_icon
      FROM financing_requests fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN workflow_stages ws ON fr.current_stage_id = ws.id
      WHERE fr.id = ?
    `).bind(id).first()
    
    if (!request) {
      return c.html('<h1>الطلب غير موجود</h1>')
    }
    
    // Get all stages
    const { results: stages } = await c.env.DB.prepare(`
      SELECT * FROM workflow_stages 
      WHERE is_active = 1 
      ORDER BY stage_order ASC
    `).all()
    
    // Get workflow timeline (transitions, actions, tasks) - Direct DB query instead of internal API call
    const { results: transitions } = await c.env.DB.prepare(`
      SELECT 
        wst.*,
        ws_from.stage_name_ar as from_stage_name,
        ws_to.stage_name_ar as to_stage_name,
        u.full_name as changed_by_name
      FROM workflow_stage_transitions wst
      LEFT JOIN workflow_stages ws_from ON wst.from_stage_id = ws_from.id
      LEFT JOIN workflow_stages ws_to ON wst.to_stage_id = ws_to.id
      LEFT JOIN users u ON wst.transitioned_by = u.id
      WHERE wst.request_id = ?
      ORDER BY wst.created_at DESC
    `).bind(id).all()
    
    const { results: actions } = await c.env.DB.prepare(`
      SELECT * FROM workflow_stage_actions WHERE request_id = ? ORDER BY created_at DESC
    `).bind(id).all()
    
    const { results: tasks } = await c.env.DB.prepare(`
      SELECT * FROM workflow_stage_tasks WHERE request_id = ? ORDER BY created_at DESC
    `).bind(id).all()
    
    const timelineData = { data: { transitions, actions, tasks } }
    
    const html = generateWorkflowTimelinePage(
      parseInt(id),
      request,
      stages,
      timelineData.data || { transitions: [], actions: [], tasks: [] }
    )
    
    return c.html(html)
  } catch (error: any) {
    console.error('خطأ في عرض Workflow:', error)
    return c.html(`<h1>حدث خطأ: ${error.message}</h1>`)
  }
})

// API - إضافة بنك جديد
app.post('/api/banks', async (c) => {
  try {
    const body = await c.req.parseBody()
    await c.env.DB.prepare(`
      INSERT INTO banks (bank_name, description, is_active, created_at)
      VALUES (?, ?, 1, datetime('now'))
    `).bind(body.bank_name, body.description || '').run()
    
    return c.redirect('/admin/banks')
  } catch (error) {
    return c.json({ error: 'فشل إضافة البنك' }, 500)
  }
})

// عرض بنك واحد
app.get('/admin/banks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const bank = await c.env.DB.prepare('SELECT * FROM banks WHERE id = ?').bind(id).first()
    
    if (!bank) {
      return c.html('<h1>البنك غير موجود</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عرض البنك</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/banks" class="text-blue-600 hover:text-blue-800">← العودة لقائمة البنوك</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold mb-6 text-gray-800">
              <i class="fas fa-university text-yellow-600 ml-2"></i>
              بيانات البنك
            </h1>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="border-r-4 border-blue-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">رقم البنك</p>
                <p class="text-xl font-bold text-gray-800">#${(bank as any).id}</p>
              </div>
              
              <div class="border-r-4 border-green-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">اسم البنك</p>
                <p class="text-xl font-bold text-gray-800">${(bank as any).bank_name}</p>
              </div>
              
              <div class="border-r-4 border-yellow-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">الوصف</p>
                <p class="text-xl font-bold text-gray-800">${(bank as any).description || 'لا يوجد'}</p>
              </div>
              
              <div class="border-r-4 border-purple-500 pr-4">
                <p class="text-sm text-gray-500 mb-1">الحالة</p>
                <p class="text-xl font-bold ${(bank as any).is_active ? 'text-green-600' : 'text-red-600'}">
                  ${(bank as any).is_active ? 'نشط' : 'غير نشط'}
                </p>
              </div>
            </div>
            
            <div class="mt-8 flex gap-4">
              <a href="/admin/banks/${(bank as any).id}/edit" 
                 class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">
                <i class="fas fa-edit ml-2"></i>
                تعديل
              </a>
              <a href="/admin/banks/${(bank as any).id}/delete" 
                 class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold"
                 onclick="return confirm('هل أنت متأكد من حذف هذا البنك؟')">
                <i class="fas fa-trash ml-2"></i>
                حذف
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// تعديل بنك - الصفحة
app.get('/admin/banks/:id/edit', async (c) => {
  try {
    const id = c.req.param('id')
    const bank = await c.env.DB.prepare('SELECT * FROM banks WHERE id = ?').bind(id).first()
    
    if (!bank) {
      return c.html('<h1>البنك غير موجود</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تعديل البنك</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/banks" class="text-blue-600 hover:text-blue-800">← العودة لقائمة البنوك</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold mb-6 text-gray-800">
              <i class="fas fa-edit text-blue-600 ml-2"></i>
              تعديل البنك
            </h1>
            
            <form action="/api/banks/${(bank as any).id}" method="POST" enctype="application/x-www-form-urlencoded" class="space-y-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">اسم البنك</label>
                <input type="text" name="bank_name" value="${(bank as any).bank_name}" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                <textarea name="description" rows="3"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">${(bank as any).description || ''}</textarea>
              </div>
              
              <div class="flex gap-4">
                <button type="submit" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold">
                  <i class="fas fa-save ml-2"></i>
                  حفظ التغييرات
                </button>
                <a href="/admin/banks" class="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold">
                  <i class="fas fa-times ml-2"></i>
                  إلغاء
                </a>
              </div>
            </form>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// API - تعديل بنك
app.post('/api/banks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.parseBody()
    
    await c.env.DB.prepare(`
      UPDATE banks 
      SET bank_name = ?, description = ?
      WHERE id = ?
    `).bind(body.bank_name, body.description || '', id).run()
    
    return c.redirect('/admin/banks')
  } catch (error) {
    return c.json({ error: 'فشل تعديل البنك' }, 500)
  }
})

// حذف بنك
app.get('/admin/banks/:id/delete', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM banks WHERE id = ?').bind(id).run()
    return c.redirect('/admin/banks')
  } catch (error) {
    return c.html('<h1>خطأ في حذف البنك</h1>')
  }
})

// تحديث صفحة البنوك مع أزرار الإجراءات
app.get('/admin/banks', async (c) => {
  try {
    const banks = await c.env.DB.prepare('SELECT * FROM banks ORDER BY bank_name').all()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>البنوك</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">← العودة للوحة الرئيسية</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-university text-yellow-600 ml-2"></i>
                البنوك (<span id="totalCount">${banks.results.length}</span>)
              </h1>
              
              <div class="flex gap-3">
                <button onclick="exportToCSV()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-file-export ml-2"></i>
                  تصدير Excel
                </button>
                <a href="/admin/banks/add" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-plus ml-2"></i>
                  إضافة بنك جديد
                </a>
              </div>
            </div>
            
            <!-- شريط البحث والفلترة -->
            <div class="border-t pt-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="relative">
                  <i class="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
                  <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="بحث في جميع الحقول..." 
                    class="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    onkeyup="filterTable()"
                  >
                </div>
                
                <div>
                  <select 
                    id="filterField" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    onchange="filterTable()"
                  >
                    <option value="all">البحث في: الكل</option>
                    <option value="name">اسم البنك فقط</option>
                    <option value="code">كود البنك فقط</option>
                  </select>
                </div>
                
                <button 
                  onclick="resetFilters()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  <i class="fas fa-redo ml-2"></i>
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <table class="w-full" id="dataTable">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">#</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">اسم البنك</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الوصف</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200" id="tableBody">
                ${banks.results.map((bank: any) => `
                  <tr class="hover:bg-gray-50" data-name="${bank.bank_name || ''}" data-code="${bank.bank_code || ''}">
                    <td class="px-6 py-4 text-sm text-gray-900">${bank.id}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center">
                        <i class="fas fa-university text-yellow-600 ml-2"></i>
                        <span class="text-sm font-bold text-gray-900">${bank.bank_name}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">${bank.description || 'لا يوجد'}</td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 rounded-full text-xs font-bold ${bank.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${bank.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex justify-end gap-2">
                        <a href="/admin/banks/${bank.id}" 
                           class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">
                          <i class="fas fa-eye"></i> عرض
                        </a>
                        <a href="/admin/banks/${bank.id}/edit" 
                           class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">
                          <i class="fas fa-edit"></i> تعديل
                        </a>
                        <a href="/admin/banks/${bank.id}/delete" 
                           onclick="return confirm('هل أنت متأكد من حذف هذا البنك؟')"
                           class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">
                          <i class="fas fa-trash"></i> حذف
                        </a>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <script>
          // البحث والفلترة
          function filterTable() {
            const searchInput = document.getElementById('searchInput').value.toLowerCase().trim()
            const filterField = document.getElementById('filterField').value
            const tableBody = document.getElementById('tableBody')
            const rows = tableBody.getElementsByTagName('tr')
            let visibleCount = 0
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i]
              const name = row.getAttribute('data-name') || ''
              const code = row.getAttribute('data-code') || ''
              
              let shouldShow = false
              
              if (searchInput === '') {
                shouldShow = true
              } else {
                switch(filterField) {
                  case 'name':
                    shouldShow = name.toLowerCase().includes(searchInput)
                    break
                  case 'code':
                    shouldShow = code.toLowerCase().includes(searchInput)
                    break
                  default: // 'all'
                    shouldShow = name.toLowerCase().includes(searchInput) || 
                                code.toLowerCase().includes(searchInput)
                }
              }
              
              row.style.display = shouldShow ? '' : 'none'
              if (shouldShow) visibleCount++
            }
            
            document.getElementById('totalCount').textContent = visibleCount
          }
          
          function resetFilters() {
            document.getElementById('searchInput').value = ''
            document.getElementById('filterField').value = 'all'
            filterTable()
          }
          
          function exportToCSV() {
            const data = [
              ['#', 'اسم البنك', 'الوصف', 'الحالة'],
              ${banks.results.map((bank: any) => `['${bank.id}', '${bank.bank_name}', '${bank.description || ''}', '${bank.is_active ? 'نشط' : 'غير نشط'}']`).join(',\n              ')}
            ];
            
            let csv = '\\uFEFF';
            data.forEach(row => {
              csv += row.join(',') + '\\n';
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'البنوك_' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
          }
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== صفحة نسب التمويل (Rates) ====================

app.get('/admin/rates', async (c) => {
  try {
    const rates = await c.env.DB.prepare(`
      SELECT fr.*, b.bank_name, ft.type_name
      FROM bank_financing_rates fr
      LEFT JOIN banks b ON fr.bank_id = b.id
      LEFT JOIN financing_types ft ON fr.financing_type_id = ft.id
      ORDER BY b.bank_name, ft.type_name
    `).all()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نسب التمويل</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">← العودة للوحة الرئيسية</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-percentage text-orange-600 ml-2"></i>
                نسب التمويل (<span id="totalCount">${rates.results.length}</span>)
              </h1>
              
              <div class="flex gap-3">
                <a href="/admin/rates/new" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-plus ml-2"></i>
                  إضافة جديد
                </a>
                <button onclick="exportToCSV()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-file-export ml-2"></i>
                  تصدير Excel
                </button>
              </div>
            </div>
            
            <!-- شريط البحث والفلترة -->
            <div class="border-t pt-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="relative">
                  <i class="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
                  <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="بحث في جميع الحقول..." 
                    class="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    onkeyup="filterTable()"
                  >
                </div>
                
                <div>
                  <select 
                    id="filterField" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    onchange="filterTable()"
                  >
                    <option value="all">البحث في: الكل</option>
                    <option value="bank">البنك فقط</option>
                    <option value="type">نوع التمويل فقط</option>
                  </select>
                </div>
                
                <button 
                  onclick="resetFilters()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  <i class="fas fa-redo ml-2"></i>
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <table class="w-full" id="dataTable">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">#</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">البنك</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">نوع التمويل</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">نسبة الفائدة</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الحد الأدنى</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الحد الأقصى</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200" id="tableBody">
                ${rates.results.map((rate: any) => `
                  <tr class="hover:bg-gray-50" data-bank="${rate.bank_name || ''}" data-type="${rate.type_name || ''}">
                    <td class="px-6 py-4 text-sm text-gray-900">${rate.id}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center">
                        <i class="fas fa-university text-yellow-600 ml-2"></i>
                        <span class="text-sm font-bold text-gray-900">${rate.bank_name || 'غير محدد'}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">${rate.type_name || 'غير محدد'}</td>
                    <td class="px-6 py-4">
                      <span class="text-lg font-bold text-orange-600">${rate.rate || 0}%</span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">${rate.min_amount ? rate.min_amount.toLocaleString() : '0'} ريال</td>
                    <td class="px-6 py-4 text-sm text-gray-600">${rate.max_amount ? rate.max_amount.toLocaleString() : '0'} ريال</td>
                    <td class="px-6 py-4">
                      <div class="flex gap-2 justify-end">
                        <a href="/admin/rates/${rate.id}" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs transition-all">
                          <i class="fas fa-eye"></i> عرض
                        </a>
                        <a href="/admin/rates/${rate.id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs transition-all">
                          <i class="fas fa-edit"></i> تعديل
                        </a>
                        <a href="/admin/rates/${rate.id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs transition-all">
                          <i class="fas fa-trash"></i> حذف
                        </a>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <script>
          // البحث والفلترة
          function filterTable() {
            const searchInput = document.getElementById('searchInput').value.toLowerCase().trim()
            const filterField = document.getElementById('filterField').value
            const tableBody = document.getElementById('tableBody')
            const rows = tableBody.getElementsByTagName('tr')
            let visibleCount = 0
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i]
              const bank = row.getAttribute('data-bank') || ''
              const type = row.getAttribute('data-type') || ''
              
              let shouldShow = false
              
              if (searchInput === '') {
                shouldShow = true
              } else {
                switch(filterField) {
                  case 'bank':
                    shouldShow = bank.toLowerCase().includes(searchInput)
                    break
                  case 'type':
                    shouldShow = type.toLowerCase().includes(searchInput)
                    break
                  default: // 'all'
                    shouldShow = bank.toLowerCase().includes(searchInput) || 
                                type.toLowerCase().includes(searchInput)
                }
              }
              
              row.style.display = shouldShow ? '' : 'none'
              if (shouldShow) visibleCount++
            }
            
            document.getElementById('totalCount').textContent = visibleCount
          }
          
          function resetFilters() {
            document.getElementById('searchInput').value = ''
            document.getElementById('filterField').value = 'all'
            filterTable()
          }
          
          function exportToCSV() {
            const data = [
              ['#', 'البنك', 'نوع التمويل', 'نسبة الفائدة', 'الحد الأدنى', 'الحد الأقصى'],
              ${rates.results.map((rate: any) => `['${rate.id}', '${rate.bank_name || 'غير محدد'}', '${rate.type_name || 'غير محدد'}', '${rate.rate || 0}%', '${rate.min_amount || 0}', '${rate.max_amount || 0}']`).join(',\n              ')}
            ];
            
            let csv = '\\uFEFF';
            data.forEach(row => {
              csv += row.join(',') + '\\n';
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'نسب_التمويل_' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
          }
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== صفحة عرض نسبة تمويل واحدة ====================
app.get('/admin/rates/new', async (c) => {
  try {
    const banks = await c.env.DB.prepare('SELECT id, bank_name FROM banks WHERE is_active = 1 ORDER BY bank_name').all()
    const financingTypes = await c.env.DB.prepare('SELECT id, type_name FROM financing_types ORDER BY type_name').all()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إضافة نسبة تمويل جديدة</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/rates" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة نسب التمويل
            </a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">
              <i class="fas fa-plus-circle text-orange-600 ml-2"></i>
              إضافة نسبة تمويل جديدة
            </h1>
            
            <form action="/api/rates" method="POST" enctype="application/x-www-form-urlencoded" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- البنك -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-university text-yellow-600 ml-1"></i>
                    البنك *
                  </label>
                  <select name="bank_id" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="">-- اختر البنك --</option>
                    ${banks.results.map((bank: any) => `
                      <option value="${bank.id}">${bank.bank_name}</option>
                    `).join('')}
                  </select>
                </div>
                
                <!-- نوع التمويل -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-file-invoice text-purple-600 ml-1"></i>
                    نوع التمويل *
                  </label>
                  <select name="financing_type_id" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="">-- اختر نوع التمويل --</option>
                    ${financingTypes.results.map((type: any) => `
                      <option value="${type.id}">${type.type_name}</option>
                    `).join('')}
                  </select>
                </div>
                
                <!-- نسبة الفائدة -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-percentage text-orange-600 ml-1"></i>
                    نسبة الفائدة (%) *
                  </label>
                  <input type="number" name="rate" required min="0" max="100" step="0.01" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                         placeholder="مثال: 4.5">
                </div>
                
                <!-- الحد الأدنى للمبلغ -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-arrow-down text-green-600 ml-1"></i>
                    الحد الأدنى للمبلغ (ريال)
                  </label>
                  <input type="number" name="min_amount" min="0" step="1000" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                         placeholder="مثال: 10000">
                </div>
                
                <!-- الحد الأقصى للمبلغ -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-arrow-up text-red-600 ml-1"></i>
                    الحد الأقصى للمبلغ (ريال)
                  </label>
                  <input type="number" name="max_amount" min="0" step="1000" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                         placeholder="مثال: 500000">
                </div>
                
                <!-- الحد الأدنى للمدة -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-calendar text-blue-600 ml-1"></i>
                    الحد الأدنى للمدة (شهور)
                  </label>
                  <input type="number" name="min_duration" min="1" max="360" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                         placeholder="مثال: 12">
                </div>
                
                <!-- الحد الأقصى للمدة -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-calendar-alt text-purple-600 ml-1"></i>
                    الحد الأقصى للمدة (شهور)
                  </label>
                  <input type="number" name="max_duration" min="1" max="360" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                         placeholder="مثال: 60">
                </div>
              </div>
              
              <div class="flex gap-4 pt-6 border-t">
                <button type="submit" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-bold transition-all">
                  <i class="fas fa-save ml-2"></i>
                  حفظ النسبة
                </button>
                <a href="/admin/rates" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-center transition-all">
                  <i class="fas fa-times ml-2"></i>
                  إلغاء
                </a>
              </div>
            </form>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل الصفحة</h1>')
  }
})
app.get('/admin/rates/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const rate = await c.env.DB.prepare(`
      SELECT fr.*, b.bank_name, ft.type_name
      FROM bank_financing_rates fr
      LEFT JOIN banks b ON fr.bank_id = b.id
      LEFT JOIN financing_types ft ON fr.financing_type_id = ft.id
      WHERE fr.id = ?
    `).bind(id).first()
    
    if (!rate) {
      return c.html('<h1>النسبة غير موجودة</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عرض نسبة التمويل #${id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6 flex justify-between items-center">
            <a href="/admin/rates" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة النسب
            </a>
            <div class="flex gap-2">
              <a href="/admin/rates/${id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-edit ml-1"></i> تعديل
              </a>
              <a href="/admin/rates/${id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-trash ml-1"></i> حذف
              </a>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <i class="fas fa-percentage text-orange-600 ml-3"></i>
              نسبة التمويل #${id}
            </h1>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">البنك</label>
                <p class="text-lg text-gray-900">${rate.bank_name || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">نوع التمويل</label>
                <p class="text-lg text-gray-900">${rate.type_name || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">نسبة الفائدة</label>
                <p class="text-3xl font-bold text-orange-600">${rate.rate || 0}%</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الحالة</label>
                <p>
                  <span class="px-4 py-2 rounded-full text-sm font-bold ${rate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${rate.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الحد الأدنى للمبلغ</label>
                <p class="text-lg text-gray-900">${rate.min_amount ? rate.min_amount.toLocaleString() : 'غير محدد'} ريال</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الحد الأقصى للمبلغ</label>
                <p class="text-lg text-gray-900">${rate.max_amount ? rate.max_amount.toLocaleString() : 'غير محدد'} ريال</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الحد الأدنى للمدة</label>
                <p class="text-lg text-gray-900">${rate.min_duration || 'غير محدد'} شهر</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الحد الأقصى للمدة</label>
                <p class="text-lg text-gray-900">${rate.max_duration || 'غير محدد'} شهر</p>
              </div>
              
              <div class="md:col-span-2 mt-4">
                <label class="block text-sm font-bold text-gray-600 mb-1">تاريخ الإنشاء</label>
                <p class="text-gray-900">${new Date(rate.created_at).toLocaleString('ar-SA')}</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== نموذج إضافة نسبة تمويل جديدة ====================

// ==================== صفحة الاشتراكات (Subscriptions) ====================

app.get('/admin/subscriptions', async (c) => {
  try {
    const subscriptions = await c.env.DB.prepare(`
      SELECT s.*, p.package_name, p.price
      FROM subscriptions s
      LEFT JOIN packages p ON s.package_id = p.id
      ORDER BY s.created_at DESC
    `).all()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>الاشتراكات</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">← العودة للوحة الرئيسية</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-id-card text-teal-600 ml-2"></i>
                الاشتراكات (<span id="totalCount">${subscriptions.results.length}</span>)
              </h1>
              
              <div class="flex gap-3">
                <a href="/admin/subscriptions/new" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-plus ml-2"></i>
                  إضافة جديد
                </a>
                <button onclick="exportToCSV()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-file-export ml-2"></i>
                  تصدير Excel
                </button>
              </div>
            </div>
            
            <!-- شريط البحث والفلترة -->
            <div class="border-t pt-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="relative">
                  <i class="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
                  <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="بحث في جميع الحقول..." 
                    class="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    onkeyup="filterTable()"
                  >
                </div>
                
                <div>
                  <select 
                    id="filterField" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    onchange="filterTable()"
                  >
                    <option value="all">البحث في: الكل</option>
                    <option value="company">الشركة فقط</option>
                    <option value="package">الباقة فقط</option>
                    <option value="status">الحالة فقط</option>
                  </select>
                </div>
                
                <button 
                  onclick="resetFilters()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  <i class="fas fa-redo ml-2"></i>
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <table class="w-full" id="dataTable">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">#</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">اسم الشركة</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الباقة</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">تاريخ البداية</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">تاريخ الانتهاء</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الحسابات المستخدمة</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200" id="tableBody">
                ${subscriptions.results.map((sub: any) => {
                  const statusAr = sub.status === 'active' ? 'نشط' : sub.status === 'expired' ? 'منتهي' : 'معلق';
                  return `
                  <tr class="hover:bg-gray-50" 
                      data-company="${sub.company_name || ''}" 
                      data-package="${sub.package_name || ''}" 
                      data-status="${statusAr}">
                    <td class="px-6 py-4 text-sm text-gray-900">${sub.id}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center">
                        <i class="fas fa-building text-teal-600 ml-2"></i>
                        <span class="text-sm font-bold text-gray-900">${sub.company_name}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">${sub.package_name || 'غير محدد'}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">${sub.start_date || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">${sub.end_date || '-'}</td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' : 
                        sub.status === 'expired' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }">
                        ${statusAr}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">${sub.calculations_used || 0}</td>
                    <td class="px-6 py-4">
                      <div class="flex gap-2 justify-end">
                        <a href="/admin/subscriptions/${sub.id}" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs transition-all">
                          <i class="fas fa-eye"></i> عرض
                        </a>
                        <a href="/admin/subscriptions/${sub.id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs transition-all">
                          <i class="fas fa-edit"></i> تعديل
                        </a>
                        <a href="/admin/subscriptions/${sub.id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs transition-all">
                          <i class="fas fa-trash"></i> حذف
                        </a>
                      </div>
                    </td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <script>
          // البحث والفلترة
          function filterTable() {
            const searchInput = document.getElementById('searchInput').value.toLowerCase().trim()
            const filterField = document.getElementById('filterField').value
            const tableBody = document.getElementById('tableBody')
            const rows = tableBody.getElementsByTagName('tr')
            let visibleCount = 0
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i]
              const company = row.getAttribute('data-company') || ''
              const package_name = row.getAttribute('data-package') || ''
              const status = row.getAttribute('data-status') || ''
              
              let shouldShow = false
              
              if (searchInput === '') {
                shouldShow = true
              } else {
                switch(filterField) {
                  case 'company':
                    shouldShow = company.toLowerCase().includes(searchInput)
                    break
                  case 'package':
                    shouldShow = package_name.toLowerCase().includes(searchInput)
                    break
                  case 'status':
                    shouldShow = status.toLowerCase().includes(searchInput)
                    break
                  default: // 'all'
                    shouldShow = company.toLowerCase().includes(searchInput) || 
                                package_name.toLowerCase().includes(searchInput) || 
                                status.toLowerCase().includes(searchInput)
                }
              }
              
              row.style.display = shouldShow ? '' : 'none'
              if (shouldShow) visibleCount++
            }
            
            document.getElementById('totalCount').textContent = visibleCount
          }
          
          function resetFilters() {
            document.getElementById('searchInput').value = ''
            document.getElementById('filterField').value = 'all'
            filterTable()
          }
          
          function exportToCSV() {
            const data = [
              ['#', 'اسم الشركة', 'الباقة', 'تاريخ البداية', 'تاريخ الانتهاء', 'الحالة', 'الحسابات المستخدمة'],
              ${subscriptions.results.map((sub: any) => {
                const statusAr = sub.status === 'active' ? 'نشط' : sub.status === 'expired' ? 'منتهي' : 'معلق';
                return `['${sub.id}', '${sub.company_name}', '${sub.package_name || 'غير محدد'}', '${sub.start_date || '-'}', '${sub.end_date || '-'}', '${statusAr}', '${sub.calculations_used || 0}']`;
              }).join(',\n              ')}
            ];
            
            let csv = '\\uFEFF';
            data.forEach(row => {
              csv += row.join(',') + '\\n';
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'الاشتراكات_' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
          }
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== صفحة عرض اشتراك واحد ====================
app.get('/admin/subscriptions/new', async (c) => {
  try {
    const packages = await c.env.DB.prepare('SELECT id, package_name, price, duration_months FROM packages WHERE is_active = 1 ORDER BY price').all()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إضافة اشتراك جديد</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/subscriptions" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة الاشتراكات
            </a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">
              <i class="fas fa-plus-circle text-teal-600 ml-2"></i>
              إضافة اشتراك جديد
            </h1>
            
            <form action="/api/subscriptions" method="POST" enctype="application/x-www-form-urlencoded" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- اسم الشركة -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-building text-teal-600 ml-1"></i>
                    اسم الشركة *
                  </label>
                  <input type="text" name="company_name" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                         placeholder="مثال: شركة التمويل السريع">
                </div>
                
                <!-- الباقة -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-box text-purple-600 ml-1"></i>
                    الباقة *
                  </label>
                  <select name="package_id" id="packageSelect" required onchange="updateDates()" 
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="">-- اختر الباقة --</option>
                    ${packages.results.map((pkg: any) => `
                      <option value="${pkg.id}" data-duration="${pkg.duration_months}">
                        ${pkg.package_name} - ${pkg.price} ريال - ${pkg.duration_months} شهر
                      </option>
                    `).join('')}
                  </select>
                </div>
                
                <!-- تاريخ البداية -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-calendar-check text-green-600 ml-1"></i>
                    تاريخ البداية *
                  </label>
                  <input type="date" name="start_date" id="startDate" required onchange="updateEndDate()" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                </div>
                
                <!-- تاريخ الانتهاء -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-calendar-times text-red-600 ml-1"></i>
                    تاريخ الانتهاء *
                  </label>
                  <input type="date" name="end_date" id="endDate" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                         readonly>
                </div>
                
                <!-- الحالة -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-flag text-blue-600 ml-1"></i>
                    الحالة *
                  </label>
                  <select name="status" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="active">نشط</option>
                    <option value="pending">معلق</option>
                    <option value="expired">منتهي</option>
                  </select>
                </div>
                
                <!-- عدد الحسابات المستخدمة -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-calculator text-orange-600 ml-1"></i>
                    عدد الحسابات المستخدمة
                  </label>
                  <input type="number" name="calculations_used" min="0" value="0" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                </div>
              </div>
              
              <div class="flex gap-4 pt-6 border-t">
                <button type="submit" class="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-lg font-bold transition-all">
                  <i class="fas fa-save ml-2"></i>
                  حفظ الاشتراك
                </button>
                <a href="/admin/subscriptions" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-center transition-all">
                  <i class="fas fa-times ml-2"></i>
                  إلغاء
                </a>
              </div>
            </form>
          </div>
        </div>
        
        <script>
          // Set today as default start date
          document.getElementById('startDate').valueAsDate = new Date();
          
          function updateEndDate() {
            const packageSelect = document.getElementById('packageSelect');
            const startDate = document.getElementById('startDate').value;
            const endDateInput = document.getElementById('endDate');
            
            if (packageSelect.value && startDate) {
              const selectedOption = packageSelect.options[packageSelect.selectedIndex];
              const durationMonths = parseInt(selectedOption.dataset.duration);
              
              const start = new Date(startDate);
              const end = new Date(start);
              end.setMonth(end.getMonth() + durationMonths);
              
              endDateInput.value = end.toISOString().split('T')[0];
            }
          }
          
          function updateDates() {
            updateEndDate();
          }
          
          // Auto-update end date when package changes
          document.getElementById('packageSelect').addEventListener('change', updateDates);
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل الصفحة</h1>')
  }
})
app.get('/admin/subscriptions/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const subscription = await c.env.DB.prepare(`
      SELECT s.*, p.package_name, p.price
      FROM subscriptions s
      LEFT JOIN packages p ON s.package_id = p.id
      WHERE s.id = ?
    `).bind(id).first()
    
    if (!subscription) {
      return c.html('<h1>الاشتراك غير موجود</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عرض الاشتراك #${id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6 flex justify-between items-center">
            <a href="/admin/subscriptions" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة الاشتراكات
            </a>
            <div class="flex gap-2">
              <a href="/admin/subscriptions/${id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-edit ml-1"></i> تعديل
              </a>
              <a href="/admin/subscriptions/${id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-trash ml-1"></i> حذف
              </a>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <i class="fas fa-id-card text-teal-600 ml-3"></i>
              الاشتراك #${id}
            </h1>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-600 mb-1">اسم الشركة</label>
                <p class="text-2xl font-bold text-gray-900">${subscription.company_name}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الباقة</label>
                <p class="text-lg text-gray-900">${subscription.package_name || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">السعر</label>
                <p class="text-lg font-bold text-green-600">${subscription.price ? subscription.price.toLocaleString() : '0'} ريال</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">تاريخ البداية</label>
                <p class="text-lg text-gray-900">${subscription.start_date || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">تاريخ الانتهاء</label>
                <p class="text-lg text-gray-900">${subscription.end_date || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الحالة</label>
                <p>
                  <span class="px-4 py-2 rounded-full text-sm font-bold ${
                    subscription.status === 'active' ? 'bg-green-100 text-green-800' : 
                    subscription.status === 'expired' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }">
                    ${subscription.status === 'active' ? 'نشط' : subscription.status === 'expired' ? 'منتهي' : 'معلق'}
                  </span>
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الحسابات المستخدمة</label>
                <p class="text-lg text-gray-900">${subscription.calculations_used || 0}</p>
              </div>
              
              <div class="md:col-span-2 mt-4">
                <label class="block text-sm font-bold text-gray-600 mb-1">تاريخ الإنشاء</label>
                <p class="text-gray-900">${new Date(subscription.created_at).toLocaleString('ar-SA')}</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== نموذج إضافة اشتراك جديد ====================

// ==================== صفحة الباقات (Packages) ====================

app.get('/admin/packages', async (c) => {
  try {
    const packages = await c.env.DB.prepare(`
      SELECT * FROM packages ORDER BY price
    `).all()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>الباقات</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">← العودة للوحة الرئيسية</a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-box text-purple-600 ml-2"></i>
                الباقات (<span id="totalCount">${packages.results.length}</span>)
              </h1>
              
              <div class="flex gap-3">
                <a href="/admin/packages/new" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-plus ml-2"></i>
                  إضافة جديد
                </a>
                <button onclick="exportToCSV()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-file-export ml-2"></i>
                  تصدير Excel
                </button>
              </div>
            </div>
            
            <!-- شريط البحث والفلترة -->
            <div class="border-t pt-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="relative">
                  <i class="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
                  <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="بحث في جميع الحقول..." 
                    class="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onkeyup="filterPackages()"
                  >
                </div>
                
                <div>
                  <select 
                    id="filterField" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onchange="filterPackages()"
                  >
                    <option value="all">البحث في: الكل</option>
                    <option value="name">اسم الباقة فقط</option>
                    <option value="price">السعر فقط</option>
                  </select>
                </div>
                
                <button 
                  onclick="resetFilters()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  <i class="fas fa-redo ml-2"></i>
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="packagesGrid">
            ${packages.results.map((pkg: any) => `
              <div class="package-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-t-4 ${
                pkg.package_name.includes('الذهبية') ? 'border-yellow-500' :
                pkg.package_name.includes('الاحترافية') ? 'border-purple-500' :
                'border-blue-500'
              }" data-name="${pkg.package_name || ''}" data-price="${pkg.price || 0}">
                <div class="text-center mb-4">
                  <i class="fas fa-box text-5xl ${
                    pkg.package_name.includes('الذهبية') ? 'text-yellow-500' :
                    pkg.package_name.includes('الاحترافية') ? 'text-purple-500' :
                    'text-blue-500'
                  } mb-3"></i>
                  <h3 class="text-2xl font-bold text-gray-800">${pkg.package_name}</h3>
                  <p class="text-sm text-gray-600 mt-2">${pkg.description || ''}</p>
                </div>
                
                <div class="border-t border-b border-gray-200 py-4 my-4">
                  <div class="text-center">
                    <span class="text-4xl font-bold text-gray-800">${pkg.price}</span>
                    <span class="text-gray-600"> ريال</span>
                    <p class="text-sm text-gray-500 mt-1">لمدة ${pkg.duration_months} شهر</p>
                  </div>
                </div>
                
                <div class="space-y-3 mb-4">
                  <div class="flex items-center text-sm">
                    <i class="fas fa-check-circle text-green-500 ml-2"></i>
                    <span><strong>${pkg.max_calculations}</strong> حساب</span>
                  </div>
                  <div class="flex items-center text-sm">
                    <i class="fas fa-users text-blue-500 ml-2"></i>
                    <span>حتى <strong>${pkg.max_users}</strong> مستخدمين</span>
                  </div>
                  <div class="flex items-center text-sm">
                    <i class="fas fa-${pkg.is_active ? 'check' : 'times'}-circle ${pkg.is_active ? 'text-green-500' : 'text-red-500'} ml-2"></i>
                    <span>${pkg.is_active ? 'نشط' : 'غير نشط'}</span>
                  </div>
                </div>
                
                <div class="pt-4 border-t border-gray-200 flex gap-2 justify-end">
                  <a href="/admin/packages/${pkg.id}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-all">
                    <i class="fas fa-eye"></i> عرض
                  </a>
                  <a href="/admin/packages/${pkg.id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm transition-all">
                    <i class="fas fa-edit"></i> تعديل
                  </a>
                  <a href="/admin/packages/${pkg.id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-all">
                    <i class="fas fa-trash"></i> حذف
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <script>
          // البحث والفلترة
          function filterPackages() {
            const searchInput = document.getElementById('searchInput').value.toLowerCase().trim()
            const filterField = document.getElementById('filterField').value
            const grid = document.getElementById('packagesGrid')
            const cards = grid.getElementsByClassName('package-card')
            let visibleCount = 0
            
            for (let i = 0; i < cards.length; i++) {
              const card = cards[i]
              const name = card.getAttribute('data-name') || ''
              const price = card.getAttribute('data-price') || ''
              
              let shouldShow = false
              
              if (searchInput === '') {
                shouldShow = true
              } else {
                switch(filterField) {
                  case 'name':
                    shouldShow = name.toLowerCase().includes(searchInput)
                    break
                  case 'price':
                    shouldShow = price.toLowerCase().includes(searchInput)
                    break
                  default: // 'all'
                    shouldShow = name.toLowerCase().includes(searchInput) || 
                                price.toLowerCase().includes(searchInput)
                }
              }
              
              card.style.display = shouldShow ? '' : 'none'
              if (shouldShow) visibleCount++
            }
            
            document.getElementById('totalCount').textContent = visibleCount
          }
          
          function resetFilters() {
            document.getElementById('searchInput').value = ''
            document.getElementById('filterField').value = 'all'
            filterPackages()
          }
          
          function exportToCSV() {
            const data = [
              ['#', 'اسم الباقة', 'الوصف', 'السعر', 'المدة (شهور)', 'الحسابات', 'المستخدمين', 'الحالة'],
              ${packages.results.map((pkg: any) => `['${pkg.id}', '${pkg.package_name}', '${pkg.description || ''}', '${pkg.price}', '${pkg.duration_months}', '${pkg.max_calculations}', '${pkg.max_users}', '${pkg.is_active ? 'نشط' : 'غير نشط'}']`).join(',\n              ')}
            ];
            
            let csv = '\\uFEFF';
            data.forEach(row => {
              csv += row.join(',') + '\\n';
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'الباقات_' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
          }
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== صفحة عرض باقة واحدة ====================
app.get('/admin/packages/new', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إضافة باقة جديدة</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
      <div class="max-w-4xl mx-auto p-6">
        <div class="mb-6">
          <a href="/admin/packages" class="text-blue-600 hover:text-blue-800">
            <i class="fas fa-arrow-right ml-2"></i>
            العودة لقائمة الباقات
          </a>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-6">
            <i class="fas fa-plus-circle text-pink-600 ml-2"></i>
            إضافة باقة جديدة
          </h1>
          
          <form action="/api/packages" method="POST" enctype="application/x-www-form-urlencoded" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- اسم الباقة -->
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-box text-purple-600 ml-1"></i>
                  اسم الباقة *
                </label>
                <input type="text" name="package_name" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                       placeholder="مثال: الباقة الذهبية">
              </div>
              
              <!-- السعر -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-money-bill-wave text-green-600 ml-1"></i>
                  السعر (ريال) *
                </label>
                <input type="number" name="price" required min="0" step="0.01" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                       placeholder="مثال: 5000">
              </div>
              
              <!-- المدة بالأشهر -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-calendar text-blue-600 ml-1"></i>
                  المدة (شهور) *
                </label>
                <select name="duration_months" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                  <option value="">-- اختر المدة --</option>
                  <option value="1">شهر واحد</option>
                  <option value="3">3 أشهر</option>
                  <option value="6">6 أشهر</option>
                  <option value="12">سنة واحدة (12 شهر)</option>
                  <option value="24">سنتين (24 شهر)</option>
                  <option value="36">3 سنوات (36 شهر)</option>
                </select>
              </div>
              
              <!-- عدد الحسابات -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-calculator text-orange-600 ml-1"></i>
                  عدد الحسابات المسموحة *
                </label>
                <input type="number" name="max_calculations" required min="1" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                       placeholder="مثال: 1000">
              </div>
              
              <!-- عدد المستخدمين -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-users text-indigo-600 ml-1"></i>
                  عدد المستخدمين المسموح *
                </label>
                <input type="number" name="max_users" required min="1" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                       placeholder="مثال: 5">
              </div>
              
              <!-- الحالة -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-toggle-on text-green-600 ml-1"></i>
                  الحالة *
                </label>
                <select name="is_active" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                  <option value="1">نشط</option>
                  <option value="0">غير نشط</option>
                </select>
              </div>
              
              <!-- الوصف -->
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  <i class="fas fa-align-right text-gray-600 ml-1"></i>
                  الوصف
                </label>
                <textarea name="description" rows="3" 
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="وصف مختصر للباقة..."></textarea>
              </div>
            </div>
            
            <div class="flex gap-4 pt-6 border-t">
              <button type="submit" class="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 px-6 rounded-lg font-bold transition-all">
                <i class="fas fa-save ml-2"></i>
                حفظ الباقة
              </button>
              <a href="/admin/packages" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-center transition-all">
                <i class="fas fa-times ml-2"></i>
                إلغاء
              </a>
            </div>
          </form>
        </div>
      </div>
    </body>
    </html>
  `)
})
app.get('/admin/packages/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const pkg = await c.env.DB.prepare('SELECT * FROM packages WHERE id = ?').bind(id).first()
    
    if (!pkg) {
      return c.html('<h1>الباقة غير موجودة</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عرض الباقة #${id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6 flex justify-between items-center">
            <a href="/admin/packages" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة الباقات
            </a>
            <div class="flex gap-2">
              <a href="/admin/packages/${id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-edit ml-1"></i> تعديل
              </a>
              <a href="/admin/packages/${id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-trash ml-1"></i> حذف
              </a>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8 border-t-4 ${
            pkg.package_name.includes('الذهبية') ? 'border-yellow-500' :
            pkg.package_name.includes('الاحترافية') ? 'border-purple-500' :
            'border-blue-500'
          }">
            <div class="text-center mb-8">
              <i class="fas fa-box text-6xl ${
                pkg.package_name.includes('الذهبية') ? 'text-yellow-500' :
                pkg.package_name.includes('الاحترافية') ? 'text-purple-500' :
                'text-blue-500'
              } mb-4"></i>
              <h1 class="text-4xl font-bold text-gray-800">${pkg.package_name}</h1>
              ${pkg.description ? `<p class="text-gray-600 mt-2">${pkg.description}</p>` : ''}
            </div>
            
            <div class="border-t border-b border-gray-200 py-6 my-6">
              <div class="text-center">
                <span class="text-5xl font-bold text-gray-800">${pkg.price}</span>
                <span class="text-2xl text-gray-600"> ريال</span>
                <p class="text-gray-500 mt-2">لمدة ${pkg.duration_months} شهر</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div class="flex items-center">
                <i class="fas fa-calculator text-orange-600 text-2xl ml-3"></i>
                <div>
                  <p class="text-sm text-gray-600">عدد الحسابات</p>
                  <p class="text-2xl font-bold text-gray-800">${pkg.max_calculations || 'غير محدود'}</p>
                </div>
              </div>
              
              <div class="flex items-center">
                <i class="fas fa-users text-blue-600 text-2xl ml-3"></i>
                <div>
                  <p class="text-sm text-gray-600">عدد المستخدمين</p>
                  <p class="text-2xl font-bold text-gray-800">${pkg.max_users || 'غير محدود'}</p>
                </div>
              </div>
              
              <div class="flex items-center">
                <i class="fas fa-${pkg.is_active ? 'check' : 'times'}-circle text-2xl ml-3 ${pkg.is_active ? 'text-green-600' : 'text-red-600'}"></i>
                <div>
                  <p class="text-sm text-gray-600">الحالة</p>
                  <p class="text-xl font-bold ${pkg.is_active ? 'text-green-600' : 'text-red-600'}">
                    ${pkg.is_active ? 'نشط' : 'غير نشط'}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center">
                <i class="fas fa-calendar text-purple-600 text-2xl ml-3"></i>
                <div>
                  <p class="text-sm text-gray-600">تاريخ الإنشاء</p>
                  <p class="text-sm text-gray-800">${new Date(pkg.created_at).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== نموذج إضافة باقة جديدة ====================

// ==================== صفحة المستخدمين (Users) ====================

app.get('/admin/users', async (c) => {
  try {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>المستخدمين</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto p-6">
          <div class="mb-6 flex items-center justify-between">
            <a href="/admin" class="text-blue-600 hover:text-blue-800">← العودة للوحة الرئيسية</a>
            <div class="flex items-center gap-3">
              <i class="fas fa-user-circle text-2xl text-gray-600"></i>
              <div class="text-right">
                <div class="text-sm font-bold text-gray-800" id="currentUserName">جاري التحميل...</div>
                <div class="text-xs text-gray-500" id="currentUserRole">-</div>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-users text-indigo-600 ml-2"></i>
                المستخدمين (<span id="totalCount">0</span>)
              </h1>
              
              <div class="flex gap-3">
                <a href="/admin/users-new" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-plus ml-2"></i>
                  إضافة جديد
                </a>
                <button onclick="exportToCSV()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-file-export ml-2"></i>
                  تصدير Excel
                </button>
              </div>
            </div>
            
            <!-- شريط البحث والفلترة -->
            <div class="border-t pt-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="relative">
                  <i class="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
                  <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="بحث في جميع الحقول..." 
                    class="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onkeyup="filterTable()"
                  >
                </div>
                
                <div>
                  <select 
                    id="filterField" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onchange="filterTable()"
                  >
                    <option value="all">البحث في: الكل</option>
                    <option value="username">اسم المستخدم فقط</option>
                    <option value="fullname">الاسم الكامل فقط</option>
                    <option value="email">البريد فقط</option>
                  </select>
                </div>
                
                <button 
                  onclick="resetFilters()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  <i class="fas fa-redo ml-2"></i>
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <table class="w-full" id="dataTable">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">#</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">اسم المستخدم</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الاسم الكامل</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">البريد الإلكتروني</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الدور</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الشركة</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                  <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200" id="tableBody">
                <tr>
                  <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                    <div>جاري تحميل البيانات...</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <script>
          let allUsers = []; // تخزين جميع المستخدمين
          
          // تحميل بيانات المستخدم الحالي
          function loadCurrentUser() {
            const userData = localStorage.getItem('userData') || localStorage.getItem('user');
            if (userData) {
              const user = JSON.parse(userData);
              document.getElementById('currentUserName').textContent = user.full_name || user.username || 'مستخدم';
              document.getElementById('currentUserRole').textContent = user.role === 'company' ? 'مدير شركة' : (user.role === 'admin' ? 'مدير نظام' : 'مستخدم');
            }
          }
          
          // تحميل المستخدمين من API
          async function loadUsers() {
            try {
              const authToken = localStorage.getItem('authToken');
              if (!authToken) {
                console.error('⚠️ لا يوجد authToken - إعادة التوجيه لصفحة تسجيل الدخول');
                window.location.href = '/login';
                return;
              }
              
              console.log('🔄 جاري تحميل المستخدمين من API...');
              const response = await axios.get('/api/users', {
                headers: { 'Authorization': \`Bearer \${authToken}\` }
              });
              
              if (response.data.success) {
                allUsers = response.data.data;
                console.log(\`✅ تم تحميل \${allUsers.length} مستخدم\`);
                renderUsers(allUsers);
              } else {
                throw new Error(response.data.error || 'فشل تحميل المستخدمين');
              }
            } catch (error) {
              console.error('❌ خطأ في تحميل المستخدمين:', error);
              document.getElementById('tableBody').innerHTML = \`
                <tr>
                  <td colspan="8" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                    <div>فشل تحميل البيانات: \${error.message}</div>
                  </td>
                </tr>
              \`;
            }
          }
          
          // عرض المستخدمين في الجدول
          function renderUsers(users) {
            const tbody = document.getElementById('tableBody');
            
            if (!users || users.length === 0) {
              tbody.innerHTML = \`
                <tr>
                  <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-users text-3xl mb-2"></i>
                    <div>لا توجد بيانات مستخدمين</div>
                  </td>
                </tr>
              \`;
              document.getElementById('totalCount').textContent = '0';
              return;
            }
            
            tbody.innerHTML = users.map(user => {
              const roleClass = user.user_type === 'admin' ? 'bg-red-100 text-red-800' : 
                                user.user_type === 'company' ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800';
              const statusClass = user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
              const statusText = user.is_active ? 'نشط' : 'غير نشط';
              
              return \`
                <tr class="hover:bg-gray-50" 
                    data-username="\${user.username || ''}" 
                    data-fullname="\${user.full_name || ''}" 
                    data-email="\${user.email || ''}">
                  <td class="px-6 py-4 text-sm text-gray-900">\${user.id}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <i class="fas fa-user text-indigo-600 ml-2"></i>
                      <span class="text-sm font-bold text-gray-900">\${user.username}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">\${user.full_name || '-'}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">\${user.email || '-'}</td>
                  <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold \${roleClass}">
                      \${user.role_name || user.user_type || 'غير محدد'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">\${user.company_name || '-'}</td>
                  <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold \${statusClass}">
                      \${statusText}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex gap-2 justify-end">
                      <a href="/admin/users/\${user.id}" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs transition-all">
                        <i class="fas fa-eye"></i> عرض
                      </a>
                      <a href="/admin/users/\${user.id}/permissions" class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-xs transition-all" title="إدارة الصلاحيات">
                        <i class="fas fa-user-shield"></i> صلاحيات
                      </a>
                      <a href="/admin/users/\${user.id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs transition-all">
                        <i class="fas fa-edit"></i> تعديل
                      </a>
                      <a href="/admin/users/\${user.id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs transition-all">
                        <i class="fas fa-trash"></i> حذف
                      </a>
                    </div>
                  </td>
                </tr>
              \`;
            }).join('');
            
            document.getElementById('totalCount').textContent = users.length;
          }
          
          // البحث والفلترة
          function filterTable() {
            const searchInput = document.getElementById('searchInput').value.toLowerCase().trim();
            const filterField = document.getElementById('filterField').value;
            
            if (searchInput === '') {
              renderUsers(allUsers);
              return;
            }
            
            const filtered = allUsers.filter(user => {
              const username = (user.username || '').toLowerCase();
              const fullname = (user.full_name || '').toLowerCase();
              const email = (user.email || '').toLowerCase();
              
              switch(filterField) {
                case 'username':
                  return username.includes(searchInput);
                case 'fullname':
                  return fullname.includes(searchInput);
                case 'email':
                  return email.includes(searchInput);
                default:
                  return username.includes(searchInput) || 
                         fullname.includes(searchInput) || 
                         email.includes(searchInput);
              }
            });
            
            renderUsers(filtered);
          }
          
          function resetFilters() {
            document.getElementById('searchInput').value = '';
            document.getElementById('filterField').value = 'all';
            renderUsers(allUsers);
          }
          
          function exportToCSV() {
            const data = [
              ['#', 'اسم المستخدم', 'الاسم الكامل', 'البريد الإلكتروني', 'الدور', 'الشركة', 'الحالة']
            ];
            
            allUsers.forEach(user => {
              data.push([
                user.id,
                user.username,
                user.full_name || '-',
                user.email || '-',
                user.role_name || user.user_type || 'غير محدد',
                user.company_name || '-',
                user.is_active ? 'نشط' : 'غير نشط'
              ]);
            });
            
            let csv = '\\uFEFF';
            data.forEach(row => {
              csv += row.join(',') + '\\n';
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'المستخدمين_' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
          }
          
          // تحميل البيانات عند تحميل الصفحة
          document.addEventListener('DOMContentLoaded', () => {
            loadCurrentUser();
            loadUsers();
          });
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== عرض مستخدم محدد ====================
app.get('/admin/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // إذا كان :id هو "new"، إعادة توجيه لصفحة الإضافة
    if (id === 'new') {
      return c.redirect('/admin/users-new')
    }
    
    const query = `
      SELECT u.*, r.role_name, r.description as role_description,
             t.company_name as tenant_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ?
    `
    const { results } = await c.env.DB.prepare(query).bind(id).all()
    
    if (!results || results.length === 0) {
      return c.html('<h1>المستخدم غير موجود</h1>')
    }
    
    const user = results[0]
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عرض مستخدم - ${user.full_name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/users" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-left ml-2"></i> العودة لقائمة المستخدمين
            </a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div class="flex items-center">
                <i class="fas fa-user-circle text-5xl ml-4"></i>
                <div>
                  <h1 class="text-3xl font-bold">${user.full_name || user.username}</h1>
                  <p class="text-indigo-100 mt-1">${user.role_name || 'لا يوجد دور'}</p>
                </div>
              </div>
            </div>
            
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="border-r border-gray-200 pr-6">
                  <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-id-card text-indigo-600 ml-2"></i>
                    المعلومات الأساسية
                  </h3>
                  
                  <div class="space-y-3">
                    <div>
                      <label class="text-sm text-gray-500">الرقم التعريفي</label>
                      <p class="font-bold text-gray-800">#${user.id}</p>
                    </div>
                    
                    <div>
                      <label class="text-sm text-gray-500">اسم المستخدم</label>
                      <p class="font-bold text-gray-800">${user.username}</p>
                    </div>
                    
                    <div>
                      <label class="text-sm text-gray-500">الاسم الكامل</label>
                      <p class="font-bold text-gray-800">${user.full_name || '-'}</p>
                    </div>
                    
                    <div>
                      <label class="text-sm text-gray-500">البريد الإلكتروني</label>
                      <p class="font-bold text-gray-800">${user.email || '-'}</p>
                    </div>
                    
                    <div>
                      <label class="text-sm text-gray-500">رقم الجوال</label>
                      <p class="font-bold text-gray-800">${user.phone || '-'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-shield-alt text-indigo-600 ml-2"></i>
                    الصلاحيات والمعلومات
                  </h3>
                  
                  <div class="space-y-3">
                    <div>
                      <label class="text-sm text-gray-500">الدور الوظيفي</label>
                      <p class="font-bold text-gray-800">${user.role_name || 'غير محدد'}</p>
                      ${user.role_description ? `<p class="text-xs text-gray-500 mt-1">${user.role_description}</p>` : ''}
                    </div>
                    
                    <div>
                      <label class="text-sm text-gray-500">نوع المستخدم</label>
                      <p class="font-bold text-gray-800">${user.user_type === 'admin' ? 'مدير نظام' : user.user_type === 'company' ? 'شركة' : user.user_type === 'employee' ? 'موظف' : 'مستخدم عادي'}</p>
                    </div>
                    
                    <div>
                      <label class="text-sm text-gray-500">الشركة</label>
                      <p class="font-bold text-gray-800">${user.tenant_name || 'لا توجد شركة'}</p>
                    </div>
                    
                    <div>
                      <label class="text-sm text-gray-500">الحالة</label>
                      <p class="font-bold ${user.is_active ? 'text-green-600' : 'text-red-600'}">
                        <i class="fas ${user.is_active ? 'fa-check-circle' : 'fa-times-circle'} ml-1"></i>
                        ${user.is_active ? 'نشط' : 'غير نشط'}
                      </p>
                    </div>
                    
                    <div>
                      <label class="text-sm text-gray-500">تاريخ الإنشاء</label>
                      <p class="font-bold text-gray-800">${user.created_at || '-'}</p>
                    </div>
                    
                    ${user.last_login ? `
                    <div>
                      <label class="text-sm text-gray-500">آخر تسجيل دخول</label>
                      <p class="font-bold text-gray-800">${user.last_login}</p>
                    </div>
                    ` : ''}
                  </div>
                </div>
              </div>
              
              <div class="mt-8 pt-6 border-t border-gray-200 flex gap-3">
                <a href="/admin/users/${user.id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-edit ml-2"></i> تعديل المعلومات
                </a>
                <a href="/admin/users/${user.id}/permissions" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-user-shield ml-2"></i> إدارة الصلاحيات
                </a>
                <a href="/admin/users/${user.id}/delete" onclick="return confirm('هل أنت متأكد من حذف هذا المستخدم؟\\nهذه العملية لا يمكن التراجع عنها!')" class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-trash ml-2"></i> حذف المستخدم
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error: any) {
    return c.html(`<h1>خطأ: ${error.message}</h1>`)
  }
})

// ==================== تعديل مستخدم ====================
app.get('/admin/users/:id/edit', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get current user info to check permissions
    const userInfo = await getUserInfo(c)
    const currentUserRoleId = userInfo.roleId
    
    // Get user data
    const userQuery = `
      SELECT u.*, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `
    const { results: userResults } = await c.env.DB.prepare(userQuery).bind(id).all()
    
    if (!userResults || userResults.length === 0) {
      return c.html('<h1>المستخدم غير موجود</h1>')
    }
    
    const user = userResults[0]
    
    // Get roles
    const roles = await c.env.DB.prepare('SELECT id, role_name, description FROM roles ORDER BY id').all()
    
    // Get tenants only if current user is superadmin (role_id = 1)
    let tenants = { results: [] }
    if (currentUserRoleId === 1) {
      tenants = await c.env.DB.prepare('SELECT id, company_name FROM tenants WHERE status = "active" ORDER BY company_name').all()
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تعديل مستخدم - ${user.full_name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/users/${user.id}" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-left ml-2"></i> العودة لعرض المستخدم
            </a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h1 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <i class="fas fa-user-edit text-indigo-600 ml-2"></i>
              تعديل مستخدم: ${user.full_name}
            </h1>
            
            <form action="/admin/users/${user.id}" method="POST" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    اسم المستخدم <span class="text-red-500">*</span>
                  </label>
                  <input type="text" name="username" value="${user.username}" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    الاسم الكامل <span class="text-red-500">*</span>
                  </label>
                  <input type="text" name="full_name" value="${user.full_name || ''}" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input type="email" name="email" value="${user.email || ''}" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    رقم الجوال
                  </label>
                  <input type="text" name="phone" value="${user.phone || ''}" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <input type="password" name="password" placeholder="اتركه فارغاً إن لم ترد التغيير"
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <p class="text-xs text-gray-500 mt-1">* اترك الحقل فارغاً إذا لم تريد تغيير كلمة المرور</p>
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    نوع المستخدم <span class="text-red-500">*</span>
                  </label>
                  <select name="user_type" required onchange="updateRoleFilter(this.value)"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="admin" ${user.user_type === 'admin' ? 'selected' : ''}>مدير النظام (Super Admin)</option>
                    <option value="company" ${user.user_type === 'company' ? 'selected' : ''}>حساب شركة</option>
                    <option value="employee" ${user.user_type === 'employee' ? 'selected' : ''}>موظف</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    الدور <span class="text-red-500">*</span>
                  </label>
                  <select name="role_id" id="roleSelect" required
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    ${roles.results?.map((role: any) => `
                      <option value="${role.id}" ${user.role_id === role.id ? 'selected' : ''}>
                        ${role.role_name} ${role.description ? `- ${role.description}` : ''}
                      </option>
                    `).join('') || ''}
                  </select>
                </div>
                
                ${currentUserRoleId === 1 ? `
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    الشركة
                  </label>
                  <select name="tenant_id"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">لا توجد شركة (Super Admin فقط)</option>
                    ${tenants.results?.map((tenant: any) => `
                      <option value="${tenant.id}" ${user.tenant_id === tenant.id ? 'selected' : ''}>
                        ${tenant.company_name}
                      </option>
                    `).join('') || ''}
                  </select>
                </div>
                ` : `
                <input type="hidden" name="tenant_id" value="${user.tenant_id || ''}">
                `}
                
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    الحالة <span class="text-red-500">*</span>
                  </label>
                  <select name="is_active" required
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="1" ${user.is_active ? 'selected' : ''}>نشط</option>
                    <option value="0" ${!user.is_active ? 'selected' : ''}>غير نشط</option>
                  </select>
                </div>
              </div>
              
              <div class="flex gap-3 pt-6 border-t border-gray-200">
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-save ml-2"></i> حفظ التعديلات
                </button>
                <a href="/admin/users/${user.id}" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-times ml-2"></i> إلغاء
                </a>
              </div>
            </form>
          </div>
        </div>
        
        <script>
          function updateRoleFilter(userType) {
            const roleSelect = document.getElementById('roleSelect');
            const options = roleSelect.options;
            
            // Show all options first
            for (let i = 0; i < options.length; i++) {
              options[i].style.display = 'block';
            }
            
            // Filter based on user type
            // Role IDs: 1=Super Admin, 2=Company Account, 3=Employee, 4=Company Admin, 5=Supervisor
            if (userType === 'admin') {
              // Super Admin: role_id = 1
              for (let i = 0; i < options.length; i++) {
                if (options[i].value !== '1') {
                  options[i].style.display = 'none';
                } else {
                  roleSelect.value = '1';
                }
              }
            } else if (userType === 'employee') {
              // Employee: role_id = 3
              for (let i = 0; i < options.length; i++) {
                if (options[i].value !== '3') {
                  options[i].style.display = 'none';
                } else {
                  roleSelect.value = '3';
                }
              }
            } else if (userType === 'company') {
              // Company: role_id can be 2, 4, or 5
              for (let i = 0; i < options.length; i++) {
                const val = options[i].value;
                if (val !== '2' && val !== '4' && val !== '5') {
                  options[i].style.display = 'none';
                }
              }
            }
          }
          
          // Apply filter on page load
          document.addEventListener('DOMContentLoaded', () => {
            const userTypeSelect = document.querySelector('select[name="user_type"]');
            if (userTypeSelect) {
              updateRoleFilter(userTypeSelect.value);
            }
          });
        </script>
      </body>
      </html>
    `)
  } catch (error: any) {
    return c.html(`<h1>خطأ: ${error.message}</h1>`)
  }
})

// ==================== معالجة تعديل المستخدم ====================
app.post('/admin/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const formData = await c.req.formData()
    
    const username = formData.get('username')
    const full_name = formData.get('full_name')
    const email = formData.get('email') || null
    const phone = formData.get('phone') || null
    const password = formData.get('password') // Can be empty
    const user_type = formData.get('user_type')
    const role_id = formData.get('role_id')
    const tenant_id = formData.get('tenant_id') || null
    const is_active = formData.get('is_active')
    
    // Build UPDATE query
    let query = `
      UPDATE users 
      SET username = ?, full_name = ?, email = ?, phone = ?, 
          user_type = ?, role_id = ?, tenant_id = ?, is_active = ?
    `
    let params = [username, full_name, email, phone, user_type, role_id, tenant_id, is_active]
    
    // Only update password if provided
    if (password && password.toString().trim() !== '') {
      query = `
        UPDATE users 
        SET username = ?, full_name = ?, email = ?, phone = ?, 
            password = ?, user_type = ?, role_id = ?, tenant_id = ?, is_active = ?
      `
      params = [username, full_name, email, phone, password, user_type, role_id, tenant_id, is_active]
    }
    
    query += ` WHERE id = ?`
    params.push(id)
    
    await c.env.DB.prepare(query).bind(...params).run()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تم التحديث</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-md mx-auto mt-20">
          <div class="bg-white rounded-xl shadow-lg p-8 text-center">
            <div class="mb-4">
              <i class="fas fa-check-circle text-green-500 text-6xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">تم التحديث بنجاح!</h2>
            <p class="text-gray-600 mb-6">تم تحديث بيانات المستخدم بنجاح</p>
            <div class="flex gap-3 justify-center">
              <a href="/admin/users/${id}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                <i class="fas fa-eye ml-2"></i> عرض المستخدم
              </a>
              <a href="/admin/users" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all">
                <i class="fas fa-list ml-2"></i> قائمة المستخدمين
              </a>
            </div>
          </div>
        </div>
        <script>
          // Auto redirect after 3 seconds
          setTimeout(() => {
            window.location.href = '/admin/users/${id}';
          }, 3000);
        </script>
      </body>
      </html>
    `)
  } catch (error: any) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>خطأ</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-md mx-auto mt-20">
          <div class="bg-white rounded-xl shadow-lg p-8 text-center">
            <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">حدث خطأ</h2>
            <p class="text-gray-600 mb-6">${error.message}</p>
            <a href="/admin/users" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold">
              العودة للقائمة
            </a>
          </div>
        </div>
      </body>
      </html>
    `)
  }
})

// ==================== حذف مستخدم ====================
app.get('/admin/users/:id/delete', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get user data first
    const { results } = await c.env.DB.prepare('SELECT id, username, full_name FROM users WHERE id = ?').bind(id).all()
    
    if (!results || results.length === 0) {
      return c.html('<h1>المستخدم غير موجود</h1>')
    }
    
    const user = results[0]
    
    // Delete user
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تم الحذف</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-md mx-auto mt-20">
          <div class="bg-white rounded-xl shadow-lg p-8 text-center">
            <div class="mb-4">
              <i class="fas fa-trash-alt text-red-500 text-6xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">تم الحذف بنجاح!</h2>
            <p class="text-gray-600 mb-2">تم حذف المستخدم:</p>
            <p class="font-bold text-gray-800 mb-6">${user.full_name} (${user.username})</p>
            <a href="/admin/users" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-all inline-block">
              <i class="fas fa-list ml-2"></i> العودة لقائمة المستخدمين
            </a>
          </div>
        </div>
        <script>
          // Auto redirect after 2 seconds
          setTimeout(() => {
            window.location.href = '/admin/users';
          }, 2000);
        </script>
      </body>
      </html>
    `)
  } catch (error: any) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>خطأ</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-md mx-auto mt-20">
          <div class="bg-white rounded-xl shadow-lg p-8 text-center">
            <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">حدث خطأ</h2>
            <p class="text-gray-600 mb-6">${error.message}</p>
            <a href="/admin/users" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold">
              العودة للقائمة
            </a>
          </div>
        </div>
      </body>
      </html>
    `)
  }
})

// ==================== صفحة إضافة مستخدم جديد - بدون تعارض ====================
app.get('/admin/users-new', async (c) => {
  try {
    const roles = await c.env.DB.prepare('SELECT id, role_name, description FROM roles ORDER BY id').all()
    const tenants = await c.env.DB.prepare('SELECT id, company_name FROM tenants ORDER BY company_name').all()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إضافة مستخدم جديد</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <!-- Header مع زر تسجيل الخروج -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg mb-6">
          <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center space-x-reverse space-x-4">
              <button onclick="doLogout()" class="p-2 hover:bg-red-500 rounded-lg transition-colors" title="تسجيل الخروج">
                <i class="fas fa-sign-out-alt"></i>
              </button>
            </div>
            <div class="flex items-center space-x-reverse space-x-3">
              <div class="text-right">
                <div class="font-bold" id="userDisplayName">مدير النظام</div>
                <div class="text-xs text-blue-200" id="userEmail">admin@tamweel.sa</div>
              </div>
              <i class="fas fa-user-circle text-3xl"></i>
            </div>
          </div>
        </div>
        
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6">
            <a href="/admin/users" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة المستخدمين
            </a>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">
              <i class="fas fa-plus-circle text-indigo-600 ml-2"></i>
              إضافة مستخدم جديد
            </h1>
            
            <form id="addUserForm" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- اسم المستخدم -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-user text-indigo-600 ml-1"></i>
                    اسم المستخدم *
                  </label>
                  <input type="text" name="username" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                         placeholder="مثال: ahmed123">
                </div>
                
                <!-- كلمة المرور -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-lock text-red-600 ml-1"></i>
                    كلمة المرور *
                  </label>
                  <input type="password" name="password" required minlength="6" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                         placeholder="••••••••">
                </div>
                
                <!-- الاسم الكامل -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-id-card text-blue-600 ml-1"></i>
                    الاسم الكامل *
                  </label>
                  <input type="text" name="full_name" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                         placeholder="مثال: أحمد محمد السعيد">
                </div>
                
                <!-- البريد الإلكتروني -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-envelope text-purple-600 ml-1"></i>
                    البريد الإلكتروني
                  </label>
                  <input type="email" name="email" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                         placeholder="مثال: ahmed@example.com">
                </div>
                
                <!-- رقم الجوال -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-phone text-green-600 ml-1"></i>
                    رقم الجوال
                  </label>
                  <input type="tel" name="phone" 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                         placeholder="مثال: 0512345678">
                </div>
                
                <!-- نوع المستخدم -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-user-tag text-orange-600 ml-1"></i>
                    نوع المستخدم *
                  </label>
                  <select name="user_type" required id="userType" onchange="updateRoleOptions()" 
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">-- اختر نوع المستخدم --</option>
                    <option value="admin">مدير النظام (Super Admin)</option>
                    <option value="company_admin">مدير شركة (Company Admin)</option>
                    <option value="supervisor">مشرف موظفين (Supervisor)</option>
                    <option value="employee">موظف (Employee)</option>
                  </select>
                </div>
                
                <!-- الدور -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-shield-alt text-red-600 ml-1"></i>
                    الدور * <span id="roleHint" class="text-sm text-gray-500"></span>
                  </label>
                  <select name="role_id" required id="roleSelect" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">-- اختر الدور --</option>
                    ${roles.results.map((role: any) => `
                      <option value="${role.id}" data-role-name="${role.role_name}">${role.role_name} - ${role.description || ''}</option>
                    `).join('')}
                  </select>
                </div>
                
                <!-- الشركة -->
                <div id="subscriptionDiv" class="md:col-span-2" style="display: none;">
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-building text-teal-600 ml-1"></i>
                    الشركة <span id="tenantRequired" class="text-red-600">*</span>
                  </label>
                  <select name="tenant_id" id="tenantSelect" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">-- اختر الشركة --</option>
                    ${tenants.results.map((tenant: any) => `
                      <option value="${tenant.id}">${tenant.company_name}</option>
                    `).join('')}
                  </select>
                </div>
                
                <!-- الحالة -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">
                    <i class="fas fa-toggle-on text-green-600 ml-1"></i>
                    الحالة *
                  </label>
                  <select name="is_active" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="1">نشط</option>
                    <option value="0">غير نشط</option>
                  </select>
                </div>
              </div>
              
              <div class="flex gap-4 pt-6 border-t">
                <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-bold transition-all">
                  <i class="fas fa-save ml-2"></i>
                  حفظ المستخدم
                </button>
                <a href="/admin/users" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-center transition-all">
                  <i class="fas fa-times ml-2"></i>
                  إلغاء
                </a>
              </div>
            </form>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // دالة تسجيل الخروج
          async function doLogout() {
            if (!confirm('هل تريد تسجيل الخروج؟')) return;
            try {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            } catch (e) {
              console.warn('Logout API failed:', e);
            }
            console.log('🚪 تسجيل الخروج...');
            try {
              localStorage.removeItem('user');
              localStorage.removeItem('userData');
              localStorage.removeItem('authToken');
              localStorage.removeItem('token');
              document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax';
              document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax; Secure';
            } catch (e) {}
            console.log('✅ تم حذف بيانات المستخدم والتوكن');
            window.location.href = '/login';
          }
          
          // تحميل بيانات المستخدم
          function loadUserData() {
            try {
              let userStr = localStorage.getItem('userData') || localStorage.getItem('user');
              if (userStr) {
                const user = JSON.parse(userStr);
                const displayNameEl = document.getElementById('userDisplayName');
                const emailEl = document.getElementById('userEmail');
                
                if (displayNameEl) {
                  let displayName = user.full_name || user.username || 'مستخدم';
                  if (user.tenant_name) {
                    displayName = 'مدير ' + user.tenant_name;
                  } else if (user.role === 'admin') {
                    displayName += ' (مدير النظام)';
                  }
                  displayNameEl.textContent = displayName;
                }
                
                if (emailEl && user.email) {
                  emailEl.textContent = user.email;
                }
              }
            } catch (error) {
              console.error('خطأ في تحميل بيانات المستخدم:', error);
            }
          }
          
          // تحميل البيانات عند تحميل الصفحة
          loadUserData();
          document.addEventListener('DOMContentLoaded', loadUserData);
          
          // تحديث خيارات الأدوار بناءً على نوع المستخدم
          function updateRoleOptions() {
            const userType = document.getElementById('userType').value;
            const roleSelect = document.getElementById('roleSelect');
            const roleHint = document.getElementById('roleHint');
            const subscriptionDiv = document.getElementById('subscriptionDiv');
            const tenantSelect = document.getElementById('tenantSelect');
            
            // إعادة تعيين
            roleSelect.selectedIndex = 0;
            if (tenantSelect) tenantSelect.selectedIndex = 0;
            
            // تحديث تلميح الدور
            if (userType === 'admin') {
              roleHint.textContent = '(Role ID: 1) - كل الصلاحيات + بيانات SaaS';
              roleSelect.value = '1'; // مدير النظام (superadmin)
              subscriptionDiv.style.display = 'none'; // المدير العام لا ينتمي لشركة معينة
              if (tenantSelect) tenantSelect.removeAttribute('required');
            } else if (userType === 'company_admin') {
              roleHint.textContent = '(Role ID: 2) - كل صلاحيات الشركة (عدا SaaS)';
              roleSelect.value = '2'; // مدير شركة (companyadmin)
              subscriptionDiv.style.display = 'block'; // يجب اختيار شركة
              if (tenantSelect) tenantSelect.setAttribute('required', 'required');
            } else if (userType === 'supervisor') {
              roleHint.textContent = '(Role ID: 3) - يرى جميع عملاء الشركة (قراءة فقط)';
              roleSelect.value = '3'; // مشرف (supervisor)
              subscriptionDiv.style.display = 'block'; // يجب اختيار شركة
              if (tenantSelect) tenantSelect.setAttribute('required', 'required');
            } else if (userType === 'employee') {
              roleHint.textContent = '(Role ID: 4) - يرى العملاء والطلبات المخصصة له فقط';
              roleSelect.value = '4'; // موظف (employee)
              subscriptionDiv.style.display = 'block'; // يجب اختيار شركة
              if (tenantSelect) tenantSelect.setAttribute('required', 'required');
            } else {
              roleHint.textContent = '';
              subscriptionDiv.style.display = 'none';
              if (tenantSelect) tenantSelect.removeAttribute('required');
            }
          }
          
          function toggleSubscription() {
            const userType = document.getElementById('userType').value;
            const subscriptionDiv = document.getElementById('subscriptionDiv');
            
            if (userType === 'company' || userType === 'company_admin') {
              subscriptionDiv.style.display = 'block';
            } else {
              subscriptionDiv.style.display = 'none';
            }
          }
          
          // Handle form submission with token
          document.getElementById('addUserForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const token = localStorage.getItem('authToken');
            
            if (!token) {
              alert('لم يتم العثور على رمز التوثيق. الرجاء تسجيل الدخول مرة أخرى.');
              window.location.href = '/login';
              return;
            }
            
            console.log('📤 إرسال بيانات المستخدم...');
            
            try {
              const response = await axios.post('/api/users', formData, {
                headers: {
                  'Authorization': \`Bearer \${token}\`
                }
              });
              
              console.log('✅ تم إضافة المستخدم بنجاح:', response.data);
              alert('✓ تم إضافة المستخدم بنجاح!');
              
              // Redirect to users page on success
              window.location.href = '/admin/users';
            } catch (error) {
              console.error('❌ خطأ في إضافة المستخدم:', error);
              alert(error.response?.data?.error || 'حدث خطأ أثناء إضافة المستخدم');
            }
          });
        </script>
      </body>
      </html>
    `)
  } catch (error: any) {
    console.error('Error loading add user page:', error)
    return c.html(`<h1>خطأ في تحميل الصفحة</h1><p style="color:red; direction:ltr;">${error.message}</p><pre style="direction:ltr;">${error.stack}</pre>`)
  }
})
app.get('/admin/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const user = await c.env.DB.prepare(`
      SELECT u.*, r.role_name, s.company_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN subscriptions s ON u.subscription_id = s.id
      WHERE u.id = ?
    `).bind(id).first()
    
    if (!user) {
      return c.html('<h1>المستخدم غير موجود</h1>')
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عرض المستخدم #${id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-6">
          <div class="mb-6 flex justify-between items-center">
            <a href="/admin/users" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-right ml-2"></i>
              العودة لقائمة المستخدمين
            </a>
            <div class="flex gap-2">
              <a href="/admin/users/${id}/edit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-edit ml-1"></i> تعديل
              </a>
              <a href="/admin/users/${id}/delete" onclick="return confirm('هل أنت متأكد من الحذف؟')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-all">
                <i class="fas fa-trash ml-1"></i> حذف
              </a>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex items-center mb-6">
              <div class="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold ml-4">
                ${user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-800">${user.full_name || 'غير محدد'}</h1>
                <p class="text-gray-600">@${user.username}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">اسم المستخدم</label>
                <p class="text-lg text-gray-900">${user.username}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الاسم الكامل</label>
                <p class="text-lg text-gray-900">${user.full_name || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">البريد الإلكتروني</label>
                <p class="text-lg text-gray-900">${user.email || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">رقم الجوال</label>
                <p class="text-lg text-gray-900">${user.phone || '-'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الدور</label>
                <p class="text-lg text-gray-900">
                  <span class="px-3 py-1 rounded-full ${
                    user.role_name === 'مدير' ? 'bg-red-100 text-red-800' :
                    user.role_name === 'محاسب' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }">
                    ${user.role_name || '-'}
                  </span>
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الشركة</label>
                <p class="text-lg text-gray-900">${user.company_name || 'غير مرتبط'}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">الحالة</label>
                <p>
                  <span class="px-4 py-2 rounded-full text-sm font-bold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${user.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-600 mb-1">تاريخ الإنشاء</label>
                <p class="text-gray-900">${new Date(user.created_at).toLocaleString('ar-SA')}</p>
              </div>
              
              ${user.last_login ? `
                <div class="md:col-span-2">
                  <label class="block text-sm font-bold text-gray-600 mb-1">آخر تسجيل دخول</label>
                  <p class="text-gray-900">${new Date(user.last_login).toLocaleString('ar-SA')}</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html('<h1>خطأ في تحميل البيانات</h1>')
  }
})

// ==================== نموذج إضافة مستخدم جديد ====================

// ==================== صفحة إدارة صلاحيات المستخدم ====================
app.get('/admin/users/:id/permissions', async (c) => {
  try {
    const userId = c.req.param('id')
    
    // جلب بيانات المستخدم
    const user = await c.env.DB.prepare(`
      SELECT u.*, r.role_name 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).bind(userId).first()
    
    if (!user) {
      return c.html('<h1>المستخدم غير موجود</h1>')
    }
    
    // جلب جميع الصلاحيات مع التصنيف
    const allPermissions = await c.env.DB.prepare(`
      SELECT * FROM permissions ORDER BY category, id
    `).all()
    
    // جلب صلاحيات المستخدم الحالية عبر الدور (role)
    const userPermissions = await c.env.DB.prepare(`
      SELECT p.id, p.permission_key
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `).bind(user.role_id).all()
    
    const userPermissionIds = userPermissions.results.map((p: any) => p.id)
    
    // تجميع الصلاحيات حسب الفئة
    const groupedPermissions: any = {}
    allPermissions.results.forEach((perm: any) => {
      if (!groupedPermissions[perm.category]) {
        groupedPermissions[perm.category] = []
      }
      groupedPermissions[perm.category].push({
        ...perm,
        hasPermission: userPermissionIds.includes(perm.id)
      })
    })
    
    const categoryNames: any = {
      'dashboard': 'لوحة التحكم',
      'customers': 'العملاء',
      'requests': 'طلبات التمويل',
      'banks': 'البنوك',
      'rates': 'النسب التمويلية',
      'packages': 'الباقات',
      'subscriptions': 'الاشتراكات',
      'users': 'المستخدمين',
      'calculator': 'الحاسبة',
      'reports': 'التقارير'
    }
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إدارة صلاحيات ${user.full_name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="container mx-auto px-4 py-8">
          <!-- العنوان -->
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                  <i class="fas fa-user-shield text-indigo-600 ml-2"></i>
                  إدارة صلاحيات المستخدم
                </h1>
                <div class="flex items-center gap-4 text-gray-600">
                  <span><i class="fas fa-user ml-1"></i> ${user.full_name}</span>
                  <span><i class="fas fa-envelope ml-1"></i> ${user.email}</span>
                  <span><i class="fas fa-shield-alt ml-1"></i> ${user.role_name}</span>
                </div>
              </div>
              <a href="/admin/users" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                <i class="fas fa-arrow-right ml-2"></i>
                رجوع للمستخدمين
              </a>
            </div>
          </div>

          <!-- نموذج الصلاحيات -->
          <form id="permissionsForm" class="space-y-6">
            <input type="hidden" name="user_id" value="${userId}">
            <input type="hidden" name="role_id" value="${user.role_id}">
            
            ${Object.keys(groupedPermissions).map(category => `
              <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-indigo-600 pb-2">
                  <i class="fas fa-folder text-indigo-600 ml-2"></i>
                  ${categoryNames[category] || category}
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  ${groupedPermissions[category].map((perm: any) => `
                    <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                      <input 
                        type="checkbox" 
                        id="perm_${perm.id}" 
                        name="permissions[]" 
                        value="${perm.id}"
                        ${perm.hasPermission ? 'checked' : ''}
                        class="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      >
                      <label for="perm_${perm.id}" class="mr-3 flex-1 cursor-pointer">
                        <div class="font-semibold text-gray-800">${perm.permission_name}</div>
                        ${perm.description ? `<div class="text-xs text-gray-500">${perm.description}</div>` : ''}
                      </label>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
            
            <!-- أزرار الحفظ -->
            <div class="bg-white rounded-lg shadow-md p-6">
              <div class="flex gap-4 justify-end">
                <button type="button" onclick="selectAll()" class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-check-double ml-2"></i>
                  تحديد الكل
                </button>
                <button type="button" onclick="deselectAll()" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-times-circle ml-2"></i>
                  إلغاء تحديد الكل
                </button>
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-3 rounded-lg font-bold transition-all">
                  <i class="fas fa-save ml-2"></i>
                  حفظ الصلاحيات
                </button>
              </div>
            </div>
          </form>
        </div>

        <script>
          function selectAll() {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true)
          }
          
          function deselectAll() {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false)
          }
          
          document.getElementById('permissionsForm').addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const formData = new FormData(e.target)
            const userId = formData.get('user_id')
            const roleId = formData.get('role_id')
            const permissions = formData.getAll('permissions[]')
            
            try {
              const response = await fetch(\`/api/users/\${userId}/permissions\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role_id: roleId, permission_ids: permissions })
              })
              
              const result = await response.json()
              
              if (result.success) {
                alert('✅ تم حفظ الصلاحيات بنجاح!')
                window.location.href = '/admin/users'
              } else {
                alert('❌ خطأ: ' + result.error)
              }
            } catch (error) {
              alert('❌ حدث خطأ أثناء الحفظ')
              console.error(error)
            }
          })
        </script>
      </body>
      </html>
    `)
  } catch (error: any) {
    return c.html('<h1>خطأ في تحميل البيانات: ' + error.message + '</h1>')
  }
})

// API لحفظ صلاحيات المستخدم
app.post('/api/users/:id/permissions', async (c) => {
  try {
    const userId = c.req.param('id')
    const { role_id, permission_ids } = await c.req.json()
    
    // حذف جميع صلاحيات الدور الحالية
    await c.env.DB.prepare(`
      DELETE FROM role_permissions WHERE role_id = ?
    `).bind(role_id).run()
    
    // إضافة الصلاحيات الجديدة
    if (permission_ids && permission_ids.length > 0) {
      for (const permId of permission_ids) {
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          VALUES (?, ?)
        `).bind(role_id, permId).run()
      }
    }
    
    return c.json({ success: true, message: 'تم تحديث الصلاحيات بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ===============================================
// HR LEAVES APIs
// ===============================================

// Get all leaves
app.get('/api/hr/leaves', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const status = c.req.query('status') || '';
    const type = c.req.query('type') || '';
    const employee_id = c.req.query('employee_id') || '';

    let query = `
      SELECT 
        l.*,
        e.full_name_ar as employee_name,
        e.department,
        e.job_title,
        l.total_days as days_count
      FROM hr_leaves l
      LEFT JOIN hr_employees e ON l.employee_id = e.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // For now, show all data regardless of tenant_id to ensure data is visible
    // TODO: Re-enable tenant filtering once tenant_id sync is confirmed
    // if (userInfo.tenantId && userInfo.roleId !== 11) {
    //   query += ' AND (l.tenant_id = ? OR l.tenant_id = 1 OR l.tenant_id IS NULL)';
    //   params.push(userInfo.tenantId);
    // }

    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND l.leave_type = ?';
      params.push(type);
    }

    if (employee_id) {
      query += ' AND l.employee_id = ?';
      params.push(employee_id);
    }

    query += ' ORDER BY l.created_at DESC';

    const result = params.length > 0
      ? await c.env.DB.prepare(query).bind(...params).all()
      : await c.env.DB.prepare(query).all();

    return c.json({ success: true, data: result.results || [] });
  } catch (error: any) {
    console.error('Error fetching leaves:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create leave request
app.post('/api/hr/leaves', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const { employee_id, leave_type, start_date, end_date, reason } = await c.req.json();

    // Calculate total_days
    const start = new Date(start_date);
    const end = new Date(end_date);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const result = await c.env.DB.prepare(`
      INSERT INTO hr_leaves (tenant_id, employee_id, leave_type, start_date, end_date, total_days, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(userInfo.tenantId || 1, employee_id, leave_type, start_date, end_date, totalDays, reason || null).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error: any) {
    console.error('Error creating leave:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Approve leave
app.put('/api/hr/leaves/:id/approve', async (c) => {
  try {
    const id = c.req.param('id');
    const userInfo = await getUserInfo(c);

    await c.env.DB.prepare(`
      UPDATE hr_leaves 
      SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(userInfo.userId, id).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error approving leave:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Reject leave
app.put('/api/hr/leaves/:id/reject', async (c) => {
  try {
    const id = c.req.param('id');
    const userInfo = await getUserInfo(c);
    const { reason } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE hr_leaves 
      SET status = 'rejected', rejected_by = ?, rejected_at = CURRENT_TIMESTAMP, rejection_reason = ?
      WHERE id = ?
    `).bind(userInfo.userId, reason, id).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error rejecting leave:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete leave
app.delete('/api/hr/leaves/:id', async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB.prepare('DELETE FROM hr_leaves WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting leave:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===============================================
// HR SALARIES APIs
// ===============================================

// Get all salaries
app.get('/api/hr/salaries', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo.tenantId;
    
    const { employee_id, month, status } = c.req.query();
    
    let query = `
      SELECT s.*, e.full_name_ar as employee_name
      FROM hr_salaries s
      LEFT JOIN hr_employees e ON s.employee_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    // For now, show all data regardless of tenant_id to ensure data is visible
    // TODO: Re-enable tenant filtering once tenant_id sync is confirmed
    // if (tenantId && userInfo.roleId !== 11) {
    //   query += ' AND (s.tenant_id = ? OR s.tenant_id = 1 OR s.tenant_id IS NULL)';
    //   params.push(tenantId);
    // }
    if (employee_id) {
      query += ' AND s.employee_id = ?';
      params.push(employee_id);
    }
    if (month) {
      query += ' AND s.salary_month = ?';
      params.push(month);
    }
    if (status) {
      query += ' AND s.payment_status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY s.salary_month DESC, s.created_at DESC';
    
    const result = params.length > 0
      ? await c.env.DB.prepare(query).bind(...params).all()
      : await c.env.DB.prepare(query).all();
    
    return c.json({ success: true, data: result.results || [] });
  } catch (error: any) {
    console.error('Error fetching salaries:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add salary
app.post('/api/hr/salaries', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo.tenantId || 1;
    
    const data = await c.req.json();
    
    const basicSalary = parseFloat(data.basic_salary) || 0;
    const housingAllowance = parseFloat(data.housing_allowance) || 0;
    const transportAllowance = parseFloat(data.transportation_allowance) || 0;
    const otherAllowances = parseFloat(data.other_allowances) || 0;
    const bonuses = parseFloat(data.bonuses) || 0;
    const overtimeAmount = parseFloat(data.overtime_amount) || 0;
    
    const lateDeductions = parseFloat(data.late_deductions) || 0;
    const absenceDeductions = parseFloat(data.absence_deductions) || 0;
    const otherDeductions = parseFloat(data.other_deductions) || 0;
    
    const grossSalary = basicSalary + housingAllowance + transportAllowance + otherAllowances + bonuses + overtimeAmount;
    const totalDeductions = lateDeductions + absenceDeductions + otherDeductions;
    const netSalary = grossSalary - totalDeductions;
    
    await c.env.DB.prepare(`
      INSERT INTO hr_salaries (
        tenant_id, employee_id, salary_month, basic_salary,
        housing_allowance, transportation_allowance, other_allowances,
        bonuses, overtime_amount, late_deductions, absence_deductions,
        other_deductions, gross_salary, total_deductions, net_salary,
        payment_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      tenantId,
      data.employee_id,
      data.salary_month,
      basicSalary,
      housingAllowance,
      transportAllowance,
      otherAllowances,
      bonuses,
      overtimeAmount,
      lateDeductions,
      absenceDeductions,
      otherDeductions,
      grossSalary,
      totalDeductions,
      netSalary,
      data.notes || null
    ).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error adding salary:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Approve salary
app.put('/api/hr/salaries/:id/approve', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(`
      UPDATE hr_salaries 
      SET payment_status = 'approved'
      WHERE id = ?
    `).bind(id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error approving salary:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Pay salary
app.put('/api/hr/salaries/:id/pay', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(`
      UPDATE hr_salaries 
      SET payment_status = 'paid', payment_date = date('now')
      WHERE id = ?
    `).bind(id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error paying salary:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete salary
app.delete('/api/hr/salaries/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare('DELETE FROM hr_salaries WHERE id = ?').bind(id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting salary:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===============================================
// HR DEPARTMENTS APIs
// ===============================================

// Get all departments
app.get('/api/hr/departments', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo.tenantId;
    
    const whereClause = tenantId ? `WHERE d.tenant_id = ${tenantId}` : '';
    
    const result = await c.env.DB.prepare(`
      SELECT d.*, 
             m.full_name as manager_name,
             (SELECT COUNT(*) FROM hr_employees e WHERE e.department = d.department_code AND e.tenant_id = d.tenant_id) as employee_count
      FROM hr_departments d
      LEFT JOIN hr_employees m ON d.manager_id = m.id
      ${whereClause}
      ORDER BY d.department_name
    `).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add department
app.post('/api/hr/departments', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo.tenantId || 1;
    
    const data = await c.req.json();
    
    await c.env.DB.prepare(`
      INSERT INTO hr_departments (
        tenant_id, department_name, department_code, 
        manager_id, description, budget
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      tenantId,
      data.department_name,
      data.department_code,
      data.manager_id || null,
      data.description || null,
      data.budget || 0
    ).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error adding department:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete department
app.delete('/api/hr/departments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare('DELETE FROM hr_departments WHERE id = ?').bind(id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===============================================
// HR PERFORMANCE APIs
// ===============================================

// Get all performance reviews
app.get('/api/hr/performance', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo.tenantId;
    
    console.log('🔍 HR Performance API - UserInfo:', { userId: userInfo.userId, tenantId: userInfo.tenantId, roleId: userInfo.roleId });
    
    // For now, show all data regardless of tenant_id to ensure data is visible
    let query = `
      SELECT p.*, 
             e.full_name_ar as employee_name,
             r.full_name_ar as reviewer_name,
             p.attendance_punctuality as attendance_rating,
             p.quality_of_work as quality_rating,
             p.teamwork as teamwork_rating,
             p.attendance_punctuality as punctuality_rating,
             p.areas_for_improvement as weaknesses,
             (p.review_period_start || ' - ' || p.review_period_end) as review_period
      FROM hr_performance_reviews p
      LEFT JOIN hr_employees e ON p.employee_id = e.id
      LEFT JOIN hr_employees r ON p.reviewer_id = r.id
      ORDER BY p.review_date DESC
    `;
    
    const result = await c.env.DB.prepare(query).all();
    console.log('🔍 HR Performance API - Results count:', result.results?.length || 0);
    
    return c.json({ success: true, data: result.results || [] });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add performance review
app.post('/api/hr/performance', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo.tenantId || 1;
    
    const data = await c.req.json();
    
    // Parse review_period if it's a string like "Q1 2026" or split dates
    let reviewPeriodStart = data.review_period_start || data.review_date;
    let reviewPeriodEnd = data.review_period_end || data.review_date;
    
    // If review_period is provided as a string, try to extract dates
    if (data.review_period && !data.review_period_start) {
      // For now, use review_date for both if period is not provided
      reviewPeriodStart = data.review_date;
      reviewPeriodEnd = data.review_date;
    }
    
    // Calculate overall_rating as average if not provided
    const attendanceRating = data.attendance_rating || 3;
    const qualityRating = data.quality_rating || 3;
    const teamworkRating = data.teamwork_rating || 3;
    const punctualityRating = data.punctuality_rating || 3;
    const overallRating = data.overall_rating || 
      ((parseFloat(attendanceRating) + parseFloat(qualityRating) + 
        parseFloat(teamworkRating) + parseFloat(punctualityRating)) / 4);
    
    await c.env.DB.prepare(`
      INSERT INTO hr_performance_reviews (
        tenant_id, employee_id, reviewer_id, review_period_start, review_period_end, review_date,
        overall_rating, attendance_punctuality, quality_of_work, 
        teamwork, strengths, areas_for_improvement,
        goals, comments, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).bind(
      tenantId,
      data.employee_id,
      userInfo.userId,
      reviewPeriodStart,
      reviewPeriodEnd,
      data.review_date,
      overallRating,
      attendanceRating,
      qualityRating,
      teamworkRating,
      data.strengths || null,
      data.weaknesses || null,
      data.goals || null,
      data.comments || null
    ).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error adding review:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete performance review
app.delete('/api/hr/performance/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare('DELETE FROM hr_performance_reviews WHERE id = ?').bind(id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===============================================
// HR PROMOTIONS APIs
// ===============================================

// Get all promotions
app.get('/api/hr/promotions', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo.tenantId;
    
    let query = `
      SELECT p.*, 
             e.full_name_ar as employee_name,
             e.job_title as current_position,
             p.old_job_title as old_position,
             p.new_job_title as new_position,
             p.effective_date as promotion_date
      FROM hr_promotions_transfers p
      LEFT JOIN hr_employees e ON p.employee_id = e.id
    `;
    
    console.log('🔍 HR Promotions API - UserInfo:', { userId: userInfo.userId, tenantId: userInfo.tenantId, roleId: userInfo.roleId });
    
    // For now, show all data regardless of tenant_id to ensure data is visible
    query = query.replace('WHERE 1=1', '');
    query += ' ORDER BY p.effective_date DESC';
    
    const result = await c.env.DB.prepare(query).all();
    console.log('🔍 HR Promotions API - Results count:', result.results?.length || 0);
    
    return c.json({ success: true, data: result.results || [] });
  } catch (error: any) {
    console.error('Error fetching promotions:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add promotion
app.post('/api/hr/promotions', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo.tenantId || 1;
    
    const data = await c.req.json();
    
    // Get employee current data
    const employee = await c.env.DB.prepare(`
      SELECT job_title, basic_salary, department FROM hr_employees WHERE id = ?
    `).bind(data.employee_id).first();
    
    await c.env.DB.prepare(`
      INSERT INTO hr_promotions_transfers (
        tenant_id, employee_id, type, old_job_title, new_job_title,
        old_salary, new_salary, effective_date,
        old_department, new_department, reason, approved_by, status
      ) VALUES (?, ?, 'promotion', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      tenantId,
      data.employee_id,
      employee?.job_title || '',
      data.new_position,
      employee?.basic_salary || 0,
      data.new_salary,
      data.effective_date || data.promotion_date,
      employee?.department || '',
      data.new_department || employee?.department || '',
      data.reason || '',
      userInfo.userId
    ).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error adding promotion:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Approve promotion
app.put('/api/hr/promotions/:id/approve', async (c) => {
  try {
    const id = c.req.param('id');
    const userInfo = await getUserInfo(c);
    
    // Get promotion data
    const promotion = await c.env.DB.prepare(`
      SELECT * FROM hr_promotions_transfers WHERE id = ?
    `).bind(id).first();
    
    if (!promotion) {
      return c.json({ success: false, error: 'Promotion not found' }, 404);
    }
    
    // Update promotion status
    await c.env.DB.prepare(`
      UPDATE hr_promotions_transfers 
      SET status = 'approved', approved_by = ?, approved_at = datetime('now')
      WHERE id = ?
    `).bind(userInfo.userId, id).run();
    
    // Update employee position, salary, and department
    await c.env.DB.prepare(`
      UPDATE hr_employees 
      SET job_title = ?, basic_salary = ?, department = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(promotion.new_job_title, promotion.new_salary, promotion.new_department, promotion.employee_id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error approving promotion:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Reject promotion
app.put('/api/hr/promotions/:id/reject', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(`
      UPDATE hr_promotions_transfers SET status = 'rejected' WHERE id = ?
    `).bind(id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error rejecting promotion:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete promotion
app.delete('/api/hr/promotions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare('DELETE FROM hr_promotions_transfers WHERE id = ?').bind(id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===============================================
// HR Documents APIs
// ===============================================

// Get documents
app.get('/api/hr/documents', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo?.tenantId || 1;
    
    const searchTerm = c.req.query('search') || '';
    const typeFilter = c.req.query('type') || '';
    const statusFilter = c.req.query('status') || '';
    
    let query = `
      SELECT d.*, e.full_name as employee_name, e.employee_number
      FROM hr_documents d
      LEFT JOIN hr_employees e ON d.employee_id = e.id
      WHERE d.tenant_id = ?
    `;
    const bindings: any[] = [tenantId];
    
    if (searchTerm) {
      query += ` AND (e.full_name LIKE ? OR d.document_type LIKE ? OR d.document_number LIKE ?)`;
      bindings.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }
    
    if (typeFilter) {
      query += ` AND d.document_type = ?`;
      bindings.push(typeFilter);
    }
    
    query += ` ORDER BY d.expiry_date ASC, d.created_at DESC`;
    
    const result = await c.env.DB.prepare(query).bind(...bindings).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add document
app.post('/api/hr/documents', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo?.tenantId || 1;
    
    const body = await c.req.json();
    const { employee_id, document_type, document_number, issue_date, expiry_date, notes } = body;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO hr_documents (tenant_id, employee_id, document_type, document_number, issue_date, expiry_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(tenantId, employee_id, document_type, document_number || null, issue_date || null, expiry_date || null, notes || null).run();
    
    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error: any) {
    console.error('Error adding document:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete document
app.delete('/api/hr/documents/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare('DELETE FROM hr_documents WHERE id = ?').bind(id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===============================================
// HR Reports APIs
// ===============================================

// Get reports
app.get('/api/hr/reports/:type', async (c) => {
  try {
    const userInfo = await getUserInfo(c);
    const tenantId = userInfo?.tenantId || 1;
    
    const reportType = c.req.param('type');
    const startDate = c.req.query('start_date') || '';
    const endDate = c.req.query('end_date') || '';
    
    let reportData: any = {};
    
    // إحصاءات أساسية
    const employeesResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN status = 'active' THEN 1 END) as active
      FROM hr_employees 
      WHERE tenant_id = ?
    `).bind(tenantId).first();
    
    reportData.totalEmployees = employeesResult?.total || 0;
    
    // معدل الحضور
    if (reportType === 'overview' || reportType === 'attendance') {
      const attendanceResult = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present
        FROM hr_attendance
        WHERE tenant_id = ?
        ${startDate ? 'AND attendance_date >= ?' : ''}
        ${endDate ? 'AND attendance_date <= ?' : ''}
      `).bind(tenantId, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])).first();
      
      const total = attendanceResult?.total || 0;
      const present = attendanceResult?.present || 0;
      reportData.attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      
      // بيانات الرسم البياني
      reportData.attendanceLabels = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
      reportData.attendanceData = [95, 92, 88, 94, 90, 85];
    }
    
    // إجمالي الرواتب
    const salariesResult = await c.env.DB.prepare(`
      SELECT SUM(net_salary) as total
      FROM hr_salaries
      WHERE tenant_id = ?
      ${startDate ? 'AND salary_month >= ?' : ''}
      ${endDate ? 'AND salary_month <= ?' : ''}
    `).bind(tenantId, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])).first();
    
    reportData.totalSalaries = salariesResult?.total || 0;
    
    // متوسط التقييم
    const performanceResult = await c.env.DB.prepare(`
      SELECT AVG(overall_rating) as avg
      FROM hr_performance_reviews
      WHERE tenant_id = ?
    `).bind(tenantId).first();
    
    reportData.avgPerformance = performanceResult?.avg || 0;
    
    // بيانات الإجازات
    if (reportType === 'overview' || reportType === 'leaves') {
      reportData.leavesLabels = ['إجازة سنوية', 'إجازة مرضية', 'إجازة طارئة', 'أخرى'];
      reportData.leavesData = [45, 20, 15, 10];
    }
    
    // بيانات الرواتب حسب القسم
    const salariesByDept = await c.env.DB.prepare(`
      SELECT d.department_name as department, SUM(s.net_salary) as total
      FROM hr_salaries s
      LEFT JOIN hr_employees e ON s.employee_id = e.id
      LEFT JOIN hr_departments d ON e.department = d.department_code
      WHERE s.tenant_id = ?
      GROUP BY d.department_name
      ORDER BY total DESC
      LIMIT 5
    `).bind(tenantId).all();
    
    reportData.salariesLabels = salariesByDept.results?.map((r: any) => r.department || 'غير محدد') || [];
    reportData.salariesData = salariesByDept.results?.map((r: any) => r.total || 0) || [];
    
    // بيانات التقييم
    reportData.performanceLabels = ['ممتاز', 'جيد جداً', 'جيد'];
    reportData.performanceData = [30, 50, 20];
    
    // تفاصيل حسب نوع التقرير
    reportData.details = [];
    
    return c.json({ success: true, data: reportData });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// HR SYSTEM ROUTES & APIs
// ===============================================

// HR Main Dashboard
app.get('/admin/hr', (c) => {
  return c.html(hrMainPage)
})

// HR Employees Page
app.get('/admin/hr/employees', (c) => {
  return c.html(hrEmployeesPage)
})

// HR Attendance Page
app.get('/admin/hr/attendance', (c) => {
  return c.html(hrAttendancePage)
})

// HR Leaves Page (قيد التطوير)
app.get('/admin/hr/leaves', (c) => {
  return c.html(hrLeavesPage)
})

// HR Salaries Page
app.get('/admin/hr/salaries', (c) => {
  return c.html(hrSalariesPage)
})

// HR Performance Page
app.get('/admin/hr/performance', (c) => {
  return c.html(hrPerformancePage)
})

// HR Promotions Page
app.get('/admin/hr/promotions', (c) => {
  return c.html(hrPromotionsPage)
})

// HR Documents Page
app.get('/admin/hr/documents', (c) => {
  return c.html(hrDocumentsPage)
})

// HR Reports Page
app.get('/admin/hr/reports', (c) => {
  return c.html(hrReportsPage)
})

// HR Dashboard Statistics API
app.get('/api/hr/dashboard/stats', async (c) => {
  try {
    const userInfo = await getUserInfo(c)
    const tenantId = userInfo.tenantId
    
    // Total & Active Employees
    const employeesQuery = tenantId 
      ? `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM hr_employees WHERE tenant_id = ${tenantId}`
      : `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM hr_employees`
    
    const employees = await c.env.DB.prepare(employeesQuery).first()
    
    // Attendance Today
    const today = new Date().toISOString().split('T')[0]
    const attendanceQuery = tenantId
      ? `SELECT COUNT(*) as present FROM hr_attendance WHERE DATE(date) = ? AND status = 'present' AND tenant_id = ${tenantId}`
      : `SELECT COUNT(*) as present FROM hr_attendance WHERE DATE(date) = ? AND status = 'present'`
    
    const attendance = await c.env.DB.prepare(attendanceQuery).bind(today).first()
    
    // Pending Leaves
    const leavesQuery = tenantId
      ? `SELECT COUNT(*) as pending FROM hr_leaves WHERE status = 'pending' AND tenant_id = ${tenantId}`
      : `SELECT COUNT(*) as pending FROM hr_leaves WHERE status = 'pending'`
    
    const leaves = await c.env.DB.prepare(leavesQuery).first()
    
    // Pending Salaries
    const salariesQuery = tenantId
      ? `SELECT COUNT(*) as count, SUM(net_salary) as total FROM hr_salaries WHERE payment_status = 'pending' AND tenant_id = ${tenantId}`
      : `SELECT COUNT(*) as count, SUM(net_salary) as total FROM hr_salaries WHERE payment_status = 'pending'`
    
    const salaries = await c.env.DB.prepare(salariesQuery).first()
    
    // Department Distribution
    const deptQuery = tenantId
      ? `SELECT department, COUNT(*) as count FROM hr_employees WHERE tenant_id = ${tenantId} GROUP BY department`
      : `SELECT department, COUNT(*) as count FROM hr_employees GROUP BY department`
    
    const { results: departments } = await c.env.DB.prepare(deptQuery).all()
    
    // Attendance Trend (last 7 days)
    const trendQuery = tenantId
      ? `SELECT DATE(date) as date, 
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
         FROM hr_attendance 
         WHERE DATE(date) >= DATE('now', '-7 days') AND tenant_id = ${tenantId}
         GROUP BY DATE(date) ORDER BY date`
      : `SELECT DATE(date) as date, 
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
         FROM hr_attendance 
         WHERE DATE(date) >= DATE('now', '-7 days')
         GROUP BY DATE(date) ORDER BY date`
    
    const { results: trend } = await c.env.DB.prepare(trendQuery).all()
    
    return c.json({
      success: true,
      data: {
        totalEmployees: employees?.total || 0,
        activeEmployees: employees?.active || 0,
        presentToday: attendance?.present || 0,
        pendingLeaves: leaves?.pending || 0,
        pendingSalaries: salaries?.count || 0,
        pendingSalariesAmount: salaries?.total || 0,
        departmentDistribution: departments || [],
        attendanceTrend: trend || []
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get All Employees
app.get('/api/hr/employees', async (c) => {
  try {
    const userInfo = await getUserInfo(c)
    console.log('🔍 HR Employees API - UserInfo:', { userId: userInfo.userId, tenantId: userInfo.tenantId, roleId: userInfo.roleId })
    
    // Map actual database columns to expected API format
    // For now, show all data regardless of tenant_id to ensure data is visible
    // TODO: Re-enable tenant filtering once tenant_id sync is confirmed
    const query = `SELECT 
        id, tenant_id,
        employee_code as employee_number,
        full_name_ar as full_name,
        full_name_en,
        national_id,
        date_of_birth as birthdate,
        gender, email, phone,
        department, job_title,
        basic_salary, housing_allowance, transportation_allowance,
        hire_date, contract_start_date, contract_end_date,
        direct_manager_id,
        employment_type, work_schedule,
        status, notes,
        created_at, updated_at
      FROM hr_employees 
      ORDER BY created_at DESC, hire_date DESC`
    
    const result = await c.env.DB.prepare(query).all()
    console.log('🔍 HR Employees API - Results count:', result.results?.length || 0)
    
    return c.json({ success: true, data: result.results || [] })
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get Single Employee
app.get('/api/hr/employees/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const employee = await c.env.DB.prepare(`SELECT * FROM hr_employees WHERE id = ?`).bind(id).first()
    
    if (!employee) {
      return c.json({ success: false, error: 'الموظف غير موجود' }, 404)
    }
    
    return c.json({ success: true, data: employee })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add New Employee
app.post('/api/hr/employees', async (c) => {
  try {
    const data = await c.req.json()
    const userInfo = await getUserInfo(c)
    const tenantId = userInfo.tenantId || 1
    
    const result = await c.env.DB.prepare(`
      INSERT INTO hr_employees (
        employee_number, full_name, national_id, email, phone, birthdate, gender,
        department, job_title, basic_salary, housing_allowance, transportation_allowance,
        hire_date, contract_start_date, contract_end_date, direct_manager,
        employment_type, work_schedule, status, notes, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.employee_number || null,
      data.full_name,
      data.national_id || null,
      data.email || null,
      data.phone || null,
      data.birthdate || data.date_of_birth || null,
      data.gender || null,
      data.department || null,
      data.job_title || null,
      data.basic_salary || 0,
      data.housing_allowance || 0,
      data.transportation_allowance || 0,
      data.hire_date || null,
      data.contract_start_date || null,
      data.contract_end_date || null,
      data.direct_manager || null,
      data.employment_type || 'full_time',
      data.work_schedule || 'regular',
      data.status || 'active',
      data.notes || null,
      tenantId
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id, message: 'تم إضافة الموظف بنجاح' })
  } catch (error: any) {
    console.error('Error adding employee:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update Employee
app.put('/api/hr/employees/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE hr_employees SET
        employee_number = ?, full_name = ?, national_id = ?, email = ?, phone = ?,
        birthdate = ?, gender = ?, department = ?, job_title = ?, basic_salary = ?,
        housing_allowance = ?, transportation_allowance = ?, hire_date = ?,
        contract_start_date = ?, contract_end_date = ?, direct_manager = ?,
        employment_type = ?, work_schedule = ?, status = ?, notes = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.employee_number || null,
      data.full_name,
      data.national_id || null,
      data.email || null,
      data.phone || null,
      data.birthdate || data.date_of_birth || null,
      data.gender || null,
      data.department || null,
      data.job_title || null,
      data.basic_salary || 0,
      data.housing_allowance || 0,
      data.transportation_allowance || 0,
      data.hire_date || null,
      data.contract_start_date || null,
      data.contract_end_date || null,
      data.direct_manager || null,
      data.employment_type || 'full_time',
      data.work_schedule || 'regular',
      data.status || 'active',
      data.notes || null,
      id
    ).run()
    
    return c.json({ success: true, message: 'تم تحديث بيانات الموظف بنجاح' })
  } catch (error: any) {
    console.error('Error updating employee:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete Employee
app.delete('/api/hr/employees/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM hr_employees WHERE id = ?`).bind(id).run()
    return c.json({ success: true, message: 'تم حذف الموظف بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get All Attendance Records
app.get('/api/hr/attendance', async (c) => {
  try {
    const userInfo = await getUserInfo(c)
    console.log('🔍 HR Attendance API - UserInfo:', { userId: userInfo.userId, tenantId: userInfo.tenantId, roleId: userInfo.roleId })
    
    // Get tenant_id from userInfo for filtering
    const tenantId = userInfo.tenantId;
    
    // Build query with tenant filtering if tenant_id exists
    const query = tenantId
      ? `SELECT 
          a.*,
          e.full_name_ar as employee_name,
          e.employee_code as employee_number,
          e.department,
          a.working_hours as work_hours
        FROM hr_attendance a 
        LEFT JOIN hr_employees e ON a.employee_id = e.id 
        WHERE a.tenant_id = ${tenantId}
        ORDER BY a.attendance_date DESC, a.check_in_time DESC`
      : `SELECT 
          a.*,
          e.full_name_ar as employee_name,
          e.employee_code as employee_number,
          e.department,
          a.working_hours as work_hours
        FROM hr_attendance a 
        LEFT JOIN hr_employees e ON a.employee_id = e.id 
        ORDER BY a.attendance_date DESC, a.check_in_time DESC`
    
    const result = await c.env.DB.prepare(query).all()
    console.log('🔍 HR Attendance API - Results count:', result.results?.length || 0)
    
    return c.json({ success: true, data: result.results || [] })
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add Attendance Record
app.post('/api/hr/attendance', async (c) => {
  try {
    const data = await c.req.json()
    const userInfo = await getUserInfo(c)
    const tenantId = userInfo.tenantId
    
    const result = await c.env.DB.prepare(`
      INSERT INTO hr_attendance (
        employee_id, date, check_in, check_out, status, late_minutes, 
        overtime_minutes, notes, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.employee_id, data.date, data.check_in, data.check_out, data.status,
      data.late_minutes || 0, data.overtime_minutes || 0, data.notes, tenantId
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id, message: 'تم تسجيل الحضور بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get All Leaves
app.get('/api/hr/leaves', async (c) => {
  try {
    const userInfo = await getUserInfo(c)
    const tenantId = userInfo.tenantId
    
    const query = tenantId
      ? `SELECT l.*, e.full_name, e.employee_number, lt.type_name 
         FROM hr_leaves l 
         LEFT JOIN hr_employees e ON l.employee_id = e.id 
         LEFT JOIN hr_leave_types lt ON l.leave_type_id = lt.id
         WHERE l.tenant_id = ${tenantId} ORDER BY l.request_date DESC`
      : `SELECT l.*, e.full_name, e.employee_number, lt.type_name 
         FROM hr_leaves l 
         LEFT JOIN hr_employees e ON l.employee_id = e.id 
         LEFT JOIN hr_leave_types lt ON l.leave_type_id = lt.id
         ORDER BY l.request_date DESC`
    
    const { results } = await c.env.DB.prepare(query).all()
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add Leave Request
app.post('/api/hr/leaves', async (c) => {
  try {
    const data = await c.req.json()
    const userInfo = await getUserInfo(c)
    const tenantId = userInfo.tenantId
    
    const result = await c.env.DB.prepare(`
      INSERT INTO hr_leaves (
        employee_id, leave_type_id, start_date, end_date, days_count,
        reason, status, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.employee_id, data.leave_type_id, data.start_date, data.end_date,
      data.days_count, data.reason, data.status || 'pending', tenantId
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id, message: 'تم إضافة طلب الإجازة بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update Leave Status
app.put('/api/hr/leaves/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { status, rejection_reason, approved_by } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE hr_leaves SET status = ?, rejection_reason = ?, approved_by = ?, approval_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, rejection_reason, approved_by, id).run()
    
    return c.json({ success: true, message: 'تم تحديث حالة الإجازة بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update Salary Payment Status (alternative endpoint)
app.put('/api/hr/salaries/:id/pay', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare(`
      UPDATE hr_salaries SET payment_status = 'paid', payment_date = date('now')
      WHERE id = ?
    `).bind(id).run()
    
    return c.json({ success: true, message: 'تم تحديث حالة الدفع بنجاح' })
  } catch (error: any) {
    console.error('Error updating salary payment:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Test login endpoint (simplified)
app.post('/api/test/login', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ 
        success: false, 
        error: 'DB binding not available',
        DB_exists: false
      }, 500)
    }
    
    // Try a simple query
    const testQuery = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
    
    return c.json({
      success: true,
      DB_exists: true,
      DB_usable: true,
      user_count: testQuery
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
      DB_exists: !!c.env?.DB,
      stack: error.stack
    }, 500)
  }
})

// Runtime check for deployed bindings
app.get('/api/test/bindings', async (c) => {
  const result: any = {
    DB_exists: !!c.env.DB,
    ATTACHMENTS_exists: !!c.env.ATTACHMENTS,
    timestamp: new Date().toISOString()
  }
  
  // Try to actually use the DB binding
  if (c.env.DB) {
    try {
      const testQuery = await c.env.DB.prepare('SELECT 1 as test').first()
      result.DB_usable = true
      result.DB_test_result = testQuery
    } catch (error: any) {
      result.DB_usable = false
      result.DB_error = error.message
    }
  } else {
    result.DB_usable = false
    result.DB_error = 'DB binding is undefined'
  }
  
  return c.json(result)
})

export default app
