import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // resvg เป็น native addon จึง bundle ไม่ได้ ต้องให้ Next เรียกใช้จาก node_modules ตรง ๆ
  serverExternalPackages: ["@resvg/resvg-js"],

  // ไฟล์ฟอนต์ไทยถูกอ่านตอน runtime จึงต้องบอก Next ให้พาไฟล์ไปด้วยตอน deploy
  // ไม่เช่นนั้นการ์ดแชร์บน production จะพังทั้งที่ทดสอบบนเครื่องผ่าน
  outputFileTracingIncludes: {
    "/api/og": ["./assets/fonts/**"],
  },
};

export default nextConfig;
