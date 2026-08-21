/**
 * คำสั่งให้บัตเลอร์ถอยไปยืนข้าง ๆ
 *
 * ใช้ตอนมีคำวินิจฉัยขึ้นจอ เพราะบัตเลอร์เดินตามเคอร์เซอร์ไปยืนบังการ์ดผลได้
 * ซึ่งเป็นสิ่งเดียวที่ท่านสมาชิกตั้งใจมาอ่าน
 *
 * เป็นตัวแปรระดับโมดูล ไม่ใช่ context เพราะมีบัตเลอร์ตัวเดียวในทั้งเว็บ
 * และการ์ดผลอยู่คนละกิ่งของต้นไม้ component
 */

type Listener = (aside: boolean) => void;

let listener: Listener | null = null;
let standing = false;

/** สั่งให้บัตเลอร์ถอย (true) หรือกลับมาทำหน้าที่ตามปกติ (false) */
export function requestAside(aside: boolean): void {
  standing = aside;
  listener?.(aside);
}

/** บัตเลอร์ถูกสั่งให้ถอยอยู่หรือไม่ ณ ขณะที่เพิ่งเข้ามารับฟัง */
export function asideRequested(): boolean {
  return standing;
}

/** รับฟังคำสั่ง — คืนฟังก์ชันสำหรับเลิกฟัง */
export function onAside(next: Listener): () => void {
  listener = next;

  return () => {
    if (listener === next) listener = null;
  };
}
