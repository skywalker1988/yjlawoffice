/**
 * 대시보드 API 라우트 — 문서 통계, 유형별/상태별 집계
 */
const { Router } = require("express");
const { db } = require("../db");
const {
  documents,
  tags,
  documentTags,
  categories,
  documentCategories,
} = require("../db/schema");
const { eq, desc, sql, gte, count } = require("drizzle-orm");

const router = Router();

// GET /api/sb/dashboard
router.get("/", async (req, res) => {
  try {
    const [totalResult] = await db
      .select({ total: count() })
      .from(documents)
      .where(sql`${documents.status} != 'archived'`);

    const byType = await db
      .select({ documentType: documents.documentType, count: count() })
      .from(documents)
      .where(sql`${documents.status} != 'archived'`)
      .groupBy(documents.documentType);

    const byStatus = await db
      .select({ status: documents.status, count: count() })
      .from(documents)
      .groupBy(documents.status);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);

    const [thisWeekResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(gte(documents.createdAt, sevenDaysAgo));

    const recentDocs = await db
      .select()
      .from(documents)
      .where(sql`${documents.status} != 'archived'`)
      .orderBy(desc(documents.createdAt))
      .limit(5);

    // Fetch tags for recent documents
    const recentIds = recentDocs.map((d) => d.id);
    const recentTagsByDoc = {};

    if (recentIds.length > 0) {
      const tagRows = await db
        .select({
          documentId: documentTags.documentId,
          tagId: tags.id,
          tagName: tags.name,
          tagColor: tags.color,
        })
        .from(documentTags)
        .innerJoin(tags, eq(documentTags.tagId, tags.id))
        .where(
          sql`${documentTags.documentId} IN (${sql.join(
            recentIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      for (const row of tagRows) {
        if (!recentTagsByDoc[row.documentId]) recentTagsByDoc[row.documentId] = [];
        recentTagsByDoc[row.documentId].push({
          id: row.tagId,
          name: row.tagName,
          color: row.tagColor,
        });
      }
    }

    const recentDocuments = recentDocs.map((doc) => ({
      ...doc,
      tags: recentTagsByDoc[doc.id] ?? [],
    }));

    const topTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        count: count(documentTags.documentId),
      })
      .from(tags)
      .leftJoin(documentTags, eq(tags.id, documentTags.tagId))
      .groupBy(tags.id)
      .orderBy(desc(count(documentTags.documentId)))
      .limit(20);

    const byCategory = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        count: count(documentCategories.documentId),
      })
      .from(categories)
      .leftJoin(documentCategories, eq(categories.id, documentCategories.categoryId))
      .groupBy(categories.id);

    res.json({
      data: {
        totalDocuments: totalResult.total,
        byType,
        byStatus,
        thisWeek: thisWeekResult.count,
        recentDocuments,
        topTags,
        byCategory,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
