/**
 * CoolSMS 문자 발송 서비스
 * - SMS(90바이트 이하) / LMS(90바이트 초과) 자동 전환
 * - 환경변수: COOLSMS_API_KEY, COOLSMS_API_SECRET, COOLSMS_SENDER
 */
const coolsms = require("coolsms-node-sdk").default;

const API_KEY = process.env.COOLSMS_API_KEY;
const API_SECRET = process.env.COOLSMS_API_SECRET;
const SENDER = process.env.COOLSMS_SENDER || "02-594-5583";

/**
 * SMS/LMS 발송
 * @param {string} to - 수신번호 (예: 010-1234-5678)
 * @param {string} text - 메시지 내용
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
async function sendSMS(to, text) {
  if (!API_KEY || !API_SECRET) {
    return { success: false, error: "CoolSMS API 키가 설정되지 않았습니다." };
  }

  try {
    const messageService = new coolsms(API_KEY, API_SECRET);
    // 하이픈/공백 제거하여 숫자만 추출
    const cleanTo = to.replace(/[-\s]/g, "");

    const result = await messageService.sendOne({
      to: cleanTo,
      from: SENDER.replace(/[-\s]/g, ""),
      text,
      // CoolSMS가 바이트 수에 따라 SMS/LMS 자동 전환
      autoTypeDetect: true,
    });

    return { success: true, messageId: result.messageId || result.groupId };
  } catch (err) {
    console.error("[SMS Error]", err.message || err);
    return { success: false, error: err.message || "문자 발송에 실패했습니다." };
  }
}

module.exports = { sendSMS };
