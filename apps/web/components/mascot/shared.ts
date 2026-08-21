import type { ButlerMood } from "@/lib/mascot/chatter";

/**
 * สัญญาณเคอร์เซอร์ที่ส่งจากชั้น DOM เข้าไปในฉากสามมิติ
 *
 * ส่งผ่าน ref ที่แก้ค่าในที่เดิม ไม่ใช่ props ปกติ
 * เพราะเมาส์ขยับถี่กว่าที่ React ควรจะ re-render ตาม
 */
export type PointerSignal = {
  /** พิกัดในระบบของกล้อง ช่วง -1 ถึง 1 โดย y ชี้ขึ้น */
  ndcX: number;
  ndcY: number;
  /** เคอร์เซอร์อยู่ในกรอบเวทีหรือไม่ */
  inside: boolean;
  /** เวลาที่ขยับครั้งล่าสุด หน่วยเดียวกับ performance.now() */
  movedAt: number;
  /** ความเร็วเฉลี่ยของเคอร์เซอร์ หน่วยเป็นสัดส่วนของจอต่อวินาที */
  speed: number;
  /** นับขึ้นหนึ่งทุกครั้งที่ท่านสมาชิกแตะตัวบัตเลอร์ */
  pokes: number;
  /** ถูกสั่งให้ถอยไปยืนข้าง ๆ เพราะมีสิ่งสำคัญกว่าอยู่กลางจอ */
  aside: boolean;
  /** กำลังยืนถามคำถามอยู่ ต้องหยุดเดินและหันมาหาท่านสมาชิก */
  asking: boolean;
};

/** ค่าเริ่มต้นก่อนท่านสมาชิกขยับเมาส์ครั้งแรก */
export function createPointerSignal(): PointerSignal {
  return { ndcX: 0, ndcY: -0.2, inside: false, movedAt: 0, speed: 0, pokes: 0, aside: false, asking: false };
}

/** สิ่งที่ฉากสามมิติรายงานกลับออกมาให้ชั้น DOM ทุกเฟรม */
export type MascotReport = {
  /** ตำแหน่งหัวบัตเลอร์บนจอ หน่วยพิกเซลเทียบกับกรอบเวที */
  x: number;
  y: number;
  /** ความกว้างของกรอบเวที ใช้กันป้ายคำพูดหลุดขอบ */
  width: number;
};

/** ฉากสามมิติแจ้งเปลี่ยนอารมณ์ออกมาให้ชั้น DOM หยิบถ้อยคำมาแสดง */
export type MoodListener = (mood: ButlerMood) => void;
