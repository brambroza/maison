"use client";

import { useEffect, useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { recordPlay } from "@/lib/ledger-client";
import type { ShareState } from "@/lib/share";
import { ANALYSIS_STEPS, STEP_INTERVAL_MS, drawVerdictIndex, logic } from "./013.logic";
import type { PieceProps } from "./types";

/**
 * Nº 013 · สำนักวินิจฉัยทรงผม
 *
 * กลไก: ถวายรูป → สมาคมวิเคราะห์อย่างพิถีพิถัน → ตอบว่า "ก็แล้วแต่"
 * รูปแสดงตัวอย่างในเครื่องเท่านั้น ไม่ถูกอัปโหลดและไม่ถูกอ่าน
 */
export default function Piece013({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [step, setStep] = useState<number | null>(null);

  // คืนหน่วยความจำของ object URL เมื่อเปลี่ยนรูปหรือออกจากหน้า
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    if (step === null) return;

    // เดินขั้นตอนถัดไปใน callback ของ timer — ขั้นสุดท้ายจึงสรุปคำวินิจฉัย
    const timer = window.setTimeout(() => {
      if (step + 1 < ANALYSIS_STEPS.length) {
        setStep(step + 1);
        return;
      }

      setStep(null);
      setState({ v: drawVerdictIndex() });
      recordPlay(meta.id);
    }, STEP_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [step, meta.id]);

  function handlePhoto(file: File | undefined) {
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
  }

  if (state) {
    return (
      <ResultCard
        pieceId={meta.id}
        pieceTitle={meta.title}
        outcome={logic.toOutcome(state)}
        state={state}
        onRestart={() => {
          setState(null);
          setPhotoUrl(null);
        }}
      />
    );
  }

  if (step !== null) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- รูปเป็น blob URL ในเครื่อง next/image ใช้ไม่ได้
          <img
            src={photoUrl}
            alt="ทรงผมของท่านสมาชิก"
            className="h-32 w-32 rotate-2 rounded-2xl border-[3px] border-ink object-cover shadow-[4px_4px_0_0_var(--color-ink)]"
          />
        ) : null}

        <p className="font-display text-lg font-semibold text-ink sm:text-xl" aria-live="polite">
          {ANALYSIS_STEPS[Math.min(step, ANALYSIS_STEPS.length - 1)]}…
        </p>

        <div className="flex gap-1.5" aria-hidden="true">
          {ANALYSIS_STEPS.map((label, index) => (
            <span
              key={label}
              className={`h-2 w-6 rounded-full border-2 border-ink ${index <= step ? "bg-pop" : "bg-ink/15"}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
      <p className="font-body text-sm leading-relaxed text-ink-soft">
        โปรดถวายรูปทรงผมปัจจุบัน เพื่อให้สมาคมวิเคราะห์ว่าท่านควรตัดผมหรือยัง
      </p>

      <label className="btn-quiet font-body flex cursor-pointer flex-col items-center gap-2 px-8 py-6 text-sm">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- รูปเป็น blob URL ในเครื่อง next/image ใช้ไม่ได้
          <img
            src={photoUrl}
            alt="ตัวอย่างรูปที่เลือก"
            className="h-24 w-24 rounded-xl border-2 border-ink object-cover"
          />
        ) : (
          <svg viewBox="0 0 24 24" className="h-9 w-9 text-ink" fill="none" aria-hidden="true">
            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
            <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
            <path d="M8.5 7.8 20 16M8.5 16.2 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        <span>{photoUrl ? "เปลี่ยนรูป" : "เลือกรูปจากเครื่อง"}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handlePhoto(event.target.files?.[0])}
        />
      </label>

      <p className="font-body text-[0.66rem] leading-relaxed font-light text-ink-soft/80">
        รูปอยู่ในเครื่องของท่านเท่านั้น สมาคมมิได้เห็น แต่วิเคราะห์ได้
      </p>

      <button
        type="button"
        onClick={() => setStep(0)}
        disabled={!photoUrl}
        className="btn-stamp btn-stamp-hover font-display px-7 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-0 disabled:hover:shadow-[4px_4px_0_0_var(--color-ink)]"
      >
        ขอรับการวิเคราะห์
      </button>
    </div>
  );
}
