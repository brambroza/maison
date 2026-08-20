/**
 * Nº 031 · สำนักแปลคำว่าไม่เป็นไร — ตรรกะและคำแปล
 *
 * ท่านสมาชิกเลือกว่าผู้ใดเป็นผู้กล่าว แล้วสำนักแปลจะถอดความหมายอันแท้จริงให้
 */

import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

type Translation = {
  /** ตัวเลือกที่แสดงให้ท่านสมาชิกกด */
  speaker: string;
  /** คำแปลสั้น ใช้เป็นพาดหัวบนการ์ด */
  headline: string;
  /** คำอธิบายฉบับสำนักแปล */
  verdict: string;
  /** ข้อปฏิบัติที่สมาคมแนะนำ */
  note: string;
};

/** คำแปลทั้งหมด ลำดับในอาร์เรย์คือค่า v ที่ส่งผ่าน URL */
const TRANSLATIONS: readonly Translation[] = [
  {
    speaker: "คนรัก",
    headline: "เป็นไร",
    verdict: "สำนักแปลยืนยันว่าเป็นไร และเป็นไรมาแล้วประมาณสามวัน",
    note: "ห้ามตอบว่า อ้าว ก็บอกว่าไม่เป็นไร",
  },
  {
    speaker: "หัวหน้างาน",
    headline: "เป็นไรมาก",
    verdict: "ถ้อยคำนี้แปลว่าท่านจะได้ทราบว่าเป็นไรในการประชุมวันจันทร์",
    note: "โปรดเตรียมเอกสารประกอบให้ครบถ้วน",
  },
  {
    speaker: "เพื่อนร่วมงาน",
    headline: "เป็นไรพอประมาณ",
    verdict: "แปลว่าเป็นไร แต่ยังไม่ถึงขั้นเล่าให้คนทั้งแผนกฟัง",
    note: "ชงกาแฟให้สักแก้วจะช่วยได้มาก",
  },
  {
    speaker: "มารดา",
    headline: "เป็นไรมาก",
    verdict: "สำนักแปลตรวจแล้วพบว่าเป็นไรมาตั้งแต่ท่านยังไม่โทรกลับ",
    note: "โปรดโทรกลับภายในวันนี้",
  },
  {
    speaker: "พนักงานร้าน",
    headline: "ไม่เป็นไร",
    verdict: "เป็นกรณีเดียวในภาษาไทยที่ไม่เป็นไรแปลว่าไม่เป็นไรจริง",
    note: "สำนักแปลขอชื่นชมความตรงไปตรงมา",
  },
];

/** รายชื่อผู้กล่าวทั้งหมด ใช้สร้างปุ่มตัวเลือกในหน้าเว็บ */
export function listSpeakers(): readonly string[] {
  return TRANSLATIONS.map((item) => item.speaker);
}

export const logic: PieceLogic = {
  verdictCount: TRANSLATIONS.length,

  toOutcome(state: ShareState): Outcome {
    const translation = TRANSLATIONS[state.v] ?? TRANSLATIONS[0];
    return {
      headline: translation.headline,
      verdict: `${translation.speaker}กล่าวว่าไม่เป็นไร · ${translation.verdict}`,
      note: translation.note,
    };
  },
};
