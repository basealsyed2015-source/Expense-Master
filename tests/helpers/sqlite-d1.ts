import Database from 'better-sqlite3'

type Stmt = {
  bind: (...args: unknown[]) => Stmt
  first: <T>() => Promise<T | null>
  all: <T>() => Promise<{ results: T[] }>
  run: () => Promise<{ meta: { changes: number; last_row_id: number } }>
}

function makeStmt(db: Database.Database, sql: string): Stmt {
  let bound: unknown[] = []
  return {
    bind(...args: unknown[]) {
      bound = args
      return this
    },
    async first<T>() {
      const row = db.prepare(sql).get(...bound) as T | undefined
      return row ?? null
    },
    async all<T>() {
      const results = db.prepare(sql).all(...bound) as T[]
      return { results }
    },
    async run() {
      const info = db.prepare(sql).run(...bound)
      return { meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } }
    },
  }
}

export function createSqliteD1(db: Database.Database): D1Database {
  return {
    prepare(sql: string) {
      return makeStmt(db, sql)
    },
    batch: async (statements: { sql: string; args?: unknown[] }[]) => {
      const results = []
      for (const s of statements) {
        const info = db.prepare(s.sql).run(...(s.args || []))
        results.push({ meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } })
      }
      return results
    },
    exec: async (sql: string) => {
      db.exec(sql)
    },
  } as D1Database
}

export function createTestDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      full_name TEXT,
      name TEXT,
      email TEXT,
      tenant_id INTEGER,
      role_id INTEGER,
      assigned_bank_id INTEGER,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE banks (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER
    );
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      full_name TEXT,
      phone TEXT,
      assigned_bank_agent_id INTEGER,
      created_by INTEGER,
      is_completed INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0
    );
    CREATE TABLE chat_message_customer_tags (
      message_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      display_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (message_id, customer_id)
    );
    CREATE TABLE customer_assignments (
      customer_id INTEGER,
      employee_id INTEGER
    );
    CREATE TABLE financing_requests (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      assigned_bank_agent_id INTEGER,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      message TEXT,
      type TEXT,
      category TEXT,
      related_request_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      participant_one_id INTEGER NOT NULL,
      participant_two_id INTEGER NOT NULL,
      last_message_id INTEGER,
      last_message_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (tenant_id, participant_one_id, participant_two_id)
    );
    CREATE TABLE chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      body TEXT,
      attachment_json TEXT,
      deleted_at TEXT,
      is_forwarded INTEGER NOT NULL DEFAULT 0,
      replied_to_message_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE chat_message_reads (
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      last_read_message_id INTEGER NOT NULL DEFAULT 0,
      last_read_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (conversation_id, user_id)
    );
    CREATE TABLE chat_broadcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      deleted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE chat_broadcast_reads (
      user_id INTEGER NOT NULL PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      last_read_broadcast_id INTEGER NOT NULL DEFAULT 0,
      last_read_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE customer_alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      customer_name TEXT,
      alarm_date_gregorian TEXT,
      alarm_date_hijri TEXT,
      alarm_time TEXT,
      note TEXT,
      user_id INTEGER,
      tenant_id INTEGER,
      alarm_type TEXT,
      link_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
  return db
}
