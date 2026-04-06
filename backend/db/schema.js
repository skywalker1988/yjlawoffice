/**
 * Drizzle ORM 스키마 정의
 * - documents, tags, categories, collections 등 12개 테이블
 */
const { sqliteTable, text, integer, real, primaryKey } = require("drizzle-orm/sqlite-core");
const { sql } = require("drizzle-orm");
const crypto = require("crypto");

// =============================================
// 문서 유형 & 상태 enum 값
// =============================================
const DOCUMENT_TYPES = [
  "statute",    // 법령
  "case_law",   // 판례
  "textbook",   // 교과서
  "book",       // 일반서적
  "paper",      // 논문
  "news",       // 뉴스
  "note",       // 메모/노트
];

const DOCUMENT_STATUSES = ["unread", "reading", "completed", "archived"];
const FILE_TYPES = ["pdf", "markdown", "text", "html"];
const RELATION_TYPES = ["relates_to", "cites", "cited_by", "contradicts", "supplements"];

// =============================================
// documents — 핵심 통합 테이블
// =============================================
const documents = sqliteTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentType: text("document_type").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  author: text("author"),
  source: text("source"),
  publishedDate: text("published_date"),
  contentMarkdown: text("content_markdown"),
  contentPlain: text("content_plain"),
  summary: text("summary"),
  status: text("status").notNull().default("unread"),
  importance: integer("importance").notNull().default(3),
  filePath: text("file_path"),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  metadata: text("metadata"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// categories — 계층형 카테고리
// =============================================
const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: text("parent_id"),
  color: text("color"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// document_categories — 문서-카테고리 N:N
// =============================================
const documentCategories = sqliteTable("document_categories", {
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.documentId, table.categoryId] }),
]);

// =============================================
// collections — 사용자 정의 컬렉션
// =============================================
const collections = sqliteTable("collections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// document_collections — 문서-컬렉션 N:N
// =============================================
const documentCollections = sqliteTable("document_collections", {
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  addedAt: text("added_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  primaryKey({ columns: [table.documentId, table.collectionId] }),
]);

// =============================================
// document_relations — 문서 간 관계
// =============================================
const documentRelations = sqliteTable("document_relations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceId: text("source_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  targetId: text("target_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  relationType: text("relation_type").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// highlights — 문서 내 하이라이트
// =============================================
const highlights = sqliteTable("highlights", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  positionStart: integer("position_start").notNull(),
  positionEnd: integer("position_end").notNull(),
  highlightText: text("highlight_text").notNull(),
  note: text("note"),
  color: text("color").notNull().default("#6366f1"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});


// =============================================
// hero_videos — 히어로 배경 영상 관리
// =============================================
const HERO_VIDEO_CATEGORIES = [
  "manhattan",   // 맨하탄
  "nyc",         // 뉴욕시
  "cityscape",   // 도시 풍경
  "office",      // 오피스/비즈니스
  "nature",      // 자연
  "abstract",    // 추상
];

const heroVideos = sqliteTable("hero_videos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull().default("manhattan"),
  isActive: integer("is_active").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// lawyers — 변호사 소개
// =============================================
const LAWYER_POSITIONS = [
  "대표변호사",
  "파트너변호사",
  "시니어변호사",
  "어소시에이트",
  "고문변호사",
];

const lawyers = sqliteTable("lawyers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  position: text("position").notNull().default("어소시에이트"),
  photoUrl: text("photo_url"),
  education: text("education"),
  career: text("career"),
  specialties: text("specialties"),
  introduction: text("introduction"),
  email: text("email"),
  phone: text("phone"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// consultations — 상담 신청
// =============================================
const CONSULTATION_CATEGORIES = [
  "general",    // 일반 상담
  "civil",      // 민사
  "criminal",   // 형사
  "family",     // 가사
  "admin",      // 행정
  "tax",        // 조세
  "realestate", // 부동산
  "corporate",  // 기업법무
  "other",      // 기타
];

const CONSULTATION_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

const consultations = sqliteTable("consultations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  category: text("category").notNull().default("general"),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// blog_posts — 블로그/법률 칼럼
// =============================================
const BLOG_CATEGORIES = ["legal_column", "case_analysis", "legal_news", "law_guide"];

const blogPosts = sqliteTable("blog_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull().default("legal_column"),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  author: text("author"),
  thumbnailUrl: text("thumbnail_url"),
  isPublished: integer("is_published").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// case_results — 성공 사례
// =============================================
const CASE_CATEGORIES = ["civil", "criminal", "family", "administrative", "tax", "real_estate", "corporate"];

const caseResults = sqliteTable("case_results", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  category: text("category").notNull().default("civil"),
  result: text("result").notNull(),
  summary: text("summary").notNull(),
  detail: text("detail"),
  isPublished: integer("is_published").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// clients — 고객 DB (상담 신청 시 자동 등록)
// =============================================
const CLIENT_SOURCES = ["consultation", "referral", "manual", "other"];

const clients = sqliteTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  category: text("category"),
  memo: text("memo"),
  source: text("source").notNull().default("manual"),
  consultationId: text("consultation_id"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// message_templates — 메시지 템플릿 (SMS/이메일)
// =============================================
const MESSAGE_CHANNELS = ["sms", "email"];

const messageTemplates = sqliteTable("message_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("sms"),
  subject: text("subject"),
  content: text("content").notNull(),
  isActive: integer("is_active").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// message_logs — 메시지 발송 이력
// =============================================
const MESSAGE_STATUSES = ["pending", "sent", "failed"];

const messageLogs = sqliteTable("message_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channel: text("channel").notNull(),
  recipientName: text("recipient_name"),
  recipientContact: text("recipient_contact").notNull(),
  consultationId: text("consultation_id"),
  templateId: text("template_id"),
  subject: text("subject"),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// site_settings — 홈페이지 콘텐츠 설정 (JSON)
// =============================================
const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: text("page").notNull(),
  section: text("section").notNull(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// site_settings_history — 설정 변경 이력
// =============================================
const siteSettingsHistory = sqliteTable("site_settings_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: text("page").notNull(),
  section: text("section").notNull(),
  content: text("content").notNull(),
  previousContent: text("previous_content"),
  changedBy: text("changed_by").default("admin"),
  changedAt: text("changed_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// announcements — 공지/배너/팝업
// =============================================
const ANNOUNCEMENT_TYPES = ["banner", "popup", "notice"];
const ANNOUNCEMENT_POSITIONS = ["top", "bottom", "center"];

const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull().default("banner"),
  title: text("title").notNull(),
  content: text("content"),
  linkUrl: text("link_url"),
  bgColor: text("bg_color").default("#b08d57"),
  textColor: text("text_color").default("#ffffff"),
  isActive: integer("is_active").notNull().default(1),
  startDate: text("start_date"),
  endDate: text("end_date"),
  position: text("position").default("top"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// scheduled_changes — 예약 발행
// =============================================
const SCHEDULE_STATUSES = ["pending", "applied", "cancelled"];

const scheduledChanges = sqliteTable("scheduled_changes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: text("page").notNull(),
  section: text("section").notNull(),
  content: text("content").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status").notNull().default("pending"),
  createdBy: text("created_by").default("admin"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// media_files — 미디어 파일 관리
// =============================================
const mediaFiles = sqliteTable("media_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  alt: text("alt"),
  folder: text("folder").default("general"),
  uploadedBy: text("uploaded_by").default("admin"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// admin_users — 관리자 계정
// =============================================
const ADMIN_ROLES = ["admin", "editor", "viewer"];

const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("editor"),
  email: text("email"),
  isActive: integer("is_active").notNull().default(1),
  totpSecret: text("totp_secret"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// page_views — 페이지 방문 로그
// =============================================
const pageViews = sqliteTable("page_views", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: text("page"),
  path: text("path").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ip: text("ip"),
  sessionId: text("session_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// portal_users — 의뢰인 포털 계정
// =============================================
const portalUsers = sqliteTable("portal_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id"),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// case_files — 사건 관리
// =============================================
const CASE_STATUSES = ["접수", "진행", "완료"];

const caseFilesTable = sqliteTable("case_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("접수"),
  lawyerId: text("lawyer_id"),
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const caseDocuments = sqliteTable("case_documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  caseFileId: text("case_file_id").notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  uploadedBy: text("uploaded_by").default("admin"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

const caseMessages = sqliteTable("case_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  caseFileId: text("case_file_id").notNull(),
  senderId: text("sender_id"),
  senderType: text("sender_type").notNull().default("lawyer"),
  content: text("content").notNull(),
  isRead: integer("is_read").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// booking — 상담 예약 시스템
// =============================================
const bookingSlots = sqliteTable("booking_slots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lawyerId: text("lawyer_id"),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isAvailable: integer("is_available").notNull().default(1),
  consultationId: text("consultation_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

const bookingSettings = sqliteTable("booking_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lawyerId: text("lawyer_id"),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull().default("09:00"),
  endTime: text("end_time").notNull().default("18:00"),
  slotDuration: integer("slot_duration").notNull().default(60),
  isActive: integer("is_active").notNull().default(1),
});

// =============================================
// chatbot — 챗봇 Q&A
// =============================================
const chatbotQa = sqliteTable("chatbot_qa", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text("category").default("일반"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

const chatSessions = sqliteTable("chat_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(),
  messages: text("messages"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// reviews — 의뢰인 후기
// =============================================
const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientName: text("client_name").notNull(),
  rating: integer("rating").notNull().default(5),
  content: text("content").notNull(),
  category: text("category"),
  isPublished: integer("is_published").notNull().default(0),
  isAnonymous: integer("is_anonymous").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// newsletter_subscribers — 뉴스레터 구독
// =============================================
const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  name: text("name"),
  isActive: integer("is_active").notNull().default(1),
  unsubscribeToken: text("unsubscribe_token").$defaultFn(() => crypto.randomUUID()),
  subscribedAt: text("subscribed_at").notNull().default(sql`(datetime('now'))`),
  unsubscribedAt: text("unsubscribed_at"),
});

module.exports = {
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  FILE_TYPES,
  RELATION_TYPES,

  HERO_VIDEO_CATEGORIES,
  documents,
  categories,
  documentCategories,
  collections,
  documentCollections,
  documentRelations,
  highlights,

  heroVideos,
  LAWYER_POSITIONS,
  lawyers,
  CONSULTATION_CATEGORIES,
  CONSULTATION_STATUSES,
  consultations,
  BLOG_CATEGORIES,
  blogPosts,
  CASE_CATEGORIES,
  caseResults,
  CLIENT_SOURCES,
  clients,
  MESSAGE_CHANNELS,
  MESSAGE_STATUSES,
  messageTemplates,
  messageLogs,
  siteSettings,
  siteSettingsHistory,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_POSITIONS,
  announcements,
  SCHEDULE_STATUSES,
  scheduledChanges,
  mediaFiles,
  ADMIN_ROLES,
  adminUsers,
  pageViews,
  portalUsers,
  CASE_STATUSES,
  caseFilesTable,
  caseDocuments,
  caseMessages,
  bookingSlots,
  bookingSettings,
  chatbotQa,
  chatSessions,
  reviews,
  newsletterSubscribers,
};
