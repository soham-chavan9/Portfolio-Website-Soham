"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ScreenId } from "@/content/lobby";
import { lobby, pointer } from "../store";
import { landmarkTop } from "./geo";
import { frameMarker, markerById } from "./targets";

type Shot = { pos: THREE.Vector3; look: THREE.Vector3; fov: number };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const HEAD = V(-0.55, 1.62, -2.5);

const TITLE: Shot = { pos: V(8, 0.6, -27), look: V(-0.3, -2.2, -2.5), fov: 36 };

function midtown() {
  const a = V(...landmarkTop("empire"));
  const b = V(...landmarkTop("vanderbilt"));
  return a.add(b).multiplyScalar(0.5).add(V(0, -18, 0));
}

const SHOTS: Record<ScreenId, Shot> = {
  lobby: { pos: V(0.85, 1.58, 2.7), look: V(0.55, 1.3, -8), fov: 40 },
  missions: { pos: V(-2.15, 1.52, -1.75), look: V(...landmarkTop("oneWtc")).add(V(0, -30, 0)), fov: 26 },
  arsenal: { pos: V(-1.0, 1.62, -2.1), look: midtown(), fov: 22 },
  loadout: { pos: V(-0.25, 1.32, 0.95), look: V(-0.55, 1.08, -2.5), fov: 36 },
  career: { pos: V(5.4, 2.05, 3.3), look: V(-2.6, 1.1, -5.5), fov: 46 },
  intel: { pos: V(0.9, 1.55, 0.35), look: V(-0.55, 1.2, -2.5), fov: 34 },
};

const FOCUS_FOV: Partial<Record<ScreenId, number>> = { career: 24 };

// Drone fly-in: from over the Hudson, up over the rail, round behind the operator.
const INTRO = new THREE.CatmullRomCurve3([
  TITLE.pos.clone(),
  V(6.4, 2.8, -15),
  V(4.7, 2.5, -6.2),
  V(3.3, 1.95, -0.8),
  SHOTS.lobby.pos.clone(),
]);
const INTRO_SECONDS = 5.6;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  const cur = useRef({
    pos: TITLE.pos.clone(),
    look: TITLE.look.clone(),
    fov: TITLE.fov,
    shiftX: 0,
    shiftY: 0,
    intro: -1,
    orbit: 0,
    orbitPitch: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });
  const tmp = useMemo(
    () => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), right: new THREE.Vector3(), fwd: new THREE.Vector3() }),
    [],
  );

  // Drag to look around, like rotating the lobby camera on a controller.
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (lobby.get().phase !== "lobby") return;
      cur.current.dragging = true;
      cur.current.lastX = e.clientX;
      cur.current.lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      const c = cur.current;
      if (!c.dragging) return;
      c.orbit = THREE.MathUtils.clamp(c.orbit - (e.clientX - c.lastX) * 0.004, -0.7, 0.7);
      c.orbitPitch = THREE.MathUtils.clamp(c.orbitPitch + (e.clientY - c.lastY) * 0.002, -0.15, 0.25);
      c.lastX = e.clientX;
      c.lastY = e.clientY;
    };
    const up = () => {
      cur.current.dragging = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame(({ clock }, delta) => {
    const s = lobby.get();
    const c = cur.current;
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const reduced = s.reducedMotion;
    const aspect = size.width / Math.max(1, size.height);

    let lambda = reduced ? 9 : 2.6;

    if (s.phase === "boot" || s.phase === "title") {
      c.intro = -1;
      tmp.pos.copy(TITLE.pos);
      if (!reduced) tmp.pos.add(V(Math.sin(t * 0.13) * 1.6, Math.sin(t * 0.09) * 0.5, Math.cos(t * 0.11) * 0.8));
      tmp.look.copy(TITLE.look);
      c.pos.copy(tmp.pos);
      c.look.copy(tmp.look);
      c.fov = TITLE.fov;
    } else if (s.phase === "intro") {
      if (c.intro < 0) c.intro = 0;
      c.intro = Math.min(1, c.intro + dt / (reduced ? 0.6 : INTRO_SECONDS));
      const k = ease(c.intro);
      INTRO.getPointAt(k, c.pos);
      c.look.lerpVectors(HEAD, SHOTS.lobby.look, THREE.MathUtils.smoothstep(k, 0.45, 1));
      c.fov = THREE.MathUtils.lerp(TITLE.fov, SHOTS.lobby.fov, k);
      if (c.intro >= 1) lobby.set({ phase: "lobby" });
    } else {
      const shot = SHOTS[s.screen];
      tmp.pos.copy(shot.pos);
      tmp.look.copy(shot.look);
      let fov = shot.fov;
      const m = markerById(s.focus);
      if (m && m.screen === s.screen && s.screen !== "career") {
        const framed = frameMarker(m, shot.pos);
        tmp.look.copy(framed.look);
        fov = framed.fov;
      } else if (m && m.screen === s.screen) {
        tmp.look.copy(m.position).add(V(0, -20, 0));
        fov = FOCUS_FOV.career ?? fov;
      }

      // Orbit around what we're looking at (drag), springing back when released.
      if (!c.dragging) {
        c.orbit = THREE.MathUtils.damp(c.orbit, 0, 1.2, dt);
        c.orbitPitch = THREE.MathUtils.damp(c.orbitPitch, 0, 1.2, dt);
      }
      if (s.screen === "lobby" || s.screen === "loadout" || s.screen === "intel") {
        const pivot = s.screen === "lobby" ? HEAD : tmp.look;
        const off = tmp.pos.clone().sub(pivot);
        off.applyAxisAngle(V(0, 1, 0), c.orbit);
        off.y += c.orbitPitch * off.length();
        tmp.pos.copy(pivot).add(off);
      } else {
        tmp.look.add(V(-c.orbit * 40, c.orbitPitch * 30, 0));
      }

      // Cursor parallax and a slow handheld drift.
      if (!reduced) {
        tmp.fwd.subVectors(tmp.look, tmp.pos).normalize();
        tmp.right.crossVectors(tmp.fwd, V(0, 1, 0)).normalize();
        const amt = s.screen === "missions" || s.screen === "arsenal" ? 0.04 : 0.13;
        tmp.pos.addScaledVector(tmp.right, pointer.x * amt);
        tmp.pos.y += pointer.y * amt * 0.45;
        tmp.pos.x += Math.sin(t * 0.21) * 0.025;
        tmp.pos.y += Math.sin(t * 0.33) * 0.015;
      }

      // Narrow screens: widen the lens so the skyline still fits.
      if (aspect < 1.3) {
        const half = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * (1.3 / aspect);
        fov = Math.min(aspect < 0.8 ? 62 : 74, THREE.MathUtils.radToDeg(2 * Math.atan(half)));
        if (s.screen === "lobby") {
          // Portrait: you on the left, downtown on the right, skyline above the controls.
          tmp.pos.set(-0.2, 1.55, aspect < 0.8 ? 3.0 : 3.2);
          tmp.look.set(aspect < 0.8 ? 1.25 : 0.9, aspect < 0.8 ? 0.6 : 0.95, -8);
        }
      }

      c.pos.x = THREE.MathUtils.damp(c.pos.x, tmp.pos.x, lambda, dt);
      c.pos.y = THREE.MathUtils.damp(c.pos.y, tmp.pos.y, lambda, dt);
      c.pos.z = THREE.MathUtils.damp(c.pos.z, tmp.pos.z, lambda, dt);
      lambda *= 1.15;
      c.look.x = THREE.MathUtils.damp(c.look.x, tmp.look.x, lambda, dt);
      c.look.y = THREE.MathUtils.damp(c.look.y, tmp.look.y, lambda, dt);
      c.look.z = THREE.MathUtils.damp(c.look.z, tmp.look.z, lambda, dt);
      c.fov = THREE.MathUtils.damp(c.fov, fov, lambda * 0.9, dt);
    }

    camera.position.copy(c.pos);
    camera.lookAt(c.look);
    camera.fov = c.fov;

    // Keep the subject centred in the space a side panel leaves free.
    c.shiftX = THREE.MathUtils.damp(c.shiftX, s.panelInset / 2, reduced ? 20 : 5, dt);
    c.shiftY = THREE.MathUtils.damp(c.shiftY, s.sheetInset / 2, reduced ? 20 : 5, dt);
    if (Math.abs(c.shiftX) > 0.5 || Math.abs(c.shiftY) > 0.5) {
      camera.setViewOffset(size.width, size.height, c.shiftX, c.shiftY, size.width, size.height);
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  });

  return null;
}
