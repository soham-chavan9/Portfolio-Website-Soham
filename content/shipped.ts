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
      "A Swift bridge to Apple's SCSensitivityAnalyzer with an AWS Rekognition fallback, private S3 staging, magic-byte validation, and SHA-256 result caching across five upload surfaces.",
    stack: ["React Native", "Swift", "NestJS", "AWS Rekognition", "S3"],
    platforms: ["ios", "android", "server"],
    slug: "on-device-moderation",
  },
  {
    title: "Two-track release and update system",
    when: "Jan 2026 to Jun 2026",
    where: "OurFreedom.ai",
    summary:
      "Expo EAS over-the-air updates plus native version gating driven by backend thresholds, with channel-pinned publishing, runtime fingerprinting, and 19 Jest unit tests.",
    stack: ["React Native", "Expo", "EAS", "Play Core", "Jest"],
    platforms: ["ios", "android"],
    slug: "release-pipeline",
  },
  {
    title: "Recombee-powered For You feed",
    when: "Jan 2026 to Jun 2026",
    where: "OurFreedom.ai",
    summary:
      "A Zustand feed store with cursor pagination, infinite scroll, and optimistic updates, plus privacy-safe tracking of seven interaction types with per-post attribution.",
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
    title: "Lumina, AI Compliance Q&A Assistant",
    when: "Sep 2025 to Dec 2025",
    where: "Northeastern",
    summary:
      "An end-to-end RAG pipeline with PDF upload, chunking, embeddings, FAISS vector search, top-k retrieval, and source-cited answers.",
    stack: ["Next.js", "TypeScript", "FastAPI", "LangChain", "FAISS", "GPT-4o-mini"],
    platforms: ["web"],
  },
  {
    title: "Fund Flow, Full-Stack Personal Finance App",
    when: "Aug 2024 to Dec 2024",
    where: "Northeastern",
    summary:
      "Expense, budget, and shopping-list workflows with ECharts dashboards, a Gemini insights assistant, real-time collaboration, EmailJS alerts, and i18next.",
    stack: ["React", "Next.js", "Redux", "Express", "MongoDB", "Gemini"],
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
      "Express.js and TypeScript REST APIs moving real-time customer data for 10,000+ daily active users, with Zod-validated contracts and Winston-logged error handling.",
    stack: ["Express.js", "TypeScript", "Axios", "Zod", "Winston"],
    platforms: ["server"],
  },
];
