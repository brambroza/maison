# เปิดสถิติจริงด้วย Supabase

โค้ดพร้อมแล้วทั้งหมด — ไม่มี key เว็บก็ยังทำงานด้วยเลขประมาณการเหมือนเดิม
ทำ 3 ขั้นนี้เมื่อไหร่ก็ได้ สถิติจริงจะติดทันทีโดยไม่ต้องแก้โค้ด

## ขั้นที่ 1 — สร้าง project + ตาราง (~5 นาที)

1. สมัคร/ล็อกอิน [supabase.com](https://supabase.com) → New project (free tier, region Singapore ใกล้สุด)
2. เข้า SQL Editor → รันทั้งก้อนนี้:

```sql
-- ตารางบัญชีนับยอดของสมาคม
create table if not exists ledger (
  id text primary key,
  count bigint not null default 0
);

-- เพิ่มยอดแบบ atomic กันเลขหายตอนคนกดพร้อมกัน
create or replace function ledger_bump(piece text)
returns bigint
language sql
as $$
  insert into ledger (id, count) values (piece, 1)
  on conflict (id) do update set count = ledger.count + 1
  returning count;
$$;

-- ปิดการเข้าถึงจาก anon key — เว็บใช้ service role ฝั่ง server เท่านั้น
alter table ledger enable row level security;
```

3. (แนะนำ) ตั้งยอดตั้งต้นของสองชิ้นที่โชว์เลขอยู่แล้ว ให้ต่อเนื่องจากเลขประมาณการปัจจุบัน
   ไม่งั้นเลขบนเว็บจะหล่นจากหลักหมื่นเหลือหลักหน่วยกลางอากาศ:

```sql
insert into ledger (id, count) values
  ('064', 5700),   -- ผู้ฝ่าฝืนปุ่มต้องห้าม (เลขประมาณการ ณ 2026-08-21)
  ('090', 5462)   -- ผู้เฝ้ารอเสียงตู้ม (เลขประมาณการ ณ 2026-08-21)
on conflict (id) do nothing;
```

> เลขข้างบนคือค่าประมาณการของวันที่ 21 ส.ค. 2026 — ถ้าทำวันอื่น
> ดูเลขจริงบนหน้าเว็บ ณ วันนั้นแล้วใช้เลขนั้นแทน

## ขั้นที่ 2 — เอา key มาใส่ Vercel (~2 นาที)

Supabase → Project Settings → API:
- **URL** เช่น `https://abcdefgh.supabase.co`
- **service_role key** (ตัวยาว ใต้หัวข้อ Project API keys — **ห้ามใช้ anon key**)

Vercel → Project → Settings → Environment Variables (environment: Production):

| ชื่อ | ค่า |
|---|---|
| `SUPABASE_URL` | URL ข้างบน |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |

แล้วกด Redeploy

> service role key อยู่ฝั่ง server เท่านั้น (`lib/ledger-server.ts` + `/api/ledger`)
> ห้าม commit ลง repo ห้ามใส่ชื่อขึ้นต้น `NEXT_PUBLIC_`

## ขั้นที่ 3 — ตรวจว่าติด

1. เปิด `/n/064` กดปุ่ม → เลขต้องเพิ่มขึ้น 1 (ไม่ใช่กระโดดตามสูตรประมาณการ)
2. เปิดจากอีกเครื่อง → ต้องเห็นเลขเดียวกัน
3. หน้า portal `/` → ใต้ชื่อแต่ละชิ้นมีบรรทัด "รับบริการแล้ว N ครั้ง" โผล่ขึ้นมา
4. Supabase → Table Editor → ตาราง `ledger` → เห็นแถว `064`, `090`, `use:XXX` เพิ่มตามการใช้

## สิ่งที่ระบบนับ

| id ในตาราง | คืออะไร |
|---|---|
| `064`, `090` | ยอดมุกสาธารณะ (ผู้ฝ่าฝืน / ผู้เฝ้ารอ) — กดซ้ำนับซ้ำ เป็นฟีเจอร์ |
| `use:XXX` | จำนวนครั้งที่มีคนเล่นชิ้นนั้นจนได้ผลลัพธ์ — โชว์บน portal |

ไม่เก็บข้อมูลผู้ใช้ใด ๆ — ไม่มี IP ไม่มี cookie ไม่มี id ผู้ใช้ มีแต่ตัวเลขนับรวม
