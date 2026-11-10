"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { landmarks } from "@/content/lobby";
import {
  CITY_SCALE,
  GROUND_Y,
  landmarkPosition,
  landmarkTop,
  manhattanShore,
  polarToScene,
  rng,
} from "./geo";
import Landmarks from "./landmarks";
import {
  createGroundMaterial,
  createLightPointsMaterial,
  createWindowMaterial,
} from "./shaders";

type Region = {
  bearing: [number, number];
  km: [number, number];
  count: number;
  height: [number, number];
  width: [number, number];
  skew: number;
  lit?: [number, number];
  yawJitter?: number;
};

// Neighbourhoods as seen from Newport, south to north.
const REGIONS: Region[] = [
  { bearing: [126, 152], km: [1.95, 3.1], count: 95, height: [70, 290], width: [24, 52], skew: 1.5, yawJitter: 0.5 },
  { bearing: [131, 150], km: [1.78, 2.1], count: 24, height: [50, 150], width: [24, 44], skew: 1.6 },
  { bearing: [100, 128], km: [1.55, 2.9], count: 120, height: [18, 100], width: [18, 44], skew: 2.4 },
  { bearing: [80, 104], km: [1.5, 3.2], count: 95, height: [15, 85], width: [15, 40], skew: 2.4 },
  { bearing: [58, 82], km: [1.95, 3.7], count: 85, height: [18, 130], width: [18, 46], skew: 2.1 },
  { bearing: [37, 50], km: [3.3, 4.4], count: 16, height: [110, 330], width: [28, 54], skew: 1.1 },
  { bearing: [43, 73], km: [3.9, 6.8], count: 165, height: [60, 310], width: [22, 56], skew: 1.45, lit: [0.25, 0.7] },
  { bearing: [126, 147], km: [4.2, 6.2], count: 50, height: [40, 250], width: [24, 50], skew: 1.7 },
  { bearing: [66, 128], km: [5.6, 9.5], count: 95, height: [25, 175], width: [25, 60], skew: 2.3, lit: [0.1, 0.4] },
  { bearing: [20, 44], km: [4.5, 8], count: 55, height: [30, 210], width: [20, 50], skew: 1.9 },
];

// Jersey City neighbours framing the edges of the view: [scene angle°, radius, height m, width m].
const JERSEY: [number, number, number, number][] = [
  [33, 150, 270, 40],
  [36.5, 118, 205, 34],
  [40, 96, 232, 38],
  [45, 76, 160, 30],
  [51, 62, 182, 34],
  [57, 70, 140, 30],
  [-40, 46, 150, 30],
  [-47, 32, 140, 28],
  [-55, 52, 172, 32],
  [-36, 92, 118, 30],
  [-62, 40, 120, 26],
];

function shoreKm(bearing: number) {
  const s = manhattanShore;
  if (bearing >= s[0][0]) return s[0][1];
  for (let i = 0; i < s.length - 1; i++) {
    const [b0, k0] = s[i];
    const [b1, k1] = s[i + 1];
    if (bearing <= b0 && bearing >= b1) {
      return k0 + ((bearing - b0) / (b1 - b0)) * (k1 - k0);
    }
  }
  return s[s.length - 1][1];
}

type Generated = {
  matrices: THREE.Matrix4[];
  data: number[];
  beacons: number[];
};

function generate(): Generated {
  const rand = rng(1347);
  const matrices: THREE.Matrix4[] = [];
  const data: number[] = [];
  const beacons: number[] = [];
  const avoid = Object.keys(landmarks).map((id) => {
    const [x, , z] = landmarkPosition(id);
    return { x, z, h: landmarks[id].height };
  });

  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);

  const push = (x: number, z: number, hM: number, wM: number, dM: number, yaw: number, lit: number, style: number, crown: number) => {
    const m = new THREE.Matrix4();
    q.setFromAxisAngle(up, yaw);
    m.compose(
      new THREE.Vector3(x, GROUND_Y, z),
      q,
      new THREE.Vector3(wM * CITY_SCALE, hM * CITY_SCALE, dM * CITY_SCALE),
    );
    matrices.push(m);
    data.push(rand(), lit, style, crown);
    if (hM > 150) {
      const top = GROUND_Y + hM * CITY_SCALE + 0.4;
      beacons.push(x, top, z);
    }
  };

  for (const r of REGIONS) {
    let placed = 0;
    let guard = 0;
    while (placed < r.count && guard++ < r.count * 8) {
      const bearing = r.bearing[0] + rand() * (r.bearing[1] - r.bearing[0]);
      const km = r.km[0] + rand() * (r.km[1] - r.km[0]);
      if (bearing < 158 && km < shoreKm(bearing) + 0.06) continue;
      const [x, z] = polarToScene(bearing, km);
      const hM = r.height[0] + (r.height[1] - r.height[0]) * Math.pow(rand(), r.skew);
      if (avoid.some((a) => Math.hypot(a.x - x, a.z - z) < 13 && hM > a.h * 0.35)) continue;
      const wM = r.width[0] + rand() * (r.width[1] - r.width[0]);
      const dM = wM * (0.7 + rand() * 0.6);
      const yaw = -0.72 + (rand() - 0.5) * (r.yawJitter ?? 0.16);
      const litRange = r.lit ?? [0.12, 0.55];
      const lit = litRange[0] + rand() * (litRange[1] - litRange[0]);
      const sr = rand();
      const style = sr < 0.34 ? 0 : sr < 0.44 ? 1 : sr < 0.62 ? 2 : 3;
      const crown = hM > 140 && rand() < 0.16 ? 1 + Math.floor(rand() * 5) / 10 : 0;
      push(x, z, hM, wM, dM, yaw, lit, style, crown);
      placed++;
    }
  }

  for (const [deg, radius, hM, wM] of JERSEY) {
    const th = (deg * Math.PI) / 180;
    const x = radius * Math.sin(th);
    const z = -radius * Math.cos(th);
    push(x, z, hM, wM, wM * 0.85, 0.15 + rand() * 0.3, 0.12 + rand() * 0.18, rand() < 0.5 ? 0 : 1, 0);
  }

  return { matrices, data, beacons };
}

function shoreScenePoints() {
  return manhattanShore.map(([b, km]) => polarToScene(b, km));
}

function polygonGeometry(points: [number, number][], y: number) {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

function Buildings() {
  const { matrices, data, beacons } = useMemo(generate, []);
  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const material = useMemo(() => createWindowMaterial(), []);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
    geometry.setAttribute("aData", new THREE.InstancedBufferAttribute(new Float32Array(data), 4));
    m.frustumCulled = false;
    return m;
  }, [geometry, material, matrices, data]);

  const lights = useMemo(() => {
    const pts: number[] = [...beacons];
    for (const id of Object.keys(landmarks)) {
      const [x, y, z] = landmarkTop(id);
      pts.push(x, y + 0.6, z);
    }
    const n = pts.length / 3;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const colors: number[] = [];
    const sizes: number[] = [];
    const phases: number[] = [];
    const blink: number[] = [];
    const r = rng(77);
    for (let i = 0; i < n; i++) {
      const isLandmark = i >= beacons.length / 3;
      colors.push(isLandmark ? 9 : 6, isLandmark ? 1.2 : 0.5, isLandmark ? 0.9 : 0.35);
      sizes.push(isLandmark ? 1.4 : 0.9);
      phases.push(r());
      blink.push(isLandmark ? 2.2 : 2.6 + r());
    }
    g.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
    g.setAttribute("aBlink", new THREE.Float32BufferAttribute(blink, 1));
    return g;
  }, [beacons]);
  const lightsMat = useMemo(() => createLightPointsMaterial(), []);
  const dpr = useThree((s) => s.viewport.dpr);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      lights.dispose();
      lightsMat.dispose();
      mesh.dispose();
    },
    [geometry, material, lights, lightsMat, mesh],
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    lightsMat.uniforms.uTime.value = clock.elapsedTime;
    lightsMat.uniforms.uPixelRatio.value = dpr;
  });

  return (
    <>
      <primitive object={mesh} />
      <points geometry={lights} material={lightsMat} frustumCulled={false} />
    </>
  );
}

function Ground() {
  const { manhattan, jersey, piers, esplanade } = useMemo(() => {
    const shore = shoreScenePoints();
    const far: [number, number][] = [
      polarToScene(14, 13),
      polarToScene(60, 16),
      polarToScene(110, 16),
      polarToScene(150, 13),
      polarToScene(166, 7),
      polarToScene(160, 4.6),
      polarToScene(154, 3.85),
    ];
    const manhattan = polygonGeometry([...shore, ...far], GROUND_Y + 0.6);

    const jersey = polygonGeometry(
      [
        [-900, -6],
        [-80, -14],
        [0, -20],
        [45, -32],
        [70, -84],
        [86, -140],
        [112, -186],
        [165, -192],
        [250, -150],
        [900, -110],
        [900, 600],
        [-900, 600],
      ],
      GROUND_Y + 0.6,
    );

    // Pier 40 and Chelsea Piers reaching into the river.
    const piers: { x: number; z: number; yaw: number; w: number; d: number; h: number }[] = [];
    const addPier = (bearing: number, km: number, w: number, d: number, h: number) => {
      const [x, z] = polarToScene(bearing, km);
      piers.push({ x, z, yaw: Math.atan2(x, z), w, d, h });
    };
    addPier(97, 1.33, 38, 40, 2.4);
    addPier(66.5, 1.98, 7, 48, 2.4);
    addPier(64.8, 2.04, 7, 48, 2.4);
    addPier(63.1, 2.1, 7, 48, 2.4);

    // Esplanade lamps along the Manhattan waterfront.
    const pts: number[] = [];
    const curve = new THREE.CatmullRomCurve3(
      shore.map(([x, z]) => new THREE.Vector3(x, GROUND_Y + 1.4, z)),
    );
    const count = 520;
    for (let i = 0; i < count; i++) {
      const p = curve.getPointAt(i / (count - 1));
      pts.push(p.x * 1.004, p.y, p.z * 1.004);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const r = rng(9);
    for (let i = 0; i < count; i++) {
      const k = 1.2 + r() * 1.4;
      colors.set([k * 1, k * 0.62, k * 0.32], i * 3);
      sizes[i] = 0.45;
    }
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute("aBlink", new THREE.BufferAttribute(new Float32Array(count), 1));

    return { manhattan, jersey, piers, esplanade: g };
  }, []);

  const groundMat = useMemo(() => {
    const m = createGroundMaterial(2.39, [56, 16]);
    m.side = THREE.DoubleSide;
    return m;
  }, []);
  const jerseyMat = useMemo(() => {
    const m = createGroundMaterial(0.3, [90, 60], 0.18);
    m.side = THREE.DoubleSide;
    return m;
  }, []);
  const pierMat = useMemo(
    () => createWindowMaterial({ seed: 0.9, lit: 0.18, style: 0, height: 3, intensity: 0.6 }),
    [],
  );
  const pierGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const lampMat = useMemo(() => createLightPointsMaterial(), []);
  const dpr = useThree((s) => s.viewport.dpr);

  useEffect(
    () => () => {
      manhattan.dispose();
      jersey.dispose();
      esplanade.dispose();
      groundMat.dispose();
      jerseyMat.dispose();
      pierMat.dispose();
      pierGeo.dispose();
      lampMat.dispose();
    },
    [manhattan, jersey, esplanade, groundMat, jerseyMat, pierMat, pierGeo, lampMat],
  );

  useFrame(({ clock }) => {
    pierMat.uniforms.uTime.value = clock.elapsedTime;
    lampMat.uniforms.uPixelRatio.value = dpr;
  });

  return (
    <>
      <mesh geometry={manhattan} material={groundMat} frustumCulled={false} />
      <mesh geometry={jersey} material={jerseyMat} frustumCulled={false} />
      {piers.map((p, i) => (
        <mesh
          key={i}
          geometry={pierGeo}
          material={pierMat}
          position={[p.x, GROUND_Y, p.z]}
          rotation-y={p.yaw}
          scale={[p.w, p.h, p.d]}
        />
      ))}
      <points geometry={esplanade} material={lampMat} frustumCulled={false} />
    </>
  );
}

export default function City() {
  return (
    <group>
      <Ground />
      <Buildings />
      <Landmarks />
    </group>
  );
}

export { shoreScenePoints };
