import type { Context } from 'hono'
import {
  explainContractCreateDenial,
  resolveWorkflowNotifyTargetUserIds,
  insertWorkflowCrossPartyAlarms,
} from './notification-access'

type UserInfo = {
  userId: number | null
  tenantId: number | null
  roleId: number | null
  tokenRoleId: number | null
}

type GetUserInfo = (c: Context) => Promise<UserInfo>

const STATUS_AWAITING_BANK_AGENT_APPROVAL = 'بانتظار موافقة ممثل البنك'
const STATUS_AWAITING_ADMIN_APPROVAL = 'بانتظار موافقة الإدارة'
const FINAL_APPROVAL_STATUSES = new Set(['نشط', 'بانتظار التمويل', 'مكتمل'])

async function resolveContractAdminUserIds(
  db: D1Database,
  tenantId: number,
  excludeUserId: number | null
): Promise<number[]> {
  // Include legacy role ids 11/12 (normalizeRoleId maps them to 1/2).
  const rows = await db
    .prepare(
      `SELECT id FROM users WHERE tenant_id = ? AND role_id IN (1, 2, 11, 12) AND is_active = 1`
    )
    .bind(tenantId)
    .all<{ id: number }>()
  return (rows.results || [])
    .map((r) => Number(r.id))
    .filter((id) => id !== excludeUserId)
}

async function resolveActorName(db: D1Database, userId: number | null): Promise<string> {
  if (!userId) return ''
  const row = await db
    .prepare(`SELECT full_name FROM users WHERE id = ? LIMIT 1`)
    .bind(userId)
    .first<{ full_name?: string | null }>()
  return String(row?.full_name ?? '').trim()
}

function sqlTable(name: string): string | null {
  if (name === 'templates') return 'contract_templates'
  if (name === 'contracts' || name === 'promissory_notes' || name === 'customers') return name
  return null
}

function normalizeVariablesList(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return JSON.stringify(v)
  return JSON.stringify(v)
}

/** Detect Chrome/Edge Translate corruption of Arabic contract template bodies. */
function looksBrowserTranslatedTemplate(html: unknown): boolean {
  const s = String(html ?? '')
  if (/vertical-align\s*:\s*inherit/i.test(s) && /dir\s*=\s*["']?auto["']?/i.test(s)) return true
  if (/\bWhereas\b/i.test(s) || /\bFirst Party\b/i.test(s) || /\bSecond Party\b/i.test(s)) return true
  if (/\bArticle\s+(One|Two|Three|[1-9]|I{1,3})\b/i.test(s)) return true
  if (/\b(hereinafter|pursuant|aforesaid|Witnesseth)\b/i.test(s)) return true
  return false
}

const TRANSLATE_BLOCKED_MSG =
  'يبدو أن المتصفح ترجم نص القالب إلى الإنجليزية. عطّل ترجمة الصفحة وأعد تحميل القالب قبل الحفظ.'

/** Empty or whitespace-only national / debtor id → null for D1. */
function optionalNationalId(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s ? s : null
}

function isSuperAdmin(info: UserInfo): boolean {
  return info.roleId === 1 && (info.tokenRoleId === null || info.tokenRoleId === 1)
}

function isContractsModuleBlockedRole(info: UserInfo): boolean {
  return false
}

function isContractsModuleReadOnlyRole(info: UserInfo): boolean {
  return info.roleId === 3
}

function isFinalApprover(info: UserInfo): boolean {
  return info.roleId === 1 || info.roleId === 2
}

async function auth(c: Context, getUserInfo: GetUserInfo) {
  const info = await getUserInfo(c)
  if (!info.userId) {
    return { info, error: c.json({ error: 'Unauthorized' }, 401) as Response }
  }
  if (isContractsModuleBlockedRole(info)) {
    return { info, error: c.json({ error: 'Forbidden' }, 403) as Response }
  }
  return { info, error: null as Response | null }
}

function resolveWriteTenantId(
  info: UserInfo,
  body: Record<string, unknown>,
  c: Context
): { tenantId: number | null; error: Response | null } {
  if (info.tenantId) return { tenantId: info.tenantId, error: null }
  if (isSuperAdmin(info)) {
    const tid = body?.tenant_id
    if (typeof tid === 'number' && tid > 0) return { tenantId: tid, error: null }
    if (typeof tid === 'string' && /^\d+$/.test(tid)) return { tenantId: parseInt(tid, 10), error: null }
    const q = c.req.query('tenant_id')
    if (q && /^\d+$/.test(String(q))) return { tenantId: parseInt(String(q), 10), error: null }
    return {
      tenantId: null,
      error: new Response(JSON.stringify({ error: 'يجب تحديد tenant_id لحساب المدير العام' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  return {
    tenantId: null,
    error: new Response(JSON.stringify({ error: 'لا يوجد شركة مرتبطة بالحساب' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/** Legacy rows may still store a base64 data URL; new uploads use R2 + `/api/attachments/view/...` like financing attachments. */
const MAX_PARTY_ONE_LOGO_CHARS = 200_000

function normalizePartyOneLogo(
  body: Record<string, unknown>
): { ok: true; value: string | null } | { ok: false; response: Response } {
  const raw = body.party_one_logo
  if (raw == null || raw === '') return { ok: true, value: null }
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim()
  if (!s) return { ok: true, value: null }

  if (s.startsWith('/api/attachments/view/')) {
    if (s.includes('..') || s.length > 2000) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({
            error: 'party_one_logo_invalid',
            detail: 'رابط شعار الشركة غير صالح.'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        )
      }
    }
    return { ok: true, value: s }
  }

  if (s.length > MAX_PARTY_ONE_LOGO_CHARS) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: 'party_one_logo_too_large',
          detail: 'صورة الشعار كبيرة جداً (بيانات قديمة). يُفضّل رفع صورة جديدة من النموذج.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }
  }
  if (!/^data:image\/(png|jpe?g|gif|webp|bmp);base64,/i.test(s)) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: 'party_one_logo_invalid',
          detail:
            'صورة الشعار غير صالحة. ارفع الصورة من الحقل؛ يُخزَّن الملف في R2 مثل مرفقات طلبات التمويل.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      )
    }
  }
  return { ok: true, value: s }
}

function normalizeTemplateStampUrl(
  raw: unknown
): { ok: true; value: string | null } | { ok: false; response: Response } {
  if (raw == null || raw === '') return { ok: true, value: null }
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim()
  if (!s) return { ok: true, value: null }
  if (s.startsWith('/api/attachments/view/')) {
    if (s.includes('..') || s.length > 2000) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({
            error: 'stamp_url_invalid',
            detail: 'رابط الختم غير صالح.'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        )
      }
    }
    return { ok: true, value: s }
  }
  return {
    ok: false,
    response: new Response(
      JSON.stringify({
        error: 'stamp_url_invalid',
        detail: 'ارفع صورة الختم من صفحة القالب (R2).'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }
}

function normalizeTemplateBrandingImageUrl(
  raw: unknown
): { ok: true; value: string | null } | { ok: false; response: Response } {
  if (raw == null || raw === '') return { ok: true, value: null }
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim()
  if (!s) return { ok: true, value: null }
  if (s.startsWith('/api/attachments/view/')) {
    if (s.includes('..') || s.length > 2000) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: 'image_url_invalid', detail: 'رابط الصورة غير صالح.' }),
          { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        )
      }
    }
    return { ok: true, value: s }
  }
  return {
    ok: false,
    response: new Response(
      JSON.stringify({ error: 'image_url_invalid', detail: 'ارفع الصورة من صفحة القالب (R2).' }),
      { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }
}

function tenantFilterClause(
  info: UserInfo,
  c: Context,
  alias: string
): { sql: string; binds: (number | string)[] } {
  const qTenant = c.req.query('tenant_id')
  if (info.tenantId) {
    return { sql: ` AND ${alias}.tenant_id = ? `, binds: [info.tenantId] }
  }
  if (isSuperAdmin(info) && qTenant && /^\d+$/.test(qTenant)) {
    return { sql: ` AND ${alias}.tenant_id = ? `, binds: [parseInt(qTenant, 10)] }
  }
  if (isSuperAdmin(info)) {
    return { sql: '', binds: [] }
  }
  return { sql: ' AND 1=0 ', binds: [] }
}

/**
 * Role 5 bank agents sometimes have users.tenant_id unset even though assigned_bank_id points at a tenant-scoped bank.
 * Prefer fixing this in `getUserInfo` / login token — this mirrors that resolution for defense in depth.
 */
async function withEffectiveTenantForContractsApi(c: Context, info: UserInfo): Promise<UserInfo> {
  if (info.tenantId != null || isSuperAdmin(info)) return info
  if ((info.roleId !== 5 && info.roleId !== 6) || info.userId == null || !c.env?.DB) return info
  try {
    const row = await c.env.DB.prepare(
      `SELECT b.tenant_id AS tenant_id
       FROM users u
       INNER JOIN banks b ON b.id = u.assigned_bank_id
       WHERE u.id = ? AND b.tenant_id IS NOT NULL
       LIMIT 1`
    )
      .bind(info.userId)
      .first<{ tenant_id: number }>()
    if (row?.tenant_id != null) {
      return { ...info, tenantId: Number(row.tenant_id) }
    }
  } catch (_) {
    /* missing table/column in some environments */
  }
  return info
}

export function registerContractsModuleApi(app: any, getUserInfo: GetUserInfo) {
  // Dedicated customer lookup for the new-contract form — fetches customers table
  // directly so the contracts module never depends on the generic :table route for this.
  app.get('/api/contract-tables/customer-list', async (c) => {
    const { info: rawInfo, error } = await auth(c, getUserInfo)
    if (error) return error
    const info = await withEffectiveTenantForContractsApi(c, rawInfo)

    let sql = `SELECT id, full_name, phone, national_id, city FROM customers`
    const binds: (number | string)[] = []

    let effectiveTenantId: number | null = info.tenantId ?? null
    if (effectiveTenantId == null && isSuperAdmin(info)) {
      const q = c.req.query('tenant_id')
      if (q && /^\d+$/.test(String(q))) effectiveTenantId = parseInt(String(q), 10)
      if (effectiveTenantId == null && info.userId) {
        const row = await c.env.DB.prepare('SELECT tenant_id FROM users WHERE id = ?')
          .bind(info.userId)
          .first<{ tenant_id: number | null }>()
        if (row?.tenant_id != null) effectiveTenantId = row.tenant_id
      }
    }

    if (effectiveTenantId != null) {
      sql += ` WHERE tenant_id = ?`
      binds.push(effectiveTenantId)
    } else if (!isSuperAdmin(info)) {
      return c.json({ data: [], debug: 'no_tenant' })
    } else {
      // Super-admin with no resolvable tenant — do not return all tenants
      return c.json({ data: [], debug: 'no_tenant' })
    }

    // Role 4 / Role 6: customers in scope with an active funding request and no blocking contract.
    if (info.roleId === 4 && info.userId) {
      sql += ` AND EXISTS (
        SELECT 1 FROM customer_assignments ca
        WHERE ca.customer_id = customers.id AND ca.employee_id = ?
      ) AND EXISTS (
        SELECT 1 FROM financing_requests fr
        WHERE fr.customer_id = customers.id AND fr.tenant_id = ?
          AND COALESCE(fr.is_completed, 0) = 0
      ) AND NOT EXISTS (
        SELECT 1 FROM contracts co
        WHERE co.customer_id = customers.id AND co.tenant_id = ?
          AND COALESCE(co.is_archived, 0) = 0
          AND co.status NOT IN ('مكتمل', 'مؤرشف')
      )`
      binds.push(info.userId, effectiveTenantId!, effectiveTenantId!)
    } else if (info.roleId === 6 && info.userId) {
      sql += ` AND (
        EXISTS (
          SELECT 1 FROM customer_assignments ca
          WHERE ca.customer_id = customers.id AND ca.employee_id = ?
        )
        OR customers.assigned_bank_agent_id = ?
        OR EXISTS (
          SELECT 1 FROM financing_requests fr0
          WHERE fr0.customer_id = customers.id AND fr0.assigned_bank_agent_id = ?
        )
      ) AND EXISTS (
        SELECT 1 FROM financing_requests fr
        WHERE fr.customer_id = customers.id AND fr.tenant_id = ?
          AND COALESCE(fr.is_completed, 0) = 0
      ) AND NOT EXISTS (
        SELECT 1 FROM contracts co
        WHERE co.customer_id = customers.id AND co.tenant_id = ?
          AND COALESCE(co.is_archived, 0) = 0
          AND co.status NOT IN ('مكتمل', 'مؤرشف')
      )`
      binds.push(info.userId, info.userId, info.userId, effectiveTenantId!, effectiveTenantId!)
    }

    // Role 5 bank agent: only customers they are assigned to via financing_requests.assigned_bank_agent_id.
    if (info.roleId === 5 && info.userId) {
      sql += ` AND EXISTS (
        SELECT 1 FROM financing_requests fr
        WHERE fr.customer_id = customers.id AND fr.assigned_bank_agent_id = ?
          AND COALESCE(fr.is_completed, 0) = 0
      ) AND NOT EXISTS (
        SELECT 1 FROM contracts co
        WHERE co.customer_id = customers.id AND co.tenant_id = ?
          AND COALESCE(co.is_archived, 0) = 0
          AND co.status NOT IN ('مكتمل', 'مؤرشف')
      )`
      binds.push(info.userId, effectiveTenantId!)
    }

    sql += ` ORDER BY full_name ASC LIMIT 500`

    try {
      const { results } = await c.env.DB.prepare(sql).bind(...binds).all()
      return c.json({ data: results || [] })
    } catch (e: any) {
      throw e
    }
  })

  // REST shape matches reference: GET /api/contract-tables/:table?limit=...
  app.get('/api/contract-tables/:table', async (c) => {
    const { info: rawInfo, error } = await auth(c, getUserInfo)
    if (error) return error
    const info = await withEffectiveTenantForContractsApi(c, rawInfo)
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const limit = Math.min(parseInt(c.req.query('limit') || '200', 10) || 200, 500)
    const { sql: tsql, binds: tbinds } = tenantFilterClause(info, c, table)
    let rowScopeSql = ''
    let rowScopeBinds: (number | string)[] = []
    if (table === 'contracts' && info.roleId === 4 && info.userId) {
      rowScopeSql = ' AND created_by = ? '
      rowScopeBinds = [info.userId]
    } else if (table === 'contracts' && info.roleId === 5 && info.userId && info.tenantId) {
      // Include contracts this bank agent created (e.g. customer_id null) plus FR-assigned customers
      rowScopeSql = ' AND (created_by = ? OR customer_id IN (SELECT customer_id FROM financing_requests WHERE assigned_bank_agent_id = ? AND tenant_id = ?)) '
      rowScopeBinds = [info.userId, info.userId, info.tenantId]
    } else if (table === 'contracts' && info.roleId === 6 && info.userId && info.tenantId) {
      // Role 6: contracts they created (employee column) OR customer assigned as bank agent
      rowScopeSql = ' AND (created_by = ? OR customer_id IN (SELECT customer_id FROM financing_requests WHERE assigned_bank_agent_id = ? AND tenant_id = ?)) '
      rowScopeBinds = [info.userId, info.userId, info.tenantId]
    }
    // List cards never need full template HTML bodies (can be hundreds of KB each).
    const selectCols =
      table === 'contract_templates'
        ? 'id, tenant_id, template_name, template_type, variables_list, is_active, court_city, render_mode, stamp_url, document_watermark_url, document_watermark_enabled, document_watermark_opacity, document_header_url, document_header_enabled, document_header_opacity, document_footer_url, document_footer_enabled, document_footer_opacity, created_at'
        : '*'
    const { results } = await c.env.DB.prepare(
      `SELECT ${selectCols} FROM ${table} WHERE 1=1 ${tsql} ${rowScopeSql} ORDER BY id DESC LIMIT ?`
    )
      .bind(...tbinds, ...rowScopeBinds, limit)
      .all()
    return c.json({ data: results || [] })
  })

  app.get('/api/contract-tables/:table/:id', async (c) => {
    const { info: rawInfo, error } = await auth(c, getUserInfo)
    if (error) return error
    const info = await withEffectiveTenantForContractsApi(c, rawInfo)
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const id = parseInt(c.req.param('id'), 10)
    if (!id) return c.json({ error: 'Invalid id' }, 400)
    const { sql: tsql, binds: tbinds } = tenantFilterClause(info, c, table)
    let rowScopeSqlId = ''
    let rowScopeBindsId: (number | string)[] = []
    if (table === 'contracts' && info.roleId === 4 && info.userId) {
      rowScopeSqlId = ' AND created_by = ? '
      rowScopeBindsId = [info.userId]
    } else if (table === 'contracts' && info.roleId === 5 && info.userId && info.tenantId) {
      rowScopeSqlId = ' AND (created_by = ? OR customer_id IN (SELECT customer_id FROM financing_requests WHERE assigned_bank_agent_id = ? AND tenant_id = ?)) '
      rowScopeBindsId = [info.userId, info.userId, info.tenantId]
    } else if (table === 'contracts' && info.roleId === 6 && info.userId && info.tenantId) {
      rowScopeSqlId = ' AND (created_by = ? OR customer_id IN (SELECT customer_id FROM financing_requests WHERE assigned_bank_agent_id = ? AND tenant_id = ?)) '
      rowScopeBindsId = [info.userId, info.userId, info.tenantId]
    }
    const row = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ? ${tsql} ${rowScopeSqlId}`)
      .bind(id, ...tbinds, ...rowScopeBindsId)
      .first()
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json(row)
  })

  app.post('/api/contract-tables/:table', async (c) => {
    const { info: rawInfo, error } = await auth(c, getUserInfo)
    if (error) return error
    const info = await withEffectiveTenantForContractsApi(c, rawInfo)
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const { tenantId, error: te } = resolveWriteTenantId(info, body, c)
    if (te) return te
    if (tenantId == null) return c.json({ error: 'Missing tenant' }, 400)

    if (table === 'contract_templates') {
      if (info.roleId === 4 || info.roleId === 5 || info.roleId === 6) return c.json({ error: 'Forbidden' }, 403)
      const template_name = String(body.template_name ?? '')
      if (!template_name.trim()) return c.json({ error: 'template_name required' }, 400)
      if (looksBrowserTranslatedTemplate(body.body_content)) {
        return c.json({ error: 'browser_translate_blocked', detail: TRANSLATE_BLOCKED_MSG }, 400)
      }
      const stampNorm = normalizeTemplateStampUrl(body.stamp_url)
      if (!stampNorm.ok) return stampNorm.response
      const wmNorm = normalizeTemplateBrandingImageUrl(body.document_watermark_url)
      if (!wmNorm.ok) return wmNorm.response
      const hdrNorm = normalizeTemplateBrandingImageUrl(body.document_header_url)
      if (!hdrNorm.ok) return hdrNorm.response
      const ftrNorm = normalizeTemplateBrandingImageUrl(body.document_footer_url)
      if (!ftrNorm.ok) return ftrNorm.response
      const renderMode = String(body.render_mode ?? 'structured') === 'document' ? 'document' : 'structured'
      const clampWm = (v: unknown, def: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(1, Math.max(0.03, n)) : def }
      const clampLh = (v: unknown, def: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(1, Math.max(0.1, n)) : def }
      let r: { meta: { last_row_id: number | null } }
      try {
        r = await c.env.DB.prepare(
          `INSERT INTO contract_templates (
            tenant_id, template_name, template_type, header_content, body_content, footer_content,
            variables_list, is_active, court_city, render_mode, stamp_url,
            document_watermark_url, document_watermark_enabled, document_watermark_opacity,
            document_header_url, document_header_enabled, document_header_opacity,
            document_footer_url, document_footer_enabled, document_footer_opacity
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        )
          .bind(
            tenantId,
            template_name,
            body.template_type ?? null,
            body.header_content ?? null,
            body.body_content ?? null,
            body.footer_content ?? null,
            normalizeVariablesList(body.variables_list),
            body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
            body.court_city ?? null,
            renderMode,
            stampNorm.value,
            wmNorm.value,
            body.document_watermark_enabled ? 1 : 0,
            clampWm(body.document_watermark_opacity, 0.12),
            hdrNorm.value,
            body.document_header_enabled ? 1 : 0,
            clampLh(body.document_header_opacity, 1),
            ftrNorm.value,
            body.document_footer_enabled ? 1 : 0,
            clampLh(body.document_footer_opacity, 1)
          )
          .run()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('contract_templates insert failed', msg)
        return c.json({ error: 'database_error', detail: msg }, 500)
      }
      const id = r.meta.last_row_id as number
      const row = await c.env.DB.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(id).first()
      return c.json({ ...row, id })
    }

    if (table === 'contracts') {
      const logoNorm = normalizePartyOneLogo(body)
      if (!logoNorm.ok) return logoNorm.response

      let role6IsBothColumns = false

      // Role 5 (bank agent): must have active FR assigned to this agent + no blocking contract.
      if (info.roleId === 5 && info.userId) {
        const customerId = body.customer_id != null ? Number(body.customer_id) : null
        if (customerId) {
          let denial: string | null = null
          try {
            denial = await explainContractCreateDenial(c.env.DB, {
              customerId,
              tenantId,
              userId: info.userId,
              roleId: 5,
            })
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            return c.json({ error: 'database_error', detail: msg }, 500)
          }
          if (denial) {
            console.warn('[contracts] create denied', {
              roleId: 5,
              userId: info.userId,
              tenantId,
              customerId,
              reason: denial,
            })
            return c.json({ error: 'Forbidden', detail: denial }, 403)
          }

          let frRow: { id: number } | null = null
          try {
            frRow = await c.env.DB.prepare(
              `SELECT id FROM financing_requests
               WHERE customer_id = ? AND tenant_id = ? AND assigned_bank_agent_id = ?
                 AND COALESCE(is_completed, 0) = 0
               ORDER BY id DESC LIMIT 1`
            )
              .bind(customerId, tenantId, info.userId)
              .first<{ id: number }>()
          } catch (e: unknown) {
            const msg = String((e as { message?: string })?.message || e || '')
            if (/no such column:\s*is_completed/i.test(msg)) {
              frRow = await c.env.DB.prepare(
                `SELECT id FROM financing_requests
                 WHERE customer_id = ? AND tenant_id = ? AND assigned_bank_agent_id = ?
                 ORDER BY id DESC LIMIT 1`
              )
                .bind(customerId, tenantId, info.userId)
                .first<{ id: number }>()
            } else {
              return c.json({ error: 'database_error', detail: msg }, 500)
            }
          }
          if (frRow) body.financing_request_id = frRow.id
        }
      }

      // Role 4 / Role 6: validate customer scope (employee and/or bank-agent for role 6), active FR, no blocking contract.
      if ((info.roleId === 4 || info.roleId === 6) && info.userId) {
        const customerId = body.customer_id != null ? Number(body.customer_id) : null
        if (customerId) {
          let denial: string | null = null
          try {
            denial = await explainContractCreateDenial(c.env.DB, {
              customerId,
              tenantId,
              userId: info.userId,
              roleId: info.roleId,
            })
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            return c.json({ error: 'database_error', detail: msg }, 500)
          }
          if (denial) {
            console.warn('[contracts] create denied', {
              roleId: info.roleId,
              userId: info.userId,
              tenantId,
              customerId,
              reason: denial,
            })
            return c.json({ error: 'Forbidden', detail: denial }, 403)
          }

          let frRow: { id: number } | null = null
          try {
            frRow = await c.env.DB.prepare(
              `SELECT id FROM financing_requests
               WHERE customer_id = ? AND tenant_id = ? AND COALESCE(is_completed, 0) = 0
               ORDER BY id DESC LIMIT 1`
            )
              .bind(customerId, tenantId)
              .first<{ id: number }>()
          } catch (e: unknown) {
            const msg = String((e as { message?: string })?.message || e || '')
            if (/no such column:\s*is_completed/i.test(msg)) {
              frRow = await c.env.DB.prepare(
                `SELECT id FROM financing_requests
                 WHERE customer_id = ? AND tenant_id = ?
                 ORDER BY id DESC LIMIT 1`
              )
                .bind(customerId, tenantId)
                .first<{ id: number }>()
            } else {
              return c.json({ error: 'database_error', detail: msg }, 500)
            }
          }
          if (frRow) {
            body.financing_request_id = frRow.id
            if (info.roleId === 6) {
              const agentRow = await c.env.DB.prepare(
                `SELECT 1 FROM financing_requests WHERE id = ? AND assigned_bank_agent_id = ? LIMIT 1`
              )
                .bind(frRow.id, info.userId)
                .first()
              role6IsBothColumns = Boolean(agentRow)
            }
          }
        }
      }

      let initialStatus: string
      if (info.roleId === 4) {
        initialStatus = STATUS_AWAITING_BANK_AGENT_APPROVAL
      } else if (info.roleId === 5) {
        // Bank agent is the creator — bank approval step is already done
        initialStatus = STATUS_AWAITING_ADMIN_APPROVAL
      } else if (info.roleId === 6) {
        // Same user in both columns → skip bank approval step
        initialStatus = role6IsBothColumns ? STATUS_AWAITING_ADMIN_APPROVAL : STATUS_AWAITING_BANK_AGENT_APPROVAL
      } else {
        initialStatus = String(body.status ?? 'نشط')
      }
      let r
      try {
        r = await c.env.DB.prepare(
          `INSERT INTO contracts (
          tenant_id, created_by, contract_number, template_id, template_name, date_gregorian, day_name,
          party_one_name, party_one_phone, party_one_logo,
          customer_id, party_two_name, party_two_id, party_two_phone, party_two_address, finance_type, finance_amount,
          commission_amount, commission_type, commission_rate, note_order_number, note_due_date, status,
          property_description, property_location, bank_name, notes, is_archived, financing_request_id, location_id
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        )
          .bind(
            tenantId,
            info.userId,
            body.contract_number ?? null,
            body.template_id != null ? Number(body.template_id) : null,
            body.template_name ?? null,
            body.date_gregorian ?? null,
            body.day_name ?? null,
            body.party_one_name ?? null,
            body.party_one_phone ?? null,
            logoNorm.value,
            body.customer_id != null ? Number(body.customer_id) : null,
            body.party_two_name ?? null,
            optionalNationalId(body.party_two_id),
            body.party_two_phone ?? null,
            body.party_two_address ?? null,
            body.finance_type ?? null,
            body.finance_amount != null ? Number(body.finance_amount) : null,
            body.commission_amount != null ? Number(body.commission_amount) : null,
            body.commission_type ?? null,
            body.commission_rate != null ? Number(body.commission_rate) : null,
            body.note_order_number ?? null,
            body.note_due_date ?? null,
            initialStatus,
            body.property_description ?? null,
            body.property_location ?? null,
            body.bank_name ?? null,
            body.notes ?? null,
            body.is_archived ? 1 : 0,
            body.financing_request_id != null ? Number(body.financing_request_id) : null,
            body.location_id != null ? Number(body.location_id) : null
          )
          .run()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (/no such column/i.test(msg)) {
          return c.json(
            {
              error: 'database_schema',
              detail:
                'العمود غير موجود في قاعدة البيانات. شغّل آخر migrations للعقود على D1، خاصة 0035 و0060.'
            },
            500
          )
        }
        return c.json({ error: 'database_error', detail: msg }, 500)
      }
      const id = r.meta.last_row_id as number
      // Role 5 / Role 6 both-column: set bank-agent audit fields for traceability
      if ((info.roleId === 5 || (info.roleId === 6 && role6IsBothColumns)) && info.userId) {
        try {
          await c.env.DB.prepare(
            `UPDATE contracts SET bank_agent_approved_by = ?, bank_agent_approved_at = CURRENT_TIMESTAMP WHERE id = ?`
          )
            .bind(info.userId, id)
            .run()
        } catch (_) {
          /* columns may not exist on older schemas — non-fatal */
        }
      }
      const row = await c.env.DB.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first()

      // Send notifications for contracts entering an approval queue
      try {
        const customerId = body.customer_id != null ? Number(body.customer_id) : null
        const frId = body.financing_request_id != null ? Number(body.financing_request_id) : null
        const actorName = await resolveActorName(c.env.DB, info.userId)
        const contractLabel = `عقد #${id}`
        const linkUrl = `/admin/contracts/view?id=${id}`

        if (initialStatus === STATUS_AWAITING_BANK_AGENT_APPROVAL && customerId) {
          // Notify the assigned bank agent that a new contract needs their approval
          const targetUserIds = await resolveWorkflowNotifyTargetUserIds(
            c.env.DB, customerId, 5, tenantId, frId
          )
          const targets = targetUserIds.filter((uid) => uid !== info.userId)
          if (targets.length) {
            await insertWorkflowCrossPartyAlarms(c.env.DB, {
              customerId,
              tenantId,
              targetUserIds: targets,
              customerName: contractLabel,
              note: `أنشأ ${actorName} ${contractLabel} بانتظار موافقتك كممثل بنك`,
              linkUrl,
            })
          }
        } else if (initialStatus === STATUS_AWAITING_ADMIN_APPROVAL) {
          // Role 5 create / role 6 both-column: bank step skipped — notify admins
          const targets = await resolveContractAdminUserIds(c.env.DB, tenantId, info.userId)
          if (targets.length) {
            await insertWorkflowCrossPartyAlarms(c.env.DB, {
              customerId,
              tenantId,
              targetUserIds: targets,
              customerName: contractLabel,
              note: `أنشأ ${actorName} ${contractLabel} بانتظار موافقة الإدارة`,
              linkUrl,
            })
          } else {
            console.warn('[contracts] no admin targets for approval notify', { contractId: id, tenantId })
          }
        }
      } catch (e) {
        console.error('[contracts] create approval notify failed', e)
      }

      return c.json({ ...row, id })
    }

    if (table === 'promissory_notes') {
      const contract_id = body.contract_id != null ? Number(body.contract_id) : NaN
      if (!contract_id) return c.json({ error: 'contract_id required' }, 400)
      const cRow = await c.env.DB.prepare('SELECT id, tenant_id FROM contracts WHERE id = ?').bind(contract_id).first<{
        id: number
        tenant_id: number
      }>()
      if (!cRow || cRow.tenant_id !== tenantId) return c.json({ error: 'Invalid contract' }, 400)
      const note_number = String(body.note_number ?? '')
      if (!note_number.trim()) return c.json({ error: 'note_number required' }, 400)
      let r
      try {
        r = await c.env.DB.prepare(
          `INSERT INTO promissory_notes (
          tenant_id, note_number, contract_id, debtor_name, debtor_id, amount, due_date, issue_date, payment_place, status
        ) VALUES (?,?,?,?,?,?,?,?,?,?)`
        )
          .bind(
            tenantId,
            note_number,
            contract_id,
            body.debtor_name ?? null,
            optionalNationalId(body.debtor_id),
            body.amount != null ? Number(body.amount) : null,
            body.due_date ?? null,
            body.issue_date ?? null,
            body.payment_place ?? null,
            body.status ?? 'ساري'
          )
          .run()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (/UNIQUE|unique constraint/i.test(msg)) {
          return c.json(
            {
              error: 'duplicate_note_number',
              detail: `رقم سند الأمر (${note_number}) مستخدم مسبقاً. اختر رقماً آخر.`
            },
            409
          )
        }
        return c.json({ error: 'database_error', detail: msg }, 500)
      }
      const id = r.meta.last_row_id as number
      const row = await c.env.DB.prepare('SELECT * FROM promissory_notes WHERE id = ?').bind(id).first()
      return c.json({ ...row, id })
    }

    return c.json({ error: 'Unsupported' }, 400)
  })

  const updateRow = async (c: Context, method: 'PUT' | 'PATCH') => {
    const { info: rawInfo, error } = await auth(c, getUserInfo)
    if (error) return error
    const info = await withEffectiveTenantForContractsApi(c, rawInfo)
    if (isContractsModuleReadOnlyRole(info)) return c.json({ error: 'Forbidden' }, 403)
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const id = parseInt(c.req.param('id'), 10)
    if (!id) return c.json({ error: 'Invalid id' }, 400)
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

    const existing = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<{
      tenant_id: number
      created_by?: number | null
      status?: string | null
    }>()
    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (info.tenantId && existing.tenant_id !== info.tenantId) return c.json({ error: 'Forbidden' }, 403)
    if (!info.tenantId && !isSuperAdmin(info)) return c.json({ error: 'Forbidden' }, 403)
    if (table === 'contracts' && (info.roleId === 4 || info.roleId === 6) && existing.created_by !== info.userId) {
      // Role 6 may still approve via bank-agent path without being the creator — allow that below
      if (info.roleId === 4) return c.json({ error: 'Forbidden' }, 403)
    }

    if (table === 'contract_templates') {
      if (info.roleId === 4 || info.roleId === 5 || info.roleId === 6) return c.json({ error: 'Forbidden' }, 403)
      if (body.body_content !== undefined && looksBrowserTranslatedTemplate(body.body_content)) {
        return c.json({ error: 'browser_translate_blocked', detail: TRANSLATE_BLOCKED_MSG }, 400)
      }
      const fields: string[] = []
      const vals: unknown[] = []
      const touch = (col: string, key: string) => {
        if (method === 'PUT' || body[key] !== undefined) {
          fields.push(`${col} = ?`)
          if (key === 'is_active') vals.push(body[key] ? 1 : 0)
          else if (key === 'variables_list') vals.push(normalizeVariablesList(body[key]))
          else vals.push(body[key] ?? null)
        }
      }
      touch('template_name', 'template_name')
      touch('template_type', 'template_type')
      touch('header_content', 'header_content')
      touch('body_content', 'body_content')
      touch('footer_content', 'footer_content')
      touch('variables_list', 'variables_list')
      touch('is_active', 'is_active')
      touch('court_city', 'court_city')
      if (method === 'PUT' || body.stamp_url !== undefined) {
        const stampNorm = normalizeTemplateStampUrl(body.stamp_url)
        if (!stampNorm.ok) return stampNorm.response
        fields.push('stamp_url = ?')
        vals.push(stampNorm.value)
      }
      if (method === 'PUT' || body.render_mode !== undefined) {
        fields.push('render_mode = ?')
        vals.push(String(body.render_mode ?? 'structured') === 'document' ? 'document' : 'structured')
      }
      const clampWmU = (v: unknown, def: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(1, Math.max(0.03, n)) : def }
      const clampLhU = (v: unknown, def: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(1, Math.max(0.1, n)) : def }
      if (method === 'PUT' || body.document_watermark_url !== undefined) {
        const norm = normalizeTemplateBrandingImageUrl(body.document_watermark_url)
        if (!norm.ok) return norm.response
        fields.push('document_watermark_url = ?')
        vals.push(norm.value)
      }
      if (method === 'PUT' || body.document_watermark_enabled !== undefined) {
        fields.push('document_watermark_enabled = ?')
        vals.push(body.document_watermark_enabled ? 1 : 0)
      }
      if (method === 'PUT' || body.document_watermark_opacity !== undefined) {
        fields.push('document_watermark_opacity = ?')
        vals.push(clampWmU(body.document_watermark_opacity, 0.12))
      }
      if (method === 'PUT' || body.document_header_url !== undefined) {
        const norm = normalizeTemplateBrandingImageUrl(body.document_header_url)
        if (!norm.ok) return norm.response
        fields.push('document_header_url = ?')
        vals.push(norm.value)
      }
      if (method === 'PUT' || body.document_header_enabled !== undefined) {
        fields.push('document_header_enabled = ?')
        vals.push(body.document_header_enabled ? 1 : 0)
      }
      if (method === 'PUT' || body.document_header_opacity !== undefined) {
        fields.push('document_header_opacity = ?')
        vals.push(clampLhU(body.document_header_opacity, 1))
      }
      if (method === 'PUT' || body.document_footer_url !== undefined) {
        const norm = normalizeTemplateBrandingImageUrl(body.document_footer_url)
        if (!norm.ok) return norm.response
        fields.push('document_footer_url = ?')
        vals.push(norm.value)
      }
      if (method === 'PUT' || body.document_footer_enabled !== undefined) {
        fields.push('document_footer_enabled = ?')
        vals.push(body.document_footer_enabled ? 1 : 0)
      }
      if (method === 'PUT' || body.document_footer_opacity !== undefined) {
        fields.push('document_footer_opacity = ?')
        vals.push(clampLhU(body.document_footer_opacity, 1))
      }
      if (fields.length === 0) {
        const row = await c.env.DB.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(id).first()
        return c.json(row)
      }
      try {
        await c.env.DB.prepare(`UPDATE contract_templates SET ${fields.join(', ')} WHERE id = ?`).bind(...vals, id).run()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('contract_templates update failed', msg)
        return c.json({ error: 'database_error', detail: msg }, 500)
      }
      const row = await c.env.DB.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(id).first()
      return c.json(row)
    }

    if (table === 'contracts') {
      if (body.party_one_logo !== undefined) {
        const logoNorm = normalizePartyOneLogo(body)
        if (!logoNorm.ok) return logoNorm.response
        body.party_one_logo = logoNorm.value
      }
      // Creators (role 4/6) save form fields via PUT; do not treat workflow status dropdown drift as approval actions.
      if ((info.roleId === 4 || info.roleId === 6) && existing.created_by === info.userId && body.status !== undefined) {
        const requestedStatus = String(body.status ?? '')
        const currentStatus = String(existing.status ?? '')
        const isArchiveRequest = requestedStatus === 'مؤرشف' && body.is_archived
        if (!isArchiveRequest && requestedStatus !== currentStatus) {
          delete body.status
        }
      }
      const statusChanged = body.status !== undefined && body.status !== existing.status
      const approvalFields: string[] = []
      const approvalVals: unknown[] = []
      if (statusChanged) {
        const requestedStatus = String(body.status ?? '')
        const currentStatus = String(existing.status ?? '')
        const isArchiveRequest = requestedStatus === 'مؤرشف' && body.is_archived

        if (info.roleId === 4) {
          if (!isArchiveRequest) return c.json({ error: 'Forbidden' }, 403)
        } else if (info.roleId === 6) {
          const isCreator = existing.created_by === info.userId
          if (isArchiveRequest && isCreator) {
            // Role 6 creator can archive their own contract — fall through to field update
          } else if (currentStatus === STATUS_AWAITING_BANK_AGENT_APPROVAL && requestedStatus === STATUS_AWAITING_ADMIN_APPROVAL) {
            // Role 6 as bank agent must be assigned as bank agent on the financing request —
            // same verification as role 5 (inlined here because the else-if chain won't reach the role 5 block)
            const contractCustomerId = (existing as any).customer_id
            if (!contractCustomerId) {
              return c.json({ error: 'Forbidden', detail: 'العقد غير مرتبط بعميل' }, 403)
            }
            const frRow = await c.env.DB.prepare(
              `SELECT id FROM financing_requests
               WHERE customer_id = ? AND assigned_bank_agent_id = ? AND tenant_id = ?
               LIMIT 1`
            )
              .bind(contractCustomerId, info.userId, info.tenantId)
              .first()
            if (!frRow) {
              return c.json({ error: 'Forbidden', detail: 'غير مصرح لك باعتماد هذا العقد' }, 403)
            }
            approvalFields.push('bank_agent_approved_by = ?', 'bank_agent_approved_at = CURRENT_TIMESTAMP')
            approvalVals.push(info.userId)
          } else {
            return c.json({ error: 'Forbidden' }, 403)
          }
        } else if (currentStatus === STATUS_AWAITING_BANK_AGENT_APPROVAL) {
          if (info.roleId !== 5 || requestedStatus !== STATUS_AWAITING_ADMIN_APPROVAL) {
            return c.json({ error: 'Forbidden' }, 403)
          }
          const contractCustomerId = (existing as any).customer_id
          if (!contractCustomerId) {
            return c.json({ error: 'Forbidden', detail: 'العقد غير مرتبط بعميل' }, 403)
          }
          const frRow = await c.env.DB.prepare(
            `SELECT id FROM financing_requests
             WHERE customer_id = ? AND assigned_bank_agent_id = ? AND tenant_id = ?
             LIMIT 1`
          )
            .bind(contractCustomerId, info.userId, info.tenantId)
            .first()
          if (!frRow) {
            return c.json({ error: 'Forbidden', detail: 'غير مصرح لك باعتماد هذا العقد' }, 403)
          }
          approvalFields.push('bank_agent_approved_by = ?', 'bank_agent_approved_at = CURRENT_TIMESTAMP')
          approvalVals.push(info.userId)
        } else if (currentStatus === STATUS_AWAITING_ADMIN_APPROVAL) {
          if (!isFinalApprover(info) || !FINAL_APPROVAL_STATUSES.has(requestedStatus)) {
            return c.json({ error: 'Forbidden' }, 403)
          }
          approvalFields.push('admin_approved_by = ?', 'admin_approved_at = CURRENT_TIMESTAMP')
          approvalVals.push(info.userId)
        }
      }
      const fields: string[] = []
      const vals: unknown[] = []
      const maybe = (col: string, key: keyof typeof body) => {
        if (method === 'PUT' || body[key] !== undefined) {
          fields.push(`${col} = ?`)
          if (
            key === 'finance_amount' ||
            key === 'commission_amount' ||
            key === 'commission_rate' ||
            key === 'customer_id'
          )
            vals.push(body[key] != null ? Number(body[key]) : null)
          else if (key === 'template_id') vals.push(body[key] != null ? Number(body[key]) : null)
          else if (key === 'is_archived') vals.push(body[key] ? 1 : 0)
          else if (key === 'party_two_id') vals.push(optionalNationalId(body[key]))
          else vals.push(body[key] ?? null)
        }
      }
      maybe('contract_number', 'contract_number')
      maybe('template_id', 'template_id')
      maybe('template_name', 'template_name')
      maybe('date_gregorian', 'date_gregorian')
      maybe('day_name', 'day_name')
      maybe('party_one_name', 'party_one_name')
      maybe('party_one_phone', 'party_one_phone')
      maybe('party_one_logo', 'party_one_logo')
      maybe('customer_id', 'customer_id')
      maybe('party_two_name', 'party_two_name')
      maybe('party_two_id', 'party_two_id')
      maybe('party_two_phone', 'party_two_phone')
      maybe('party_two_address', 'party_two_address')
      maybe('finance_type', 'finance_type')
      maybe('finance_amount', 'finance_amount')
      maybe('commission_amount', 'commission_amount')
      maybe('commission_type', 'commission_type')
      maybe('commission_rate', 'commission_rate')
      maybe('note_order_number', 'note_order_number')
      maybe('note_due_date', 'note_due_date')
      maybe('status', 'status')
      maybe('property_description', 'property_description')
      maybe('property_location', 'property_location')
      maybe('bank_name', 'bank_name')
      maybe('notes', 'notes')
      maybe('is_archived', 'is_archived')
      maybe('financing_request_id', 'financing_request_id')
      maybe('location_id', 'location_id')
      fields.push(...approvalFields)
      vals.push(...approvalVals)
      if (fields.length === 0) {
        const row = await c.env.DB.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first()
        return c.json(row)
      }
      try {
        await c.env.DB.prepare(`UPDATE contracts SET ${fields.join(', ')} WHERE id = ?`).bind(...vals, id).run()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (/no such column/i.test(msg)) {
          return c.json(
            {
              error: 'database_schema',
              detail:
                'العمود غير موجود. شغّل آخر migrations للعقود على D1، خاصة 0035 و0060.'
            },
            500
          )
        }
        return c.json({ error: 'database_error', detail: msg }, 500)
      }

      // Notify relevant parties when a contract transitions between approval stages
      if (statusChanged) {
        try {
          const currentStatus = String(existing.status ?? '')
          const requestedStatus = String(body.status ?? '')
          const customerId = (existing as any).customer_id ? Number((existing as any).customer_id) : null
          const effectiveTenantId = info.tenantId ?? existing.tenant_id
          const actorName = await resolveActorName(c.env.DB, info.userId)
          const contractLabel = `عقد #${id}`
          const linkUrl = `/admin/contracts/view?id=${id}`

          if (
            currentStatus === STATUS_AWAITING_BANK_AGENT_APPROVAL &&
            requestedStatus === STATUS_AWAITING_ADMIN_APPROVAL
          ) {
            // Bank agent approved — notify admins
            const targets = await resolveContractAdminUserIds(c.env.DB, effectiveTenantId, info.userId)
            if (targets.length) {
              await insertWorkflowCrossPartyAlarms(c.env.DB, {
                customerId,
                tenantId: effectiveTenantId,
                targetUserIds: targets,
                customerName: contractLabel,
                note: `اعتمد ${actorName} ${contractLabel} كممثل بنك — بانتظار موافقة الإدارة`,
                linkUrl,
              })
            } else {
              console.warn('[contracts] no admin targets after bank-agent approve', {
                contractId: id,
                tenantId: effectiveTenantId,
              })
            }
          } else if (
            currentStatus === STATUS_AWAITING_ADMIN_APPROVAL &&
            FINAL_APPROVAL_STATUSES.has(requestedStatus)
          ) {
            // Admin gave final approval — notify the contract creator
            const creatorId = existing.created_by ? Number(existing.created_by) : null
            if (creatorId && creatorId !== info.userId) {
              await insertWorkflowCrossPartyAlarms(c.env.DB, {
                customerId,
                tenantId: effectiveTenantId,
                targetUserIds: [creatorId],
                customerName: contractLabel,
                note: `وافقت الإدارة على ${contractLabel} — الحالة الجديدة: ${requestedStatus}`,
                linkUrl,
              })
            }
          }
        } catch (e) {
          console.error('[contracts] status-change approval notify failed', e)
        }
      }

      const row = await c.env.DB.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first()
      return c.json(row)
    }

    if (table === 'promissory_notes') {
      const fields: string[] = []
      const vals: unknown[] = []
      const maybe = (col: string, key: keyof typeof body) => {
        if (method === 'PUT' || body[key] !== undefined) {
          fields.push(`${col} = ?`)
          if (key === 'amount') vals.push(body[key] != null ? Number(body[key]) : null)
          else if (key === 'contract_id') vals.push(body[key] != null ? Number(body[key]) : null)
          else if (key === 'debtor_id') vals.push(optionalNationalId(body[key]))
          else vals.push(body[key] ?? null)
        }
      }
      maybe('note_number', 'note_number')
      maybe('contract_id', 'contract_id')
      maybe('debtor_name', 'debtor_name')
      maybe('debtor_id', 'debtor_id')
      maybe('amount', 'amount')
      maybe('due_date', 'due_date')
      maybe('issue_date', 'issue_date')
      maybe('payment_place', 'payment_place')
      maybe('status', 'status')
      if (fields.length === 0) {
        const row = await c.env.DB.prepare('SELECT * FROM promissory_notes WHERE id = ?').bind(id).first()
        return c.json(row)
      }
      await c.env.DB.prepare(`UPDATE promissory_notes SET ${fields.join(', ')} WHERE id = ?`).bind(...vals, id).run()
      const row = await c.env.DB.prepare('SELECT * FROM promissory_notes WHERE id = ?').bind(id).first()
      return c.json(row)
    }

    return c.json({ error: 'Unsupported' }, 400)
  }

  /**
   * Same as POST /api/attachments/upload: `ATTACHMENTS` R2 bucket + URL `/api/attachments/view/:path`.
   * Key: `contracts/{tenantId}/party_logo_{timestamp}_{random}.ext`
   */
  app.post('/api/contracts/party-logo-upload', async (c) => {
    const { info: rawInfo, error } = await auth(c, getUserInfo)
    if (error) return error
    const info = await withEffectiveTenantForContractsApi(c, rawInfo)
    const attachments = (c.env as { ATTACHMENTS?: { put: (k: string, b: ArrayBuffer, o?: { httpMetadata?: { contentType?: string } }) => Promise<unknown> } }).ATTACHMENTS
    if (!attachments) {
      return c.json(
        { error: 'storage_not_configured', detail: 'Attachment storage (R2) not configured' },
        500
      )
    }

    let formData: FormData
    try {
      formData = await c.req.formData()
    } catch {
      return c.json({ error: 'invalid_form', detail: 'Expected multipart/form-data' }, 400)
    }

    const fileEntry = formData.get('file')
    if (!fileEntry || !(fileEntry instanceof File)) {
      return c.json({ error: 'no_file', detail: 'No file provided' }, 400)
    }

    const file = fileEntry
    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      return c.json({ error: 'file_too_large', detail: 'الحد الأقصى 2 ميجابايت' }, 400)
    }

    const mime = (file.type || '').toLowerCase()
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(mime)) {
      return c.json({ error: 'invalid_type', detail: 'يُسمح بصور PNG أو JPEG أو GIF أو WebP فقط' }, 400)
    }

    const tidFromForm = formData.get('tenant_id')
    const body: Record<string, unknown> = {}
    if (tidFromForm != null && String(tidFromForm).trim() !== '') {
      body.tenant_id = tidFromForm
    }
    const { tenantId, error: te } = resolveWriteTenantId(info, body, c)
    if (te) return te
    if (tenantId == null) return c.json({ error: 'missing_tenant', detail: 'Missing tenant' }, 400)

    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 9)
    const rawExt = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg'
    const ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(rawExt) ? rawExt : 'jpg'
    const key = `contracts/${tenantId}/party_logo_${timestamp}_${random}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    await attachments.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`
      }
    })

    const publicUrl = `/api/attachments/view/${key}`
    return c.json({ success: true, url: publicUrl, filename: key })
  })

  async function uploadTemplateBrandingImage(c: any, keyPart: string): Promise<Response> {
    const { info: rawInfo, error } = await auth(c, getUserInfo)
    if (error) return error
    const info = await withEffectiveTenantForContractsApi(c, rawInfo)
    if (info.roleId === 4 || info.roleId === 5 || info.roleId === 6 || isContractsModuleReadOnlyRole(info)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    const attachments = (c.env as { ATTACHMENTS?: { put: (k: string, b: ArrayBuffer, o?: { httpMetadata?: { contentType?: string } }) => Promise<unknown> } }).ATTACHMENTS
    if (!attachments) {
      return c.json({ error: 'storage_not_configured', detail: 'Attachment storage (R2) not configured' }, 500)
    }
    let formData: FormData
    try {
      formData = await c.req.formData()
    } catch {
      return c.json({ error: 'invalid_form', detail: 'Expected multipart/form-data' }, 400)
    }
    const fileEntry = formData.get('file')
    if (!fileEntry || !(fileEntry instanceof File)) {
      return c.json({ error: 'no_file', detail: 'No file provided' }, 400)
    }
    const file = fileEntry
    if (file.size > 2 * 1024 * 1024) {
      return c.json({ error: 'file_too_large', detail: 'الحد الأقصى 2 ميجابايت' }, 400)
    }
    const mime = (file.type || '').toLowerCase()
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(mime)) {
      return c.json({ error: 'invalid_type', detail: 'يُسمح بصور PNG أو JPEG أو GIF أو WebP فقط' }, 400)
    }
    const tidFromForm = formData.get('tenant_id')
    const body: Record<string, unknown> = {}
    if (tidFromForm != null && String(tidFromForm).trim() !== '') body.tenant_id = tidFromForm
    const { tenantId, error: te } = resolveWriteTenantId(info, body, c)
    if (te) return te
    if (tenantId == null) return c.json({ error: 'missing_tenant', detail: 'Missing tenant' }, 400)
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 9)
    const rawExt = (file.name.split('.').pop() || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png'
    const ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(rawExt) ? rawExt : 'png'
    const key = `contracts/${tenantId}/template_${keyPart}_${timestamp}_${random}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    await attachments.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}` }
    })
    const publicUrl = `/api/attachments/view/${key}`
    return c.json({ success: true, url: publicUrl, filename: key })
  }

  app.post('/api/contracts/template-watermark-upload', (c) => uploadTemplateBrandingImage(c, 'watermark'))
  app.post('/api/contracts/template-header-upload', (c) => uploadTemplateBrandingImage(c, 'header'))
  app.post('/api/contracts/template-footer-upload', (c) => uploadTemplateBrandingImage(c, 'footer'))

  /**
   * Per-template first-party stamp (ختم). Stored on contract_templates.stamp_url.
   * Key: `contracts/{tenantId}/template_stamp_{timestamp}_{random}.ext`
   */
  app.post('/api/contracts/template-stamp-upload', async (c) => {
    const { info: rawInfo, error } = await auth(c, getUserInfo)
    if (error) return error
    const info = await withEffectiveTenantForContractsApi(c, rawInfo)
    if (info.roleId === 4 || info.roleId === 5 || info.roleId === 6 || isContractsModuleReadOnlyRole(info)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    const attachments = (c.env as { ATTACHMENTS?: { put: (k: string, b: ArrayBuffer, o?: { httpMetadata?: { contentType?: string } }) => Promise<unknown> } }).ATTACHMENTS
    if (!attachments) {
      return c.json(
        { error: 'storage_not_configured', detail: 'Attachment storage (R2) not configured' },
        500
      )
    }

    let formData: FormData
    try {
      formData = await c.req.formData()
    } catch {
      return c.json({ error: 'invalid_form', detail: 'Expected multipart/form-data' }, 400)
    }

    const fileEntry = formData.get('file')
    if (!fileEntry || !(fileEntry instanceof File)) {
      return c.json({ error: 'no_file', detail: 'No file provided' }, 400)
    }

    const file = fileEntry
    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      return c.json({ error: 'file_too_large', detail: 'الحد الأقصى 2 ميجابايت' }, 400)
    }

    const mime = (file.type || '').toLowerCase()
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(mime)) {
      return c.json({ error: 'invalid_type', detail: 'يُسمح بصور PNG أو JPEG أو GIF أو WebP فقط' }, 400)
    }

    const tidFromForm = formData.get('tenant_id')
    const body: Record<string, unknown> = {}
    if (tidFromForm != null && String(tidFromForm).trim() !== '') {
      body.tenant_id = tidFromForm
    }
    const { tenantId, error: te } = resolveWriteTenantId(info, body, c)
    if (te) return te
    if (tenantId == null) return c.json({ error: 'missing_tenant', detail: 'Missing tenant' }, 400)

    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 9)
    const rawExt = (file.name.split('.').pop() || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png'
    const ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(rawExt) ? rawExt : 'png'
    const key = `contracts/${tenantId}/template_stamp_${timestamp}_${random}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    await attachments.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`
      }
    })

    const publicUrl = `/api/attachments/view/${key}`
    return c.json({ success: true, url: publicUrl, filename: key })
  })

  app.put('/api/contract-tables/:table/:id', (c) => updateRow(c, 'PUT'))
  app.patch('/api/contract-tables/:table/:id', (c) => updateRow(c, 'PATCH'))

  app.delete('/api/contract-tables/:table/:id', async (c) => {
    const { info: rawInfo, error } = await auth(c, getUserInfo)
    if (error) return error
    const info = await withEffectiveTenantForContractsApi(c, rawInfo)
    if (isContractsModuleReadOnlyRole(info)) return c.json({ error: 'Forbidden' }, 403)
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const id = parseInt(c.req.param('id'), 10)
    if (!id) return c.json({ error: 'Invalid id' }, 400)
    const existing = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<{
      tenant_id: number
      created_by?: number | null
    }>()
    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (info.tenantId && existing.tenant_id !== info.tenantId) return c.json({ error: 'Forbidden' }, 403)
    if (!info.tenantId && !isSuperAdmin(info)) return c.json({ error: 'Forbidden' }, 403)
    if (table === 'contract_templates' && (info.roleId === 4 || info.roleId === 5 || info.roleId === 6)) return c.json({ error: 'Forbidden' }, 403)
    if (table === 'contracts' && (info.roleId === 4 || info.roleId === 6) && existing.created_by !== info.userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run()
    return new Response(null, { status: 204 })
  })
}
