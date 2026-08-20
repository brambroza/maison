/**
 * Nº 077 · มาตรวัดพลังสังคม — ตรรกะและคำวินิจฉัย
 *
 * ประเมินพลังคงเหลือของท่านสมาชิกจากเหตุการณ์ที่เกิดขึ้นในวันนั้น
 */

import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

/** คำถามหนึ่งข้อพร้อมพลังที่สูญเสียหากตอบว่าใช่ */
export type Question = { text: string; drain: number };

/** พลังตั้งต้นของท่านสมาชิกทุกท่านในตอนเช้า */
export const FULL_ENERGY = 100;

/** ชุดคำถามประจำแบบประเมิน */
export const QUESTIONS: readonly Question[] = [
  { text: "วันนี้ท่านต้องสนทนากับผู้ที่ไม่รู้จักมาก่อน", drain: 20 },
  { text: "มีผู้ทักทายท่านในลิฟต์", drain: 15 },
  { text: "มีผู้โทรหาท่านโดยมิได้นัดหมายล่วงหน้า", drain: 25 },
  { text: "ท่านต้องเข้าร่วมประชุมอันจบได้ด้วยข้อความสองบรรทัด", drain: 20 },
  { text: "มีผู้ถามท่านว่า ว่างไหม", drain: 15 },
];

type Verdict = { label: string; verdict: string; note: string };

/** คำวินิจฉัยเรียงจากพลังน้อยไปมาก ลำดับในอาร์เรย์คือค่า v */
const VERDICTS: readonly Verdict[] = [
  {
    label: "พลังหมดสิ้น",
    verdict: "สมาคมขอเรียนว่าท่านสมาชิกไม่อยู่ในสภาพที่จะรับสายผู้ใดได้อีก",
    note: "ต้องการเวลาฟื้นฟูโดยลำพังประมาณ 2 วัน",
  },
  {
    label: "พลังเหลือน้อย",
    verdict: "ท่านยังพยักหน้าได้ แต่ไม่สามารถออกความเห็นเพิ่มเติมได้แล้ว",
    note: "ต้องการเวลาฟื้นฟูโดยลำพังประมาณ 1 วัน",
  },
  {
    label: "พลังปานกลาง",
    verdict: "ท่านสมาชิกยังรับการทักทายได้ แต่ขอสงวนสิทธิ์ในการตอบยาว",
    note: "ต้องการเวลาฟื้นฟูโดยลำพังประมาณ 4 ชั่วโมง",
  },
  {
    label: "พลังยังดี",
    verdict: "ท่านอยู่ในสภาพพร้อมสนทนา และอาจถึงขั้นตั้งคำถามกลับได้",
    note: "ต้องการเวลาฟื้นฟูโดยลำพังประมาณ 1 ชั่วโมง",
  },
  {
    label: "พลังเต็มเปี่ยม",
    verdict: "สมาคมตรวจแล้วพบว่าท่านยังอยากพบผู้คน กรณีนี้พบได้ยากมาก",
    note: "โปรดใช้พลังนี้อย่างระมัดระวัง",
  },
];

/**
 * คำนวณพลังคงเหลือจากข้อที่ท่านสมาชิกตอบว่าใช่
 *
 * @param answers - อาร์เรย์ความยาวเท่ากับ QUESTIONS ค่า true คือตอบว่าใช่
 */
export function energyFrom(answers: readonly boolean[]): number {
  const drained = QUESTIONS.reduce(
    (total, question, index) => (answers[index] ? total + question.drain : total),
    0,
  );
  return Math.max(0, FULL_ENERGY - drained);
}

/** แปลงพลังคงเหลือเป็นดัชนีคำวินิจฉัย */
export function verdictIndexFor(energy: number): number {
  const index = Math.floor(energy / 20);
  return Math.max(0, Math.min(VERDICTS.length - 1, index));
}

export const logic: PieceLogic = {
  verdictCount: VERDICTS.length,

  toOutcome(state: ShareState): Outcome {
    const verdict = VERDICTS[state.v] ?? VERDICTS[0];
    return {
      headline: state.s === undefined ? verdict.label : `พลัง ${state.s}%`,
      verdict: `${verdict.label} · ${verdict.verdict}`,
      note: verdict.note,
    };
  },
};
