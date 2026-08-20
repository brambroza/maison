/**
 * Nº 042 · สภาตัดสินใจว่ากินอะไรดี — ตรรกะและมติที่ประชุม
 *
 * คณะกรรมการจะประชุมเป็นเวลา 12 วินาทีตามระเบียบ แล้วลงมติ
 * ซึ่งเป็นมติเดียวกันทุกครั้งนับตั้งแต่ก่อตั้งสมาคม
 */

import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

/** ระยะเวลาการประชุมตามระเบียบสมาคม หน่วยเป็นวินาที */
export const DELIBERATION_SECONDS = 12;

type Resolution = { headline: string; verdict: string; note: string };

/** มติที่ประชุมทั้งหมด ลำดับในอาร์เรย์คือค่า v ที่ส่งผ่าน URL */
const RESOLUTIONS: readonly Resolution[] = [
  {
    headline: "อะไรก็ได้",
    verdict: "ที่ประชุมมีมติเป็นเอกฉันท์ภายหลังการอภิปรายอย่างกว้างขวาง",
    note: "มติผ่านด้วยคะแนน 9 ต่อ 0 งดออกเสียง 2",
  },
  {
    headline: "แล้วแต่ท่าน",
    verdict: "คณะกรรมการพิจารณาทุกทางเลือกแล้วขอมอบอำนาจกลับคืนแก่ท่าน",
    note: "ค่าเบี้ยประชุมคิดเป็นศูนย์บาทตามปกติ",
  },
  {
    headline: "อะไรก็ได้",
    verdict: "ที่ประชุมขอยืนยันมติเดิมโดยไม่มีการทบทวน",
    note: "วาระนี้เข้าสู่การพิจารณาเป็นครั้งที่ 4,180 แล้ว",
  },
  {
    headline: "ตามใจท่าน",
    verdict: "คณะกรรมการเห็นว่าท่านทราบคำตอบอยู่แล้วตั้งแต่ก่อนเปิดประชุม",
    note: "ที่ประชุมขอปิดวาระโดยไม่มีข้อโต้แย้ง",
  },
  {
    headline: "อะไรก็ได้",
    verdict: "มติผ่านโดยไม่มีผู้ใดเสนอทางเลือกอื่นตลอดการประชุม",
    note: "สมาคมขอบคุณที่ท่านให้เกียรติสอบถาม",
  },
];

/** สุ่มมติที่ประชุมหนึ่งฉบับ คืนค่าเป็นดัชนีสำหรับใส่ใน URL */
export function drawResolutionIndex(): number {
  return Math.floor(Math.random() * RESOLUTIONS.length);
}

export const logic: PieceLogic = {
  verdictCount: RESOLUTIONS.length,

  toOutcome(state: ShareState): Outcome {
    const resolution = RESOLUTIONS[state.v] ?? RESOLUTIONS[0];
    return {
      headline: resolution.headline,
      verdict: resolution.verdict,
      note: resolution.note,
    };
  },
};
