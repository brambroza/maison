"use client";

import { useRef, useState } from "react";
import { COPY } from "@/lib/brand";
import { gsap, prefersReducedMotion } from "@/lib/motion/gsap";
import { buildShareUrl, shareResult, type ShareState } from "@/lib/share";

type ShareButtonProps = {
  /** เลขประจำชิ้นงานที่จะแชร์ */
  pieceId: string;
  /** ชื่อชิ้นงาน ใช้เป็นหัวข้อในแผงแชร์ของระบบปฏิบัติการ */
  pieceTitle: string;
  /** ผลลัพธ์ที่จะฝังไปกับลิงก์ */
  state: ShareState;
};

/**
 * ปุ่มแสดงผลต่อสาธารณชน
 *
 * บนมือถือจะเปิดแผงแชร์ของระบบ บนเดสก์ท็อปจะคัดลอกลิงก์ให้แทน
 */
export function ShareButton({ pieceId, pieceTitle, state }: ShareButtonProps) {
  const [label, setLabel] = useState<string>(COPY.shareCta);
  const button = useRef<HTMLButtonElement>(null);

  /** ปั๊มปุ่มลงหนึ่งครั้งเป็นการรับทราบ เหมือนตรายางกระทบกระดาษ */
  function acknowledge() {
    if (!button.current || prefersReducedMotion()) return;

    gsap.fromTo(
      button.current,
      { scale: 0.94 },
      { scale: 1, duration: 0.45, ease: "elastic.out(1, 0.45)", clearProps: "transform" },
    );
  }

  async function handleShare() {
    const origin = window.location.origin;
    const outcome = await shareResult(buildShareUrl(origin, pieceId, state), pieceTitle);

    acknowledge();

    if (outcome === "copied") {
      setLabel(COPY.shareCopied);
      window.setTimeout(() => setLabel(COPY.shareCta), 2400);
    }
  }

  return (
    <button
      ref={button}
      type="button"
      onClick={handleShare}
      className="btn-stamp btn-stamp-hover font-display px-7 py-2.5 text-sm font-semibold sm:text-base"
    >
      {label}
    </button>
  );
}
