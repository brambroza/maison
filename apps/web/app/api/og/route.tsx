import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { renderCardSvg } from "@/lib/og-card";
import { getPieceLogic } from "@/lib/pieces";
import { getPiece } from "@/lib/registry";
import { parseShareState } from "@/lib/share";

/**
 * การ์ดแชร์ผลของทุกชิ้นงาน
 *
 * ใช้ Node runtime เพราะ resvg เป็น native addon และต้องอ่านไฟล์ฟอนต์จากดิสก์
 * เลือก resvg แทน next/og เพราะวางวรรณยุกต์ไทยได้ถูกต้อง — ดูเหตุผลใน lib/og-card.ts
 *
 * ตัวอย่าง: /api/og?id=064&v=2&s=41003
 */
export const runtime = "nodejs";

/** โฟลเดอร์ฟอนต์ที่ next.config.ts สั่งให้ติดไปกับ deploy */
const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get("id") ?? "";
  const piece = getPiece(id);
  if (!piece) {
    return new Response("ไม่พบชิ้นงานในทะเบียน", { status: 404 });
  }

  const logic = getPieceLogic(id);
  const state = logic
    ? parseShareState(Object.fromEntries(searchParams), logic.verdictCount)
    : null;

  const svg = renderCardSvg({
    id: piece.id,
    title: piece.title,
    outcome: state && logic ? logic.toOutcome(state) : null,
    tagline: piece.ogTagline,
  });

  const png = new Resvg(svg, {
    font: { fontDirs: [FONT_DIR], loadSystemFonts: false, defaultFontFamily: "Mitr" },
  })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      // การ์ดของ state เดียวกันหน้าตาเหมือนเดิมเสมอ จึง cache ได้ยาว
      "cache-control": "public, immutable, no-transform, max-age=31536000",
    },
  });
}
