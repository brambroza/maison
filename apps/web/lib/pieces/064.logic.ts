/**
 * Nº 064 · ปุ่มต้องห้าม — ตรรกะและคำวินิจฉัย
 *
 * ไฟล์ตรรกะต้องเป็น pure ทั้งหมด ห้าม import React
 * เพราะถูกใช้ทั้งจาก UI และจาก /api/og ที่วาดการ์ดแชร์
 */

import { formatCount } from "@/lib/ledger";
import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

/** คำวินิจฉัยหนึ่งระดับ — พาดหัวมาจากลำดับที่ จึงไม่เก็บไว้ที่นี่ */
type Verdict = { verdict: string; note: string };

/** คำวินิจฉัยเรียงตามระดับการฝ่าฝืน ลำดับในอาร์เรย์คือค่า v ที่ส่งผ่าน URL */
const VERDICTS: readonly Verdict[] = [
  {
    verdict: "สมาคมได้ขอความกรุณาไว้แล้วว่าอย่ากด ท่านสมาชิกกลับกด",
    note: "สมาคมรับไว้พิจารณา",
  },
  {
    verdict: "ครั้งแรกสมาคมยังพอเข้าใจได้ ครั้งที่สองนี้สมาคมเริ่มไม่เข้าใจ",
    note: "สมาคมรับไว้พิจารณา",
  },
  {
    verdict: "ท่านสมาชิกกดซ้ำจนสมาคมต้องเปิดแฟ้มประวัติของท่านขึ้นมาดู",
    note: "บันทึกไว้ในทะเบียนผู้ฝ่าฝืนแล้ว",
  },
  {
    verdict:
      "สมาคมขอเรียนตามตรงว่าไม่เคยพบผู้ใดกดมากเท่าท่าน และสมาคมก่อตั้งมานานพอสมควร",
    note: "บันทึกไว้ในทะเบียนผู้ฝ่าฝืนแล้ว",
  },
  {
    verdict:
      "ท่านสมาชิกได้รับการเสนอนามเข้าสู่ตำแหน่งผู้ฝ่าฝืนกิตติมศักดิ์ประจำปีเป็นที่เรียบร้อย",
    note: "สมาคมจะไม่ขออะไรท่านอีกแล้ว",
  },
];

/**
 * แปลงจำนวนครั้งที่กดเป็นดัชนีคำวินิจฉัย
 *
 * @param presses - จำนวนครั้งที่ท่านสมาชิกกดในรอบนี้ (เริ่มนับจาก 1)
 */
export function verdictIndexFor(presses: number): number {
  if (presses <= 1) return 0;
  if (presses === 2) return 1;
  if (presses <= 5) return 2;
  if (presses <= 9) return 3;
  return 4;
}

export const logic: PieceLogic = {
  verdictCount: VERDICTS.length,

  toOutcome(state: ShareState): Outcome {
    const verdict = VERDICTS[state.v] ?? VERDICTS[0];
    return {
      headline: state.s === undefined ? "ผู้ฝ่าฝืน" : `ลำดับที่ ${formatCount(state.s)}`,
      verdict: verdict.verdict,
      note: verdict.note,
    };
  },
};
