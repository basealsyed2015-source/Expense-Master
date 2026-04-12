import type { Context } from 'hono'

type UserInfo = {
  userId: number | null
  tenantId: number | null
  roleId: number | null
  tokenRoleId: number | null
}

type GetUserInfo = (c: Context) => Promise<UserInfo>

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

function isSuperAdmin(info: UserInfo): boolean {
  return info.roleId === 1 && (info.tokenRoleId === null || info.tokenRoleId === 1)
}

function isContractsModuleBlockedRole(info: UserInfo): boolean {
  return info.roleId === 4
}

function isContractsModuleReadOnlyRole(info: UserInfo): boolean {
  return info.roleId === 3
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

export function registerContractsModuleApi(app: any, getUserInfo: GetUserInfo) {
  // Dedicated customer lookup for the new-contract form — fetches customers table
  // directly so the contracts module never depends on the generic :table route for this.
  app.get('/api/contract-tables/customer-list', async (c) => {
    const { info, error } = await auth(c, getUserInfo)
    if (error) return error

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

    // Align with GET /api/customers: employees (role 4) only see customers assigned to them
    if (info.roleId === 4 && info.userId) {
      sql += ` AND assigned_to = ?`
      binds.push(info.userId)
    }

    sql += ` ORDER BY full_name ASC LIMIT 500`

    const { results } = await c.env.DB.prepare(sql).bind(...binds).all()
    return c.json({ data: results || [] })
  })

  // REST shape matches reference: GET /api/contract-tables/:table?limit=...
  app.get('/api/contract-tables/:table', async (c) => {
    const { info, error } = await auth(c, getUserInfo)
    if (error) return error
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const limit = Math.min(parseInt(c.req.query('limit') || '200', 10) || 200, 500)
    const { sql: tsql, binds: tbinds } = tenantFilterClause(info, c, table)
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM ${table} WHERE 1=1 ${tsql} ORDER BY id DESC LIMIT ?`
    )
      .bind(...tbinds, limit)
      .all()
    return c.json({ data: results || [] })
  })

  app.get('/api/contract-tables/:table/:id', async (c) => {
    const { info, error } = await auth(c, getUserInfo)
    if (error) return error
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const id = parseInt(c.req.param('id'), 10)
    if (!id) return c.json({ error: 'Invalid id' }, 400)
    const { sql: tsql, binds: tbinds } = tenantFilterClause(info, c, table)
    const row = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ? ${tsql}`)
      .bind(id, ...tbinds)
      .first()
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json(row)
  })

  app.post('/api/contract-tables/:table', async (c) => {
    const { info, error } = await auth(c, getUserInfo)
    if (error) return error
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const { tenantId, error: te } = resolveWriteTenantId(info, body, c)
    if (te) return te
    if (tenantId == null) return c.json({ error: 'Missing tenant' }, 400)

    if (table === 'contract_templates') {
      const template_name = String(body.template_name ?? '')
      if (!template_name.trim()) return c.json({ error: 'template_name required' }, 400)
      const r = await c.env.DB.prepare(
        `INSERT INTO contract_templates (
          tenant_id, template_name, template_type, header_content, body_content, footer_content,
          variables_list, is_active, court_city
        ) VALUES (?,?,?,?,?,?,?,?,?)`
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
          body.court_city ?? null
        )
        .run()
      const id = r.meta.last_row_id as number
      const row = await c.env.DB.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(id).first()
      return c.json({ ...row, id })
    }

    if (table === 'contracts') {
      const logoNorm = normalizePartyOneLogo(body)
      if (!logoNorm.ok) return logoNorm.response
      let r
      try {
        r = await c.env.DB.prepare(
          `INSERT INTO contracts (
          tenant_id, contract_number, template_id, template_name, date_gregorian, date_hijri, day_name,
          party_one_name, party_one_phone, party_one_logo,
          customer_id, party_two_name, party_two_id, party_two_phone, party_two_address, finance_type, finance_amount,
          commission_amount, commission_type, commission_rate, note_order_number, note_due_date, status,
          property_description, property_location, bank_name, notes, is_archived
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        )
          .bind(
            tenantId,
            body.contract_number ?? null,
            body.template_id != null ? Number(body.template_id) : null,
            body.template_name ?? null,
            body.date_gregorian ?? null,
            body.date_hijri ?? null,
            body.day_name ?? null,
            body.party_one_name ?? null,
            body.party_one_phone ?? null,
            logoNorm.value,
            body.customer_id != null ? Number(body.customer_id) : null,
            body.party_two_name ?? null,
            body.party_two_id ?? null,
            body.party_two_phone ?? null,
            body.party_two_address ?? null,
            body.finance_type ?? null,
            body.finance_amount != null ? Number(body.finance_amount) : null,
            body.commission_amount != null ? Number(body.commission_amount) : null,
            body.commission_type ?? null,
            body.commission_rate != null ? Number(body.commission_rate) : null,
            body.note_order_number ?? null,
            body.note_due_date ?? null,
            body.status ?? 'نشط',
            body.property_description ?? null,
            body.property_location ?? null,
            body.bank_name ?? null,
            body.notes ?? null,
            body.is_archived ? 1 : 0
          )
          .run()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (/no such column/i.test(msg)) {
          return c.json(
            {
              error: 'database_schema',
              detail:
                'العمود غير موجود في قاعدة البيانات. شغّل migration 0035_contracts_party_one_fields على D1.'
            },
            500
          )
        }
        return c.json({ error: 'database_error', detail: msg }, 500)
      }
      const id = r.meta.last_row_id as number
      const row = await c.env.DB.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first()
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
      const r = await c.env.DB.prepare(
        `INSERT INTO promissory_notes (
          tenant_id, note_number, contract_id, debtor_name, debtor_id, amount, due_date, issue_date, payment_place, status
        ) VALUES (?,?,?,?,?,?,?,?,?,?)`
      )
        .bind(
          tenantId,
          note_number,
          contract_id,
          body.debtor_name ?? null,
          body.debtor_id ?? null,
          body.amount != null ? Number(body.amount) : null,
          body.due_date ?? null,
          body.issue_date ?? null,
          body.payment_place ?? null,
          body.status ?? 'ساري'
        )
        .run()
      const id = r.meta.last_row_id as number
      const row = await c.env.DB.prepare('SELECT * FROM promissory_notes WHERE id = ?').bind(id).first()
      return c.json({ ...row, id })
    }

    return c.json({ error: 'Unsupported' }, 400)
  })

  const updateRow = async (c: Context, method: 'PUT' | 'PATCH') => {
    const { info, error } = await auth(c, getUserInfo)
    if (error) return error
    if (isContractsModuleReadOnlyRole(info)) return c.json({ error: 'Forbidden' }, 403)
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const id = parseInt(c.req.param('id'), 10)
    if (!id) return c.json({ error: 'Invalid id' }, 400)
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

    const existing = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<{
      tenant_id: number
    }>()
    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (info.tenantId && existing.tenant_id !== info.tenantId) return c.json({ error: 'Forbidden' }, 403)
    if (!info.tenantId && !isSuperAdmin(info)) return c.json({ error: 'Forbidden' }, 403)

    if (table === 'contract_templates') {
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
      if (fields.length === 0) {
        const row = await c.env.DB.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(id).first()
        return c.json(row)
      }
      await c.env.DB.prepare(`UPDATE contract_templates SET ${fields.join(', ')} WHERE id = ?`).bind(...vals, id).run()
      const row = await c.env.DB.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(id).first()
      return c.json(row)
    }

    if (table === 'contracts') {
      if (body.party_one_logo !== undefined) {
        const logoNorm = normalizePartyOneLogo(body)
        if (!logoNorm.ok) return logoNorm.response
        body.party_one_logo = logoNorm.value
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
          else vals.push(body[key] ?? null)
        }
      }
      maybe('contract_number', 'contract_number')
      maybe('template_id', 'template_id')
      maybe('template_name', 'template_name')
      maybe('date_gregorian', 'date_gregorian')
      maybe('date_hijri', 'date_hijri')
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
                'العمود غير موجود. شغّل migration 0035_contracts_party_one_fields على D1.'
            },
            500
          )
        }
        return c.json({ error: 'database_error', detail: msg }, 500)
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
    const { info, error } = await auth(c, getUserInfo)
    if (error) return error
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

  app.put('/api/contract-tables/:table/:id', (c) => updateRow(c, 'PUT'))
  app.patch('/api/contract-tables/:table/:id', (c) => updateRow(c, 'PATCH'))

  app.delete('/api/contract-tables/:table/:id', async (c) => {
    const { info, error } = await auth(c, getUserInfo)
    if (error) return error
    if (isContractsModuleReadOnlyRole(info)) return c.json({ error: 'Forbidden' }, 403)
    const name = c.req.param('table')
    const table = sqlTable(name)
    if (!table) return c.json({ error: 'Unknown table' }, 400)
    const id = parseInt(c.req.param('id'), 10)
    if (!id) return c.json({ error: 'Invalid id' }, 400)
    const existing = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<{
      tenant_id: number
    }>()
    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (info.tenantId && existing.tenant_id !== info.tenantId) return c.json({ error: 'Forbidden' }, 403)
    if (!info.tenantId && !isSuperAdmin(info)) return c.json({ error: 'Forbidden' }, 403)
    await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run()
    return new Response(null, { status: 204 })
  })
}
