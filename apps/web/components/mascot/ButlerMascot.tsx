"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { drawChatter, type ButlerMood } from "@/lib/mascot/chatter";
import { createPointerSignal, type MascotReport, type PointerSignal } from "./shared";

/** ฉากสามมิติหนักกว่าหน้าเว็บทั้งหน้า จึงโหลดทีหลังและไม่แตะฝั่งเซิร์ฟเวอร์เลย */
const MascotStage = dynamic(() => import("./MascotStage"), { ssr: false });

/** ระยะเวลาที่ป้ายคำพูดค้างอยู่ก่อนจางหายไปเอง */
const BUBBLE_MS = 5_200;

/** ระยะขอบซ้ายขวาที่ป้ายคำพูดห้ามล้ำออกไป */
const BUBBLE_MARGIN = 116;

/** แตะใกล้ศีรษะบัตเลอร์ไม่เกินระยะนี้ ถือว่าท่านสมาชิกทักทาย (พิกเซล) */
const POKE_RADIUS = 76;

/**
 * บัตเลอร์ถอยไปพักแล้วหรือยัง — เก็บในหน่วยความจำเท่านั้น
 * รีเซ็ตเมื่อโหลดหน้าใหม่ทั้งหน้า ตามกติกาของสมาคมที่ห้ามใช้ localStorage
 */
let dismissed = false;

/** บัตเลอร์เว้นจังหวะให้หน้าเว็บวาดเสร็จและให้ป้ายต้อนรับได้พูดก่อน */
const ENTRANCE_DELAY_MS = 900;

/**
 * บัตเลอร์มาสคอตประจำสมาคม — เดินตามเคอร์เซอร์ไปทั่วหน้าจอและคอยสอดส่อง
 *
 * ชั้นนี้ดูแลเฉพาะฝั่ง DOM: รับตำแหน่งเมาส์ ส่งเข้าไปในฉาก
 * แล้วรับตำแหน่งศีรษะกลับออกมาเพื่อวางป้ายคำพูดกับพื้นที่ให้แตะ
 * ตำแหน่งเขียนลง style โดยตรงทุกเฟรม จึงไม่ทำให้หน้าเว็บ re-render ตาม
 */
export function ButlerMascot() {
  const [awake, setAwake] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const pointer = useRef<PointerSignal>(createPointerSignal());
  const frame = useRef<HTMLDivElement>(null);
  const bubbleAnchor = useRef<HTMLDivElement>(null);
  /** ตำแหน่งศีรษะล่าสุดบนจอ ใช้ตัดสินว่าการแตะครั้งนั้นโดนตัวบัตเลอร์หรือไม่ */
  const headAt = useRef({ x: -999, y: -999 });
  const lastLine = useRef<string | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (dismissed) return;

    // ท่านสมาชิกที่ตั้งค่าลดการเคลื่อนไหวไว้ ไม่ควรเจอตัวละครเดินไปมาทั้งหน้าจอ
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => setAwake(!media.matches && !dismissed);

    const timer = window.setTimeout(settle, ENTRANCE_DELAY_MS);
    media.addEventListener("change", settle);

    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", settle);
    };
  }, []);

  // ── รับตำแหน่งเมาส์และนิ้ว แล้วแปลงเป็นพิกัดของกล้อง ──────────
  useEffect(() => {
    if (!awake) return;

    let rect = frame.current?.getBoundingClientRect() ?? null;
    let previous: { x: number; y: number; at: number } | null = null;

    function remeasure() {
      rect = frame.current?.getBoundingClientRect() ?? null;
    }

    function handleMove(event: PointerEvent) {
      if (!rect) remeasure();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const now = performance.now();
      const signal = pointer.current;

      if (previous) {
        const seconds = Math.max(0.016, (now - previous.at) / 1000);
        const travelled = Math.hypot(x - previous.x, y - previous.y) / rect.width;
        // ค่าเฉลี่ยแบบถ่วงน้ำหนัก กันไม่ให้การกระตุกครั้งเดียวนับเป็นความรีบ
        signal.speed += (travelled / seconds - signal.speed) * 0.25;
      }
      previous = { x, y, at: now };

      signal.ndcX = (x / rect.width) * 2 - 1;
      signal.ndcY = -(y / rect.height) * 2 + 1;
      signal.inside = y >= 0 && y <= rect.height;
      signal.movedAt = now;
    }

    function handleLeave() {
      pointer.current.inside = false;
    }

    // ไม่วางปุ่มทับตัวบัตเลอร์ เพราะปุ่มที่ลอยไปทั่วจอจะบังของที่อยู่ข้างล่าง
    // จึงวัดระยะจากจุดที่แตะไปยังศีรษะแทน แล้วปล่อยให้การแตะทะลุลงไปตามปกติ
    function handlePoke(event: PointerEvent) {
      if (!rect) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (Math.hypot(x - headAt.current.x, y - headAt.current.y) <= POKE_RADIUS) {
        pointer.current.pokes += 1;
      }
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleMove, { passive: true });
    window.addEventListener("pointerdown", handlePoke, { passive: true });
    document.addEventListener("pointerleave", handleLeave);
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleMove);
      window.removeEventListener("pointerdown", handlePoke);
      document.removeEventListener("pointerleave", handleLeave);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure);
    };
  }, [awake]);

  // ── ตำแหน่งศีรษะจากฉาก เขียนลง style ตรง ๆ ทุกเฟรม ──────────
  const handleReport = useCallback((report: MascotReport) => {
    headAt.current.x = report.x;
    headAt.current.y = report.y;

    const bubble = bubbleAnchor.current;
    if (bubble) {
      const limit = Math.max(BUBBLE_MARGIN, report.width - BUBBLE_MARGIN);
      const x = Math.min(Math.max(report.x, BUBBLE_MARGIN), limit);
      bubble.style.transform = `translate3d(${x}px, ${report.y}px, 0)`;
    }
  }, []);

  const say = useCallback((mood: ButlerMood) => {
    const next = drawChatter(mood, lastLine.current);
    lastLine.current = next;
    setLine(next);
    setVisible(true);

    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), BUBBLE_MS);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    },
    [],
  );

  // ตรึง element ของฉากไว้ เพื่อไม่ให้ผืนผ้าใบถูกสร้างใหม่ทุกครั้งที่ป้ายคำพูดเปลี่ยน
  const stage = useMemo(
    () => <MascotStage pointer={pointer} onReport={handleReport} onMood={say} />,
    [handleReport, say],
  );

  if (!awake) return null;

  return (
    <div
      ref={frame}
      // เว้นที่ให้แถบบัตเลอร์ด้านล่างบนมือถือ บัตเลอร์จึงไม่เดินไปยืนทับปุ่ม
      className="pointer-events-none fixed inset-x-0 top-0 bottom-[4.6rem] z-40 overflow-hidden sm:bottom-0"
    >
      {/* ตัวฉากเป็นของประดับล้วน ไม่ต้องให้โปรแกรมอ่านหน้าจออ่าน */}
      <div className="absolute inset-0" aria-hidden="true">
        {stage}
      </div>

      {/* ป้ายคำพูด ลอยอยู่เหนือหมวก */}
      <div ref={bubbleAnchor} className="absolute top-0 left-0 will-change-transform">
        <div
          className={`pointer-events-none -mt-16 w-[min(15rem,72vw)] -translate-x-1/2 -translate-y-full transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {line ? (
            <div className="card-stamp -rotate-1 px-4 py-3" role="status">
              <p className="font-display text-[0.58rem] font-semibold tracking-[0.16em] text-pop uppercase">
                {BRAND.mark} บัตเลอร์กระซิบ
              </p>
              <p className="font-display mt-1 text-[0.82rem] leading-snug font-bold text-ink">
                {line}
              </p>
              <button
                type="button"
                onClick={() => {
                  dismissed = true;
                  setAwake(false);
                }}
                className="font-body pointer-events-auto mt-2 cursor-pointer text-[0.6rem] font-light text-ink-soft underline underline-offset-2"
              >
                ขอให้บัตเลอร์ถอยไปพัก
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
