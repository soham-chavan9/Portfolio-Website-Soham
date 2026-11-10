"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  Noise,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { lobby, readPref, useLobby } from "../store";
import Balcony from "./balcony";
import City from "./city";
import { Sky, Water } from "./environment";
import Markers from "./markers";
import Operator from "./operator";
import CameraRig from "./rig";
import Traffic from "./traffic";

export const OPERATOR_POSITION: [number, number, number] = [-0.55, 0, -2.5];

function Lights({ quality }: { quality: "high" | "low" }) {
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
      <hemisphereLight args={["#2a3a66", "#1a120c", 0.35]} />
      <ambientLight intensity={0.06} />
      <directionalLight
        ref={moon}
        color="#a9bdff"
        intensity={1.1}
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
      <directionalLight color="#ffc49a" intensity={0.9} position={[3, 2.5, -12]} />
      <directionalLight color="#86a8ff" intensity={0.7} position={[-8, 3, -10]} />
      {/* Warm spill from the living room behind */}
      <spotLight
        ref={spill}
        color="#ffcf9e"
        intensity={28}
        position={[0.5, 3.3, 4.2]}
        angle={0.95}
        penumbra={0.85}
        distance={16}
        decay={1.4}
      />
    </>
  );
}

function Effects({ quality }: { quality: "high" | "low" }) {
  if (quality === "low") {
    return (
      <EffectComposer key="low" multisampling={0}>
        <Bloom mipmapBlur intensity={0.95} luminanceThreshold={0.9} luminanceSmoothing={0.25} radius={0.75} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.28} darkness={0.72} />
        <SMAA />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer key="high" multisampling={4}>
      <Bloom mipmapBlur intensity={0.95} luminanceThreshold={0.9} luminanceSmoothing={0.25} radius={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.72} />
      <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

/** Tells the HUD the first frames are on screen (shaders compiled). */
function ReadyProbe() {
  const frames = useRef(0);
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    try {
      gl.compile(scene, camera);
    } catch {
      /* compile is a warm-up only */
    }
  }, [gl, scene, camera]);
  useFrame(() => {
    frames.current++;
    if (frames.current === 4) lobby.set({ sceneReady: true });
  });
  return null;
}

function Fallback() {
  useEffect(() => {
    lobby.set({ sceneReady: true });
  }, []);
  return (
    <div className="scene-fallback">
      <p>Your browser could not start WebGL, so the 3D balcony is off. The menus below still work.</p>
    </div>
  );
}

export default function Scene() {
  const quality = useLobby((s) => s.quality);
  const near = useRef<THREE.Group>(null);
  const userPickedQuality = typeof window !== "undefined" && readPref("quality") !== null;

  return (
    <Canvas
      flat
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={quality === "high" ? [1, 1.75] : [0.75, 1]}
      camera={{ position: [8, 0.6, -27], fov: 34, near: 0.1, far: 9000 }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false, alpha: false }}
      fallback={<Fallback />}
      onCreated={({ gl }) => {
        gl.setClearColor("#05070c");
      }}
    >
      <Suspense fallback={null}>
        {!userPickedQuality && (
          <PerformanceMonitor
            flipflops={2}
            onDecline={() => lobby.set({ quality: "low" })}
          />
        )}
        <Sky />
        <Water resolution={quality === "high" ? 640 : 320} hide={near} />
        <City />
        <Traffic />
        <Lights quality={quality} />
        <group ref={near}>
          <Balcony />
          <Operator position={OPERATOR_POSITION} />
        </group>
        <Markers />
        <Environment resolution={128} frames={1} environmentIntensity={0.55}>
          <Lightformer form="rect" intensity={2.2} color="#ffcf9e" position={[0, 2, 9]} scale={[16, 4, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#ff9e62" position={[0, 0, -40]} scale={[90, 5, 1]} />
          <Lightformer form="rect" intensity={0.7} color="#8fb0ff" position={[-30, 4, -20]} scale={[30, 3, 1]} />
          <Lightformer form="circle" intensity={0.4} color="#25345e" position={[0, 30, 0]} scale={24} />
        </Environment>
        <CameraRig />
        <ReadyProbe />
        <Effects quality={quality} />
      </Suspense>
    </Canvas>
  );
}
