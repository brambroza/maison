/**
 * Nº 048 · สำนักประเมินมูลค่าไอเดียในห้องน้ำ — ตรรกะและสูตรประเมิน
 *
 * จับเวลาอาบน้ำ แล้วประเมินมูลค่ารวมของไอเดียธุรกิจที่ท่านคิดระหว่างนั้น
 * ตามหลักการของสมาคม: ยิ่งอาบนาน ไอเดียยิ่งแพง และจะระเหยเมื่อเช็ดตัวเสร็จ
 */

import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

type Verdict = { verdict: string; note: string };

/** ขอบเขตบนของแต่ละระดับ หน่วยเป็นวินาที ระดับสุดท้ายไม่มีขอบเขตบน */
const TIER_LIMITS: readonly number[] = [180, 480, 900, 1800];

/** คำวินิจฉัยเรียงตามระยะเวลาอาบ ลำดับในอาร์เรย์คือค่า v */
const VERDICTS: readonly Verdict[] = [
  {
    verdict: "อาบเร็วเกินกว่าไอเดียจะก่อตัว สมาคมประเมินได้เพียงแนวคิดตั้งต้น",
    note: "แนะนำให้ยืนนิ่ง ๆ ใต้ฝักบัวเพิ่มอีกสักครู่ในครั้งถัดไป",
  },
  {
    verdict: "ระยะเวลามาตรฐาน ได้ไอเดียคุณภาพปานกลางจำนวนหนึ่ง",
    note: "มูลค่าประเมิน ณ ขณะตัวเปียก และจะระเหยเมื่อเช็ดตัวเสร็จ",
  },
  {
    verdict: "ท่านสมาชิกเข้าสู่ภวังค์แห่งการประกอบการอย่างสมบูรณ์",
    note: "มูลค่าประเมิน ณ ขณะตัวเปียก และจะระเหยเมื่อเช็ดตัวเสร็จ",
  },
  {
    verdict: "สมาคมตรวจพบแผนธุรกิจระดับยูนิคอร์นอย่างน้อยหนึ่งแผนในการอาบครั้งนี้",
    note: "แผนดังกล่าวสูญหายระหว่างสระผม ตามระเบียบของจักรวาล",
  },
  {
    verdict: "ระยะเวลาระดับนี้ สมาคมมิอาจเรียกว่าการอาบน้ำ หากแต่เป็นการประชุมผู้ถือหุ้น",
    note: "ค่าน้ำที่เพิ่มขึ้นถือเป็นต้นทุนการวิจัยและพัฒนา",
  },
];

/** แปลงจำนวนวินาทีเป็นดัชนีคำวินิจฉัย */
export function verdictIndexFor(seconds: number): number {
  const index = TIER_LIMITS.findIndex((limit) => seconds < limit);
  return index === -1 ? VERDICTS.length - 1 : index;
}

/**
 * จำนวนไอเดียธุรกิจที่เกิดขึ้นระหว่างอาบ ตามอัตรามาตรฐานของสมาคม
 * (หนึ่งไอเดียต่อ 45 วินาที ขั้นต่ำหนึ่งไอเดีย)
 */
export function ideaCountFor(seconds: number): number {
  return Math.max(1, Math.floor(seconds / 45));
}

/**
 * มูลค่ารวมของไอเดีย หน่วยล้านบาท — deterministic จากวินาทีเพื่อให้การ์ดที่แชร์คงเดิม
 *
 * สูตร: เวลามีค่าวินาทีละแสนบาท บวกค่าความเปียกต่อไอเดีย
 */
export function valuationFor(seconds: number): number {
  const ideas = ideaCountFor(seconds);
  const millions = seconds * 0.1 + ideas * 1.3;
  return Math.round(millions * 10) / 10;
}

/** จัดรูปมูลค่าเป็นข้อความ เช่น "47.6 ล้านบาท" */
export function formatValuation(seconds: number): string {
  return `${valuationFor(seconds).toLocaleString("th-TH")} ล้านบาท`;
}

export const logic: PieceLogic = {
  verdictCount: VERDICTS.length,

  toOutcome(state: ShareState): Outcome {
    const verdict = VERDICTS[state.v] ?? VERDICTS[0];
    const seconds = state.s ?? 0;

    return {
      headline: formatValuation(seconds),
      verdict: `${ideaCountFor(seconds)} ไอเดีย · ${verdict.verdict}`,
      note: verdict.note,
    };
  },
};
