import Link from "next/link";
import { Frame } from "@/components/Frame";
import { COPY } from "@/lib/brand";

/** หน้าสำหรับชิ้นงานที่ยังไม่มีในทะเบียน */
export default function NotFound() {
  return (
    <Frame title="ยังไม่มีชิ้นงานนี้ในทะเบียน" subtitle={COPY.atelier}>
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="font-body max-w-sm text-sm leading-relaxed text-ink-soft">
          สมาคมได้รับเรื่องของท่านสมาชิกไว้พิจารณาแล้ว ช่างฝีมือกำลังรังสรรค์อยู่
          และจะแล้วเสร็จเมื่อถึงเวลาอันสมควร
        </p>

        <Link
          href="/"
          className="btn-stamp btn-stamp-hover font-display px-7 py-2.5 text-sm font-semibold"
        >
          กลับสู่ตู้โชว์คอลเลกชัน
        </Link>
      </div>
    </Frame>
  );
}
