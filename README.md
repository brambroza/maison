# MAISON ไร้สาระ

สมาคมความไร้สาระชั้นสูง · รับสมาชิกทุกท่าน ยกเว้นไม่รับใคร

เว็บของสมาคม เก็บชิ้นงานในคอลเลกชันไว้ชิ้นละหนึ่ง URL ทุกชิ้นเล่นจบในหนึ่งหน้าจอ
ไม่มีการสมัครสมาชิก ไม่เก็บข้อมูลผู้ใช้ และแชร์ผลได้ด้วยการ์ดที่สร้างอัตโนมัติ

## เริ่มพัฒนา

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `pnpm dev` | รันเซิร์ฟเวอร์สำหรับพัฒนา |
| `pnpm build` | สร้าง production build |
| `pnpm start` | รัน production build (ต้อง build ก่อน) |
| `pnpm lint` | ตรวจ ESLint |
| `pnpm typecheck` | ตรวจชนิดข้อมูลด้วย TypeScript |
| `pnpm test` | รัน unit test ของตรรกะทุกชิ้นงาน |

## โครงสร้าง

```
apps/web/
├── app/
│   ├── page.tsx                 ตู้โชว์คอลเลกชัน
│   ├── n/[id]/page.tsx          หน้าชิ้นงาน เช่น /n/064
│   ├── api/og/route.tsx         การ์ดแชร์ 1200×630
│   ├── sitemap.ts · robots.ts
│   └── layout.tsx               ฟอนต์ Trirong + Bai Jamjuree และ metadata ฐาน
├── components/                  Frame · ResultCard · ShareButton
├── lib/
│   ├── registry.ts              ทะเบียนชิ้นงานทั้งหมด (แหล่งความจริงเดียว)
│   ├── pieces/NNN.logic.ts      ตรรกะและคำวินิจฉัยของแต่ละชิ้น (pure ทั้งหมด)
│   ├── pieces/NNN.ui.tsx        ส่วนติดต่อผู้ใช้ของแต่ละชิ้น (client component)
│   ├── pieces/index.ts          จับคู่เลขชิ้นงานกับตรรกะและ UI
│   ├── share.ts                 เข้ารหัสผลลัพธ์ลง URL และปุ่มแชร์
│   ├── ledger.ts                ยอดสะสมของแต่ละชิ้นงาน
│   ├── og-card.ts               ตัวสร้าง SVG ของการ์ดแชร์
│   └── brand.ts                 สี ถ้อยคำ และ URL ฐาน
├── assets/fonts/                ฟอนต์ไทยสำหรับเรนเดอร์การ์ดแชร์
└── tests/                       unit test ของ lib และตรรกะชิ้นงาน
```

## การเพิ่มชิ้นงานใหม่

1. เพิ่มรายการใน `lib/registry.ts` (เลขสามหลัก ห้ามซ้ำ)
2. สร้าง `lib/pieces/NNN.logic.ts` — ต้อง pure ห้าม import React
3. สร้าง `lib/pieces/NNN.ui.tsx` — รับ `PieceProps` และคืนผลผ่าน `ResultCard`
4. ลงทะเบียนทั้งสองไฟล์ใน `lib/pieces/index.ts`
5. รัน `pnpm test && pnpm lint && pnpm build`

## Deploy

Vercel · framework preset Next.js · root directory `apps/web`

ตั้ง `NEXT_PUBLIC_SITE_URL` เมื่อผูกโดเมนจริงแล้วเท่านั้น (ดู `apps/web/.env.example`)
ระหว่างใช้โดเมน `*.vercel.app` ไม่ต้องตั้งค่าใด ๆ
