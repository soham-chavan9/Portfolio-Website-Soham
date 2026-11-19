"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ScreenId } from "@/content/scene";
import { grab, lobby, pointer, type Phase } from "../store";
import { landmarkTop } from "./geo";
import { GLOBE_CENTER } from "./skills-globe";
import { frameMarker, markerById, markers } from "./targets";

type Shot = { pos: THREE.Vector3; look: THREE.Vector3; fov: number };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const HEAD = V(-0.55, 1.62, -2.5);

const TITLE: Shot = { pos: V(8, 0.6, -27), look: V(-0.3, -2.2, -2.5), fov: 36 };

function midtown() {
  const a = V(...landmarkTop("empire"));
  const b = V(...landmarkTop("vanderbilt"));
  return a.add(b).multiplyScalar(0.5).add(V(0, -18, 0));
}

const AUTHORED: Record<ScreenId, Shot> = {
  home: { pos: V(0.85, 1.58, 2.7), look: V(0.55, 1.3, -8), fov: 40 },
  experience: { pos: V(-2.15, 1.52, -1.75), look: V(...landmarkTop("oneWtc")).add(V(0, -30, 0)), fov: 26 },
  projects: { pos: V(-1.0, 1.62, -2.1), look: midtown(), fov: 22 },
  // Skills and Contact sit in front of the operator's fixed three-quarter stance.
  // On Skills the shot widens to take in the hologram globe at his side.
  skills: { pos: V(1.05, 1.42, 1.05), look: V(-0.08, 1.12, -2.72), fov: 38 },
  education: { pos: V(5.4, 2.05, 3.3), look: V(-2.6, 1.1, -5.5), fov: 46 },
  contact: { pos: V(1.21, 1.55, -0.45), look: V(-0.55, 1.28, -2.5), fov: 34 },
};

/** Narrower than this, the lens widens so the horizontal view never shrinks. */
const MIN_ASPECT = 1.3;
/** Markers must sit inside this share of the half-frame to count as framed. */
const FIT_MARGIN = 0.85;

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const yawOf = (d: THREE.Vector3) => Math.atan2(d.x, -d.z);
const pitchOf = (d: THREE.Vector3) => Math.atan2(d.y, Math.hypot(d.x, d.z));

/**
 * Keep every marker of a screen inside its overview shot, however many the
 * content maps there. A shot that already frames its markers is kept exactly
 * as authored; otherwise it is re-aimed at their middle and widened to fit.
 */
function fitShot(shot: Shot, screen: ScreenId): Shot {
  const list = markers.filter((m) => m.screen === screen);
  if (list.length === 0) return shot;
  const d = new THREE.Vector3().subVectors(shot.look, shot.pos);
  const dist = d.length();
  const yaw0 = yawOf(d);
  const pitch0 = pitchOf(d);
  const vHalf = THREE.MathUtils.degToRad(shot.fov / 2);
  const hHalf = Math.atan(Math.tan(vHalf) * MIN_ASPECT);
  let y0 = 0;
  let y1 = 0;
  let p0 = 0;
  let p1 = 0;
  let fits = true;
  const p = new THREE.Vector3();
  for (const m of list) {
    p.copy(m.position);
    p.y += m.landmark ? 4 : 12;
    p.sub(shot.pos);
    const dy = wrap(yawOf(p) - yaw0);
    const dp = pitchOf(p) - pitch0;
    y0 = Math.min(y0, dy);
    y1 = Math.max(y1, dy);
    p0 = Math.min(p0, dp);
    p1 = Math.max(p1, dp);
    if (Math.abs(dy) > hHalf * FIT_MARGIN || Math.abs(dp) > vHalf * FIT_MARGIN) fits = false;
  }
  if (fits) return shot;
  const yaw = yaw0 + (y0 + y1) / 2;
  const pitch = pitch0 + (p0 + p1) / 2;
  const needV = (p1 - p0) / 2 / FIT_MARGIN;
  const needH = Math.atan(Math.tan(Math.min(1.4, (y1 - y0) / 2 / FIT_MARGIN)) / MIN_ASPECT);
  const half = Math.max(vHalf, needV, needH);
  const look = V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))
    .multiplyScalar(dist)
    .add(shot.pos);
  return { pos: shot.pos, look, fov: Math.min(50, THREE.MathUtils.radToDeg(2 * half)) };
}

const SHOTS: Record<ScreenId, Shot> = {
  ...AUTHORED,
  experience: fitShot(AUTHORED.experience, "experience"),
  projects: fitShot(AUTHORED.projects, "projects"),
  education: fitShot(AUTHORED.education, "education"),
};

/** Lens for a focused horizon pin (off-map places have no tower to frame). */
const HORIZON_FOV = 24;

// Drone fly-in: from over the Hudson, up over the rail, round behind the operator.
const INTRO = new THREE.CatmullRomCurve3([
  TITLE.pos.clone(),
  V(6.4, 2.8, -15),
  V(4.7, 2.5, -6.2),
  V(3.3, 1.95, -0.8),
  SHOTS.home.pos.clone(),
]);
const INTRO_SECONDS = 3.4;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Where the camera rests on a screen, before drag, parallax and drift: the
 * authored shot, re-aimed at a focused marker, with the lens widened on narrow
 * screens. Writes pos and look, returns the fov.
 */
function restingShot(
  screen: ScreenId,
  focus: string | null,
  aspect: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
) {
  const shot = SHOTS[screen];
  outPos.copy(shot.pos);
  outLook.copy(shot.look);
  let fov = shot.fov;
  const m = markerById(focus);
  if (m && m.screen === screen) {
    if (m.landmark) {
      fov = frameMarker(m, shot.pos, outLook);
    } else {
      outLook.copy(m.position);
      outLook.y -= 20;
      fov = HORIZON_FOV;
    }
  }
  // Narrow screens: widen the lens so the skyline still fits.
  if (aspect < MIN_ASPECT) {
    const half = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * (MIN_ASPECT / aspect);
    fov = Math.min(aspect < 0.8 ? 62 : 74, THREE.MathUtils.radToDeg(2 * Math.atan(half)));
    if (screen === "home") {
      // Portrait: you on the left, downtown on the right, skyline above the controls.
      outPos.set(-0.2, 1.55, aspect < 0.8 ? 3.0 : 3.2);
      outLook.set(aspect < 0.8 ? 1.25 : 0.9, aspect < 0.8 ? 0.6 : 0.95, -8);
    } else if (screen === "skills" && aspect < 1) {
      // Portrait: the skills sheet covers the lower half, so frame the
      // hologram globe in the space above it rather than the operator.
      outLook.copy(GLOBE_CENTER);
      outLook.y += 0.12;
      outPos.set(1.25, 1.62, 0.65);
    }
  }
  return fov;
}

/** Velocity after the last `spring` call (kept out of the return to avoid allocating). */
let springVel = 0;

/**
 * Exact critically damped spring step. Frame-rate independent for any dt,
 * eases in and out, and is clamped so it never overshoots the target.
 */
function spring(x: number, v: number, target: number, w: number, dt: number) {
  const c1 = x - target;
  // Moving toward the target faster than it can stop: trim to the
  // fastest approach that still lands without overshoot.
  if (v * c1 < 0 && Math.abs(v) > w * Math.abs(c1)) v = -w * c1;
  const c2 = v + w * c1;
  const e = Math.exp(-w * dt);
  springVel = (c2 - w * (c1 + c2 * dt)) * e;
  return target + (c1 + c2 * dt) * e;
}

function springVec(x: THREE.Vector3, v: THREE.Vector3, target: THREE.Vector3, w: number, dt: number) {
  x.x = spring(x.x, v.x, target.x, w, dt);
  v.x = springVel;
  x.y = spring(x.y, v.y, target.y, w, dt);
  v.y = springVel;
  x.z = spring(x.z, v.z, target.z, w, dt);
  v.z = springVel;
}

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  const cur = useRef({
    pos: TITLE.pos.clone(),
    vel: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    vYaw: 0,
    vPitch: 0,
    fov: TITLE.fov,
    vFov: 0,
    shiftX: 0,
    shiftY: 0,
    phase: "boot" as Phase,
    intro: -1,
    /** Title drift at the moment the fly-in starts, faded out over its first stretch. */
    introOff: new THREE.Vector3(),
    orbit: 0,
    orbitPitch: 0,
    dragging: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
  });
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      off: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      endLook: new THREE.Vector3(),
      right: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      aim: new THREE.Vector3(),
    }),
    [],
  );

  // Drag to look around, like rotating the lobby camera on a controller.
  useEffect(() => {
    const el = gl.domElement;
    const c = cur.current;
    const down = (e: PointerEvent) => {
      // One finger steers; a second one (pinch, two-finger tap) is ignored.
      if (lobby.get().phase !== "lobby" || c.dragging) return;
      c.dragging = true;
      c.pointerId = e.pointerId;
      c.lastX = e.clientX;
      c.lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!c.dragging || e.pointerId !== c.pointerId) return;
      if (grab.globe) {
        c.dragging = false;
        return;
      }
      c.orbit = THREE.MathUtils.clamp(c.orbit - (e.clientX - c.lastX) * 0.004, -0.7, 0.7);
      c.orbitPitch = THREE.MathUtils.clamp(c.orbitPitch + (e.clientY - c.lastY) * 0.002, -0.15, 0.25);
      c.lastX = e.clientX;
      c.lastY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === c.pointerId) c.dragging = false;
    };
    // The browser can take a touch over (scroll, gesture) or the window can
    // lose focus mid-drag; never leave the camera stuck "held".
    const release = () => {
      c.dragging = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, [gl]);

  useFrame(({ clock }, delta) => {
    const s = lobby.get();
    const c = cur.current;
    // Hitches and tab switches slow the move down instead of jumping it.
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const reduced = s.reducedMotion;
    const aspect = size.width / Math.max(1, size.height);

    if (s.phase === "boot" || s.phase === "title") {
      c.intro = -1;
      c.pos.copy(TITLE.pos);
      if (!reduced) {
        c.pos.x += Math.sin(t * 0.13) * 1.6;
        c.pos.y += Math.sin(t * 0.09) * 0.5;
        c.pos.z += Math.cos(t * 0.11) * 0.8;
      }
      tmp.dir.subVectors(TITLE.look, c.pos);
      c.yaw = yawOf(tmp.dir);
      c.pitch = pitchOf(tmp.dir);
      c.fov = TITLE.fov;
      c.vel.set(0, 0, 0);
      c.vYaw = c.vPitch = c.vFov = 0;
    } else if (s.phase === "intro") {
      const first = c.intro < 0;
      if (first) {
        c.intro = 0;
        c.introOff.subVectors(c.pos, TITLE.pos);
      }
      // Real time (capped per frame) so a slow or throttled frame rate
      // doesn't stretch the fly-in into minutes. Reduced motion: a straight cut.
      const step = Math.min(delta, 0.25);
      c.intro = reduced ? 1 : Math.min(1, c.intro + step / INTRO_SECONDS);
      const k = ease(c.intro);
      // End exactly where the lobby will rest on this screen, so there's no second move.
      const endFov = restingShot("home", null, aspect, tmp.endPos, tmp.endLook);
      INTRO.getPointAt(k, tmp.pos);
      tmp.pos.addScaledVector(tmp.off.subVectors(tmp.endPos, SHOTS.home.pos), THREE.MathUtils.smoothstep(k, 0.3, 1));
      tmp.pos.addScaledVector(c.introOff, 1 - THREE.MathUtils.smoothstep(k, 0, 0.35));
      // From the title's aim to the operator's head, then out to the skyline.
      tmp.look.lerpVectors(TITLE.look, HEAD, THREE.MathUtils.smoothstep(k, 0, 0.3));
      tmp.look.lerp(tmp.endLook, THREE.MathUtils.smoothstep(k, 0.45, 1));
      tmp.dir.subVectors(tmp.look, tmp.pos);
      const yaw = c.yaw + wrap(yawOf(tmp.dir) - c.yaw);
      const pitch = pitchOf(tmp.dir);
      const fov = THREE.MathUtils.lerp(TITLE.fov, endFov, k);
      // Track velocity so skipping the fly-in hands off without a jolt.
      if (!first && !reduced && step > 1e-4) {
        c.vel.subVectors(tmp.pos, c.pos).divideScalar(step);
        c.vYaw = (yaw - c.yaw) / step;
        c.vPitch = (pitch - c.pitch) / step;
        c.vFov = (fov - c.fov) / step;
      } else {
        c.vel.set(0, 0, 0);
        c.vYaw = c.vPitch = c.vFov = 0;
      }
      c.pos.copy(tmp.pos);
      c.yaw = yaw;
      c.pitch = pitch;
      c.fov = fov;
      if (c.intro >= 1) lobby.set({ phase: "lobby" });
    } else {
      const fov = restingShot(s.screen, s.focus, aspect, tmp.pos, tmp.look);

      // Orbit around what we're looking at (drag), springing back when released.
      if (!c.dragging) {
        c.orbit = THREE.MathUtils.damp(c.orbit, 0, 1.2, dt);
        c.orbitPitch = THREE.MathUtils.damp(c.orbitPitch, 0, 1.2, dt);
      }
      if (s.screen === "home" || s.screen === "skills" || s.screen === "contact") {
        const pivot = s.screen === "home" ? HEAD : tmp.look;
        tmp.off.subVectors(tmp.pos, pivot);
        tmp.off.applyAxisAngle(UP, c.orbit);
        tmp.off.y += c.orbitPitch * tmp.off.length();
        tmp.pos.copy(pivot).add(tmp.off);
      } else {
        tmp.look.x -= c.orbit * 40;
        tmp.look.y += c.orbitPitch * 30;
      }

      // Cursor parallax and a slow handheld drift. On touch the "cursor" is
      // wherever the last tap landed, so it would just leave the view nudged.
      if (!reduced) {
        if (!s.touch) {
          tmp.fwd.subVectors(tmp.look, tmp.pos).normalize();
          tmp.right.crossVectors(tmp.fwd, UP).normalize();
          const amt = s.screen === "experience" || s.screen === "projects" ? 0.04 : 0.13;
          tmp.pos.addScaledVector(tmp.right, pointer.x * amt);
          tmp.pos.y += pointer.y * amt * 0.45;
        }
        tmp.pos.x += Math.sin(t * 0.21) * 0.025;
        tmp.pos.y += Math.sin(t * 0.33) * 0.015;
      }

      if (c.phase === "boot" || c.phase === "title") {
        // Returning visitors skip the fly-in: cut straight to the lobby rather
        // than whipping 30 m across the river and through the railing.
        c.pos.copy(tmp.pos);
        tmp.dir.subVectors(tmp.look, c.pos);
        c.yaw = yawOf(tmp.dir);
        c.pitch = pitchOf(tmp.dir);
        c.fov = fov;
        c.vel.set(0, 0, 0);
        c.vYaw = c.vPitch = c.vFov = 0;
      } else {
        // Critically damped: eases in and out of every move, never bounces.
        const w = reduced ? 16 : 4.6;
        springVec(c.pos, c.vel, tmp.pos, w, dt);
        // Aim by angle from where the camera is now, so swinging from a nearby
        // subject to a tower kilometres away turns at an even pace.
        tmp.dir.subVectors(tmp.look, c.pos);
        c.yaw = spring(c.yaw, c.vYaw, c.yaw + wrap(yawOf(tmp.dir) - c.yaw), w * 1.15, dt);
        c.vYaw = springVel;
        c.pitch = spring(c.pitch, c.vPitch, pitchOf(tmp.dir), w * 1.15, dt);
        c.vPitch = springVel;
        c.fov = spring(c.fov, c.vFov, fov, w, dt);
        c.vFov = springVel;
      }
    }
    c.phase = s.phase;

    // Keep yaw bounded so long sessions don't accumulate turns.
    c.yaw = wrap(c.yaw);

    const cp = Math.cos(c.pitch);
    tmp.aim.set(Math.sin(c.yaw) * cp, Math.sin(c.pitch), -Math.cos(c.yaw) * cp).add(c.pos);
    camera.position.copy(c.pos);
    camera.lookAt(tmp.aim);
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
