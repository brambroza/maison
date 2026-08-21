/**
 * Nº 026 · คนแปลกหน้าประจำวัน — ตรรกะและคำชม
 *
 * สมาคมจัดสรรคนแปลกหน้าหนึ่งท่านต่อวัน มากล่าวคำชมหนึ่งประโยคแล้วจากไป
 * ไม่ต้องตอบกลับ ไม่ต้องคุยต่อ — คนแปลกหน้าเป็นคนเดียวกันทั้งประเทศในวันนั้น
 * (deterministic ต่อวันแบบเดียวกับ ledger เพื่อให้ทุกคนได้คนเดียวกัน)
 */

import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

/** ชดเชยเวลาไทย ให้คนแปลกหน้าเปลี่ยนตอนเที่ยงคืนตามเวลาประเทศไทย */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/** รายนามคนแปลกหน้าในสังกัดสมาคม — บุคคลสมมติทั้งหมด */
export const STRANGERS: readonly string[] = [
  "คุณประเสริฐจากปากซอย",
  "ป้าน้อยจากตลาดเช้า",
  "พี่วินมอเตอร์ไซค์คิวที่สาม",
  "คุณมาลีจากร้านของชำ",
  "น้องฝึกงานจากออฟฟิศข้าง ๆ",
  "ลุงข้างบ้านที่รดน้ำต้นไม้ทุกเช้า",
  "คุณสมศรีจากคิวรถสองแถว",
];

type Compliment = { line: string; note: string };

/** คำชมประจำสมาคม ลำดับในอาร์เรย์คือค่า v ที่ส่งผ่าน URL */
const COMPLIMENTS: readonly Compliment[] = [
  {
    line: "เก่งมากแล้ววันนี้",
    note: "กล่าวจบแล้วเดินจากไปโดยไม่รอคำตอบ ตามระเบียบสมาคม",
  },
  {
    line: "วันนี้ท่านทำดีที่สุดแล้ว พักได้",
    note: "ผู้กล่าวยกมือไหว้หนึ่งครั้งแล้วขึ้นรถเมล์ไป",
  },
  {
    line: "เท่าที่เห็นมาทั้งซอย ถือว่าท่านเก่งมาก",
    note: "ผู้กล่าวมิได้เห็นอะไรมาก แต่กล่าวด้วยความจริงใจ",
  },
  {
    line: "ไม่ต้องเพิ่มอะไรแล้ว วันนี้พอแล้ว",
    note: "กล่าวพร้อมพยักหน้าอย่างหนักแน่นหนึ่งครั้ง",
  },
  {
    line: "ที่ทำอยู่นั้นถูกแล้ว ทำต่อไปเถิด",
    note: "ผู้กล่าวไม่ทราบว่าท่านทำอะไรอยู่ แต่เชื่อมั่นในตัวท่าน",
  },
];

/** แฮช 32 บิตแบบเดียวกับ ledger ใช้เลือกคนและคำชมประจำวัน */
function hash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * คนแปลกหน้าและคำชมประจำวัน — ค่าเดิมทั้งวัน เปลี่ยนตอนเที่ยงคืนเวลาไทย
 *
 * @param now - เวลาอ้างอิง ใส่ได้เพื่อให้ทดสอบง่าย
 * @returns ดัชนีคนแปลกหน้า (สำหรับ s) และดัชนีคำชม (สำหรับ v)
 */
export function dailyStranger(now: number = Date.now()): { nameIndex: number; complimentIndex: number } {
  const day = Math.floor((now + BANGKOK_OFFSET_MS) / DAY_MS);
  return {
    nameIndex: hash32(`stranger:${day}`) % STRANGERS.length,
    complimentIndex: hash32(`compliment:${day}`) % COMPLIMENTS.length,
  };
}

export const logic: PieceLogic = {
  verdictCount: COMPLIMENTS.length,

  toOutcome(state: ShareState): Outcome {
    const compliment = COMPLIMENTS[state.v] ?? COMPLIMENTS[0];
    const name = STRANGERS[(state.s ?? 0) % STRANGERS.length];

    return {
      headline: compliment.line,
      verdict: `${name} กล่าวแก่ท่านสมาชิก แล้วจากไปตามระเบียบ`,
      note: compliment.note,
    };
  },
};
