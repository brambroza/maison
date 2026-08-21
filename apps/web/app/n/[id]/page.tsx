import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Frame } from "@/components/Frame";
import { readCount } from "@/lib/ledger-server";
import { PIECE_UI, getPieceLogic } from "@/lib/pieces";
import { getPiece } from "@/lib/registry";
import { getBaseUrl } from "@/lib/brand";
import { parseShareState, toShareQuery } from "@/lib/share";

type PageParams = { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> };
type SearchParams = Record<string, string | string[] | undefined>;

/**
 * ประกอบ metadata ของหน้าชิ้นงาน รวมถึงการ์ดแชร์ที่สะท้อนผลลัพธ์ใน URL
 *
 * ต้องอ่าน searchParams ที่นี่ เพราะ opengraph-image.tsx ของ Next.js
 * ได้รับเฉพาะ params ไม่ได้รับ query string
 */
export async function generateMetadata({
  params,
  searchParams,
}: PageParams): Promise<Metadata> {
  const { id } = await params;
  const piece = getPiece(id);
  if (!piece) return { title: "ไม่พบชิ้นงาน" };

  const ogUrl = `/api/og?${buildOgQuery(id, await searchParams)}`;

  return {
    title: piece.title,
    // สำหรับ search engine / AI ใช้ภาษาตรง ๆ มีคำค้น — ส่วน og ยังเป็นมุกตามแบรนด์
    description: piece.searchDescription,
    keywords: [...piece.keywords],
    openGraph: {
      title: `${piece.title} · Nº ${piece.id}`,
      description: piece.ogTagline,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: piece.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${piece.title} · Nº ${piece.id}`,
      description: piece.ogTagline,
      images: [ogUrl],
    },
  };
}

export default async function PiecePage({ params, searchParams }: PageParams) {
  const { id } = await params;
  const piece = getPiece(id);
  const logic = getPieceLogic(id);
  const PieceUI = PIECE_UI[id];

  if (!piece || !logic || !PieceUI) notFound();

  const initialState = parseShareState(await searchParams, logic.verdictCount);

  // structured data ให้ search engine / AI เข้าใจว่าหน้านี้คือเว็บแอปเล่นฟรี
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: piece.title,
    url: `${getBaseUrl()}/n/${piece.id}`,
    description: piece.searchDescription,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web",
    inLanguage: "th",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
  };

  return (
    <Frame pieceId={piece.id} title={piece.title} subtitle={piece.subtitle}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PieceUI meta={piece} initialState={initialState} ledgerCount={await readCount(piece.id)} />
    </Frame>
  );
}

/** ประกอบ query string ของการ์ดแชร์ โดยส่งต่อเฉพาะพารามิเตอร์ผลลัพธ์ที่ผ่านการตรวจแล้ว */
function buildOgQuery(id: string, searchParams: SearchParams): string {
  const logic = getPieceLogic(id);
  const state = logic ? parseShareState(searchParams, logic.verdictCount) : null;

  return state ? `id=${id}&${toShareQuery(state)}` : `id=${id}`;
}
