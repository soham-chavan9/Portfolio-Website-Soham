"use client";

import {
  Component,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Glitch,
  Scanline,
  Noise,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, GlitchMode, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { failBoot, reportBoot } from "../boot-progress";
import { lobby, readPref, useLobby, type Quality } from "../store";
import Balcony from "./balcony";
import City from "./city";
import { Sky, Water } from "./environment";
import Markers from "./markers";
import SkillsGlobe from "./skills-globe";
import Operator from "./operator";
import CameraRig from "./rig";
import Traffic from "./traffic";
import Rain from "./rain";

export const OPERATOR_POSITION: [number, number, number] = [-0.55, 0, -2.5];

// Canvas options live outside the component so re-renders never hand R3F
// "new" config objects to diff.
const CAMERA = { position: [8, 0.6, -27] as [number, number, number], fov: 34, near: 0.1, far: 9000 };
const GL = { antialias: false, powerPreference: "high-performance", stencil: false, alpha: false } as const;
const SHADOWS = { type: THREE.PCFShadowMap };
const onCreated = ({ gl }: RootState) => {
  gl.setClearColor("#07030f");
};

/**
 * Pixel ratio per tier: the range the adaptive step moves through, and a
 * pixel budget so big or high-DPI displays don't render 10+ MP every frame.
 */
const TIERS: Record<Quality, { min: number; max: number; budget: number }> = {
  high: { min: 1, max: 1.75, budget: 6.0e6 },
  low: { min: 0.75, max: 1, budget: 2.1e6 },
};
/** Adaptive steps from the tier's sharpest (0) to its softest pixel ratio. */
const LEVELS = 3;

function pixelRatio(quality: Quality, level: number) {
  const tier = TIERS[quality];
  const device = window.devicePixelRatio || 1;
  const area = Math.max(1, window.innerWidth * window.innerHeight);
  const top = Math.min(tier.max, device, Math.sqrt(tier.budget / area));
  const bottom = Math.min(tier.min, top);
  return Math.round((top - ((top - bottom) * level) / LEVELS) * 100) / 100;
}

function Lights({ quality }: { quality: Quality }) {
  const moon = useRef<THREE.DirectionalLight>(null);
  const spill = useRef<THREE.SpotLight>(null);
  useEffect(() => {
    const l = moon.current;
    if (l) {
      l.target.position.set(0, 0, -1);
      l.target.updateMatrixWorld();
    }
    const s = spill.current;
    if (s) {
      s.target.position.set(-0.5, 0.6, -2.6);
      s.target.updateMatrixWorld();
    }
  }, []);
  return (
    <>
      <hemisphereLight args={["#3a1f7a", "#12081f", 0.4]} />
      <ambientLight intensity={0.06} />
      <directionalLight
        ref={moon}
        color="#8f7bff"
        intensity={1.0}
        position={[-10, 16, -14]}
        castShadow
        shadow-mapSize={quality === "high" ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* Manhattan's glow from across the river: the rim light on the operator */}
      <directionalLight color="#ff3fd0" intensity={1.1} position={[3, 2.5, -12]} />
      <directionalLight color="#19f3ff" intensity={0.95} position={[-8, 3, -10]} />
      {/* Warm spill from the living room behind */}
      <spotLight
        ref={spill}
        color="#b58cff"
        intensity={24}
        position={[0.5, 3.3, 4.2]}
        angle={0.95}
        penumbra={0.85}
        distance={16}
        decay={1.4}
      />
    </>
  );
}

const CA_OFFSET = new THREE.Vector2(0.0007, 0.0006);
const CA_GLITCH = new THREE.Vector2(0.003, 0.002);
const GLITCH_DELAY = new THREE.Vector2(99, 99);
const GLITCH_DURATION = new THREE.Vector2(0.25, 0.4);
const GLITCH_STRENGTH = new THREE.Vector2(0.15, 0.3);

/** True for a moment after each screen change; never under reduced motion. */
function useTransitionGlitch() {
  const screen = useLobby((s) => s.screen);
  const reduced = useLobby((s) => s.reducedMotion);
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) return;
    setOn(true);
    const id = window.setTimeout(() => setOn(false), 420);
    return () => window.clearTimeout(id);
  }, [screen, reduced]);
  return on && !reduced;
}

function Effects({ quality }: { quality: Quality }) {
  const glitch = useTransitionGlitch();
  if (quality === "low") {
    return (
      <EffectComposer key="low" multisampling={0}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.85} luminanceSmoothing={0.25} radius={0.75} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.28} darkness={0.78} />
        <SMAA />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer key="high" multisampling={4}>
      <Bloom mipmapBlur intensity={1.25} luminanceThreshold={0.8} luminanceSmoothing={0.25} radius={0.8} />
      <ChromaticAberration offset={glitch ? CA_GLITCH : CA_OFFSET} radialModulation={false} modulationOffset={0} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.78} />
      <Scanline density={1.1} opacity={0.06} blendFunction={BlendFunction.OVERLAY} />
      <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />
      <Glitch
        active={glitch}
        delay={GLITCH_DELAY}
        duration={GLITCH_DURATION}
        strength={GLITCH_STRENGTH}
        mode={GlitchMode.SPORADIC}
        ratio={0.85}
      />
    </EffectComposer>
  );
}

/** Tells the HUD the first frames are on screen (shaders compiled). */
function ReadyProbe() {
  const frames = useRef(0);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    try {
      gl.compile(scene, camera);
    } catch {
      /* compile is a warm-up only */
    }
  }, [gl, scene, camera]);
  useFrame(() => {
    if (frames.current > 4) return;
    frames.current++;
    if (frames.current === 4) {
      reportBoot("scene", 1);
      lobby.set({ sceneReady: true });
    }
  });
  return null;
}

/**
 * Watches the real frame rate once boot work (shader compiles, uploads, model
 * parse) is behind us and trades pixels for smoothness: first steps the pixel
 * ratio down inside the current tier, and only when that isn't enough, and the
 * visitor hasn't picked a tier themselves, drops to the Performance tier.
 * Stalls and tab switches are skipped rather than averaged in.
 */
function Adaptive({
  quality,
  level,
  onLevel,
}: {
  quality: Quality;
  level: number;
  onLevel: (l: number) => void;
}) {
  const ready = useLobby((s) => s.sceneReady);
  const m = useRef({ armedAt: Infinity, t: 0, n: 0, refresh: 0, bad: 0, severe: 0, good: 0, last: 0, reversals: 0 });

  // Arm 1.5 s after the scene is ready, and again whenever the tab returns.
  useEffect(() => {
    if (!ready) return;
    const arm = () => {
      const s = m.current;
      s.t = s.n = s.bad = s.severe = s.good = 0;
      s.armedAt = document.visibilityState === "visible" ? performance.now() + 1500 : Infinity;
    };
    arm();
    document.addEventListener("visibilitychange", arm);
    return () => document.removeEventListener("visibilitychange", arm);
  }, [ready]);

  // Samples taken at another tier or pixel ratio describe a different load,
  // and the resize itself hitches: start counting again after a beat.
  useEffect(() => {
    const s = m.current;
    s.t = s.n = s.bad = s.severe = s.good = 0;
    if (Number.isFinite(s.armedAt)) s.armedAt = Math.max(s.armedAt, performance.now() + 1000);
  }, [quality, level]);

  useFrame((_, delta) => {
    const s = m.current;
    if (performance.now() < s.armedAt) return;
    // Never resize or swap passes mid fly-in: that hitch is worse than a slow patch.
    if (delta > 0.25 || lobby.get().phase === "intro") {
      s.t = s.n = 0;
      return;
    }
    s.t += delta;
    s.n++;
    if (s.t < 1) return;
    const fps = s.n / s.t;
    s.t = s.n = 0;
    s.refresh = Math.max(s.refresh, fps);
    const fast = s.refresh > 100;
    const lower = fast ? 60 : 40;
    const upper = fast ? 100 : 55;
    s.severe = fps < lower * 0.6 ? s.severe + 1 : 0;
    s.bad = fps < lower ? s.bad + 1 : 0;
    s.good = fps >= upper ? s.good + 1 : 0;

    if (s.severe >= 2 || s.bad >= 3) {
      const severe = s.severe >= 2;
      s.bad = s.severe = s.good = 0;
      if (s.last > 0) s.reversals++;
      s.last = -1;
      const auto = readPref("quality") === null;
      if (quality === "high" && auto && (severe || level >= LEVELS)) {
        lobby.set({ quality: "low" });
      } else if (level < LEVELS) {
        onLevel(level + 1);
      }
    } else if (s.good >= 8 && level > 0 && s.reversals < 3) {
      // Earn pixels back slowly, and stop trying once it has see-sawed.
      s.good = 0;
      if (s.last < 0) s.reversals++;
      s.last = 1;
      onLevel(level - 1);
    }
  });
  return null;
}

/**
 * Three re-creates its GPU state after a lost context, but the image-based
 * lighting was rendered once into a cube target that comes back empty. Remount
 * it, and refresh the shadow map, once the context is restored.
 */
function ContextGuard({ onRestore }: { onRestore: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const lost = (e: Event) => e.preventDefault();
    const restored = () => {
      gl.shadowMap.needsUpdate = true;
      onRestore();
    };
    el.addEventListener("webglcontextlost", lost);
    el.addEventListener("webglcontextrestored", restored);
    return () => {
      el.removeEventListener("webglcontextlost", lost);
      el.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, onRestore]);
  return null;
}

/** Image-based lighting. Memoised so its one-shot cube render never repeats needlessly. */
const Env = memo(function Env() {
  return (
    <Environment resolution={128} frames={1} environmentIntensity={0.55}>
      <Lightformer form="rect" intensity={2.2} color="#9a7bff" position={[0, 2, 9]} scale={[16, 4, 1]} />
      <Lightformer form="rect" intensity={1.4} color="#ff2bd6" position={[0, 0, -40]} scale={[90, 5, 1]} />
      <Lightformer form="rect" intensity={0.7} color="#19f3ff" position={[-30, 4, -20]} scale={[30, 3, 1]} />
      <Lightformer form="circle" intensity={0.4} color="#25345e" position={[0, 30, 0]} scale={24} />
    </Environment>
  );
});

/** Everything in the scene. Memoised so pixel-ratio changes don't re-render it. */
const World = memo(function World({ quality }: { quality: Quality }) {
  const near = useRef<THREE.Group>(null);
  return (
    <>
      <Sky />
      <Water resolution={quality === "high" ? 640 : 320} throttle={quality === "low"} hide={near} />
      <City />
      <Traffic />
      <Rain />
      <Lights quality={quality} />
      <group ref={near}>
        <Balcony />
        <Operator position={OPERATOR_POSITION} />
        <SkillsGlobe />
      </group>
      <Markers />
      <CameraRig />
      <ReadyProbe />
      <Effects quality={quality} />
    </>
  );
});

function Fallback() {
  useEffect(() => {
    failBoot("scene");
    failBoot("character");
    failBoot("textures");
    lobby.set({ sceneReady: true });
  }, []);
  return (
    <div className="scene-fallback">
      <p>Your browser could not start WebGL, so the 3D balcony is off. The menus below still work.</p>
    </div>
  );
}

/**
 * R3F rethrows renderer-creation failures (no WebGL, blocklisted GPU) from
 * <Canvas>. Catch them here so the HUD keeps working on top of a plain message.
 */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}

export default function Scene() {
  const quality = useLobby((s) => s.quality);
  const [level, setLevel] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [, remeasure] = useReducer((n: number) => n + 1, 0);

  // A new tier starts at its sharpest; the monitor steps down from there.
  useEffect(() => setLevel(0), [quality]);

  // The pixel budget depends on the window size, and the device ratio changes
  // when the window moves to another display or the page is zoomed.
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    const onDpr = () => {
      remeasure();
      watch();
    };
    const watch = () => {
      mq?.removeEventListener("change", onDpr);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      mq.addEventListener("change", onDpr);
    };
    watch();
    window.addEventListener("resize", remeasure);
    return () => {
      mq?.removeEventListener("change", onDpr);
      window.removeEventListener("resize", remeasure);
    };
  }, []);

  const onRestore = useCallback(() => setGeneration((g) => g + 1), []);

  return (
    <SceneBoundary>
      <Canvas
        flat
        shadows={SHADOWS}
        dpr={pixelRatio(quality, level)}
        camera={CAMERA}
        gl={GL}
        onCreated={onCreated}
      >
        <Suspense fallback={null}>
          <World quality={quality} />
          <Env key={generation} />
        </Suspense>
        <Adaptive quality={quality} level={level} onLevel={setLevel} />
        <ContextGuard onRestore={onRestore} />
      </Canvas>
    </SceneBoundary>
  );
}
