import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { getReleasedPieces } from "@/lib/registry";

export const metadata: Metadata = {
  description: `${BRAND.tagline} — ${BRAND.motto}`,
  openGraph: {
    images: [{ url: "/api/og?id=064", width: 1200, height: 630, alt: BRAND.name }],
  },
};

/** หน้าตู้โชว์คอลเลกชัน — รายชื่อชิ้นงานทั้งหมดของสมาคม */
export default function PortalPage() {
  const pieces = getReleasedPieces();

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <header className="text-center">
        <p className="font-body text-[0.6rem] tracking-[0.34em] text-gold-dim uppercase sm:text-xs">
          {BRAND.mark} {BRAND.tagline}
        </p>

        <h1 className="font-display mt-4 text-4xl leading-tight font-semibold text-ivory sm:text-5xl">
          {BRAND.name}
        </h1>

        <p className="font-body mt-4 text-sm text-ivory/50 sm:text-base">{BRAND.motto}</p>

        <div className="mx-auto mt-10 flex w-40 items-center gap-2" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-dim" />
          <span className="text-[0.55rem] text-gold">{BRAND.mark}</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-dim" />
        </div>
      </header>

      <p className="font-body mt-10 text-center text-[0.62rem] tracking-[0.28em] text-gold-dim uppercase">
        คอลเลกชันประจำฤดูกาล
      </p>

      <ul className="mt-6 flex flex-col">
        {pieces.map((piece) => (
          <li key={piece.id}>
            <Link
              href={`/n/${piece.id}`}
              className="group flex items-baseline gap-4 border-b border-gold-dim/20 py-5 transition-colors hover:border-gold-dim/60"
            >
              <span className="font-display shrink-0 text-xs tracking-[0.18em] text-gold-dim transition-colors group-hover:text-gold">
                Nº {piece.id}
              </span>

              <span className="flex min-w-0 flex-col">
                <span className="font-display text-lg leading-snug text-ivory transition-colors group-hover:text-gold sm:text-xl">
                  {piece.title}
                </span>
                <span className="font-body mt-1 text-[0.78rem] leading-relaxed text-ivory/45">
                  {piece.subtitle}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <footer className="font-body mt-14 text-center text-[0.6rem] leading-loose tracking-[0.2em] text-gold-dim/70 uppercase">
        {BRAND.mark} ทุกชิ้นงานรังสรรค์ด้วยมือช่างฝีมือของสมาคม
      </footer>
    </main>
  );
}
