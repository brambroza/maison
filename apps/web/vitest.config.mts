import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // ให้ตรงกับ paths ใน tsconfig.json
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
