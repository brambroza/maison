/**
 * ทะเบียนชิ้นงานในคอลเลกชัน — แหล่งความจริงเดียวของทุกชิ้น
 *
 * ไฟล์นี้เก็บเฉพาะ "ข้อมูล" ห้าม import React component เข้ามา
 * เพราะถูกอ่านโดย sitemap, generateMetadata และ OG route ซึ่งไม่ควรดึง UI ทั้งก้อนตามมา
 * การจับคู่ id กับ component อยู่ที่ lib/pieces/index.ts
 */

export type PieceStatus = "released" | "atelier";

export type PieceMeta = {
  /** เลขประจำชิ้นงาน 3 หลักเสมอ ใช้เป็น URL segment: /n/064 */
  id: string;
  /** ชื่อชิ้นงาน */
  title: string;
  /** คำบรรยายสั้นแบบราชสำนัก แสดงใต้ชื่อ */
  subtitle: string;
  /** บรรทัดเชิญชวนบนการ์ดแชร์ ใช้เมื่อยังไม่มีผลลัพธ์ */
  ogTagline: string;
  /** released = เปิดให้ใช้บริการ · atelier = อยู่ระหว่างรังสรรค์ */
  status: PieceStatus;
  /** วันเปิดตัว รูปแบบ YYYY-MM-DD */
  releasedAt: string;
};

/** ทะเบียนทั้งหมด เรียงตามเลขประจำชิ้นงาน */
export const PIECES: readonly PieceMeta[] = [
  {
    id: "007",
    title: "โอเคมิเตอร์",
    subtitle: "เครื่องตรวจวัดว่าอีกฝ่ายโอเคจริงหรือไม่",
    ogTagline: "ท่านได้รับข้อความว่า “ค่ะ” แล้วนอนไม่หลับใช่หรือไม่",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "013",
    title: "สำนักวินิจฉัยทรงผม",
    subtitle: "วิเคราะห์จากรูปว่าท่านควรตัดผมหรือยัง แล้วตอบว่าก็แล้วแต่",
    ogTagline: "สมาคมวิเคราะห์รูปของท่านแล้ว คำตอบคือ ก็แล้วแต่",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "018",
    title: "นาฬิกาแป๊บนึง",
    subtitle: "จับเวลาคำว่า “แป๊บนึง” ของท่านตามมาตรฐานสมาคม",
    ogTagline: "สมาคมขอทราบว่าแป๊บนึงของท่านยาวนานเพียงใด",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "026",
    title: "คนแปลกหน้าประจำวัน",
    subtitle: "รับคำชมหนึ่งประโยคจากคนแปลกหน้า วันละหนึ่งครั้ง ไม่ต้องคุยต่อ",
    ogTagline: "เก่งมากแล้ววันนี้ — คนแปลกหน้าฝากมาบอก",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "031",
    title: "เครื่องแปลคำว่าไม่เป็นไร",
    subtitle: "ถอดความหมายที่แท้จริงจากถ้อยคำอันสุภาพ",
    ogTagline: "“ไม่เป็นไร” มิได้แปลว่าไม่เป็นไร",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "042",
    title: "สภาตัดสินใจว่ากินอะไรดี",
    subtitle: "คณะกรรมการผู้ทรงคุณวุฒิพิจารณาให้ท่านโดยไม่คิดค่าบริการ",
    ogTagline: "สมาคมได้ประชุมวาระอาหารมื้อนี้เรียบร้อยแล้ว",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "048",
    title: "สำนักประเมินมูลค่าไอเดียในห้องน้ำ",
    subtitle: "จับเวลาอาบน้ำ แล้วประเมินมูลค่ารวมของแผนธุรกิจที่คิดใต้ฝักบัว",
    ogTagline: "ไอเดียธุรกิจของท่านมีมูลค่ากี่ล้าน สมาคมประเมินให้ขณะตัวเปียก",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "055",
    title: "ใบรับรองการดองงาน",
    subtitle: "เอกสารรับรองระยะเวลาการดองอย่างเป็นทางการ",
    ogTagline: "งานที่ท่านดองไว้ได้รับการรับรองจากสมาคมแล้ว",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "064",
    title: "ปุ่มต้องห้าม",
    subtitle: "ปุ่มซึ่งสมาคมขอความกรุณาว่าอย่ากด",
    ogTagline: "สมาคมได้ขอไว้แล้วว่าอย่ากด",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "077",
    title: "มาตรวัดพลังสังคม",
    subtitle: "ประเมินพลังคงเหลือภายหลังการพบปะผู้คน",
    ogTagline: "ท่านเหลือพลังสังคมอยู่เท่าใด สมาคมขอตรวจสอบ",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "083",
    title: "สมาธิสนามจริง",
    subtitle: "นั่งสมาธิท่ามกลางเสียงป้าข้างบ้านนินทา เพื่อฝึกจิตในสนามจริง",
    ogTagline: "ห้องเงียบนั้นง่ายเกินไป สมาคมจัดป้ามาให้",
    status: "released",
    releasedAt: "2026-08-21",
  },
  {
    id: "090",
    title: "ห้องรอเสียงตู้ม",
    subtitle: "ห้องรับรองสำหรับผู้เฝ้ารอเสียงตู้มประจำปี",
    ogTagline: "เสียงตู้มจะดังขึ้นปีละครั้ง และสมาคมจะไม่บอกว่าวันใด",
    status: "released",
    releasedAt: "2026-08-21",
  },
] as const;

/** ค้นชิ้นงานจากเลขประจำตัว คืน undefined ถ้าไม่มีในทะเบียน */
export function getPiece(id: string): PieceMeta | undefined {
  return PIECES.find((piece) => piece.id === id);
}

/** ชิ้นงานที่เปิดให้ใช้บริการแล้ว ใช้กับหน้า portal และ sitemap */
export function getReleasedPieces(): PieceMeta[] {
  return PIECES.filter((piece) => piece.status === "released");
}
