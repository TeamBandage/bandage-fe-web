'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ── Scene constants ────────────────────────────────────────────────────────────

const SCENE_R = 2.8;
const CAM_R = 5.8;
const CAM_Y = 2.2;

// Musicians at 0°/90°/180°/270° on the XZ circle
//   0: Guitarist  →  +X
//   1: Bassist    →  +Z (toward initial camera)
//   2: Drummer    →  -X
//   3: Vocalist   →  -Z
const MUSICIAN_POS: [number, number, number][] = [
  [SCENE_R, 0, 0],
  [0, 0, SCENE_R],
  [-SCENE_R, 0, 0],
  [0, 0, -SCENE_R],
];

const MUSICIAN_COLORS = ['#e8856a', '#5a8fd4', '#9b6dd9', '#4dc88a'] as const;

// Camera keyframes — position & lookAt for each phase
const CAM_KEYS: Array<{ pos: THREE.Vector3Tuple; look: THREE.Vector3Tuple }> = [
  { pos: [CAM_R, CAM_Y, 0], look: [SCENE_R, 1.2, 0] }, // guitarist
  { pos: [0, CAM_Y, CAM_R], look: [0, 1.2, SCENE_R] }, // bassist
  { pos: [-CAM_R, CAM_Y, 0], look: [-SCENE_R, 1.2, 0] }, // drummer
  { pos: [0, CAM_Y, -CAM_R], look: [0, 1.2, -SCENE_R] }, // vocalist
  { pos: [0, 7, 8], look: [0, 0, 0] }, // pull-back
];

const PHASE_LABELS = [
  { headline: '당신의 밴드를', sub: 'Guitar is the heartbeat.' },
  { headline: '하나의 흐름으로', sub: 'Bass drives the groove.' },
  { headline: '리듬에 실어', sub: 'Drums hold the band together.' },
  { headline: '완성하세요', sub: 'Vocal brings it to life.' },
  { headline: 'Bandage', sub: '밴드의 모든 것을 한 곳에.' },
];

// ── GLB drummer model ─────────────────────────────────────────────────────────

function DrummerModel({ position }: { position: THREE.Vector3Tuple }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/drummer.glb');
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    // Play first animation (mixamo.com driving animation)
    const action = Object.values(actions)[0];
    action?.reset().fadeIn(0.3).play();

    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [actions, scene]);

  return (
    <group ref={groupRef} position={position}>
      {/* Mixamo exports at 1 unit = 1 cm; scale to ~1.75 Three.js meters */}
      <primitive object={scene} scale={0.01} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

useGLTF.preload('/models/drummer.glb');

// ── Placeholder figures for the other three musicians ─────────────────────────

function MusicianFigure({
  position,
  color,
  yRot = 0,
}: {
  position: THREE.Vector3Tuple;
  color: string;
  yRot?: number;
}) {
  const c = new THREE.Color(color);
  const emit = c.clone().multiplyScalar(0.22);
  const sharedMat = (
    <meshStandardMaterial color={c} emissive={emit} roughness={0.55} metalness={0.1} />
  );

  return (
    <group position={position} rotation={[0, yRot, 0]}>
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        {sharedMat}
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.28, 0.52, 0.16]} />
        {sharedMat}
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.24, 0.16, 0.14]} />
        {sharedMat}
      </mesh>
      <mesh position={[-0.07, 0.56, 0]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        {sharedMat}
      </mesh>
      <mesh position={[0.07, 0.56, 0]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        {sharedMat}
      </mesh>
      <mesh position={[-0.2, 1.28, 0]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[0.08, 0.44, 0.1]} />
        {sharedMat}
      </mesh>
      <mesh position={[0.2, 1.28, 0]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[0.08, 0.44, 0.1]} />
        {sharedMat}
      </mesh>
    </group>
  );
}

// ── Ground rings ──────────────────────────────────────────────────────────────

function GroundRings() {
  return (
    <>
      {([SCENE_R + 0.9, SCENE_R] as number[]).map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <ringGeometry args={[r - 0.008, r + 0.008, 96]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={i === 0 ? 0.04 : 0.08} />
        </mesh>
      ))}
    </>
  );
}

// ── Camera rig (reads shared progress ref — no effect, just useFrame) ─────────

function CameraRig({ progress }: { progress: { current: number } }) {
  const { camera } = useThree();
  const tgtPos = useRef(new THREE.Vector3(...CAM_KEYS[0]!.pos));
  const tgtLook = useRef(new THREE.Vector3(...CAM_KEYS[0]!.look));
  const smoothLook = useRef(new THREE.Vector3(...CAM_KEYS[0]!.look));

  // Seed initial position
  useEffect(() => {
    camera.position.set(...CAM_KEYS[0]!.pos);
    camera.lookAt(new THREE.Vector3(...CAM_KEYS[0]!.look));
  }, [camera]);

  useFrame(() => {
    const p = progress.current * (CAM_KEYS.length - 1);
    const idx = Math.min(Math.floor(p), CAM_KEYS.length - 2);
    const t = p - idx;

    const from = CAM_KEYS[idx]!;
    const to = CAM_KEYS[idx + 1]!;

    tgtPos.current.lerpVectors(new THREE.Vector3(...from.pos), new THREE.Vector3(...to.pos), t);
    tgtLook.current.lerpVectors(new THREE.Vector3(...from.look), new THREE.Vector3(...to.look), t);

    camera.position.lerp(tgtPos.current, 0.08);
    smoothLook.current.lerp(tgtLook.current, 0.08);
    camera.lookAt(smoothLook.current);
  });

  return null;
}

// ── Scene graph ───────────────────────────────────────────────────────────────

function Scene({ progress }: { progress: { current: number } }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <hemisphereLight args={['#1a1a2e', '#080808', 0.55]} />

      {/* Per-musician colored accent lights */}
      {MUSICIAN_POS.map((pos, i) => (
        <pointLight
          key={i}
          position={[pos[0], 2.8, pos[2]]}
          color={MUSICIAN_COLORS[i]}
          intensity={1.4}
          distance={5}
          decay={2}
        />
      ))}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#0a0a0e" roughness={0.92} metalness={0.04} />
      </mesh>
      <GroundRings />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={14} blur={2.8} far={4} />

      <Environment preset="night" />

      {/* Guitarist — at +X, camera approaches from +X → face +X = yRot -π/2 */}
      <MusicianFigure position={MUSICIAN_POS[0]!} color={MUSICIAN_COLORS[0]} yRot={-Math.PI / 2} />
      {/* Bassist — at +Z, camera approaches from +Z → face +Z = yRot π */}
      <MusicianFigure position={MUSICIAN_POS[1]!} color={MUSICIAN_COLORS[1]} yRot={Math.PI} />
      {/* Drummer — at -X, camera approaches from -X → face -X = yRot π/2 */}
      <Suspense fallback={null}>
        <DrummerModel position={MUSICIAN_POS[2]!} />
      </Suspense>
      {/* Vocalist — at -Z, camera approaches from -Z → face -Z = yRot 0 (default) */}
      <MusicianFigure position={MUSICIAN_POS[3]!} color={MUSICIAN_COLORS[3]} yRot={0} />

      <CameraRig progress={progress} />
    </>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export function HeroCinematic() {
  // Use state so Canvas re-renders when the scroll div mounts
  const [scrollerEl, setScrollerEl] = useState<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Shared scalar read by CameraRig inside Canvas — written only in GSAP callback
  const cameraProgress = useRef<number>(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!scrollerEl || !stageRef.current) return;

    // 1. Proxy MUST come before any ScrollTrigger using this scroller
    ScrollTrigger.scrollerProxy(scrollerEl, {
      scrollTop(value?: number) {
        if (value !== undefined) scrollerEl.scrollTop = value;
        return scrollerEl.scrollTop;
      },
      getBoundingClientRect() {
        return scrollerEl.getBoundingClientRect();
      },
      pinType: 'transform',
    });

    // 2. Camera progress ScrollTrigger
    const camST = ScrollTrigger.create({
      scroller: scrollerEl,
      trigger: stageRef.current,
      start: 'top top',
      end: '+=400%',
      scrub: 1.5,
      onUpdate(self) {
        cameraProgress.current = self.progress;
      },
    });

    // 3. Label crossfades
    const lbl = (i: number): HTMLDivElement | null => labelRefs.current[i] ?? null;
    labelRefs.current.forEach((el, i) => {
      if (el) gsap.set(el, { opacity: i === 0 ? 1 : 0 });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        scroller: scrollerEl,
        trigger: stageRef.current,
        start: 'top top',
        end: '+=400%',
        scrub: 1.5,
      },
    });

    tl.to(lbl(0), { opacity: 0, duration: 0.35 }, 0.65)
      .to(lbl(1), { opacity: 1, duration: 0.35 }, 0.65)
      .to(lbl(1), { opacity: 0, duration: 0.35 }, 1.65)
      .to(lbl(2), { opacity: 1, duration: 0.35 }, 1.65)
      .to(lbl(2), { opacity: 0, duration: 0.35 }, 2.65)
      .to(lbl(3), { opacity: 1, duration: 0.35 }, 2.65)
      .to(lbl(3), { opacity: 0, duration: 0.4 }, 3.35)
      .to(lbl(4), { opacity: 1, duration: 0.4 }, 3.35);

    ScrollTrigger.addEventListener('refresh', () => ScrollTrigger.update());
    ScrollTrigger.refresh();

    return () => {
      tl.kill();
      camST.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [scrollerEl]);

  return (
    <div
      ref={setScrollerEl}
      className="border-border relative hidden flex-1 overflow-y-auto border-r lg:block"
      style={{ height: '100%' }}
      aria-hidden="true"
    >
      <div style={{ height: '520vh' }}>
        <div
          ref={stageRef}
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={{ background: '#06060a' }}
        >
          {/* R3F canvas — fills the sticky stage */}
          <Canvas
            shadows
            camera={{ fov: 52, near: 0.1, far: 120 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
            }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Scene progress={cameraProgress} />
          </Canvas>

          {/* ── HTML overlays ─────────────────────────────────────────── */}

          {/* Phase labels */}
          <div className="pointer-events-none absolute right-0 bottom-20 left-0">
            {PHASE_LABELS.map((label, i) => (
              <div
                key={i}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="absolute right-0 left-0 text-center"
                style={{ bottom: 0 }}
              >
                <div
                  className="mb-1.5 font-black tracking-tight"
                  style={{ color: 'rgba(255,255,255,0.86)', fontSize: 27, lineHeight: 1.2 }}
                >
                  {label.headline}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.36)', fontSize: 12 }}>{label.sub}</div>
              </div>
            ))}
          </div>

          {/* Brand wordmark */}
          <div
            className="pointer-events-none absolute top-8 left-8 font-black"
            style={{ color: 'rgba(255,255,255,0.60)', fontSize: 17, letterSpacing: '-0.02em' }}
          >
            Bandage
          </div>

          {/* Scroll hint */}
          <div
            className="pointer-events-none absolute right-0 bottom-7 left-0 flex flex-col items-center gap-1.5"
            style={{ color: 'rgba(255,255,255,0.20)', fontSize: 10 }}
          >
            <div
              style={{
                width: 1,
                height: 28,
                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.22))',
              }}
            />
            <span className="uppercase" style={{ letterSpacing: '0.12em' }}>
              scroll
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
