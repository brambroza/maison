"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getReleasedPieces, type PieceMeta } from "@/lib/registry";

/** สุ่มหนึ่งชิ้นจากรายการ — แยกออกมานอก component ตามกติกา purity ของ React */
function drawPiece(candidates: readonly PieceMeta[]): PieceMeta | undefined {
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * แถบบัตเลอร์ — ปุ่มนำทางติดขอบล่างจอ แสดงเฉพาะมือถือ
 *
 * สามบริการ: กลับตู้โชว์ · ให้บัตเลอร์เลือกชิ้นให้ (สุ่ม) · ชิ้นถัดไปตามทะเบียน
 * ปุ่มกลางยกนูนขึ้นตามธรรมเนียมปุ่มสำคัญของสมาคม
 */
export function ButlerBar() {
  const pathname = usePathname();
  const router = useRouter();
  const pieces = getReleasedPieces();

  /** เลขชิ้นงานที่กำลังเปิดอยู่ ถ้าไม่ได้อยู่หน้าชิ้นงานจะเป็น null */
  const currentId = pathname.startsWith("/n/") ? pathname.slice(3, 6) : null;

  function handleRandom() {
    // บัตเลอร์ไม่เสิร์ฟจานเดิมซ้ำ — ตัดชิ้นที่เปิดอยู่ออกก่อนสุ่ม
    const chosen = drawPiece(pieces.filter((piece) => piece.id !== currentId));
    if (chosen) router.push(`/n/${chosen.id}`);
  }

  function nextId(): string {
    const index = pieces.findIndex((piece) => piece.id === currentId);
    // อยู่หน้าตู้โชว์ = เริ่มจากชิ้นแรก · อยู่ชิ้นสุดท้าย = วนกลับชิ้นแรก
    return pieces[(index + 1) % pieces.length].id;
  }

  const atPortal = pathname === "/";

  return (
    <nav
      aria-label="แถบบัตเลอร์"
      className="fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-ink bg-paper pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2">
        {/* ตู้โชว์ */}
        <Link
          href="/"
          aria-current={atPortal ? "page" : undefined}
          className={`font-display flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.62rem] font-semibold transition-colors ${
            atPortal ? "text-pop" : "text-ink-soft"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path
              d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
          ตู้โชว์
        </Link>

        {/* ให้บัตเลอร์เลือก — ปุ่มกลางยกนูน */}
        <button
          type="button"
          onClick={handleRandom}
          className="font-display -mt-5 flex flex-col items-center gap-1 text-[0.62rem] font-semibold text-ink"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-ink bg-pop text-paper shadow-[3px_3px_0_0_var(--color-ink)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-ink)]">
            {/* ถาดเสิร์ฟของบัตเลอร์ */}
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
              <path
                d="M4 15a8 8 0 0 1 16 0"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path d="M2.5 15h19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="5.5" r="1.6" fill="currentColor" />
            </svg>
          </span>
          ให้บัตเลอร์เลือก
        </button>

        {/* ชิ้นถัดไป */}
        <Link
          href={`/n/${nextId()}`}
          className="font-display flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.62rem] font-semibold text-ink-soft transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path
              d="M5 12h13M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          ชิ้นถัดไป
        </Link>
      </div>
    </nav>
  );
}
