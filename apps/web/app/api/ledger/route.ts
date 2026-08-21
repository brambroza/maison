import { NextResponse } from "next/server";
import { bumpCount, realLedgerEnabled } from "@/lib/ledger-server";
import { getPiece } from "@/lib/registry";

/**
 * จุดรับแจ้งการใช้บริการจากฝั่ง browser
 *
 * POST { id } — id ต้องเป็นเลขชิ้นงานในทะเบียน ("064") หรือสถิติการเล่น ("use:064")
 * เท่านั้น กันคนยิง id มั่วมาสร้างแถวขยะในฐานข้อมูล
 *
 * ไม่มีระบบยืนยันตัวตนโดยเจตนา — ตัวเลขนี้เป็นมุกสาธารณะ กดรัวได้คือฟีเจอร์
 * (ปุ่มต้องห้ามยิ่งกดยิ่งฝ่าฝืน) ความเสียหายสูงสุดคือตัวเลขโต ซึ่งสมาคมยินดี
 */
export const runtime = "nodejs";

/** ตรวจว่า id อยู่ในรูปแบบที่สมาคมยอมรับ */
function isAllowedId(id: unknown): id is string {
  if (typeof id !== "string") return false;

  const pieceId = id.startsWith("use:") ? id.slice(4) : id;
  return /^\d{3}$/.test(pieceId) && getPiece(pieceId) !== undefined;
}

export async function POST(request: Request) {
  if (!realLedgerEnabled()) {
    // ยังไม่ต่อฐานข้อมูล — บอก client ให้ใช้เลขประมาณการต่อไป
    return NextResponse.json({ count: null }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const id = (body as { id?: unknown })?.id;
  if (!isAllowedId(id)) {
    return NextResponse.json({ error: "ไม่พบรายการนี้ในทะเบียน" }, { status: 400 });
  }

  const count = await bumpCount(id);
  return NextResponse.json({ count }, { status: 200 });
}
