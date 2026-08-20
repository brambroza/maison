/**
 * แหล่งความจริงเดียวของค่าคงที่ประจำแบรนด์ MAISON ไร้สาระ
 *
 * ทิศทางดีไซน์ v2: "สมาคมทางการที่ใช้สีลูกกวาด" — ขอบหมึกหนา เงาแข็ง
 * ป้ายเอียง สีสดใส แต่ถ้อยคำยังทางการเว่อร์เหมือนเดิม
 *
 * ไฟล์นี้ถูกใช้ทั้งจากฝั่ง React/Tailwind และจากฝั่ง OG image renderer
 * (ซึ่งใช้ Tailwind ไม่ได้ ต้องใส่ค่าสีเป็น literal) จึงต้องเก็บค่าไว้ที่เดียว
 * ค่าสีต้องตรงกับ tokens ใน app/globals.css เสมอ
 */

/** จานสีประจำสมาคม ฉบับขี้เล่น */
export const COLORS = {
  /** พื้นหลักสีครีมนุ่ม */
  cream: "#FFF6E8",
  /** พื้นการ์ด/กล่อง สีขาวนวล */
  paper: "#FFFDF7",
  /** หมึกหลัก ม่วงเข้มเกือบดำ ใช้กับตัวอักษรและเส้นขอบ */
  ink: "#2E2A45",
  /** หมึกจาง สำหรับข้อความรอง */
  inkSoft: "#6B6584",
  /** ชมพูจัด — สีเน้นหลักของสมาคม */
  pop: "#FF4D9D",
  /** เหลืองแดดจ้า — ป้ายและตราประทับ */
  sun: "#FFC33C",
  /** ม่วงลูกกวาด — สีรองในหน้า portal */
  lilac: "#8C6CFF",
  /** เขียวมิ้นต์ — ใช้จุดเล็ก ๆ ให้จอมีชีวิต */
  mint: "#2EC4B6",
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
