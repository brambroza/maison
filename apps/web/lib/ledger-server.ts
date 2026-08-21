/**
 * บัญชีนับยอดจริงของสมาคม — ฝั่ง server เท่านั้น
 *
 * คุยกับ Supabase ผ่าน REST (PostgREST) ตรง ๆ ไม่ต้องลง SDK
 * ต้องมี env สองตัว: SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY
 * ถ้าไม่มี ระบบจะถอยกลับไปใช้เลขประมาณการจาก lib/ledger.ts โดยอัตโนมัติ
 * ทำให้ dev/preview ที่ไม่มี key ยังทำงานได้ครบ
 *
 * โครงสร้างตาราง + ฟังก์ชัน SQL อยู่ใน ops/supabase-setup.md
 *
 * ห้าม import ไฟล์นี้จาก client component — service role key ต้องไม่หลุดไป browser
 */

import { getCount as getEstimatedCount } from "@/lib/ledger";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** สถิติจริงเปิดใช้งานหรือยัง (มี env ครบทั้งสองตัว) */
export function realLedgerEnabled(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

function headers(): Record<string, string> {
  return {
    apikey: SERVICE_KEY ?? "",
    Authorization: `Bearer ${SERVICE_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

/**
 * อ่านยอดจริงของ id หนึ่งรายการ
 *
 * @returns ยอดจริง หรือเลขประมาณการเมื่อไม่มี env / Supabase ล่ม
 *          (การ์ดต้องไม่พังเพราะฐานข้อมูลเดี้ยง)
 */
export async function readCount(id: string): Promise<number> {
  if (!realLedgerEnabled()) return getEstimatedCount(id);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/ledger?id=eq.${encodeURIComponent(id)}&select=count`,
      { headers: headers(), cache: "no-store" },
    );
    if (!response.ok) return getEstimatedCount(id);

    const rows = (await response.json()) as { count: number }[];
    return rows[0]?.count ?? 0;
  } catch {
    return getEstimatedCount(id);
  }
}

/**
 * เพิ่มยอดของ id หนึ่งรายการแบบ atomic แล้วคืนยอดใหม่
 *
 * @returns ยอดใหม่ หรือ null เมื่อไม่มี env / เพิ่มไม่สำเร็จ
 */
export async function bumpCount(id: string): Promise<number | null> {
  if (!realLedgerEnabled()) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ledger_bump`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ piece: id }),
    });
    if (!response.ok) return null;

    const count = (await response.json()) as number;
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

/**
 * อ่านยอดหลายรายการในคำขอเดียว ใช้กับหน้า portal
 *
 * @returns map จาก id ไปยอด — คืน null เมื่อสถิติจริงยังไม่เปิดใช้
 *          (หน้า portal จะซ่อนตัวเลขแทนที่จะโชว์เลขปลอม)
 */
export async function readCounts(ids: readonly string[]): Promise<Map<string, number> | null> {
  if (!realLedgerEnabled() || ids.length === 0) return null;

  try {
    const list = ids.map((id) => `"${id}"`).join(",");
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/ledger?id=in.(${encodeURIComponent(list)})&select=id,count`,
      { headers: headers(), cache: "no-store" },
    );
    if (!response.ok) return null;

    const rows = (await response.json()) as { id: string; count: number }[];
    return new Map(rows.map((row) => [row.id, row.count]));
  } catch {
    return null;
  }
}
