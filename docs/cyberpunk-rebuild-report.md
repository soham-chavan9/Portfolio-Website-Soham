# Cyberpunk rebuild report (2026-11-19)

Status: **done and checked in a browser**, not committed. `npx tsc --noEmit` is clean and
`npm run build` passes. The lobby was run in the dev server at desktop (1440x900) and mobile
(375x812) sizes with no runtime console errors. Everything is uncommitted on
`update/lobby-content` for you to review.

The work ran in two passes:

1. **The scheduled 7:05 PM run.** It stopped after about 7 minutes. It wrote a first
   primitive-based character, rain, recolored lights and the HUD palette, but it could not open
   the browser and skipped the research.
2. **A second pass from the original session (7:50 to 8:15 PM).** It did the research, rebuilt
   the character properly, fixed the traffic, added billboards and balcony neon, and checked
   everything in a browser.

## Screenshots

`docs/cyberpunk-shots/`:

- **Lobby:** `after-home-desktop.jpg`, `after-experience-desktop.jpg`,
  `after-skills-desktop.jpg`, `after-contact-desktop.jpg`, `after-home-mobile.jpg`,
  `after-boot-mobile.jpg`.
- **Character renders from Blender** (`operator/`, flat workbench shading, no neon glow):
  `operator-rest-front.png`, `operator-idle-front.png`, `operator-idle-three-quarter.png`,
  `operator-idle-back.png`, `operator-face.png`, `operator-gesture-front.png`.
- **No "before" shots of the live site.** The old model was already deleted when screenshots
  became possible. The old version is on branch `backup/pre-cyberpunk-2026-11-19`; see "How to
  undo" below to view it.

## References (techniques, not assets)

- **Giulio Collesei, "They Call Me Giulio: The Making of a Cinematic Cyberpunk Portfolio",
  Codrops, April 2026**
  (https://tympanus.net/codrops/2026/04/14/they-call-me-giulio-the-making-of-a-cinematic-cyberpunk-portfolio/).
  Ideas taken from it:
  - Flying cars as one InstancedMesh of about 100 simple hulls on CatmullRom spline lanes
    between the towers. Used in `traffic.tsx`.
  - An avatar that reacts when you hover it. The operator already looks up on hover and pointer
    movement, and this was kept.
  - Rain and traffic drawn as instanced meshes to keep draw calls low.
  - RGB split on transitions. Already on the high tier; added to button hovers in the HUD.
  - A rigged Blender character whose actions are exported as glTF clips and played with an
    AnimationMixer.
- **Stylized game-character practice** (rim lighting with two rim lights for a complex
  silhouette, techwear with neon piping): a cool key light and a magenta rim light now sit on
  the character, plus a small visor-glow fill on the face.
- **Not copied:** no assets, logos, characters, sign text or UI from any film, game or
  franchise. All sign text is original: "SOHAM", "SC", "CODE", "ONLINE 24 / 7", and abstract
  glyphs.

## What changed

### Character (new)

**`scripts/blender/build-operator.py`** (rewritten, re-runnable) builds a stylized, original
netrunner of you:

- **Body:** one continuous surface made by running a vertex skeleton through Blender's Skin
  modifier, then subdividing twice. Joints bend smoothly instead of the earlier separate
  primitives.
- **Rig:** modelled in an A-pose and weighted with bone-heat automatic weights (0 unweighted
  vertices). Clothing layers copy the body's weights with a Data Transfer modifier: the long
  coat skirt, high collar, belt and neon piping. Rigid parts follow one bone each: head, hair,
  visor, gloves, boots and wrist deck.
- **Head:** a sculpted-by-function head with jaw, chin, nose, brow and a neutral mouth line.
- **Hair:** black, built as the head shape pushed out above a hairline, plus tapered strands
  for the swept-up quiff.
- **Outfit and gear:** cyan AR visor with a magenta edge, earpiece, high-collar techwear jacket,
  long coat with cyan piping and a magenta hem light, chest strap, sleeve stripes, left
  shoulder plate, wrist deck with a hologram, cyan seam rings on the right forearm, gloves,
  boots with neon soles, and neck-implant lights.
- **Neon placement:** piping is drawn as ribbons shrink-wrapped onto the body, so it hugs the
  surface.
- **Clips:** `idle` (4 s loop: breathing, weight shift, relaxed arms) and `gesture` (2.4 s:
  right-hand wave while the left arm raises the wrist deck).
- **Size:** 26.7k triangles, 13 materials, 1.0 MB GLB.
- **To rebuild:** `/opt/homebrew/bin/blender -b --python scripts/blender/build-operator.py`.
  Add `-- --preview <dir>` for PNG renders.

**Files:**

- **Model:** the new model is `public/operator/operator.glb`. The old `soham.glb`,
  `soham-albedo.webp` and `soham-face.webp` are deleted. `soham-avatar.jpg` is kept for the
  identity card.
- **`app/_lobby/scene/operator.tsx`:**
  - **Animation:** plays `idle`; plays `gesture` on emote (click him, or press G).
  - **Head:** follows the pointer and camera, turning relative to its rest pose.
  - **Neon:** trims pulse and the hologram flickers.
  - **Lighting:** brighter environment reflections on the suit, a cool key spotlight, a magenta
    rim spotlight and a visor-glow fill on the face.
  - **Boot screen:** reports real progress for the `character` and `textures` steps.

### World

- **`traffic.tsx`:** flying cars now ride four looping CatmullRom skyway lanes at different
  heights, with short light trails along their heading. 72 cars on the high tier, 28 on low.
  They stop under reduced motion. This replaces the long straight laser-like streaks.
- **`billboards.tsx`** (new): holographic billboards on the skyline.
  - **Placement:** 22 signs on the high tier, 12 on low. They hang on the tallest in-view towers
    across the river, on the face that looks toward the balcony.
  - **Look:** six original designs drawn to canvas, shown through an additive shader with
    scanlines, a slow roll and a rare flicker or tear. All of that motion is off under reduced
    motion.
- **`city.tsx`:** the generated skyline is cached and shared (`cityBuildings()`), so the
  billboards hang on the same towers. Mounts `<Billboards />`.
- **`balcony.tsx`:**
  - Magenta light-pipes on the glass railing edges and a cyan neon tube under the cap rail.
  - A cyan base strip, a violet interior and magenta lamps.
  - Violet backlight on the slat wall.
  - Rain-wet floor tiles: lower roughness, so the neon reflects in them.
- **`skills-globe.tsx`:** cyan structure with a magenta outer orbit ring.
- **From the 7:05 PM run, unchanged here:**
  - **`shaders.ts`:** violet sky, magenta glow, neon windows.
  - **`rain.tsx` and `scene.tsx`:** cyan rain, neon lights, stronger bloom, and on the high
    tier chromatic aberration, scanlines and a short glitch on screen changes.

### HUD

- **From the 7:05 PM run:**
  - **Palette tokens in `lobby.css`:** cyan `#19f3ff`, magenta `#ff2bd6`, amber `#ffd22e`,
    base `#07030f`.
  - **Fonts in `app/page.tsx`:** Chakra Petch and Share Tech Mono.
  - **Effects:** scanline overlay, decode-in headings and a jack-in boot screen.
- **This pass, `lobby.css`:**
  - The neon panel glow now targets only `.lb-panel` and `.card`. The earlier
    `[class*="panel"]` selector also restyled inner parts like `.panel-head`.
  - Buttons get a short RGB-split glitch on hover (off under reduced motion), and the primary
    button glows.
- **Unchanged:** resume facts in `content/resume.ts` and the plain tab labels.

## Not done or not verified

- **Reduced motion:** the code paths are in place, but it was not checked in a browser with
  the OS setting turned on.
- **Low quality tier:** smoothness was not measured. Billboards add about 12 draw calls on low
  and 22 on high.
- **Classic page (`app/classic/page.tsx`):** not restyled.
- **Sound (`audio.ts`):** no synth or rain ambience added.
- **Before screenshots:** none of the live site (see above).

## Known issues

- **Face lighting:** the face still reads dark in wide shots. It's clear in the Blender close-up
  (`operator-face.png`). If you want it brighter, raise the key spotlight in `operator.tsx` or
  lighten `skin` in the Blender palette.
- **Coat:** the skirt copies leg weights, so on a big leg move it would stretch. The idle and
  gesture clips barely move the legs.
- **Shared dev server:** another dev server (PID 65859, port 3000) was already running in this
  folder and was used for testing. The production build ran while it was up and passed.

## How to undo

- **Full pre-run state:** branch `backup/pre-cyberpunk-2026-11-19` (commit `be58e70`). Your
  later commit `29ef517` has the same content.
- **Checkpoints from the 7:05 PM run:** `backup/cyberpunk-checkpoint-1` and
  `backup/cyberpunk-checkpoint-2`.
- **Finished state of this pass:** `backup/cyberpunk-checkpoint-3`.
- **Restore one file:** `git checkout backup/pre-cyberpunk-2026-11-19 -- <path>`. The old model
  can be restored the same way, for example `public/operator/soham.glb`.
- **Nothing was committed, pushed or switched.**
