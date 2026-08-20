# Go-Live รอบที่ 1 — เว็บของสมาคม

สถานะโค้ด ณ วันที่ 20 สิงหาคม 2026: พร้อม deploy
`pnpm test` 46 ข้อผ่าน · `pnpm lint` · `pnpm typecheck` · `pnpm build` ผ่านทั้งหมด

---

## ขั้นที่ 1 — ขึ้น GitHub

```bash
gh repo create maison-raisara --private --source=. --remote=origin --push
```

ยังไม่ได้ติดตั้ง `gh` บนเครื่องนี้ ถ้าไม่อยากติดตั้ง ให้สร้าง repo ว่างบนเว็บ GitHub แล้ว

```bash
git remote add origin git@github.com:<บัญชีของท่าน>/maison-raisara.git
git push -u origin main
```

commit แรกทำไว้ให้แล้ว ยังไม่ push เพราะยังไม่ได้รับอนุญาต

## ขั้นที่ 2 — ต่อ Vercel

1. Vercel → Add New Project → เลือก repo `maison-raisara`
2. **Root Directory: `apps/web`** (สำคัญ ถ้าไม่ตั้งจะ build ไม่ผ่าน)
3. Framework Preset: Next.js · Build Command และ Output ปล่อยเป็นค่าเริ่มต้น
4. ตั้งชื่อ project เป็น `maison-raisara` เพื่อจอง `maison-raisara.vercel.app` ไว้
5. ยังไม่ต้องตั้ง environment variable ใด ๆ
6. Deploy

## ขั้นที่ 3 — ตรวจก่อนประกาศ

### ต้องผ่านทุกข้อ

- [ ] เปิดครบทั้ง 8 URL: `/n/007` `/n/018` `/n/031` `/n/042` `/n/055` `/n/064` `/n/077` `/n/090`
- [ ] แต่ละชิ้นเล่นจนได้ผลลัพธ์ และปุ่มแชร์ทำงาน
- [ ] เปิดลิงก์ผลที่แชร์แล้วบนเครื่องอื่น ต้องเห็นผลลัพธ์เดิม
- [ ] **ส่งลิงก์เข้าแชท LINE ของตัวเอง** ต้องเห็นการ์ดพร้อมข้อความไทยครบทุกวรรณยุกต์
- [ ] วาง URL ใน [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) แล้วกด Scrape Again
- [ ] ทดสอบบนมือถือจริงทั้ง iOS Safari และ Android Chrome — ทุกชิ้นต้องจบในหนึ่งจอ
- [ ] เปิด `/robots.txt` และ `/sitemap.xml` ต้องได้ผลถูกต้อง
- [ ] ลอง `/n/999` ต้องเจอหน้า "ยังไม่มีชิ้นงานนี้ในทะเบียน"

### ควรผ่าน

- [ ] Lighthouse mobile: Performance ≥ 90 · Accessibility ≥ 90
- [ ] เปิด Vercel Analytics ใน Project Settings (โค้ดฝั่งเว็บติดตั้งไว้แล้ว)
- [ ] อ่านถ้อยคำทุกชิ้นอีกรอบ ต้องไม่มีประโยคที่หลุด tone ราชสำนัก

> **การ์ดแชร์ตรวจบน localhost ไม่ได้** ต้อง deploy ขึ้น preview ก่อนเสมอ
> เพราะ LINE และ Facebook ต้องเข้าถึง URL จากภายนอก

## ขั้นที่ 4 — ผูกโดเมน (เมื่อจองแล้ว)

1. จด `maisonraisara.com` แล้วชี้ DNS มาที่ Vercel
2. Vercel → Domains → เพิ่มโดเมน
3. ตั้ง environment variable `NEXT_PUBLIC_SITE_URL=https://maisonraisara.com`
4. Redeploy แล้วตรวจการ์ดแชร์ซ้ำอีกรอบ (URL ในการ์ดจะเปลี่ยนตาม)

---

## สิ่งที่ต้องรู้ก่อนประกาศ

**ตัวเลขยอดรวมยังเป็นการประมาณการ** — "มีผู้ฝ่าฝืนแล้ว 41,003 ท่าน" คำนวณจาก
(เลขชิ้นงาน, วันที่) ไม่ใช่ยอดจริง ทุกคนเห็นเลขเดียวกันและเลขเพิ่มขึ้นทุกวัน
หน้าเว็บกำกับไว้แล้วว่า "ตัวเลขโดยประมาณการของสมาคม · ตรวจนับด้วยมือ"
เมื่อต่อ Supabase ให้แก้เฉพาะ `getCount` กับ `increment` ใน `apps/web/lib/ledger.ts`

**การ์ดแชร์ไม่ใช้ next/og** — satori วางวรรณยุกต์ไทยผิดตำแหน่ง
(คำว่า "ที่" ถูกวาดเป็น "ที" — [vercel/satori#668](https://github.com/vercel/satori/issues/668))
จึงเปลี่ยนไปประกอบ SVG เองแล้วเรนเดอร์ด้วย `@resvg/resvg-js`
ผลคือถ้อยคำไทยเขียนได้อิสระ แต่เลย์เอาต์การ์ดต้องจัดตำแหน่งเองใน `lib/og-card.ts`

**ไม่มีฐานข้อมูลและไม่เก็บข้อมูลผู้ใช้เลย** — ข้อความที่ท่านสมาชิกวางใน Nº 007
ถูกวิเคราะห์ในเบราว์เซอร์และไม่ถูกส่งออกไปไหน ลิงก์แชร์พาไปเฉพาะดัชนีคำวินิจฉัย
ตัวเลขประกอบ และชื่องานสั้น ๆ ของ Nº 055 ที่ผ่านการกรองแล้วเท่านั้น

---

## รอบถัดไป

1. LINE OA + Messaging API + LIFF + บัตเลอร์ตอบแชทด้วย Claude API — งานใหญ่สุดที่เหลือ
   และเป็นก้อนเดียวที่มีค่าใช้จ่ายรายเดือน
2. Supabase — เปลี่ยนยอดสะสมให้เป็นตัวเลขจริง
3. `.claude/commands/new-piece` และ sub-agents artisan / court-poet / inspector —
   ทำเมื่อ pattern นิ่งแล้ว ตอนนี้มีตัวอย่างครบ 8 ชิ้นให้ยึดเป็นแม่แบบได้
4. เปิดชิ้นงานใหม่ศุกร์ละหนึ่งตามแผนเดิมใน CLAUDE.md
