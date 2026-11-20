"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { failBoot, reportBoot, reportBytes } from "../boot-progress";
import { lobby, pointer } from "../store";

// The operator: a stylized cyberpunk netrunner of Soham, built in Blender by
// scripts/blender/build-operator.py (re-runnable) and exported to
// public/operator/operator.glb. One skinned mesh, one armature, two clips:
//   idle     4 s loop: breathing, weight drift, arms settle
//   gesture  2.4 s: right-hand wave and a raised deck arm, played on emote
// The head and neck are not keyed in either clip. They are driven here so the
// head follows the pointer and the camera. Neon trims, the visor and the wrist
// hologram are emissive, so bloom picks them up; the hologram flickers.

const MODEL_URL = "/operator/operator.glb";
export const OPERATOR_YAW = 0.55;
const HEIGHT = 1;

// Compressed responses carry no total; then the checklist shows bytes received.
const onModelProgress = (e: ProgressEvent) => {
  if (e.lengthComputable && e.total > 0) reportBoot("character", (e.loaded / e.total) * 0.98);
  else reportBytes("character", e.loaded);
};
useLoader.preload(GLTFLoader, MODEL_URL);

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

type Glow = { mat: THREE.MeshStandardMaterial; base: number; kind: "trim" | "trim2" | "visor" | "holo" | "warn" };

function Model({ position }: { position: [number, number, number] }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL, undefined, onModelProgress);
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const { actions, mixer } = useAnimations(gltf.animations, group);
  const [shown, setShown] = useState(false);

  // Real boot reporting: the model has no separate textures, so the textures
  // task settles once its materials are in hand.
  useEffect(() => {
    reportBoot("character", 1);
    reportBoot("textures", 1);
  }, []);

  const { head, glows } = useMemo(() => {
    let headBone: THREE.Object3D | null = null;
    const list: Glow[] = [];
    const seen = new Set<THREE.Material>();
    gltf.scene.traverse((o) => {
      if (o.name === "head" && (o as THREE.Bone).isBone) headBone = o;
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (seen.has(m)) return;
      seen.add(m);
      // The suit is near-black, so its form comes from reflections of the
      // neon environment and the two character lights below.
      m.envMapIntensity = 1.15;
      if (["trim", "trim2", "visor", "holo", "warn"].includes(m.name)) {
        list.push({ mat: m, base: m.emissiveIntensity, kind: m.name as Glow["kind"] });
      }
      if (m.name === "holo") {
        m.transparent = true;
        m.opacity = 0.9;
      }
    });
    return { head: headBone as THREE.Object3D | null, glows: list };
  }, [gltf]);
  // The head turns relative to its rest pose, whatever the exporter wrote there.
  const headRest = useMemo(() => (head ? head.quaternion.clone() : new THREE.Quaternion()), [head]);

  // Character lighting, in his own frame (front is +z): a cool key from the
  // front left and a magenta rim from behind, the way stylized game
  // characters are lit so the silhouette reads against a busy city.
  const aim = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 1.25, 0);
    return o;
  }, []);

  // Compile shaders before the first frame that draws him.
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    let alive = true;
    const reveal = () => alive && setShown(true);
    gl.compileAsync(gltf.scene, camera, scene).then(reveal, reveal);
    return () => {
      alive = false;
    };
  }, [gl, camera, scene, gltf]);

  useEffect(() => {
    const idle = actions.idle;
    idle?.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.4).play();
    const g = actions.gesture;
    g?.setLoop(THREE.LoopOnce, 1);
    if (g) g.clampWhenFinished = false;
    return () => {
      idle?.fadeOut(0.2);
    };
  }, [actions]);

  // Hit proxy: a plain cylinder, so hover is cheap to ray-test.
  const hit = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.28, 0.2, 1, 12);
    geometry.translate(0, 0.5, 0);
    return { geometry, material: new THREE.MeshBasicMaterial() };
  }, []);
  useEffect(
    () => () => {
      hit.geometry.dispose();
      hit.material.dispose();
    },
    [hit],
  );
  useEffect(
    () => () => {
      document.body.style.cursor = "";
      if (lobby.get().hovered === "operator") lobby.set({ hovered: null });
    },
    [],
  );

  const st = useRef({
    yaw: 0,
    pitch: 0,
    roll: 0,
    glanceYaw: 0,
    glancePitch: 0,
    nextGlance: 2,
    lastEmote: 0,
    attentionUntil: 0,
    lastPointer: { x: 0, y: 0 },
    q: new THREE.Quaternion(),
    e: new THREE.Euler(),
  });
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const s = lobby.get();
    const a = st.current;
    const calm = s.reducedMotion ? 0.35 : 1;

    // Reduced motion slows the clips rather than freezing them.
    mixer.timeScale = s.reducedMotion ? 0.35 : 1;

    // Emote: play the gesture once, then fade back to idle.
    if (s.emote !== a.lastEmote) {
      a.lastEmote = s.emote;
      const g = actions.gesture;
      const idle = actions.idle;
      if (g && idle) {
        g.reset().setEffectiveWeight(1).fadeIn(0.2).play();
        idle.crossFadeTo(g, 0.25, false);
        const onDone = (e: { action: THREE.AnimationAction }) => {
          if (e.action !== g) return;
          mixer.removeEventListener("finished", onDone as never);
          idle.reset().fadeIn(0.35).play();
          g.fadeOut(0.35);
        };
        mixer.addEventListener("finished", onDone as never);
      }
    }

    // Neon: steady glow, a slow pulse on the primary trim, a flicker on the hologram.
    for (const glow of glows) {
      let k = 1;
      if (!s.reducedMotion) {
        if (glow.kind === "trim") k = 0.9 + 0.15 * Math.sin(t * 1.6);
        else if (glow.kind === "holo") {
          const jitter = Math.sin(t * 37) * Math.sin(t * 11.3);
          k = 0.82 + 0.12 * Math.sin(t * 2.4) + (jitter > 0.93 ? -0.5 : 0);
        } else if (glow.kind === "warn") k = Math.sin(t * 2.2) > 0.6 ? 1.2 : 0.7;
      }
      glow.mat.emissiveIntensity = glow.base * k;
    }

    if (!head) return;
    // Where the camera is, relative to the way he's facing.
    camera.getWorldPosition(tmp);
    const toCamera = wrap(Math.atan2(tmp.x - position[0], tmp.z - position[2]) - OPERATOR_YAW);
    const presenting = s.screen === "skills" || s.screen === "contact";
    const moved = Math.hypot(pointer.x - a.lastPointer.x, pointer.y - a.lastPointer.y);
    a.lastPointer.x = pointer.x;
    a.lastPointer.y = pointer.y;
    if (moved > 0.02) a.attentionUntil = t + 1.6;

    if (t > a.nextGlance) {
      const r = Math.random();
      if (presenting) {
        const away = r < 0.3;
        a.glanceYaw = away ? (Math.random() < 0.5 ? -0.3 : 0.26) : 0;
        a.glancePitch = away ? 0.04 : 0;
        a.nextGlance = t + (away ? 0.9 + Math.random() * 0.8 : 3 + Math.random() * 4);
      } else {
        const choice = r < 0.38 ? "camera" : r < 0.6 ? "ahead" : r < 0.82 ? "side" : "city";
        a.glanceYaw = choice === "camera" ? 1 : choice === "ahead" ? 0.05 : choice === "side" ? 0.34 : -0.62;
        a.glancePitch = choice === "city" ? -0.04 : (Math.random() - 0.4) * 0.07;
        a.nextGlance = t + 1.8 + Math.random() * 3.6;
      }
    }

    const cameraYaw = THREE.MathUtils.clamp(toCamera, -0.9, 0.9);
    const attentive = presenting || s.hovered === "player" || s.hovered === "operator" || t < a.attentionUntil;
    let lookYaw: number;
    let lookPitch = a.glancePitch;
    if (attentive) {
      lookYaw = cameraYaw + (presenting ? a.glanceYaw : 0) + pointer.x * 0.35;
      lookPitch += -pointer.y * 0.18;
    } else {
      lookYaw = a.glanceYaw === 1 ? cameraYaw : a.glanceYaw;
    }
    const k = 1 - Math.exp(-dt * 8);
    a.yaw += (THREE.MathUtils.clamp(lookYaw, -1.0, 1.0) * calm - a.yaw) * k;
    a.pitch += ((lookPitch + Math.sin(t * 0.93) * 0.01) * calm - a.pitch) * k;
    a.roll += (Math.sin(t * 0.41) * 0.02 * calm - a.roll) * k;

    // The head bone is not keyed in the clips, so write its local rotation
    // straight onto it: yaw about the bone's up axis, pitch about its side axis.
    a.e.set(a.pitch * 0.8, a.yaw * 0.8, a.roll, "YXZ");
    a.q.setFromEuler(a.e);
    head.quaternion.copy(headRest).multiply(a.q);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    lobby.set((s) => ({ emote: s.emote + 1 }));
  };

  return (
    <group position={position} rotation-y={OPERATOR_YAW}>
      <primitive object={aim} />
      {/* The visor's own glow spilling onto his face */}
      <pointLight color="#8ff8ff" intensity={0.5} position={[0, 1.66, 0.32]} distance={0.7} decay={2} />
      <spotLight
        color="#9fe6ff"
        intensity={11}
        position={[0.75, 2.4, 1.7]}
        angle={0.62}
        penumbra={0.9}
        distance={6}
        decay={2}
        target={aim}
      />
      <spotLight
        color="#ff3fd0"
        intensity={9}
        position={[-0.55, 2.2, -1.35]}
        angle={0.55}
        penumbra={0.8}
        distance={5}
        decay={2}
        target={aim}
      />
      <group ref={group} scale={HEIGHT} visible={shown}>
        <primitive object={gltf.scene} />
      </group>
      <mesh
        geometry={hit.geometry}
        material={hit.material}
        scale={1.8}
        visible={false}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          lobby.set({ hovered: "operator" });
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          if (lobby.get().hovered === "operator") lobby.set({ hovered: null });
        }}
      />
    </group>
  );
}

/** If the model can't load, the lobby still works without the figure. */
class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    failBoot("character");
    failBoot("textures");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Operator({ position }: { position: [number, number, number] }) {
  return (
    <ModelBoundary>
      <Suspense fallback={null}>
        <Model position={position} />
      </Suspense>
    </ModelBoundary>
  );
}
