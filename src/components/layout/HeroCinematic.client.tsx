'use client';

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, useAnimations, useGLTF } from '@react-three/drei';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
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
  { headline: '당신의 밴드를', sub: 'Bring Your Band Together' },
  { headline: '하나의 흐름으로', sub: 'Into One Seamless Flow' },
  { headline: '리듬에 실어', sub: 'Driven By Rhythm' },
  { headline: '완성하세요', sub: 'Make It Complete' },
];

// ── ErrorBoundary for model loading failures ──────────────────────────────────

class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// ── GLB drummer model ─────────────────────────────────────────────────────────

function DrummerModel({ position }: { position: THREE.Vector3Tuple }) {
  const { scene, animations } = useGLTF('/models/drummer.glb');
  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    const first = Object.values(actions)[0];
    if (first) first.reset().play();
  }, [scene, actions]);

  return (
    <group ref={groupRef} position={position}>
      {/* Armature baked scale=0.01; trans y=-0.186 → lift by 0.186 to ground feet */}
      <primitive
        object={scene}
        scale={1}
        rotation={[0, -Math.PI / 2, 0]}
        position={[0, 0.186, 0]}
      />
    </group>
  );
}

useGLTF.preload('/models/drummer.glb');

// ── FBX vocalist model (vocal.glb is FBX binary; FBXLoader handles it natively) ──

function VocalModel({ position }: { position: THREE.Vector3Tuple }) {
  const fbx = useLoader(FBXLoader, '/models/vocal.glb');
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    mixerRef.current = new THREE.AnimationMixer(fbx);
    const clip = fbx.animations[0];
    if (clip) mixerRef.current.clipAction(clip).reset().play();

    fbx.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [fbx]);

  useFrame((_, delta) => mixerRef.current?.update(delta));

  return (
    <group position={position}>
      {/* FBX: 1 unit = 1 cm → scale 0.01; at -Z, face outward (-Z) = Ry π */}
      <primitive object={fbx} scale={0.01} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

// ── GLB guitarist model ───────────────────────────────────────────────────────

function GuitaristModel({ position }: { position: THREE.Vector3Tuple }) {
  const { scene, animations } = useGLTF('/models/guitarist.glb');
  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Fix: BLEND alpha materials don't write depth by default, causing hair to z-sort over face.
      // Force depthWrite + alphaTest so body/face always renders correctly.
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m: THREE.Material) => {
        if (m.transparent) {
          m.depthWrite = true;
          (m as THREE.MeshStandardMaterial).alphaTest = 0.1;
        }
      });

      // Body mesh (face included) renders on top of hair mesh
      if (mesh.name.toLowerCase().includes('body')) mesh.renderOrder = 1;
    });
    const first = Object.values(actions)[0];
    if (first) first.reset().play();
  }, [scene, actions]);

  return (
    <group ref={groupRef} position={position}>
      {/* Armature already has scale=0.01 baked in (cm→m); face outward (+X) = Ry +π/2 */}
      <primitive object={scene} scale={1} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

useGLTF.preload('/models/guitarist.glb');

// ── GLB pianist model ─────────────────────────────────────────────────────────

function PianistModel({ position }: { position: THREE.Vector3Tuple }) {
  const { scene, animations } = useGLTF('/models/pianist.glb');
  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m: THREE.Material) => {
        if (m.transparent) {
          m.depthWrite = true;
          (m as THREE.MeshStandardMaterial).alphaTest = 0.1;
        }
      });
      if (mesh.name.toLowerCase().includes('body')) mesh.renderOrder = 1;
    });
    const first = Object.values(actions)[0];
    if (first) first.reset().play();
  }, [scene, actions]);

  return (
    <group ref={groupRef} position={position}>
      {/* Armature scale=0.01 baked in; at +Z, face outward (+Z) = no rotation */}
      <primitive object={scene} scale={1} rotation={[0, 0, 0]} />
    </group>
  );
}

useGLTF.preload('/models/pianist.glb');

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

// ── Ready signal — mounts only after all sibling models in the Suspense resolve ─

function ReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

// ── Scene graph ───────────────────────────────────────────────────────────────

function Scene({
  progress,
  onModelsLoaded,
}: {
  progress: { current: number };
  onModelsLoaded: () => void;
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <hemisphereLight args={['#2a2a4e', '#141414', 0.85]} />

      {/* Per-musician colored accent lights */}
      {MUSICIAN_POS.map((pos, i) => (
        <pointLight
          key={i}
          position={[pos[0], 2.8, pos[2]]}
          color={MUSICIAN_COLORS[i]}
          intensity={2.2}
          distance={6}
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

      {/* All models in one Suspense — ReadySignal fires only when all four resolve */}
      <Suspense fallback={null}>
        <ModelErrorBoundary
          fallback={
            <MusicianFigure
              position={MUSICIAN_POS[0]!}
              color={MUSICIAN_COLORS[0]}
              yRot={Math.PI / 2}
            />
          }
        >
          <GuitaristModel position={MUSICIAN_POS[0]!} />
        </ModelErrorBoundary>
        <ModelErrorBoundary
          fallback={
            <MusicianFigure position={MUSICIAN_POS[1]!} color={MUSICIAN_COLORS[1]} yRot={0} />
          }
        >
          <PianistModel position={MUSICIAN_POS[1]!} />
        </ModelErrorBoundary>
        <ModelErrorBoundary
          fallback={
            <MusicianFigure
              position={MUSICIAN_POS[2]!}
              color={MUSICIAN_COLORS[2]}
              yRot={-Math.PI / 2}
            />
          }
        >
          <DrummerModel position={MUSICIAN_POS[2]!} />
        </ModelErrorBoundary>
        <ModelErrorBoundary
          fallback={
            <MusicianFigure position={MUSICIAN_POS[3]!} color={MUSICIAN_COLORS[3]} yRot={Math.PI} />
          }
        >
          <VocalModel position={MUSICIAN_POS[3]!} />
        </ModelErrorBoundary>
        <ReadySignal onReady={onModelsLoaded} />
      </Suspense>

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
  const logoRef = useRef<HTMLDivElement | null>(null);

  // Shared scalar read by CameraRig inside Canvas — written only in GSAP callback
  const cameraProgress = useRef<number>(0);

  const currentSnapIdx = useRef(0);
  const isSnapping = useRef(false);

  const [sceneReady, setSceneReady] = useState(false);
  const handleModelsLoaded = useCallback(() => setSceneReady(true), []);

  // Fallback: hide overlay after 45s even if a model fails/hangs
  useEffect(() => {
    const t = setTimeout(() => setSceneReady(true), 45_000);
    return () => clearTimeout(t);
  }, []);

  // Wheel → one event = one phase advance, no snap delay
  useEffect(() => {
    if (!scrollerEl) return;
    const PHASES = 5;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isSnapping.current) return;

      const dir = e.deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(PHASES - 1, currentSnapIdx.current + dir));
      if (next === currentSnapIdx.current) return;

      currentSnapIdx.current = next;
      isSnapping.current = true;

      const maxScroll = scrollerEl.scrollHeight - scrollerEl.clientHeight;
      gsap.to(scrollerEl, {
        scrollTop: (next / (PHASES - 1)) * maxScroll,
        duration: 0.7,
        ease: 'power2.inOut',
        onUpdate: () => ScrollTrigger.update(),
      });

      // 애니메이션(0.7s) + 트랙패드 잔여 이벤트 여운(300ms) 이후 해제
      setTimeout(() => {
        isSnapping.current = false;
      }, 1000);
    };

    scrollerEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollerEl.removeEventListener('wheel', handleWheel);
  }, [scrollerEl]);

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
      scrub: true,
      onUpdate(self) {
        cameraProgress.current = self.progress;
      },
    });

    // 3. Label crossfades
    const lbl = (i: number): HTMLDivElement | null => labelRefs.current[i] ?? null;
    labelRefs.current.forEach((el, i) => {
      if (el) gsap.set(el, { opacity: i === 0 ? 1 : 0 });
    });
    if (logoRef.current) gsap.set(logoRef.current, { opacity: 0, scale: 0.88, y: 12 });

    const tl = gsap.timeline({
      scrollTrigger: {
        scroller: scrollerEl,
        trigger: stageRef.current,
        start: 'top top',
        end: '+=400%',
        scrub: true,
      },
    });

    // snap 포인트(progress 0.25→1, 0.5→2, 0.75→3)에 정확히 맞춰 즉각 전환 — 겹침 없음
    tl.set(lbl(0), { opacity: 0 }, 1)
      .set(lbl(1), { opacity: 1 }, 1)
      .set(lbl(1), { opacity: 0 }, 2)
      .set(lbl(2), { opacity: 1 }, 2)
      .set(lbl(2), { opacity: 0 }, 3)
      .set(lbl(3), { opacity: 1 }, 3)
      .set(lbl(3), { opacity: 0 }, 3.5)
      .to(logoRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.3 }, 3.5)
      .to({}, { duration: 0.5 }, 3.5); // total duration = 4 (snap 1.0 alignment)

    ScrollTrigger.addEventListener('refresh', () => ScrollTrigger.update());
    ScrollTrigger.refresh();

    return () => {
      tl.kill();
      camST.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [scrollerEl]);

  return (
    <div ref={setScrollerEl} className="absolute inset-0 overflow-y-auto" aria-hidden="true">
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
            <Scene progress={cameraProgress} onModelsLoaded={handleModelsLoaded} />
          </Canvas>

          {/* Loading overlay — fades out once all models are ready */}
          <div
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 transition-opacity duration-700"
            style={{ background: '#06060a', opacity: sceneReady ? 0 : 1 }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
            <span
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '0.12em' }}
            >
              LOADING
            </span>
          </div>

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

          {/* Center logo — fades in with GSAP at final scroll phase */}
          <div
            ref={logoRef}
            className="pointer-events-none absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ opacity: 0 }}
          >
            {/* Radial dark veil behind the logo */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                transform: 'scale(2.8)',
                background:
                  'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,6,10,0.82) 0%, transparent 100%)',
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/bandage_wave_text_white.png" alt="Bandage" className="w-70" />
            <p
              className="mt-3 text-center"
              style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, letterSpacing: '0.04em' }}
            >
              밴드 합주 관리의 모든 것을 한 곳에
            </p>
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
