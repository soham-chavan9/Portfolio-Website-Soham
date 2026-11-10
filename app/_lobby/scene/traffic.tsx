"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GROUND_Y, polarToScene, rng } from "./geo";
import { shoreScenePoints } from "./city";
import { createLightPointsMaterial } from "./shaders";

// Everything that moves out there: West Side Highway traffic, ferries,
// helicopters over the river, and aircraft lining up for LaGuardia.

type Mover = { curve: THREE.Curve<THREE.Vector3>; t: number; speed: number };

function useLightPoints(count: number) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute("aBlink", new THREE.BufferAttribute(new Float32Array(count), 1));
    return g;
  }, [count]);
  const material = useMemo(() => createLightPointsMaterial(), []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return { geometry, material };
}

function Highway() {
  const lanes = useMemo(() => {
    const shore = shoreScenePoints().map(([x, z]) => {
      const len = Math.hypot(x, z);
      const k = (len + 5) / len;
      return new THREE.Vector3(x * k, GROUND_Y + 1.0, z * k);
    });
    const north = new THREE.CatmullRomCurve3(shore);
    const south = new THREE.CatmullRomCurve3(
      shore.map((p) => {
        const len = Math.hypot(p.x, p.z);
        const k = (len + 1.6) / len;
        return new THREE.Vector3(p.x * k, p.y, p.z * k);
      }),
    );
    return { north, south };
  }, []);

  const CARS = 220;
  const { geometry, material } = useLightPoints(CARS);
  const cars = useMemo(() => {
    const r = rng(404);
    const list: Mover[] = [];
    for (let i = 0; i < CARS; i++) {
      const toward = i % 2 === 0;
      list.push({
        curve: toward ? lanes.north : lanes.south,
        t: r(),
        speed: (0.0035 + r() * 0.002) * (toward ? 1 : -1),
      });
    }
    const colors = geometry.getAttribute("aColor") as THREE.BufferAttribute;
    const sizes = geometry.getAttribute("aSize") as THREE.BufferAttribute;
    list.forEach((c, i) => {
      if (c.speed > 0) colors.setXYZ(i, 2.6, 2.4, 2.1);
      else colors.setXYZ(i, 2.4, 0.18, 0.1);
      sizes.setX(i, 0.32);
    });
    return list;
  }, [geometry, lanes]);
  const dpr = useThree((s) => s.viewport.dpr);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const dt = Math.min(delta, 0.05);
    cars.forEach((c, i) => {
      c.t = (c.t + c.speed * dt + 1) % 1;
      c.curve.getPointAt(c.t, tmp);
      pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
    });
    pos.needsUpdate = true;
    material.uniforms.uPixelRatio.value = dpr;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

function Ferry({ from, to, period, offset, scale = 1 }: { from: [number, number]; to: [number, number]; period: number; offset: number; scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const a = useMemo(() => new THREE.Vector3(from[0], GROUND_Y, from[1]), [from]);
  const b = useMemo(() => new THREE.Vector3(to[0], GROUND_Y, to[1]), [to]);
  const yaw = useMemo(() => Math.atan2(b.x - a.x, b.z - a.z), [a, b]);
  const windows = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.4, 1.5), toneMapped: false }),
    [],
  );
  const hull = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9ccd2", roughness: 0.7 }), []);
  const red = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 0.3, 0.2) }), []);
  const green = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 5, 0.6) }), []);
  const wake = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.35, 0.4, 0.45),
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(
    () => () => {
      windows.dispose();
      hull.dispose();
      red.dispose();
      green.dispose();
      wake.dispose();
    },
    [windows, hull, red, green, wake],
  );

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    // Cross, dwell, cross back, dwell.
    const p = ((clock.elapsedTime / period + offset) % 1) * 4;
    let k: number;
    let dir = 1;
    if (p < 1.6) k = THREE.MathUtils.smootherstep(p / 1.6, 0, 1);
    else if (p < 2) k = 1;
    else if (p < 3.6) {
      k = 1 - THREE.MathUtils.smootherstep((p - 2) / 1.6, 0, 1);
      dir = -1;
    } else k = 0;
    g.position.lerpVectors(a, b, k);
    g.position.y = GROUND_Y + Math.sin(clock.elapsedTime * 1.3 + offset * 9) * 0.03;
    g.rotation.y = dir > 0 ? yaw : yaw + Math.PI;
    const moving = (p < 1.6 && p > 0.05) || (p > 2.05 && p < 3.6);
    g.children[g.children.length - 1].visible = moving;
  });

  return (
    <group ref={group} scale={scale}>
      <mesh material={hull} position={[0, 0.35, 0]}>
        <boxGeometry args={[1.7, 0.7, 6]} />
      </mesh>
      <mesh material={windows} position={[0, 0.85, 0]}>
        <boxGeometry args={[1.5, 0.28, 4.6]} />
      </mesh>
      <mesh material={hull} position={[0, 1.08, -0.4]}>
        <boxGeometry args={[1.3, 0.2, 2.4]} />
      </mesh>
      <mesh material={red} position={[-0.86, 0.75, 2.4]}>
        <sphereGeometry args={[0.09, 6, 6]} />
      </mesh>
      <mesh material={green} position={[0.86, 0.75, 2.4]}>
        <sphereGeometry args={[0.09, 6, 6]} />
      </mesh>
      <mesh material={wake} position={[0, 0.03, -7]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.6, 9]} />
      </mesh>
    </group>
  );
}

function Aircraft() {
  const COUNT = 5;
  const { geometry, material } = useLightPoints(COUNT * 2);
  const paths = useMemo(() => {
    return [
      // Helicopters circling the river.
      { kind: "heli", center: new THREE.Vector3(-30, GROUND_Y + 26, -170), rx: 70, rz: 45, speed: 0.045, phase: 0 },
      { kind: "heli", center: new THREE.Vector3(110, GROUND_Y + 34, -330), rx: 90, rz: 60, speed: -0.035, phase: 2 },
      // Airliners far out.
      { kind: "plane", from: new THREE.Vector3(-2600, 260, -2400), to: new THREE.Vector3(1400, 210, -2600), period: 140, phase: 0.1 },
      { kind: "plane", from: new THREE.Vector3(2400, 320, -1800), to: new THREE.Vector3(-900, 180, -2900), period: 170, phase: 0.6 },
      { kind: "plane", from: new THREE.Vector3(-1800, 420, -3000), to: new THREE.Vector3(2200, 480, -3100), period: 210, phase: 0.35 },
    ] as const;
  }, []);
  useMemo(() => {
    const colors = geometry.getAttribute("aColor") as THREE.BufferAttribute;
    const sizes = geometry.getAttribute("aSize") as THREE.BufferAttribute;
    const blink = geometry.getAttribute("aBlink") as THREE.BufferAttribute;
    const phase = geometry.getAttribute("aPhase") as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      // Steady white/red nav light + strobe.
      colors.setXYZ(i * 2, 4, 0.4, 0.3);
      colors.setXYZ(i * 2 + 1, 6, 6, 6.5);
      sizes.setX(i * 2, paths[i].kind === "heli" ? 0.7 : 6);
      sizes.setX(i * 2 + 1, paths[i].kind === "heli" ? 0.9 : 8);
      blink.setX(i * 2, 0);
      blink.setX(i * 2 + 1, 1.3);
      phase.setX(i * 2 + 1, i * 0.27);
    }
  }, [geometry, paths]);
  const dpr = useThree((s) => s.viewport.dpr);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    paths.forEach((p, i) => {
      let x: number, y: number, z: number;
      if (p.kind === "heli") {
        const a = t * p.speed * Math.PI * 2 + p.phase;
        x = p.center.x + Math.cos(a) * p.rx;
        z = p.center.z + Math.sin(a) * p.rz;
        y = p.center.y + Math.sin(a * 2) * 2;
      } else {
        const k = (t / p.period + p.phase) % 1;
        x = THREE.MathUtils.lerp(p.from.x, p.to.x, k);
        y = THREE.MathUtils.lerp(p.from.y, p.to.y, k);
        z = THREE.MathUtils.lerp(p.from.z, p.to.z, k);
      }
      pos.setXYZ(i * 2, x, y, z);
      pos.setXYZ(i * 2 + 1, x, y + (p.kind === "heli" ? 0.5 : 4), z);
    });
    pos.needsUpdate = true;
    material.uniforms.uTime.value = t;
    material.uniforms.uPixelRatio.value = dpr;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

export default function Traffic() {
  const ferryA = useMemo(() => {
    const to = polarToScene(136, 1.95);
    return { from: [-6, -36] as [number, number], to: [to[0] * 0.95, to[1] * 0.95] as [number, number] };
  }, []);
  const ferryB = useMemo(() => {
    const from = polarToScene(30, 1.1);
    const to = polarToScene(55, 2.4);
    return { from: [from[0] * 0.9, from[1] * 0.6] as [number, number], to: [to[0] * 0.95, to[1] * 0.95] as [number, number] };
  }, []);
  return (
    <group>
      <Highway />
      <Ferry from={ferryA.from} to={ferryA.to} period={150} offset={0.12} />
      <Ferry from={ferryB.from} to={ferryB.to} period={180} offset={0.55} />
      <Aircraft />
    </group>
  );
}
