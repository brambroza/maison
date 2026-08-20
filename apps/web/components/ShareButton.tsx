"use client";

import { useState } from "react";
import { COPY } from "@/lib/brand";
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

  async function handleShare() {
    const origin = window.location.origin;
    const outcome = await shareResult(buildShareUrl(origin, pieceId, state), pieceTitle);

    if (outcome === "copied") {
      setLabel(COPY.shareCopied);
      window.setTimeout(() => setLabel(COPY.shareCta), 2400);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="btn-stamp btn-stamp-hover font-display px-7 py-2.5 text-sm font-semibold sm:text-base"
    >
      {label}
    </button>
  );
}
