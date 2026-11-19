// Writes public/skills/<set>-<name>.svg for every logo id in app/skill-logos.ts,
// and fails if any skill listed in content/resume.ts has no logo mapped.
// Run with `npm run logos` after changing the skills list or the mapping.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resume } from "../content/resume.ts";
import { skillLogoIds } from "../app/skill-logos.ts";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "skills");

const sets = {
  logos: require("@iconify-json/logos/icons.json"),
  "simple-icons": require("@iconify-json/simple-icons/icons.json"),
  devicon: require("@iconify-json/devicon/icons.json"),
  lucide: require("@iconify-json/lucide/icons.json"),
};

// Launch Deck colours: light text for lifted dark marks, signal cyan for line icons.
const LIGHT = "#eef1f6";
const SIGNAL = "#7fd1ff";

// Marks drawn in near-black that would vanish on the dark tiles. Only these are
// lifted to LIGHT; dark details inside colourful logos (the black "JS" on the
// yellow square) keep their brand colours.
const LIFT = new Set([
  "logos:expo-icon",
  "logos:apple",
  "logos:openai-icon",
  "logos:anthropic-icon",
  "logos:vercel-icon",
  "logos:aws",
  "logos:ollama",
  "logos:langchain-icon",
]);

// Single-colour marks shown in their brand colour (lifted where the official
// shade is too dark for the tile).
const TINT = {
  "simple-icons:pydantic": "#e92063",
  "simple-icons:stripe": "#635bff",
  "logos:mysql-icon": "#5ba3d0",
};

// Multi-colour marks with one thin, dark stroke colour: lighten that colour only.
const SWAP = {
  "logos:java": { "#5382a1": "#7fb0d6" },
};

function luminance(hex) {
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function lookup(set, name) {
  const direct = set.icons[name];
  const alias = set.aliases?.[name];
  const data = direct ?? (alias ? set.icons[alias.parent] : undefined);
  if (!data) return null;
  const pick = (key, fallback) => alias?.[key] ?? data[key] ?? set[key] ?? fallback;
  return { body: data.body, left: pick("left", 0), top: pick("top", 0), width: pick("width", 16), height: pick("height", 16) };
}

function render(id) {
  const [setName, name] = id.split(":");
  const set = sets[setName];
  if (!set) throw new Error(`Unknown icon set in "${id}"`);
  const icon = lookup(set, name);
  if (!icon) throw new Error(`No icon "${name}" in ${setName}`);
  let body = icon.body;
  let rootFill = "";
  if (setName === "lucide") {
    body = body.replaceAll("currentColor", SIGNAL);
  } else if (setName === "simple-icons" || LIFT.has(id) || id in TINT) {
    // Single-colour marks: dark fills and the default (black) fill become LIGHT,
    // or the brand tint where one is listed.
    const color = TINT[id] ?? LIGHT;
    body = body.replace(/#[0-9a-fA-F]{3,8}\b/g, (hex) => (luminance(hex) < 0.08 ? color : hex));
    body = body.replace(/(fill|stroke)="(black|currentColor)"/g, `$1="${color}"`);
    rootFill = ` fill="${color}"`;
  }
  for (const [from, to] of Object.entries(SWAP[id] ?? {})) body = body.replaceAll(from, to);
  const { left, top, width, height } = icon;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${left} ${top} ${width} ${height}"${rootFill}>${body}</svg>\n`;
}

// Every resume skill must have at least one logo.
const skills = resume.skills.flatMap((g) => g.items);
const missing = skills.filter((s) => !(skillLogoIds[s]?.length > 0));
if (missing.length > 0) {
  console.error(`No logo mapped for: ${missing.join(", ")}`);
  process.exit(1);
}
const unused = Object.keys(skillLogoIds).filter((k) => !skills.includes(k));
if (unused.length > 0) console.warn(`Mapped but not on the resume (ignored): ${unused.join(", ")}`);

const ids = [...new Set(skills.flatMap((s) => skillLogoIds[s]))];
mkdirSync(outDir, { recursive: true });
for (const file of readdirSync(outDir)) if (file.endsWith(".svg")) rmSync(join(outDir, file));
for (const id of ids) writeFileSync(join(outDir, `${id.replace(":", "-")}.svg`), render(id));
console.log(`${skills.length} skills, ${ids.length} logo files written to public/skills/`);
