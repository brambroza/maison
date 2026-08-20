/**
 * Nº 055 · ใบรับรองการดองงาน — ตรรกะและถ้อยคำรับรอง
 *
 * ท่านสมาชิกระบุงานที่ดองไว้พร้อมระยะเวลา สมาคมจะออกใบรับรองให้
 * ชื่องานเป็นข้อความอิสระจากผู้ใช้ จึงถูกกรองและจำกัดความยาวก่อนขึ้นการ์ดเสมอ
 */

import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

type Verdict = { verdict: string; note: string };

/** ตัวเลือกระยะเวลาการดอง หน่วยเป็นวัน */
export const DURATION_OPTIONS: readonly { days: number; label: string }[] = [
  { days: 3, label: "ไม่กี่วัน" },
  { days: 14, label: "สองสัปดาห์" },
  { days: 90, label: "สามเดือน" },
  { days: 240, label: "แปดเดือน" },
  { days: 730, label: "เกินสองปี" },
];

/** ขอบเขตบนของแต่ละระดับ หน่วยเป็นวัน ระดับสุดท้ายไม่มีขอบเขตบน */
const TIER_LIMITS: readonly number[] = [7, 30, 180, 365];

/** ถ้อยคำรับรองเรียงตามระยะเวลาการดอง ลำดับในอาร์เรย์คือค่า v */
const VERDICTS: readonly Verdict[] = [
  {
    verdict: "สมาคมรับรองว่างานดังกล่าวยังอยู่ในระยะพักผ่อนตามปกติ",
    note: "ยังไม่ถือเป็นการดองอย่างเป็นทางการ",
  },
  {
    verdict: "งานดังกล่าวเข้าสู่สถานะดองอย่างสมบูรณ์ตามระเบียบสมาคม",
    note: "สมาคมออกใบรับรองฉบับนี้ให้โดยไม่มีเงื่อนไข",
  },
  {
    verdict: "สมาคมขอรับรองว่าท่านมีวินัยในการดองอย่างสม่ำเสมอ",
    note: "ผลงานอยู่ในระดับที่นำไปแสดงต่อสาธารณชนได้",
  },
  {
    verdict: "การดองของท่านยาวนานจนงานดังกล่าวได้กลายเป็นของสะสม",
    note: "สมาคมแนะนำให้เก็บรักษาในที่แห้งและไม่ต้องเปิดดู",
  },
  {
    verdict: "สมาคมขอมอบสถานะดองชั้นครูแก่ท่านสมาชิกโดยไม่ต้องสอบ",
    note: "งานดังกล่าวได้บรรลุสภาพเป็นมรดกทางวัฒนธรรมแล้ว",
  },
];

/** แปลงจำนวนวันเป็นดัชนีถ้อยคำรับรอง */
export function verdictIndexFor(days: number): number {
  const index = TIER_LIMITS.findIndex((limit) => days < limit);
  return index === -1 ? VERDICTS.length - 1 : index;
}

/** จัดรูประยะเวลาการดองเป็นข้อความอ่านง่าย */
export function formatDuration(days: number): string {
  if (days < 30) return `${days} วัน`;
  if (days < 365) return `${Math.round(days / 30)} เดือน`;

  const years = Math.floor(days / 365);
  const restMonths = Math.round((days % 365) / 30);
  return restMonths === 0 ? `${years} ปี` : `${years} ปี ${restMonths} เดือน`;
}

export const logic: PieceLogic = {
  verdictCount: VERDICTS.length,

  toOutcome(state: ShareState): Outcome {
    const verdict = VERDICTS[state.v] ?? VERDICTS[0];
    const task = state.t ?? "งานอันมิได้ระบุนาม";

    return {
      headline: state.s === undefined ? "ดองแล้ว" : `ดองแล้ว ${formatDuration(state.s)}`,
      verdict: `${task} · ${verdict.verdict}`,
      note: verdict.note,
    };
  },
};
