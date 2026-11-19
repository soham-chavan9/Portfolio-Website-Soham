// The only place facts about Soham live. A literal transcription of the SDE
// resume (Soham-Chavan-SDE-Resume), in its order. Every other content file and
// component reads from here; if a claim is not in this file, it does not ship.
//
// Fields that are not resume text are marked UI: short labels for cards and
// highlight readouts. They name or quote something already in the bullet next
// to them and never add a claim of their own.
//
// The phone number on the resume is deliberately left out of the site.

export type Span = { start: string; end: string };

export type Highlight = {
  /** The number exactly as the resume writes it. */
  value: string;
  /** UI: what the number counts, in the resume's own words. */
  label: string;
};

export type Bullet = {
  /** Stable id: cards, 3D pins, and the skills index point at it. */
  id: string;
  /** UI: short card title. */
  label: string;
  /** Verbatim resume bullet. */
  text: string;
  highlight?: Highlight;
};

export type Role = {
  id: string;
  org: string;
  location: string;
  title: string;
  span: Span;
  bullets: Bullet[];
};

export type Project = {
  id: string;
  name: string;
  subtitle: string;
  repo: string;
  span: Span;
  stack: string[];
  bullets: Bullet[];
  /** Cover image from the project's own repo (an image, not a claim). */
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
};

export type School = {
  id: string;
  school: string;
  location: string;
  degree: string;
  span: Span;
  coursework: string[];
};

export type SkillGroup = { id: string; label: string; items: string[] };

export type Resume = {
  name: string;
  headline: string;
  location: string;
  email: string;
  linkedin: string;
  linkedinLabel: string;
  github: string;
  githubLabel: string;
  education: School[];
  skills: SkillGroup[];
  experience: Role[];
  projects: Project[];
};

export const resume: Resume = {
  name: "Soham Chavan",
  /** Set by the SDE variant of the resume. */
  headline: "Software Engineer",
  location: "Boston, MA",
  email: "chavansohamwork@gmail.com",
  linkedin: "https://www.linkedin.com/in/soham-chavan9/",
  linkedinLabel: "linkedin.com/in/soham-chavan9",
  github: "https://github.com/soham-chavan9",
  githubLabel: "github.com/soham-chavan9",

  education: [
    {
      id: "northeastern",
      school: "Northeastern University",
      location: "Boston, MA",
      degree: "M.S. in Information Systems",
      span: { start: "Sep 2024", end: "Dec 2026" },
      coursework: [
        "Program Structures & Algorithms",
        "System Design",
        "Database Management",
        "Prompt Engineering for Generative AI",
      ],
    },
    {
      id: "mumbai",
      school: "University of Mumbai",
      location: "Mumbai, India",
      degree: "B.Tech in Electronics and Telecommunication Engineering",
      span: { start: "Jun 2020", end: "Jul 2023" },
      coursework: [],
    },
  ],

  skills: [
    {
      id: "languages",
      label: "Languages",
      items: ["TypeScript", "JavaScript", "Python", "Swift", "Java", "C++", "SQL"],
    },
    {
      id: "frontend",
      label: "Frontend / Mobile",
      items: [
        "React",
        "React Native",
        "Next.js",
        "Expo (EAS, OTA updates)",
        "Redux Toolkit",
        "Zustand",
        "React Query",
        "Tailwind CSS",
        "HTML/CSS",
        "iOS Swift native modules",
        "Android Play Core",
      ],
    },
    {
      id: "backend",
      label: "Backend / Data",
      items: [
        "Node.js",
        "NestJS",
        "Express.js",
        "FastAPI",
        "REST APIs",
        "WebSockets",
        "JWT",
        "Zod",
        "Pydantic",
        "Winston",
        "MongoDB",
        "Mongoose",
        "MySQL",
        "Redis",
        "Firebase",
      ],
    },
    {
      id: "ai",
      label: "AI / ML",
      items: [
        "OpenAI, Gemini, and Anthropic APIs",
        "LangChain",
        "RAG",
        "FAISS",
        "Ollama (Llama 3.1)",
        "Recombee",
        "promptfoo",
      ],
    },
    {
      id: "cloud",
      label: "Cloud / DevOps",
      items: [
        "AWS (S3, Rekognition)",
        "Docker",
        "GitHub Actions CI/CD",
        "Vercel",
        "TestFlight",
        "App Store Connect",
        "Play Console",
      ],
    },
    {
      id: "testing",
      label: "Testing / Tools",
      items: [
        "Jest",
        "Vitest",
        "Playwright",
        "pytest",
        "Postman",
        "Git",
        "Xcode",
        "Android Studio",
        "Stripe",
        "Twilio",
      ],
    },
  ],

  experience: [
    {
      id: "ourfreedom",
      org: "OurFreedom.ai",
      location: "New York, NY",
      title: "Software Engineering Co-op",
      span: { start: "Jan 2026", end: "Jun 2026" },
      bullets: [
        {
          id: "of-ownership",
          label: "End-to-end ownership",
          text: "Owned features end to end across a React Native/Expo iOS and Android app with 1,000+ downloads and a NestJS/MongoDB backend (~40 modules, ~20 contributors); shipped 110+ commits and coordinated three-week sprint releases.",
          highlight: { value: "1,000+", label: "downloads" },
        },
        {
          id: "of-feed",
          label: "“For You” feed",
          text: "Developed the in-app “For You” feed on Recombee recommendations with Zustand, cursor pagination, infinite scroll, and optimistic updates, increasing time in app ~5%; tracked 7 interaction types with per-post attribution.",
          highlight: { value: "~5%", label: "time in app" },
        },
        {
          id: "of-updates",
          label: "Two-track update system",
          text: "Designed a two-track update system pairing Expo EAS over-the-air updates with native version gating, cutting small-fix delivery from Apple’s ~48-hour review window to ~2 hours; covered version logic with 19 Jest tests.",
          highlight: { value: "~2 hours", label: "small-fix delivery, from ~48 hours" },
        },
        {
          id: "of-releases",
          label: "Store submissions",
          text: "Managed App Store and Google Play submissions across dev, preview, TestFlight, and production builds with zero rejections.",
          highlight: { value: "0", label: "rejections" },
        },
        {
          id: "of-moderation",
          label: "Hybrid image moderation",
          text: "Implemented hybrid image moderation across 5 upload surfaces: a Swift bridge to Apple’s on-device sensitivity analyzer handled most images, with an AWS Rekognition fallback that kept cloud costs low.",
          highlight: { value: "5", label: "upload surfaces" },
        },
        {
          id: "of-messaging",
          label: "Direct messaging",
          text: "Shipped group chats, typing indicators, blocking, search, and reporting for direct messaging.",
        },
        {
          id: "of-safety",
          label: "Age gate and hardening",
          text: "Built a deny-by-default iOS/Android age gate and hardened Apple Sign-In, Stripe, and AdMob/ATT setup.",
        },
      ],
    },
    {
      id: "acn",
      org: "ACN Fiber Pvt Ltd",
      location: "Mumbai, India",
      title: "Software Developer",
      span: { start: "Jun 2023", end: "Jul 2024" },
      bullets: [
        {
          id: "acn-apis",
          label: "Integration APIs",
          text: "Engineered Express.js/TypeScript REST APIs with retry and timeout controls, orchestrating real-time subscriber and billing data for 10,000+ daily active users across third-party telecom and IPTV systems.",
          highlight: { value: "10,000+", label: "daily active users" },
        },
        {
          id: "acn-payments",
          label: "Idempotent payments",
          text: "Implemented idempotent payment webhooks and automated provisioning tied to billing status, ending ~30–40 duplicate-charge complaints a month and preventing half-provisioned accounts.",
          highlight: { value: "~30–40", label: "duplicate-charge complaints a month, ended" },
        },
        {
          id: "acn-serviceability",
          label: "Serviceability API",
          text: "Launched a building and PIN-code serviceability API covering ~1,200 South Mumbai buildings, stopping sales from booking unserviceable installs and cutting failed install visits by 20%.",
          highlight: { value: "20%", label: "fewer failed install visits" },
        },
        {
          id: "acn-errors",
          label: "Error handling",
          text: "Architected centralized error-handling middleware with Winston structured logging and Zod validation on every endpoint, letting on-call engineers diagnose production issues from logs without reproducing bugs locally.",
        },
      ],
    },
  ],

  projects: [
    {
      id: "lumina",
      name: "Lumina",
      subtitle: "HIPAA Privacy Desk",
      repo: "https://github.com/soham-chavan9/lumina",
      span: { start: "Sep 2025", end: "Dec 2025" },
      stack: [
        "Python",
        "FastAPI",
        "LangChain",
        "FAISS",
        "OpenAI GPT-4o-mini",
        "Ollama",
        "Next.js",
        "TypeScript",
        "Docker",
        "GitHub Actions",
      ],
      bullets: [
        {
          id: "lu-rag",
          label: "RAG assistant",
          text: "Built a RAG assistant answering privacy officers’ questions over HIPAA policy PDFs with citations and confidence scores.",
        },
        {
          id: "lu-workflows",
          label: "Compliance workflows",
          text: "Automated 4 compliance workflows, including a 60-day breach notification clock, BAA vendor screening, and policy gap scans, with Pydantic-validated LLM output and statutory fallbacks.",
          highlight: { value: "4", label: "compliance workflows" },
        },
        {
          id: "lu-phi",
          label: "PHI detector",
          text: "Engineered an on-premise PHI detector for 18 HIPAA Safe Harbor identifiers, reaching 100% recall (54/54) with zero false positives on a de-identified control set, keeping patient data away from the LLM.",
          highlight: { value: "100%", label: "recall (54/54)" },
        },
        {
          id: "lu-hardening",
          label: "Hardening and CI",
          text: "Added API-key auth, per-tenant index isolation, rate limiting, prompt-injection guards, and OpenAI-to-Ollama failover; deployed with Docker and Vercel, with CI running 77 tests at 82% coverage.",
          highlight: { value: "82%", label: "coverage" },
        },
      ],
      // From the repo: docs/linkedin-thumbnails/01-cover.jpg
      image: "/projects/lumina.jpg",
      imageWidth: 1600,
      imageHeight: 836,
      alt: "Lumina cover: a cited answer on breach notification beside breach-clock, PHI-scan, patient-access and BAA-screen cards",
    },
    {
      id: "fundflow",
      name: "FundFlow",
      subtitle: "Personal Finance Tracker",
      repo: "https://github.com/soham-chavan9/FundFlow",
      span: { start: "Aug 2024", end: "Present" },
      stack: [
        "TypeScript",
        "JavaScript",
        "Next.js",
        "React",
        "Node.js/Express",
        "MongoDB",
        "Gemini",
        "Redux",
        "Vitest",
        "Playwright",
        "GitHub Actions",
      ],
      bullets: [
        {
          id: "ff-v1",
          label: "v1 with a team",
          text: "Delivered the budget and expense REST APIs and a 9-page Next.js/Redux frontend for v1 in a 4-person Northeastern team.",
        },
        {
          id: "ff-rebuild",
          label: "Solo rebuild",
          text: "Independently rebuilt the app in Next.js 16 and TypeScript, closing auth gaps on 12 endpoints by scoping every MongoDB query to a signed JWT session.",
          highlight: { value: "12", label: "endpoints with auth gaps closed" },
        },
        {
          id: "ff-budgets",
          label: "Pace-based budgets",
          text: "Designed pace-based budgets that flag overspending early, plus integer-cent money math, monthly and yearly reports, injection-safe CSV export, and 5 compound MongoDB indexes.",
        },
        {
          id: "ff-gemini",
          label: "Gemini assistant",
          text: "Added a streaming Gemini assistant that answers from users’ last 3 months of data in 3 languages, with per-user rate limiting and prompt-injection fencing.",
        },
        {
          id: "ff-tests",
          label: "Test suite",
          text: "Wrote 121 Vitest unit tests and Playwright end-to-end security tests (forged cookies, signed-out API calls), run in GitHub Actions on Node 22 and 26 against MongoDB in Docker.",
          highlight: { value: "121", label: "Vitest unit tests" },
        },
      ],
      // From the repo: docs/screenshots/mac-iphone-1920x1080/fundflow-01-overview.jpg
      image: "/projects/fundflow.jpg",
      imageWidth: 1600,
      imageHeight: 900,
      alt: "FundFlow overview on a laptop and a phone: spent, budgeted and left for the month, with budgets by category",
    },
  ],
};

/** "Sep 2024 – Dec 2026" */
export const spanLabel = (s: Span) => `${s.start} – ${s.end}`;

/** A Home readout: a number quoted from one bullet, plus that bullet's id. */
export type Readout = Highlight & { source: string };

/** Home-screen readouts, every value verbatim from the bullet named in `source`. */
export const highlights: Readout[] = [
  { value: "1,000+", label: "app downloads", source: "of-ownership" },
  { value: "~2 hours", label: "small-fix delivery, from ~48 hours", source: "of-updates" },
  { value: "0", label: "store rejections", source: "of-releases" },
  { value: "10,000+", label: "daily active users", source: "acn-apis" },
];

/** The role and bullet an experience bullet id belongs to. */
export function bulletSource(id: string): { role: Role; bullet: Bullet } | null {
  for (const role of resume.experience) {
    const bullet = role.bullets.find((b) => b.id === id);
    if (bullet) return { role, bullet };
  }
  return null;
}

export const currentRole = resume.experience[0];
export const currentSchool = resume.education[0];
