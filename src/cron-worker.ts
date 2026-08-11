/**
 * Companion cron Worker for Cloudflare Pages.
 * Pages Functions do not run [triggers].crons — this Worker fires daily and POSTs
 * the Pages app trigger endpoints with CRON_SECRET.
 *
 * Deploy: npx wrangler deploy -c wrangler.cron.toml
 * Secrets (same value on Pages + this Worker):
 *   npx wrangler pages secret put CRON_SECRET --project-name tamweel-calc-prod
 *   npx wrangler secret put CRON_SECRET -c wrangler.cron.toml
 */

export interface CronEnv {
  CRON_SECRET: string
  /** Origin of the Pages app, e.g. https://tamweel-calc.com */
  PAGES_BASE_URL: string
}

async function postTrigger(env: CronEnv, path: string): Promise<{ ok: boolean; status: number; body: string }> {
  const base = String(env.PAGES_BASE_URL || '').replace(/\/$/, '')
  const url = `${base}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      'Content-Type': 'application/json',
    },
  })
  const body = await res.text()
  return { ok: res.ok, status: res.status, body }
}

async function runScheduledJobs(env: CronEnv): Promise<void> {
  if (!env.CRON_SECRET) {
    console.error('[tamweel-cron] CRON_SECRET is not set')
    return
  }
  if (!env.PAGES_BASE_URL) {
    console.error('[tamweel-cron] PAGES_BASE_URL is not set')
    return
  }

  // Drain no-response backlog: each Pages call transfers at most 200 rows.
  const maxBatches = 10
  let totalTransferred = 0
  let totalSkipped = 0
  for (let i = 0; i < maxBatches; i++) {
    const r = await postTrigger(env, '/api/followup-no-response/trigger')
    if (!r.ok) {
      console.error(`[tamweel-cron] no-response trigger failed status=${r.status} body=${r.body.slice(0, 500)}`)
      break
    }
    let transferred = 0
    let skipped = 0
    try {
      const json = JSON.parse(r.body) as { transferred?: number; skipped?: number }
      transferred = Number(json.transferred) || 0
      skipped = Number(json.skipped) || 0
    } catch {
      /* ignore parse errors; still count as a completed call */
    }
    totalTransferred += transferred
    totalSkipped += skipped
    if (transferred < 200) break
  }
  console.log(`[tamweel-cron] no-response-transfers transferred=${totalTransferred} skipped=${totalSkipped}`)

  const reminders = await postTrigger(env, '/api/customer-reminders/trigger')
  if (!reminders.ok) {
    console.error(`[tamweel-cron] reminders trigger failed status=${reminders.status} body=${reminders.body.slice(0, 500)}`)
  } else {
    console.log(`[tamweel-cron] customer-reminders ok body=${reminders.body.slice(0, 500)}`)
  }
}

export default {
  fetch(): Response {
    return new Response(
      'tamweel-cron: HTTP is unused; this Worker only runs on Cron Triggers. Deploy with wrangler.cron.toml.',
      { status: 404 },
    )
  },

  async scheduled(_event: ScheduledEvent, env: CronEnv, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledJobs(env))
  },
}
