"use client";

import { useEffect, useRef, useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { recordPlay } from "@/lib/ledger-client";
import type { ShareState } from "@/lib/share";
import {
  GOSSIP_LINES,
  GOSSIP_SCHEDULE,
  SESSION_SECONDS,
  logic,
  verdictIndexFor,
} from "./083.logic";
import type { PieceProps } from "./types";

/** เสียงนินทาแสดงค้างบนจอนานเท่านี้ (วินาที) */
const GOSSIP_VISIBLE_SECONDS = 4;

/**
 * Nº 083 · สมาธิสนามจริง
 *
 * กลไก: นั่งสมาธิ 45 วินาที มีบทนินทาของป้าข้างบ้าน (สมมติ) แทรกเป็นระยะ
 * ปุ่ม "เถียงในใจ" กดได้ตลอด — ยิ่งกด จิตยิ่งไม่นิ่ง จบแล้วรับคำวินิจฉัย
 */
export default function Piece083({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const objectionsRef = useRef(0);
  const [objections, setObjections] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;

    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);

      if (seconds >= SESSION_SECONDS) {
        window.clearInterval(timer);
        setStartedAt(null);
        setState({
          v: verdictIndexFor(objectionsRef.current),
          s: objectionsRef.current,
        });
        recordPlay(meta.id);
        return;
      }

      setElapsed(seconds);
    }, 250);

    return () => window.clearInterval(timer);
  }, [startedAt, meta.id]);

  function handleStart() {
    objectionsRef.current = 0;
    setObjections(0);
    setElapsed(0);
    setStartedAt(Date.now());
  }

  function handleObjection() {
    objectionsRef.current += 1;
    setObjections(objectionsRef.current);
  }

  if (state) {
    return (
      <ResultCard
        pieceId={meta.id}
        pieceTitle={meta.title}
        outcome={logic.toOutcome(state)}
        state={state}
        onRestart={() => setState(null)}
      />
    );
  }

  if (startedAt !== null) {
    // หาเสียงนินทาที่ควรแสดง ณ วินาทีนี้ (แสดงค้าง 4 วินาทีหลังดัง)
    const gossipIndex = GOSSIP_SCHEDULE.findIndex(
      (at) => elapsed >= at && elapsed < at + GOSSIP_VISIBLE_SECONDS,
    );

    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <p className="font-display text-[0.68rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">
          เหลืออีก {SESSION_SECONDS - elapsed} วินาที
        </p>

        <p className="font-display text-2xl font-semibold text-ink">
          หายใจเข้า… หายใจออก…
        </p>

        <div className="flex min-h-24 items-center justify-center" aria-live="polite">
          {gossipIndex >= 0 ? (
            <p className="card-stamp rotate-1 max-w-xs bg-sun px-5 py-3 text-sm leading-relaxed text-ink">
              เสียงจากรั้วข้างบ้าน: “{GOSSIP_LINES[gossipIndex % GOSSIP_LINES.length]}”
            </p>
          ) : (
            <p className="font-body text-sm font-light text-ink-soft/60">(ความเงียบอันน่าสงสัย)</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleObjection}
          className="btn-quiet font-display px-8 py-2.5 text-sm font-semibold"
        >
          เถียงในใจ ({objections})
        </button>

        <p className="font-body text-[0.64rem] font-light text-ink-soft/70">
          กดเมื่อท่านรู้สึกอยากชี้แจงข้อเท็จจริง
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <p className="font-body max-w-sm text-sm leading-relaxed text-ink-soft">
        การนั่งสมาธิในห้องเงียบนั้นง่ายเกินไป สมาคมจึงจัดสนามจริง:
        นั่งสมาธิ {SESSION_SECONDS} วินาที ท่ามกลางเสียงนินทาของป้าข้างบ้าน (สมมติ)
      </p>

      <button
        type="button"
        onClick={handleStart}
        className="btn-stamp btn-stamp-hover font-display px-8 py-3 text-sm font-semibold sm:text-base"
      >
        เริ่มปฏิบัติธรรม
      </button>

      <p className="font-body max-w-xs text-[0.66rem] leading-relaxed font-light text-ink-soft/70">
        บทนินทาทั้งหมดเป็นเรื่องสมมติ ความรู้สึกอยากเถียงเป็นของจริง
      </p>
    </div>
  );
}
