import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/components/motion/CountUp";
import { Entrance } from "@/components/motion/Entrance";
import { Shelf } from "@/components/motion/Shelf";
import { Squiggle } from "@/components/motion/Squiggle";
import { BRAND, getBaseUrl } from "@/lib/brand";
import { readCounts } from "@/lib/ledger-server";
import { getReleasedPieces } from "@/lib/registry";

export const metadata: Metadata = {
  description:
    "รวมมินิแอปไร้สาระเล่นฟรีในเบราว์เซอร์ — วันนี้กินอะไรดี ปุ่มต้องห้าม แบบทดสอบ introvert และอีกมาก ไม่ต้องโหลดแอป ไม่ต้องสมัครสมาชิก เล่นจบใน 1 นาที",
  keywords: [
    "เว็บแก้เบื่อ",
    "เกมแก้เบื่อ ไม่ต้องโหลด",
    "เว็บไร้สาระ",
    "มินิเกมออนไลน์ฟรี",
    "วันนี้กินอะไรดี",
    "เว็บตลก",
  ],
  openGraph: {
    images: [{ url: "/api/og?id=064", width: 1200, height: 630, alt: BRAND.name }],
  },
};

/** ยอดใช้บริการเปลี่ยนตลอดเวลา — ปิด cache ของหน้า portal */
export const dynamic = "force-dynamic";

/** สีป้ายเลขชิ้นงาน วนใช้ตามลำดับให้ชั้นวางดูมีชีวิต */
const BADGE_COLORS = ["bg-pop", "bg-sun", "bg-lilac", "bg-mint"] as const;

/** ตัวอักษรบนป้ายต้องอ่านออกบนทุกสีพื้น — เหลือง/มิ้นต์ใช้หมึกเข้ม */
const BADGE_TEXT: Record<(typeof BADGE_COLORS)[number], string> = {
  "bg-pop": "text-paper",
  "bg-sun": "text-ink",
  "bg-lilac": "text-paper",
  "bg-mint": "text-ink",
};

/** หน้าตู้โชว์คอลเลกชัน — รายชื่อชิ้นงานทั้งหมดของสมาคม */
export default async function PortalPage() {
  const pieces = getReleasedPieces();

  // ยอดใช้บริการจริงต่อชิ้น — null เมื่อยังไม่ต่อฐานข้อมูล (ซ่อนตัวเลขแทนโชว์เลขปลอม)
  const usage = await readCounts(pieces.map((piece) => `use:${piece.id}`));

  // structured data: เว็บ + รายการชิ้นงาน ให้ search engine / AI ไล่อ่านคอลเลกชันได้
  const base = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    alternateName: "Maison Raisara",
    url: base,
    description:
      "รวมมินิแอปไร้สาระเล่นฟรีในเบราว์เซอร์ เล่นจบใน 1 นาที ไม่ต้องโหลดแอป ไม่ต้องสมัครสมาชิก",
    inLanguage: "th",
    hasPart: {
      "@type": "ItemList",
      itemListElement: pieces.map((piece, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${base}/n/${piece.id}`,
        name: piece.title,
        description: piece.searchDescription,
      })),
    },
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-12 pb-28 sm:px-8 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Entrance className="text-center" stagger={0.08} rise={18}>
        <p className="font-display inline-block -rotate-2 rounded-full border-[3px] border-ink bg-sun px-4 py-1 text-[0.65rem] font-semibold tracking-[0.14em] text-ink shadow-[3px_3px_0_0_var(--color-ink)] sm:text-xs">
          {BRAND.mark} {BRAND.tagline}
        </p>

        <h1 className="font-display mt-5 text-4xl leading-tight font-bold text-ink sm:text-5xl">
          {BRAND.name}
        </h1>

        <p className="font-body mt-3 text-sm font-light text-ink-soft sm:text-base">
          {BRAND.motto}
        </p>

        <p className="font-body mx-auto mt-2 max-w-md text-[0.72rem] leading-relaxed font-light text-ink-soft/70">
          มินิแอปแก้เบื่อ เล่นฟรีในเบราว์เซอร์ จบใน 1 นาที ไม่ต้องโหลดแอป ไม่ต้องสมัครสมาชิก
        </p>

        <Squiggle
          className="mx-auto mt-6 h-3 w-44 text-pop"
          viewBox="0 0 176 12"
          path="M2 8 Q 11 1, 20 8 T 38 8 T 56 8 T 74 8 T 92 8 T 110 8 T 128 8 T 146 8 T 164 8 T 174 8"
          delay={0.45}
        />
      </Entrance>

      <p className="font-display mt-9 text-center text-[0.7rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">
        คอลเลกชันประจำฤดูกาล
      </p>

      <Shelf className="mt-6 flex flex-col gap-4">
        {pieces.map((piece, index) => {
          const badge = BADGE_COLORS[index % BADGE_COLORS.length];
          const tilt = index % 2 === 0 ? "hover:-rotate-1" : "hover:rotate-1";

          return (
            <li key={piece.id}>
              <Link
                href={`/n/${piece.id}`}
                className={`card-stamp group flex items-center gap-4 px-5 py-4 transition-transform duration-150 hover:-translate-y-0.5 ${tilt}`}
              >
                <span
                  className={`font-display grid h-12 w-12 shrink-0 rotate-3 place-items-center rounded-xl border-[3px] border-ink text-sm font-bold transition-transform group-hover:-rotate-3 ${badge} ${BADGE_TEXT[badge]}`}
                >
                  {piece.id}
                </span>

                <span className="flex min-w-0 flex-col">
                  <span className="font-display text-lg leading-snug font-bold text-ink sm:text-xl">
                    {piece.title}
                  </span>
                  <span className="font-body mt-0.5 text-[0.78rem] leading-relaxed font-light text-ink-soft">
                    {piece.subtitle}
                  </span>
                  {usage?.get(`use:${piece.id}`) ? (
                    <span className="font-body mt-1 text-[0.66rem] font-light text-lilac">
                      รับบริการแล้ว <CountUp value={usage.get(`use:${piece.id}`) ?? 0} /> ครั้ง
                    </span>
                  ) : null}
                </span>

                <span
                  className="font-display ml-auto shrink-0 text-lg text-pop opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </Shelf>

      <footer className="font-display mt-12 text-center text-[0.68rem] leading-loose font-semibold tracking-[0.12em] text-ink-soft/80">
        {BRAND.mark} ทุกชิ้นงานรังสรรค์ด้วยมือช่างฝีมือของสมาคม
      </footer>
    </main>
  );
}
