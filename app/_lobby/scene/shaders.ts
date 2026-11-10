import * as THREE from "three";

// Night palette, in linear light (tone mapping happens in post).
export const PALETTE = {
  zenith: new THREE.Color(0.002, 0.0035, 0.015),
  mid: new THREE.Color(0.006, 0.01, 0.036),
  horizon: new THREE.Color(0.04, 0.026, 0.045),
  glow: new THREE.Color(0.44, 0.19, 0.11),
  haze: new THREE.Color(0.026, 0.02, 0.034),
  warm: new THREE.Color(1.0, 0.64, 0.32),
  cool: new THREE.Color(0.78, 0.87, 1.0),
};

export const HAZE_DENSITY = 0.00068;

const common = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return v;
}
uniform vec3 uHazeColor;
uniform float uHazeDensity;
vec3 applyHaze(vec3 base, vec3 emissive, vec3 worldPos) {
  float d = length(worldPos - cameraPosition);
  float h = 1.0 - exp(-d * uHazeDensity);
  return mix(base, uHazeColor, h) + emissive * (1.0 - h * 0.55);
}
`;

const hazeUniforms = () => ({
  uHazeColor: { value: PALETTE.haze.clone() },
  uHazeDensity: { value: HAZE_DENSITY },
});

// ---------------------------------------------------------------------------
// Buildings: one shader for every tower, instanced or not. Windows, lit rooms
// that slowly switch on and off, glass that catches the city glow, and
// floodlit crowns. Window detail fades to its average when it gets sub-pixel.

export type WindowOptions = {
  floor?: number;
  bay?: number;
  intensity?: number;
  seed?: number;
  lit?: number;
  style?: number;
  crown?: number;
  height?: number;
};

export function createWindowMaterial(opts: WindowOptions = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFloor: { value: opts.floor ?? 3.8 * 0.2 },
      uBay: { value: opts.bay ?? 3.0 * 0.2 },
      uIntensity: { value: opts.intensity ?? 1.2 },
      uWarm: { value: PALETTE.warm.clone() },
      uCool: { value: PALETTE.cool.clone() },
      uGlow: { value: PALETTE.glow.clone() },
      uData: {
        value: new THREE.Vector4(
          opts.seed ?? 0.5,
          opts.lit ?? 0.5,
          opts.style ?? 3,
          opts.crown ?? 0,
        ),
      },
      uHeight: { value: opts.height ?? 1 },
      ...hazeUniforms(),
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocal;
      varying vec3 vNormalO;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec4 vData;
      varying float vHeight;
      uniform vec4 uData;
      uniform float uHeight;
      #ifdef USE_INSTANCING
      attribute vec4 aData;
      #endif
      void main() {
        #ifdef USE_INSTANCING
          vec3 s = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vLocal = position * s;
          vData = aData;
          vHeight = s.y;
          vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        #else
          vLocal = position * vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
          vData = uData;
          vHeight = uHeight;
          vec4 world = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);
        #endif
        vNormalO = normal;
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uFloor;
      uniform float uBay;
      uniform float uIntensity;
      uniform vec3 uWarm;
      uniform vec3 uCool;
      uniform vec3 uGlow;
      varying vec3 vLocal;
      varying vec3 vNormalO;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec4 vData;
      varying float vHeight;
      ${common}

      vec3 crownColor(float k) {
        if (k < 0.5) return vec3(1.0, 0.93, 0.82);
        if (k < 1.5) return vec3(1.0, 0.68, 0.28);
        if (k < 2.5) return vec3(0.38, 0.62, 1.0);
        if (k < 3.5) return vec3(1.0, 0.3, 0.22);
        return vec3(0.72, 0.45, 1.0);
      }

      void main() {
        vec3 n = normalize(vNormalO);
        vec3 nw = normalize(vNormalW);
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float seed = vData.x;
        float litDensity = vData.y;
        float style = vData.z;
        float crown = vData.w;

        vec3 base = vec3(0.010, 0.012, 0.018);
        vec3 emissive = vec3(0.0);

        if (abs(n.y) > 0.75) {
          base = vec3(0.008, 0.009, 0.013);
        } else {
          vec2 nh = normalize(n.xz + 1e-5);
          float u = dot(vLocal.xz, vec2(-nh.y, nh.x)) + dot(nh, vec2(17.0, 31.0));
          float v = vLocal.y;
          vec2 cell = vec2(u / uBay, v / uFloor);
          vec2 id = floor(cell);
          vec2 f = fract(cell);
          vec2 fw = max(fwidth(cell), vec2(1e-4));

          vec2 win = vec2(0.62, 0.58);
          if (style > 2.5) win = vec2(0.94, 0.82);
          else if (style > 1.5) win = vec2(1.0, 0.5);
          else if (style > 0.5) win = vec2(0.42, 0.62);

          vec2 lo = 0.5 - win * 0.5;
          vec2 hi = 0.5 + win * 0.5;
          vec2 m = smoothstep(lo - fw, lo + fw, f) * (1.0 - smoothstep(hi - fw, hi + fw, f));
          float glassMask = m.x * m.y;
          float coverage = win.x * win.y;
          float detail = clamp(1.6 - max(fw.x, fw.y) * 2.2, 0.0, 1.0);
          glassMask = mix(coverage, glassMask, detail);

          // Rooms of three bays switch on and off independently.
          vec2 room = vec2(floor(id.x / 4.0), id.y);
          float r = hash12(room + seed * 91.7);
          // Office floors light up as a whole.
          float floorOn = step(1.0 - litDensity * 0.3, hash12(vec2(id.y * 1.7, seed * 53.0)));
          float period = 18.0 + hash12(room * 3.1 + seed) * 70.0;
          float epoch = floor(uTime / period + r * 13.0);
          float toggle = hash12(room + epoch * 1.37 + seed * 7.0);
          float on = max(step(1.0 - litDensity * 0.8, mix(r, toggle, 0.18)), style > 2.5 ? floorOn : 0.0);
          // Mechanical floors and lobbies.
          if (mod(id.y + floor(seed * 7.0), 23.0) < 1.0) on = 0.0;
          if (id.y < 1.0) on = 1.0;
          float roomDetail = clamp(1.4 - fw.y * 1.4, 0.0, 1.0);
          on = mix(litDensity * 0.42, on, roomDetail);

          float cool = step(0.8, hash12(room * 1.31 + seed * 3.0));
          if (style > 2.5) cool = max(cool, step(0.6, hash12(room * 0.71 + seed)));
          vec3 lamp = mix(uWarm, uCool, cool);
          float bright = 0.55 + 0.9 * hash12(id * 0.73 + seed * 5.0);
          bright = mix(0.7, bright, roomDetail);

          float fres = pow(1.0 - clamp(dot(nw, viewDir), 0.0, 1.0), 3.0);
          vec3 glassCol = vec3(0.005, 0.008, 0.014) + uHazeColor * 0.35 + uGlow * 0.06 * fres;
          base = mix(base, glassCol, glassMask);
          emissive = lamp * bright * on * glassMask * uIntensity;

          // Faint verticals so towers read as volumes against the haze.
          float edge = 1.0 - smoothstep(0.0, 0.06, abs(fract(u / (uBay * 6.0)) - 0.5) * 2.0 - 0.94);
          base += uGlow * 0.006 * edge;

          // Floodlit crown.
          if (crown >= 1.0) {
            float top = smoothstep(vHeight * 0.9, vHeight, v);
            vec3 cc = crownColor(floor(fract(crown) * 10.0 + 0.5));
            emissive = mix(emissive, cc * (2.2 + top * 2.5), smoothstep(vHeight * 0.88, vHeight * 0.9, v));
          }
        }

        // Sky glow wraps the upper floors a touch.
        base += uGlow * 0.015 * smoothstep(0.0, 1.0, vLocal.y / max(vHeight, 1.0));
        vec3 col = applyHaze(base, emissive, vWorld);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// Street grid seen from 140 m up: warm sodium lines that blur out with range.

export function createGroundMaterial(gridAngle: number, block = [56, 16], intensity = 0.3) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uAngle: { value: gridAngle },
      uBlock: { value: new THREE.Vector2(block[0], block[1]) },
      uGlow: { value: PALETTE.glow.clone() },
      uIntensity: { value: intensity },
      ...hazeUniforms(),
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uAngle;
      uniform vec2 uBlock;
      uniform vec3 uGlow;
      uniform float uIntensity;
      varying vec3 vWorld;
      ${common}
      void main() {
        float c = cos(uAngle), s = sin(uAngle);
        vec2 p = mat2(c, -s, s, c) * vWorld.xz;
        vec2 g = p / uBlock;
        vec2 fw = max(fwidth(g), vec2(1e-4));
        vec2 d = abs(fract(g) - 0.5);
        vec2 w = vec2(0.025, 0.06);
        vec2 line = 1.0 - smoothstep(w - fw, w + fw, 0.5 - d);
        float streets = max(line.x, line.y);
        float avg = 1.0 - (1.0 - w.x * 2.0) * (1.0 - w.y * 2.0);
        float detail = clamp(1.2 - max(fw.x, fw.y) * 1.6, 0.0, 1.0);
        streets = mix(avg, streets, detail);
        float patchy = 0.55 + 0.9 * vnoise(vWorld.xz * 0.02);
        vec3 lamp = vec3(1.0, 0.56, 0.24);
        vec3 emissive = lamp * streets * patchy * uIntensity;
        vec3 base = vec3(0.012, 0.011, 0.014);
        gl_FragColor = vec4(applyHaze(base, emissive, vWorld), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// Sky dome: gradient, sodium light pollution over Manhattan, thin clouds lit
// from below, a few stars, and the moon.

export function createSkyMaterial(moonDir: THREE.Vector3) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uZenith: { value: PALETTE.zenith.clone() },
      uMid: { value: PALETTE.mid.clone() },
      uHorizon: { value: PALETTE.horizon.clone() },
      uGlow: { value: PALETTE.glow.clone() },
      uMoon: { value: moonDir.clone().normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uZenith;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uGlow;
      uniform vec3 uMoon;
      varying vec3 vDir;
      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
      float hash13(vec3 p3) {
        p3 = fract(p3 * 0.1031);
        p3 += dot(p3, p3.zyx + 31.32);
        return fract((p3.x + p3.y) * p3.z);
      }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
                   mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * vnoise(p);
          p = p * 2.03 + vec2(17.1, 9.2);
          a *= 0.5;
        }
        return v;
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.16, h));
        col = mix(col, uZenith, smoothstep(0.14, 0.75, h));

        float az = atan(d.x, -d.z);
        float azk = (az - 0.05) / 0.85;
        float overCity = exp(-azk * azk);
        col += uGlow * overCity * exp(-max(h, 0.0) * 20.0) * 0.32;
        col += uGlow * 0.05 * exp(-max(h, 0.0) * 6.0);

        vec2 cp = d.xz / (max(h, 0.0) + 0.12) * 0.9;
        float c = fbm(cp * 1.4 + vec2(uTime * 0.006, uTime * 0.002));
        float cloud = smoothstep(0.52, 0.86, c) * smoothstep(0.015, 0.22, h);
        vec3 cloudCol = uGlow * (0.03 + 0.12 * overCity) * exp(-h * 5.0) + vec3(0.006, 0.008, 0.018);
        col = mix(col, cloudCol, cloud * 0.45);

        vec3 sp = d * 420.0;
        vec3 cid = floor(sp);
        float sh = hash13(cid);
        float sd = length(fract(sp) - 0.5);
        float twinkle = 0.6 + 0.4 * sin(uTime * (1.0 + sh * 3.0) + sh * 40.0);
        float star = step(0.9965, sh) * smoothstep(0.32, 0.0, sd) * smoothstep(0.08, 0.45, h) * (1.0 - cloud);
        col += vec3(0.85, 0.9, 1.0) * star * twinkle * 1.4;

        float md = dot(d, uMoon);
        float disc = smoothstep(0.99962, 0.99972, md);
        float crater = 0.85 + 0.15 * vnoise((d.xy - uMoon.xy) * 900.0);
        col = mix(col, vec3(1.0, 0.96, 0.88) * 2.6 * crater, disc);
        col += vec3(0.55, 0.62, 0.8) * (pow(max(md, 0.0), 900.0) * 0.5 + pow(max(md, 0.0), 60.0) * 0.05);

        if (h < 0.0) col = mix(col, uHorizon * 0.7, 1.0 - smoothstep(-0.05, 0.0, h));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// The Hudson. Plugs into three's Reflector: the mirrored city is rippled,
// stretched into vertical streaks, and weighted by Fresnel.

export const WaterShader = {
  name: "HudsonWater",
  uniforms: {
    color: { value: null as THREE.Color | null },
    tDiffuse: { value: null as THREE.Texture | null },
    textureMatrix: { value: null as THREE.Matrix4 | null },
    uTime: { value: 0 },
    uStreak: { value: 0.006 },
    uMoon: { value: new THREE.Vector3(-0.4, 0.35, -1).normalize() },
    uHazeColor: { value: PALETTE.haze.clone() },
    uHazeDensity: { value: HAZE_DENSITY },
    uGlow: { value: PALETTE.glow.clone() },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uStreak;
    uniform vec3 uMoon;
    uniform vec3 uGlow;
    varying vec4 vUv;
    varying vec3 vWorld;
    ${common}
    void main() {
      vec3 toCam = cameraPosition - vWorld;
      float dist = length(toCam);
      vec3 v = toCam / dist;

      vec2 p = vWorld.xz;
      float n1 = vnoise(p * vec2(0.09, 0.35) + vec2(uTime * 0.12, uTime * 0.05));
      float n2 = vnoise(p * vec2(0.23, 0.8) - vec2(uTime * 0.18, -uTime * 0.07));
      float ripple = (n1 - 0.5) + (n2 - 0.5) * 0.6;
      float near = clamp(60.0 / dist, 0.0, 1.0);

      vec4 uv = vUv;
      uv.x += ripple * (0.012 + 0.03 * near) * uv.w;
      uv.y += ripple * 0.004 * uv.w;

      float streak = uStreak * (0.6 + 1.4 * (1.0 - near));
      vec3 acc = vec3(0.0);
      float wsum = 0.0;
      for (int i = -7; i <= 7; i++) {
        float fi = float(i);
        float w = exp(-fi * fi / 22.0);
        vec4 o = uv;
        o.y += fi * streak * uv.w;
        acc += texture2DProj(tDiffuse, o).rgb * w;
        wsum += w;
      }
      vec3 refl = acc / wsum;
      // A single NaN texel here would poison the whole bloom chain.
      if (any(isnan(refl)) || any(isinf(refl))) refl = vec3(0.0);
      refl = min(refl, vec3(60.0));

      float cosT = clamp(v.y, 0.0, 1.0);
      float fres = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
      vec3 deep = vec3(0.004, 0.009, 0.014) + uGlow * 0.02;
      vec3 col = mix(deep, refl, clamp(fres * 1.15, 0.0, 0.92));

      // Moon glitter path.
      vec3 nrm = normalize(vec3(ripple * 0.9, 1.0, (n2 - 0.5) * 0.9));
      vec3 hv = normalize(uMoon + v);
      float spec = pow(max(dot(nrm, hv), 0.0), 380.0);
      col += vec3(0.7, 0.78, 1.0) * spec * 1.4;

      col = applyHaze(col, vec3(0.0), vWorld);
      if (any(isnan(col))) col = vec3(0.0);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

// ---------------------------------------------------------------------------
// Point lights at distance: aviation beacons, street lamps, boats, aircraft.

export function createLightPointsMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      ...hazeUniforms(),
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute vec3 aColor;
      attribute float aPhase;
      attribute float aBlink;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vFade;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec4 mv = viewMatrix * w;
        gl_Position = projectionMatrix * mv;
        float blink = 1.0;
        if (aBlink > 0.5) {
          float ph = fract(uTime / aBlink + aPhase);
          blink = smoothstep(0.0, 0.05, ph) * (1.0 - smoothstep(0.18, 0.4, ph));
        }
        vColor = aColor * blink;
        float d = length(w.xyz - cameraPosition);
        vFade = exp(-d * 0.00035);
        gl_PointSize = clamp(aSize * 420.0 / -mv.z, 1.6, 26.0) * uPixelRatio;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        gl_FragColor = vec4(vColor * a * (0.4 + 0.6 * vFade), a);
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// Fire table flames and holographic marker beams.

export function createFlameMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSeed: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uSeed;
      varying vec2 vUv;
      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
                   mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      void main() {
        vec2 uv = vUv;
        float t = uTime * 1.6 + uSeed * 10.0;
        float n = vnoise(vec2(uv.x * 7.0 + uSeed * 3.0, uv.y * 3.5 - t * 1.4)) * 0.6
                + vnoise(vec2(uv.x * 15.0, uv.y * 7.0 - t * 2.3)) * 0.4;
        float edges = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.82, uv.x);
        float body = edges * (1.0 - uv.y);
        float f = smoothstep(0.18, 0.75, body * 1.25 + (n - 0.5) * 0.9 - uv.y * 0.35);
        vec3 col = mix(vec3(1.0, 0.18, 0.02), vec3(1.0, 0.7, 0.28), f);
        col = mix(col, vec3(1.0, 0.92, 0.7), smoothstep(0.75, 1.0, f));
        gl_FragColor = vec4(col * f * 3.2, f);
      }
    `,
  });
}

export function createBeamMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: color },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float fade = pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.6);
        float bands = 0.65 + 0.35 * step(0.5, fract(vUv.y * 24.0 - uTime * 1.2));
        float a = fade * bands * uOpacity;
        gl_FragColor = vec4(uColor * a * 2.0, a);
      }
    `,
  });
}
