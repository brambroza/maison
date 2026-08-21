"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "@/lib/brand";
import { STAGE, type Stage } from "@/lib/mascot/gait";
import { ButlerRig } from "./ButlerRig";
import type { MascotReport, MoodListener, PointerSignal } from "./shared";

/** มุมกล้อง — แคบไว้เพื่อลดการบิดเบี้ยวที่ขอบจอ */
const FOV = 26;

/** มุมก้มของกล้อง เป็นองศา */
const ELEVATION = 26;

const DEGREE = Math.PI / 180;

/**
 * ความสูงของฉากที่มองเห็นได้ หน่วยเป็นหน่วยโลก
 *
 * ตรึงค่านี้ไว้แล้วคำนวณระยะกล้องย้อนกลับ บัตเลอร์จึงสูงเป็นสัดส่วนเดิมของจอเสมอ
 * จอแคบใช้ค่ามากกว่า เพราะบัตเลอร์ตัวเท่าเดิมจะดูใหญ่เกินไปบนมือถือ
 */
function viewHeightFor(width: number): number {
  return width < 768 ? 13 : 10;
}

/** ระยะกล้องที่ทำให้เห็นฉากสูงเท่าที่ต้องการพอดี */
function distanceFor(viewHeight: number): number {
  return viewHeight / (2 * Math.tan((FOV / 2) * DEGREE));
}

const INITIAL_DISTANCE = distanceFor(10);
const INITIAL_CAMERA: [number, number, number] = [
  0,
  INITIAL_DISTANCE * Math.sin(ELEVATION * DEGREE),
  INITIAL_DISTANCE * Math.cos(ELEVATION * DEGREE),
];

/**
 * จัดกล้องและย่อเวทีให้พอดีกับขนาดจอปัจจุบัน
 *
 * จอมือถือแนวตั้งเห็นพื้นที่ด้านข้างน้อยกว่ามาก ถ้าไม่ย่อเวที
 * บัตเลอร์จะเดินเล่นออกไปนอกเฟรมแล้วหายไปเฉย ๆ
 */
function useFittedStage(): Stage {
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);
  const viewHeight = viewHeightFor(size.width);

  useLayoutEffect(() => {
    const distance = distanceFor(viewHeight);
    camera.position.set(
      0,
      distance * Math.sin(ELEVATION * DEGREE),
      distance * Math.cos(ELEVATION * DEGREE),
    );
    camera.lookAt(0, 1.3, 0);
    camera.updateProjectionMatrix();
  }, [camera, viewHeight]);

  return useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    // เว้นขอบไว้หนึ่งหน่วยกว่า ๆ กันไหล่กับหมวกล้ำออกนอกจอ
    const halfWidth = Math.max(
      1.4,
      Math.min(STAGE.maxX, (viewHeight * aspect) / 2 - 1.2),
    );
    return { ...STAGE, minX: -halfWidth, maxX: halfWidth };
  }, [size.width, size.height, viewHeight]);
}

/** ฉากทั้งหมดที่อยู่ข้างในผืนผ้าใบ แยกออกมาเพื่อให้เรียก useThree ได้ */
function Scene(props: {
  pointer: RefObject<PointerSignal>;
  onReport: (report: MascotReport) => void;
  onMood: MoodListener;
}) {
  const stage = useFittedStage();

  return (
    <>
      <ambientLight intensity={2.6} />
      {/* แสงหลักจากด้านหน้าค่อนไปทางขวา ให้สีสดและด้านมืดยังอ่านออก */}
      <directionalLight position={[5, 8, 9]} intensity={1.9} />
      {/* แสงสะท้อนสีม่วงลูกกวาดจากอีกด้าน กันไม่ให้ด้านมืดกลายเป็นสีดำสนิท */}
      <directionalLight position={[-7, 3, -3]} intensity={0.9} color={COLORS.lilac} />

      <ButlerRig {...props} stage={stage} />
    </>
  );
}

/**
 * ผืนผ้าใบของฉากสามมิติ — ถูกเรียกแบบ dynamic import เท่านั้น
 *
 * ไม่รับเหตุการณ์จากเมาส์เอง (ตั้ง pointer-events ไว้ที่ชั้นนอก)
 * เพราะทุกการคลิกต้องทะลุลงไปถึงชิ้นงานที่อยู่ข้างล่าง
 */
export default function MascotStage(props: {
  pointer: RefObject<PointerSignal>;
  onReport: (report: MascotReport) => void;
  onMood: MoodListener;
}) {
  return (
    <Canvas
      className="absolute! inset-0"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: INITIAL_CAMERA, fov: FOV, near: 1, far: 90 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 1.3, 0);
        gl.setClearAlpha(0);
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
