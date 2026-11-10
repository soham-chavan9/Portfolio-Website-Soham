"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CITY_SCALE, landmarkPosition, rng } from "./geo";
import { createWindowMaterial } from "./shaders";

// Hand-built silhouettes of the towers you can name from the balcony.
// Built in meters, then scaled to city scale.

type Geo = THREE.BufferGeometry;

function prep(g: Geo): Geo {
  const n = g.index ? g.toNonIndexed() : g;
  n.deleteAttribute("normal");
  n.computeVertexNormals();
  if (!n.getAttribute("uv")) {
    n.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(n.getAttribute("position").count * 2), 2),
    );
  }
  return n;
}

function box(w: number, d: number, h: number, y0 = 0, x = 0, z = 0): Geo {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y0 + h / 2, z);
  return prep(g);
}

/** Square frustum: side `bottom` tapering to side `top`. */
function frustum(bottom: number, top: number, h: number, y0 = 0, x = 0, z = 0): Geo {
  const g = new THREE.CylinderGeometry(top / Math.SQRT2, bottom / Math.SQRT2, h, 4, 1);
  g.rotateY(Math.PI / 4);
  g.translate(x, y0 + h / 2, z);
  return prep(g);
}

function prism(radius: number, h: number, sides: number, y0 = 0, topRadius = radius): Geo {
  const g = new THREE.CylinderGeometry(topRadius, radius, h, sides, 1);
  g.translate(0, y0 + h / 2, 0);
  return prep(g);
}

/** One World Trade Center: square base twisting into a 45° square top. */
function oneWtcBody(y0: number, y1: number, half: number): Geo {
  const c = [
    new THREE.Vector3(half, y0, half),
    new THREE.Vector3(-half, y0, half),
    new THREE.Vector3(-half, y0, -half),
    new THREE.Vector3(half, y0, -half),
  ];
  const r = half;
  const t = [
    new THREE.Vector3(0, y1, r),
    new THREE.Vector3(-r, y1, 0),
    new THREE.Vector3(0, y1, -r),
    new THREE.Vector3(r, y1, 0),
  ];
  const tris: THREE.Vector3[][] = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    tris.push([c[i], c[j], t[i]]);
    tris.push([t[(i + 3) % 4], t[i], c[i]]);
  }
  tris.push([t[0], t[1], t[2]], [t[0], t[2], t[3]]);
  const pos: number[] = [];
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const n = new THREE.Vector3();
  const centroid = new THREE.Vector3();
  for (const tri of tris) {
    e1.subVectors(tri[1], tri[0]);
    e2.subVectors(tri[2], tri[0]);
    n.crossVectors(e1, e2);
    centroid.copy(tri[0]).add(tri[1]).add(tri[2]).divideScalar(3);
    const outward =
      centroid.y >= y1 - 0.01
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(centroid.x, 0, centroid.z);
    const ordered = n.dot(outward) >= 0 ? tri : [tri[0], tri[2], tri[1]];
    for (const v of ordered) pos.push(v.x, v.y, v.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return prep(g);
}

type Glow = { geo: Geo; color: THREE.Color; band?: number };

type Built = {
  id: string;
  body: Geo;
  glow: Glow[];
  seed: number;
  lit: number;
  style: number;
  crown: number;
  height: number;
  yaw: number;
};

const HDR = (r: number, g: number, b: number, k = 1) => new THREE.Color(r * k, g * k, b * k);

function build(): Built[] {
  const out: Built[] = [];
  const add = (
    id: string,
    body: Geo[],
    glow: Glow[],
    o: Partial<Pick<Built, "seed" | "lit" | "style" | "crown" | "yaw">> & { height: number },
  ) => {
    const merged = mergeGeometries(body, false)!;
    merged.scale(CITY_SCALE, CITY_SCALE, CITY_SCALE);
    for (const g of glow) g.geo.scale(CITY_SCALE, CITY_SCALE, CITY_SCALE);
    out.push({
      id,
      body: merged,
      glow,
      seed: o.seed ?? 0.5,
      lit: o.lit ?? 0.5,
      style: o.style ?? 3,
      crown: o.crown ?? 0,
      height: o.height * CITY_SCALE,
      yaw: o.yaw ?? -0.62,
    });
  };

  add(
    "oneWtc",
    [box(61, 61, 57), oneWtcBody(57, 417, 30.5), box(30, 30, 9, 417)],
    [
      { geo: prism(1.4, 108, 8, 426, 0.5), color: HDR(0.9, 0.95, 1, 3.2) },
      { geo: prism(5, 3, 12, 440), color: HDR(0.9, 0.95, 1, 2) },
      { geo: prism(3.6, 3, 12, 480), color: HDR(0.9, 0.95, 1, 2) },
    ],
    { seed: 0.11, lit: 0.6, style: 3, height: 541, yaw: -0.5 },
  );
  add(
    "threeWtc",
    [
      box(52, 52, 329),
      box(7, 7, 12, 329, 22, 22),
      box(7, 7, 12, 329, -22, 22),
      box(7, 7, 12, 329, 22, -22),
      box(7, 7, 12, 329, -22, -22),
    ],
    [],
    { seed: 0.31, lit: 0.62, style: 3, height: 341, yaw: -0.55 },
  );
  add("fourWtc", [box(52, 44, 240), box(44, 34, 57, 240, 3, 0)], [], {
    seed: 0.47,
    lit: 0.5,
    style: 3,
    height: 297,
    yaw: -0.4,
  });
  add("sevenWtc", [frustum(48, 46, 226)], [], {
    seed: 0.53,
    lit: 0.6,
    style: 3,
    height: 226,
    yaw: -0.7,
  });
  add(
    "woolworth",
    [box(62, 46, 100), box(32, 32, 85, 100), box(25, 25, 30, 185), frustum(22, 2, 26, 215)],
    [],
    { seed: 0.62, lit: 0.48, style: 0, crown: 1.1, height: 241, yaw: -0.62 },
  );
  {
    const parts = [box(32, 30, 150)];
    const rand = rng(56);
    for (let i = 0; i < 10; i++) {
      const w = 26 + rand() * 12;
      parts.push(
        box(w, 24 + rand() * 10, 10.5, 150 + i * 10, (rand() - 0.5) * 12, (rand() - 0.5) * 12),
      );
    }
    add("leonard", parts, [], { seed: 0.71, lit: 0.6, style: 3, height: 250, yaw: -0.3 });
  }
  add("spruce", [box(42, 30, 200), box(36, 26, 40, 200), box(28, 20, 25, 240)], [], {
    seed: 0.77,
    lit: 0.46,
    style: 0,
    height: 265,
    yaw: -0.62,
  });
  {
    const dome = new THREE.SphereGeometry(14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.translate(36, 156, -40);
    const vault = new THREE.CylinderGeometry(14, 14, 60, 16, 1, false, 0, Math.PI);
    vault.rotateZ(Math.PI / 2);
    vault.translate(-5, 0, 60);
    add(
      "brookfield",
      [
        box(40, 40, 176, 0, -32, 30),
        frustum(26, 2, 22, 176, -32, 30),
        box(42, 42, 200, 0, 22, 18),
        box(36, 36, 12, 200, 22, 18),
        box(40, 40, 182, 0, -18, -36),
        box(32, 32, 10, 182, -18, -36),
        box(38, 38, 156, 0, 36, -40),
      ],
      [
        { geo: prep(dome), color: HDR(1, 0.8, 0.45, 1.6) },
        { geo: prep(vault), color: HDR(1, 0.82, 0.55, 2.2) },
      ],
      { seed: 0.83, lit: 0.55, style: 3, height: 225, yaw: -0.55 },
    );
  }
  add(
    "empire",
    [box(100, 60, 24), box(70, 50, 61, 24), box(50, 38, 235, 85)],
    [
      { geo: box(42, 31, 15, 320), color: HDR(1, 1, 1, 2.6), band: 0 },
      { geo: box(34, 25, 15, 335), color: HDR(1, 1, 1, 2.6), band: 1 },
      { geo: box(26, 19, 15, 350), color: HDR(1, 1, 1, 2.6), band: 2 },
      { geo: prism(9, 16, 8, 365, 7), color: HDR(1, 1, 1, 3.4), band: 2 },
      { geo: prism(3.5, 62, 8, 381, 0.6), color: HDR(1, 0.95, 0.9, 2.4) },
    ],
    { seed: 0.17, lit: 0.55, style: 0, height: 443, yaw: -0.7 },
  );
  add(
    "chrysler",
    [box(42, 42, 240)],
    [
      { geo: frustum(30, 24, 12, 240), color: HDR(0.9, 0.95, 1, 2.2) },
      { geo: frustum(24, 18, 12, 252), color: HDR(0.9, 0.95, 1, 2.6) },
      { geo: frustum(18, 12, 12, 264), color: HDR(0.9, 0.95, 1, 3) },
      { geo: frustum(12, 6, 10, 276), color: HDR(0.9, 0.95, 1, 3.4) },
      { geo: frustum(5, 0.5, 33, 286), color: HDR(0.9, 0.95, 1, 3.4) },
    ],
    { seed: 0.23, lit: 0.45, style: 0, height: 319, yaw: -0.7 },
  );
  add(
    "vanderbilt",
    [frustum(52, 34, 380)],
    [{ geo: frustum(34, 6, 47, 380), color: HDR(0.85, 0.92, 1, 2.6) }],
    { seed: 0.29, lit: 0.62, style: 3, height: 427, yaw: -0.7 },
  );
  add(
    "hudsonYards",
    [box(52, 42, 330), frustum(46, 30, 32, 330), box(34, 6, 4, 334, 30, 0)],
    [{ geo: box(34, 6, 1.2, 338, 30, 0), color: HDR(0.5, 0.75, 1, 2.6) }],
    { seed: 0.37, lit: 0.6, style: 3, height: 387, yaw: -0.85 },
  );
  add("parkAve", [box(28, 28, 426)], [], {
    seed: 0.41,
    lit: 0.36,
    style: 1,
    height: 426,
    yaw: -0.7,
  });
  add("cpt", [box(46, 34, 472), box(20, 34, 300, 0, 30, 0)], [], {
    seed: 0.59,
    lit: 0.42,
    style: 3,
    height: 472,
    yaw: -0.7,
  });
  add(
    "brooklyn",
    [prism(24, 300, 6)],
    [{ geo: prism(24, 25, 6, 300, 8), color: HDR(1, 0.62, 0.3, 1.8) }],
    { seed: 0.67, lit: 0.42, style: 3, height: 325, yaw: 0.2 },
  );
  return out;
}

// Empire State light shows, cycled every ~24 seconds.
const SHOWS: [number, number, number][][] = [
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  [[1, 0.18, 0.15], [1, 1, 1], [0.25, 0.45, 1]],
  [[1, 0.55, 0.12], [1, 0.55, 0.12], [1, 0.75, 0.3]],
  [[0.55, 0.25, 1], [0.55, 0.25, 1], [1, 1, 1]],
  [[0.2, 0.85, 0.6], [0.2, 0.85, 0.6], [1, 1, 1]],
];

export default function Landmarks() {
  const items = useMemo(
    () =>
      build().map((b) => ({
        ...b,
        position: landmarkPosition(b.id),
        material: createWindowMaterial({
          seed: b.seed,
          lit: b.lit,
          style: b.style,
          crown: b.crown,
          height: b.height,
        }),
        glowMats: b.glow.map(
          (g) => new THREE.MeshBasicMaterial({ color: g.color.clone(), toneMapped: false }),
        ),
      })),
    [],
  );

  useEffect(
    () => () => {
      for (const i of items) {
        i.body.dispose();
        i.material.dispose();
        i.glow.forEach((g) => g.geo.dispose());
        i.glowMats.forEach((m) => m.dispose());
      }
    },
    [items],
  );

  const empire = items.find((i) => i.id === "empire")!;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (const i of items) i.material.uniforms.uTime.value = t;
    const k = (t / 24) % SHOWS.length;
    const a = SHOWS[Math.floor(k)];
    const b = SHOWS[(Math.floor(k) + 1) % SHOWS.length];
    const blend = THREE.MathUtils.smoothstep(k % 1, 0.9, 1);
    empire.glow.forEach((g, gi) => {
      if (g.band === undefined) return;
      const ca = a[g.band];
      const cb = b[g.band];
      const boost = gi === 3 ? 3.4 : 2.6;
      empire.glowMats[gi].color.setRGB(
        THREE.MathUtils.lerp(ca[0], cb[0], blend) * boost,
        THREE.MathUtils.lerp(ca[1], cb[1], blend) * boost,
        THREE.MathUtils.lerp(ca[2], cb[2], blend) * boost,
      );
    });
  });

  return (
    <group>
      {items.map((i) => (
        <group key={i.id} position={i.position} rotation-y={i.yaw}>
          <mesh geometry={i.body} material={i.material} frustumCulled={false} />
          {i.glow.map((g, gi) => (
            <mesh key={gi} geometry={g.geo} material={i.glowMats[gi]} frustumCulled={false} />
          ))}
        </group>
      ))}
    </group>
  );
}
