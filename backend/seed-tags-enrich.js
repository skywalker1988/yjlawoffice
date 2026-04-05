const { db } = require("./db");
const { documents, tags, documentTags } = require("./db/schema");
const { eq, like } = require("drizzle-orm");

// 추가할 태그들
const EXTRA_TAGS = [
  "고대", "중세", "근세", "근대", "현대", "21세기",
  "동아시아", "유럽", "북미", "중동", "중남미", "중앙아시아",
  "인권", "헌법", "국제법", "민법", "형법",
  "혁명", "독립운동", "식민지",
  "과학혁명", "산업혁명", "기술",
  "냉전", "세계대전", "제국주의",
  "무역", "금융", "자본주의",
  "대한민국", "일본", "중국", "프랑스", "영국", "미국", "독일", "러시아",
];

// 문서 제목 → 추가할 태그 매핑
const DOC_TAG_MAP = {
  "함무라비": ["고대", "중동", "민법", "형법"],
  "로마 12표법": ["고대", "유럽", "민법", "형법"],
  "알렉산드로스": ["고대", "유럽", "제국주의"],
  "진시황": ["고대", "동아시아", "중국", "제국주의"],
  "한니발": ["고대", "유럽"],
  "로마 제국 멸망": ["고대", "유럽"],
  "마그나 카르타": ["중세", "유럽", "영국", "헌법", "인권"],
  "몽골 제국": ["중세", "중앙아시아", "제국주의"],
  "흑사병": ["중세", "유럽"],
  "구텐베르크": ["중세", "유럽", "독일", "과학혁명", "기술"],
  "콜럼버스": ["근세", "유럽", "중남미", "제국주의", "식민지"],
  "임진왜란": ["근세", "동아시아", "대한민국", "일본"],
  "웨스트팔리아": ["근세", "유럽", "독일", "국제법"],
  "뉴턴": ["근세", "유럽", "영국", "과학혁명"],
  "미국 독립선언": ["근세", "북미", "미국", "헌법", "인권", "혁명"],
  "프랑스 대혁명": ["근대", "유럽", "프랑스", "혁명", "인권", "헌법"],
  "나폴레옹 법전": ["근대", "유럽", "프랑스", "민법", "국제법"],
  "산업혁명": ["근대", "유럽", "영국", "산업혁명", "자본주의"],
  "메이지 유신": ["근대", "동아시아", "일본", "혁명"],
  "대한제국": ["근대", "동아시아", "대한민국", "독립운동"],
  "제1차 세계대전": ["현대", "유럽", "세계대전", "제국주의"],
  "러시아 혁명": ["현대", "유럽", "러시아", "혁명", "자본주의"],
  "3·1 운동": ["현대", "동아시아", "대한민국", "독립운동", "인권"],
  "제2차 세계대전": ["현대", "유럽", "세계대전", "인권"],
  "UN 창설": ["현대", "북미", "미국", "국제법", "인권"],
  "세계인권선언": ["현대", "유럽", "프랑스", "국제법", "인권", "헌법"],
  "대한민국 정부 수립": ["현대", "동아시아", "대한민국", "헌법", "독립운동"],
  "한국전쟁": ["현대", "동아시아", "대한민국", "냉전", "미국"],
  "유럽경제공동체": ["현대", "유럽", "무역", "자본주의"],
  "아폴로 11호": ["현대", "북미", "미국", "과학혁명", "기술", "냉전"],
  "베를린 장벽": ["현대", "유럽", "독일", "냉전", "혁명"],
  "9·11": ["21세기", "북미", "미국"],
  "글로벌 금융위기": ["21세기", "북미", "미국", "금융", "자본주의"],
  "파리 기후변화": ["21세기", "유럽", "프랑스", "국제법"],
  "COVID-19": ["21세기", "동아시아", "중국"],
};

async function seed() {
  // 1. 모든 태그 생성
  console.log("Creating tags...");
  const tagMap = {};
  for (const name of EXTRA_TAGS) {
    const existing = await db.select().from(tags).where(eq(tags.name, name));
    if (existing.length > 0) {
      tagMap[name] = existing[0].id;
    } else {
      const [t] = await db.insert(tags).values({ name, color: "#6366f1" }).returning();
      tagMap[name] = t.id;
      console.log(`  + 태그 생성: ${name}`);
    }
  }

  // 2. 기존 태그 ID도 가져오기
  const allTags = await db.select().from(tags);
  for (const t of allTags) tagMap[t.name] = t.id;

  // 3. 모든 문서에 태그 추가
  const allDocs = await db.select().from(documents);
  console.log(`\nProcessing ${allDocs.length} documents...`);

  for (const doc of allDocs) {
    // 제목에서 매칭되는 태그 찾기
    const matchedTags = [];
    for (const [keyword, tagNames] of Object.entries(DOC_TAG_MAP)) {
      if (doc.title.includes(keyword)) {
        matchedTags.push(...tagNames);
      }
    }

    if (matchedTags.length === 0) continue;

    // 중복 제거 후 삽입
    const uniqueTags = [...new Set(matchedTags)];
    let added = 0;
    for (const tagName of uniqueTags) {
      const tagId = tagMap[tagName];
      if (!tagId) continue;
      try {
        await db.insert(documentTags).values({ documentId: doc.id, tagId });
        added++;
      } catch { /* duplicate, skip */ }
    }
    if (added > 0) console.log(`  ✓ ${doc.title.slice(0, 35)} → +${added}개 태그`);
  }

  console.log("\nDone!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
