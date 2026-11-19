"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { skillLogos } from "@/app/skill-logos";
import { resume } from "@/content/resume";
import { selectSkill } from "../actions";
import { globeTag, grab, lobby, useLobby } from "../store";

// The Skills screen's hologram: every resume skill as a logo tile on a sphere
// that stands beside the operator, projected up from a disc on the balcony
// floor. Skills are laid out in resume order on a Fibonacci spiral, so each
// group forms its own band. Drag spins it; hover names a tile; a click (or a
// tile in the panel) turns that skill to the front.

/** World position of the globe's centre: beside the operator, toward the camera's right. */
export const GLOBE_CENTER = new THREE.Vector3(0.34, 1.5, -2.92);
const RADIUS = 0.44;
/** Tile height in metres. */
const TILE = 0.1;
const SIGNAL = new THREE.Color("#7fd1ff");
const UP = new THREE.Vector3(0, 1, 0);

type SkillNode = {
  name: string;
  group: string;
  groupId: string;
  dir: THREE.Vector3;
  srcs: string[];
};

function layout(): SkillNode[] {
  const items = resume.skills.flatMap((g) => g.items.map((name) => ({ name, group: g.label, groupId: g.id })));
  const n = items.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  return items.map((item, i) => {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    return { ...item, dir: new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), srcs: skillLogos(item.name) };
  });
}

/** A dark rounded tile with the skill's logo(s), drawn once into a canvas texture. */
function tileTexture(srcs: string[]) {
  const H = 128;
  const W = srcs.length > 1 ? 128 + (srcs.length - 1) * 76 : 128;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const ctx = canvas.getContext("2d");
  const paint = (imgs: HTMLImageElement[]) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    ctx.roundRect(4, 4, W - 8, H - 8, 26);
    ctx.fillStyle = "rgba(14, 19, 30, 0.92)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(127, 209, 255, 0.42)";
    ctx.stroke();
    imgs.forEach((img, i) => {
      const box = 64;
      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
      const w = ratio >= 1 ? box : box * ratio;
      const h = ratio >= 1 ? box / ratio : box;
      const cx = 64 + i * 76;
      ctx.drawImage(img, cx - w / 2, H / 2 - h / 2, w, h);
    });
    tex.needsUpdate = true;
  };
  paint([]);
  Promise.all(
    srcs.map(
      (src) =>
        new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        }),
    ),
  ).then((imgs) => paint(imgs.filter((x): x is HTMLImageElement => x !== null)));
  return { tex, aspect: W / H };
}

/** Latitude and longitude lines of the shell. */
function shellGeometry() {
  const pts: number[] = [];
  const seg = 64;
  for (const lat of [-0.7, -0.35, 0, 0.35, 0.7]) {
    const y = Math.sin(lat * (Math.PI / 2)) * RADIUS;
    const r = Math.cos(lat * (Math.PI / 2)) * RADIUS;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      pts.push(Math.cos(a0) * r, y, Math.sin(a0) * r, Math.cos(a1) * r, y, Math.sin(a1) * r);
    }
  }
  for (let m = 0; m < 8; m++) {
    const a = (m / 8) * Math.PI;
    for (let i = 0; i < seg; i++) {
      const t0 = (i / seg) * Math.PI * 2;
      const t1 = ((i + 1) / seg) * Math.PI * 2;
      const p = (t: number) => [Math.cos(a) * Math.cos(t) * RADIUS, Math.sin(t) * RADIUS, Math.sin(a) * Math.cos(t) * RADIUS];
      pts.push(...p(t0), ...p(t1));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/** A ring with tick marks every few degrees, like an instrument bezel. */
function ringGeometry(radius: number, ticks: number) {
  const pts: number[] = [];
  const seg = 96;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    pts.push(Math.cos(a0) * radius, 0, Math.sin(a0) * radius, Math.cos(a1) * radius, 0, Math.sin(a1) * radius);
  }
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    const r2 = radius * (i % 4 === 0 ? 1.07 : 1.035);
    pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius, Math.cos(a) * r2, 0, Math.sin(a) * r2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/** One path per skill group through its tiles, in resume order. */
function linkGeometry(nodes: SkillNode[], groupId: string) {
  const dirs = nodes.filter((n) => n.groupId === groupId).map((n) => n.dir);
  const pts: number[] = [];
  for (let i = 0; i < dirs.length - 1; i++) {
    const a = dirs[i].clone().multiplyScalar(RADIUS);
    const b = dirs[i + 1].clone().multiplyScalar(RADIUS);
    pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

const lineMat = (opacity: number) =>
  new THREE.LineBasicMaterial({
    color: SIGNAL,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });

function Globe() {
  const nodes = useMemo(layout, []);
  const tiles = useMemo(() => nodes.map((n) => tileTexture(n.srcs)), [nodes]);
  const shell = useMemo(shellGeometry, []);
  const ringA = useMemo(() => ringGeometry(RADIUS * 1.22, 72), []);
  const ringB = useMemo(() => ringGeometry(RADIUS * 1.36, 48), []);
  const scanRing = useMemo(() => ringGeometry(RADIUS, 0), []);
  const groups = useMemo(() => resume.skills.map((g) => g.id), []);
  const links = useMemo(() => groups.map((id) => linkGeometry(nodes, id)), [groups, nodes]);
  const mats = useMemo(
    () => ({
      shell: lineMat(0.14),
      ring: lineMat(0.32),
      links: groups.map(() => lineMat(0.2)),
      scan: lineMat(0.5),
      beam: new THREE.MeshBasicMaterial({
        color: SIGNAL,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
      core: new THREE.MeshBasicMaterial({ color: SIGNAL.clone().multiplyScalar(2.2), toneMapped: false }),
      tiles: tiles.map(
        (t) =>
          new THREE.MeshBasicMaterial({
            map: t.tex,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
            side: THREE.DoubleSide,
          }),
      ),
      plane: new THREE.PlaneGeometry(1, 1),
    }),
    [groups, tiles],
  );
  useEffect(
    () => () => {
      shell.dispose();
      ringA.dispose();
      ringB.dispose();
      scanRing.dispose();
      links.forEach((g) => g.dispose());
      tiles.forEach((t) => t.tex.dispose());
      mats.shell.dispose();
      mats.ring.dispose();
      mats.scan.dispose();
      mats.beam.dispose();
      mats.core.dispose();
      mats.links.forEach((m) => m.dispose());
      mats.tiles.forEach((m) => m.dispose());
      mats.plane.dispose();
    },
    [shell, ringA, ringB, scanRing, links, tiles, mats],
  );

  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const ringARef = useRef<THREE.LineSegments>(null);
  const ringBRef = useRef<THREE.LineSegments>(null);
  const scanRef = useRef<THREE.LineSegments>(null);
  const cards = useRef<(THREE.Mesh | null)[]>([]);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const hoverRef = useRef<number | null>(null);

  const st = useRef({
    shown: 0,
    vel: new THREE.Vector2(),
    dragging: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    moved: 0,
    idleAt: 0,
  });
  const tmp = useMemo(
    () => ({
      q: new THREE.Quaternion(),
      target: new THREE.Quaternion(),
      toCam: new THREE.Vector3(),
      right: new THREE.Vector3(),
      local: new THREE.Vector3(),
      world: new THREE.Vector3(),
      face: new THREE.Quaternion(),
    }),
    [],
  );

  // Drag to spin. The globe takes the pointer before the camera rig does, so
  // dragging the hologram never also swings the camera.
  useEffect(() => {
    const s = st.current;
    const move = (e: PointerEvent) => {
      if (!s.dragging || e.pointerId !== s.pointerId) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.moved += Math.abs(dx) + Math.abs(dy);
      s.vel.set(dx, dy);
      const g = spin.current;
      if (!g) return;
      tmp.right.setFromMatrixColumn(camera.matrixWorld, 0);
      g.quaternion.premultiply(tmp.q.setFromAxisAngle(UP, dx * 0.009));
      g.quaternion.premultiply(tmp.q.setFromAxisAngle(tmp.right, dy * 0.009));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== s.pointerId) return;
      s.dragging = false;
      grab.globe = false;
      s.idleAt = performance.now();
      gl.domElement.style.cursor = "";
    };
    const release = () => {
      s.dragging = false;
      grab.globe = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", release);
      release();
    };
  }, [camera, gl, tmp]);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    const s = st.current;
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    s.dragging = true;
    grab.globe = true;
    s.pointerId = e.pointerId;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.moved = 0;
    s.vel.set(0, 0);
    gl.domElement.style.cursor = "grabbing";
  };

  useFrame((state, delta) => {
    const s = st.current;
    const L = lobby.get();
    const dt = Math.min(delta, 0.05);
    const reduced = L.reducedMotion;
    const want = L.phase === "lobby" && L.screen === "skills" ? 1 : 0;
    s.shown = reduced ? want : THREE.MathUtils.damp(s.shown, want, want ? 3.2 : 6, dt);
    const g = root.current;
    const sp = spin.current;
    if (!g || !sp) return;
    g.visible = s.shown > 0.002;
    if (!g.visible) {
      globeTag.on = false;
      return;
    }
    const e = 1 - Math.pow(1 - s.shown, 3);
    g.scale.setScalar(0.6 + 0.4 * e);

    tmp.toCam.subVectors(camera.position, GLOBE_CENTER).normalize();

    // Turn a picked skill to the front; otherwise coast, then drift slowly.
    const picked = nodes.findIndex((n) => n.name === L.skill);
    if (!s.dragging) {
      if (picked >= 0) {
        tmp.target.setFromUnitVectors(nodes[picked].dir, tmp.toCam);
        sp.quaternion.slerp(tmp.target, 1 - Math.exp(-(reduced ? 30 : 5) * dt));
        s.vel.set(0, 0);
      } else if (s.vel.lengthSq() > 0.01 && !reduced) {
        tmp.right.setFromMatrixColumn(camera.matrixWorld, 0);
        sp.quaternion.premultiply(tmp.q.setFromAxisAngle(UP, s.vel.x * 0.009));
        sp.quaternion.premultiply(tmp.q.setFromAxisAngle(tmp.right, s.vel.y * 0.009));
        s.vel.multiplyScalar(Math.exp(-3.5 * dt));
      } else if (!reduced && performance.now() - s.idleAt > 2500) {
        sp.quaternion.premultiply(tmp.q.setFromAxisAngle(UP, 0.16 * dt));
      }
    }

    // Tiles always face the camera; those on the far side fade back, so the
    // front reads first.
    const hot = L.skillHover ?? L.skill;
    tmp.face.copy(sp.quaternion).invert().multiply(camera.quaternion);
    cards.current.forEach((spr, i) => {
      if (!spr) return;
      spr.quaternion.copy(tmp.face);
      spr.getWorldPosition(tmp.world);
      tmp.local.subVectors(tmp.world, GLOBE_CENTER).normalize();
      const facing = tmp.local.dot(tmp.toCam);
      const front = THREE.MathUtils.smoothstep(facing, -0.45, 0.55);
      const on = nodes[i].name === hot || i === hoverRef.current;
      const mat = spr.material as THREE.MeshBasicMaterial;
      mat.opacity = e * (on ? 1 : 0.16 + 0.84 * front);
      const size = TILE * (on ? 1.45 : 0.82 + 0.18 * front);
      spr.scale.set(size * tiles[i].aspect, size, 1);
      spr.renderOrder = on ? 20 : Math.round(10 + front * 5);
    });

    // The picked or hovered skill's group path lights up.
    const hotGroup = nodes.find((n) => n.name === hot)?.groupId;
    groups.forEach((id, i) => {
      const target = (hotGroup ? (id === hotGroup ? 0.75 : 0.08) : 0.2) * e;
      mats.links[i].opacity = THREE.MathUtils.damp(mats.links[i].opacity, target, 8, dt);
    });
    mats.shell.opacity = 0.14 * e;
    mats.ring.opacity = 0.32 * e;
    mats.beam.opacity = 0.05 * e;

    // Hand the label's screen position to the HUD (a plain DOM element).
    const label = hoverRef.current ?? nodes.findIndex((n) => n.name === hot);
    const card = label >= 0 ? cards.current[label] : null;
    if (card && e > 0.5) {
      card.getWorldPosition(tmp.world).project(camera);
      const r = gl.domElement.getBoundingClientRect();
      globeTag.x = ((tmp.world.x + 1) / 2) * r.width;
      globeTag.y = ((1 - tmp.world.y) / 2) * r.height;
      globeTag.on = tmp.world.z < 1;
      globeTag.name = nodes[label].name;
      globeTag.group = nodes[label].group;
    } else {
      globeTag.on = false;
    }

    const t = state.clock.elapsedTime;
    if (!reduced) {
      if (ringARef.current) ringARef.current.rotation.y = t * 0.12;
      if (ringBRef.current) ringBRef.current.rotation.y = -t * 0.08;
    }
    const scan = scanRef.current;
    if (scan) {
      scan.visible = !reduced;
      const y = Math.sin(t * 0.9) * RADIUS * 0.92;
      const r = Math.sqrt(Math.max(0, RADIUS * RADIUS - y * y)) / RADIUS;
      scan.position.y = y;
      scan.scale.set(r, 1, r);
      mats.scan.opacity = 0.45 * e;
    }
  });

  const beamHeight = GLOBE_CENTER.y - RADIUS * 0.7;
  return (
    <group ref={root} position={GLOBE_CENTER} visible={false}>
      {/* Projector: a disc on the floor and a faint cone up to the globe. */}
      <group position={[0, -GLOBE_CENTER.y + 0.012, 0]}>
        <lineSegments geometry={ringA} material={mats.ring} scale={0.32} />
        <mesh position={[0, beamHeight / 2, 0]} material={mats.beam}>
          <cylinderGeometry args={[RADIUS * 0.55, 0.1, beamHeight, 40, 1, true]} />
        </mesh>
      </group>
      <mesh material={mats.core}>
        <sphereGeometry args={[0.035, 20, 14]} />
      </mesh>
      <lineSegments ref={ringARef} geometry={ringA} material={mats.ring} rotation={[0.32, 0, 0.18]} />
      <lineSegments ref={ringBRef} geometry={ringB} material={mats.ring} rotation={[-0.42, 0, -0.1]} />
      <lineSegments ref={scanRef} geometry={scanRing} material={mats.scan} />
      <group ref={spin} onPointerDown={onDown}>
        <lineSegments geometry={shell} material={mats.shell} />
        {links.map((geo, i) => (
          <lineSegments key={groups[i]} geometry={geo} material={mats.links[i]} />
        ))}
        {nodes.map((n, i) => (
          <mesh
            key={n.name}
            ref={(el) => {
              cards.current[i] = el;
            }}
            geometry={mats.plane}
            material={mats.tiles[i]}
            position={n.dir.clone().multiplyScalar(RADIUS)}
            onPointerOver={(e) => {
              e.stopPropagation();
              hoverRef.current = i;
              lobby.set({ skillHover: n.name });
              gl.domElement.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              if (hoverRef.current === i) hoverRef.current = null;
              if (lobby.get().skillHover === n.name) lobby.set({ skillHover: null });
              if (!st.current.dragging) gl.domElement.style.cursor = "";
            }}
            onClick={(e) => {
              e.stopPropagation();
              // A drag that ends on a tile is a spin, not a pick.
              if (st.current.moved > 6) return;
              selectSkill(n.name);
            }}
          />
        ))}
        {/* Invisible shell: grabbing the globe anywhere spins it. */}
        <mesh>
          <sphereGeometry args={[RADIUS * 1.08, 24, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Loads nothing until the Skills screen is first opened. */
export default function SkillsGlobe() {
  const onSkills = useLobby((s) => s.screen === "skills");
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (onSkills) setArmed(true);
  }, [onSkills]);
  return armed ? <Globe /> : null;
}
