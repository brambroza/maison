/**
 * กลไกการแชร์ผลลัพธ์ของทุกชิ้นงาน
 *
 * หลักการ: ผลลัพธ์ต้องอยู่ใน URL ทั้งหมด ไม่มี localStorage ไม่มี cookie ไม่มี login
 * ตามข้อกำหนด definition of done ของสมาคม
 *
 * ข้อควรระวังด้านความปลอดภัย: URL ถูกนำไปวาดเป็นการ์ดที่มีตราแบรนด์
 * จึงห้ามส่ง "ข้อความอิสระ" ทั้งก้อนผ่าน URL มิฉะนั้นผู้ไม่ประสงค์ดี
 * จะสร้างการ์ดของสมาคมที่เขียนอะไรก็ได้ ระบบนี้จึงส่งเพียง
 * ดัชนีของคำวินิจฉัย (v) ตัวเลขประกอบ (s) และข้อความสั้นที่กรองแล้ว (t)
 */

/** ความยาวสูงสุดของข้อความอิสระที่ยอมให้ปรากฏบนการ์ด */
export const MAX_FREE_TEXT = 40;

/** สถานะผลลัพธ์ที่ถูกเข้ารหัสไว้ใน query string */
export type ShareState = {
  /** ดัชนีคำวินิจฉัยในตารางของชิ้นงานนั้น */
  v: number;
  /** ตัวเลขประกอบ เช่น เปอร์เซ็นต์ หรือจำนวนวินาที */
  s?: number;
  /** ข้อความสั้นจากผู้ใช้ เช่น ชื่องานที่ดอง (กรองและตัดความยาวแล้ว) */
  t?: string;
};

/** เนื้อหาที่จะถูกวาดลงการ์ดผล ทั้งในหน้าเว็บและบน OG image */
export type Outcome = {
  /** พาดหัวตัวใหญ่ */
  headline: string;
  /** คำวินิจฉัยของสมาคม */
  verdict: string;
  /** บรรทัดรองขนาดเล็ก */
  note?: string;
};

/** สัญญาที่ทุกชิ้นงานต้องทำตาม เพื่อให้ OG route วาดการ์ดได้โดยไม่ต้องรู้จัก UI */
export type PieceLogic = {
  /** จำนวนคำวินิจฉัยทั้งหมด ใช้ตรวจว่า v ที่ส่งมาอยู่ในช่วงที่ถูกต้อง */
  verdictCount: number;
  /** แปลง state เป็นเนื้อหาการ์ด — ต้องเป็น pure function */
  toOutcome(state: ShareState): Outcome;
};

/**
 * กรองข้อความอิสระจากผู้ใช้ก่อนนำไปใส่ URL หรือวาดลงการ์ด
 *
 * อนุญาต: อักษรไทย อักษรละติน ตัวเลข ช่องว่าง และเครื่องหมายพื้นฐานบางตัว
 * ตัดอักขระควบคุมและอักขระผสมแปลก ๆ ที่ทำให้การ์ดเสียรูปออกทั้งหมด
 */
export function sanitizeFreeText(input: string): string {
  return input
    .normalize("NFC")
    .replace(/[^฀-๿a-zA-Z0-9 .,!?%()\-–—'"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_FREE_TEXT);
}

/**
 * อ่านและตรวจสอบ state จาก query string
 *
 * @param params - query string ของหน้านั้น
 * @param verdictCount - จำนวนคำวินิจฉัยของชิ้นงาน ใช้ตรวจขอบเขตของ v
 * @returns state ที่ผ่านการตรวจแล้ว หรือ null ถ้าไม่มีผลลัพธ์หรือข้อมูลไม่ถูกต้อง
 */
export function parseShareState(
  params: Record<string, string | string[] | undefined>,
  verdictCount: number,
): ShareState | null {
  const raw = first(params.v);
  if (raw === undefined) return null;

  const v = Number(raw);
  if (!Number.isInteger(v) || v < 0 || v >= verdictCount) return null;

  const state: ShareState = { v };

  const sRaw = first(params.s);
  if (sRaw !== undefined) {
    const s = Number(sRaw);
    // จำกัดช่วงกันตัวเลขเพี้ยนทำให้การ์ดเสียรูป
    if (Number.isFinite(s) && s >= 0 && s <= 9_999_999) state.s = Math.round(s);
  }

  const tRaw = first(params.t);
  if (tRaw !== undefined) {
    const t = sanitizeFreeText(tRaw);
    if (t.length > 0) state.t = t;
  }

  return state;
}

/** แปลง state เป็น query string เช่น "v=2&s=73" */
export function toShareQuery(state: ShareState): string {
  const params = new URLSearchParams({ v: String(state.v) });
  if (state.s !== undefined) params.set("s", String(state.s));
  if (state.t) params.set("t", state.t);
  return params.toString();
}

/** ประกอบ URL ของผลลัพธ์สำหรับส่งต่อ เช่น https://.../n/007?v=2&s=73 */
export function buildShareUrl(origin: string, id: string, state: ShareState): string {
  return `${origin.replace(/\/$/, "")}/n/${id}?${toShareQuery(state)}`;
}

/** ผลของการพยายามแชร์ ใช้เลือกข้อความตอบกลับให้ท่านสมาชิก */
export type ShareOutcome = "shared" | "copied" | "failed";

/**
 * แชร์ผลลัพธ์ด้วย Web Share API บนมือถือ และถอยไปคัดลอกลิงก์บนเดสก์ท็อป
 *
 * ใช้ได้เฉพาะฝั่ง client เท่านั้น
 */
export async function shareResult(url: string, title: string): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (error) {
      // ผู้ใช้กดยกเลิกแผงแชร์ — ไม่ถือว่าผิดพลาด และไม่ต้องถอยไปคัดลอก
      if (error instanceof DOMException && error.name === "AbortError") return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

/** หยิบค่าแรกจาก query param ที่อาจมาเป็น array */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
