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
      "A custom Swift module around Apple's SCSensitivityAnalyzer, backed by AWS Rekognition and SHA-256 verdict caching.",
    stack: ["React Native", "Swift", "NestJS", "AWS Rekognition"],
    platforms: ["ios", "android", "server"],
    slug: "on-device-moderation",
  },
  {
    title: "Release pipeline for a production React Native app",
    when: "Jan 2026 to Jun 2026",
    where: "OurFreedom.ai",
    summary:
      "Store builds and over-the-air updates from one pipeline, with runtime fingerprinting and backend version checks.",
    stack: ["React Native", "Expo", "expo-updates", "EAS"],
    platforms: ["ios", "android"],
    slug: "release-pipeline",
  },
  {
    title: "Direct messaging with safety built in",
    when: "Jan 2026 to Jun 2026",
    where: "OurFreedom.ai",
    summary:
      "Conversation reports, unread aggregation, mark-as-read APIs, group DMs, adaptive polling, and mobile report/block flows.",
    stack: ["React Native", "NestJS", "MongoDB"],
    platforms: ["ios", "android", "server"],
    slug: "direct-messaging",
  },
  {
    title: "Lumina, AI Compliance Assistant",
    when: "Sep 2025 to Dec 2025",
    where: "Northeastern",
    summary:
      "A cited-answer compliance assistant with PDF ingestion, chunking, FAISS retrieval, fuzzy matching, and empty-response fallbacks.",
    stack: ["Python", "FastAPI", "LangChain", "FAISS", "OpenAI", "Next.js"],
    platforms: ["web"],
  },
  {
    title: "FundFlow, AI Finance Tracker",
    when: "Aug 2024 to Dec 2024",
    where: "Northeastern",
    summary:
      "Expense, budget, and shopping-list CRUD with an ECharts dashboard, a Gemini assistant, alerts, and i18next.",
    stack: ["React", "Next.js", "Redux", "MongoDB", "JWT", "Gemini"],
    platforms: ["web"],
  },
  {
    title: "TaskTreak, AI-Enhanced Task Manager",
    when: "Dec 2024 to Feb 2025",
    where: "Northeastern",
    summary:
      "A JavaFX task manager with SQLite persistence, JDBC data access, and OpenAI-assisted scheduling.",
    stack: ["Java", "JavaFX", "SQLite", "JDBC", "OpenAI API"],
    platforms: ["web"],
  },
  {
    title: "Telecom integration APIs",
    when: "Jun 2023 to Jul 2024",
    where: "ACN Fiber, Mumbai",
    summary:
      "Express.js REST APIs integrating third-party telecom services for 10,000+ daily users, with standardized request, response, and error contracts.",
    stack: ["Express.js", "Node", "REST APIs", "Telecom"],
    platforms: ["server"],
  },
];
