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
// tags — 자유 태그
// =============================================
const tags = sqliteTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  color: text("color").default("#6366f1"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// document_tags — 문서-태그 N:N
// =============================================
const documentTags = sqliteTable("document_tags", {
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.documentId, table.tagId] }),
]);

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
// history_events — 세계사 이벤트
// =============================================
const HISTORY_CATEGORIES = [
  "politics",    // 정치
  "war",         // 전쟁
  "economy",     // 경제
  "culture",     // 문화
  "science",     // 과학
  "law",         // 법률
  "society",     // 사회
  "diplomacy",   // 외교
];

const historyEvents = sqliteTable("history_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  year: integer("year").notNull(),
  month: integer("month"),
  day: integer("day"),
  endYear: integer("end_year"),
  category: text("category").notNull().default("politics"),
  region: text("region"),              // 동아시아, 유럽, 중동, 미주 등
  country: text("country"),
  importance: integer("importance").notNull().default(3), // 1-5
  latitude: real("latitude"),
  longitude: real("longitude"),
  source: text("source"),
  relatedDocumentId: text("related_document_id").references(() => documents.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
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

module.exports = {
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  FILE_TYPES,
  RELATION_TYPES,
  HISTORY_CATEGORIES,
  HERO_VIDEO_CATEGORIES,
  documents,
  tags,
  documentTags,
  categories,
  documentCategories,
  collections,
  documentCollections,
  documentRelations,
  highlights,
  historyEvents,
  heroVideos,
  LAWYER_POSITIONS,
  lawyers,
};
