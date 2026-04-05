/**
 * SQLite 데이터베이스 초기화 및 검색 함수
 * - better-sqlite3 + Drizzle ORM 설정
 * - FTS5 전문 검색 (한국어 unicode61 토크나이저)
 * - 테이블 생성 및 FTS 동기화 트리거
 */
const Database = require("better-sqlite3");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const path = require("path");
const fs = require("fs");
const schema = require("./schema");

// STORAGE_PATH 환경변수로 외부 스토리지 경로 지정 (Dropbox 등)
// 미설정 시 프로젝트 내부 backend/data/db 사용
const STORAGE_BASE = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const DB_DIR = path.join(STORAGE_BASE, "db");
const DB_PATH = path.join(DB_DIR, "second-brain.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
function initTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      document_type TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      author TEXT,
      source TEXT,
      published_date TEXT,
      content_markdown TEXT,
      content_plain TEXT,
      summary TEXT,
      status TEXT NOT NULL DEFAULT 'unread',
      importance INTEGER NOT NULL DEFAULT 3,
      file_path TEXT,
      file_type TEXT,
      file_size INTEGER,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS document_tags (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (document_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      parent_id TEXT,
      color TEXT,
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS document_categories (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (document_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS document_collections (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (document_id, collection_id)
    );

    CREATE TABLE IF NOT EXISTS document_relations (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      relation_type TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      position_start INTEGER NOT NULL,
      position_end INTEGER NOT NULL,
      highlight_text TEXT NOT NULL,
      note TEXT,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hero_videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'manhattan',
      is_active INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lawyers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_en TEXT,
      position TEXT NOT NULL DEFAULT '어소시에이트',
      photo_url TEXT,
      education TEXT,
      career TEXT,
      specialties TEXT,
      introduction TEXT,
      email TEXT,
      phone TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS history_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      year INTEGER NOT NULL,
      month INTEGER,
      day INTEGER,
      end_year INTEGER,
      category TEXT NOT NULL DEFAULT 'politics',
      region TEXT,
      country TEXT,
      importance INTEGER NOT NULL DEFAULT 3,
      latitude REAL,
      longitude REAL,
      source TEXT,
      related_document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
    CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
    CREATE INDEX IF NOT EXISTS idx_documents_importance ON documents(importance);
    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_history_events_year ON history_events(year);
    CREATE INDEX IF NOT EXISTS idx_history_events_category ON history_events(category);
    CREATE INDEX IF NOT EXISTS idx_history_events_region ON history_events(region);
    CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
    CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at);

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'legal_column',
      excerpt TEXT,
      content TEXT NOT NULL,
      author TEXT,
      thumbnail_url TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS case_results (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'civil',
      result TEXT NOT NULL,
      summary TEXT NOT NULL,
      detail TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
    CREATE INDEX IF NOT EXISTS idx_case_results_category ON case_results(category);
    CREATE INDEX IF NOT EXISTS idx_case_results_is_published ON case_results(is_published);
  `);
}

// FTS5 테이블 생성
function initFTS() {
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      title, content_plain, summary,
      content='documents',
      content_rowid='rowid',
      tokenize='unicode61'
    );
  `);

  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
      INSERT INTO documents_fts(rowid, title, content_plain, summary)
      VALUES (NEW.rowid, NEW.title, NEW.content_plain, NEW.summary);
    END;
  `);

  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, content_plain, summary)
      VALUES ('delete', OLD.rowid, OLD.title, OLD.content_plain, OLD.summary);
    END;
  `);

  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, content_plain, summary)
      VALUES ('delete', OLD.rowid, OLD.title, OLD.content_plain, OLD.summary);
      INSERT INTO documents_fts(rowid, title, content_plain, summary)
      VALUES (NEW.rowid, NEW.title, NEW.content_plain, NEW.summary);
    END;
  `);
}

// FTS5 검색
function searchFTS(query, limit = 20) {
  const safeQuery = sanitizeFTSQuery(query);
  if (!safeQuery) return [];

  const stmt = sqlite.prepare(`
    SELECT d.*, rank
    FROM documents_fts fts
    JOIN documents d ON d.rowid = fts.rowid
    WHERE documents_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `);
  return stmt.all(safeQuery, limit);
}

/**
 * FTS5 쿼리 문자열을 안전하게 정제
 * - 특수 문자를 제거하여 FTS5 구문 오류 방지
 * - 빈 토큰은 필터링
 */
function sanitizeFTSQuery(query) {
  // FTS5 특수 문자 제거 (AND, OR, NOT, 괄호, 따옴표, *, ^ 등)
  const cleaned = query
    .replace(/["""''(){}[\]*^~:]/g, " ")
    .replace(/\b(AND|OR|NOT|NEAR)\b/gi, " ")
    .trim();
  // 각 단어를 쌍따옴표로 감싸서 안전하게 매칭
  const MAX_TOKEN_LENGTH = 100;
  const tokens = cleaned.split(/\s+/).filter(t => t && t.length <= MAX_TOKEN_LENGTH);
  if (tokens.length === 0) return null;
  return tokens.map(t => `"${t}"`).join(" ");
}

// FTS5 스니펫 검색
function searchFTSWithSnippet(query, limit = 20) {
  const safeQuery = sanitizeFTSQuery(query);
  if (!safeQuery) return [];

  const stmt = sqlite.prepare(`
    SELECT d.*,
      snippet(documents_fts, 0, '<mark>', '</mark>', '...', 32) as title_snippet,
      snippet(documents_fts, 1, '<mark>', '</mark>', '...', 64) as content_snippet,
      rank
    FROM documents_fts fts
    JOIN documents d ON d.rowid = fts.rowid
    WHERE documents_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `);
  return stmt.all(safeQuery, limit);
}

// Initialize
try {
  initTables();
  initFTS();
} catch (e) {
  console.error("[DB Init Error]", e.message);
  process.exit(1);
}

module.exports = { db, sqlite, searchFTS, searchFTSWithSnippet };
