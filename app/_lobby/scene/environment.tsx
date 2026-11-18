"use client";

import { useEffect, useLayoutEffect, useMemo, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { GROUND_Y } from "./geo";
import { createSkyMaterial, WaterShader } from "./shaders";

export const MOON_DIR = new THREE.Vector3(-0.55, 0.32, -1);

export function Sky() {
  const material = useMemo(() => createSkyMaterial(MOON_DIR), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(4200, 48, 24), []);
  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh geometry={geometry} material={material} renderOrder={-10} frustumCulled={false} />
  );
}

/** Below this camera change per frame, a skipped mirror frame can't be seen. */
const STILL_ROTATION = 0.002;
const STILL_TRANSLATION = 0.01;

function cameraStill(a: THREE.Matrix4, b: THREE.Matrix4) {
  const e = a.elements;
  const l = b.elements;
  for (let i = 0; i < 11; i++) {
    if (Math.abs(e[i] - l[i]) > STILL_ROTATION) return false;
  }
  for (let i = 12; i < 15; i++) {
    if (Math.abs(e[i] - l[i]) > STILL_TRANSLATION) return false;
  }
  return true;
}

/** The Hudson: a planar reflector with our own ripple-and-streak shader. */
export function Water({
  resolution,
  hide,
  throttle = false,
}: {
  resolution: number;
  hide: RefObject<THREE.Object3D | null>;
  /** Refresh the mirror at half rate while the camera is (nearly) still. */
  throttle?: boolean;
}) {
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  // Snapped to 32 px so a window drag or a phone's URL bar sliding doesn't
  // reallocate the mirror on every pixel of resize.
  const width = Math.max(64, Math.round((resolution * Math.min(2, aspect)) / 32) * 32);

  const { reflector, mode } = useMemo(() => {
    const m = { throttle: false, frame: 0, rendered: false, last: new THREE.Matrix4() };
    const geo = new THREE.PlaneGeometry(9000, 9000);
    const r = new Reflector(geo, {
      textureWidth: resolution,
      textureHeight: resolution,
      clipBias: 0.002,
      multisample: 0,
      shader: WaterShader,
    });
    r.rotation.x = -Math.PI / 2;
    r.position.y = GROUND_Y;
    const mat = r.material as THREE.ShaderMaterial;
    mat.uniforms.uMoon.value = MOON_DIR.clone().normalize();
    const render = r.onBeforeRender.bind(r);
    r.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      m.frame++;
      // Skipping keeps last frame's texture and its matching texture matrix,
      // so the reflection stays registered to the world, just 1 frame old.
      if (m.throttle && m.rendered && m.frame % 2 === 1 && cameraStill(camera.matrixWorld, m.last)) return;
      const near = hide.current;
      const wasVisible = near?.visible ?? false;
      if (near) near.visible = false;
      render(renderer, scene, camera, geometry, material, group);
      if (near) near.visible = wasVisible;
      m.last.copy(camera.matrixWorld);
      m.rendered = true;
    };
    r.frustumCulled = false;
    r.renderOrder = -5;
    return { reflector: r, mode: m };
  }, [resolution, hide]);

  useEffect(() => {
    mode.throttle = throttle;
  }, [mode, throttle]);

  // Resize the mirror's target in place instead of rebuilding the reflector.
  useLayoutEffect(() => {
    reflector.getRenderTarget().setSize(width, resolution);
  }, [reflector, width, resolution]);

  useEffect(
    () => () => {
      // Reflector.dispose() frees its target and material but not the plane.
      reflector.dispose();
      reflector.geometry.dispose();
    },
    [reflector],
  );

  useFrame(({ clock }) => {
    (reflector.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime;
  });

  return <primitive object={reflector} />;
}
