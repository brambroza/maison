/**
 * Nº 083 · สมาธิสนามจริง — ตรรกะและคำวินิจฉัย
 *
 * นั่งสมาธิ 45 วินาที ระหว่างนั้นจะมีเสียงป้าข้างบ้าน (สมมติ) นินทาแทรกเป็นระยะ
 * เพื่อฝึกจิตในสนามจริง — ท่านสมาชิกมีปุ่ม "เถียงในใจ" ยิ่งกดมาก จิตยิ่งไม่นิ่ง
 * บทนินทาทั้งหมดเป็นเรื่องสมมติ ไม่พาดพิงบุคคลจริง
 */

import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

/** ระยะเวลานั่งสมาธิ หน่วยวินาที */
export const SESSION_SECONDS = 45;

/** วินาทีที่เสียงนินทาจะดังแทรก นับจากเริ่ม */
export const GOSSIP_SCHEDULE: readonly number[] = [5, 12, 19, 27, 34, 41];

/** บทนินทาของป้าข้างบ้าน (บุคคลสมมติ พูดถึงบุคคลสมมติ) */
export const GOSSIP_LINES: readonly string[] = [
  "เห็นว่าบ้านหลังนั้นเพิ่งถอยรถใหม่ ผ่อนทั้งนั้นแหละ",
  "ลูกสาวบ้านโน้นกลับดึกทุกวัน ป้าไม่ได้ว่าอะไรนะ",
  "สมัยป้ายังสาว ผักกำละสองบาทเท่านั้น",
  "แต่งงานตั้งสามปีแล้วยังไม่มีข่าวดี ป้าก็เป็นห่วงเฉย ๆ",
  "หลานป้าสอบติดหมอนะ ไม่ได้อวดนะ เล่าให้ฟังเฉย ๆ",
  "บ้านหลังไหนไม่รู้ ตากผ้าทีเสาแทบหัก ป้าเห็นมาหมดแล้ว",
];

type Verdict = { label: string; verdict: string; note: string };

/** คำวินิจฉัยตามจำนวนครั้งที่เถียงในใจ ลำดับในอาร์เรย์คือค่า v */
const VERDICTS: readonly Verdict[] = [
  {
    label: "จิตนิ่งดุจน้ำในโอ่ง",
    verdict: "เสียงนินทาผ่านหูท่านดั่งสายลม สมาคมขอถวายสมัญญา ผู้บรรลุแห่งซอย",
    note: "ท่านพร้อมแล้วสำหรับวงญาติช่วงเทศกาล",
  },
  {
    label: "จิตกระเพื่อมพองาม",
    verdict: "ท่านเถียงในใจเพียงเล็กน้อย ซึ่งสมาคมถือว่าเป็นธรรมชาติของมนุษย์",
    note: "ป้ามิได้ยินสิ่งที่ท่านเถียง ทุกอย่างปลอดภัย",
  },
  {
    label: "จิตยังยึดติดกับความถูกต้อง",
    verdict: "ท่านมีเรื่องอยากชี้แจงมากเกินกว่าจะเรียกว่าสมาธิ",
    note: "สมาคมแนะนำให้ฝึกซ้ำในวันที่ป้าเผลอ",
  },
  {
    label: "แพ้ป้าโดยสมบูรณ์",
    verdict: "ท่านเถียงในใจแทบทุกประโยค สมาคมขอเรียนว่านั่นคือการประชุมมิใช่การนั่งสมาธิ",
    note: "ป้าชนะไปอีกหนึ่งวัน ตามสถิติตลอดกาล",
  },
];

/** แปลงจำนวนครั้งที่เถียงในใจเป็นดัชนีคำวินิจฉัย */
export function verdictIndexFor(objections: number): number {
  if (objections === 0) return 0;
  if (objections <= 2) return 1;
  if (objections <= 4) return 2;
  return 3;
}

/** ป้ายกำกับระดับ ใช้แสดงในหน้าเว็บ */
export function labelFor(index: number): string {
  return (VERDICTS[index] ?? VERDICTS[0]).label;
}

export const logic: PieceLogic = {
  verdictCount: VERDICTS.length,

  toOutcome(state: ShareState): Outcome {
    const verdict = VERDICTS[state.v] ?? VERDICTS[0];
    const objections = state.s ?? 0;

    return {
      headline: verdict.label,
      verdict: `เถียงในใจ ${objections} ครั้งใน ${SESSION_SECONDS} วินาที · ${verdict.verdict}`,
      note: verdict.note,
    };
  },
};
