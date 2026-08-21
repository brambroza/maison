"use client";

import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "@/lib/brand";
import type { ButlerMood } from "@/lib/mascot/chatter";
import {
  ARRIVED_DISTANCE,
  clampToStage,
  distance,
  facingAngle,
  pickWanderTarget,
  stepToward,
  turnToward,
  walkSwing,
  wrapAngle,
  STAGE,
  type Ground,
  type Stage,
} from "@/lib/mascot/gait";
import type { MascotReport, MoodListener, PointerSignal } from "./shared";

/** เคอร์เซอร์เงียบเกินเท่านี้ ถือว่าท่านสมาชิกวางมือแล้ว บัตเลอร์จึงเดินเล่นเอง */
const IDLE_MS = 4_000;

/** เงียบนานกว่านี้จึงจะบ่นว่าท่านหายไป */
const LOST_MS = 9_000;

/** เว้นระยะระหว่างการเม้าท์แต่ละครั้ง กันบัตเลอร์พูดไม่หยุด */
const CHATTER_COOLDOWN_MS = 7_000;

/** ความเร็วเคอร์เซอร์ที่ถือว่าท่านสมาชิกกำลังรีบ (สัดส่วนของจอต่อวินาที) */
const FRANTIC_SPEED = 1.15;

/** องศาที่บัตเลอร์เงยหน้าไว้เป็นพื้น เพื่อให้เห็นใบหน้าจากมุมกล้องที่ก้มลงมา */
const HEAD_LIFT = 0.32;

/**
 * ชิ้นส่วนหนึ่งชิ้นของบัตเลอร์ พร้อมเส้นขอบหมึกรอบตัว
 *
 * เส้นขอบทำด้วยการวาดรูปทรงเดิมซ้ำอีกหนึ่งชั้นในขนาดที่ใหญ่กว่าเล็กน้อย
 * แล้วแสดงเฉพาะด้านในของผิว จึงเห็นเป็นขอบหมึกล้อมรอบเหมือน card-stamp
 */
function InkPart({
  color,
  outline = 1.07,
  gradientMap,
  children,
  ...group
}: {
  color: string;
  outline?: number;
  gradientMap: THREE.Texture;
  children: ReactNode;
} & Omit<ThreeElements["group"], "children" | "ref">) {
  return (
    <group {...group}>
      <mesh>
        {children}
        <meshToonMaterial color={color} gradientMap={gradientMap} />
      </mesh>
      <mesh scale={outline}>
        {children}
        <meshBasicMaterial color={COLORS.ink} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

/** แผนที่ไล่แสงแบบขั้นบันได ทำให้แสงตกเป็นปื้นแบนแทนการไล่นวล */
function useToonGradient(): THREE.Texture {
  return useMemo(() => {
    const steps = new Uint8Array([88, 168, 255]);
    const texture = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }, []);
}

/** สมองของบัตเลอร์ เก็บไว้ใน ref เพราะเปลี่ยนทุกเฟรม ไม่ควรให้ React รู้เห็น */
type Brain = {
  position: Ground;
  target: Ground;
  heading: number;
  /** จังหวะการเดิน เดินหน้าตามระยะทางจริง ขาจึงหยุดเองเมื่อยืนนิ่ง */
  phase: number;
  /** ความแรงของการเดิน 0 คือยืนนิ่ง 1 คือเดินเต็มฝีเท้า */
  stride: number;
  mood: ButlerMood;
  spokeAt: number;
  wanderAt: number;
  pokes: number;
  blinkAt: number;
  wasNear: boolean;
};

export type ButlerRigProps = {
  pointer: RefObject<PointerSignal>;
  onReport: (report: MascotReport) => void;
  onMood: MoodListener;
  /** ขอบเขตที่บัตเลอร์เดินได้ ย่อลงตามความกว้างจอ */
  stage?: Stage;
};

/**
 * ตัวบัตเลอร์สามมิติ พร้อมสมองที่สั่งให้เดินตามเคอร์เซอร์และคอยสอดส่อง
 *
 * ทุกอย่างในนี้ขับด้วย useFrame และเขียนค่าลง object3D โดยตรง
 * ไม่มี state ของ React เข้ามาเกี่ยวข้อง เพื่อไม่ให้หน้าเว็บ re-render ทุกเฟรม
 */
export function ButlerRig({ pointer, onReport, onMood, stage = STAGE }: ButlerRigProps) {
  const gradientMap = useToonGradient();
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  const root = useRef<THREE.Group>(null);
  const bob = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const lids = useRef<THREE.Group>(null);
  const legLeft = useRef<THREE.Group>(null);
  const legRight = useRef<THREE.Group>(null);
  const armLeft = useRef<THREE.Group>(null);
  const armRight = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Group>(null);

  const brain = useRef<Brain>({
    position: { x: 0, z: 0 },
    target: { x: 0, z: 0 },
    heading: 0,
    phase: 0,
    stride: 0,
    mood: "idle",
    spokeAt: 0,
    wanderAt: 0,
    pokes: 0,
    blinkAt: 0,
    wasNear: true,
  });

  // เครื่องมือเรขาคณิตที่ใช้ซ้ำทุกเฟรม สร้างครั้งเดียวเพื่อไม่ให้เกิดขยะในลูป
  const tools = useMemo(
    () => ({
      raycaster: new THREE.Raycaster(),
      floor: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      hit: new THREE.Vector3(),
      screen: new THREE.Vector3(),
      ndc: new THREE.Vector2(),
    }),
    [],
  );

  useFrame((_, rawDelta) => {
    // จำกัดช่วงเวลาต่อเฟรม กันบัตเลอร์พุ่งข้ามจอตอนสลับกลับมาจากแท็บอื่น
    // เฟรมแรกได้ค่าเป็นศูนย์ ต้องข้ามไป มิฉะนั้นการหารด้านล่างจะให้ NaN
    // แล้ว NaN จะไหลเข้าเมทริกซ์ของทุกชิ้นส่วนจนบัตเลอร์หายไปทั้งตัว
    const delta = Math.min(rawDelta, 0.05);
    if (delta <= 0) return;

    const now = performance.now();
    const mind = brain.current;

    const signal = pointer.current;
    const silence = now - signal.movedAt;

    // ค่าความเร็วที่วัดไว้ค้างอยู่จนกว่าจะขยับครั้งถัดไป
    // จึงนับว่า "กำลังรีบ" เฉพาะตอนที่เพิ่งขยับจริง ๆ เท่านั้น
    const rush = silence < 260 ? signal.speed : 0;

    // ── หาเป้าหมายบนพื้น ────────────────────────────────
    let following = false;

    if (signal.inside && silence < IDLE_MS) {
      tools.ndc.set(signal.ndcX, signal.ndcY);
      tools.raycaster.setFromCamera(tools.ndc, camera);
      if (tools.raycaster.ray.intersectPlane(tools.floor, tools.hit)) {
        mind.target = clampToStage({ x: tools.hit.x, z: tools.hit.z }, stage);
        following = true;
      }
    }

    if (!following && now > mind.wanderAt) {
      // ท่านสมาชิกวางมือแล้ว บัตเลอร์จึงเดินตรวจตราไปเรื่อย
      mind.target = pickWanderTarget(mind.position, Math.random, stage);
      mind.wanderAt = now + 2_600 + Math.random() * 3_000;
    }

    // ── ก้าวและหันตัว ──────────────────────────────────
    const gap = distance(mind.position, mind.target);
    const step = stepToward(mind.position, mind.target, delta);
    mind.position = step.position;

    if (gap > ARRIVED_DISTANCE) {
      mind.heading = turnToward(
        mind.heading,
        facingAngle(mind.position, mind.target),
        delta,
      );
    }

    // ความแรงของฝีเท้าไล่ตามระยะที่เดินได้จริง เพื่อให้เริ่มและหยุดอย่างนุ่มนวล
    const intensity = Math.min(1, step.travelled / (delta * 2.4));
    mind.stride += (intensity - mind.stride) * Math.min(1, delta * 9);
    mind.phase += step.travelled * 5.4;

    if (root.current) {
      root.current.position.set(mind.position.x, 0, mind.position.z);
      root.current.rotation.y = mind.heading;
    }

    // ── ท่วงท่า ───────────────────────────────────────
    const swing = walkSwing(mind.phase, 0) * mind.stride;
    const swingBack = walkSwing(mind.phase, Math.PI) * mind.stride;

    if (bob.current) {
      // ตัวเด้งสองครั้งต่อหนึ่งก้าว บวกการหายใจเบา ๆ ตอนยืนนิ่ง
      bob.current.position.y =
        Math.abs(Math.sin(mind.phase)) * 0.075 * mind.stride +
        Math.sin(now / 620) * 0.012 * (1 - mind.stride);
      bob.current.rotation.z = swing * 0.05;
    }

    if (legLeft.current) legLeft.current.rotation.x = swing * 0.85;
    if (legRight.current) legRight.current.rotation.x = swingBack * 0.85;
    // แขนซ้ายแกว่งสวนขา ส่วนแขนขวาต้องประคองถาดจึงนิ่งกว่ามาก
    if (armLeft.current) armLeft.current.rotation.x = swingBack * 0.6;
    if (armRight.current) armRight.current.rotation.x = -0.25 + swing * 0.12;

    // ── หัวและตาที่คอยสอดส่อง ───────────────────────────
    const watching: Ground = following
      ? mind.target
      : { x: mind.target.x, z: mind.target.z };
    const desiredYaw = wrapAngle(facingAngle(mind.position, watching) - mind.heading);
    const headYaw = Math.max(-0.7, Math.min(0.7, desiredYaw));
    // เงยหน้าเข้าหาผู้ชมไว้เป็นพื้น มิฉะนั้นกล้องที่ก้มลงมาจะเห็นแต่ปีกหมวก
    const headPitch = Math.max(-0.1, Math.min(0.5, HEAD_LIFT - signal.ndcY * 0.3));

    if (head.current) {
      head.current.rotation.y += (headYaw - head.current.rotation.y) * Math.min(1, delta * 7);
      head.current.rotation.x += (headPitch - head.current.rotation.x) * Math.min(1, delta * 6);
      // เอียงคออย่างสงสัยเมื่อต้องเหลียวมองไกล ๆ
      head.current.rotation.z = -headYaw * 0.16;
    }

    if (eyes.current) {
      // ตาเหลือบไปไกลกว่าคอ บัตเลอร์จึงดูสอดรู้สอดเห็นกว่าที่ควร
      const spare = desiredYaw - headYaw;
      eyes.current.rotation.y = Math.max(-0.34, Math.min(0.34, spare * 0.7 + signal.ndcX * 0.14));
      eyes.current.rotation.x = Math.max(-0.22, Math.min(0.22, -signal.ndcY * 0.22));
    }

    if (lids.current) {
      if (now > mind.blinkAt) mind.blinkAt = now + 2_400 + Math.random() * 3_600;
      const untilBlink = mind.blinkAt - now;
      // กะพริบตาสั้น ๆ ในช่วง 110 มิลลิวินาทีสุดท้ายก่อนถึงกำหนด
      const blinking = untilBlink < 110;
      const target = blinking ? 0.12 : 1;
      lids.current.scale.y += (target - lids.current.scale.y) * Math.min(1, delta * 26);
    }

    if (crown.current) {
      // หมวกไหวตามจังหวะเดินเล็กน้อย ราวกับใส่ไม่แน่น
      crown.current.rotation.z = 0.1 + swing * 0.045;
    }

    // ── อารมณ์และการเม้าท์ ─────────────────────────────
    let mood: ButlerMood | null = null;
    const near = gap <= ARRIVED_DISTANCE;

    if (signal.pokes !== mind.pokes) {
      mind.pokes = signal.pokes;
      mood = "poke";
    } else if (silence > LOST_MS) {
      mood = "lost";
    } else if (rush > FRANTIC_SPEED) {
      mood = "chase";
    } else if (following && near && !mind.wasNear) {
      mood = "arrive";
    } else if (silence > IDLE_MS) {
      mood = "idle";
    }

    mind.wasNear = near;

    if (mood && (mood === "poke" || now - mind.spokeAt > CHATTER_COOLDOWN_MS)) {
      if (mood !== mind.mood || mood === "poke") {
        mind.mood = mood;
        mind.spokeAt = now;
        onMood(mood);
      }
    }

    // ── รายงานตำแหน่งศีรษะกลับไปให้ป้ายคำพูดตามติด ──────────
    if (head.current) {
      head.current.getWorldPosition(tools.screen);
      tools.screen.project(camera);
      onReport({
        x: (tools.screen.x * 0.5 + 0.5) * size.width,
        y: (-tools.screen.y * 0.5 + 0.5) * size.height,
        width: size.width,
      });
    }
  });

  const ink = { gradientMap };

  return (
    <group ref={root} dispose={null}>
      {/* เงาแบนขอบคมใต้เท้า วาดเองแทนการคำนวณเงาจริง เพื่อให้เข้ากับเงาแข็งของแบรนด์ */}
      <mesh rotation-x={-Math.PI / 2} position={[0.12, 0.02, 0.1]}>
        <circleGeometry args={[0.62, 28]} />
        <meshBasicMaterial color={COLORS.ink} transparent opacity={0.16} />
      </mesh>

      <group ref={bob}>
        {/* ขาและรองเท้าหัวมน */}
        <group ref={legLeft} position={[-0.18, 0.44, 0]}>
          <InkPart {...ink} color={COLORS.ink} position={[0, -0.21, 0]} outline={1.16}>
            <capsuleGeometry args={[0.1, 0.2, 4, 14]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.sun} position={[0, -0.4, 0.07]} outline={1.16}>
            <boxGeometry args={[0.22, 0.12, 0.3]} />
          </InkPart>
        </group>
        <group ref={legRight} position={[0.18, 0.44, 0]}>
          <InkPart {...ink} color={COLORS.ink} position={[0, -0.21, 0]} outline={1.16}>
            <capsuleGeometry args={[0.1, 0.2, 4, 14]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.sun} position={[0, -0.4, 0.07]} outline={1.16}>
            <boxGeometry args={[0.22, 0.12, 0.3]} />
          </InkPart>
        </group>

        {/* ลำตัวในเสื้อหางยาว */}
        <InkPart {...ink} color={COLORS.ink} position={[0, 0.88, 0]} outline={1.05}>
          <capsuleGeometry args={[0.36, 0.24, 6, 22]} />
        </InkPart>
        {/* ชายเสื้อด้านหลัง */}
        <InkPart
          {...ink}
          color={COLORS.ink}
          position={[0, 0.66, -0.3]}
          rotation={[0.2, 0, 0]}
          outline={1.1}
        >
          <boxGeometry args={[0.46, 0.6, 0.12]} />
        </InkPart>
        {/* หน้าอกเสื้อเชิ้ต */}
        <InkPart
          {...ink}
          color={COLORS.paper}
          position={[0, 0.96, 0.31]}
          rotation={[0.05, 0, 0]}
          outline={1.09}
        >
          <boxGeometry args={[0.26, 0.42, 0.12]} />
        </InkPart>
        {/* ปกเสื้อสีขาว ตัดเงามืดของเสื้อคลุมไม่ให้กลืนกับศีรษะ */}
        <InkPart
          {...ink}
          color={COLORS.paper}
          position={[0, 1.29, 0.02]}
          rotation={[Math.PI / 2, 0, 0]}
          outline={1.12}
        >
          <torusGeometry args={[0.25, 0.062, 10, 26]} />
        </InkPart>
        {/* หูกระต่าย */}
        <group position={[0, 1.31, 0.28]}>
          <InkPart
            {...ink}
            color={COLORS.pop}
            position={[-0.11, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            outline={1.22}
          >
            <coneGeometry args={[0.11, 0.18, 4]} />
          </InkPart>
          <InkPart
            {...ink}
            color={COLORS.pop}
            position={[0.11, 0, 0]}
            rotation={[0, 0, -Math.PI / 2]}
            outline={1.22}
          >
            <coneGeometry args={[0.11, 0.18, 4]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.pop} outline={1.34}>
            <sphereGeometry args={[0.055, 12, 10]} />
          </InkPart>
        </group>

        {/* แขน กางออกเล็กน้อยให้เห็นแยกจากลำตัว */}
        <group ref={armLeft} position={[-0.44, 1.14, 0.12]} rotation={[0, 0, 0.52]}>
          <InkPart {...ink} color={COLORS.ink} position={[0, -0.23, 0]} outline={1.2}>
            <capsuleGeometry args={[0.09, 0.28, 4, 14]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.paper} position={[0, -0.46, 0]} outline={1.2}>
            <sphereGeometry args={[0.12, 16, 14]} />
          </InkPart>
        </group>
        <group ref={armRight} position={[0.44, 1.14, 0.12]} rotation={[0, 0, -0.52]}>
          <InkPart {...ink} color={COLORS.ink} position={[0, -0.23, 0]} outline={1.2}>
            <capsuleGeometry args={[0.09, 0.28, 4, 14]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.paper} position={[0, -0.46, 0]} outline={1.2}>
            <sphereGeometry args={[0.12, 16, 14]} />
          </InkPart>
          {/* ถาดเสิร์ฟประจำตัว — ตราสัญลักษณ์เดียวกับปุ่มกลางของแถบบัตเลอร์ */}
          <group position={[0.02, -0.6, 0.14]} rotation={[0, 0, 0.52]}>
            <InkPart {...ink} color={COLORS.sun} outline={1.08}>
              <cylinderGeometry args={[0.26, 0.26, 0.04, 24]} />
            </InkPart>
            <InkPart {...ink} color={COLORS.mint} position={[0, 0.07, 0]} outline={1.24}>
              <sphereGeometry args={[0.085, 14, 12]} />
            </InkPart>
          </group>
        </group>

        {/* ศีรษะ */}
        <group ref={head} position={[0, 1.74, 0]}>
          <InkPart {...ink} color={COLORS.paper} outline={1.05}>
            <sphereGeometry args={[0.44, 28, 24]} />
          </InkPart>

          {/* ดวงตา — ชั้น lids ใช้ย่อแนวตั้งตอนกะพริบ */}
          <group ref={lids}>
            <group ref={eyes}>
              {/* ดวงตาเป็นจุดหมึกทึบ อ่านง่ายกว่าลูกตาขาวบนใบหน้าสีเดียวกัน */}
              <group position={[-0.19, 0.12, 0.36]}>
                <mesh>
                  <sphereGeometry args={[0.105, 18, 16]} />
                  <meshBasicMaterial color={COLORS.ink} />
                </mesh>
                <mesh position={[-0.035, 0.04, 0.075]}>
                  <sphereGeometry args={[0.035, 12, 10]} />
                  <meshBasicMaterial color={COLORS.paper} />
                </mesh>
              </group>
              <group position={[0.19, 0.12, 0.36]}>
                <mesh>
                  <sphereGeometry args={[0.105, 18, 16]} />
                  <meshBasicMaterial color={COLORS.ink} />
                </mesh>
                <mesh position={[-0.035, 0.04, 0.075]}>
                  <sphereGeometry args={[0.035, 12, 10]} />
                  <meshBasicMaterial color={COLORS.paper} />
                </mesh>
              </group>
            </group>
          </group>

          {/* แว่นตาข้างเดียวประจำตำแหน่ง สวมพอดีดวงตาขวา */}
          <InkPart {...ink} color={COLORS.sun} position={[0.19, 0.12, 0.42]} outline={1.16}>
            <torusGeometry args={[0.15, 0.022, 10, 26]} />
          </InkPart>

          {/* หนวด */}
          <InkPart
            {...ink}
            color={COLORS.ink}
            position={[-0.085, -0.15, 0.42]}
            rotation={[0, 0, 0.42]}
            scale={[1, 0.34, 0.42]}
            outline={1.2}
          >
            <sphereGeometry args={[0.11, 14, 12]} />
          </InkPart>
          <InkPart
            {...ink}
            color={COLORS.ink}
            position={[0.085, -0.15, 0.42]}
            rotation={[0, 0, -0.42]}
            scale={[1, 0.34, 0.42]}
            outline={1.2}
          >
            <sphereGeometry args={[0.11, 14, 12]} />
          </InkPart>

          {/* หมวกทรงสูง ปีกแคบพอให้เห็นหน้า */}
          <group ref={crown} position={[0, 0.4, -0.04]} rotation={[0, 0, 0.11]}>
            <InkPart {...ink} color={COLORS.ink} outline={1.07}>
              <cylinderGeometry args={[0.42, 0.42, 0.05, 26]} />
            </InkPart>
            <InkPart {...ink} color={COLORS.ink} position={[0, 0.25, 0]} outline={1.06}>
              <cylinderGeometry args={[0.26, 0.27, 0.46, 24]} />
            </InkPart>
            <InkPart {...ink} color={COLORS.pop} position={[0, 0.07, 0]} outline={1.05}>
              <cylinderGeometry args={[0.28, 0.285, 0.1, 24]} />
            </InkPart>
            {/* ตราข้าวหลามตัดของสมาคม */}
            <InkPart
              {...ink}
              color={COLORS.sun}
              position={[0, 0.07, 0.28]}
              rotation={[0, 0, Math.PI / 4]}
              outline={1.36}
            >
              <boxGeometry args={[0.11, 0.11, 0.03]} />
            </InkPart>
          </group>
        </group>
      </group>
    </group>
  );
}
