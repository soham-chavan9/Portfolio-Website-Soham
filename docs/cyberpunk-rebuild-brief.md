# Cyberpunk rebuild: unattended run brief

Written 2026-11-19 17:40 EST. Scheduled run starts 19:05 EST, after the token reset.
Owner: Soham Chavan. He is away for the whole run: never wait on him, never ask him anything.
If something is unclear, pick the sensible default, note it in the report, and keep going.

## Switches (edit these lines only)

- ALLOW_CC0_MODEL_DOWNLOADS: no
  (no = build the character yourself in Blender; yes = you may also download a CC0-licensed
  character or texture from a reputable CC0 source such as Quaternius, Poly Haven or Kenney,
  record its source URL and license in the report, and put it in its own new folder)

## Goal

1. Delete the current 3D operator model and build a new one.
2. Take the whole lobby "to the next level": an original cyberpunk look and feel.
3. Use work by top creators on the web as reference (techniques, composition, lighting,
   motion), never as a source of copied assets.

## Repo facts

- Path: `/Users/sohamchavan/Desktop/Claude/portfolio-website/Portfolio-Website-Soham`
- Branch: `update/lobby-content`, with many uncommitted changes. They are Soham's work. Keep them.
- Safety snapshot of the full working tree (tracked and untracked) at 17:38:
  branch `backup/pre-cyberpunk-2026-11-19` (commit `be58e70`). Working tree, index and
  current branch were not changed by it.
- Stack: Next.js 16 (read `AGENTS.md`: check `node_modules/next/dist/docs/` before writing
  Next code), React 19, three 0.187, @react-three/fiber 9, drei 10, postprocessing.
- Dev server: `.claude/launch.json` config `dev` (port 3000). Use the preview tools, not Bash.
- Blender 5.3 is installed at `/opt/homebrew/bin/blender`. Run it headless:
  `blender -b --python scripts/blender/<script>.py`.
- Lobby code: `app/_lobby/` (scene in `scene/`, HUD in `hud/`, styles in `lobby.css`,
  state in `store.ts`, boot checklist in `boot-progress.ts`, sound in `audio.ts`).
- Current operator: `app/_lobby/scene/operator.tsx` loads `public/operator/soham.glb` and
  projects `soham-albedo.webp` and `soham-face.webp` onto it. `scene.tsx` imports it;
  it exports `OPERATOR_YAW`, which the camera framing uses (check `rig.tsx`).
- `content/scene.ts` uses `/operator/soham-avatar.jpg` for the HUD identity card. Keep that file.
- Reference photos of Soham: `public/soham-chavan.png`, `public/operator/soham-avatar.jpg`.
- `docs/redesign-plan.md` is the earlier plan. Cyberpunk replaces its "Launch Deck" theme.
  Its North-star rules 1 and 2 still hold: every fact comes from the resume
  (`content/resume.ts`, do not change facts), and labels stay plain English
  (Home, Experience, Projects, Skills, Education, Contact).

## Hard rules

- Git: no commits on `update/lobby-content` or `main`, no push, no PR, no branch switch,
  no `git reset`, `git checkout -- <path>`, `git stash`, `git clean` or anything else that can
  discard work. Leave all changes uncommitted for Soham to review.
- Checkpoints: after each phase, save a snapshot ref without touching the working tree:
  ```bash
  cd /Users/sohamchavan/Desktop/Claude/portfolio-website/Portfolio-Website-Soham
  IDX="$TMPDIR/cp-index"; cp .git/index "$IDX"; GIT_INDEX_FILE="$IDX" git add -A
  T=$(GIT_INDEX_FILE="$IDX" git write-tree); rm "$IDX"
  C=$(git commit-tree "$T" -p HEAD -m "Cyberpunk checkpoint: <phase>")
  git branch -f backup/cyberpunk-checkpoint-<n> "$C"
  ```
- Originality: an original cyberpunk world. Do not recreate any existing game, film or
  franchise (no Cyberpunk 2077, Blade Runner, Ghost in the Shell, Deus Ex, etc.): no logos,
  characters, signage text, UI layouts or brand fonts from them.
- Downloads: npm packages from the npm registry only if clearly needed (keep it to one or
  two). Fonts through `next/font/google`. 3D models or textures from the web only when the
  switch above says yes. Reading web pages for research is fine.
- Keep it working: boot checklist must still settle (see below), all six tabs and panels,
  markers, camera rig, keyboard and controller navigation, quality tiers, the classic page
  link, and `prefers-reduced-motion` must keep working. No console errors.
- Performance: keep the quality tiers in `scene.tsx`. Low tier must stay smooth on a
  laptop iGPU. New character GLB under 3 MB. Total new public assets under 8 MB.
- Hooks: if a "Fact-Forcing Gate" hook blocks Bash, state the two facts it asks for and retry.

## Phases

### 0. Baseline (short)

Check the backup branch exists. If the working tree changed since `be58e70`, take one more
snapshot as `backup/pre-cyberpunk-2026-11-19b`. Start the dev server, take desktop and
mobile screenshots of the current lobby, save them to `docs/cyberpunk-shots/before-*.png`.

### 1. Research (about 20 minutes, then move on)

Use WebSearch (standard mode first) and read pages. Look at: Awwwards and FWA winners with
three.js or WebGL cyberpunk / neon-city scenes, Bruno Simon, Lusion, Active Theory,
Codrops tutorials (neon city, rain, wet reflections, glitch, holograms), three.js journey,
pmndrs examples (react-three-fiber), and stylized cyberpunk character design (ArtStation,
Sketchfab top-rated stylized characters) for silhouette, materials and lighting ideas.
Write 10 to 20 short findings (technique, where seen, how we use it) under "Research notes"
at the end of this file.

### 2. New operator character

- Delete `public/operator/soham.glb`, `soham-albedo.webp`, `soham-face.webp`, and the old
  implementation in `operator.tsx` (rewrite the file; keep its export names that other files
  import, such as the default export and `OPERATOR_YAW`).
- Build the new character in Blender with a Python script at
  `scripts/blender/build-operator.py` (checked in, re-runnable), exporting
  `public/operator/operator.glb`. Stylized, original cyberpunk "netrunner" that reads as
  Soham (hair, skin tone, build taken from his photos), not photoreal: stylized avoids the
  uncanny look of the old photo projection. Ideas: techwear jacket with emissive piping,
  AR visor or glasses, wrist deck or holographic forearm display, cables, boots, a clean
  readable silhouette from the lobby camera distance.
- Give it an armature and real animation clips (idle breathing and weight shift, head
  follows the pointer, a short gesture when a tab opens). Play them with `useAnimations`.
- Emissive parts should feed bloom. Add a subtle hologram flicker or scanline on emissive
  trims only.
- Boot checklist: the new loader must call `reportBoot("character", ...)` with real progress
  and `failBoot("character")` on error. If the character has no separate textures, settle
  the `textures` task (`reportBoot("textures", 1)` once materials are ready) so boot never
  hangs. Check `hud/boot.tsx` for how tasks are shown.
- Check the camera framing in `rig.tsx` still frames the new character in every shot.

### 3. World pass (cyberpunk city)

City, traffic, balcony, landmarks, sky, water, markers, skills globe, post-processing:
neon signage and holographic billboards (original text only: Soham's name, plain tab labels,
or abstract glyphs), rain with streaks and wet reflective surfaces, haze and volumetric
light shafts, steam vents, flying-car light trails in `traffic.tsx`, neon trim and cables
on the balcony, a cyberpunk re-skin of the skills globe, post FX (bloom, chromatic
aberration, film grain, scanlines; a short glitch on transitions). Reduced motion turns off
glitch, flicker and rain motion. Low tier drops the costly effects.

### 4. HUD and UI pass

`lobby.css`, `hud/*`: cyberpunk terminal UI. Angular clipped panel corners, thin neon
borders, glitch or decode text reveals on panel open, a defined palette (one primary neon,
one secondary, one warning color, dark base; put them in CSS variables), a display font and
a mono font from Google Fonts (avoid Orbitron; try Chakra Petch, Rajdhani, Share Tech Mono,
JetBrains Mono, or similar). Boot screen becomes a "jack-in" sequence that still shows the
real loading tasks. Update `audio.ts` toward a synth / rain ambience if it fits. Text must
stay readable (WCAG AA contrast) and labels plain.

### 5. Classic page (only if time is left)

Light cyberpunk accents on `app/classic/page.tsx` while keeping it plain and readable.

### 6. Verify

`npx tsc --noEmit` and `npm run build` must pass. In the preview: no console errors, boot
completes, every tab opens, markers work, mobile width works, reduced motion works.
Save `docs/cyberpunk-shots/after-*.png` (desktop and mobile, at least 4 shots).

### 7. Report

Write `docs/cyberpunk-rebuild-report.md`: what changed (by file), the research references
used, screenshots, anything skipped or not verified, known issues, and how to undo:
the full pre-run state is on `backup/pre-cyberpunk-2026-11-19`; to restore one file,
`git checkout backup/pre-cyberpunk-2026-11-19 -- <path>`.

## Research notes

See the References section of `docs/cyberpunk-rebuild-report.md`.
