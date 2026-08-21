"use client";

import { useEffect, useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { COPY } from "@/lib/brand";
import { formatCount } from "@/lib/ledger";
import { bump, recordPlay } from "@/lib/ledger-client";
import type { ShareState } from "@/lib/share";
import { drawVerdictIndex, logic } from "./090.logic";
import type { PieceProps } from "./types";

/** อักขระที่ใช้สลับไปมาแทนตัวเลขนับถอยหลัง เพื่อไม่ให้ผู้ใดเดาวันได้ */
const MASK_GLYPHS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];

/**
 * Nº 090 · ห้องรอเสียงตู้ม
 *
 * กลไก: แสดงเวลานับถอยหลังที่อ่านไม่ออกโดยเจตนา
 * ท่านสมาชิกลงชื่อเป็นผู้เฝ้ารอแล้วรับหมายเลขประจำตัว
 */
export default function Piece090({ meta, initialState, ledgerCount }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [count, setCount] = useState(ledgerCount);
  const [mask, setMask] = useState("๐๐ : ๐๐ : ๐๐");

  useEffect(() => {
    if (state) return;

    const timer = window.setInterval(() => {
      setMask(
        [0, 1, 2]
          .map(() =>
            [0, 1].map(() => MASK_GLYPHS[Math.floor(Math.random() * 10)]).join(""),
          )
          .join(" : "),
      );
    }, 90);

    return () => window.clearInterval(timer);
  }, [state]);

  async function handleJoin() {
    // ยอดจริงจากสมุดบัญชีกลาง — ถ้ายังไม่เปิดใช้ ถอยไปบวกเองในเครื่อง
    const nextCount = (await bump(meta.id)) ?? count + 1;
    recordPlay(meta.id);
    setCount(nextCount);
    setState({ v: drawVerdictIndex(), s: nextCount });
  }

  if (state) {
    return (
      <ResultCard
        pieceId={meta.id}
        pieceTitle={meta.title}
        outcome={logic.toOutcome(state)}
        state={state}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <p className="font-display text-[0.68rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">
        เวลาก่อนเสียงตู้มประจำปี
      </p>

      <p
        className="card-stamp font-display -rotate-1 px-6 py-4 text-3xl font-bold tracking-[0.1em] text-lilac tabular-nums sm:text-4xl"
        aria-label="สมาคมไม่เปิดเผยเวลา"
      >
        {mask}
      </p>

      <p className="font-body max-w-xs text-sm leading-relaxed text-ink-soft">
        สมาคมขอสงวนสิทธิ์ในการไม่เปิดเผยวันเวลา ท่านสมาชิกทำได้เพียงเฝ้ารอ
      </p>

      <button
        type="button"
        onClick={handleJoin}
        className="btn-stamp btn-stamp-hover font-display px-8 py-3 text-sm font-semibold sm:text-base"
      >
        ลงชื่อเป็นผู้เฝ้ารอ
      </button>

      <p className="font-body text-[0.68rem] leading-relaxed font-light text-ink-soft/80">
        มีผู้เฝ้ารออยู่แล้ว {formatCount(count)} ท่าน
        <br />
        {COPY.ledgerNote}
      </p>
    </div>
  );
}
