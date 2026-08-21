import Link from "next/link";
import type { ReactNode } from "react";
import { Entrance } from "@/components/motion/Entrance";
import { Squiggle } from "@/components/motion/Squiggle";
import { BRAND } from "@/lib/brand";

type FrameProps = {
  /** เลขประจำชิ้นงาน แสดงบนป้ายเอียงหัวกระดาษ */
  pieceId?: string;
  /** ชื่อชิ้นงาน */
  title: string;
  /** คำบรรยายใต้ชื่อ */
  subtitle?: string;
  /** เนื้อหาของชิ้นงาน */
  children: ReactNode;
};

/**
 * กรอบมาตรฐานของทุกหน้าในสมาคม (ฉบับขี้เล่น)
 *
 * บังคับให้เนื้อหาจบภายในหนึ่งหน้าจอตามข้อกำหนด definition of done
 * โดยใช้ความสูง dvh และให้เฉพาะส่วนเนื้อหาเท่านั้นที่ยืดหยุ่นได้
 */
export function Frame({ pieceId, title, subtitle, children }: FrameProps) {
  return (
    <main className="flex h-dvh flex-col overflow-hidden px-5 pt-5 pb-20 sm:px-8 sm:py-7">
      <Entrance className="shrink-0 text-center" stagger={0.06} rise={14}>
        <Link
          href="/"
          className="font-display inline-block -rotate-2 rounded-full border-[3px] border-ink bg-sun px-4 py-1 text-[0.65rem] font-semibold tracking-[0.14em] text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-transform hover:rotate-0 sm:text-xs"
        >
          {BRAND.mark} {BRAND.name}
        </Link>

        {pieceId ? (
          <p className="font-display mt-3.5 inline-block rotate-1 rounded-md border-2 border-ink bg-pop px-2.5 py-0.5 align-middle text-[0.68rem] font-bold tracking-[0.2em] text-paper sm:ml-0 sm:text-xs">
            Nº {pieceId}
          </p>
        ) : null}

        <h1 className="font-display mt-2 text-2xl leading-tight font-bold text-ink sm:text-3xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="font-body mx-auto mt-1.5 max-w-md text-[0.8rem] leading-relaxed font-light text-ink-soft sm:text-sm">
            {subtitle}
          </p>
        ) : null}

        <Squiggle
          className="mx-auto mt-3 h-3 w-36 text-pop"
          viewBox="0 0 144 12"
          path="M2 8 Q 11 1, 20 8 T 38 8 T 56 8 T 74 8 T 92 8 T 110 8 T 128 8 T 142 8"
          delay={0.38}
        />
      </Entrance>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {children}
      </div>

      <footer className="font-display hidden shrink-0 pt-3 text-center sm:block text-[0.62rem] font-semibold tracking-[0.12em] text-ink-soft/80">
        {BRAND.tagline} — {BRAND.motto}
      </footer>
    </main>
  );
}
