---
description: สร้างชิ้นงานใหม่เต็มชุดจากคลังไอเดีย — logic + UI + copy + test + ตรวจ + commit
argument-hint: <Nº เช่น 011> [รายละเอียดไอเดียเพิ่มเติม ถ้าไม่มีในคลัง]
---

สร้างชิ้นงาน Nº $ARGUMENTS ตามขั้นตอนนี้ตามลำดับ ห้ามข้าม:

## 1. เตรียม
- อ่านไอเดียจาก `content/ideas.md` ตามเลข Nº ที่ระบุ — ถ้าไม่มีในคลังและผู้ใช้ไม่ได้ให้รายละเอียดมา ให้ถามก่อน
- เช็ค `apps/web/lib/registry.ts` — ถ้าเลขซ้ำให้หยุดและแจ้ง
- สร้าง branch: `git checkout -b piece/NNN`

## 2. สร้าง (มอบงานให้ artisan)
ใช้ artisan agent สร้าง: `NNN.logic.ts` + `NNN.ui.tsx` + ลงทะเบียน index.ts/registry.ts + test
ส่งไอเดียเต็ม ๆ จาก ideas.md ไปให้ พร้อมย้ำ: ดู pattern จากชิ้นใกล้เคียงที่สุดก่อนเขียน

## 3. เกลาถ้อยคำ (มอบงานให้ court-poet)
ให้ court-poet เกลา copy ทุก string ของชิ้นใหม่ + registry entry

## 4. ตรวจ (มอบงานให้ inspector)
ให้ inspector ตรวจเต็ม checklist — ถ้าไม่ผ่าน วนกลับข้อ 2/3 แก้จนผ่าน

## 5. ปิดงาน
- รัน `pnpm test && pnpm lint && pnpm typecheck && pnpm build` รอบสุดท้ายเอง
- render การ์ดจริง: start server → curl `/api/og?id=NNN&v=0` → Read รูปดูด้วยตา
- อัปเดต `content/ideas.md`: ย้ายเลขนี้เข้าบรรทัด "เลขที่ใช้แล้ว"
- commit บน branch ด้วย conventional commit: `feat(piece): เปิดชิ้นงาน Nº NNN <ชื่อ>`
- **ห้าม push โดยไม่ถามก่อน** — สรุปผลแล้วถามผู้ใช้ว่าจะ push/merge เลยไหม

รายงานจบ: ชื่อชิ้น + URL ที่จะได้ (`/n/NNN`) + รูปการ์ด + สถานะ checklist
