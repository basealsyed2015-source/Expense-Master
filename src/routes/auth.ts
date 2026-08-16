import { Hono } from 'hono'
import { normalizeRoleId } from '../notification-access'
import { sendPasswordResetCodeEmail } from '../resend-email'
import { getRoleDisplayName } from '../shared/role-display'
import type { AppEnv } from '../shared/context'

export const authRoutes = new Hono<AppEnv>()

authRoutes.post('/api/auth/login', async (c) => {
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
             u.role_id, u.subscription_id, u.is_active,
             u.tenant_id, u.assigned_bank_id,
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
      const loginTimestamp = new Date().toISOString()
      await c.env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?')
        .bind(loginTimestamp, user.id).run()
      console.log('✅ [LOGIN] last_login updated successfully')
    }

    // Create token with tenant_id (user_id:tenant_id:role_id:timestamp)
    console.log('🔐 [LOGIN] Creating authentication token...')
    let tenantForAuthToken: number | null =
      user.tenant_id != null ? Number(user.tenant_id as number) : null
    const loginNormalizedRoleId = normalizeRoleId(user.role_id)
    const loginAssignedBankId = (user as { assigned_bank_id?: number | null }).assigned_bank_id
    const loginBankIdNum =
      loginAssignedBankId != null && !Number.isNaN(Number(loginAssignedBankId))
        ? Number(loginAssignedBankId)
        : null
    if (
      tenantForAuthToken == null &&
      (loginNormalizedRoleId === 5 || loginNormalizedRoleId === 6) &&
      loginBankIdNum != null &&
      c.env.DB
    ) {
      try {
        const br = await c.env.DB.prepare('SELECT tenant_id FROM banks WHERE id = ? LIMIT 1')
          .bind(loginBankIdNum)
          .first<{ tenant_id: number | null }>()
        if (br?.tenant_id != null && !Number.isNaN(Number(br.tenant_id))) {
          tenantForAuthToken = Number(br.tenant_id)
        }
      } catch (_) {
        /* keep null */
      }
    }

    const tokenData = `${user.id}:${tenantForAuthToken ?? 'null'}:${user.role_id}:${Date.now()}`
    console.log('🔐 [LOGIN] Token data:', tokenData)
    const token = btoa(tokenData)
    console.log('🔐 [LOGIN] Token created:', token.substring(0, 30) + '...')

    // Set cookie for 7 days - use Response headers directly for Cloudflare Pages compatibility
    const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    const cookieValue = `authToken=${token}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Secure`

    // Determine redirect URL
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
        role_id: user.role_id,
        role_name: getRoleDisplayName(user.role_id, user.role_name),  // Role name from roles table
        role_description: user.role_description,
        company_name: user.subscription_company_name || user.tenant_name,
        subscription_id: user.subscription_id,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        tenant_slug: user.tenant_slug,
        assigned_bank_id: (user as { assigned_bank_id?: number | null }).assigned_bank_id ?? null
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
authRoutes.post('/api/auth/logout', async (c) => {
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
authRoutes.post('/api/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json()
    const apiKey = c.env.RESEND_API_KEY?.trim()
    if (!apiKey) {
      console.error('Forgot password: RESEND_API_KEY is not set')
      return c.json(
        {
          success: false,
          message:
            'خدمة البريد غير مهيأة على الخادم. أضف سر RESEND_API_KEY (راجع إعدادات النشر).',
        },
        503
      )
    }

    // Check if user exists
    const user = await c.env.DB.prepare(`
      SELECT id, email, username FROM users WHERE email = ? OR username = ?
    `).bind(email, email).first<{ id: number; email: string | null; username: string }>()

    if (!user) {
      return c.json({ success: false, message: 'البريد الإلكتروني أو اسم المستخدم غير موجود' }, 404)
    }

    const to = String(user.email ?? '').trim()
    if (!to) {
      return c.json(
        {
          success: false,
          message: 'لا يوجد بريد إلكتروني مسجل لهذا الحساب. تواصل مع المسؤول لتحديث بريدك.',
        },
        400
      )
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    const inserted = await c.env.DB.prepare(`
      INSERT INTO password_change_notifications (user_id, verification_code, expires_at, is_used)
      VALUES (?, ?, ?, 0)
      RETURNING id
    `).bind(user.id, code, expiresAt.toISOString()).first<{ id: number }>()

    if (!inserted?.id) {
      console.error('Forgot password: INSERT RETURNING id failed')
      return c.json({ success: false, message: 'حدث خطأ. الرجاء المحاولة مرة أخرى.' }, 500)
    }

    const from = (c.env.EMAIL_FROM?.trim() || 'Tamweel <onboarding@resend.dev>').trim()
    const sent = await sendPasswordResetCodeEmail({ apiKey, from, to, code })
    if (!sent.ok) {
      console.error('Resend forgot-password error:', sent.error)
      await c.env.DB.prepare(`DELETE FROM password_change_notifications WHERE id = ?`).bind(inserted.id).run()
      return c.json(
        {
          success: false,
          message: 'تعذر إرسال البريد الإلكتروني. تحقق من عنوان المرسل في Resend أو حاول لاحقاً.',
        },
        502
      )
    }

    return c.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return c.json({ success: false, message: 'حدث خطأ. الرجاء المحاولة مرة أخرى.' }, 500)
  }
})

// Forgot Password - Step 2: Verify code
authRoutes.post('/api/auth/verify-reset-code', async (c) => {
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
authRoutes.post('/api/auth/reset-password', async (c) => {
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
