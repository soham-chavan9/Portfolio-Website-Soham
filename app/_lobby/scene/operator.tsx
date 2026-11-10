"use client";

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { lobby, pointer } from "../store";

// The operator: a 3D model of Soham (public/operator/soham.glb), painted by
// projecting the matching portrait onto it from the front. The model has no
// rig, so every movement is a smooth deformation field in the vertex shader:
// weight shifts between the legs with the feet planted, the spine twists and
// leans, the chest and shoulders breathe, and the head turns on the neck.
//
// Anatomy measured from the mesh (height = 1): shoulders end ~0.85, the neck
// is narrowest at 0.87-0.88, the jaw starts ~0.885, and the raised fist
// reaches 0.86 in front of the collar (z > 0.08).

const MODEL_URL = "/operator/soham.glb";
const ALBEDO_URL = "/operator/soham-albedo.webp";
const HEIGHT = 1.82;
/** Model-space width of the silhouette the portrait was cropped to. */
const PROJ_WIDTH = 0.3236;
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
  uSelfLight: U;
};

const deformGLSL = /* glsl */ `
  uniform float uHeadYaw;
  uniform float uHeadPitch;
  uniform float uHeadRoll;
  uniform float uTwist;
  uniform float uLean;
  uniform float uShift;
  uniform float uBreath;
  varying vec3 vObjPos;
  varying vec3 vObjNormal;

  const vec3 NECK = vec3(0.0, 0.868, -0.012);
  const vec3 HIPS = vec3(0.0, 0.5, -0.01);

  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
  mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

  // Head follows the neck between 0.858 and 0.880, so the jaw and face stay
  // rigid. The raised fist in front of the collar is excluded.
  float headWeight(vec3 p) {
    float w = smoothstep(0.858, 0.880, p.y);
    float fist = smoothstep(0.075, 0.095, p.z) * (1.0 - smoothstep(0.866, 0.882, p.y));
    return w * (1.0 - fist);
  }
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
    uSuit: { value: new THREE.Color(0.012, 0.012, 0.016) },
    uSelfLight: { value: 0.32 },
  };
  const material = new THREE.MeshStandardMaterial({ roughness: 0.74, metalness: 0, envMapIntensity: 0.5 });
  material.userData.uniforms = uniforms;
  material.customProgramCacheKey = () => "operator-projected-v2";
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
        vec3 p = position;

        // Breathing: chest fills forward, shoulders and head rise a touch.
        float chest = smoothstep(0.6, 0.7, p.y) * (1.0 - smoothstep(0.78, 0.86, p.y)) * smoothstep(-0.02, 0.04, p.z);
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
        uniform float uSelfLight;
        varying vec3 vObjPos;
        varying vec3 vObjNormal;`,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        // The model is mirrored relative to the portrait it was generated from.
        vec2 projUv = vec2(0.5 - vObjPos.x / uWidth, clamp(vObjPos.y, 0.001, 0.999));
        vec4 photo = texture2D(uAlbedo, projUv);
        float facing = normalize(vObjNormal).z;
        float head = smoothstep(0.875, 0.895, vObjPos.y);

        // Surfaces the portrait can't see: suit on the body; on the head, skin
        // for cheeks, jaw and ears, hair on top and behind the ears.
        // Cheeks turning away from the light sit in shadow; temples above the
        // ear and the back of the head are hair.
        vec3 skin = texture2D(uAlbedo, vec2(0.45, 0.915), 2.5).rgb * 0.8;
        vec3 hairTone = texture2D(uAlbedo, vec2(0.47, 0.975), 2.0).rgb * 0.85;
        float hair = max(smoothstep(0.928, 0.945, vObjPos.y),
                         (1.0 - smoothstep(-0.03, -0.005, vObjPos.z)) * smoothstep(0.885, 0.905, vObjPos.y));
        vec3 unseen = mix(uSuit, mix(skin, hairTone, hair), head);

        // Only trust the photo inside its silhouette and where it saw the
        // surface head-on; grazing angles smear into streaks. The face is
        // held to a stricter angle than the suit.
        float inside = smoothstep(0.4, 0.9, photo.a);
        float seen = mix(smoothstep(-0.05, 0.3, facing), smoothstep(0.26, 0.62, facing), head) * inside;
        vec3 projected = mix(unseen, photo.rgb, seen);
        diffuseColor.rgb = projected;
        `,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        totalEmissiveRadiance += projected * uSelfLight;`,
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

  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    gltf.scene.traverse((o) => {
      if (!geo && (o as THREE.Mesh).isMesh) geo = (o as THREE.Mesh).geometry;
    });
    return geo as unknown as THREE.BufferGeometry;
  }, [gltf]);

  const material = useMemo(() => {
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    albedo.needsUpdate = true;
    return createOperatorMaterial(albedo);
  }, [albedo, gl]);
  useEffect(() => () => material.dispose(), [material]);

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
    lobby.set((s) => ({ emote: s.emote + 1 }));
  };

  return (
    <group position={position} rotation-y={OPERATOR_YAW}>
      <mesh
        geometry={geometry}
        material={material}
        scale={HEIGHT}
        castShadow
        receiveShadow
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
