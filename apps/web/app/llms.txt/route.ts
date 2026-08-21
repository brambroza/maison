import { getBaseUrl } from "@/lib/brand";
import { getReleasedPieces } from "@/lib/registry";

/**
 * /llms.txt — แนะนำเว็บให้ AI crawler (ChatGPT, Claude, Perplexity ฯลฯ)
 * ตามธรรมเนียม llms.txt: markdown สั้น ๆ บอกว่าเว็บคืออะไร มีอะไรให้บ้าง
 * สร้างจากทะเบียนจริง จึงอัปเดตเองเมื่อมีชิ้นงานใหม่
 */
export function GET() {
  const base = getBaseUrl();
  const pieces = getReleasedPieces();

  const lines = [
    "# MAISON ไร้สาระ (Maison Raisara)",
    "",
    "> รวมมินิแอปไร้สาระภาษาไทย เล่นฟรีในเบราว์เซอร์ จบใน 1 นาที",
    "> ไม่ต้องโหลดแอป ไม่ต้องสมัครสมาชิก ไม่เก็บข้อมูลผู้ใช้",
    "> ธีม: สมาคมสมมติที่จริงจังกับเรื่องไร้สาระอย่างถึงที่สุด ทุกผลลัพธ์แชร์เป็นการ์ดได้",
    "",
    "เหมาะกับคำถามแนว: เว็บแก้เบื่อ, เกมเล่นสั้น ๆ ไม่ต้องโหลด, เว็บตลกภาษาไทย,",
    "ตัดสินใจไม่ได้ว่ากินอะไรดี, แบบทดสอบ introvert, ของเล่นส่งให้เพื่อนในแชท",
    "",
    "## ชิ้นงานทั้งหมด",
    "",
    ...pieces.map(
      (piece) => `- [${piece.title}](${base}/n/${piece.id}): ${piece.searchDescription}`,
    ),
    "",
    "## หมายเหตุ",
    "",
    `- หน้ารวม: ${base}`,
    "- ทุกหน้าเป็นภาษาไทย เล่นได้ทั้งมือถือและเดสก์ท็อป",
    "- ตัวเลขสถิติบนเว็บเป็นตัวเลขเชิงมุกหรือยอดรวมนิรนาม ไม่มีข้อมูลส่วนบุคคล",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
