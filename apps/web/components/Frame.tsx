import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";

type FrameProps = {
  /** เลขประจำชิ้นงาน แสดงบนหัวกระดาษ */
  pieceId?: string;
  /** ชื่อชิ้นงาน */
  title: string;
  /** คำบรรยายใต้ชื่อ */
  subtitle?: string;
  /** เนื้อหาของชิ้นงาน */
  children: ReactNode;
};

/**
 * กรอบมาตรฐานของทุกหน้าในสมาคม
 *
 * บังคับให้เนื้อหาจบภายในหนึ่งหน้าจอตามข้อกำหนด definition of done
 * โดยใช้ความสูง dvh และให้เฉพาะส่วนเนื้อหาเท่านั้นที่ยืดหยุ่นได้
 */
export function Frame({ pieceId, title, subtitle, children }: FrameProps) {
  return (
    <main className="flex h-dvh flex-col overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
      <header className="shrink-0 text-center">
        <Link
          href="/"
          className="font-body text-[0.6rem] tracking-[0.32em] text-gold-dim uppercase transition-colors hover:text-gold sm:text-[0.68rem]"
        >
          {BRAND.mark} {BRAND.name}
        </Link>

        {pieceId ? (
          <p className="font-display mt-4 text-xs tracking-[0.3em] text-gold sm:text-sm">
            Nº {pieceId}
          </p>
        ) : null}

        <h1 className="font-display mt-1.5 text-2xl leading-tight font-semibold text-ivory sm:text-3xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="font-body mx-auto mt-2 max-w-md text-[0.78rem] leading-relaxed text-ivory/55 sm:text-sm">
            {subtitle}
          </p>
        ) : null}

        <Rule />
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {children}
      </div>

      <footer className="font-body shrink-0 pt-4 text-center text-[0.6rem] tracking-[0.2em] text-gold-dim/70 uppercase">
        {BRAND.tagline}
      </footer>
    </main>
  );
}

/** เส้นคั่นทองประดับหัวกระดาษ */
function Rule() {
  return (
    <div className="mx-auto mt-4 flex w-32 items-center gap-2" aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-dim" />
      <span className="text-[0.5rem] text-gold">{BRAND.mark}</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-dim" />
    </div>
  );
}
