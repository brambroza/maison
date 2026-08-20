import type { PieceMeta } from "@/lib/registry";
import type { ShareState } from "@/lib/share";

/**
 * สัญญาของ props ที่ทุกชิ้นงานได้รับจากหน้า /n/[id]
 *
 * ชิ้นงานทุกชิ้นต้องรับ props ชุดนี้เหมือนกันหมด
 * เพื่อให้หน้า /n/[id] เรียกใช้ได้โดยไม่ต้องรู้จักชิ้นงานเป็นราย ๆ ไป
 */
export type PieceProps = {
  /** ข้อมูลทะเบียนของชิ้นงานนี้ */
  meta: PieceMeta;
  /** ผลลัพธ์ที่ติดมากับลิงก์ที่มีผู้แชร์ต่อ ถ้าเข้าหน้าเปล่าจะเป็น null */
  initialState: ShareState | null;
  /** ยอดสะสมของชิ้นงาน คำนวณจากฝั่ง server เพื่อกันเลขไม่ตรงกันตอน hydrate */
  ledgerCount: number;
};
