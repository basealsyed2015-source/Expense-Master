import { Hono } from 'hono'
import { findBankDuplicate, bankDuplicateMessage, mapBankDbError } from '../bank-tenant-uniqueness.ts'
import { deleteBankAndDependents, deleteGlobalBanksAndDependents } from '../shared/bank-deletes.ts'
import type { AppEnv } from '../shared/context.ts'

export const banksRoutes = new Hono<AppEnv>()

// BANKS APIs

// Get all banks (tenant-specific banks only by default)
banksRoutes.get('/api/banks', async (c) => {
  try {
    // Get tenant_id and role_id from query parameter or Authorization header
    let tenantIdRaw = c.req.query('tenant_id');
    let tenantId = tenantIdRaw ? parseInt(tenantIdRaw, 10) : null;
    let roleId: number | null = null;

    // Extract tenant_id and role_id from Authorization header if not in query
    const authHeader = c.req.header('Authorization')
    const cookieToken = c.req.header('Cookie')?.split('authToken=')[1]?.split(';')[0]
    const token = authHeader?.replace('Bearer ', '') || cookieToken

    if (token) {
      try {
        const decoded = atob(token)
        const parts = decoded.split(':')
        const tokenTenantId = parts[1] !== 'null' ? parseInt(parts[1]) : null
        const tokenRoleId = parts[2] ? parseInt(parts[2]) : null

        // Only use token tenant_id if not provided in query
        if ((!tenantId || Number.isNaN(tenantId)) && tokenTenantId && !Number.isNaN(tokenTenantId)) {
          tenantId = tokenTenantId
        }

        // Always extract role_id from token if available
        if (tokenRoleId && !Number.isNaN(tokenRoleId)) {
          roleId = tokenRoleId
        }
      } catch (e) {
        // Token parsing failed, continue without tenant_id
      }
    }

    // Default to false - only include global banks if explicitly requested
    const includeGlobal = c.req.query('include_global') === '1';

    let query = `SELECT * FROM banks`;
    let results;

    // Super admin (role_id = 1) sees all banks
    if (roleId === 1) {
      query += ` ORDER BY bank_name`;
      results = (await c.env.DB.prepare(query).all()).results;
    }
    // Tenant users only see their own banks (exclude global banks)
    else if (tenantId !== null && !Number.isNaN(tenantId)) {
      if (includeGlobal) {
        query += ` WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY bank_name`;
      } else {
        // Only show banks that belong to this specific tenant (exclude global banks)
        query += ` WHERE tenant_id = ? ORDER BY bank_name`;
      }
      results = (await c.env.DB.prepare(query).bind(tenantId).all()).results;
    }
    // If no tenant_id and not super admin, return empty (shouldn't happen for authenticated users)
    else {
      query += ` WHERE 1=0 ORDER BY bank_name`; // Return empty result
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
banksRoutes.post('/api/banks', async (c) => {
  try {
    const data = await c.req.json()
    const { bank_name, bank_code, logo_url, is_active, tenant_id } = data

    if (!bank_name || !String(bank_name).trim()) {
      return c.json({ success: false, error: 'اسم البنك مطلوب.' }, 400)
    }

    // Get tenant_id from Authorization header if not provided
    let finalTenantId: number | null = tenant_id ?? null
    if (finalTenantId == null) {
      const authHeader = c.req.header('Authorization')
      const token = authHeader?.replace('Bearer ', '')
      if (token) {
        const decoded = atob(token)
        const parts = decoded.split(':')
        finalTenantId = parts[1] !== 'null' ? parseInt(parts[1], 10) : null
      }
    }

    const duplicate = await findBankDuplicate(c.env.DB, {
      tenantId: finalTenantId,
      bankName: bank_name,
      bankCode: bank_code,
    })
    if (duplicate) {
      return c.json({ success: false, error: bankDuplicateMessage(duplicate) }, 409)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO banks (bank_name, bank_code, logo_url, is_active, tenant_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      String(bank_name).trim(),
      bank_code != null && String(bank_code).trim() !== '' ? String(bank_code).trim() : null,
      logo_url || null,
      is_active ?? 1,
      finalTenantId
    ).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error: unknown) {
    const mapped = mapBankDbError(error)
    if (mapped) {
      return c.json({ success: false, error: mapped }, 409)
    }
    console.error('Add bank error:', error)
    return c.json({ success: false, error: 'فشل إضافة البنك. حاول مرة أخرى لاحقاً.' }, 500)
  }
})

// Update bank (PUT method for API)
banksRoutes.put('/api/banks/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (Number.isNaN(id)) {
      return c.json({ success: false, error: 'معرّف البنك غير صالح.' }, 400)
    }

    const data = await c.req.json()
    const { bank_name, bank_code, logo_url, is_active } = data

    if (!bank_name || !String(bank_name).trim()) {
      return c.json({ success: false, error: 'اسم البنك مطلوب.' }, 400)
    }

    // Verify bank belongs to user's tenant
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id: number | null = null
    if (token) {
      const decoded = atob(token)
      const parts = decoded.split(':')
      tenant_id = parts[1] !== 'null' ? parseInt(parts[1], 10) : null
    }

    const existing = await c.env.DB.prepare(
      'SELECT id, tenant_id FROM banks WHERE id = ?'
    ).bind(id).first<{ id: number; tenant_id: number | null }>()
    if (!existing) {
      return c.json({ success: false, error: 'البنك غير موجود.' }, 404)
    }
    if (tenant_id != null && existing.tenant_id !== tenant_id) {
      return c.json({ success: false, error: 'غير مصرح بتعديل هذا البنك.' }, 403)
    }

    const scopeTenantId = tenant_id ?? existing.tenant_id
    const duplicate = await findBankDuplicate(c.env.DB, {
      tenantId: scopeTenantId,
      bankName: bank_name,
      bankCode: bank_code,
      excludeId: id,
    })
    if (duplicate) {
      return c.json({ success: false, error: bankDuplicateMessage(duplicate) }, 409)
    }

    // Add tenant_id check to WHERE clause for security
    let query = `UPDATE banks SET bank_name = ?, bank_code = ?, logo_url = ?, is_active = ? WHERE id = ?`
    const trimmedName = String(bank_name).trim()
    const trimmedCode = bank_code != null && String(bank_code).trim() !== '' ? String(bank_code).trim() : null
    if (tenant_id != null) {
      query += ' AND tenant_id = ?'
      await c.env.DB.prepare(query).bind(trimmedName, trimmedCode, logo_url || null, is_active ?? 1, id, tenant_id).run()
    } else {
      await c.env.DB.prepare(query).bind(trimmedName, trimmedCode, logo_url || null, is_active ?? 1, id).run()
    }

    return c.json({ success: true })
  } catch (error: unknown) {
    const mapped = mapBankDbError(error)
    if (mapped) {
      return c.json({ success: false, error: mapped }, 409)
    }
    console.error('Update bank error:', error)
    return c.json({ success: false, error: 'فشل تحديث البنك. حاول مرة أخرى لاحقاً.' }, 500)
  }
})

// Update bank (POST method for form submission - legacy)
banksRoutes.post('/api/banks/:id', async (c) => {
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
banksRoutes.delete('/api/banks/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Get tenant_id and role_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let tenant_id = null
    let role_id = null
    if (token) {
      try {
        const decoded = atob(token)
        const parts = decoded.split(':')
        tenant_id = parts[1] !== 'null' ? parseInt(parts[1]) : null
        role_id = parts[2] ? parseInt(parts[2]) : null
      } catch (e) {
        // Token parsing failed
      }
    }

    // Check if bank exists and get its tenant_id
    const bank = await c.env.DB.prepare('SELECT id, tenant_id FROM banks WHERE id = ?').bind(id).first()

    if (!bank) {
      return c.json({ success: false, error: 'البنك غير موجود' }, 404)
    }

    // If bank is global (tenant_id IS NULL), only super admin can delete it
    if (bank.tenant_id === null) {
      if (role_id !== 1) {
        return c.json({ success: false, error: 'لا يمكنك حذف البنوك العامة. فقط مدير النظام يمكنه حذفها' }, 403)
      }
    } else {
      // If bank belongs to a tenant, only that tenant can delete it
      if (tenant_id !== bank.tenant_id) {
        return c.json({ success: false, error: 'البنك غير موجود أو لا يمكنك حذفه' }, 404)
      }
    }

    await deleteBankAndDependents(c.env.DB, id)

    return c.json({ success: true, message: 'تم حذف البنك بنجاح' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete all global banks (super admin only)
banksRoutes.delete('/api/banks/global/all', async (c) => {
  try {
    // Get role_id from Authorization header
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let role_id = null
    if (token) {
      try {
        const decoded = atob(token)
        const parts = decoded.split(':')
        role_id = parts[2] ? parseInt(parts[2]) : null
      } catch (e) {
        // Token parsing failed
      }
    }

    // Only super admin can delete all global banks
    if (role_id !== 1) {
      return c.json({ success: false, error: 'غير مصرح لك بحذف البنوك العامة' }, 403)
    }

    const batchResults = await deleteGlobalBanksAndDependents(c.env.DB)
    const deletedBanks = batchResults[batchResults.length - 1]?.meta?.changes ?? 0

    return c.json({
      success: true,
      message: `تم حذف ${deletedBanks} بنك عام`,
      deleted_count: deletedBanks
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})
