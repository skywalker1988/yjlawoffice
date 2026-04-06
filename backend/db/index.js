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

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      category TEXT,
      memo TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      consultation_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
    CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

    CREATE TABLE IF NOT EXISTS message_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'sms',
      subject TEXT,
      content TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS message_logs (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      recipient_name TEXT,
      recipient_contact TEXT NOT NULL,
      consultation_id TEXT,
      template_id TEXT,
      subject TEXT,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_message_logs_channel ON message_logs(channel);
    CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
    CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at);

    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      page TEXT NOT NULL,
      section TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_page_section ON site_settings(page, section);

    CREATE TABLE IF NOT EXISTS site_settings_history (
      id TEXT PRIMARY KEY,
      page TEXT NOT NULL,
      section TEXT NOT NULL,
      content TEXT NOT NULL,
      previous_content TEXT,
      changed_by TEXT DEFAULT 'admin',
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_site_settings_history_page_section ON site_settings_history(page, section);
    CREATE INDEX IF NOT EXISTS idx_site_settings_history_changed_at ON site_settings_history(changed_at);

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'banner',
      title TEXT NOT NULL,
      content TEXT,
      link_url TEXT,
      bg_color TEXT DEFAULT '#b08d57',
      text_color TEXT DEFAULT '#ffffff',
      is_active INTEGER NOT NULL DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      position TEXT DEFAULT 'top',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
    CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);

    CREATE TABLE IF NOT EXISTS scheduled_changes (
      id TEXT PRIMARY KEY,
      page TEXT NOT NULL,
      section TEXT NOT NULL,
      content TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_by TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_scheduled_changes_status ON scheduled_changes(status, scheduled_at);

    CREATE TABLE IF NOT EXISTS media_files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      alt TEXT,
      folder TEXT DEFAULT 'general',
      uploaded_by TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_media_files_folder ON media_files(folder);

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

    CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY,
      page TEXT,
      path TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      ip TEXT,
      session_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
    CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);

    CREATE TABLE IF NOT EXISTS portal_users (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_users_email ON portal_users(email);
  `);

  // 기존 admin_users에 totp_secret 컬럼 추가 (이미 있으면 무시)
  try { sqlite.exec("ALTER TABLE admin_users ADD COLUMN totp_secret TEXT"); } catch {}

  sqlite.exec(`

    CREATE TABLE IF NOT EXISTS case_files (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '접수',
      lawyer_id TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_case_files_client_id ON case_files(client_id);
    CREATE INDEX IF NOT EXISTS idx_case_files_status ON case_files(status);

    CREATE TABLE IF NOT EXISTS case_documents (
      id TEXT PRIMARY KEY,
      case_file_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      uploaded_by TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS case_messages (
      id TEXT PRIMARY KEY,
      case_file_id TEXT NOT NULL,
      sender_id TEXT,
      sender_type TEXT NOT NULL DEFAULT 'lawyer',
      content TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS booking_slots (
      id TEXT PRIMARY KEY,
      lawyer_id TEXT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      consultation_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_booking_slots_date ON booking_slots(date, lawyer_id);

    CREATE TABLE IF NOT EXISTS booking_settings (
      id TEXT PRIMARY KEY,
      lawyer_id TEXT,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL DEFAULT '09:00',
      end_time TEXT NOT NULL DEFAULT '18:00',
      slot_duration INTEGER NOT NULL DEFAULT 60,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS chatbot_qa (
      id TEXT PRIMARY KEY,
      category TEXT DEFAULT '일반',
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      keywords TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      messages TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      content TEXT NOT NULL,
      category TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_is_published ON reviews(is_published);

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      unsubscribe_token TEXT,
      subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
      unsubscribed_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
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
