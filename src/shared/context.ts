import type { UserInfo } from '../perf-helpers.ts'

export type Bindings = {
  DB: D1Database;
  ATTACHMENTS: R2Bucket;
  /** Resend API key — set with `wrangler secret put RESEND_API_KEY` */
  RESEND_API_KEY?: string;
  /** Verified sender, e.g. `Tamweel <noreply@yourdomain.com>` (Worker var or secret) */
  EMAIL_FROM?: string;
  /**
   * Shared secret for companion cron Worker (`wrangler.cron.toml`).
   * Pages: `wrangler pages secret put CRON_SECRET --project-name tamweel-calc-prod`
   * Cron Worker: `wrangler secret put CRON_SECRET -c wrangler.cron.toml`
   */
  CRON_SECRET?: string;
  /** When "1"/"true", enable verbose auth logs */
  DEBUG_AUTH?: string;
  /** When "1"/"true", emit [perf] timing logs */
  PERF_DEBUG?: string;
  /** When "1"/"true", inline Tailwind CSS into HTML (legacy fallback) */
  INLINE_TAILWIND?: string;
}

export type Variables = {
  tenant: any;
  tenantId: number | null;
  userInfo?: UserInfo;
}

export type AppEnv = { Bindings: Bindings; Variables: Variables }
