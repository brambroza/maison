"use client";

import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "@/lib/brand";
import type { ButlerMood } from "@/lib/mascot/chatter";
import {
  blendFace,
  FACES,
  restingFace,
  type FaceMood,
  type FaceShape,
} from "@/lib/mascot/face";
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
  bankAngle,
  restingSpring,
  springTo,
  squashStretch,
  STAGE,
  type Spring,
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
const HEAD_LIFT = 0.24;

/** สีหน้าตามอารมณ์ค้างอยู่เท่านี้ ก่อนกลับสู่สีหน้าปกติ */
const EXPRESSION_MS = 5_200;

/** ตำแหน่งพักของคิ้วบนใบหน้า */
const BROW_BASE_Y = 0.24;

/** ถูกทักแล้วบัตเลอร์หยุดหันมาหาท่านสมาชิกนานเท่านี้ ก่อนกลับไปทำหน้าที่ */
const ATTEND_MS = 2_000;

/** จอที่แคบกว่านี้ไม่มีที่ว่างข้างเนื้อหา ต้องหลบลงข้างล่างแทน (พิกเซล) */
const NARROW_WIDTH = 768;

/**
 * จุดยืนหลบ ระบุเป็นพิกัดบนจอ ไม่ใช่พิกัดบนพื้น
 *
 * เพราะกรอบภาพแคบลงเมื่อเข้าใกล้กล้อง จุดบนพื้นจุดเดียวกัน
 * จึงอยู่กลางจอบนเครื่องหนึ่งและหลุดขอบบนอีกเครื่องหนึ่ง
 */
const ASIDE_WIDE = { x: 0.72, y: -0.45 };
const ASIDE_NARROW = { x: 0.5, y: -1 };

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
  /** ถึงเวลานี้จึงจะเลิกหันมาหาท่านสมาชิกแล้วกลับไปเดินตามเคอร์เซอร์ */
  attendUntil: number;
  /** สีหน้าที่กำลังแสดงอยู่ เกลี่ยเข้าหาสีหน้าเป้าหมายทีละเฟรม */
  face: FaceShape;
  /** ชิ้นส่วนที่แกว่งตามหลังตัวหลัก */
  tail: Spring;
  hat: Spring;
  tray: Spring;
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
  const browLeft = useRef<THREE.Mesh>(null);
  const browRight = useRef<THREE.Mesh>(null);
  const mouthLine = useRef<THREE.Mesh>(null);
  const mouthHole = useRef<THREE.Mesh>(null);
  const tail = useRef<THREE.Group>(null);
  const tray = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);

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
    attendUntil: 0,
    face: restingFace(),
    tail: restingSpring(),
    hat: restingSpring(),
    tray: restingSpring(),
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

    // ── ถูกทัก ────────────────────────────────────────
    // ตรวจก่อนอย่างอื่น เพราะการถูกทักสั่งให้หยุดทุกอย่างแล้วหันมาหาท่านสมาชิก
    const poked = signal.pokes !== mind.pokes;
    if (poked) {
      mind.pokes = signal.pokes;
      mind.attendUntil = now + ATTEND_MS;
    }

    // ── หาเป้าหมายบนพื้น ────────────────────────────────
    let following = false;
    // จุดที่ท่านแตะคือศีรษะ ซึ่งแปลงกลับเป็นพื้นได้จุดที่อยู่ไกลกว่าตัวบัตเลอร์เสมอ
    // ถ้าปล่อยให้เดินตามจุดนั้น บัตเลอร์จะหันหลังเดินหนีทุกครั้งที่ถูกทัก
    const attending = now < mind.attendUntil;

    if (attending) {
      mind.target = mind.position;
    } else if (signal.aside) {
      // จอกว้างหลบไปยืนข้างเนื้อหา จอแคบไม่มีที่ว่างข้าง ๆ จึงลงไปยืนข้างล่างแทน
      const spot = size.width < NARROW_WIDTH ? ASIDE_NARROW : ASIDE_WIDE;
      tools.ndc.set(spot.x, spot.y);
      tools.raycaster.setFromCamera(tools.ndc, camera);
      if (tools.raycaster.ray.intersectPlane(tools.floor, tools.hit)) {
        mind.target = { x: tools.hit.x, z: tools.hit.z };
      }
    } else if (signal.inside && silence < IDLE_MS) {
      tools.ndc.set(signal.ndcX, signal.ndcY);
      tools.raycaster.setFromCamera(tools.ndc, camera);
      if (tools.raycaster.ray.intersectPlane(tools.floor, tools.hit)) {
        mind.target = clampToStage({ x: tools.hit.x, z: tools.hit.z }, stage);
        following = true;
      }
    }

    if (!following && !attending && !signal.aside && now > mind.wanderAt) {
      // ท่านสมาชิกวางมือแล้ว บัตเลอร์จึงเดินตรวจตราไปเรื่อย
      mind.target = pickWanderTarget(mind.position, Math.random, stage);
      mind.wanderAt = now + 2_600 + Math.random() * 3_000;
    }

    // ── ก้าวและหันตัว ──────────────────────────────────
    const gap = distance(mind.position, mind.target);
    const step = stepToward(mind.position, mind.target, delta);
    mind.position = step.position;

    const wasFacing = mind.heading;
    if (attending) {
      // ทิศศูนย์คือหันหน้าเข้าหาผู้ชม
      mind.heading = turnToward(mind.heading, 0, delta);
    } else if (gap > ARRIVED_DISTANCE) {
      mind.heading = turnToward(
        mind.heading,
        facingAngle(mind.position, mind.target),
        delta,
      );
    }
    const turnRate = wrapAngle(mind.heading - wasFacing) / delta;

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

    const bank = bankAngle(turnRate);
    const bounce =
      Math.abs(Math.sin(mind.phase)) * 0.075 * mind.stride +
      Math.sin(now / 620) * 0.012 * (1 - mind.stride);

    if (bob.current) {
      bob.current.position.y = bounce;
      // เอนเข้าในโค้งเวลาเลี้ยว บวกการโยกตามจังหวะก้าว
      bob.current.rotation.z = bank + swing * 0.05;
      // ยืดตอนลอย บี้ตอนเท้าถึงพื้น
      const shape = squashStretch(mind.phase, mind.stride);
      bob.current.scale.set(shape.scaleXZ, shape.scaleY, shape.scaleXZ);
    }

    if (shadow.current) {
      // เงาหดลงเมื่อตัวลอยขึ้น ให้รู้สึกว่าเท้าลอยพ้นพื้นจริง
      const shrink = 1 - bounce * 1.6;
      shadow.current.scale.set(shrink, shrink, 1);
    }

    // ── ชิ้นส่วนที่แกว่งตามหลัง ────────────────────────
    mind.tail = springTo(mind.tail, mind.stride * 0.42 - turnRate * 0.04, delta, 90, 11);
    mind.hat = springTo(mind.hat, -turnRate * 0.03 + swing * 0.05, delta, 150, 12);
    mind.tray = springTo(mind.tray, -mind.stride * 0.18 + swingBack * 0.1, delta, 130, 9);

    if (tail.current) tail.current.rotation.x = 0.2 + mind.tail.value;
    if (tray.current) tray.current.rotation.x = mind.tray.value;

    // ขาสั้นจู๋ ถ้าเหวี่ยงเท่าขายาวจะดูเหมือนตีลังกามากกว่าเดิน
    if (legLeft.current) legLeft.current.rotation.x = swing * 0.58;
    if (legRight.current) legRight.current.rotation.x = swingBack * 0.58;
    // แขนซ้ายแกว่งสวนขา ส่วนแขนขวาต้องประคองถาดจึงนิ่งกว่ามาก
    if (armLeft.current) armLeft.current.rotation.x = swingBack * 0.46;
    if (armRight.current) armRight.current.rotation.x = -0.2 + swing * 0.1;

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
      // หมวกไหวตามหลังการเคลื่อนไหวเล็กน้อย ราวกับใส่ไม่แน่น
      crown.current.rotation.z = 0.1 + mind.hat.value;
    }

    // ── อารมณ์และการเม้าท์ ─────────────────────────────
    let mood: ButlerMood | null = null;
    const near = gap <= ARRIVED_DISTANCE;

    if (poked) {
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

    // ── สีหน้า ────────────────────────────────────────
    // อารมณ์ค้างอยู่ครู่หนึ่งแล้วใบหน้ากลับสู่ความสงบตามมารยาท
    const shown: FaceMood = now - mind.spokeAt < EXPRESSION_MS ? mind.mood : "neutral";
    mind.face = blendFace(mind.face, FACES[shown], Math.min(1, delta * 7));
    const face = mind.face;

    if (browLeft.current && browRight.current) {
      browLeft.current.position.y = BROW_BASE_Y + face.browLift;
      browRight.current.position.y = BROW_BASE_Y + face.browLift + face.browSkew;
      // ปลายคิ้วด้านในตกลงเมื่อขมวด จึงต้องกลับทิศกันสองข้าง
      browLeft.current.rotation.z = -face.browAngle;
      browRight.current.rotation.z = face.browAngle + face.browSkew * 1.6;
    }

    if (mouthLine.current) {
      // ครึ่งวงกลมคว่ำอยู่แล้ว จึงพลิกครึ่งรอบเมื่อยิ้ม และย่อจนหายเมื่อปากเรียบ
      mouthLine.current.rotation.z = face.mouthCurve >= 0 ? Math.PI : 0;
      mouthLine.current.scale.set(1, Math.abs(face.mouthCurve), 1);
    }

    if (mouthHole.current) {
      const open = Math.max(0.001, face.mouthOpen);
      mouthHole.current.scale.set(0.8 + open * 0.4, open, open);
    }

    // ตาเบิกกว้างขึ้นตอนตกใจ ตามระดับการอ้าปาก
    if (eyes.current) eyes.current.scale.setScalar(1 + face.mouthOpen * 0.16);

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
      {/* เงาแบนขอบคมใต้ตัว วาดเองแทนการคำนวณเงาจริง เพื่อให้เข้ากับเงาแข็งของแบรนด์ */}
      <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0.1, 0.02, 0.08]}>
        <circleGeometry args={[0.78, 28]} />
        <meshBasicMaterial color={COLORS.ink} transparent opacity={0.16} />
      </mesh>

      <group ref={bob}>
        {/* ขาสั้นจู๋ ปลายมนกลม — ตัวกลมป้อมต้องมีขาเตี้ยจึงจะดูเป็นตุ๊กตา */}
        <group ref={legLeft} position={[-0.24, 0.34, 0]}>
          <InkPart {...ink} color={COLORS.paper} position={[0, -0.11, 0.02]} outline={1.14}>
            <capsuleGeometry args={[0.16, 0.06, 5, 16]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.sun} position={[0, -0.22, 0.03]} outline={1.16}>
            <sphereGeometry args={[0.12, 14, 12]} />
          </InkPart>
        </group>
        <group ref={legRight} position={[0.24, 0.34, 0]}>
          <InkPart {...ink} color={COLORS.paper} position={[0, -0.11, 0.02]} outline={1.14}>
            <capsuleGeometry args={[0.16, 0.06, 5, 16]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.sun} position={[0, -0.22, 0.03]} outline={1.16}>
            <sphereGeometry args={[0.12, 14, 12]} />
          </InkPart>
        </group>

        {/* ลำตัว — ก้อนกลมก้อนเดียว ไม่มีเอว ไม่มีคอ */}
        <InkPart
          {...ink}
          color={COLORS.paper}
          position={[0, 0.86, 0]}
          scale={[1, 0.94, 0.96]}
          outline={1.05}
        >
          <sphereGeometry args={[0.62, 28, 24]} />
        </InkPart>

        {/* หางกลมเล็กด้านหลัง แขวนไว้ให้แกว่งตามจังหวะเดิน */}
        <group ref={tail} position={[0, 0.88, -0.5]}>
          <InkPart {...ink} color={COLORS.paper} position={[0, -0.06, -0.1]} outline={1.2}>
            <sphereGeometry args={[0.17, 16, 14]} />
          </InkPart>
        </group>

        {/* ผ้ากั๊กสีม่วงลูกกวาด — ถ้าตัวเป็นครีมล้วน ขอบหมึกจะไม่มีอะไรตัด */}
        <InkPart
          {...ink}
          color={COLORS.lilac}
          position={[0, 0.78, 0.3]}
          scale={[0.62, 0.78, 0.42]}
          outline={1.08}
        >
          <sphereGeometry args={[0.52, 22, 18]} />
        </InkPart>

        {/* หูกระต่ายประจำตำแหน่ง คาดไว้ใต้คาง */}
        <group position={[0, 1.29, 0.42]}>
          <InkPart
            {...ink}
            color={COLORS.pop}
            position={[-0.12, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            outline={1.22}
          >
            <coneGeometry args={[0.12, 0.2, 4]} />
          </InkPart>
          <InkPart
            {...ink}
            color={COLORS.pop}
            position={[0.12, 0, 0]}
            rotation={[0, 0, -Math.PI / 2]}
            outline={1.22}
          >
            <coneGeometry args={[0.12, 0.2, 4]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.pop} outline={1.34}>
            <sphereGeometry args={[0.06, 12, 10]} />
          </InkPart>
        </group>

        {/* แขนสั้นจิ๋ว ยื่นออกข้างตัวเหมือนตุ๊กตาผ้า */}
        <group ref={armLeft} position={[-0.58, 1.0, 0.06]} rotation={[0, 0, 0.66]}>
          <InkPart {...ink} color={COLORS.paper} position={[0, -0.14, 0]} outline={1.16}>
            <capsuleGeometry args={[0.145, 0.1, 5, 16]} />
          </InkPart>
        </group>
        <group ref={armRight} position={[0.58, 1.0, 0.06]} rotation={[0, 0, -0.66]}>
          <InkPart {...ink} color={COLORS.paper} position={[0, -0.14, 0]} outline={1.16}>
            <capsuleGeometry args={[0.145, 0.1, 5, 16]} />
          </InkPart>
          {/* ถาดเสิร์ฟประจำตัว — ตราสัญลักษณ์เดียวกับปุ่มกลางของแถบบัตเลอร์ */}
          <group ref={tray} position={[0.04, -0.36, 0.16]} rotation={[0, 0, 0.66]}>
            <InkPart {...ink} color={COLORS.sun} outline={1.08}>
              <cylinderGeometry args={[0.24, 0.24, 0.04, 24]} />
            </InkPart>
            <InkPart {...ink} color={COLORS.mint} position={[0, 0.07, 0]} outline={1.24}>
              <sphereGeometry args={[0.08, 14, 12]} />
            </InkPart>
          </group>
        </group>

        {/* ศีรษะ — กลมโตเกือบเท่าลำตัว วางติดตัวโดยไม่มีคอคั่น */}
        <group ref={head} position={[0, 1.72, 0]}>
          {/* หูกลมเล็กสองข้าง วางเยื้องไปหลังเล็กน้อยตามหัวที่กลม */}
          <InkPart {...ink} color={COLORS.paper} position={[-0.4, 0.4, -0.04]} outline={1.2}>
            <sphereGeometry args={[0.19, 16, 14]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.paper} position={[0.4, 0.4, -0.04]} outline={1.2}>
            <sphereGeometry args={[0.19, 16, 14]} />
          </InkPart>
          <InkPart {...ink} color={COLORS.paper} outline={1.05}>
            <sphereGeometry args={[0.56, 30, 26]} />
          </InkPart>

          {/* ดวงตา — ชั้น lids ใช้ย่อแนวตั้งตอนกะพริบ */}
          <group ref={lids}>
            <group ref={eyes}>
              {/* จุดหมึกทึบเม็ดเล็ก วางห่างกันมาก จึงได้แววตาซื่อแบบตุ๊กตา */}
              <group position={[-0.22, 0.06, 0.5]}>
                <mesh>
                  <sphereGeometry args={[0.082, 18, 16]} />
                  <meshBasicMaterial color={COLORS.ink} />
                </mesh>
                <mesh position={[-0.026, 0.032, 0.058]}>
                  <sphereGeometry args={[0.028, 12, 10]} />
                  <meshBasicMaterial color={COLORS.paper} />
                </mesh>
              </group>
              <group position={[0.22, 0.06, 0.5]}>
                <mesh>
                  <sphereGeometry args={[0.082, 18, 16]} />
                  <meshBasicMaterial color={COLORS.ink} />
                </mesh>
                <mesh position={[-0.026, 0.032, 0.058]}>
                  <sphereGeometry args={[0.028, 12, 10]} />
                  <meshBasicMaterial color={COLORS.paper} />
                </mesh>
              </group>
            </group>
          </group>

          {/* คิ้ว — ตัวแสดงอารมณ์หลัก ต้องบางและสั้น ไม่งั้นหน้าจะแก่เกินวัย */}
          <mesh ref={browLeft} position={[-0.22, BROW_BASE_Y, 0.45]} rotation={[0, 0, 0.06]}>
            <boxGeometry args={[0.12, 0.03, 0.05]} />
            <meshBasicMaterial color={COLORS.ink} />
          </mesh>
          <mesh ref={browRight} position={[0.22, BROW_BASE_Y, 0.45]} rotation={[0, 0, -0.06]}>
            <boxGeometry args={[0.12, 0.03, 0.05]} />
            <meshBasicMaterial color={COLORS.ink} />
          </mesh>

          {/* แก้มสีชมพูลูกกวาด แปะแบนไปกับผิวหน้า */}
          <mesh position={[-0.36, -0.1, 0.4]} scale={[1, 0.72, 0.3]}>
            <sphereGeometry args={[0.11, 14, 12]} />
            <meshBasicMaterial color={COLORS.pop} transparent opacity={0.75} />
          </mesh>
          <mesh position={[0.36, -0.1, 0.4]} scale={[1, 0.72, 0.3]}>
            <sphereGeometry args={[0.11, 14, 12]} />
            <meshBasicMaterial color={COLORS.pop} transparent opacity={0.75} />
          </mesh>

          {/* จมูกเม็ดเล็ก จุดกลางของใบหน้าแทนหนวดเดิม */}
          <mesh position={[0, -0.07, 0.52]} scale={[1.25, 0.9, 0.7]}>
            <sphereGeometry args={[0.062, 14, 12]} />
            <meshBasicMaterial color={COLORS.ink} />
          </mesh>

          {/* ปาก — เส้นโค้งพลิกได้ระหว่างยิ้มกับเบ้ และช่องปากที่อ้าได้ */}
          <group position={[0, -0.21, 0.5]}>
            <mesh ref={mouthLine}>
              <torusGeometry args={[0.075, 0.019, 8, 18, Math.PI]} />
              <meshBasicMaterial color={COLORS.ink} />
            </mesh>
            <mesh ref={mouthHole} position={[0, -0.03, 0.01]} scale={[0.8, 0.001, 0.001]}>
              <sphereGeometry args={[0.08, 16, 14]} />
              <meshBasicMaterial color={COLORS.ink} />
            </mesh>
          </group>

          {/* แว่นตาข้างเดียวประจำตำแหน่ง สวมพอดีดวงตาขวา */}
          <InkPart {...ink} color={COLORS.sun} position={[0.22, 0.06, 0.52]} outline={1.16}>
            <torusGeometry args={[0.14, 0.02, 10, 26]} />
          </InkPart>

          {/* หมวกทรงสูงใบย่อม วางเอียงบนหัวกลม ปีกแคบพอให้เห็นหน้า */}
          <group ref={crown} position={[0, 0.5, -0.06]} rotation={[0, 0, 0.11]}>
            <InkPart {...ink} color={COLORS.ink} outline={1.07}>
              <cylinderGeometry args={[0.36, 0.36, 0.05, 26]} />
            </InkPart>
            <InkPart {...ink} color={COLORS.ink} position={[0, 0.2, 0]} outline={1.06}>
              <cylinderGeometry args={[0.24, 0.25, 0.36, 24]} />
            </InkPart>
            <InkPart {...ink} color={COLORS.pop} position={[0, 0.06, 0]} outline={1.05}>
              <cylinderGeometry args={[0.26, 0.265, 0.09, 24]} />
            </InkPart>
            {/* ตราข้าวหลามตัดของสมาคม */}
            <InkPart
              {...ink}
              color={COLORS.sun}
              position={[0, 0.06, 0.26]}
              rotation={[0, 0, Math.PI / 4]}
              outline={1.36}
            >
              <boxGeometry args={[0.1, 0.1, 0.03]} />
            </InkPart>
          </group>
        </group>
      </group>
    </group>
  );
}
