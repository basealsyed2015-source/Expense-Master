import { Hono } from 'hono'
import { normalizeRoleId } from '../notification-access.ts'
import { sendPasswordResetCodeEmail, sendLoginOtpEmail, sendDeviceOtpEmail } from '../resend-email.ts'
import { getRoleDisplayName } from '../shared/role-display.ts'
import { clientIp, clientCity, parseCookie, isIpAllowed } from '../shared/login-ip.ts'
import type { AppEnv } from '../shared/context.ts'

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
             t.id as actual_tenant_id, t.company_name as tenant_name, t.slug as tenant_slug,
             t.login_ip_restriction_enabled, t.login_device_restriction_enabled,
             t.home_city, t.contact_email
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

    // --- Security checks (role 1 bypasses all) ---
    const normalizedRole = normalizeRoleId(user.role_id)
    const tenantId = user.tenant_id as number | null
    const userId = user.id as number
    const ipRestricted = user.login_ip_restriction_enabled === 1
    const deviceRestricted = user.login_device_restriction_enabled === 1
    const homeCity = user.home_city as string | null
    const contactEmail = user.contact_email as string | null

    let autoRegisteredDeviceToken: string | null = null

    if (normalizedRole !== 1 && tenantId && (ipRestricted || deviceRestricted)) {
      const ip = clientIp(c)
      if (!ip) {
        return c.json({ success: false, error: 'لا يمكن تحديد عنوان IP' }, 403)
      }

      const apiKey = c.env.RESEND_API_KEY?.trim()
      const from = (c.env.EMAIL_FROM?.trim() || 'Tamweel <onboarding@resend.dev>').trim()

      // Geo log helper — written when city differs from home_city
      const maybeLogGeo = async (otpVerified: 0 | 1) => {
        if (!homeCity) return
        const city = clientCity(c)
        if (!city || city.toLowerCase() === homeCity.toLowerCase()) return
        await c.env.DB.prepare(`
          INSERT INTO tenant_login_geo_log (user_id, tenant_id, ip, country, city, otp_verified)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(userId, tenantId, ip, (c.req.raw as any).cf?.country ?? null, city, otpVerified).run()
      }

      // --- DEVICE CHECK (only when login_device_restriction_enabled = 1) ---
      if (deviceRestricted) {
        const deviceToken = parseCookie(c.req.header('Cookie') ?? null, 'deviceToken')
        let deviceKnown = false
        if (deviceToken) {
          const row = await c.env.DB.prepare(
            'SELECT 1 FROM user_login_devices WHERE user_id = ? AND token = ?'
          ).bind(userId, deviceToken).first()
          deviceKnown = !!row
        }

        if (!deviceKnown) {
          // Check if this user has any registered devices at all
          const deviceCount = await c.env.DB.prepare(
            'SELECT COUNT(*) as cnt FROM user_login_devices WHERE user_id = ?'
          ).bind(userId).first<{ cnt: number }>()
          const hasDevices = (deviceCount?.cnt ?? 0) > 0

          if (!hasDevices) {
            // First-ever login for this user — auto-register this device, no OTP needed
            autoRegisteredDeviceToken = crypto.randomUUID()
            await c.env.DB.prepare('INSERT INTO user_login_devices (user_id, token) VALUES (?, ?)')
              .bind(userId, autoRegisteredDeviceToken).run()
          } else if (contactEmail && apiKey) {
            // User has known devices but this one isn't recognized — require OTP
            const code = Math.floor(100000 + Math.random() * 900000).toString()
            const inserted = await c.env.DB.prepare(`
              INSERT INTO tenant_login_otps (user_id, code, ip, otp_type, expires_at)
              VALUES (?, ?, ?, 'device', datetime('now', '+10 minutes'))
              RETURNING id
            `).bind(userId, code, ip).first<{ id: number }>()
            await maybeLogGeo(0)
            const sent = await sendDeviceOtpEmail({
              apiKey, from, to: contactEmail, code, username: String(user.username),
            })
            if (!sent.ok) {
              console.error('Device OTP email error:', sent.error)
              if (inserted?.id) {
                await c.env.DB.prepare('DELETE FROM tenant_login_otps WHERE id = ?').bind(inserted.id).run()
              }
              return c.json({
                success: false,
                error: 'تعذر إرسال رمز التحقق إلى بريد الشركة. تواصل مع المسؤول.',
              }, 502)
            }
            return c.json({ success: false, status: 'device_otp_required' })
          }
          // No contact_email (and has devices) — treat as trusted, fall through to IP check
        }
      }

      // --- IP CHECK (only when login_ip_restriction_enabled = 1) ---
      if (ipRestricted) {
        const allowed = await isIpAllowed(ip, tenantId, userId, c.env.DB)
        if (!allowed) {
          const userEmail = String(user.email ?? '').trim()
          if (userEmail && apiKey) {
            const code = Math.floor(100000 + Math.random() * 900000).toString()
            const inserted = await c.env.DB.prepare(`
              INSERT INTO tenant_login_otps (user_id, code, ip, otp_type, expires_at)
              VALUES (?, ?, ?, 'ip', datetime('now', '+10 minutes'))
              RETURNING id
            `).bind(userId, code, ip).first<{ id: number }>()
            await maybeLogGeo(0)
            const sent = await sendLoginOtpEmail({ apiKey, from, to: userEmail, code })
            if (!sent.ok) {
              console.error('IP OTP email error:', sent.error)
              if (inserted?.id) {
                await c.env.DB.prepare('DELETE FROM tenant_login_otps WHERE id = ?').bind(inserted.id).run()
              }
              return c.json({
                success: false,
                error: 'تعذر إرسال رمز التحقق إلى بريدك الإلكتروني. تواصل مع المسؤول.',
              }, 502)
            }
            return c.json({ success: false, status: 'ip_otp_required' })
          }
          // No user email — fail closed
          return c.json({ success: false, error: 'غير مسموح بتسجيل الدخول من هذا الموقع' }, 403)
        }
      }

      // All enabled checks passed — log geo if out-of-city
      await maybeLogGeo(1)
    }

    // --- Complete login ---
    if (!c.env?.DB) {
      console.error('❌ [LOGIN] DB binding lost after security checks')
    } else {
      const loginTimestamp = new Date().toISOString()
      await c.env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?')
        .bind(loginTimestamp, userId).run()
    }

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

    const tokenData = `${userId}:${tenantForAuthToken ?? 'null'}:${user.role_id}:${Date.now()}`
    const token = btoa(tokenData)
    const cookieMaxAge = 7 * 24 * 60 * 60

    const response = c.json({
      success: true,
      token,
      redirect: '/admin/panel',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        role_name: getRoleDisplayName(user.role_id, user.role_name),
        role_description: user.role_description,
        company_name: user.subscription_company_name || user.tenant_name,
        subscription_id: user.subscription_id,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        tenant_slug: user.tenant_slug,
        assigned_bank_id: (user as { assigned_bank_id?: number | null }).assigned_bank_id ?? null,
      },
    })
    response.headers.set(
      'Set-Cookie',
      `authToken=${token}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Secure`
    )
    if (autoRegisteredDeviceToken) {
      const deviceMaxAge = 365 * 24 * 60 * 60
      response.headers.append(
        'Set-Cookie',
        `deviceToken=${autoRegisteredDeviceToken}; Path=/; Max-Age=${deviceMaxAge}; SameSite=Lax; Secure; HttpOnly`
      )
    }
    return response
  } catch (error: any) {
    const errorDump = {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack || 'No stack trace',
      error: error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause,
        toString: error.toString(),
        ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
          try { acc[key] = String(error[key]) } catch { acc[key] = '[Cannot serialize]' }
          return acc
        }, {} as any),
      } : null,
      DB_available: !!c.env?.DB,
      env_keys: Object.keys(c.env || {}),
      env_DB_type: typeof c.env?.DB,
      request_url: c.req.url,
      request_method: c.req.method,
      request_headers: Object.fromEntries(c.req.raw.headers.entries()),
      error_stringified: (() => {
        try { return JSON.stringify(error, Object.getOwnPropertyNames(error), 2) }
        catch (e) { return `Failed to stringify: ${e}` }
      })(),
    }
    console.error('❌ [LOGIN] FULL ERROR DUMP:', errorDump)
    return c.json({ success: false, error: 'حدث خطأ في تسجيل الدخول', dd: errorDump }, 500)
  }
})

// Complete login after OTP verification (device OTP or IP OTP).
authRoutes.post('/api/auth/verify-otp', async (c) => {
  try {
    if (!c.env?.DB) return c.json({ success: false, error: 'Database not available' }, 500)
    const { username, code, otp_type } = await c.req.json()
    if (!username || !code || !otp_type) {
      return c.json({ success: false, error: 'بيانات غير مكتملة' }, 400)
    }
    if (otp_type !== 'device' && otp_type !== 'ip') {
      return c.json({ success: false, error: 'نوع رمز غير صالح' }, 400)
    }

    const user = await c.env.DB.prepare(`
      SELECT u.id, u.username, u.full_name, u.email, u.phone,
             u.role_id, u.subscription_id, u.tenant_id, u.assigned_bank_id,
             r.role_name, r.description as role_description,
             s.company_name as subscription_company_name,
             t.company_name as tenant_name, t.slug as tenant_slug,
             t.home_city
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN subscriptions s ON u.subscription_id = s.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.username = ? AND u.is_active = 1
    `).bind(username).first()

    if (!user) return c.json({ success: false, error: 'المستخدم غير موجود' }, 404)

    const userId = user.id as number

    const otp = await c.env.DB.prepare(`
      SELECT id, code, ip FROM tenant_login_otps
      WHERE user_id = ? AND otp_type = ? AND is_used = 0 AND expires_at > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `).bind(userId, otp_type).first<{ id: number; code: string; ip: string }>()

    if (!otp) {
      return c.json({ success: false, error: 'رمز التحقق غير صالح أو منتهي الصلاحية' }, 400)
    }
    if (otp.code !== String(code).trim()) {
      return c.json({ success: false, error: 'رمز التحقق غير صحيح' }, 400)
    }

    // Mark OTP used
    await c.env.DB.prepare('UPDATE tenant_login_otps SET is_used = 1 WHERE id = ?')
      .bind(otp.id).run()

    const ip = otp.ip
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Whitelist this IP for 7 days (both device OTP and IP OTP do this)
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO user_login_allowed_ips (user_id, ip, expires_at, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(userId, ip, expiresAt).run()

    // Update geo log to mark as verified
    const tenantId = user.tenant_id as number | null
    if (tenantId) {
      await c.env.DB.prepare(`
        UPDATE tenant_login_geo_log
        SET otp_verified = 1
        WHERE user_id = ? AND ip = ? AND otp_verified = 0
      `).bind(userId, ip).run()
    }

    // Extra step for device OTP: replace all previous device records with the new one (1 active device per user)
    let newDeviceToken: string | null = null
    if (otp_type === 'device') {
      newDeviceToken = crypto.randomUUID()
      await c.env.DB.prepare('DELETE FROM user_login_devices WHERE user_id = ?').bind(userId).run()
      await c.env.DB.prepare('INSERT INTO user_login_devices (user_id, token) VALUES (?, ?)')
        .bind(userId, newDeviceToken).run()
    }

    // Complete login: update last_login, build token, set cookies
    const loginTimestamp = new Date().toISOString()
    await c.env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?')
      .bind(loginTimestamp, userId).run()

    const normalizedRole = normalizeRoleId(user.role_id)
    let tenantForAuthToken: number | null = user.tenant_id != null ? Number(user.tenant_id) : null
    const assignedBankId = (user as { assigned_bank_id?: number | null }).assigned_bank_id
    const bankIdNum =
      assignedBankId != null && !Number.isNaN(Number(assignedBankId)) ? Number(assignedBankId) : null
    if (tenantForAuthToken == null && (normalizedRole === 5 || normalizedRole === 6) && bankIdNum != null) {
      try {
        const br = await c.env.DB.prepare('SELECT tenant_id FROM banks WHERE id = ? LIMIT 1')
          .bind(bankIdNum).first<{ tenant_id: number | null }>()
        if (br?.tenant_id != null) tenantForAuthToken = Number(br.tenant_id)
      } catch (_) { /* keep null */ }
    }

    const tokenData = `${userId}:${tenantForAuthToken ?? 'null'}:${user.role_id}:${Date.now()}`
    const token = btoa(tokenData)
    const authMaxAge = 7 * 24 * 60 * 60
    const deviceMaxAge = 365 * 24 * 60 * 60

    const response = c.json({
      success: true,
      token,
      redirect: '/admin/panel',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        role_name: getRoleDisplayName(user.role_id, user.role_name),
        role_description: user.role_description,
        company_name: user.subscription_company_name || user.tenant_name,
        subscription_id: user.subscription_id,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        tenant_slug: user.tenant_slug,
        assigned_bank_id: assignedBankId ?? null,
      },
    })
    response.headers.append(
      'Set-Cookie',
      `authToken=${token}; Path=/; Max-Age=${authMaxAge}; SameSite=Lax; Secure`
    )
    if (newDeviceToken) {
      response.headers.append(
        'Set-Cookie',
        `deviceToken=${newDeviceToken}; Path=/; Max-Age=${deviceMaxAge}; SameSite=Lax; Secure; HttpOnly`
      )
    }
    return response
  } catch (error: any) {
    console.error('verify-otp error:', error)
    return c.json({ success: false, error: 'حدث خطأ. الرجاء المحاولة مرة أخرى.' }, 500)
  }
})

// Logout API (clears auth cookie)
authRoutes.post('/api/auth/logout', async (c) => {
  const expiredSecure = 'authToken=; Path=/; Max-Age=0; SameSite=Lax; Secure'
  const expiredInsecure = 'authToken=; Path=/; Max-Age=0; SameSite=Lax'

  const res = c.json({ success: true })
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

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

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

    return c.json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return c.json({ success: false, message: 'حدث خطأ. الرجاء المحاولة مرة أخرى.' }, 500)
  }
})

// Forgot Password - Step 2: Verify code
authRoutes.post('/api/auth/verify-reset-code', async (c) => {
  try {
    const { email, code } = await c.req.json()

    const user = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ? OR username = ?
    `).bind(email, email).first()

    if (!user) {
      return c.json({ success: false, message: 'المستخدم غير موجود' }, 404)
    }

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

    if (new Date(verification.expires_at as string) < new Date()) {
      return c.json({ success: false, message: 'انتهت صلاحية رمز التحقق. الرجاء طلب رمز جديد.' }, 400)
    }

    if (verification.verification_code !== code) {
      return c.json({ success: false, message: 'رمز التحقق غير صحيح' }, 400)
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)

    return c.json({ success: true, message: 'تم التحقق بنجاح', token })
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

    const user = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ? OR username = ?
    `).bind(email, email).first()

    if (!user) {
      return c.json({ success: false, message: 'المستخدم غير موجود' }, 404)
    }

    await c.env.DB.prepare(`
      UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(newPassword, user.id).run()

    await c.env.DB.prepare(`
      UPDATE password_change_notifications SET is_used = 1 WHERE user_id = ? AND is_used = 0
    `).bind(user.id).run()

    return c.json({ success: true, message: 'تم تغيير كلمة السر بنجاح' })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return c.json({ success: false, message: 'حدث خطأ. الرجاء المحاولة مرة أخرى.' }, 500)
  }
})
