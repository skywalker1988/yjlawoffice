/**
 * 블로그 서비스 — 블로그/법률 칼럼 CRUD 비즈니스 로직
 */
const { db } = require("../db");
const { blogPosts } = require("../db/schema");
const { eq, desc, and, count } = require("drizzle-orm");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  nowTimestamp,
} = require("./helpers");

/**
 * 제목에서 URL-safe 슬러그를 생성한다.
 * 한글은 유지하고 특수문자만 제거, 타임스탬프 접미사를 붙여 유일성 보장.
 * @param {string} title
 * @returns {string}
 */
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}

/**
 * 게시글 목록 조회 (페이지네이션 + 카테고리 필터)
 * @param {object} filters - { page, limit, category, all }
 * @returns {{ items: Array, meta: object }}
 */
async function listPosts(filters) {
  const { page, limit, offset } = parsePagination(filters, { maxLimit: 50 });
  const includeUnpublished = filters.all === "true";

  const conditions = [];
  if (!includeUnpublished) {
    conditions.push(eq(blogPosts.isPublished, 1));
  }
  if (filters.category) {
    conditions.push(eq(blogPosts.category, filters.category));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ total: count() })
    .from(blogPosts)
    .where(where);

  const rows = await db
    .select()
    .from(blogPosts)
    .where(where)
    .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    meta: buildPaginationMeta(totalResult.total, page, limit),
  };
}

/**
 * 슬러그로 게시글을 조회하고 조회수를 1 증가시킨다.
 * @param {string} slug
 * @param {{ skipIncrement?: boolean }} options - 조회수 증가 스킵 여부
 * @returns {object} 게시글
 */
async function getPost(slug, options = {}) {
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug));

  if (!post) {
    throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  }

  if (!options.skipIncrement) {
    await db
      .update(blogPosts)
      .set({ viewCount: post.viewCount + 1 })
      .where(eq(blogPosts.id, post.id));
    return { ...post, viewCount: post.viewCount + 1 };
  }

  return post;
}

/**
 * 게시글 생성
 * @param {object} data - { title, content, slug?, category?, excerpt?, author?, thumbnailUrl?, isPublished? }
 * @returns {object} 생성된 게시글
 */
async function createPost(data) {
  const { title, category, excerpt, content, author, thumbnailUrl, isPublished, slug: customSlug } = data;

  if (!title || !content) {
    throw new ServiceError("title과 content는 필수입니다", 400);
  }

  const slug = customSlug || generateSlug(title);
  const now = nowTimestamp();

  try {
    const [inserted] = await db
      .insert(blogPosts)
      .values({
        title,
        slug,
        category: category ?? "legal_column",
        excerpt: excerpt ?? null,
        content,
        author: author ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        isPublished: isPublished ? 1 : 0,
        publishedAt: isPublished ? now : null,
      })
      .returning();

    return inserted;
  } catch (e) {
    if (e.message?.includes("UNIQUE constraint")) {
      throw new ServiceError("이미 존재하는 슬러그입니다", 409);
    }
    throw e;
  }
}

/**
 * 게시글 수정
 * @param {string} id - 게시글 UUID
 * @param {object} data - 수정할 필드
 * @returns {object} 수정된 게시글
 */
async function updatePost(id, data) {
  validateUUID(id);

  const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!existing) {
    throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  }

  const updateData = {};
  const allowedFields = ["title", "slug", "category", "excerpt", "content", "author", "thumbnailUrl", "isPublished"];
  for (const key of allowedFields) {
    if (key in data) updateData[key] = data[key];
  }

  // 발행 상태 변경 시 publishedAt 설정
  if ("isPublished" in data) {
    updateData.isPublished = data.isPublished ? 1 : 0;
    if (data.isPublished && !existing.publishedAt) {
      updateData.publishedAt = nowTimestamp();
    }
  }

  updateData.updatedAt = nowTimestamp();

  const [updated] = await db
    .update(blogPosts)
    .set(updateData)
    .where(eq(blogPosts.id, id))
    .returning();

  return updated;
}

/**
 * 게시글 삭제
 * @param {string} id - 게시글 UUID
 * @returns {{ deleted: true }}
 */
async function deletePost(id) {
  validateUUID(id);

  const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!existing) {
    throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  }

  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  return { deleted: true };
}

module.exports = {
  generateSlug,
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
};
