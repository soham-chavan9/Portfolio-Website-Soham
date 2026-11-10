"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GROUND_Y, landmarkTop } from "./geo";
import { createFlameMaterial, createWindowMaterial } from "./shaders";

// The penthouse terrace, at 1:1 in meters. Floor at y = 0, glass railing
// along z = -3 facing Manhattan, the apartment's glass wall at z = 4.5.

export const RAIL_Z = -3;
export const RAIL_TOP = 1.08;
const X0 = -6.5;
const X1 = 6.5;
const Z_BACK = 4.5;

function tileTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d")!;
  const n = 4;
  const s = c.width / n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = 34 + Math.round(Math.random() * 8);
      g.fillStyle = `rgb(${v},${v + 1},${v + 4})`;
      g.fillRect(i * s, j * s, s, s);
      for (let k = 0; k < 900; k++) {
        const a = Math.random() * 0.05;
        g.fillStyle = `rgba(255,255,255,${a})`;
        g.fillRect(i * s + Math.random() * s, j * s + Math.random() * s, 2, 2);
      }
    }
  }
  g.strokeStyle = "#0e0f12";
  g.lineWidth = 5;
  for (let i = 0; i <= n; i++) {
    g.beginPath();
    g.moveTo(i * s, 0);
    g.lineTo(i * s, c.height);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i * s);
    g.lineTo(c.width, i * s);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set((X1 - X0) / 4.8, (Z_BACK - RAIL_Z) / 4.8);
  t.anisotropy = 8;
  return t;
}

function screenTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0b0f16";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#161c27";
  g.fillRect(0, 0, c.width, 22);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(14 + i * 16, 11, 5, 0, Math.PI * 2);
    g.fill();
  });
  const palette = ["#79c0ff", "#ff7b72", "#d2a8ff", "#7ee787", "#ffa657", "#c9d1d9"];
  let y = 40;
  let indent = 0;
  while (y < c.height - 10) {
    let x = 16 + indent * 18;
    const words = 1 + Math.floor(Math.random() * 5);
    for (let w = 0; w < words; w++) {
      const len = 18 + Math.random() * 60;
      g.fillStyle = palette[Math.floor(Math.random() * palette.length)];
      g.globalAlpha = 0.85;
      g.fillRect(x, y, len, 6);
      x += len + 8;
    }
    g.globalAlpha = 1;
    y += 14;
    indent = Math.max(0, Math.min(4, indent + (Math.random() < 0.3 ? 1 : Math.random() < 0.3 ? -1 : 0)));
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function catenary(a: THREE.Vector3, b: THREE.Vector3, sag: number, steps = 40) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    p.y -= sag * 4 * t * (1 - t);
    pts.push(p);
  }
  return pts;
}

function StringLights() {
  const strands = useMemo(
    () => [
      catenary(new THREE.Vector3(X0 + 0.2, 2.78, RAIL_Z + 0.12), new THREE.Vector3(X1 - 0.2, 2.78, RAIL_Z + 0.12), 0.42),
      catenary(new THREE.Vector3(X0 + 0.2, 3.05, Z_BACK - 2.2), new THREE.Vector3(X1 - 0.2, 2.78, RAIL_Z + 0.12), 0.5),
    ],
    [],
  );
  const { wires, bulbs } = useMemo(() => {
    const wires = strands.map(
      (pts) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.004, 4, false),
    );
    const bulbs: THREE.Vector3[] = [];
    for (const pts of strands) {
      const curve = new THREE.CatmullRomCurve3(pts);
      const len = curve.getLength();
      const n = Math.floor(len / 0.55);
      for (let i = 1; i < n; i++) bulbs.push(curve.getPointAt(i / n).add(new THREE.Vector3(0, -0.05, 0)));
    }
    return { wires, bulbs };
  }, [strands]);
  const wireMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#111", roughness: 0.8 }), []);
  const bulbMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color(5.5, 3.3, 1.4), toneMapped: false }),
    [],
  );
  const bulbGeo = useMemo(() => new THREE.SphereGeometry(0.032, 10, 8), []);
  const inst = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = inst.current;
    if (!m) return;
    const mat = new THREE.Matrix4();
    bulbs.forEach((p, i) => {
      mat.makeTranslation(p.x, p.y, p.z);
      m.setMatrixAt(i, mat);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [bulbs]);
  useEffect(
    () => () => {
      wires.forEach((w) => w.dispose());
      wireMat.dispose();
      bulbMat.dispose();
      bulbGeo.dispose();
    },
    [wires, wireMat, bulbMat, bulbGeo],
  );
  return (
    <group>
      {wires.map((w, i) => (
        <mesh key={i} geometry={w} material={wireMat} />
      ))}
      <instancedMesh ref={inst} args={[bulbGeo, bulbMat, bulbs.length]} frustumCulled={false} />
    </group>
  );
}

function FireTable({ position }: { position: [number, number, number] }) {
  const light = useRef<THREE.PointLight>(null);
  const flames = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const m = createFlameMaterial();
        m.uniforms.uSeed.value = i * 0.37;
        return m;
      }),
    [],
  );
  useEffect(() => () => flames.forEach((f) => f.dispose()), [flames]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (const f of flames) f.uniforms.uTime.value = t;
    if (light.current) {
      light.current.intensity =
        7 * (0.82 + 0.12 * Math.sin(t * 11.3) * Math.sin(t * 3.7) + 0.08 * Math.sin(t * 23.1));
    }
  });
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[1.7, 0.4, 0.86]} />
        <meshStandardMaterial color="#3a3836" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.405, 0]}>
        <boxGeometry args={[1.2, 0.012, 0.32]} />
        <meshStandardMaterial color="#120d0b" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.53, 0]}>
        <boxGeometry args={[1.26, 0.24, 0.38]} />
        <meshStandardMaterial color="#cfe5e8" transparent opacity={0.08} roughness={0.05} depthWrite={false} />
      </mesh>
      {flames.map((m, i) => (
        <mesh key={i} material={m} position={[-0.45 + (i % 3) * 0.45, 0.58, i < 3 ? -0.04 : 0.04]} rotation-y={i < 3 ? 0.25 : -0.25}>
          <planeGeometry args={[0.5, 0.36]} />
        </mesh>
      ))}
      <pointLight ref={light} position={[0, 0.75, 0]} color="#ff8a3d" intensity={7} distance={9} decay={1.6} />
    </group>
  );
}

function Telescope({ position }: { position: [number, number, number] }) {
  const tube = useRef<THREE.Group>(null);
  useEffect(() => {
    const t = tube.current;
    if (!t) return;
    const target = new THREE.Vector3(...landmarkTop("oneWtc"));
    target.y -= 25;
    t.lookAt(target);
  }, []);
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b8893e", metalness: 1, roughness: 0.32 }), []);
  const black = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0d0d10", metalness: 0.4, roughness: 0.35 }), []);
  useEffect(() => () => { brass.dispose(); black.dispose(); }, [brass, black]);
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.3;
        return (
          <mesh key={i} material={black} castShadow position={[Math.cos(a) * 0.22, 0.6, Math.sin(a) * 0.22]} rotation={[Math.sin(a) * 0.36, 0, -Math.cos(a) * 0.36]}>
            <cylinderGeometry args={[0.012, 0.016, 1.25, 8]} />
          </mesh>
        );
      })}
      <mesh material={brass} position={[0, 1.22, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 12]} />
      </mesh>
      <group ref={tube} position={[0, 1.32, 0]}>
        <mesh material={black} castShadow rotation-x={Math.PI / 2} position={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.065, 0.05, 0.95, 20]} />
        </mesh>
        <mesh material={brass} rotation-x={Math.PI / 2} position={[0, 0, 0.66]}>
          <cylinderGeometry args={[0.072, 0.072, 0.06, 20]} />
        </mesh>
        <mesh material={brass} rotation-x={Math.PI / 2} position={[0, 0, -0.28]}>
          <cylinderGeometry args={[0.03, 0.03, 0.12, 12]} />
        </mesh>
      </group>
    </group>
  );
}

function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const geos = useMemo(
    () => ({
      base: new RoundedBoxGeometry(2.4, 0.32, 0.95, 3, 0.04),
      seat: new RoundedBoxGeometry(1.16, 0.16, 0.8, 4, 0.06),
      back: new RoundedBoxGeometry(1.16, 0.5, 0.2, 4, 0.08),
      arm: new RoundedBoxGeometry(0.14, 0.5, 0.95, 3, 0.04),
    }),
    [],
  );
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={geos.base} position={[0, 0.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1b1c1f" roughness={0.6} metalness={0.2} />
      </mesh>
      {[-0.59, 0.59].map((x) => (
        <group key={x}>
          <mesh geometry={geos.seat} position={[x, 0.44, 0.04]} castShadow receiveShadow>
            <meshStandardMaterial color="#8d8a85" roughness={0.95} />
          </mesh>
          <mesh geometry={geos.back} position={[x, 0.72, 0.38]} rotation-x={-0.12} castShadow>
            <meshStandardMaterial color="#8d8a85" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} geometry={geos.arm} position={[x, 0.45, 0]} castShadow>
          <meshStandardMaterial color="#1b1c1f" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[0.25, 0.6, 0.22]} rotation={[0.2, 0.4, 0.15]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.12]} />
        <meshStandardMaterial color="#b0703f" roughness={0.95} />
      </mesh>
    </group>
  );
}

function CoffeeTable({ position }: { position: [number, number, number] }) {
  const screen = useMemo(() => screenTexture(), []);
  const screenMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: screen, color: new THREE.Color(1.6, 1.6, 1.6), toneMapped: false }),
    [screen],
  );
  useEffect(() => () => { screen.dispose(); screenMat.dispose(); }, [screen, screenMat]);
  return (
    <group position={position}>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.05, 0.66]} />
        <meshStandardMaterial color="#d9d4cc" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow>
        <boxGeometry args={[1.0, 0.34, 0.5]} />
        <meshStandardMaterial color="#141416" roughness={0.6} />
      </mesh>
      {/* Laptop */}
      <group position={[-0.18, 0.385, 0.02]} rotation-y={0.35}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.014, 0.23]} />
          <meshStandardMaterial color="#9da3ab" metalness={0.9} roughness={0.35} />
        </mesh>
        <group position={[0, 0.007, -0.115]} rotation-x={-1.85}>
          <mesh position={[0, 0, -0.112]}>
            <boxGeometry args={[0.34, 0.008, 0.225]} />
            <meshStandardMaterial color="#9da3ab" metalness={0.9} roughness={0.35} />
          </mesh>
          <mesh material={screenMat} position={[0, 0.0045, -0.112]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.31, 0.195]} />
          </mesh>
        </group>
      </group>
      {/* Glass with something amber in it */}
      <group position={[0.32, 0.385, -0.1]}>
        <mesh>
          <cylinderGeometry args={[0.036, 0.032, 0.085, 16, 1, true]} />
          <meshStandardMaterial color="#dff" transparent opacity={0.25} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[0, -0.018, 0]}>
          <cylinderGeometry args={[0.032, 0.03, 0.04, 16]} />
          <meshStandardMaterial color="#a2531a" emissive="#5a2306" roughness={0.1} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function Planter({ position, tree = false }: { position: [number, number, number]; tree?: boolean }) {
  const leaves = useMemo(() => {
    const out: { p: [number, number, number]; s: number }[] = [];
    let seed = tree ? 7 : 3;
    const r = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const n = tree ? 70 : 46;
    for (let i = 0; i < n; i++) {
      if (tree) {
        const a = r() * Math.PI * 2;
        const rad = 0.15 + r() * 0.45;
        out.push({ p: [Math.cos(a) * rad, 1.55 + r() * 0.9, Math.sin(a) * rad], s: 0.1 + r() * 0.12 });
      } else {
        out.push({ p: [(r() - 0.5) * 0.4, 0.95 + r() * 0.5, (r() - 0.5) * 0.4], s: 0.05 + r() * 0.06 });
      }
    }
    return out;
  }, [tree]);
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.9, 0.6]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.75} />
      </mesh>
      {tree && (
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.05, 0.75, 8]} />
          <meshStandardMaterial color="#3b2d22" roughness={0.9} />
        </mesh>
      )}
      {leaves.map((l, i) => (
        <mesh key={i} position={l.p} scale={[l.s, l.s * (tree ? 0.7 : 2.4), l.s]} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={tree ? "#33452c" : "#4a5a32"} roughness={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Chair({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const seat = useMemo(() => new RoundedBoxGeometry(0.72, 0.14, 0.7, 3, 0.05), []);
  const back = useMemo(() => new RoundedBoxGeometry(0.72, 0.5, 0.14, 3, 0.05), []);
  useEffect(() => () => { seat.dispose(); back.dispose(); }, [seat, back]);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={seat} position={[0, 0.38, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8d8a85" roughness={0.95} />
      </mesh>
      <mesh geometry={back} position={[0, 0.66, 0.3]} rotation-x={-0.25} castShadow>
        <meshStandardMaterial color="#8d8a85" roughness={0.95} />
      </mesh>
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.19, 0]} castShadow>
          <boxGeometry args={[0.04, 0.38, 0.66]} />
          <meshStandardMaterial color="#141416" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** The Newport tower itself: shaft below the terrace, penthouse box behind it. */
function Tower() {
  const shaft = useMemo(
    () => createWindowMaterial({ floor: 3.4, bay: 1.6, lit: 0.3, style: 0, seed: 0.42, intensity: 0.8, height: 28 }),
    [],
  );
  const penthouse = useMemo(
    () => createWindowMaterial({ floor: 3.7, bay: 1.6, lit: 0.85, style: 3, seed: 0.13, intensity: 1.5, height: 3.7 }),
    [],
  );
  const box = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  useEffect(
    () => () => {
      shaft.dispose();
      penthouse.dispose();
      box.dispose();
    },
    [shaft, penthouse, box],
  );
  useFrame(({ clock }) => {
    shaft.uniforms.uTime.value = clock.elapsedTime;
    penthouse.uniforms.uTime.value = clock.elapsedTime;
  });
  const h = -0.32 - GROUND_Y;
  return (
    <group>
      <mesh
        geometry={box}
        material={shaft}
        position={[(X0 - 0.5 + X1 + 0.1) / 2, GROUND_Y, (RAIL_Z - 0.1 + 26) / 2]}
        scale={[X1 + 0.1 - (X0 - 0.5), h, 26 - (RAIL_Z - 0.1)]}
      />
      <mesh geometry={box} material={penthouse} position={[0, 0, 17]} scale={[X1 - X0 + 0.2, 3.7, 18]} />
      {/* Roof and side walls over the living room */}
      <mesh position={[0, 3.72, Z_BACK + 1.7]}>
        <boxGeometry args={[X1 - X0 + 0.2, 0.25, 3.4]} />
        <meshStandardMaterial color="#141518" roughness={0.9} />
      </mesh>
      {[X0 - 0.05, X1 + 0.05].map((x) => (
        <mesh key={x} position={[x, 1.85, Z_BACK + 1.7]}>
          <boxGeometry args={[0.1, 3.7, 3.4]} />
          <meshStandardMaterial color="#141518" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[4, 4.3, 18]}>
        <boxGeometry args={[3, 1.2, 4]} />
        <meshStandardMaterial color="#101114" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function Balcony() {
  const tiles = useMemo(() => tileTexture(), []);
  useEffect(() => () => tiles.dispose(), [tiles]);
  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#a8cfd2",
        transparent: true,
        opacity: 0.09,
        roughness: 0.04,
        metalness: 0.1,
        envMapIntensity: 1.6,
        depthWrite: false,
      }),
    [],
  );
  const edge = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#7fb5b0", transparent: true, opacity: 0.35, roughness: 0.1 }),
    [],
  );
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9ccd1", metalness: 1, roughness: 0.22 }), []);
  const led = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.5, 1.7), toneMapped: false }),
    [],
  );
  const interior = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.62, 0.34), toneMapped: false }),
    [],
  );
  const slatMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5b3e28", roughness: 0.7 }), []);
  useEffect(
    () => () => {
      glass.dispose();
      edge.dispose();
      steel.dispose();
      led.dispose();
      interior.dispose();
      slatMat.dispose();
    },
    [glass, edge, steel, led, interior, slatMat],
  );

  const panels = useMemo(() => {
    const out: { x: number; z: number; w: number; side: boolean }[] = [];
    const n = 8;
    const w = (X1 - X0) / n;
    for (let i = 0; i < n; i++) out.push({ x: X0 + w * (i + 0.5), z: RAIL_Z, w: w - 0.02, side: false });
    const m = 5;
    const d = (Z_BACK - RAIL_Z) / m;
    for (let i = 0; i < m; i++) out.push({ x: X1, z: RAIL_Z + d * (i + 0.5), w: d - 0.02, side: true });
    return out;
  }, []);

  const width = X1 - X0;
  const depth = Z_BACK - RAIL_Z;
  const cx = (X0 + X1) / 2;
  const cz = (RAIL_Z + Z_BACK) / 2;

  return (
    <group>
      {/* Floor slab */}
      <mesh position={[cx, -0.16, cz - 0.05]} receiveShadow>
        <boxGeometry args={[width + 0.1, 0.32, depth + 0.1]} />
        <meshStandardMaterial color="#1c1d20" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0.002, cz]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={tiles} roughness={0.3} metalness={0.05} envMapIntensity={0.9} />
      </mesh>

      {/* Frameless glass railing, steel cap rail, warm LED at the base */}
      {panels.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation-y={p.side ? Math.PI / 2 : 0}>
          <mesh material={glass} position={[0, 0.54, 0]} renderOrder={2}>
            <boxGeometry args={[p.w, 1.04, 0.014]} />
          </mesh>
          <mesh material={edge} position={[p.w / 2 - 0.004, 0.54, 0]}>
            <boxGeometry args={[0.008, 1.04, 0.016]} />
          </mesh>
          <mesh material={steel} position={[0, 0.04, 0]}>
            <boxGeometry args={[p.w, 0.08, 0.06]} />
          </mesh>
        </group>
      ))}
      <mesh material={steel} position={[cx, RAIL_TOP, RAIL_Z]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.026, 0.026, width, 16]} />
      </mesh>
      <mesh material={steel} position={[X1, RAIL_TOP, cz]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.026, 0.026, depth, 16]} />
      </mesh>
      <mesh material={led} position={[cx, 0.012, RAIL_Z + 0.06]}>
        <boxGeometry args={[width - 0.1, 0.012, 0.02]} />
      </mesh>
      <mesh material={led} position={[X1 - 0.06, 0.012, cz]}>
        <boxGeometry args={[0.02, 0.012, depth - 0.1]} />
      </mesh>

      {/* Apartment glass wall with warm interior behind it */}
      <group position={[0, 0, Z_BACK]}>
        <mesh material={interior} position={[cx, 1.7, 3.2]}>
          <planeGeometry args={[width, 3.4]} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[X0 + (width / 8) * i, 1.7, 0]}>
            <boxGeometry args={[0.06, 3.4, 0.08]} />
            <meshStandardMaterial color="#0f1013" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[cx, 1.7, 0]} material={glass}>
          <boxGeometry args={[width, 3.4, 0.02]} />
        </mesh>
        {[-3.2, 0, 3.2].map((x) => (
          <mesh key={x} position={[x, 2.6, 1.6]}>
            <sphereGeometry args={[0.16, 16, 12]} />
            <meshBasicMaterial color={new THREE.Color(4, 2.6, 1.3)} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[-1.5, 0.4, 1.8]}>
          <boxGeometry args={[2.6, 0.8, 0.9]} />
          <meshStandardMaterial color="#1a1512" roughness={0.9} />
        </mesh>
      </group>

      {/* Canopy over the doors, with downlights */}
      <mesh position={[cx, 3.5, Z_BACK - 1.1]} castShadow>
        <boxGeometry args={[width + 0.1, 0.18, 2.4]} />
        <meshStandardMaterial color="#17181b" roughness={0.8} />
      </mesh>
      <mesh material={led} position={[cx, 3.405, Z_BACK - 2.29]}>
        <boxGeometry args={[width, 0.01, 0.02]} />
      </mesh>
      {[-4.5, -1.5, 1.5, 4.5].map((x) => (
        <mesh key={x} material={led} position={[x, 3.405, Z_BACK - 1.2]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.07, 16]} />
        </mesh>
      ))}

      {/* Slatted privacy wall on the north side, backlit */}
      <group position={[X0, 0, cz]}>
        <mesh position={[-0.08, 1.6, 0]}>
          <boxGeometry args={[0.04, 3.2, depth]} />
          <meshBasicMaterial color={new THREE.Color(0.5, 0.32, 0.16)} toneMapped={false} />
        </mesh>
        {Array.from({ length: 30 }, (_, i) => (
          <mesh key={i} material={slatMat} position={[0, 1.6, -depth / 2 + 0.12 + i * (depth / 30)]} castShadow>
            <boxGeometry args={[0.08, 3.2, 0.12]} />
          </mesh>
        ))}
      </group>

      <Tower />
      <StringLights />
      <FireTable position={[2.9, 0, -1.25]} />
      <Chair position={[4.45, 0, -0.75]} rotation={1.26} />
      <Chair position={[2.85, 0, 0.35]} rotation={0} />
      <Telescope position={[-2.35, 0, -2.45]} />
      <Sofa position={[-3.4, 0, 1.45]} />
      <CoffeeTable position={[-3.3, 0, 0.1]} />
      <Planter position={[X1 - 0.45, 0, RAIL_Z + 0.5]} tree />
      <Planter position={[X0 + 0.45, 0, RAIL_Z + 0.5]} />
      <Planter position={[X0 + 0.45, 0, RAIL_Z + 1.3]} />
    </group>
  );
}
