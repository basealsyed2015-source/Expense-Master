const RESEND_API = 'https://api.resend.com/emails'

export async function sendPasswordResetCodeEmail(params: {
  apiKey: string
  from: string
  to: string
  code: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { apiKey, from, to, code } = params
  const subject = 'رمز إعادة تعيين كلمة السر — Password reset code'
  const text = [
    'رمز التحقق لإعادة تعيين كلمة السر:',
    code,
    '',
    'صلاحية الرمز 15 دقيقة. إذا لم تطلب هذا الطلب، تجاهل الرسالة.',
    '',
    'Your password reset verification code:',
    code,
    '',
    'This code expires in 15 minutes. If you did not request a reset, ignore this email.',
  ].join('\n')

  const html = `
  <div dir="rtl" style="font-family:system-ui,sans-serif;max-width:480px;line-height:1.6">
    <p><strong>رمز التحقق</strong> لإعادة تعيين كلمة السر:</p>
    <p style="font-size:28px;letter-spacing:0.2em;font-weight:bold">${escapeHtml(code)}</p>
    <p style="color:#555">صلاحية الرمز <strong>15 دقيقة</strong>. إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <p dir="ltr"><strong>Verification code</strong> for password reset:</p>
    <p dir="ltr" style="font-size:28px;letter-spacing:0.2em;font-weight:bold">${escapeHtml(code)}</p>
    <p dir="ltr" style="color:#555">Valid for <strong>15 minutes</strong>. If you did not request this, ignore this email.</p>
  </div>`

  return sendEmail({ apiKey, from, to, subject, text, html })
}

export async function sendLoginOtpEmail(params: {
  apiKey: string
  from: string
  to: string
  code: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { apiKey, from, to, code } = params
  const subject = 'رمز تسجيل الدخول — Login verification code'
  const text = [
    'رمز التحقق لتسجيل الدخول من موقع جديد:',
    code,
    '',
    'صلاحية الرمز 10 دقائق. إذا لم تكن أنت من طلب ذلك، تواصل مع المسؤول فوراً.',
    '',
    'Your login verification code for a new location:',
    code,
    '',
    'This code expires in 10 minutes. If you did not attempt to log in, contact your admin immediately.',
  ].join('\n')
  const html = `
  <div dir="rtl" style="font-family:system-ui,sans-serif;max-width:480px;line-height:1.6">
    <p><strong>رمز التحقق</strong> لتسجيل الدخول من موقع جديد:</p>
    <p style="font-size:28px;letter-spacing:0.2em;font-weight:bold">${escapeHtml(code)}</p>
    <p style="color:#555">صلاحية الرمز <strong>10 دقائق</strong>. إذا لم تطلب ذلك، تواصل مع المسؤول فوراً.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <p dir="ltr"><strong>Login verification code</strong> for a new location:</p>
    <p dir="ltr" style="font-size:28px;letter-spacing:0.2em;font-weight:bold">${escapeHtml(code)}</p>
    <p dir="ltr" style="color:#555">Valid for <strong>10 minutes</strong>. If you did not attempt to log in, contact your admin immediately.</p>
  </div>`
  return sendEmail({ apiKey, from, to, subject, text, html })
}

export async function sendDeviceOtpEmail(params: {
  apiKey: string
  from: string
  to: string
  code: string
  username: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { apiKey, from, to, code, username } = params
  const subject = 'طلب تسجيل دخول من جهاز جديد — New device login request'
  const text = [
    `يحاول المستخدم "${username}" تسجيل الدخول من جهاز جديد.`,
    'رمز التحقق:',
    code,
    '',
    'صلاحية الرمز 10 دقائق. أرسل هذا الرمز للمستخدم فقط إذا كنت تتوقع هذا الطلب.',
    '',
    `User "${username}" is attempting to log in from a new device.`,
    'Verification code:',
    code,
    '',
    'This code expires in 10 minutes. Only share it with the user if you expect this request.',
  ].join('\n')
  const html = `
  <div dir="rtl" style="font-family:system-ui,sans-serif;max-width:480px;line-height:1.6">
    <p>يحاول المستخدم <strong>${escapeHtml(username)}</strong> تسجيل الدخول من <strong>جهاز جديد</strong>.</p>
    <p><strong>رمز التحقق:</strong></p>
    <p style="font-size:28px;letter-spacing:0.2em;font-weight:bold">${escapeHtml(code)}</p>
    <p style="color:#555">صلاحية الرمز <strong>10 دقائق</strong>. أرسل هذا الرمز للمستخدم فقط إذا كنت تتوقع هذا الطلب.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <p dir="ltr">User <strong>${escapeHtml(username)}</strong> is attempting to log in from a <strong>new device</strong>.</p>
    <p dir="ltr"><strong>Verification code:</strong></p>
    <p dir="ltr" style="font-size:28px;letter-spacing:0.2em;font-weight:bold">${escapeHtml(code)}</p>
    <p dir="ltr" style="color:#555">Valid for <strong>10 minutes</strong>. Only share it with the user if you expect this request.</p>
  </div>`
  return sendEmail({ apiKey, from, to, subject, text, html })
}

async function sendEmail(params: {
  apiKey: string
  from: string
  to: string
  subject: string
  text: string
  html: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { apiKey, from, to, subject, text, html } = params
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  })
  const raw = await res.text()
  if (!res.ok) {
    let err = raw.slice(0, 500)
    try {
      const j = JSON.parse(raw) as { message?: string; name?: string }
      if (j.message) err = j.message
      else if (j.name) err = j.name
    } catch { /* keep raw */ }
    return { ok: false, error: err }
  }
  return { ok: true }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
