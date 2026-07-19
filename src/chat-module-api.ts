/**
 * Company chat module: tenant-scoped 1:1 chat + admin broadcasts channel.
 * - D1 is the durable source of truth (tables in migrations 0078, 0082)
 * - R2 (ATTACHMENTS) holds uploaded files under chat/{tenantId}/{conversationId}/{messageId}/*
 * - CHAT_ROOMS DO fans out live events per conversation
 * - BROADCAST_ROOMS DO fans out broadcast events per tenant
 */

import type { Hono } from 'hono'
import { canUserAccessCustomer, isRole5InCustomerScope, normalizeRoleId } from './notification-access.ts'

type Env = {
  DB: D1Database
  ATTACHMENTS: R2Bucket
  CHAT_ROOMS: DurableObjectNamespace
  USER_NOTIFICATIONS: DurableObjectNamespace
  BROADCAST_ROOMS: DurableObjectNamespace
}

const ADMIN_ROLE_ID = 2

/** Set true to let role 2 inspect other users' 1:1 threads (admin drill-down). */
export const CHAT_ADMIN_DRILLDOWN_ENABLED = false

type UserInfo = {
  userId: number | null
  tenantId: number | null
  roleId: number | null
}

type GetUserInfo = (c: any) => Promise<UserInfo & Record<string, any>>

const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument', 'text/plain']
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10 MB

function orderedPair(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a]
}

function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))
}

/** Browsers sometimes send an empty Content-Type; infer from extension. */
function inferMime(file: File): string {
  if (file.type) return file.type
  const name = (file.name || '').toLowerCase()
  if (/\.(jpe?g)$/.test(name)) return 'image/jpeg'
  if (/\.png$/.test(name)) return 'image/png'
  if (/\.gif$/.test(name)) return 'image/gif'
  if (/\.webp$/.test(name)) return 'image/webp'
  if (/\.heic$/.test(name)) return 'image/heic'
  if (/\.heif$/.test(name)) return 'image/heif'
  if (/\.pdf$/.test(name)) return 'application/pdf'
  if (/\.txt$/.test(name)) return 'text/plain'
  if (/\.docx$/.test(name)) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (/\.doc$/.test(name)) return 'application/msword'
  return 'application/octet-stream'
}

async function ensureConversationAccess(
  db: D1Database,
  conversationId: number,
  userId: number,
  tenantId: number
): Promise<{ id: number; tenant_id: number; participant_one_id: number; participant_two_id: number } | null> {
  const row = await db
    .prepare(
      `SELECT id, tenant_id, participant_one_id, participant_two_id
       FROM chat_conversations WHERE id = ? LIMIT 1`
    )
    .bind(conversationId)
    .first<{ id: number; tenant_id: number; participant_one_id: number; participant_two_id: number }>()
  if (!row) return null
  if (row.tenant_id !== tenantId) return null
  if (row.participant_one_id !== userId && row.participant_two_id !== userId) return null
  return row
}

/** Like ensureConversationAccess but role 2 (admin) may read any same-tenant conversation. */
async function ensureConversationReadAccess(
  db: D1Database,
  conversationId: number,
  userId: number,
  tenantId: number,
  roleId: number | null
): Promise<{ id: number; tenant_id: number; participant_one_id: number; participant_two_id: number } | null> {
  const row = await db
    .prepare(
      `SELECT id, tenant_id, participant_one_id, participant_two_id
       FROM chat_conversations WHERE id = ? LIMIT 1`
    )
    .bind(conversationId)
    .first<{ id: number; tenant_id: number; participant_one_id: number; participant_two_id: number }>()
  if (!row) return null
  if (row.tenant_id !== tenantId) return null
  if (CHAT_ADMIN_DRILLDOWN_ENABLED && roleId === ADMIN_ROLE_ID) return row
  if (row.participant_one_id !== userId && row.participant_two_id !== userId) return null
  return row
}

type TagRow = { message_id: number; customer_id: number; display_name: string | null }
type MessageTag = { customer_id: number; display_name: string | null }

/** Tags as returned to the current viewer (no customer_id when not linkable). */
export type MessageTagView = {
  display_name: string | null
  can_link: boolean
  customer_id?: number
}

async function loadTagsForMessages(db: D1Database, messageIds: number[]): Promise<Map<number, MessageTag[]>> {
  const map = new Map<number, MessageTag[]>()
  if (!messageIds.length) return map
  try {
    const placeholders = messageIds.map(() => '?').join(',')
    const rows = await db
      .prepare(
        `SELECT message_id, customer_id, display_name FROM chat_message_customer_tags
         WHERE message_id IN (${placeholders})`
      )
      .bind(...messageIds)
      .all<TagRow>()
    for (const r of rows.results || []) {
      const arr = map.get(r.message_id) || []
      arr.push({ customer_id: r.customer_id, display_name: r.display_name })
      map.set(r.message_id, arr)
    }
  } catch (e) {
    console.error('[chat] loadTagsForMessages failed (migration 0083 applied?)', e)
  }
  return map
}

/** Broadcast tables (0082) are optional until migration is applied on D1. */
async function getBroadcastUnreadCount(db: D1Database, tenantId: number, userId: number): Promise<number> {
  try {
    const broadcastReads = await db
      .prepare(`SELECT last_read_broadcast_id FROM chat_broadcast_reads WHERE user_id = ?`)
      .bind(userId)
      .first<{ last_read_broadcast_id: number }>()
    const lastReadBroadcastId = broadcastReads?.last_read_broadcast_id ?? 0
    const broadcastUnreadRow = await db
      .prepare(`SELECT COUNT(*) AS n FROM chat_broadcasts WHERE tenant_id = ? AND id > ? AND deleted_at IS NULL`)
      .bind(tenantId, lastReadBroadcastId)
      .first<{ n: number }>()
    return Number(broadcastUnreadRow?.n || 0)
  } catch (e) {
    console.error('[chat] getBroadcastUnreadCount failed (migration 0082 applied?)', e)
    return 0
  }
}

/**
 * Whether this viewer may link to a customer profile from chat tags.
 * Matches @-picker scope for roles 4/5 (includes archived/completed assignments).
 */
async function canLinkCustomerInChat(
  db: D1Database,
  userInfo: { userId: number; tenantId: number; roleId: number | null },
  customer: { id: number; tenant_id: number | null }
): Promise<boolean> {
  const rid = normalizeRoleId(userInfo.roleId)
  if (!rid || !userInfo.userId) return false
  if (rid === 1) return true
  if (customer.tenant_id == null || customer.tenant_id !== userInfo.tenantId) return false
  if (rid === 4) {
    const row = await db
      .prepare(
        `SELECT 1 AS ok FROM customer_assignments
         WHERE customer_id = ? AND employee_id = ? LIMIT 1`
      )
      .bind(customer.id, userInfo.userId)
      .first<{ ok: number }>()
    return Boolean(row?.ok)
  }
  if (rid === 5) {
    return isRole5InCustomerScope(db, userInfo.userId, customer.id, userInfo.tenantId)
  }
  if (rid === 2 || rid === 3) return true
  return canUserAccessCustomer(
    db,
    { userId: userInfo.userId, tenantId: userInfo.tenantId, roleId: userInfo.roleId },
    customer
  )
}

/** Per-viewer: link + customer_id only when the viewer may open that customer. */
async function enrichTagsForViewer(
  db: D1Database,
  userInfo: { userId: number; tenantId: number; roleId: number | null },
  tags: MessageTag[]
): Promise<MessageTagView[]> {
  if (!tags.length) return []
  return Promise.all(tags.map(async (t) => {
    const row = await db
      .prepare(`SELECT id, tenant_id FROM customers WHERE id = ? LIMIT 1`)
      .bind(t.customer_id)
      .first<{ id: number; tenant_id: number | null }>()
    const canLink = row ? await canLinkCustomerInChat(db, userInfo, row) : false
    const view: MessageTagView = { display_name: t.display_name, can_link: canLink }
    if (canLink) view.customer_id = t.customer_id
    return view
  }))
}

async function attachTagsToMessages<T extends { id: number }>(
  db: D1Database,
  userInfo: { userId: number; tenantId: number; roleId: number | null },
  messages: T[]
): Promise<Array<T & { tags: MessageTagView[] }>> {
  const ids = messages.map((m) => Number(m.id)).filter((n) => Number.isFinite(n))
  const tagsByMsg = await loadTagsForMessages(db, ids)
  if (tagsByMsg.size === 0) {
    return messages.map((m) => ({ ...m, tags: [] as MessageTagView[] }))
  }
  return Promise.all(messages.map(async (m) => {
    const raw = tagsByMsg.get(Number(m.id)) || []
    const tags = raw.length ? await enrichTagsForViewer(db, userInfo, raw) : []
    return { ...m, tags }
  }))
}

type HistoryRow = { id: number; sender_id: number; body: string | null; attachment_json: string | null; created_at: string; deleted_at: string | null; is_forwarded?: number; replied_to_message_id?: number | null }

/**
 * Fetch message rows including is_forwarded and replied_to_message_id.
 * Falls back gracefully when migrations 0084/0085 have not yet been applied.
 */
async function fetchMessageRows(
  db: D1Database,
  sqlWith: string,
  sqlWithout: string,
  bindings: unknown[]
): Promise<HistoryRow[]> {
  try {
    const rows = await db.prepare(sqlWith).bind(...bindings).all<HistoryRow>()
    return rows.results || []
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || e || '')
    if (/(?:no such column|has no column named).*(is_forwarded|replied_to_message_id)/i.test(msg)) {
      console.warn('[chat] column missing — apply migrations 0084/0085')
      const rows = await db.prepare(sqlWithout).bind(...bindings).all<HistoryRow>()
      return rows.results || []
    }
    throw e
  }
}

type ReplyPreviewRow = { id: number; sender_id: number; body: string | null; attachment_json: string | null; deleted_at: string | null }

async function loadReplyPreviews(db: D1Database, replyIds: number[]): Promise<Map<number, ReplyPreviewRow>> {
  const map = new Map<number, ReplyPreviewRow>()
  if (!replyIds.length) return map
  try {
    const ph = replyIds.map(() => '?').join(',')
    const rows = await db.prepare(
      `SELECT id, sender_id, body, attachment_json, deleted_at FROM chat_messages WHERE id IN (${ph})`
    ).bind(...replyIds).all<ReplyPreviewRow>()
    for (const r of rows.results || []) map.set(Number(r.id), r)
  } catch (e) {
    console.error('[chat] loadReplyPreviews failed', e)
  }
  return map
}

/** Tags live rows normally; deleted rows get tombstoned (no body/attachment/tags). Attaches reply_preview for threaded replies. */
async function buildMessageHistory(
  db: D1Database,
  userInfo: { userId: number; tenantId: number; roleId: number | null },
  rows: HistoryRow[]
): Promise<any[]> {
  const live = rows.filter((r) => !r.deleted_at)
  const withTags = live.length ? await attachTagsToMessages(db, userInfo, live) : []
  const tagMap = new Map<number, any>(withTags.map((m) => [m.id, m]))

  const replyIds = rows
    .filter((r) => !r.deleted_at && r.replied_to_message_id)
    .map((r) => Number(r.replied_to_message_id))
    .filter((id) => Number.isFinite(id) && id > 0)
  const replyPreviews = replyIds.length ? await loadReplyPreviews(db, replyIds) : new Map<number, ReplyPreviewRow>()

  return rows.map((r) => {
    if (r.deleted_at) {
      return { id: r.id, sender_id: r.sender_id, body: null, attachment_json: null, created_at: r.created_at, deleted_at: r.deleted_at, tags: [] }
    }
    const msg = tagMap.get(r.id) || { ...r, tags: [] }
    if (r.replied_to_message_id) {
      const rp = replyPreviews.get(Number(r.replied_to_message_id))
      msg.reply_preview = rp
        ? { id: rp.id, sender_id: rp.sender_id, body: rp.deleted_at ? null : rp.body, attachment_json: rp.deleted_at ? null : rp.attachment_json, deleted_at: rp.deleted_at || null }
        : null
    }
    return msg
  })
}

/**
 * For each candidate customer id, drop ones the user is not allowed to access
 * Uses the same scope as the @-picker (canLinkCustomerInChat).
 * Also returns the display name from the DB at send time so we can snapshot it.
 */
async function filterTaggableCustomers(
  db: D1Database,
  userInfo: { userId: number; tenantId: number; roleId: number | null },
  customerIds: number[]
): Promise<Array<{ id: number; full_name: string | null }>> {
  const uniq = Array.from(new Set(customerIds.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)))
  if (!uniq.length) return []
  const placeholders = uniq.map(() => '?').join(',')
  const rows = await db
    .prepare(`SELECT id, tenant_id, full_name FROM customers WHERE id IN (${placeholders})`)
    .bind(...uniq)
    .all<{ id: number; tenant_id: number | null; full_name: string | null }>()
  const out: Array<{ id: number; full_name: string | null }> = []
  for (const r of rows.results || []) {
    const ok = await canLinkCustomerInChat(db, userInfo, { id: r.id, tenant_id: r.tenant_id })
    if (ok) out.push({ id: r.id, full_name: r.full_name })
  }
  return out
}

async function insertMessageTags(
  db: D1Database,
  messageId: number,
  tagged: Array<{ id: number; full_name: string | null }>
): Promise<MessageTag[]> {
  const out: MessageTag[] = []
  for (const t of tagged) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO chat_message_customer_tags (message_id, customer_id, display_name)
           VALUES (?, ?, ?)`
        )
        .bind(messageId, t.id, t.full_name)
        .run()
    } catch (e) {
      console.error('[chat] insertMessageTags failed (migration 0083 applied?)', e)
    }
    out.push({ customer_id: t.id, display_name: t.full_name })
  }
  return out
}

async function broadcastToRoom(env: Env, conversationId: number, event: unknown) {
  try {
    const id = env.CHAT_ROOMS.idFromName(`conv:${conversationId}`)
    const stub = env.CHAT_ROOMS.get(id)
    await stub.fetch('https://chat-room/broadcast', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch (e) {
    console.error('[chat] broadcast failed', e)
  }
}

async function pushUserNotification(env: Env, recipientUserId: number) {
  try {
    const id = env.USER_NOTIFICATIONS.idFromName(`user:${recipientUserId}`)
    const stub = env.USER_NOTIFICATIONS.get(id)
    await stub.fetch('https://user-notify/push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'unread_update' }),
    })
  } catch (e) {
    console.error('[chat] user notify push failed', e)
  }
}

async function broadcastToTenant(env: Env, tenantId: number, event: unknown) {
  try {
    const id = env.BROADCAST_ROOMS.idFromName(`broadcast:${tenantId}`)
    const stub = env.BROADCAST_ROOMS.get(id)
    await stub.fetch('https://broadcast-room/broadcast', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch (e) {
    console.error('[chat] tenant broadcast failed', e)
  }
}

async function pushBroadcastNotificationToTenant(env: Env, db: D1Database, tenantId: number) {
  try {
    const users = await db
      .prepare(`SELECT id FROM users WHERE tenant_id = ? AND (is_active IS NULL OR is_active = 1)`)
      .bind(tenantId)
      .all<{ id: number }>()
    await Promise.all((users.results || []).map((u) => pushUserNotification(env, u.id)))
  } catch (e) {
    console.error('[chat] broadcast notify all failed', e)
  }
}

function escapeLikePattern(q: string): { like: string; prefix: string } {
  const escaped = q.replace(/[\\%_]/g, (m) => '\\' + m)
  return { like: `%${escaped}%`, prefix: `${escaped}%` }
}

type ChatCustomerSearchRow = { id: number; tenant_id: number | null; full_name: string | null; phone: string | null }

/** Role 4/5/6: search only within assigned scope; include archived/completed customers. */
async function searchChatCustomersForUser(
  db: D1Database,
  info: UserInfo,
  q: string,
  limit: number
): Promise<Array<{ id: number; full_name: string | null; phone: string | null }>> {
  const rid = normalizeRoleId(info.roleId)
  const tenantId = info.tenantId!
  const userId = info.userId!
  const trimmed = q.trim()

  if (!trimmed && rid !== 4 && rid !== 5 && rid !== 6) return []

  const { like, prefix } = trimmed ? escapeLikePattern(trimmed) : { like: '', prefix: '' }
  const orderSql = trimmed
    ? `CASE WHEN c.full_name LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END, c.full_name ASC`
    : 'c.full_name ASC'
  const textFilter = trimmed
    ? ` AND (c.full_name LIKE ? ESCAPE '\\' OR c.phone LIKE ? ESCAPE '\\')`
    : ''

  const runScoped = async (scopeSql: string, scopeParams: unknown[]) => {
    const params: unknown[] = [...scopeParams]
    if (trimmed) params.push(like, like)
    if (trimmed) params.push(prefix)
    params.push(limit)
    const rows = await db
      .prepare(
        `SELECT c.id, c.tenant_id, c.full_name, c.phone FROM customers c
         WHERE ${scopeSql}${textFilter}
         ORDER BY ${orderSql}
         LIMIT ?`
      )
      .bind(...params)
      .all<ChatCustomerSearchRow>()
    return (rows.results || []).map((r) => ({ id: r.id, full_name: r.full_name, phone: r.phone }))
  }

  if (rid === 4) {
    return runScoped(
      `c.tenant_id = ? AND EXISTS (
         SELECT 1 FROM customer_assignments ca
         WHERE ca.customer_id = c.id AND ca.employee_id = ?
       )`,
      [tenantId, userId]
    )
  }

  if (rid === 5) {
    const scopeFull = `c.tenant_id = ? AND (
      NULLIF(c.created_by, 0) = ?
      OR NULLIF(c.assigned_bank_agent_id, 0) = ?
      OR EXISTS (
        SELECT 1 FROM financing_requests fr
        LEFT JOIN users fr_creator ON fr_creator.id = fr.created_by
        WHERE fr.customer_id = c.id
          AND (
            NULLIF(fr.assigned_bank_agent_id, 0) = ?
            OR (NULLIF(fr.created_by, 0) = ? AND fr_creator.role_id IN (5, 15))
          )
      )
    )`
    const scopeFallback = `c.tenant_id = ? AND (
      NULLIF(c.assigned_bank_agent_id, 0) = ?
      OR EXISTS (
        SELECT 1 FROM financing_requests fr
        LEFT JOIN users fr_creator ON fr_creator.id = fr.created_by
        WHERE fr.customer_id = c.id
          AND (
            NULLIF(fr.assigned_bank_agent_id, 0) = ?
            OR (NULLIF(fr.created_by, 0) = ? AND fr_creator.role_id IN (5, 15))
          )
      )
    )`
    try {
      return await runScoped(scopeFull, [tenantId, userId, userId, userId, userId])
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message || e || '')
      if (/no such column:\s*c\.created_by|no such column:\s*created_by/i.test(msg)) {
        return runScoped(scopeFallback, [tenantId, userId, userId, userId])
      }
      throw e
    }
  }

  if (rid === 6) {
    // Dual agent: union of role-4 (employee assignment) + role-5 (bank agent) scope.
    const scopeFull = `c.tenant_id = ? AND (
      EXISTS (
        SELECT 1 FROM customer_assignments ca
        WHERE ca.customer_id = c.id AND ca.employee_id = ?
      )
      OR NULLIF(c.created_by, 0) = ?
      OR NULLIF(c.assigned_bank_agent_id, 0) = ?
      OR EXISTS (
        SELECT 1 FROM financing_requests fr
        LEFT JOIN users fr_creator ON fr_creator.id = fr.created_by
        WHERE fr.customer_id = c.id
          AND (
            NULLIF(fr.assigned_bank_agent_id, 0) = ?
            OR (NULLIF(fr.created_by, 0) = ? AND fr_creator.role_id IN (5, 15))
          )
      )
    )`
    const scopeFallback = `c.tenant_id = ? AND (
      EXISTS (
        SELECT 1 FROM customer_assignments ca
        WHERE ca.customer_id = c.id AND ca.employee_id = ?
      )
      OR NULLIF(c.assigned_bank_agent_id, 0) = ?
      OR EXISTS (
        SELECT 1 FROM financing_requests fr
        LEFT JOIN users fr_creator ON fr_creator.id = fr.created_by
        WHERE fr.customer_id = c.id
          AND (
            NULLIF(fr.assigned_bank_agent_id, 0) = ?
            OR (NULLIF(fr.created_by, 0) = ? AND fr_creator.role_id IN (5, 15))
          )
      )
    )`
    try {
      return await runScoped(scopeFull, [tenantId, userId, userId, userId, userId, userId])
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message || e || '')
      if (/no such column:\s*c\.created_by|no such column:\s*created_by/i.test(msg)) {
        return runScoped(scopeFallback, [tenantId, userId, userId, userId, userId])
      }
      throw e
    }
  }

  if (!trimmed) return []

  const rows = await db
    .prepare(
      `SELECT id, tenant_id, full_name, phone FROM customers
       WHERE tenant_id = ?
         AND (full_name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\')
       ORDER BY
         CASE WHEN full_name LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END,
         full_name ASC
       LIMIT ?`
    )
    .bind(tenantId, like, like, prefix, limit * 3)
    .all<ChatCustomerSearchRow>()

  const out: Array<{ id: number; full_name: string | null; phone: string | null }> = []
  for (const r of rows.results || []) {
    if (out.length >= limit) break
    const ok = await canUserAccessCustomer(
      db,
      { userId: info.userId, tenantId: info.tenantId, roleId: info.roleId ?? null },
      { id: r.id, tenant_id: r.tenant_id }
    )
    if (ok) out.push({ id: r.id, full_name: r.full_name, phone: r.phone })
  }
  return out
}

export function registerChatModuleApi(app: Hono<any>, getUserInfo: GetUserInfo) {
  /** Full chat widget HTML fragment — loaded on first click of the lazy launcher. */
  app.get('/api/chat/widget-html', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId) return c.text('unauthorized', 401)
    const { renderChatWidget } = await import('./chat-widget')
    return c.html(renderChatWidget(info.userId, info.roleId ?? null), 200, {
      'Cache-Control': 'private, no-store',
    })
  })

  /**
   * Typeahead search for the @-mention picker. Server-side, returns a small
   * result set the user is allowed to tag (canUserAccessCustomer).
   * Role 4/5: scoped to assigned customers, including archived/completed.
   */
  app.get('/api/chat/customers/search', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const db = (c.env as Env).DB
    const q = String(c.req.query('q') || '')
    const limit = Math.min(Math.max(Number(c.req.query('limit') || 15), 1), 25)
    const customers = await searchChatCustomersForUser(db, info, q, limit)
    return c.json({ success: true, customers })
  })

  /** List users in same tenant available for direct chat. */
  app.get('/api/chat/users', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const db = (c.env as Env).DB
    const rows = await db
      .prepare(
        `SELECT id, full_name AS name, email, role_id FROM users
         WHERE tenant_id = ? AND id != ? AND (is_active IS NULL OR is_active = 1)
         ORDER BY name ASC`
      )
      .bind(info.tenantId, info.userId)
      .all()
    return c.json({ success: true, users: rows.results || [] })
  })

  /** List current user's conversations with last message + unread count. */
  app.get('/api/chat/conversations', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const db = (c.env as Env).DB
    const userId = info.userId
    const tenantId = info.tenantId

    try {
    const convs = await db
      .prepare(
        `SELECT c.id, c.participant_one_id, c.participant_two_id, c.last_message_at,
                c.last_message_id,
                CASE WHEN c.participant_one_id = ? THEN c.participant_two_id ELSE c.participant_one_id END AS other_id
         FROM chat_conversations c
         WHERE c.tenant_id = ?
           AND (c.participant_one_id = ? OR c.participant_two_id = ?)
         ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`
      )
      .bind(userId, tenantId, userId, userId)
      .all<{ id: number; other_id: number; last_message_id: number | null; last_message_at: string | null }>()

    const results = convs.results || []
    const broadcastUnreadCount = await getBroadcastUnreadCount(db, tenantId, userId)

    if (results.length === 0) return c.json({ success: true, conversations: [], broadcast_unread_count: broadcastUnreadCount })

    const otherIds = Array.from(new Set(results.map((r) => r.other_id)))
    const placeholders = otherIds.map(() => '?').join(',')
    const users = await db
      .prepare(`SELECT id, full_name AS name, email, role_id FROM users WHERE id IN (${placeholders})`)
      .bind(...otherIds)
      .all<{ id: number; name: string; email: string; role_id: number }>()
    const userMap = new Map<number, any>()
    ;(users.results || []).forEach((u) => userMap.set(u.id, u))

    const convIds = results.map((r) => r.id)
    const convPh = convIds.map(() => '?').join(',')

    const lastMsgIds = results
      .map((r) => r.last_message_id)
      .filter((id): id is number => id != null && Number(id) > 0)

    const [lastMsgRows, unreadResult] = await Promise.all([
      lastMsgIds.length
        ? db
            .prepare(
              `SELECT id, sender_id, body, attachment_json, created_at, deleted_at
               FROM chat_messages WHERE id IN (${lastMsgIds.map(() => '?').join(',')})`
            )
            .bind(...lastMsgIds)
            .all<{ id: number; sender_id: number; body: string | null; attachment_json: string | null; created_at: string; deleted_at: string | null }>()
        : Promise.resolve({ results: [] as any[] }),
      db
        .prepare(
          `SELECT cm.conversation_id, COUNT(*) AS n
           FROM chat_messages cm
           LEFT JOIN chat_message_reads cmr
             ON cmr.conversation_id = cm.conversation_id AND cmr.user_id = ?
           WHERE cm.conversation_id IN (${convPh})
             AND cm.sender_id != ?
             AND cm.deleted_at IS NULL
             AND cm.id > COALESCE(cmr.last_read_message_id, 0)
           GROUP BY cm.conversation_id`
        )
        .bind(userId, ...convIds, userId)
        .all<{ conversation_id: number; n: number }>(),
    ])

    const lastMsgs = new Map<number, any>()
    for (const m of lastMsgRows.results || []) lastMsgs.set(Number(m.id), m)
    const unreadMap = new Map<number, number>()
    for (const r of unreadResult.results || []) unreadMap.set(Number(r.conversation_id), Number(r.n))

    const out = results.map((row) => {
      const lm = row.last_message_id ? lastMsgs.get(Number(row.last_message_id)) : null
      const lastMsgView = lm
        ? lm.deleted_at
          ? { id: lm.id, sender_id: lm.sender_id, body: null, attachment_json: null, created_at: lm.created_at, deleted_at: lm.deleted_at }
          : lm
        : null
      return {
        id: row.id,
        other_user: userMap.get(row.other_id) || { id: row.other_id, name: 'Unknown' },
        last_message: lastMsgView,
        last_message_at: row.last_message_at,
        unread_count: unreadMap.get(row.id) || 0,
      }
    })

    return c.json({ success: true, conversations: out, broadcast_unread_count: broadcastUnreadCount })
    } catch (err) {
      console.error('[chat] GET /api/chat/conversations error (migrations applied?)', err)
      return c.json({ success: false, error: 'db_error', conversations: [], broadcast_unread_count: 0 }, 500)
    }
  })

  /** Create or fetch a 1-to-1 conversation with another tenant user. */
  app.post('/api/chat/conversations/direct', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const body = await c.req.json<{ user_id?: number }>().catch(() => ({}))
    const otherId = Number(body?.user_id)
    if (!otherId || otherId === info.userId) return c.json({ success: false, error: 'invalid user_id' }, 400)

    const db = (c.env as Env).DB
    const other = await db
      .prepare(`SELECT id, tenant_id FROM users WHERE id = ? LIMIT 1`)
      .bind(otherId)
      .first<{ id: number; tenant_id: number }>()
    if (!other || other.tenant_id !== info.tenantId) {
      return c.json({ success: false, error: 'user not in tenant' }, 404)
    }

    const [p1, p2] = orderedPair(info.userId, otherId)
    const existing = await db
      .prepare(
        `SELECT id FROM chat_conversations
         WHERE tenant_id = ? AND participant_one_id = ? AND participant_two_id = ?`
      )
      .bind(info.tenantId, p1, p2)
      .first<{ id: number }>()
    if (existing) return c.json({ success: true, conversation_id: existing.id })

    const res = await db
      .prepare(
        `INSERT INTO chat_conversations (tenant_id, participant_one_id, participant_two_id)
         VALUES (?, ?, ?)`
      )
      .bind(info.tenantId, p1, p2)
      .run()
    const newId = Number((res as any).meta?.last_row_id || 0)
    return c.json({ success: true, conversation_id: newId })
  })

  /** Paginated message history (cursor = before id). Role 2 may read any same-tenant conversation. */
  app.get('/api/chat/conversations/:id/messages', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const conversationId = Number(c.req.param('id'))
    const env = c.env as Env
    const conv = await ensureConversationReadAccess(env.DB, conversationId, info.userId, info.tenantId, info.roleId ?? null)
    if (!conv) return c.json({ success: false, error: 'not found' }, 404)

    const limit = Math.min(Math.max(Number(c.req.query('limit') || 50), 1), 200)
    const before = Number(c.req.query('before') || 0)
    const after = Number(c.req.query('after') || 0)

    const userInfo = { userId: info.userId, tenantId: info.tenantId, roleId: info.roleId ?? null }

    if (after > 0) {
      const results = await fetchMessageRows(
        env.DB,
        `SELECT id, sender_id, body, attachment_json, created_at, deleted_at, is_forwarded, replied_to_message_id FROM chat_messages WHERE conversation_id = ? AND id > ? ORDER BY id ASC LIMIT ?`,
        `SELECT id, sender_id, body, attachment_json, created_at, deleted_at FROM chat_messages WHERE conversation_id = ? AND id > ? ORDER BY id ASC LIMIT ?`,
        [conversationId, after, limit]
      )
      const messages = await buildMessageHistory(env.DB, userInfo, results)
      return c.json({ success: true, messages })
    }

    const results = before
      ? await fetchMessageRows(
          env.DB,
          `SELECT id, sender_id, body, attachment_json, created_at, deleted_at, is_forwarded, replied_to_message_id FROM chat_messages WHERE conversation_id = ? AND id < ? ORDER BY id DESC LIMIT ?`,
          `SELECT id, sender_id, body, attachment_json, created_at, deleted_at FROM chat_messages WHERE conversation_id = ? AND id < ? ORDER BY id DESC LIMIT ?`,
          [conversationId, before, limit]
        )
      : await fetchMessageRows(
          env.DB,
          `SELECT id, sender_id, body, attachment_json, created_at, deleted_at, is_forwarded, replied_to_message_id FROM chat_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?`,
          `SELECT id, sender_id, body, attachment_json, created_at, deleted_at FROM chat_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?`,
          [conversationId, limit]
        )

    const messages = await buildMessageHistory(env.DB, userInfo, results.reverse())
    return c.json({ success: true, messages })
  })

  /** Create a text message. */
  app.post('/api/chat/conversations/:id/messages', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const conversationId = Number(c.req.param('id'))
    const env = c.env as Env
    const conv = await ensureConversationAccess(env.DB, conversationId, info.userId, info.tenantId)
    if (!conv) return c.json({ success: false, error: 'not found' }, 404)

    const payload = await c.req.json<{ body?: string; customer_ids?: number[]; replied_to_message_id?: number }>().catch(() => ({}))
    const text = String(payload?.body || '').trim()
    if (!text) return c.json({ success: false, error: 'empty body' }, 400)
    if (text.length > 8000) return c.json({ success: false, error: 'too long' }, 400)

    const requestedTagIds = Array.isArray(payload?.customer_ids) ? payload!.customer_ids! : []
    const tagged = requestedTagIds.length
      ? await filterTaggableCustomers(env.DB, { userId: info.userId, tenantId: info.tenantId, roleId: info.roleId ?? null }, requestedTagIds)
      : []

    // Validate replied_to_message_id belongs to this conversation and is not deleted
    let repliedToId: number | null = null
    if (payload?.replied_to_message_id) {
      const candidate = Number(payload.replied_to_message_id)
      if (Number.isFinite(candidate) && candidate > 0) {
        const refMsg = await env.DB.prepare(
          `SELECT id FROM chat_messages WHERE id = ? AND conversation_id = ? AND deleted_at IS NULL LIMIT 1`
        ).bind(candidate, conversationId).first<{ id: number }>()
        if (refMsg) repliedToId = candidate
      }
    }

    const now = new Date().toISOString()

    // Insert with replied_to_message_id; fall back if migration 0085 not yet applied
    let ins: any
    try {
      ins = await env.DB.prepare(
        `INSERT INTO chat_messages (conversation_id, tenant_id, sender_id, body, replied_to_message_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(conversationId, info.tenantId, info.userId, text, repliedToId, now).run()
    } catch (e: unknown) {
      const eMsg = String((e as any)?.message || e || '')
      if (/no such column.*replied_to_message_id|has no column named replied_to_message_id/i.test(eMsg)) {
        ins = await env.DB.prepare(
          `INSERT INTO chat_messages (conversation_id, tenant_id, sender_id, body, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(conversationId, info.tenantId, info.userId, text, now).run()
        repliedToId = null
      } else throw e
    }
    const messageId = Number((ins as any).meta?.last_row_id || 0)

    const tagsRaw = await insertMessageTags(env.DB, messageId, tagged)
    const tags = await enrichTagsForViewer(
      env.DB,
      { userId: info.userId, tenantId: info.tenantId, roleId: info.roleId ?? null },
      tagsRaw
    )

    // Fetch reply preview to include in response and WS broadcast
    let reply_preview: any = undefined
    if (repliedToId) {
      try {
        const rpMsg = await env.DB.prepare(
          `SELECT id, sender_id, body, attachment_json, deleted_at FROM chat_messages WHERE id = ? LIMIT 1`
        ).bind(repliedToId).first<ReplyPreviewRow>()
        if (rpMsg) {
          reply_preview = {
            id: rpMsg.id,
            sender_id: rpMsg.sender_id,
            body: rpMsg.deleted_at ? null : rpMsg.body,
            attachment_json: rpMsg.deleted_at ? null : rpMsg.attachment_json,
            deleted_at: rpMsg.deleted_at || null,
          }
        }
      } catch (e) {
        console.error('[chat] reply_preview fetch failed', e)
      }
    }

    await env.DB.prepare(
      `UPDATE chat_conversations
       SET last_message_id = ?, last_message_at = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(messageId, now, now, conversationId)
      .run()

    const message: any = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: info.userId,
      body: text,
      attachment_json: null,
      created_at: now,
      tags,
    }
    if (repliedToId) message.replied_to_message_id = repliedToId
    if (reply_preview) message.reply_preview = reply_preview

    const recipientId = conv.participant_one_id === info.userId ? conv.participant_two_id : conv.participant_one_id
    // WS is shared between participants — send raw tags; clients re-fetch for per-viewer can_link.
    const messageForWs = { ...message, tags: tagsRaw }
    c.executionCtx.waitUntil(Promise.all([
      broadcastToRoom(env, conversationId, { type: 'message', message: messageForWs }),
      pushUserNotification(env, recipientId),
    ]))
    return c.json({ success: true, message })
  })

  /** Upload attachment and create a message referencing it. */
  app.post('/api/chat/conversations/:id/attachments', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const conversationId = Number(c.req.param('id'))
    const env = c.env as Env
    const conv = await ensureConversationAccess(env.DB, conversationId, info.userId, info.tenantId)
    if (!conv) return c.json({ success: false, error: 'not found' }, 404)

    const form = await c.req.formData().catch(() => null)
    if (!form) return c.json({ success: false, error: 'invalid form' }, 400)
    const file = form.get('file')
    if (!file || typeof file === 'string' || typeof (file as File).arrayBuffer !== 'function') {
      return c.json({ success: false, error: 'no file' }, 400)
    }
    const upload = file as File
    if (upload.size > MAX_ATTACHMENT_BYTES) return c.json({ success: false, error: 'too large' }, 400)
    const mime = inferMime(upload)
    if (!isAllowedMime(mime)) return c.json({ success: false, error: 'mime not allowed' }, 400)

    const now = new Date().toISOString()
    const ins = await env.DB.prepare(
      `INSERT INTO chat_messages (conversation_id, tenant_id, sender_id, body, attachment_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(conversationId, info.tenantId, info.userId, null, '{}', now)
      .run()
    const messageId = Number((ins as any).meta?.last_row_id || 0)
    if (!messageId) return c.json({ success: false, error: 'insert failed' }, 500)

    const safeName = (upload.name || 'file').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120)
    const key = `chat/${info.tenantId}/${conversationId}/${messageId}/${safeName}`
    try {
      // file.stream() fails on Workers R2 ("stream must have a known length");
      // arrayBuffer matches /api/attachments/upload and other R2 puts in this app.
      const bytes = await upload.arrayBuffer()
      await env.ATTACHMENTS.put(key, bytes, {
        httpMetadata: { contentType: mime },
      })
    } catch (err) {
      console.error('[chat] attachment R2 put failed', err)
      try {
        await env.DB.prepare(`DELETE FROM chat_messages WHERE id = ?`).bind(messageId).run()
      } catch {}
      return c.json({ success: false, error: 'upload failed' }, 500)
    }

    const attachment = { key, name: safeName, mime, size: upload.size }
    await env.DB.prepare(`UPDATE chat_messages SET attachment_json = ? WHERE id = ?`)
      .bind(JSON.stringify(attachment), messageId)
      .run()
    await env.DB.prepare(
      `UPDATE chat_conversations SET last_message_id = ?, last_message_at = ?, updated_at = ? WHERE id = ?`
    )
      .bind(messageId, now, now, conversationId)
      .run()

    const message = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: info.userId,
      body: null,
      attachment_json: JSON.stringify(attachment),
      created_at: now,
    }
    const recipientIdAtt = conv.participant_one_id === info.userId ? conv.participant_two_id : conv.participant_one_id
    c.executionCtx.waitUntil(Promise.all([
      broadcastToRoom(env, conversationId, { type: 'message', message }),
      pushUserNotification(env, recipientIdAtt),
    ]))
    return c.json({ success: true, message })
  })

  /** Download attachment via authenticated endpoint (never expose raw R2 URLs). Role 2 may access any same-tenant conversation. */
  app.get('/api/chat/attachments/:conversationId/:messageId/:filename', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const conversationId = Number(c.req.param('conversationId'))
    const messageId = Number(c.req.param('messageId'))
    const env = c.env as Env
    const conv = await ensureConversationReadAccess(env.DB, conversationId, info.userId, info.tenantId, info.roleId ?? null)
    if (!conv) return c.json({ success: false, error: 'not found' }, 404)

    const msg = await env.DB.prepare(
      `SELECT attachment_json, deleted_at FROM chat_messages WHERE id = ? AND conversation_id = ?`
    )
      .bind(messageId, conversationId)
      .first<{ attachment_json: string | null; deleted_at: string | null }>()
    if (!msg?.attachment_json) return c.json({ success: false, error: 'no attachment' }, 404)
    if (msg.deleted_at) return c.json({ success: false, error: 'message deleted' }, 404)
    let meta: any
    try {
      meta = JSON.parse(msg.attachment_json)
    } catch {
      return c.json({ success: false, error: 'bad metadata' }, 500)
    }
    const obj = await env.ATTACHMENTS.get(meta.key)
    if (!obj) return c.json({ success: false, error: 'gone' }, 404)
    const forceDownload = c.req.query('dl') === '1'
    const disposition = forceDownload
      ? `attachment; filename="${meta.name || 'file'}"`
      : `inline; filename="${meta.name || 'file'}"`
    return new Response(obj.body, {
      headers: {
        'content-type': meta.mime || 'application/octet-stream',
        'content-disposition': disposition,
      },
    })
  })

  /** Update read cursor for the current user. */
  app.post('/api/chat/conversations/:id/read', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const conversationId = Number(c.req.param('id'))
    const env = c.env as Env
    const conv = await ensureConversationAccess(env.DB, conversationId, info.userId, info.tenantId)
    if (!conv) return c.json({ success: false, error: 'not found' }, 404)

    const body = await c.req.json<{ last_read_message_id?: number }>().catch(() => ({}))
    const lastId = Math.max(0, Number(body?.last_read_message_id || 0))
    const now = new Date().toISOString()

    await env.DB.prepare(
      `INSERT INTO chat_message_reads (conversation_id, user_id, last_read_message_id, last_read_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(conversation_id, user_id) DO UPDATE SET
         last_read_message_id = MAX(last_read_message_id, excluded.last_read_message_id),
         last_read_at = excluded.last_read_at`
    )
      .bind(conversationId, info.userId, lastId, now)
      .run()

    c.executionCtx.waitUntil(
      broadcastToRoom(env, conversationId, {
        type: 'read',
        user_id: info.userId,
        last_read_message_id: lastId,
      })
    )
    return c.json({ success: true })
  })

  // ── Broadcasts channel ────────────────────────────────────────────────────

  /** Paginated broadcast history for the current tenant. All authenticated users can read. */
  app.get('/api/chat/broadcasts/messages', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const env = c.env as Env
    const limit = Math.min(Math.max(Number(c.req.query('limit') || 50), 1), 200)
    const before = Number(c.req.query('before') || 0)
    const after = Number(c.req.query('after') || 0)

    if (after > 0) {
      const rows = await env.DB.prepare(
        `SELECT b.id, b.sender_id, b.body, b.deleted_at, b.created_at, u.full_name AS sender_name
         FROM chat_broadcasts b LEFT JOIN users u ON u.id = b.sender_id
         WHERE b.tenant_id = ? AND b.id > ?
         ORDER BY b.id ASC LIMIT ?`
      )
        .bind(info.tenantId, after, limit)
        .all<{ id: number; sender_id: number; body: string; deleted_at: string | null; created_at: string; sender_name: string | null }>()
      const messages = (rows.results || []).map((r) => r.deleted_at
        ? { id: r.id, sender_id: r.sender_id, body: null, deleted_at: r.deleted_at, created_at: r.created_at, sender_name: r.sender_name }
        : r)
      return c.json({ success: true, messages })
    }

    const rows = before
      ? await env.DB.prepare(
          `SELECT b.id, b.sender_id, b.body, b.deleted_at, b.created_at, u.full_name AS sender_name
           FROM chat_broadcasts b LEFT JOIN users u ON u.id = b.sender_id
           WHERE b.tenant_id = ? AND b.id < ?
           ORDER BY b.id DESC LIMIT ?`
        )
          .bind(info.tenantId, before, limit)
          .all<{ id: number; sender_id: number; body: string; deleted_at: string | null; created_at: string; sender_name: string | null }>()
      : await env.DB.prepare(
          `SELECT b.id, b.sender_id, b.body, b.deleted_at, b.created_at, u.full_name AS sender_name
           FROM chat_broadcasts b LEFT JOIN users u ON u.id = b.sender_id
           WHERE b.tenant_id = ?
           ORDER BY b.id DESC LIMIT ?`
        )
          .bind(info.tenantId, limit)
          .all<{ id: number; sender_id: number; body: string; deleted_at: string | null; created_at: string; sender_name: string | null }>()

    const messages = (rows.results || []).reverse().map((r) => r.deleted_at
      ? { id: r.id, sender_id: r.sender_id, body: null, deleted_at: r.deleted_at, created_at: r.created_at, sender_name: r.sender_name }
      : r)
    return c.json({ success: true, messages })
  })

  /** Send a broadcast. Only role_id=2 (admin) may post. */
  app.post('/api/chat/broadcasts/messages', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    if (info.roleId !== ADMIN_ROLE_ID) return c.json({ success: false, error: 'forbidden' }, 403)

    const payload = await c.req.json<{ body?: string }>().catch(() => ({}))
    const text = String(payload?.body || '').trim()
    if (!text) return c.json({ success: false, error: 'empty body' }, 400)
    if (text.length > 8000) return c.json({ success: false, error: 'too long' }, 400)

    const env = c.env as Env
    const now = new Date().toISOString()
    const ins = await env.DB.prepare(
      `INSERT INTO chat_broadcasts (tenant_id, sender_id, body, created_at) VALUES (?, ?, ?, ?)`
    )
      .bind(info.tenantId, info.userId, text, now)
      .run()
    const broadcastId = Number((ins as any).meta?.last_row_id || 0)

    const message = { id: broadcastId, tenant_id: info.tenantId, sender_id: info.userId, body: text, created_at: now }

    // Sender has implicitly read their own message — advance their cursor so their own
    // badge doesn't increment when the notification fan-out reaches them.
    await env.DB.prepare(
      `INSERT INTO chat_broadcast_reads (user_id, tenant_id, last_read_broadcast_id, last_read_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         last_read_broadcast_id = MAX(last_read_broadcast_id, excluded.last_read_broadcast_id),
         last_read_at = excluded.last_read_at`
    )
      .bind(info.userId, info.tenantId, broadcastId, now)
      .run()

    c.executionCtx.waitUntil(
      Promise.all([
        broadcastToTenant(env, info.tenantId, { type: 'broadcast', message }),
        pushBroadcastNotificationToTenant(env, env.DB, info.tenantId),
      ])
    )
    return c.json({ success: true, message })
  })

  /** Update the read cursor for the broadcasts channel. */
  app.post('/api/chat/broadcasts/read', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const body = await c.req.json<{ last_read_broadcast_id?: number }>().catch(() => ({}))
    const lastId = Math.max(0, Number(body?.last_read_broadcast_id || 0))
    const now = new Date().toISOString()
    const env = c.env as Env
    await env.DB.prepare(
      `INSERT INTO chat_broadcast_reads (user_id, tenant_id, last_read_broadcast_id, last_read_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         last_read_broadcast_id = MAX(last_read_broadcast_id, excluded.last_read_broadcast_id),
         last_read_at = excluded.last_read_at`
    )
      .bind(info.userId, info.tenantId, lastId, now)
      .run()
    return c.json({ success: true })
  })

  /** Unread broadcast count for current user. */
  app.get('/api/chat/broadcasts/unread', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const env = c.env as Env
    const reads = await env.DB.prepare(
      `SELECT last_read_broadcast_id FROM chat_broadcast_reads WHERE user_id = ?`
    )
      .bind(info.userId)
      .first<{ last_read_broadcast_id: number }>()
    const lastReadId = reads?.last_read_broadcast_id ?? 0
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM chat_broadcasts WHERE tenant_id = ? AND id > ? AND deleted_at IS NULL`
    )
      .bind(info.tenantId, lastReadId)
      .first<{ n: number }>()
    return c.json({ success: true, unread_count: Number(row?.n || 0) })
  })

  /** WebSocket: live broadcast events for the current tenant. */
  app.get('/api/chat/broadcasts/ws', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return new Response('unauthorized', { status: 401 })
    const upgrade = c.req.header('Upgrade')
    if (upgrade !== 'websocket') return new Response('expected websocket', { status: 426 })
    const env = c.env as Env
    const id = env.BROADCAST_ROOMS.idFromName(`broadcast:${info.tenantId}`)
    const stub = env.BROADCAST_ROOMS.get(id)
    const url = new URL(c.req.url)
    url.pathname = '/connect'
    url.searchParams.set('userId', String(info.userId))
    return stub.fetch(url.toString(), c.req.raw)
  })

  // ── Delete ────────────────────────────────────────────────────────────────

  /** Tombstone one or more direct messages the caller sent. */
  app.post('/api/chat/conversations/:id/messages/delete', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    const conversationId = Number(c.req.param('id'))
    const env = c.env as Env
    const conv = await ensureConversationAccess(env.DB, conversationId, info.userId, info.tenantId)
    if (!conv) return c.json({ success: false, error: 'not found' }, 404)

    const payload = await c.req.json<{ message_ids?: number[] }>().catch(() => ({}))
    const ids = Array.isArray(payload?.message_ids)
      ? payload!.message_ids!.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : []
    if (!ids.length) return c.json({ success: false, error: 'no message_ids' }, 400)

    const now = new Date().toISOString()
    const deletedIds: number[] = []

    for (const msgId of ids) {
      const msg = await env.DB.prepare(
        `SELECT id, sender_id, attachment_json FROM chat_messages
         WHERE id = ? AND conversation_id = ? AND deleted_at IS NULL`
      )
        .bind(msgId, conversationId)
        .first<{ id: number; sender_id: number; attachment_json: string | null }>()
      if (!msg) continue
      if (msg.sender_id !== info.userId) continue

      if (msg.attachment_json) {
        try {
          const meta = JSON.parse(msg.attachment_json)
          if (meta?.key) await env.ATTACHMENTS.delete(meta.key)
        } catch {}
      }

      await env.DB.prepare(
        `UPDATE chat_messages SET deleted_at = ?, body = NULL, attachment_json = NULL WHERE id = ?`
      )
        .bind(now, msg.id)
        .run()
      deletedIds.push(msg.id)
    }

    if (deletedIds.length) {
      c.executionCtx.waitUntil(
        broadcastToRoom(env, conversationId, {
          type: 'message_deleted',
          message_ids: deletedIds,
          conversation_id: conversationId,
        })
      )
    }

    return c.json({ success: true, deleted_ids: deletedIds })
  })

  /** Tombstone one or more broadcast messages the caller sent. */
  app.post('/api/chat/broadcasts/messages/delete', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)

    const payload = await c.req.json<{ message_ids?: number[] }>().catch(() => ({}))
    const ids = Array.isArray(payload?.message_ids)
      ? payload!.message_ids!.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : []
    if (!ids.length) return c.json({ success: false, error: 'no message_ids' }, 400)

    const env = c.env as Env
    const now = new Date().toISOString()
    const deletedIds: number[] = []

    for (const msgId of ids) {
      const msg = await env.DB.prepare(
        `SELECT id, sender_id FROM chat_broadcasts
         WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`
      )
        .bind(msgId, info.tenantId)
        .first<{ id: number; sender_id: number }>()
      if (!msg) continue
      if (msg.sender_id !== info.userId) continue

      await env.DB.prepare(
        `UPDATE chat_broadcasts SET deleted_at = ?, body = '' WHERE id = ?`
      )
        .bind(now, msg.id)
        .run()
      deletedIds.push(msg.id)
    }

    if (deletedIds.length) {
      c.executionCtx.waitUntil(
        broadcastToTenant(env, info.tenantId, {
          type: 'broadcast_deleted',
          message_ids: deletedIds,
        })
      )
    }

    return c.json({ success: true, deleted_ids: deletedIds })
  })

  // ── Forward ───────────────────────────────────────────────────────────────

  /** Forward one or more messages (direct or broadcast) to one or more recipients. */
  app.post('/api/chat/messages/forward', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)

    const payload = await c.req.json<{
      source_type?: string
      source_conversation_id?: number
      message_ids?: number[]
      recipient_user_ids?: number[]
    }>().catch(() => ({}))

    const sourceType = String(payload?.source_type || '')
    if (sourceType !== 'direct' && sourceType !== 'broadcast') {
      return c.json({ success: false, error: 'invalid source_type' }, 400)
    }

    const msgIds = Array.isArray(payload?.message_ids)
      ? payload!.message_ids!.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : []
    const recipientIds = Array.isArray(payload?.recipient_user_ids)
      ? payload!.recipient_user_ids!.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : []

    if (!msgIds.length) return c.json({ success: false, error: 'no message_ids' }, 400)
    if (!recipientIds.length) return c.json({ success: false, error: 'no recipient_user_ids' }, 400)

    const env = c.env as Env

    type SrcMsg = { id: number; body: string | null; attachment_json: string | null }
    const sourceMsgs: SrcMsg[] = []

    if (sourceType === 'direct') {
      const srcConvId = Number(payload?.source_conversation_id)
      if (!srcConvId) return c.json({ success: false, error: 'source_conversation_id required' }, 400)
      const srcConv = await ensureConversationAccess(env.DB, srcConvId, info.userId, info.tenantId)
      if (!srcConv) return c.json({ success: false, error: 'source conversation not found' }, 404)

      const ph = msgIds.map(() => '?').join(',')
      const rows = await env.DB.prepare(
        `SELECT id, body, attachment_json, deleted_at FROM chat_messages
         WHERE id IN (${ph}) AND conversation_id = ?`
      )
        .bind(...msgIds, srcConvId)
        .all<{ id: number; body: string | null; attachment_json: string | null; deleted_at: string | null }>()

      for (const r of rows.results || []) {
        if (r.deleted_at) return c.json({ success: false, error: `message ${r.id} is deleted` }, 400)
        sourceMsgs.push({ id: r.id, body: r.body, attachment_json: r.attachment_json })
      }
    } else {
      const ph = msgIds.map(() => '?').join(',')
      const rows = await env.DB.prepare(
        `SELECT id, body, deleted_at FROM chat_broadcasts
         WHERE id IN (${ph}) AND tenant_id = ?`
      )
        .bind(...msgIds, info.tenantId)
        .all<{ id: number; body: string; deleted_at: string | null }>()

      for (const r of rows.results || []) {
        if (r.deleted_at) return c.json({ success: false, error: `message ${r.id} is deleted` }, 400)
        sourceMsgs.push({ id: r.id, body: r.body, attachment_json: null })
      }
    }

    if (!sourceMsgs.length) return c.json({ success: false, error: 'no valid source messages' }, 400)

    for (const recipientId of recipientIds) {
      if (recipientId === info.userId) continue
      const recipUser = await env.DB.prepare(`SELECT id, tenant_id FROM users WHERE id = ? LIMIT 1`)
        .bind(recipientId)
        .first<{ id: number; tenant_id: number }>()
      if (!recipUser || recipUser.tenant_id !== info.tenantId) continue

      const [p1, p2] = orderedPair(info.userId, recipientId)
      const existing = await env.DB.prepare(
        `SELECT id FROM chat_conversations
         WHERE tenant_id = ? AND participant_one_id = ? AND participant_two_id = ?`
      )
        .bind(info.tenantId, p1, p2)
        .first<{ id: number }>()

      let convId: number
      if (existing) {
        convId = existing.id
      } else {
        const res = await env.DB.prepare(
          `INSERT INTO chat_conversations (tenant_id, participant_one_id, participant_two_id)
           VALUES (?, ?, ?)`
        )
          .bind(info.tenantId, p1, p2)
          .run()
        convId = Number((res as any).meta?.last_row_id || 0)
      }

      for (const srcMsg of sourceMsgs) {
        const msgNow = new Date().toISOString()

        if (srcMsg.attachment_json) {
          let parsedMeta: any
          try { parsedMeta = JSON.parse(srcMsg.attachment_json) } catch {}
          if (parsedMeta?.key) {
            const ins = await env.DB.prepare(
              `INSERT INTO chat_messages (conversation_id, tenant_id, sender_id, body, attachment_json, is_forwarded, created_at)
               VALUES (?, ?, ?, NULL, '{}', 1, ?)`
            )
              .bind(convId, info.tenantId, info.userId, msgNow)
              .run()
            const newMsgId = Number((ins as any).meta?.last_row_id || 0)
            const newKey = `chat/${info.tenantId}/${convId}/${newMsgId}/${parsedMeta.name || 'file'}`
            try {
              const obj = await env.ATTACHMENTS.get(parsedMeta.key)
              if (obj) {
                const bytes = await obj.arrayBuffer()
                await env.ATTACHMENTS.put(newKey, bytes, {
                  httpMetadata: { contentType: parsedMeta.mime },
                })
              }
            } catch {}
            const newAttachment = { key: newKey, name: parsedMeta.name, mime: parsedMeta.mime, size: parsedMeta.size }
            const newAttJson = JSON.stringify(newAttachment)
            await env.DB.prepare(`UPDATE chat_messages SET attachment_json = ? WHERE id = ?`)
              .bind(newAttJson, newMsgId)
              .run()
            await env.DB.prepare(
              `UPDATE chat_conversations SET last_message_id = ?, last_message_at = ?, updated_at = ? WHERE id = ?`
            )
              .bind(newMsgId, msgNow, msgNow, convId)
              .run()
            c.executionCtx.waitUntil(Promise.all([
              broadcastToRoom(env, convId, {
                type: 'message',
                message: { id: newMsgId, conversation_id: convId, sender_id: info.userId, body: null, attachment_json: newAttJson, created_at: msgNow },
              }),
              pushUserNotification(env, recipientId),
            ]))
            continue
          }
        }

        if (srcMsg.body) {
          const ins = await env.DB.prepare(
            `INSERT INTO chat_messages (conversation_id, tenant_id, sender_id, body, is_forwarded, created_at)
             VALUES (?, ?, ?, ?, 1, ?)`
          )
            .bind(convId, info.tenantId, info.userId, srcMsg.body, msgNow)
            .run()
          const newMsgId = Number((ins as any).meta?.last_row_id || 0)

          const tagRows = await env.DB.prepare(
            `SELECT customer_id FROM chat_message_customer_tags WHERE message_id = ?`
          )
            .bind(srcMsg.id)
            .all<{ customer_id: number }>()
          const tagIds = (tagRows.results || []).map((r) => r.customer_id)
          if (tagIds.length) {
            const tagged = await filterTaggableCustomers(env.DB, {
              userId: info.userId,
              tenantId: info.tenantId,
              roleId: info.roleId ?? null,
            }, tagIds)
            await insertMessageTags(env.DB, newMsgId, tagged)
          }

          await env.DB.prepare(
            `UPDATE chat_conversations SET last_message_id = ?, last_message_at = ?, updated_at = ? WHERE id = ?`
          )
            .bind(newMsgId, msgNow, msgNow, convId)
            .run()
          c.executionCtx.waitUntil(Promise.all([
            broadcastToRoom(env, convId, {
              type: 'message',
              message: { id: newMsgId, conversation_id: convId, sender_id: info.userId, body: srcMsg.body, attachment_json: null, created_at: msgNow },
            }),
            pushUserNotification(env, recipientId),
          ]))
        }
      }
    }

    return c.json({ success: true })
  })

  // ─────────────────────────────────────────────────────────────────────────

  // ── Admin oversight ───────────────────────────────────────────────────────

  /**
   * List conversations for a selected tenant user.
   * Role 2 only. Returns both participants + other-party relative to the target user.
   * Single batched query — no per-row N+1.
   */
  app.get('/api/chat/admin/users/:userId/conversations', async (c) => {
    if (!CHAT_ADMIN_DRILLDOWN_ENABLED) return c.json({ success: false, error: 'disabled' }, 403)
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return c.json({ success: false, error: 'unauthorized' }, 401)
    if (info.roleId !== ADMIN_ROLE_ID) return c.json({ success: false, error: 'forbidden' }, 403)

    const targetUserId = Number(c.req.param('userId'))
    if (!targetUserId || !Number.isFinite(targetUserId)) return c.json({ success: false, error: 'invalid userId' }, 400)

    const db = (c.env as Env).DB

    const targetUser = await db
      .prepare(`SELECT id, full_name, tenant_id FROM users WHERE id = ? LIMIT 1`)
      .bind(targetUserId)
      .first<{ id: number; full_name: string | null; tenant_id: number }>()
    if (!targetUser || targetUser.tenant_id !== info.tenantId) {
      return c.json({ success: false, error: 'user not found' }, 404)
    }

    const limit = Math.min(Math.max(Number(c.req.query('limit') || 50), 1), 100)

    const convs = await db
      .prepare(
        `SELECT c.id, c.participant_one_id, c.participant_two_id, c.last_message_at, c.last_message_id,
                CASE WHEN c.participant_one_id = ? THEN c.participant_two_id ELSE c.participant_one_id END AS other_id
         FROM chat_conversations c
         WHERE c.tenant_id = ?
           AND (c.participant_one_id = ? OR c.participant_two_id = ?)
         ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
         LIMIT ?`
      )
      .bind(targetUserId, info.tenantId, targetUserId, targetUserId, limit)
      .all<{ id: number; participant_one_id: number; participant_two_id: number; other_id: number; last_message_id: number | null; last_message_at: string | null }>()

    const results = convs.results || []
    if (!results.length) {
      return c.json({ success: true, conversations: [], target_user: { id: targetUser.id, name: targetUser.full_name } })
    }

    const allUserIds = Array.from(new Set([targetUserId, ...results.map((r) => r.other_id)]))
    const uPh = allUserIds.map(() => '?').join(',')
    const users = await db
      .prepare(`SELECT id, full_name AS name, email FROM users WHERE id IN (${uPh})`)
      .bind(...allUserIds)
      .all<{ id: number; name: string | null; email: string | null }>()
    const userMap = new Map<number, any>()
    ;(users.results || []).forEach((u) => userMap.set(u.id, u))

    const lastMsgIds = results
      .map((r) => r.last_message_id)
      .filter((id): id is number => id != null && Number(id) > 0)
    const lastMsgs = new Map<number, any>()
    if (lastMsgIds.length) {
      const mPh = lastMsgIds.map(() => '?').join(',')
      const msgRows = await db
        .prepare(
          `SELECT id, sender_id, body, attachment_json, created_at, deleted_at
           FROM chat_messages WHERE id IN (${mPh})`
        )
        .bind(...lastMsgIds)
        .all<{ id: number; sender_id: number; body: string | null; attachment_json: string | null; created_at: string; deleted_at: string | null }>()
      for (const m of msgRows.results || []) lastMsgs.set(Number(m.id), m)
    }

    const out = results.map((row) => {
      const lm = row.last_message_id ? lastMsgs.get(Number(row.last_message_id)) : null
      const lastMsgView = lm
        ? lm.deleted_at
          ? { id: lm.id, sender_id: lm.sender_id, body: null, created_at: lm.created_at, deleted_at: lm.deleted_at }
          : { id: lm.id, sender_id: lm.sender_id, body: lm.body, attachment_json: lm.attachment_json, created_at: lm.created_at }
        : null
      return {
        id: row.id,
        participant_one_id: row.participant_one_id,
        participant_two_id: row.participant_two_id,
        other_user: userMap.get(row.other_id) || { id: row.other_id, name: 'Unknown' },
        last_message: lastMsgView,
        last_message_at: row.last_message_at,
      }
    })

    return c.json({ success: true, conversations: out, target_user: { id: targetUser.id, name: targetUser.full_name } })
  })

  // ─────────────────────────────────────────────────────────────────────────

  /** WebSocket: personal notification channel — fires 'unread_update' on any incoming message. */
  app.get('/api/chat/notify/ws', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return new Response('unauthorized', { status: 401 })

    const upgrade = c.req.header('Upgrade')
    if (upgrade !== 'websocket') return new Response('expected websocket', { status: 426 })

    const env = c.env as Env
    const id = env.USER_NOTIFICATIONS.idFromName(`user:${info.userId}`)
    const stub = env.USER_NOTIFICATIONS.get(id)
    const url = new URL(c.req.url)
    url.pathname = '/connect'
    url.searchParams.set('userId', String(info.userId))
    return stub.fetch(url.toString(), c.req.raw)
  })

  /** WebSocket: live events for a conversation. Validates auth before upgrade. Role 2 may subscribe to any same-tenant conversation. */
  app.get('/api/chat/ws/:conversationId', async (c) => {
    const info = await getUserInfo(c)
    if (!info.userId || !info.tenantId) return new Response('unauthorized', { status: 401 })
    const conversationId = Number(c.req.param('conversationId'))
    const env = c.env as Env
    const conv = await ensureConversationReadAccess(env.DB, conversationId, info.userId, info.tenantId, info.roleId ?? null)
    if (!conv) return new Response('not found', { status: 404 })

    const upgrade = c.req.header('Upgrade')
    if (upgrade !== 'websocket') return new Response('expected websocket', { status: 426 })

    const id = env.CHAT_ROOMS.idFromName(`conv:${conversationId}`)
    const stub = env.CHAT_ROOMS.get(id)
    const url = new URL(c.req.url)
    url.pathname = '/connect'
    url.searchParams.set('userId', String(info.userId))
    return stub.fetch(url.toString(), c.req.raw)
  })
}

/**
 * Durable Object: one instance per user. Receives a push whenever a message
 * arrives for that user so their browser badge updates instantly without polling.
 */
export class UserNotificationRoom {
  state: DurableObjectState
  sessions: Set<WebSocket>

  constructor(state: DurableObjectState, _env: any) {
    this.state = state
    this.sessions = new Set()
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/connect') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('expected websocket', { status: 426 })
      }
      const pair = new WebSocketPair()
      const client = pair[0]
      const server = pair[1]
      server.accept()
      this.sessions.add(server)
      server.addEventListener('close', () => this.sessions.delete(server))
      server.addEventListener('error', () => this.sessions.delete(server))
      return new Response(null, { status: 101, webSocket: client } as any)
    }

    if (url.pathname === '/push' && request.method === 'POST') {
      const payload = await request.text()
      const dead: WebSocket[] = []
      for (const ws of this.sessions) {
        try {
          ws.send(payload)
        } catch {
          dead.push(ws)
        }
      }
      dead.forEach((d) => this.sessions.delete(d))
      return new Response('ok')
    }

    return new Response('not found', { status: 404 })
  }
}

/**
 * Durable Object: one instance per conversation. Fans out events to all
 * subscribed sockets. D1 still holds the durable history.
 */
export class ChatConversationRoom {
  state: DurableObjectState
  sessions: Set<WebSocket>

  constructor(state: DurableObjectState, _env: any) {
    this.state = state
    this.sessions = new Set()
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/connect') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('expected websocket', { status: 426 })
      }
      const pair = new WebSocketPair()
      const client = pair[0]
      const server = pair[1]
      server.accept()
      this.sessions.add(server)
      server.addEventListener('close', () => this.sessions.delete(server))
      server.addEventListener('error', () => this.sessions.delete(server))
      return new Response(null, { status: 101, webSocket: client } as any)
    }

    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const payload = await request.text()
      const dead: WebSocket[] = []
      for (const ws of this.sessions) {
        try {
          ws.send(payload)
        } catch {
          dead.push(ws)
        }
      }
      dead.forEach((d) => this.sessions.delete(d))
      return new Response('ok')
    }

    return new Response('not found', { status: 404 })
  }
}

/**
 * Durable Object: one instance per tenant. Fans out broadcast events to all
 * tenant users who are currently connected to the broadcasts channel.
 */
export class BroadcastRoom {
  state: DurableObjectState
  sessions: Set<WebSocket>

  constructor(state: DurableObjectState, _env: any) {
    this.state = state
    this.sessions = new Set()
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/connect') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('expected websocket', { status: 426 })
      }
      const pair = new WebSocketPair()
      const client = pair[0]
      const server = pair[1]
      server.accept()
      this.sessions.add(server)
      server.addEventListener('close', () => this.sessions.delete(server))
      server.addEventListener('error', () => this.sessions.delete(server))
      return new Response(null, { status: 101, webSocket: client } as any)
    }

    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const payload = await request.text()
      const dead: WebSocket[] = []
      for (const ws of this.sessions) {
        try {
          ws.send(payload)
        } catch {
          dead.push(ws)
        }
      }
      dead.forEach((d) => this.sessions.delete(d))
      return new Response('ok')
    }

    return new Response('not found', { status: 404 })
  }
}
