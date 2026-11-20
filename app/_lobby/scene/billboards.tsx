"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cityBuildings } from "./city";
import { rng } from "./geo";
import { lobby, useLobby } from "../store";

// Holographic billboards hung on the skyline: original signs (his name, his
// monogram, abstract glyph columns and meters), each a canvas texture drawn
// once, shown through an additive shader with scanlines, a slow roll and a
// rare flicker. Black in a texture is transparent under additive blending, so
// the canvases glow on their own. Reduced motion holds them still.

type Design = { draw: (c: CanvasRenderingContext2D, w: number, h: number) => void; w: number; h: number };

const FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';

function neonText(c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string) {
  c.font = `900 ${size}px ${FONT}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.shadowColor = color;
  c.shadowBlur = size * 0.35;
  c.fillStyle = color;
  c.fillText(text, x, y);
  c.shadowBlur = 0;
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.font = `900 ${size * 0.96}px ${FONT}`;
  c.fillText(text, x, y);
}

function frame(c: CanvasRenderingContext2D, w: number, h: number, color: string, inset = 10) {
  c.strokeStyle = color;
  c.lineWidth = 6;
  c.shadowColor = color;
  c.shadowBlur = 18;
  const cut = Math.min(w, h) * 0.12;
  c.beginPath();
  c.moveTo(inset + cut, inset);
  c.lineTo(w - inset, inset);
  c.lineTo(w - inset, h - inset - cut);
  c.lineTo(w - inset - cut, h - inset);
  c.lineTo(inset, h - inset);
  c.lineTo(inset, inset + cut);
  c.closePath();
  c.stroke();
  c.shadowBlur = 0;
}

const DESIGNS: Design[] = [
  {
    // his name, wide
    w: 1024,
    h: 384,
    draw(c, w, h) {
      frame(c, w, h, "#ff2bd6");
      neonText(c, "SOHAM", w / 2, h * 0.46, 210, "#ff2bd6");
      c.fillStyle = "#19f3ff";
      c.shadowColor = "#19f3ff";
      c.shadowBlur = 14;
      c.fillRect(w * 0.2, h * 0.8, w * 0.6, 8);
      c.shadowBlur = 0;
    },
  },
  {
    // a tall banner of abstract glyphs
    w: 256,
    h: 1024,
    draw(c, w, h) {
      const r = rng(5);
      c.fillStyle = "#19f3ff";
      c.shadowColor = "#19f3ff";
      c.shadowBlur = 10;
      for (let row = 0; row < 11; row++) {
        const y0 = 40 + row * 88;
        for (let k = 0; k < 5; k++) {
          const x = 50 + r() * 120;
          const y = y0 + r() * 52;
          if (r() < 0.5) c.fillRect(x, y, 40 + r() * 60, 10);
          else c.fillRect(x, y, 10, 22 + r() * 34);
        }
      }
      c.shadowBlur = 0;
      frame(c, w, h, "#19f3ff", 8);
    },
  },
  {
    // monogram in a hexagon
    w: 512,
    h: 512,
    draw(c, w, h) {
      c.strokeStyle = "#ffd22e";
      c.lineWidth = 14;
      c.shadowColor = "#ffd22e";
      c.shadowBlur = 24;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = w / 2 + Math.cos(a) * 210;
        const y = h / 2 + Math.sin(a) * 210;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      c.stroke();
      c.shadowBlur = 0;
      neonText(c, "SC", w / 2, h / 2 + 8, 200, "#ffd22e");
    },
  },
  {
    // a meter: stacked bars in a gradient
    w: 768,
    h: 384,
    draw(c, w, h) {
      const r = rng(11);
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "#19f3ff");
      g.addColorStop(1, "#ff2bd6");
      c.fillStyle = g;
      for (let i = 0; i < 18; i++) {
        const bh = 40 + r() * 260;
        c.fillRect(40 + i * 38, h - 40 - bh, 24, bh);
      }
      frame(c, w, h, "#8a5bff");
    },
  },
  {
    // a plain status sign
    w: 768,
    h: 384,
    draw(c, w, h) {
      frame(c, w, h, "#19f3ff");
      neonText(c, "ONLINE", w / 2, h * 0.38, 130, "#19f3ff");
      neonText(c, "24 / 7", w / 2, h * 0.72, 90, "#ff2bd6");
    },
  },
  {
    // his trade, tall
    w: 320,
    h: 1024,
    draw(c, w, h) {
      frame(c, w, h, "#ff2bd6", 8);
      "CODE".split("").forEach((ch, i) => neonText(c, ch, w / 2, 170 + i * 230, 190, "#ff2bd6"));
    },
  },
];

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uMotion;
  uniform float uSeed;
  uniform float uGain;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 uv = vUv;
    // a rare horizontal tear
    float slot = floor(uTime * 8.0 + uSeed * 17.0);
    float tear = step(0.985, hash(slot)) * uMotion;
    uv.x += tear * (hash(floor(uv.y * 24.0) + slot) - 0.5) * 0.08;
    vec3 c = texture2D(uMap, uv).rgb;
    float scan = 0.78 + 0.22 * sin(uv.y * 520.0 - uTime * 4.0 * uMotion);
    float roll = 0.9 + 0.1 * smoothstep(0.0, 0.08, abs(fract(uv.y - uTime * 0.12 * uMotion) - 0.5));
    float flick = 1.0 - 0.55 * step(0.97, hash(slot * 1.7 + 3.0)) * uMotion;
    gl_FragColor = vec4(c * uGain * scan * roll * flick, 1.0);
  }
`;

type Sign = { pos: THREE.Vector3; yaw: number; w: number; h: number; design: number; seed: number };

function placeSigns(count: number): Sign[] {
  const { matrices } = cityBuildings();
  const r = rng(404);
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const n = new THREE.Vector3();
  const candidates = matrices
    .map((m) => {
      m.decompose(p, q, s);
      return { x: p.x, y: p.y, z: p.z, q: q.clone(), w: s.x, h: s.y, d: s.z, dist: Math.hypot(p.x, p.z) };
    })
    // Towers across the river, inside the lobby's view (about 34 degrees
    // either side of straight ahead), tall enough to clear the ones in front.
    .filter((b) => b.h > 16 && b.dist > 200 && b.dist < 520 && b.w > 5 && Math.abs(Math.atan2(b.x, -b.z)) < 0.6);
  // A stable shuffle weighted toward the taller, nearer towers.
  const picked = candidates
    .map((b) => ({ b, k: r() * 0.7 + b.dist / 520 - b.h / 60 }))
    .sort((a, b) => a.k - b.k)
    .slice(0, count)
    .map((e) => e.b);
  return picked.map((b, k) => {
    // Hang the sign on the face that looks most toward the balcony.
    const toCam = new THREE.Vector3(-b.x, 0, -b.z).normalize();
    let best = { dot: -2, normal: new THREE.Vector3(), half: 0, face: 0 };
    for (const [nx, nz, half, face] of [
      [0, 1, b.d / 2, b.w],
      [0, -1, b.d / 2, b.w],
      [1, 0, b.w / 2, b.d],
      [-1, 0, b.w / 2, b.d],
    ] as const) {
      n.set(nx, 0, nz).applyQuaternion(b.q);
      const dot = n.dot(toCam);
      if (dot > best.dot) best = { dot, normal: n.clone(), half, face };
    }
    const design = DESIGNS[k % DESIGNS.length];
    const aspect = design.w / design.h;
    // Signs are big, the way real tower billboards are: wide ones overhang
    // the face a little, tall banners run a third to half the tower.
    let w: number;
    let h: number;
    if (aspect >= 1) {
      w = Math.min(Math.max(best.face * 1.4, 18 + r() * 10), b.h * 0.9);
      h = w / aspect;
    } else {
      h = Math.min(b.h * (0.45 + r() * 0.2), 34);
      w = h * aspect;
    }
    const y = b.y + b.h * (0.66 + r() * 0.16);
    const pos = new THREE.Vector3(b.x, y, b.z).addScaledVector(best.normal, best.half + 0.12);
    return { pos, yaw: Math.atan2(best.normal.x, best.normal.z), w, h, design: k % DESIGNS.length, seed: r() };
  });
}

export default function Billboards() {
  const quality = useLobby((s) => s.quality);
  const count = quality === "high" ? 22 : 12;
  const textures = useMemo(
    () =>
      DESIGNS.map((d) => {
        const canvas = document.createElement("canvas");
        canvas.width = d.w;
        canvas.height = d.h;
        const c = canvas.getContext("2d");
        if (c) {
          c.fillStyle = "#000";
          c.fillRect(0, 0, d.w, d.h);
          d.draw(c, d.w, d.h);
        }
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      }),
    [],
  );
  const signs = useMemo(() => placeSigns(count), [count]);
  const meshes = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1);
    const list = signs.map((s) => {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: textures[s.design] },
          uTime: { value: 0 },
          uMotion: { value: 1 },
          uSeed: { value: s.seed },
          uGain: { value: 3.6 },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(plane, material);
      mesh.position.copy(s.pos);
      mesh.rotation.y = s.yaw;
      mesh.scale.set(s.w, s.h, 1);
      mesh.frustumCulled = false;
      return mesh;
    });
    return { plane, list };
  }, [signs, textures]);
  useEffect(
    () => () => {
      meshes.plane.dispose();
      meshes.list.forEach((m) => (m.material as THREE.Material).dispose());
    },
    [meshes],
  );
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  useFrame(({ clock }) => {
    const motion = lobby.get().reducedMotion ? 0 : 1;
    const t = clock.elapsedTime;
    for (const m of meshes.list) {
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      u.uTime.value = t;
      u.uMotion.value = motion;
    }
  });

  return (
    <group>
      {meshes.list.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </group>
  );
}
