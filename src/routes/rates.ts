import { Hono } from 'hono'
import { buildSpreadsheetML, spreadsheetMLAttachmentResponse } from '../csv-export.ts'
import { getUserInfo } from '../shared/auth-user.ts'
import type { AppEnv } from '../shared/context.ts'

export const ratesRoutes = new Hono<AppEnv>()

// BANK FINANCING RATES APIs

// Get all rates with bank and type names
ratesRoutes.get('/api/rates', async (c) => {
  try {
    // Support explicit tenant filter for public calculator endpoints
    const tenantIdFromQueryRaw = c.req.query('tenant_id')
    const tenantIdFromQuery = tenantIdFromQueryRaw ? parseInt(tenantIdFromQueryRaw, 10) : null

    // Get tenant_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null

    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
    }

    if (tenantIdFromQuery !== null && !Number.isNaN(tenantIdFromQuery)) {
      tenant_id = tenantIdFromQuery
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
ratesRoutes.post('/api/rates', async (c) => {
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

    const notes = data.notes && String(data.notes).trim() ? String(data.notes).trim() : null
    const result = await c.env.DB.prepare(`
      INSERT INTO bank_financing_rates
      (bank_id, financing_type_id, rate, min_amount, max_amount, min_duration, max_duration, is_active, tenant_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.bank_id,
      data.financing_type_id,
      data.rate,
      data.min_amount || null,
      data.max_amount || null,
      data.min_duration || null,
      data.max_duration || null,
      data.is_active || 1,
      tenant_id,
      notes
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
ratesRoutes.put('/api/rates/:id', async (c) => {
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

    const notes = data.notes != null && String(data.notes).trim() ? String(data.notes).trim() : null
    // Add tenant_id check for security
    let query = `
      UPDATE bank_financing_rates
      SET bank_id = ?, financing_type_id = ?, rate = ?,
          min_amount = ?, max_amount = ?, min_salary = ?, max_salary = ?,
          min_duration = ?, max_duration = ?, is_active = ?, notes = ?
      WHERE id = ?
    `
    if (tenant_id) {
      query += ' AND tenant_id = ?'
      await c.env.DB.prepare(query).bind(
        data.bank_id, data.financing_type_id, data.rate,
        data.min_amount, data.max_amount, data.min_salary, data.max_salary,
        data.min_duration, data.max_duration, data.is_active, notes, id, tenant_id
      ).run()
    } else {
      await c.env.DB.prepare(query).bind(
        data.bank_id, data.financing_type_id, data.rate,
        data.min_amount, data.max_amount, data.min_salary, data.max_salary,
        data.min_duration, data.max_duration, data.is_active, notes, id
      ).run()
    }

    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete rate
ratesRoutes.delete('/api/rates/:id', async (c) => {
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

// Download sample CSV template for rates
ratesRoutes.get('/api/rates/sample-csv', async (c) => {
  try {
    const tenantId = c.req.query('tenant_id');

    // Get banks and financing types for the tenant
    let banksQuery = 'SELECT id, bank_name FROM banks WHERE is_active = 1';
    let banksParams: any[] = [];

    if (tenantId) {
      banksQuery += ' AND tenant_id = ?';
      banksParams.push(tenantId);
    }

    banksQuery += ' ORDER BY bank_name';

    const banks = banksParams.length > 0
      ? await c.env.DB.prepare(banksQuery).bind(...banksParams).all()
      : await c.env.DB.prepare(banksQuery).all();

    const types = await c.env.DB.prepare('SELECT id, type_name FROM financing_types ORDER BY type_name').all();

    // Create CSV header - 8 columns matching form structure (RTL order - rightmost first)
    const header = [
      'الحد الأقصى للمدة (شهر)',
      'الحد الأدنى للمدة (شهر)',
      'الحد الأقصى للمبلغ (ريال)',
      'الحد الأدنى للمبلغ (ريال)',
      'النسبة %',
      'نوع التمويل',
      'البنك',
      'رقم تسلسلي'
    ];

    // Create sample rows with placeholders (5 examples) - RTL order
    const sampleRows: string[][] = [];
    const bankPlaceholders = ['بنك 1', 'بنك 2', 'بنك 3', 'بنك 4', 'بنك 5'];
    const typePlaceholders = ['نوع تمويل 1', 'نوع تمويل 2', 'نوع تمويل 3'];

    // Create 5 sample rows with different combinations (RTL order - rightmost column first)
    for (let i = 0; i < 5; i++) {
      sampleRows.push([
        (60 + i * 12).toString(), // Max duration (rightmost)
        (12 + i * 12).toString(), // Min duration
        (500000 + i * 500000).toString(), // Max amount
        (50000 + i * 50000).toString(), // Min amount
        (4.5 + i * 0.5).toFixed(1), // Rate
        typePlaceholders[i % typePlaceholders.length] || `نوع تمويل ${(i % 3) + 1}`, // Type
        bankPlaceholders[i] || `بنك ${i + 1}`, // Bank
        (i + 1).toString() // SL number (leftmost in RTL)
      ]);
    }

    const xml = buildSpreadsheetML([header, ...sampleRows], 'نسب التمويل')

    return spreadsheetMLAttachmentResponse(xml, 'نموذج_نسب_التمويل.xls')
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Export rates to CSV
ratesRoutes.get('/api/rates/export-csv', async (c) => {
  try {
    // Get user info
    const userInfo = await getUserInfo(c);
    const tenantId = c.req.query('tenant_id') || (userInfo.tenantId ? userInfo.tenantId.toString() : null);

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
      if (tenantId) {
        query += ' WHERE r.tenant_id = ?';
        queryParams.push(tenantId);
      }
    } else if (userInfo.roleId === 2 || userInfo.roleId === 3) {
      // Role 2: Company Admin - sees all company rates
      // Role 3: Supervisor - sees all company rates (read-only)
      if (userInfo.tenantId) {
        query += ' WHERE r.tenant_id = ?';
        queryParams.push(userInfo.tenantId);
      }
    } else {
      // Other roles - filtered by tenant_id if provided
      if (tenantId) {
        query += ' WHERE r.tenant_id = ?';
        queryParams.push(tenantId);
      }
    }

    query += ' ORDER BY b.bank_name, f.type_name';

    const rates = queryParams.length > 0
      ? await c.env.DB.prepare(query).bind(...queryParams).all()
      : await c.env.DB.prepare(query).all();

    // Create CSV header - 8 columns matching form structure (RTL order - rightmost first)
    const header = [
      'الحد الأقصى للمدة (شهر)',
      'الحد الأدنى للمدة (شهر)',
      'الحد الأقصى للمبلغ (ريال)',
      'الحد الأدنى للمبلغ (ريال)',
      'النسبة %',
      'نوع التمويل',
      'البنك',
      'رقم تسلسلي'
    ];

    const dataRows = rates.results.map((rate: any, index: number) => [
      String(rate.max_duration ?? ''),
      String(rate.min_duration ?? ''),
      String(rate.max_amount ?? ''),
      String(rate.min_amount ?? ''),
      String(rate.rate ?? ''),
      String(rate.financing_type_name ?? ''),
      String(rate.bank_name ?? ''),
      String(index + 1),
    ])
    const xml = buildSpreadsheetML([header, ...dataRows], 'نسب التمويل')

    return spreadsheetMLAttachmentResponse(
      xml,
      `نسب_التمويل_${new Date().toISOString().split('T')[0]}.xls`
    )
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

async function importBankFinancingRatesRows(
  db: D1Database,
  rates: any[],
  tenant_id: number
): Promise<{ created: number; updated: number; errors: string[] }> {
  let created = 0
  let updated = 0
  const errors: string[] = []

  for (let i = 0; i < rates.length; i++) {
    const rateData = rates[i] || {}
    try {
      const bank_id = Number(rateData.bank_id)
      const financing_type_id = Number(rateData.financing_type_id)
      const rate = rateData.rate

      if (!bank_id || !financing_type_id || rate === undefined || rate === null || rate === '') {
        errors.push(
          `Row ${i + 1}: invalid row (bank=${rateData.bank_id}, type=${rateData.financing_type_id}, rate=${rate})`
        )
        continue
      }

      const existing = await db
        .prepare(
          `SELECT id FROM bank_financing_rates
           WHERE bank_id = ? AND financing_type_id = ? AND tenant_id = ?
           LIMIT 1`
        )
        .bind(bank_id, financing_type_id, tenant_id)
        .first<{ id: number }>()

      if (existing?.id) {
        await db
          .prepare(
            `UPDATE bank_financing_rates
             SET rate = ?,
                 min_amount = ?,
                 max_amount = ?,
                 min_salary = ?,
                 max_salary = ?,
                 min_duration = ?,
                 max_duration = ?,
                 is_active = ?
             WHERE id = ? AND tenant_id = ?`
          )
          .bind(
            rate,
            rateData.min_amount ?? null,
            rateData.max_amount ?? null,
            rateData.min_salary ?? null,
            rateData.max_salary ?? null,
            rateData.min_duration ?? null,
            rateData.max_duration ?? null,
            rateData.is_active !== undefined ? rateData.is_active : 1,
            existing.id,
            tenant_id
          )
          .run()
        updated++
      } else {
        await db
          .prepare(
            `INSERT INTO bank_financing_rates
             (bank_id, financing_type_id, rate, min_amount, max_amount, min_salary, max_salary, min_duration, max_duration, is_active, tenant_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            bank_id,
            financing_type_id,
            rate,
            rateData.min_amount ?? null,
            rateData.max_amount ?? null,
            rateData.min_salary ?? null,
            rateData.max_salary ?? null,
            rateData.min_duration ?? null,
            rateData.max_duration ?? null,
            rateData.is_active !== undefined ? rateData.is_active : 1,
            tenant_id
          )
          .run()
        created++
      }
    } catch (error: any) {
      errors.push(`Row ${i + 1}: ${error?.message || String(error)}`)
    }
  }

  return { created, updated, errors }
}

async function resolveRatesImportTenantId(
  c: any,
  userInfo: { roleId: number | null; tenantId: number | null },
  body: { tenant_id?: unknown; rates?: { tenant_id?: unknown }[] } | null
): Promise<number | null> {
  let tenant_id: number | null =
    userInfo.tenantId != null && !Number.isNaN(Number(userInfo.tenantId))
      ? Number(userInfo.tenantId)
      : null

  if (!tenant_id && userInfo.roleId === 1) {
    const fromBody = Number.parseInt(String(body?.tenant_id ?? ''), 10)
    if (!Number.isNaN(fromBody) && fromBody > 0) tenant_id = fromBody
    const fromFirstRow = Number.parseInt(String(body?.rates?.[0]?.tenant_id ?? ''), 10)
    if (!tenant_id && !Number.isNaN(fromFirstRow) && fromFirstRow > 0) tenant_id = fromFirstRow
    const fromQuery = Number.parseInt(String(c.req.query('tenant_id') ?? ''), 10)
    if (!tenant_id && !Number.isNaN(fromQuery) && fromQuery > 0) tenant_id = fromQuery
  }

  return tenant_id
}

// Import rates from CSV (parsed client-side and sent as JSON)
ratesRoutes.post('/api/rates/import-csv', async (c) => {
  try {
    const userInfo = await getUserInfo(c)
    if (!userInfo.userId || !userInfo.roleId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401)
    }
    if (userInfo.roleId === 3) {
      return c.json({ success: false, error: 'Forbidden' }, 403)
    }
    if (userInfo.roleId !== 1 && userInfo.roleId !== 2) {
      return c.json({ success: false, error: 'Forbidden' }, 403)
    }

    const body = (await c.req.json().catch(() => null)) as {
      tenant_id?: unknown
      rates?: unknown
    } | null
    const incoming = body?.rates
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return c.json({ success: false, error: 'لا توجد بيانات للرفع' }, 400)
    }

    const tenant_id = await resolveRatesImportTenantId(c, userInfo, body)
    if (!tenant_id) {
      return c.json({ success: false, error: 'يجب تحديد الشركة' }, 400)
    }

    const { created, updated, errors } = await importBankFinancingRatesRows(
      c.env.DB,
      incoming,
      tenant_id
    )

    return c.json({
      success: true,
      created,
      updated,
      errors: errors.length ? errors : undefined,
      message: `تم إضافة ${created} سجل جديد وتحديث ${updated} سجل`
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Upload Excel/CSV file for rates (legacy alias → same handler as import-csv)
ratesRoutes.post('/api/rates/upload-excel', async (c) => {
  try {
    const userInfo = await getUserInfo(c)
    if (!userInfo.userId || !userInfo.roleId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401)
    }
    if (userInfo.roleId === 3) {
      return c.json({ success: false, error: 'Forbidden' }, 403)
    }
    if (userInfo.roleId !== 1 && userInfo.roleId !== 2) {
      return c.json({ success: false, error: 'Forbidden' }, 403)
    }

    const body = (await c.req.json().catch(() => null)) as {
      tenant_id?: unknown
      rates?: unknown
    } | null
    const incoming = body?.rates
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return c.json({ success: false, error: 'لا توجد بيانات للرفع' }, 400)
    }

    const tenant_id = await resolveRatesImportTenantId(c, userInfo, body)
    if (!tenant_id) {
      return c.json({ success: false, error: 'يجب تحديد الشركة' }, 400)
    }

    const { created, updated, errors } = await importBankFinancingRatesRows(
      c.env.DB,
      incoming,
      tenant_id
    )

    return c.json({
      success: true,
      created,
      updated,
      errors: errors.length ? errors : undefined,
      message: `تم إضافة ${created} سجل جديد وتحديث ${updated} سجل`
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// NOTE: A second, unauthenticated `DELETE /api/rates/:id` handler existed in
// the original index.tsx around line 13636 (grouped with other legacy delete
// endpoints). Since Hono matches the first-registered handler, the
// authenticated delete above already wins and the duplicate below is
// effectively dead code. Preserved verbatim during byte-preserving move.
ratesRoutes.delete('/api/rates/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM bank_financing_rates WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'تم حذف النسبة بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})
