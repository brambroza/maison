"use client";

import { useEffect, useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { COPY } from "@/lib/brand";
import { formatCount, increment } from "@/lib/ledger";
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
    const nextCount = await increment(count);
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
      <p className="font-body text-[0.6rem] tracking-[0.28em] text-gold-dim uppercase">
        เวลาก่อนเสียงตู้มประจำปี
      </p>

      <p
        className="font-display text-4xl tracking-[0.14em] text-gold tabular-nums sm:text-5xl"
        aria-label="สมาคมไม่เปิดเผยเวลา"
      >
        {mask}
      </p>

      <p className="font-body max-w-xs text-sm leading-relaxed text-ivory/55">
        สมาคมขอสงวนสิทธิ์ในการไม่เปิดเผยวันเวลา ท่านสมาชิกทำได้เพียงเฝ้ารอ
      </p>

      <button
        type="button"
        onClick={handleJoin}
        className="font-body cursor-pointer rounded-full border border-gold px-9 py-3 text-sm tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-noir"
      >
        ลงชื่อเป็นผู้เฝ้ารอ
      </button>

      <p className="font-body text-[0.65rem] leading-relaxed text-ivory/35">
        มีผู้เฝ้ารออยู่แล้ว {formatCount(count)} ท่าน
        <br />
        {COPY.ledgerNote}
      </p>
    </div>
  );
}
