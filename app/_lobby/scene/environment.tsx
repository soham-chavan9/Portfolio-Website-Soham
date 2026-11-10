"use client";

import { useEffect, useMemo, type RefObject } from "react";
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

/** The Hudson: a planar reflector with our own ripple-and-streak shader. */
export function Water({
  resolution,
  hide,
}: {
  resolution: number;
  hide: RefObject<THREE.Object3D | null>;
}) {
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const reflector = useMemo(() => {
    const geo = new THREE.PlaneGeometry(9000, 9000);
    const r = new Reflector(geo, {
      textureWidth: Math.round(resolution * Math.min(2, aspect)),
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
      const near = hide.current;
      const wasVisible = near?.visible ?? false;
      if (near) near.visible = false;
      render(renderer, scene, camera, geometry, material, group);
      if (near) near.visible = wasVisible;
    };
    r.frustumCulled = false;
    r.renderOrder = -5;
    return r;
  }, [resolution, aspect, hide]);

  useEffect(() => () => reflector.dispose(), [reflector]);

  useFrame(({ clock }) => {
    (reflector.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime;
  });

  return <primitive object={reflector} />;
}
