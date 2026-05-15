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

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
    }),
  })

  const raw = await res.text()
  if (!res.ok) {
    let err = raw.slice(0, 500)
    try {
      const j = JSON.parse(raw) as { message?: string; name?: string }
      if (j.message) err = j.message
      else if (j.name) err = j.name
    } catch {
      /* keep raw */
    }
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
