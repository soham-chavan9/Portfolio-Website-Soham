// One logo (or a few) per skill in content/resume.ts. Ids are "set:name" in
// the Iconify sets installed as dev dependencies; `npm run logos` writes each
// one to public/skills/<set>-<name>.svg and fails if a resume skill is missing
// here. Brand marks come from "logos" (CC0), then "simple-icons" (CC0) or
// "devicon" (MIT). Skills with no brand mark of their own use a "lucide" (ISC)
// line icon, drawn in the signal colour so they read as one family.

export const skillLogoIds: Record<string, string[]> = {
  // Languages
  TypeScript: ["logos:typescript-icon"],
  JavaScript: ["logos:javascript"],
  Python: ["logos:python"],
  Swift: ["logos:swift"],
  Java: ["logos:java"],
  "C++": ["logos:c-plusplus"],
  SQL: ["lucide:database"],

  // Frontend / Mobile
  React: ["logos:react"],
  "React Native": ["logos:react"],
  "Next.js": ["simple-icons:nextdotjs"],
  "Expo (EAS, OTA updates)": ["logos:expo-icon"],
  "Redux Toolkit": ["logos:redux"],
  Zustand: ["devicon:zustand"],
  "React Query": ["logos:react-query-icon"],
  "Tailwind CSS": ["logos:tailwindcss-icon"],
  "HTML/CSS": ["logos:html-5", "logos:css-3"],
  "iOS Swift native modules": ["logos:apple"],
  "Android Play Core": ["logos:android-icon"],

  // Backend / Data
  "Node.js": ["logos:nodejs-icon"],
  NestJS: ["logos:nestjs"],
  "Express.js": ["simple-icons:express"],
  FastAPI: ["logos:fastapi-icon"],
  "REST APIs": ["lucide:braces"],
  WebSockets: ["lucide:arrow-left-right"],
  JWT: ["logos:jwt-icon"],
  Zod: ["logos:zod"],
  Pydantic: ["simple-icons:pydantic"],
  Winston: ["lucide:scroll-text"],
  MongoDB: ["logos:mongodb-icon"],
  Mongoose: ["simple-icons:mongoose"],
  MySQL: ["logos:mysql-icon"],
  Redis: ["logos:redis"],
  Firebase: ["logos:firebase-icon"],

  // AI / ML
  "OpenAI, Gemini, and Anthropic APIs": ["logos:openai-icon", "logos:google-gemini-icon", "logos:anthropic-icon"],
  LangChain: ["logos:langchain-icon"],
  RAG: ["lucide:file-search"],
  FAISS: ["lucide:radar"],
  "Ollama (Llama 3.1)": ["logos:ollama"],
  Recombee: ["lucide:sparkles"],
  promptfoo: ["lucide:flask-conical"],

  // Cloud / DevOps
  "AWS (S3, Rekognition)": ["logos:aws"],
  Docker: ["logos:docker-icon"],
  "GitHub Actions CI/CD": ["logos:github-actions"],
  Vercel: ["logos:vercel-icon"],
  TestFlight: ["lucide:plane"],
  "App Store Connect": ["logos:apple-app-store"],
  "Play Console": ["logos:google-play-console-icon"],

  // Testing / Tools
  Jest: ["logos:jest"],
  Vitest: ["logos:vitest"],
  Playwright: ["logos:playwright"],
  pytest: ["devicon:pytest"],
  Postman: ["logos:postman-icon"],
  Git: ["logos:git-icon"],
  Xcode: ["logos:xcode"],
  "Android Studio": ["devicon:androidstudio"],
  Stripe: ["simple-icons:stripe"],
  Twilio: ["logos:twilio-icon"],
};

/** Public paths of a skill's logo files; empty when the skill has none mapped. */
export function skillLogos(skill: string): string[] {
  return (skillLogoIds[skill] ?? []).map((id) => `/skills/${id.replace(":", "-")}.svg`);
}

/** Line icons stand in for skills without a brand mark. */
export const isConceptLogo = (src: string) => src.startsWith("/skills/lucide-");
