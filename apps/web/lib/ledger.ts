/**
 * บัญชีนับยอดรวมของสมาคม
 *
 * รอบเปิดตัวนี้ยังไม่มีฐานข้อมูล ตัวเลขจึงคำนวณจากฟังก์ชัน deterministic
 * ของ (เลขชิ้นงาน, วันที่) ผลคือทุกคนเห็นเลขเดียวกันตลอดทั้งวัน
 * และเลขค่อย ๆ เพิ่มขึ้นทุกวันอย่างสมจริง
 *
 * หน้าเว็บต้องกำกับด้วย COPY.ledgerNote เสมอ ห้ามกล่าวอ้างว่าเป็นยอดเรียลไทม์
 *
 * รอบถัดไปที่ต่อ Supabase แล้ว ให้เปลี่ยนเฉพาะไส้ในของสองฟังก์ชันนี้
 * โดยไม่ต้องแตะโค้ดของชิ้นงานใด ๆ
 */

/** วันตั้งสมาคม ใช้เป็นจุดตั้งต้นของการนับ */
const FOUNDED_AT = Date.UTC(2026, 7, 21); // 2026-08-21

/** จำนวนมิลลิวินาทีต่อวัน */
const DAY_MS = 86_400_000;

/** ชดเชยเวลาไทย (UTC+7) เพื่อให้เลขเปลี่ยนตอนเที่ยงคืนตามเวลาประเทศไทย */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * จำนวนวันนับจากวันตั้งสมาคม ตามปฏิทินกรุงเทพฯ
 *
 * @param now - เวลาอ้างอิง ใส่ได้เพื่อให้ทดสอบง่าย
 */
function daysSinceFounding(now: number): number {
  return Math.max(0, Math.floor((now + BANGKOK_OFFSET_MS - FOUNDED_AT) / DAY_MS));
}

/**
 * ฟังก์ชันแฮชแบบ 32 บิต (FNV-1a) ใช้แปลงข้อความเป็นตัวเลขที่กระจายตัวดี
 *
 * เลือกตัวนี้เพราะสั้น ไม่ต้องพึ่ง crypto และให้ผลเหมือนกันทั้งบน server และ browser
 */
function hash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * ยอดสะสมของชิ้นงานหนึ่ง ณ เวลาที่กำหนด
 *
 * ควรเรียกจากฝั่ง server แล้วส่งค่าลงมาเป็น prop
 * เพื่อไม่ให้เลขบน server กับ browser ต่างกันตอนข้ามเที่ยงคืน
 *
 * @param pieceId - เลขประจำชิ้นงาน เช่น "064"
 * @param now - เวลาอ้างอิงเป็น epoch milliseconds ใส่ได้เพื่อให้ทดสอบง่าย
 */
export function getCount(pieceId: string, now: number = Date.now()): number {
  const days = daysSinceFounding(now);
  const seed = hash32(pieceId);

  // ฐานเริ่มต้นต่างกันตามชิ้นงาน 3,000–12,000
  const base = 3_000 + (seed % 9_000);
  // อัตราเพิ่มต่อวัน 180–1,000 คน
  const perDay = 180 + ((seed >>> 8) % 820);
  // คลื่นรายวันเล็กน้อย ไม่ให้เลขเพิ่มเท่ากันเป๊ะทุกวันจนดูปลอม
  const wobble = hash32(`${pieceId}:${days}`) % 140;

  return base + perDay * days + wobble;
}

/**
 * บันทึกว่ามีผู้ใช้บริการเพิ่มอีกหนึ่งราย แล้วคืนยอดใหม่
 *
 * รอบนี้ยังไม่มีฐานข้อมูล จึงเป็นเพียงการบวกหนึ่งจากยอดที่ส่งเข้ามา
 * ยอดที่เพิ่มจะหายไปเมื่อรีเฟรช ซึ่งตรงกับที่ประกาศไว้ว่าเป็นการประมาณการ
 *
 * @param currentCount - ยอดที่หน้าเว็บถืออยู่ขณะนี้
 */
export async function increment(currentCount: number): Promise<number> {
  return currentCount + 1;
}

/** จัดรูปตัวเลขแบบมีเครื่องหมายคั่นหลักพัน เช่น 41,003 */
export function formatCount(value: number): string {
  return value.toLocaleString("th-TH");
}
