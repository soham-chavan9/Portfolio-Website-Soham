"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { lobby, pointer } from "../store";

// The operator: a 3D model of Soham (public/operator/soham.glb), painted by
// projecting the matching full-length photo onto it from the front. The mesh
// was fitted to the photo's silhouette and the photo resampled so his face
// lands on the mesh's face: centered on the eyes and jaw, with each side of
// the head stretched to its own edge (soham-albedo.webp is that resampled
// photo, with the backdrop filled in from the nearest edge colors). The model has no rig,
// so every movement is a smooth deformation field in the vertex shader: weight
// shifts between the legs with the feet planted, the spine twists and leans,
// the chest and shoulders breathe, and the head turns on the neck.
//
// Anatomy measured from the mesh (height = 1, facing +z): shoulders top out
// ~0.835, the chin's underside sits at 0.862-0.866, the nose tip at 0.911, and
// the ears stick out past |x| 0.049 between 0.884 and 0.928, at z -0.003 to
// 0.014. The briefcase in his right hand is marked
// per vertex (the bagMask attribute) because it touches the trouser leg.

const MODEL_URL = "/operator/soham.glb";
const ALBEDO_URL = "/operator/soham-albedo.webp";
const HEIGHT = 1.82;
/** Model-space width the photo texture spans, centered on the head's axis. */
const PROJ_WIDTH = 0.3984;
/** Fixed stance: three-quarters to the lobby camera. Shots are framed around it. */
export const OPERATOR_YAW = 0.55;

type U = { value: number };
type Uniforms = {
  uAlbedo: { value: THREE.Texture };
  uWidth: U;
  uHeadYaw: U;
  uHeadPitch: U;
  uHeadRoll: U;
  uTwist: U;
  uLean: U;
  uShift: U;
  uBreath: U;
  uSuit: { value: THREE.Color };
  uHair: { value: THREE.Color };
  uLeather: { value: THREE.Color };
  uSelfLight: U;
  uRim: { value: THREE.Color };
};

const deformGLSL = /* glsl */ `
  uniform float uHeadYaw;
  uniform float uHeadPitch;
  uniform float uHeadRoll;
  uniform float uTwist;
  uniform float uLean;
  uniform float uShift;
  uniform float uBreath;
  attribute float bagMask;
  varying vec3 vObjPos;
  varying vec3 vObjNormal;
  varying float vBag;

  const vec3 NECK = vec3(0.0, 0.856, -0.006);
  const vec3 HIPS = vec3(0.0, 0.5, 0.0);

  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
  mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

  // Head follows the neck between 0.846 and 0.866, so the chin and face stay
  // rigid while the neck below them bends.
  float headWeight(vec3 p) { return smoothstep(0.846, 0.866, p.y); }
  float spineWeight(vec3 p) { return smoothstep(0.42, 0.82, p.y); }

  mat3 headRot(vec3 p) {
    float w = headWeight(p);
    return rotY(uHeadYaw * w) * rotX(uHeadPitch * w) * rotZ(uHeadRoll * w);
  }
  mat3 spineRot(vec3 p) {
    float w = spineWeight(p);
    return rotY(uTwist * w) * rotX(uLean * w);
  }
`;

function createOperatorMaterial(albedo: THREE.Texture) {
  const uniforms: Uniforms = {
    uAlbedo: { value: albedo },
    uWidth: { value: PROJ_WIDTH },
    uHeadYaw: { value: 0 },
    uHeadPitch: { value: 0 },
    uHeadRoll: { value: 0 },
    uTwist: { value: 0 },
    uLean: { value: 0 },
    uShift: { value: 0 },
    uBreath: { value: 0 },
    // Fallbacks sampled from the photo: the navy jacket, hair, and the
    // briefcase leather.
    uSuit: { value: new THREE.Color("#101420") },
    uHair: { value: new THREE.Color("#272625").multiplyScalar(0.85) },
    uLeather: { value: new THREE.Color("#352a23") },
    uSelfLight: { value: 0.32 },
    // Cool skyline rim so the dark suit separates from the night behind it.
    uRim: { value: new THREE.Color(0.26, 0.34, 0.5) },
  };
  const material = new THREE.MeshStandardMaterial({ roughness: 0.74, metalness: 0, envMapIntensity: 0.5 });
  material.userData.uniforms = uniforms;
  material.customProgramCacheKey = () => "operator-projected-v6";
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${deformGLSL}`)
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `#include <beginnormal_vertex>
        objectNormal = spineRot(position) * (headRot(position) * objectNormal);`,
      )
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `#include <begin_vertex>
        vObjPos = position;
        vObjNormal = normal;
        vBag = bagMask;
        vec3 p = position;

        // Breathing: chest fills forward, shoulders and head rise a touch.
        float chest = smoothstep(0.6, 0.7, p.y) * (1.0 - smoothstep(0.78, 0.84, p.y)) * smoothstep(0.0, 0.05, p.z);
        p += normal * chest * uBreath * 0.0032;
        p.y += uBreath * 0.0016 * smoothstep(0.72, 0.84, p.y);

        // Head on the neck, then the spine twist and lean above the hips.
        p = headRot(position) * (p - NECK) + NECK;
        p = spineRot(position) * (p - HIPS) + HIPS;

        // Weight shift: hips lead, shoulders counter, feet stay planted.
        float hips = smoothstep(0.04, 0.5, position.y);
        float counter = smoothstep(0.5, 0.88, position.y);
        p.x += uShift * (hips - 0.45 * counter);
        p.y -= abs(uShift) * 0.22 * hips;

        transformed = p;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        uniform sampler2D uAlbedo;
        uniform float uWidth;
        uniform vec3 uSuit;
        uniform vec3 uHair;
        uniform vec3 uLeather;
        uniform float uSelfLight;
        uniform vec3 uRim;
        varying vec3 vObjPos;
        varying vec3 vObjNormal;
        varying float vBag;`,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        vec2 projUv = vec2(0.5 + vObjPos.x / uWidth, clamp(vObjPos.y, 0.001, 0.999));
        vec3 photo = texture2D(uAlbedo, projUv).rgb;
        float facing = normalize(vObjNormal).z;
        float head = smoothstep(0.85, 0.866, vObjPos.y);

        // Surfaces the photo can't see. On the body, its local average color,
        // so sleeves stay navy, hands skin, shoes brown; the back of the jacket
        // is suit rather than the shirt and tie the photo shows in front.
        vec3 local = textureLod(uAlbedo, projUv, 3.0).rgb;
        float back = (1.0 - smoothstep(-0.3, 0.05, facing)) * smoothstep(0.49, 0.53, vObjPos.y);
        // On the head, each side's own cheek tone a shade into shadow (sampled
        // below the eye, clear of brows and ears), and hair on top, at the
        // temples, in front of the ears and behind them. The ears stay skin.
        float ax = abs(vObjPos.x);
        vec3 cheek = textureLod(uAlbedo, vec2(0.5 + sign(vObjPos.x) * 0.032 / uWidth, 0.897), 3.0).rgb * 0.9;
        float ear = smoothstep(0.049, 0.054, ax) * smoothstep(0.884, 0.89, vObjPos.y) * (1.0 - smoothstep(0.92, 0.928, vObjPos.y));
        float hair = max(smoothstep(0.922, 0.935, vObjPos.y),
                     max((1.0 - smoothstep(-0.006, 0.004, vObjPos.z)) * smoothstep(0.878, 0.895, vObjPos.y),
                         (1.0 - smoothstep(0.018, 0.028, vObjPos.z)) * smoothstep(0.9, 0.912, vObjPos.y) * smoothstep(0.038, 0.046, ax)));
        hair *= 1.0 - ear;
        vec3 unseen = mix(mix(local, uSuit, back), mix(cheek, uHair, hair), head);

        // Only trust the photo where it saw the surface head-on; grazing
        // angles smear into streaks. The face is held to a stricter angle
        // than the suit, and the photo's thin edge of hair above the ears is
        // left out. The briefcase is carried edge-on to the photo, so it is
        // plain leather all round.
        float templeEdge = smoothstep(0.04, 0.05, ax) * smoothstep(0.918, 0.93, vObjPos.y);
        float seen = mix(smoothstep(-0.05, 0.3, facing), smoothstep(0.12, 0.5, facing) * (1.0 - templeEdge), head);
        vec3 projected = mix(mix(unseen, photo, seen), uLeather, vBag);
        diffuseColor.rgb = projected;
        `,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `#include <roughnessmap_fragment>
        // Polished leather: the briefcase and his shoes.
        float leather = max(vBag, 1.0 - smoothstep(0.045, 0.06, vObjPos.y));
        roughnessFactor = mix(roughnessFactor, 0.5, leather);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        totalEmissiveRadiance += projected * uSelfLight;
        // Fresnel rim, softened on the face so skin keeps its natural edge and
        // kept off the leather, which it would wash out to grey.
        float rim = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
        totalEmissiveRadiance += uRim * rim * (1.0 - 0.7 * head) * (1.0 - vBag);`,
      );
  };
  return material;
}

/** Critically damped spring: quick, human-feeling moves that settle without wobble. */
type Spring = { x: number; v: number };
function step(s: Spring, target: number, stiffness: number, dt: number) {
  const damping = 2 * Math.sqrt(stiffness);
  s.v += (stiffness * (target - s.x) - damping * s.v) * dt;
  s.x += s.v * dt;
  return s.x;
}
const spring = (): Spring => ({ x: 0, v: 0 });

/** Inhale ~40% of the cycle, exhale the rest, a short rest at the bottom. */
function breath(t: number) {
  const ph = (t / 4.6) % 1;
  if (ph < 0.38) return THREE.MathUtils.smootherstep(ph, 0, 0.38);
  if (ph < 0.9) return 1 - THREE.MathUtils.smootherstep(ph, 0.38, 0.9);
  return 0;
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function Model({ position }: { position: [number, number, number] }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const albedo = useLoader(THREE.TextureLoader, ALBEDO_URL);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    gltf.scene.traverse((o) => {
      if (!geo && (o as THREE.Mesh).isMesh) geo = (o as THREE.Mesh).geometry;
    });
    const g = geo as unknown as THREE.BufferGeometry;
    // glTF custom attributes load lowercased with their leading underscore.
    const bag = g.getAttribute("_bag");
    if (bag && !g.getAttribute("bagMask")) {
      g.setAttribute("bagMask", bag);
      g.deleteAttribute("_bag");
    }
    return g;
  }, [gltf]);

  const material = useMemo(() => {
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    albedo.needsUpdate = true;
    return createOperatorMaterial(albedo);
  }, [albedo, gl]);
  useEffect(() => () => material.dispose(), [material]);

  // Compile the operator's shader (in parallel where the GPU driver allows)
  // before the first frame that draws him, so the model arriving mid-scene
  // doesn't stall a frame.
  const body = useRef<THREE.Mesh>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let alive = true;
    const reveal = () => {
      if (alive) setShown(true);
    };
    const mesh = body.current;
    if (!mesh) {
      reveal();
      return;
    }
    gl.compileAsync(mesh, camera, scene).then(reveal, reveal);
    return () => {
      alive = false;
    };
  }, [gl, camera, scene, material]);

  // Pointer events hit a simple capsule-ish proxy, not the 80k-triangle scan:
  // hover is ray-tested on every pointer move.
  const hit = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.15, 0.12, 1, 12);
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
  // Don't leave a pointer cursor or a stale hover behind if he unmounts.
  useEffect(
    () => () => {
      document.body.style.cursor = "";
      if (lobby.get().hovered === "operator") lobby.set({ hovered: null });
    },
    [],
  );

  const anim = useRef({
    yaw: spring(),
    pitch: spring(),
    roll: spring(),
    twist: spring(),
    lean: spring(),
    shift: spring(),
    glanceYaw: 0,
    glancePitch: 0,
    glanceRoll: 0,
    nextGlance: 2,
    weightSide: 1,
    nextWeight: 6,
    emoteAt: -10,
    lastEmote: 0,
    lastPointer: { x: 0, y: 0 },
    attentionUntil: 0,
  });
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const s = lobby.get();
    const a = anim.current;
    const u = material.userData.uniforms as Uniforms;
    const calm = s.reducedMotion ? 0.35 : 1;

    // Where the camera is, relative to the way he's facing.
    camera.getWorldPosition(tmp);
    const toCamera = wrap(Math.atan2(tmp.x - position[0], tmp.z - position[2]) - OPERATOR_YAW);
    const presenting = s.screen === "loadout" || s.screen === "intel";

    if (s.emote !== a.lastEmote) {
      a.lastEmote = s.emote;
      a.emoteAt = t;
    }
    const sinceEmote = t - a.emoteAt;
    const emoting = sinceEmote < 2.4;

    // Moving the mouse catches his attention for a moment.
    const moved = Math.hypot(pointer.x - a.lastPointer.x, pointer.y - a.lastPointer.y);
    a.lastPointer.x = pointer.x;
    a.lastPointer.y = pointer.y;
    if (moved > 0.02) a.attentionUntil = t + 1.6;

    // Pick a new glance, then hold it, like a person taking in the view.
    if (t > a.nextGlance) {
      const r = Math.random();
      if (presenting) {
        // Mostly holds eye contact; now and then looks off for a beat.
        const away = r < 0.3;
        a.glanceYaw = away ? (Math.random() < 0.5 ? -0.32 : 0.28) : 0;
        a.glancePitch = away ? 0.04 : 0;
        a.glanceRoll = away ? (Math.random() - 0.5) * 0.06 : 0;
        a.nextGlance = t + (away ? 0.9 + Math.random() * 0.8 : 3 + Math.random() * 4);
      } else {
        // Lobby: toward you, off to the side, or back over his shoulder at the city.
        const choice = r < 0.38 ? "camera" : r < 0.6 ? "ahead" : r < 0.82 ? "side" : "city";
        a.glanceYaw = choice === "camera" ? 1 : choice === "ahead" ? 0.05 : choice === "side" ? 0.34 : -0.62;
        a.glancePitch = choice === "city" ? -0.04 : (Math.random() - 0.4) * 0.07;
        a.glanceRoll = (Math.random() - 0.5) * 0.07;
        a.nextGlance = t + 1.8 + Math.random() * 3.6;
      }
    }

    // Resolve the look target (yaw relative to his stance).
    const cameraYaw = THREE.MathUtils.clamp(toCamera, -0.7, 0.7);
    let lookYaw: number;
    let lookPitch = a.glancePitch;
    if (presenting) {
      lookYaw = cameraYaw + a.glanceYaw + pointer.x * 0.18;
      lookPitch += -pointer.y * 0.07;
    } else if (emoting || s.hovered === "player" || s.hovered === "operator" || t < a.attentionUntil) {
      lookYaw = cameraYaw + pointer.x * 0.22;
      lookPitch += -pointer.y * 0.06;
    } else {
      lookYaw = a.glanceYaw === 1 ? cameraYaw : a.glanceYaw;
    }

    // Big turns are shared: the spine takes a third, the neck the rest.
    const totalYaw = THREE.MathUtils.clamp(lookYaw, -0.75, 0.75) * calm;
    const twistTarget = totalYaw * 0.32;
    const headYawTarget = totalYaw - twistTarget;

    // Acknowledge on emote: lean in a little and nod twice.
    const nod = emoting ? Math.max(0, Math.sin(sinceEmote * 6.5)) * Math.exp(-sinceEmote * 0.9) * 0.2 : 0;
    const leanTarget = emoting ? 0.035 * Math.exp(-sinceEmote * 0.8) : 0.008 * Math.sin(t * 0.21);

    // Weight shifts to the other leg every so often.
    if (t > a.nextWeight) {
      a.weightSide = -a.weightSide;
      a.nextWeight = t + 5 + Math.random() * 5;
    }

    // Micro-motion so nothing is ever perfectly still.
    const micro = Math.sin(t * 0.73) * 0.012 + Math.sin(t * 1.31 + 1.7) * 0.007;

    u.uHeadYaw.value = step(a.yaw, headYawTarget + micro * calm, 38, dt);
    u.uHeadPitch.value = step(a.pitch, (lookPitch + nod + Math.sin(t * 0.93) * 0.006) * calm, 46, dt);
    u.uHeadRoll.value = step(a.roll, (a.glanceRoll + Math.sin(t * 0.41) * 0.01) * calm, 20, dt);
    u.uTwist.value = step(a.twist, twistTarget + Math.sin(t * 0.27) * 0.012 * calm, 9, dt);
    u.uLean.value = step(a.lean, leanTarget * calm, 12, dt);
    u.uShift.value = step(a.shift, a.weightSide * 0.0055 * calm + Math.sin(t * 0.37) * 0.0012, 3.2, dt);
    u.uBreath.value = breath(t) * (s.reducedMotion ? 0.6 : 1);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag that started and ended on him was the camera orbit, not a tap.
    if (e.delta > 6) return;
    lobby.set((s) => ({ emote: s.emote + 1 }));
  };

  return (
    <group position={position} rotation-y={OPERATOR_YAW}>
      <mesh ref={body} geometry={geometry} material={material} scale={HEIGHT} castShadow receiveShadow visible={shown} />
      <mesh
        geometry={hit.geometry}
        material={hit.material}
        scale={HEIGHT}
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
