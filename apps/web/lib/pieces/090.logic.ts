/**
 * Nº 090 · ห้องรอเสียงตู้ม — ตรรกะและถ้อยแถลง
 *
 * เสียงตู้มดังปีละครั้ง สมาคมไม่เปิดเผยวันเวลา
 * ท่านสมาชิกทำได้เพียงลงชื่อเป็นผู้เฝ้ารอและรับหมายเลขประจำตัว
 */

import { formatCount } from "@/lib/ledger";
import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

type Verdict = { verdict: string; note: string };

/** ถ้อยแถลงสำหรับผู้เฝ้ารอ ลำดับในอาร์เรย์คือค่า v ที่ส่งผ่าน URL */
const VERDICTS: readonly Verdict[] = [
  {
    verdict: "ท่านสมาชิกได้ลงชื่อเป็นผู้เฝ้ารอเสียงตู้มประจำปีอย่างสมบูรณ์แล้ว",
    note: "สมาคมจะไม่แจ้งวันเวลาแก่ผู้ใดทั้งสิ้น",
  },
  {
    verdict: "สมาคมรับท่านเข้าห้องรับรองผู้เฝ้ารอเป็นการเรียบร้อย",
    note: "โปรดอย่าถามว่าอีกนานไหม สมาคมจะไม่ตอบ",
  },
  {
    verdict: "ท่านได้รับสิทธิ์รอฟังเสียงตู้มตลอดปีโดยไม่มีค่าใช้จ่าย",
    note: "ผู้พลาดเสียงตู้มปีก่อนมีจำนวน 41,003 ท่าน",
  },
];

/** สุ่มถ้อยแถลงหนึ่งฉบับ คืนค่าเป็นดัชนีสำหรับใส่ใน URL */
export function drawVerdictIndex(): number {
  return Math.floor(Math.random() * VERDICTS.length);
}

export const logic: PieceLogic = {
  verdictCount: VERDICTS.length,

  toOutcome(state: ShareState): Outcome {
    const verdict = VERDICTS[state.v] ?? VERDICTS[0];
    return {
      headline:
        state.s === undefined ? "ผู้เฝ้ารอ" : `ผู้เฝ้ารอหมายเลข ${formatCount(state.s)}`,
      verdict: verdict.verdict,
      note: verdict.note,
    };
  },
};
