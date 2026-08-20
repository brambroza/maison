/**
 * Nº 018 · นาฬิกาแป๊บนึง — ตรรกะและคำวินิจฉัย
 *
 * จับเวลาตั้งแต่ท่านสมาชิกกล่าวคำว่า "แป๊บนึง" จนกระทั่งกลับมา
 * แล้วออกคำวินิจฉัยตามระยะเวลาที่วัดได้
 */

import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

type Verdict = { verdict: string; note: string };

/** ขอบเขตบนของแต่ละระดับ หน่วยเป็นวินาที ระดับสุดท้ายไม่มีขอบเขตบน */
const TIER_LIMITS: readonly number[] = [30, 120, 600, 3600];

/** คำวินิจฉัยเรียงตามระยะเวลา ลำดับในอาร์เรย์คือค่า v */
const VERDICTS: readonly Verdict[] = [
  {
    verdict: "แป๊บนึงของท่านสมาชิกตรงตามคำนิยามในพจนานุกรมทุกประการ",
    note: "สมาคมขอยกย่องความซื่อตรงของท่าน",
  },
  {
    verdict: "เป็นแป๊บนึงมาตรฐาน อยู่ในเกณฑ์ที่สังคมยอมรับได้โดยดุษณี",
    note: "สมาคมบันทึกไว้ว่าปกติ",
  },
  {
    verdict: "แป๊บนึงของท่านยาวกว่าแป๊บนึงสากลอยู่พอสมควร",
    note: "ผู้รอฟังคำว่าแป๊บนึงของท่านควรได้รับแจ้งล่วงหน้า",
  },
  {
    verdict: "สมาคมขอเรียนว่าสิ่งนั้นมิใช่แป๊บนึงแล้ว หากแต่เป็นการเดินทาง",
    note: "โปรดพิจารณาเปลี่ยนถ้อยคำก่อนออกจากบ้าน",
  },
  {
    verdict: "แป๊บนึงของท่านยาวนานจนสมาคมต้องตั้งคณะกรรมการสอบข้อเท็จจริง",
    note: "ผู้รอท่านอยู่ได้เปลี่ยนแผนการทั้งวันไปแล้ว",
  },
];

/** แปลงจำนวนวินาทีเป็นดัชนีคำวินิจฉัย */
export function verdictIndexFor(seconds: number): number {
  const index = TIER_LIMITS.findIndex((limit) => seconds < limit);
  return index === -1 ? VERDICTS.length - 1 : index;
}

/**
 * จัดรูประยะเวลาเป็นข้อความภาษาไทยแบบอ่านง่าย
 *
 * @param seconds - ระยะเวลาเป็นวินาที
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} วินาที`;

  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  if (minutes < 60) {
    return restSeconds === 0 ? `${minutes} นาที` : `${minutes} นาที ${restSeconds} วินาที`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes === 0 ? `${hours} ชั่วโมง` : `${hours} ชั่วโมง ${restMinutes} นาที`;
}

export const logic: PieceLogic = {
  verdictCount: VERDICTS.length,

  toOutcome(state: ShareState): Outcome {
    const verdict = VERDICTS[state.v] ?? VERDICTS[0];
    return {
      headline: state.s === undefined ? "แป๊บนึง" : formatDuration(state.s),
      verdict: verdict.verdict,
      note: verdict.note,
    };
  },
};
