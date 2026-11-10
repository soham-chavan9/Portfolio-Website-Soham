"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { lobby, pointer } from "../store";

// The operator: a stylized, procedurally rigged figure of Soham. Charcoal
// blazer, white shirt, navy tie, short black hair. Two stances (leaning on the
// rail looking at Manhattan, and turned to camera, hands in pockets), a wave,
// breathing, weight shifts and a head that follows your cursor.

type Joint =
  | "hips" | "spine" | "chest" | "neck" | "head"
  | "shoulderL" | "elbowL" | "wristL"
  | "shoulderR" | "elbowR" | "wristR"
  | "hipL" | "kneeL" | "ankleL"
  | "hipR" | "kneeR" | "ankleR";

type Pose = Partial<Record<Joint, [number, number, number]>>;

const JOINTS: Joint[] = [
  "hips", "spine", "chest", "neck", "head",
  "shoulderL", "elbowL", "wristL", "shoulderR", "elbowR", "wristR",
  "hipL", "kneeL", "ankleL", "hipR", "kneeR", "ankleR",
];

const GAZE: Pose = {
  hips: [0, 0, 0.02],
  spine: [0.1, 0, 0],
  chest: [0.07, 0, 0],
  neck: [-0.06, 0, 0],
  head: [-0.12, 0, 0],
  shoulderL: [-0.8, 0, 0.16],
  elbowL: [-0.52, 0, 0],
  wristL: [0.4, 0, 0],
  shoulderR: [-0.8, 0, -0.16],
  elbowR: [-0.52, 0, 0],
  wristR: [0.4, 0, 0],
  hipL: [0.03, 0, 0.03],
  kneeL: [0.02, 0, 0],
  ankleL: [-0.05, 0, 0],
  hipR: [-0.08, 0, -0.04],
  kneeR: [0.14, 0, 0],
  ankleR: [-0.06, 0, 0],
};

const STAND: Pose = {
  hips: [0, 0, -0.03],
  spine: [-0.02, 0, 0.02],
  chest: [-0.05, 0, 0.01],
  neck: [0.03, 0, 0],
  head: [0.03, 0, 0],
  shoulderL: [0.12, 0, -0.04],
  elbowL: [-0.55, 0, 0],
  wristL: [0, 0.3, 0],
  shoulderR: [0.12, 0, 0.04],
  elbowR: [-0.55, 0, 0],
  wristR: [0, -0.3, 0],
  hipL: [0, 0, 0.06],
  kneeL: [0.02, 0, 0],
  ankleL: [0, 0, -0.04],
  hipR: [0.02, 0, -0.03],
  kneeR: [0.12, 0, 0],
  ankleR: [-0.08, 0, 0.02],
};

function materials() {
  return {
    skin: new THREE.MeshPhysicalMaterial({
      color: "#86573d",
      roughness: 0.52,
      sheen: 0.5,
      sheenColor: new THREE.Color("#e8a888"),
      sheenRoughness: 0.55,
      emissive: new THREE.Color("#2a1008"),
      emissiveIntensity: 0.15,
    }),
    hair: new THREE.MeshPhysicalMaterial({
      color: "#0b0908",
      roughness: 0.42,
      sheen: 1,
      sheenColor: new THREE.Color("#4a4c5c"),
      sheenRoughness: 0.35,
    }),
    jacket: new THREE.MeshPhysicalMaterial({
      color: "#40454e",
      roughness: 0.82,
      sheen: 0.7,
      sheenColor: new THREE.Color("#9aa3b8"),
      sheenRoughness: 0.45,
    }),
    lapel: new THREE.MeshPhysicalMaterial({
      color: "#363a42",
      roughness: 0.6,
      sheen: 0.8,
      sheenColor: new THREE.Color("#aab3c8"),
    }),
    trousers: new THREE.MeshPhysicalMaterial({
      color: "#24272d",
      roughness: 0.85,
      sheen: 0.35,
      sheenColor: new THREE.Color("#7b8294"),
    }),
    shirt: new THREE.MeshStandardMaterial({ color: "#eceef2", roughness: 0.7 }),
    tie: new THREE.MeshPhysicalMaterial({
      color: "#1e3468",
      roughness: 0.4,
      sheen: 0.8,
      sheenColor: new THREE.Color("#6f8fd8"),
    }),
    shoes: new THREE.MeshPhysicalMaterial({ color: "#0a0a0b", roughness: 0.28, clearcoat: 0.7 }),
    eye: new THREE.MeshStandardMaterial({ color: "#140e0b", roughness: 0.15 }),
    lip: new THREE.MeshStandardMaterial({ color: "#6e3d2c", roughness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: "#c7cad0", metalness: 1, roughness: 0.25 }),
    watch: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.2, 2.6), toneMapped: false }),
  };
}

const capsule = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 6, 16);

function Limb({ r, len, material }: { r: number; len: number; material: THREE.Material }) {
  const geo = useMemo(() => capsule(r, Math.max(0.001, len - r)), [r, len]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={material} position={[0, -len / 2, 0]} />;
}

function Hand({ m, side }: { m: ReturnType<typeof materials>; side: 1 | -1 }) {
  const palm = useMemo(() => new RoundedBoxGeometry(0.075, 0.085, 0.032, 3, 0.012), []);
  const fingers = useMemo(() => new RoundedBoxGeometry(0.07, 0.07, 0.026, 3, 0.011), []);
  useEffect(() => () => { palm.dispose(); fingers.dispose(); }, [palm, fingers]);
  return (
    <group>
      <mesh geometry={palm} material={m.skin} position={[0, -0.045, 0]} />
      <mesh geometry={fingers} material={m.skin} position={[0, -0.11, 0.008]} rotation-x={0.35} />
      <mesh material={m.skin} position={[side * 0.038, -0.045, 0.014]} rotation={[0.3, 0, side * 0.6]}>
        <capsuleGeometry args={[0.012, 0.035, 4, 8]} />
      </mesh>
    </group>
  );
}

export default function Operator({ position }: { position: [number, number, number] }) {
  const m = useMemo(materials, []);
  useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);

  const root = useRef<THREE.Group>(null);
  const refs = useRef<Partial<Record<Joint, THREE.Group>>>({});
  const set = (j: Joint) => (g: THREE.Group | null) => {
    if (g) refs.current[j] = g;
  };

  const anim = useRef({
    turn: 0,
    wave: 0,
    emoteUntil: 0,
    lastEmote: 0,
    lookYaw: 0,
    lookPitch: 0,
    gazeTarget: 0,
    nextGaze: 3,
  });

  useEffect(() => {
    const g = root.current;
    if (!g) return;
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const s = lobby.get();
    const a = anim.current;

    if (s.emote !== a.lastEmote) {
      a.lastEmote = s.emote;
      a.emoteUntil = t + 2.9;
    }
    const emoting = t < a.emoteUntil;
    const facing = s.screen === "loadout" || s.screen === "intel" || emoting;
    a.turn = THREE.MathUtils.damp(a.turn, facing ? 1 : 0, s.reducedMotion ? 12 : 3.2, dt);
    const waveOn = emoting && a.turn > 0.82 && t < a.emoteUntil - 0.35;
    a.wave = THREE.MathUtils.damp(a.wave, waveOn ? 1 : 0, 7, dt);

    const w = THREE.MathUtils.smootherstep(a.turn, 0, 1);
    const g = root.current;
    if (g) {
      g.rotation.y = THREE.MathUtils.lerp(Math.PI, 0, w);
      g.position.y = Math.sin(w * Math.PI) * 0.015;
    }

    // Where the head wants to look.
    if (t > a.nextGaze) {
      const choices = [-0.45, -0.25, -0.05, 0.15, 0.35, 0.5];
      a.gazeTarget = choices[Math.floor(Math.random() * choices.length)];
      a.nextGaze = t + 3.5 + Math.random() * 4;
    }
    const lookingBack = s.hovered === "player" && w < 0.5;
    const yawGaze = lookingBack ? -1.0 : a.gazeTarget;
    const yawStand = pointer.x * 0.55;
    const pitchStand = -pointer.y * 0.22;
    a.lookYaw = THREE.MathUtils.damp(a.lookYaw, THREE.MathUtils.lerp(yawGaze, yawStand, w), 3, dt);
    a.lookPitch = THREE.MathUtils.damp(a.lookPitch, THREE.MathUtils.lerp(0, pitchStand, w), 3, dt);

    const breathe = Math.sin(t * 1.45);
    const sway = Math.sin(t * 0.33);

    for (const j of JOINTS) {
      const node = refs.current[j];
      if (!node) continue;
      const ga = GAZE[j] ?? [0, 0, 0];
      const st = STAND[j] ?? [0, 0, 0];
      let x = THREE.MathUtils.lerp(ga[0], st[0], w);
      let y = THREE.MathUtils.lerp(ga[1], st[1], w);
      let z = THREE.MathUtils.lerp(ga[2], st[2], w);
      switch (j) {
        case "hips":
          z += sway * 0.018;
          break;
        case "spine":
          x += breathe * 0.008;
          z -= sway * 0.012;
          break;
        case "chest":
          x += breathe * 0.012;
          y += a.lookYaw * 0.25 + (lookingBack ? -0.18 : 0);
          break;
        case "neck":
          y += a.lookYaw * 0.3;
          x += a.lookPitch * 0.4;
          break;
        case "head":
          y += a.lookYaw * 0.45;
          x += a.lookPitch * 0.6;
          z += a.wave * 0.12;
          break;
        case "shoulderR":
          z += breathe * 0.01;
          x = THREE.MathUtils.lerp(x, -0.25, a.wave);
          z = THREE.MathUtils.lerp(z, -1.95, a.wave);
          break;
        case "shoulderL":
          z += breathe * 0.01;
          break;
        case "elbowR":
          x = THREE.MathUtils.lerp(x, 0, a.wave);
          z = THREE.MathUtils.lerp(z, -0.85 + Math.sin(t * 10) * 0.38, a.wave);
          break;
        case "wristR":
          y = THREE.MathUtils.lerp(y, 0, a.wave);
          break;
      }
      node.rotation.set(x, y, z);
      // Hands slide into the trouser pockets in the standing pose.
      if (j === "wristL" || j === "wristR") {
        const pocket = w * (j === "wristR" ? 1 - a.wave : 1);
        node.scale.setScalar(Math.max(0.001, 1 - THREE.MathUtils.smoothstep(pocket, 0.55, 0.95)));
      }
    }
    const chest = refs.current.chest;
    if (chest) chest.scale.set(1 + breathe * 0.006, 1 + breathe * 0.01, 1 + breathe * 0.012);
    const hips = refs.current.hips;
    if (hips) hips.position.x = sway * 0.012 + THREE.MathUtils.lerp(0, 0.02, w);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    lobby.set((s) => ({ emote: s.emote + 1 }));
  };

  const geos = useMemo(
    () => ({
      chest: (() => {
        const g = capsule(0.15, 0.14);
        g.scale(1.45, 1, 0.8);
        return g;
      })(),
      abdomen: (() => {
        const g = capsule(0.13, 0.08);
        g.scale(1.06, 1, 0.76);
        return g;
      })(),
      pelvis: (() => {
        const g = capsule(0.14, 0.05);
        g.scale(1.14, 1, 0.82);
        return g;
      })(),
      hem: (() => {
        const g = new THREE.CylinderGeometry(0.15, 0.178, 0.2, 24, 1, true);
        g.scale(1, 1, 0.78);
        return g;
      })(),
      skull: new THREE.SphereGeometry(0.1, 32, 24),
      jaw: new THREE.SphereGeometry(0.074, 24, 16),
      hairCap: new THREE.SphereGeometry(0.108, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.44),
      hairBack: new THREE.SphereGeometry(0.104, 24, 16, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.35, Math.PI * 0.4),
      shoe: new RoundedBoxGeometry(0.105, 0.075, 0.28, 3, 0.03),
      collar: new THREE.TorusGeometry(0.066, 0.016, 8, 24, Math.PI * 1.6),
      shirtV: (() => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.075, 0);
        shape.lineTo(0.075, 0);
        shape.lineTo(0, -0.2);
        shape.closePath();
        return new THREE.ShapeGeometry(shape);
      })(),
    }),
    [],
  );
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);

  return (
    <group
      ref={root}
      position={position}
      rotation-y={Math.PI}
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
    >
      <group ref={set("hips")} position={[0, 0.96, 0]}>
        <mesh geometry={geos.pelvis} material={m.trousers} position={[0, -0.02, 0]} />
        <mesh geometry={geos.hem} material={m.jacket} position={[0, 0.0, 0.005]} />
        <group ref={set("spine")} position={[0, 0.08, 0]}>
          <mesh geometry={geos.abdomen} material={m.jacket} position={[0, 0.06, 0]} />
          <group ref={set("chest")} position={[0, 0.22, 0]}>
            <mesh geometry={geos.chest} material={m.jacket} position={[0, 0.04, -0.005]} />
            {/* Shirt, tie, lapels */}
            <mesh geometry={geos.shirtV} material={m.shirt} position={[0, 0.19, 0.118]} rotation-x={-0.18} />
            <mesh material={m.tie} position={[0, 0.1, 0.128]} rotation-x={-0.12}>
              <boxGeometry args={[0.034, 0.17, 0.01]} />
            </mesh>
            <mesh material={m.tie} position={[0, 0.185, 0.122]} rotation-x={-0.2}>
              <boxGeometry args={[0.03, 0.026, 0.016]} />
            </mesh>
            {[-1, 1].map((sd) => (
              <mesh key={sd} material={m.lapel} position={[sd * 0.055, 0.12, 0.12]} rotation={[-0.15, sd * 0.25, sd * 0.42]}>
                <boxGeometry args={[0.035, 0.2, 0.014]} />
              </mesh>
            ))}
            <group ref={set("neck")} position={[0, 0.2, 0]}>
              <mesh geometry={geos.collar} material={m.shirt} position={[0, 0.005, 0.0]} rotation={[Math.PI / 2 - 0.15, 0, Math.PI * 0.7]} />
              <mesh material={m.skin} position={[0, 0.035, 0]}>
                <cylinderGeometry args={[0.048, 0.054, 0.1, 16]} />
              </mesh>
              <group ref={set("head")} position={[0, 0.075, 0.005]}>
                <mesh geometry={geos.skull} material={m.skin} position={[0, 0.1, 0]} scale={[0.9, 1.08, 0.98]} />
                <mesh geometry={geos.jaw} material={m.skin} position={[0, 0.045, 0.024]} scale={[0.92, 0.92, 1]} />
                {/* Ears */}
                {[-1, 1].map((sd) => (
                  <mesh key={sd} material={m.skin} position={[sd * 0.09, 0.098, -0.004]} scale={[0.42, 1, 0.72]}>
                    <sphereGeometry args={[0.025, 12, 10]} />
                  </mesh>
                ))}
                {/* Face */}
                <mesh material={m.skin} position={[0, 0.088, 0.096]} rotation-x={Math.PI / 2 - 0.25}>
                  <coneGeometry args={[0.016, 0.042, 10]} />
                </mesh>
                {[-1, 1].map((sd) => (
                  <group key={sd}>
                    <mesh material={m.eye} position={[sd * 0.034, 0.112, 0.085]}>
                      <sphereGeometry args={[0.0115, 12, 10]} />
                    </mesh>
                    <mesh material={m.hair} position={[sd * 0.036, 0.133, 0.088]} rotation-z={sd * -0.12}>
                      <boxGeometry args={[0.036, 0.008, 0.012]} />
                    </mesh>
                  </group>
                ))}
                <mesh material={m.lip} position={[0, 0.054, 0.091]} rotation-z={0.04}>
                  <boxGeometry args={[0.032, 0.005, 0.008]} />
                </mesh>
                {/* Hair: cap, back, and swept volume on top */}
                <mesh geometry={geos.hairCap} material={m.hair} position={[0, 0.112, -0.01]} scale={[0.95, 1.0, 1.05]} rotation-x={-0.36} />
                <mesh geometry={geos.hairBack} material={m.hair} position={[0, 0.1, -0.006]} scale={[0.93, 1.05, 1.03]} rotation-y={Math.PI} />
                {/* Volume on top, swept slightly forward and to one side */}
                <mesh material={m.hair} position={[0.006, 0.188, 0.022]} rotation={[-0.25, 0, 0.08]} scale={[0.95, 0.42, 1.08]}>
                  <sphereGeometry args={[0.088, 24, 16]} />
                </mesh>
              </group>
            </group>

            {/* Arms */}
            {(["L", "R"] as const).map((sd) => {
              const k = sd === "L" ? 1 : -1;
              return (
                <group key={sd} ref={set(`shoulder${sd}`)} position={[k * 0.2, 0.15, -0.01]}>
                  <mesh material={m.jacket} position={[0, 0.0, 0]}>
                    <sphereGeometry args={[0.058, 16, 12]} />
                  </mesh>
                  <Limb r={0.058} len={0.3} material={m.jacket} />
                  <group ref={set(`elbow${sd}`)} position={[0, -0.3, 0]}>
                    <Limb r={0.05} len={0.25} material={m.jacket} />
                    <mesh material={m.shirt} position={[0, -0.245, 0]}>
                      <cylinderGeometry args={[0.042, 0.042, 0.03, 14]} />
                    </mesh>
                    {sd === "L" && (
                      <group position={[0, -0.215, 0.0]}>
                        <mesh material={m.steel} rotation-x={Math.PI / 2} position={[0, 0, 0.04]}>
                          <cylinderGeometry args={[0.02, 0.02, 0.01, 16]} />
                        </mesh>
                        <mesh material={m.watch} rotation-x={Math.PI / 2} position={[0, 0, 0.046]}>
                          <circleGeometry args={[0.015, 16]} />
                        </mesh>
                      </group>
                    )}
                    <group ref={set(`wrist${sd}`)} position={[0, -0.255, 0]}>
                      <Hand m={m} side={k as 1 | -1} />
                    </group>
                  </group>
                </group>
              );
            })}
          </group>
        </group>

        {/* Legs */}
        {(["L", "R"] as const).map((sd) => {
          const k = sd === "L" ? 1 : -1;
          return (
            <group key={sd} ref={set(`hip${sd}`)} position={[k * 0.095, -0.06, 0]}>
              <Limb r={0.078} len={0.43} material={m.trousers} />
              <group ref={set(`knee${sd}`)} position={[0, -0.43, 0]}>
                <Limb r={0.06} len={0.41} material={m.trousers} />
                <group ref={set(`ankle${sd}`)} position={[0, -0.41, 0]}>
                  <mesh geometry={geos.shoe} material={m.shoes} position={[0, -0.03, 0.055]} />
                </group>
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}
