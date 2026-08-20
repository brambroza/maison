/**
 * แหล่งความจริงเดียวของค่าคงที่ประจำแบรนด์ MAISON ไร้สาระ
 *
 * ไฟล์นี้ถูกใช้ทั้งจากฝั่ง React/Tailwind และจากฝั่ง OG image renderer
 * (ซึ่งใช้ Tailwind ไม่ได้ ต้องใส่ค่าสีเป็น literal) จึงต้องเก็บค่าไว้ที่เดียว
 */

/** จานสีประจำสมาคม */
export const COLORS = {
  /** พื้นหลักของทุกหน้า */
  noir: "#141312",
  /** พื้นรองสำหรับการ์ด/กรอบ */
  noirSoft: "#1E1C1A",
  /** สีเน้น เส้นขอบ และตราสมาคม */
  gold: "#C9A96A",
  /** ทองหม่นสำหรับเส้นคั่นและข้อความรอง */
  goldDim: "#8A7448",
  /** สีตัวอักษรหลัก */
  ivory: "#F2EBDD",
} as const;

/** ข้อมูลประจำตัวของแบรนด์ที่ใช้ซ้ำทั่วทั้งเว็บ */
export const BRAND = {
  name: "MAISON ไร้สาระ",
  mark: "✦",
  tagline: "สมาคมความไร้สาระชั้นสูง",
  motto: "รับสมาชิกทุกท่าน ยกเว้นไม่รับใคร",
  /** คำเรียกผู้ใช้ตามกติกา voice — ห้ามใช้ "คุณ" หรือ "เธอ" */
  address: "ท่านสมาชิก",
} as const;

/** ถ้อยคำมาตรฐานที่ทุกชิ้นงานต้องใช้เหมือนกัน */
export const COPY = {
  atelier: "อยู่ระหว่างรังสรรค์ · ระยะเวลารอ: ชั่วกัลปาวสาน",
  ledgerNote: "ตัวเลขโดยประมาณการของสมาคม · ตรวจนับด้วยมือ",
  shareCta: "แสดงผลต่อสาธารณชน",
  shareCopied: "คัดลอกไว้ในมือท่านแล้ว",
  restart: "ขอรับบริการอีกครั้ง",
} as const;

/**
 * URL ฐานของเว็บ ใช้สร้าง absolute URL สำหรับ OG card และ sitemap
 *
 * ลำดับความสำคัญ: ค่าที่ตั้งเองใน env → URL ที่ Vercel ให้มาอัตโนมัติ → localhost
 */
export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
