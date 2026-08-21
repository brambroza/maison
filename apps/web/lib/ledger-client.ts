/**
 * บัญชีนับยอดของสมาคม — ฝั่ง browser
 *
 * คุยกับ /api/ledger เท่านั้น ไม่แตะ Supabase ตรง (key อยู่ฝั่ง server)
 * เมื่อสถิติจริงยังไม่เปิดหรือเครือข่ายล่ม จะคืน null ให้ผู้เรียก
 * ถอยไปใช้เลขประมาณการเอง — หน้าเว็บต้องไม่พังเพราะตัวนับ
 */

/**
 * เพิ่มยอดของชิ้นงานหนึ่งครั้ง แล้วคืนยอดจริงใหม่
 *
 * @param id - เลขชิ้นงาน เช่น "064" หรือสถิติการเล่น "use:064"
 * @returns ยอดใหม่ หรือ null เมื่อสถิติจริงยังไม่เปิด/ส่งไม่สำเร็จ
 */
export async function bump(id: string): Promise<number | null> {
  try {
    const response = await fetch("/api/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { count: number | null };
    return data.count;
  } catch {
    return null;
  }
}

/**
 * บันทึกว่ามีการเล่นชิ้นงานจนได้ผลลัพธ์หนึ่งครั้ง (fire-and-forget)
 *
 * เรียกจาก handler ที่สร้างผลลัพธ์ของทุกชิ้น — ไม่รอคำตอบ ไม่รบกวนผู้ใช้
 */
export function recordPlay(pieceId: string): void {
  void bump(`use:${pieceId}`);
}
