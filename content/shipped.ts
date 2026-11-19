export type Platform = "ios" | "android" | "server" | "web";

export type ShippedItem = {
  title: string;
  when: string;
  where: string;
  summary: string;
  stack: string[];
  platforms?: Platform[];
  slug?: string;
};

export const shipped: ShippedItem[] = [
  {
    title: "On-device image moderation",
    when: "Jan 2026 to Jun 2026",
    where: "OurFreedom.ai",
    summary:
      "A Swift bridge to Apple's SCSensitivityAnalyzer screens most images on the device, with an AWS Rekognition fallback that keeps cloud costs low, private S3 staging, magic-byte validation, and SHA-256 result caching across five upload surfaces.",
    stack: ["React Native", "Swift", "NestJS", "AWS Rekognition", "S3"],
    platforms: ["ios", "android", "server"],
    slug: "on-device-moderation",
  },
  {
    title: "Two-track release and update system",
    when: "Jan 2026 to Jun 2026",
    where: "OurFreedom.ai",
    summary:
      "Expo EAS over-the-air updates plus native version gating driven by backend thresholds, cutting small-fix delivery from Apple's roughly 48-hour review window to about 2 hours, with 19 Jest unit tests.",
    stack: ["React Native", "Expo", "EAS", "Play Core", "Jest"],
    platforms: ["ios", "android"],
    slug: "release-pipeline",
  },
  {
    title: "Recombee-powered For You feed",
    when: "Jan 2026 to Jun 2026",
    where: "OurFreedom.ai",
    summary:
      "A Zustand feed store with cursor pagination, infinite scroll, and optimistic updates that raised time in app about 5%, plus privacy-safe tracking of seven interaction types with per-post attribution.",
    stack: ["React Native", "Zustand", "Recombee", "TypeScript"],
    platforms: ["ios", "android"],
    slug: "recommendation-feed",
  },
  {
    title: "Direct messaging with safety built in",
    when: "Jan 2026 to Jun 2026",
    where: "OurFreedom.ai",
    summary:
      "A conversation reporting model, four new endpoints, and unread aggregation, with a rebuilt client for group chats, typing indicators, blocking, and search.",
    stack: ["React Native", "NestJS", "MongoDB"],
    platforms: ["ios", "android", "server"],
    slug: "direct-messaging",
  },
  {
    title: "Lumina, HIPAA Privacy Desk",
    when: "Sep 2025 to Dec 2025",
    where: "Northeastern",
    summary:
      "A cited RAG assistant over HIPAA policy PDFs with four automated compliance workflows and an on-premise PHI detector at 100% recall, deployed with Docker and Vercel and 77 tests at 82% coverage.",
    stack: ["Python", "FastAPI", "LangChain", "FAISS", "Ollama", "Next.js", "Docker"],
    platforms: ["web", "server"],
  },
  {
    title: "FundFlow, Personal Finance Tracker",
    when: "Aug 2024 to Present",
    where: "Northeastern",
    summary:
      "Pace-based budgets, JWT-scoped MongoDB queries, and a streaming Gemini assistant in 3 languages, rebuilt in Next.js 16 and covered by 121 Vitest tests and Playwright security tests.",
    stack: ["TypeScript", "Next.js", "MongoDB", "Gemini", "Vitest", "Playwright"],
    platforms: ["web"],
  },
  {
    title: "TaskTreak, AI-Enhanced Task Manager",
    when: "Dec 2024 to Feb 2025",
    where: "Northeastern",
    summary:
      "A JavaFX desktop task manager with SQLite persistence, JDBC data access, and OpenAI-assisted scheduling.",
    stack: ["Java", "JavaFX", "SQLite", "JDBC", "OpenAI API"],
  },
  {
    title: "Telecom integration APIs",
    when: "Jun 2023 to Jul 2024",
    where: "ACN Fiber, Mumbai",
    summary:
      "Express.js and TypeScript REST APIs moving real-time subscriber and billing data for 10,000+ daily active users, idempotent payment webhooks that ended duplicate charges, and a serviceability API that cut failed install visits by 20%.",
    stack: ["Express.js", "TypeScript", "Zod", "Winston"],
    platforms: ["server"],
  },
];
