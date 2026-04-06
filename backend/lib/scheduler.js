/**
 * 예약 발행 스케줄러
 * - 60초 간격으로 scheduled_changes 테이블을 확인
 * - 발행 시간이 도래한 항목을 site_settings에 반영
 * - 변경 이력을 site_settings_history에 기록
 */
const { sqlite } = require("../db");
const crypto = require("crypto");

/** 스케줄러 시작 — 60초 간격으로 예약 발행 확인 및 적용 */
function startScheduler() {
  console.log("[Scheduler] 예약 발행 스케줄러 시작 (60초 간격)");

  setInterval(() => {
    try {
      const pending = sqlite.prepare(
        "SELECT * FROM scheduled_changes WHERE status = 'pending' AND scheduled_at <= datetime('now')"
      ).all();

      if (pending.length === 0) return;

      const upsertSetting = sqlite.prepare(
        "INSERT INTO site_settings (id, page, section, content, updated_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(page, section) DO UPDATE SET content = excluded.content, updated_at = datetime('now')"
      );
      const insertHistory = sqlite.prepare(
        "INSERT INTO site_settings_history (id, page, section, content, previous_content, changed_by, changed_at) VALUES (?, ?, ?, ?, ?, '스케줄러', datetime('now'))"
      );
      const markApplied = sqlite.prepare(
        "UPDATE scheduled_changes SET status = 'applied' WHERE id = ?"
      );
      const getCurrent = sqlite.prepare(
        "SELECT content FROM site_settings WHERE page = ? AND section = ?"
      );

      const applyAll = sqlite.transaction(() => {
        for (const change of pending) {
          const current = getCurrent.get(change.page, change.section);
          insertHistory.run(crypto.randomUUID(), change.page, change.section, change.content, current?.content || null);
          upsertSetting.run(crypto.randomUUID(), change.page, change.section, change.content);
          markApplied.run(change.id);
        }
      });

      applyAll();
      console.log(`[Scheduler] ${pending.length}건 예약 발행 적용 완료`);
    } catch (err) {
      console.error("[Scheduler Error]", err.message);
    }
  }, 60 * 1000);
}

module.exports = { startScheduler };
