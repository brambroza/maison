/**
 * แยกตัวเลขออกจากถ้อยคำ เพื่อให้ตัวเลขไต่ขึ้นทีละหลักตอนเปิดผล
 *
 * ไฟล์นี้ต้อง pure และห้าม import gsap หรือ React — ชุดทดสอบเรียกใช้ตรง ๆ
 */

/** ถ้อยคำที่ถูกแยกตัวเลขออกมาแล้ว */
export type Countable = {
  /** ข้อความก่อนตัวเลข */
  prefix: string;
  /** ตัวเลขที่จะไต่ขึ้น */
  value: number;
  /** ข้อความหลังตัวเลข */
  suffix: string;
};

/**
 * แยกถ้อยคำที่มีตัวเลขอยู่ "กลุ่มเดียว" ออกเป็นสามส่วน
 *
 * คืน null เมื่อไม่มีตัวเลข หรือมีมากกว่าหนึ่งกลุ่ม
 * เพราะการไต่ขึ้นพร้อมกันหลายจุดอ่านไม่รู้เรื่อง เช่น "๓ นาที ๑๒ วินาที"
 * และเมื่อตัวเลขใหญ่เกินกว่าที่ไต่ขึ้นแล้วยังดูมีความหมาย
 */
export function splitCountable(text: string, limit = 100_000): Countable | null {
  const groups = text.match(/\d+/g);
  if (!groups || groups.length !== 1) return null;

  const value = Number(groups[0]);
  if (!Number.isFinite(value) || value > limit) return null;

  const at = text.indexOf(groups[0]);

  return {
    prefix: text.slice(0, at),
    value,
    suffix: text.slice(at + groups[0].length),
  };
}

/**
 * ตัวเลขที่ควรแสดงระหว่างไต่ขึ้น
 *
 * ปัดลงเสมอ ตัวเลขจึงไม่กระโดดเกินค่าจริงระหว่างทาง
 */
export function countedValue(target: number, progress: number): number {
  const ratio = Math.min(1, Math.max(0, progress));
  return Math.floor(target * ratio);
}
