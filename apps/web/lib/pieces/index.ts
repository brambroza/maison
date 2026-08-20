import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { PieceLogic } from "@/lib/share";
import type { PieceProps } from "./types";
import { logic as logic007 } from "./007.logic";
import { logic as logic018 } from "./018.logic";
import { logic as logic031 } from "./031.logic";
import { logic as logic042 } from "./042.logic";
import { logic as logic055 } from "./055.logic";
import { logic as logic064 } from "./064.logic";
import { logic as logic077 } from "./077.logic";
import { logic as logic090 } from "./090.logic";

/**
 * ตรรกะของทุกชิ้นงาน โหลดแบบปกติเพราะเป็นข้อมูลล้วน ขนาดเล็ก
 * และ /api/og จำเป็นต้องเรียกใช้แบบ synchronous
 */
const PIECE_LOGIC: Readonly<Record<string, PieceLogic>> = {
  "007": logic007,
  "018": logic018,
  "031": logic031,
  "042": logic042,
  "055": logic055,
  "064": logic064,
  "077": logic077,
  "090": logic090,
};

/**
 * ส่วนติดต่อผู้ใช้ของทุกชิ้นงาน โหลดแบบ dynamic
 * เพื่อไม่ให้ bundle ของหน้าใดหน้าหนึ่งพกโค้ดของชิ้นงานอื่นติดไปด้วย
 *
 * ประกาศเป็น map ระดับโมดูลและให้ผู้เรียกหยิบค่าเอง (ไม่ห่อด้วยฟังก์ชัน)
 * เพื่อให้ชัดว่า component ถูกสร้างครั้งเดียวตอนโหลดโมดูล ไม่ได้สร้างใหม่ทุกครั้งที่ render
 */
export const PIECE_UI: Readonly<Record<string, ComponentType<PieceProps>>> = {
  "007": dynamic(() => import("./007.ui")),
  "018": dynamic(() => import("./018.ui")),
  "031": dynamic(() => import("./031.ui")),
  "042": dynamic(() => import("./042.ui")),
  "055": dynamic(() => import("./055.ui")),
  "064": dynamic(() => import("./064.ui")),
  "077": dynamic(() => import("./077.ui")),
  "090": dynamic(() => import("./090.ui")),
};

/** ดึงตรรกะของชิ้นงาน คืน undefined ถ้ายังไม่ได้ลงทะเบียนไว้ */
export function getPieceLogic(id: string): PieceLogic | undefined {
  return PIECE_LOGIC[id];
}
