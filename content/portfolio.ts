export type Fact = {
  label: string;
  value: string;
};

export type FeaturedSystem = {
  id: string;
  label: string;
  title: string;
  intro: string;
  bullets: string[];
  steps?: {
    title: string;
    detail: string;
    note: string;
  }[];
  facts?: Fact[];
};

export const featuredWork = {
  title: "OurFreedom.ai",
  summary:
    "OurFreedom.ai is a paid platform that keeps families connected to incarcerated loved ones. I led both the backend and the mobile app, and these are three systems I designed and shipped.",
  role:
    "Tech lead and maintainer across a NestJS and MongoDB backend and a React Native and Expo app for iOS and Android. I merge the release line, run code review for about 20 contributors, and own everything between a schema change and a store release.",
  facts: [
    { label: "Role", value: "Full-stack engineer, tech lead" },
    { label: "Timeline", value: "Jan 2026 to Jun 2026" },
    { label: "Team", value: "About 20 contributors" },
    { label: "Stack", value: "NestJS, MongoDB, Expo, Swift" },
  ] satisfies Fact[],
  systems: [
    {
      id: "moderation",
      label: "Image moderation",
      title: "Screening sensitive images before anyone sees them",
      intro:
        "Families send photos through posts, profiles, uploads, and physical mail. Every image needs screening, but sending all of them to the cloud is slow and costly.",
      bullets: [
        "A custom Swift native module wraps Apple's on-device SCSensitivityAnalyzer, so most checks never leave the phone.",
        "The backend falls back to AWS Rekognition, with an S3 staging lifecycle that holds files until they pass.",
        "SHA-256 content hashing means the same image is never scanned twice.",
      ],
      steps: [
        {
          title: "Hash and check cache",
          note: "SHA-256 content hash",
          detail:
            "The client computes a SHA-256 hash of the image. If this exact content was already judged, the cached verdict is reused and nothing else runs.",
        },
        {
          title: "On-device analysis",
          note: "Swift native module, iOS",
          detail:
            "On supported iOS devices, the Swift module asks Apple's SCSensitivityAnalyzer for a verdict locally. It is fast and private, and the image never leaves the phone.",
        },
        {
          title: "Backend fallback",
          note: "NestJS, S3 staging, Rekognition",
          detail:
            "When the device cannot decide, or the platform does not support it, the file goes to an S3 staging bucket and a NestJS module sends it to AWS Rekognition.",
        },
        {
          title: "Publish or block",
          note: "Posts, profiles, uploads, mail",
          detail:
            "Approved files are promoted out of staging and published; flagged ones are blocked. The verdict is cached against the hash for next time.",
        },
      ],
    },
    {
      id: "release",
      label: "Release pipeline",
      title: "Getting fixes to users without waiting on review",
      intro:
        "Some fixes can ship over the air in minutes, and others need a new store build. I designed a two-track pipeline so each change takes the right path, and so outdated apps are handled safely.",
      bullets: [
        "Expo OTA on iOS and Android, runtime-fingerprinted so an update only lands on compatible builds.",
        "Google Play in-app updates and App Store deep links for native changes.",
        "A backend force-update protocol, GET /api/app-version, read by the useAppUpdate and useNativeVersionCheck hooks.",
        "Channel-pinned publish scripts keep local env values out of production bundles, with runbooks for every path.",
      ],
      steps: [
        {
          title: "Change merged to release line",
          note: "Reviewed and merged by me",
          detail:
            "Every release change starts with review and a controlled merge path, so production code and production configuration stay aligned.",
        },
        {
          title: "Route the change",
          note: "OTA for JavaScript, EAS for native",
          detail:
            "JavaScript-only changes move through Expo OTA on pinned channels. Native changes go through EAS build, TestFlight, and store submission.",
        },
        {
          title: "App checks its version",
          note: "GET /api/app-version on launch",
          detail:
            "The client asks the backend which versions are supported, recommended, or blocked before users get too far into the app.",
        },
        {
          title: "Update, prompt, or force",
          note: "Play in-app update or App Store link",
          detail:
            "Users get the right update path for their platform and build: continue, prompt, or force update when a build is no longer safe.",
        },
      ],
    },
    {
      id: "messaging",
      label: "Direct messaging",
      title: "Messaging with safety built in",
      intro:
        "I shipped the Direct Messaging subsystem across both halves of the stack, with reporting and blocking designed in from the start rather than bolted on.",
      bullets: [
        "Extended conversations with a ConversationReport entity and four new endpoints.",
        "Per-user unread aggregation and a mark-as-read API.",
        "Rebuilt the client around 1:1 and group DMs with adaptive polling, typing indicators, global search, and post sharing.",
        "Also rewrote the username and handle system across profiles and follows, with report, block, and search on mobile.",
      ],
      facts: [
        { label: "New entity", value: "ConversationReport" },
        { label: "New endpoints", value: "4" },
        { label: "Conversation types", value: "1:1 and group" },
        { label: "Updates", value: "Adaptive polling" },
        { label: "Safety", value: "Report and block" },
        { label: "Discovery", value: "Global search" },
      ],
    },
  ] satisfies FeaturedSystem[],
};

export const experience = [
  {
    when: "Jan 2026 to Jun 2026, New York City (remote co-op)",
    title: "Full-Stack Software Engineer, Mobile and Backend",
    org: "OurFreedom.ai",
    points: [
      "Became tech lead and maintainer on both the backend and the mobile app within about four months.",
      "Owned iOS release hardening: age verification with US-state resolution, Apple Sign-In, env allowlisting, Stripe bootstrap, AdMob with SKAdNetwork and ATT. No release rejections.",
      "Ran code review, PR management, deploys, and CI/CD on GitHub Actions and Vercel in three-week sprints, with zero-downtime deployments.",
    ],
  },
  {
    when: "Sep 2024 to Dec 2026, Boston",
    title: "M.S. in Information Systems",
    org: "Northeastern University",
    points: [
      "System design, algorithms, databases, software quality, web development, prompt engineering, UI/UX.",
    ],
  },
  {
    when: "Jun 2023 to Jul 2024, Mumbai",
    title: "Software Developer",
    org: "ACN Fiber Pvt Ltd",
    points: [
      "Built and deployed Express.js REST APIs integrating third-party telecom services, serving 10,000+ daily users.",
      "Standardized request, response, and error contracts across endpoints, cutting on-call debugging time.",
    ],
  },
];

export const projects = [
  {
    title: "Lumina, AI Compliance Assistant",
    role: "AI Engineer and Full-Stack Developer",
    timeline: "Sep 2025 to Dec 2025",
    team: "3",
    problem:
      "Enterprises need a compliance assistant that answers accurately and cites its sources.",
    impact: "+15% improvement in reasoning accuracy",
    built:
      "PDF ingestion, chunking, FAISS retrieval, and cited answers, with fuzzy matching and fallbacks against empty responses.",
    stack: ["Python", "FastAPI", "LangChain", "FAISS", "OpenAI", "Next.js"],
    image:
      "https://framerusercontent.com/images/dnOS2XKJmTSLyeBfz6AwfJt3s.png?width=1024&height=1024",
    alt: "Lumina interface",
  },
  {
    title: "FundFlow, AI Finance Tracker",
    role: "Full-Stack Engineer",
    timeline: "Aug 2024 to Dec 2024",
    team: "2",
    problem: "People lacked multilingual, AI-driven insight into their spending.",
    impact: "10% improvement in spending behavior among users",
    built:
      "Expense, budget, and shopping-list CRUD with an ECharts dashboard, a Gemini assistant, alerts, and i18next.",
    stack: ["React", "Next.js", "Redux", "MongoDB", "JWT", "Gemini", "ECharts"],
    image:
      "https://framerusercontent.com/images/kwV2lhFCzyqiRqTkQxavBGrzyw.png?width=1024&height=1024",
    alt: "FundFlow dashboard",
  },
  {
    title: "TaskTreak, AI-Enhanced Task Manager",
    role: "Lead Java Developer",
    timeline: "Dec 2024 to Feb 2025",
    team: "Solo",
    problem:
      "Scheduling needed to be automatic, with conflicts caught before they happen.",
    impact: "25% faster task execution",
    built:
      "A JavaFX task manager with SQLite persistence, JDBC data access, and OpenAI-assisted scheduling.",
    stack: ["Java", "JavaFX", "SQLite", "JDBC", "OpenAI API"],
    image:
      "https://framerusercontent.com/images/ecKsniafMvMEyp7j4Br5vSvBur4.png?width=1024&height=1024",
    alt: "TaskTreak interface",
  },
];

export const testimonials = [
  {
    quote:
      "Soham played a crucial role in modernizing our telecom integration systems. His REST API development scaled effortlessly to 10,000+ daily users and significantly improved our data processing reliability by 20%.",
    name: "Ralph Lobo",
    role: "ACN Fiber",
    initials: "RL",
  },
  {
    quote:
      "Soham quickly became an essential part of our engineering team. His ability to build clean, maintainable code and integrate AI-powered automation helped us ship key features ahead of schedule.",
    name: "Vipul Shah",
    role: "Engineering lead",
    initials: "VS",
    image:
      "https://framerusercontent.com/images/97eJBZEapDBVCNjO3SfMJi6mg.png?width=200&height=200",
  },
];

export const services = [
  {
    label: "Mobile apps, shipped",
    text:
      "React Native and Expo apps with Swift native modules, OTA updates, and clean App Store and Play releases.",
  },
  {
    label: "Backend platforms",
    text:
      "NestJS and Express services on MongoDB, with clear API contracts, CI/CD, and zero-downtime deploys.",
  },
  {
    label: "Applied AI and safety",
    text:
      "RAG pipelines, LLM integrations, and content moderation that runs on device first.",
  },
];

export const skillGroups = [
  {
    label: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "Swift", "Java", "C++"],
  },
  {
    label: "Mobile and web",
    items: [
      "React Native",
      "Expo and EAS",
      "Swift native modules",
      "expo-updates",
      "React",
      "Next.js",
      "Redux",
      "Tailwind",
    ],
  },
  {
    label: "Backend and data",
    items: [
      "NestJS",
      "Node",
      "Express",
      "FastAPI",
      "JWT",
      "WebSockets",
      "MongoDB",
      "MySQL",
      "Redis",
      "Firebase",
    ],
  },
  {
    label: "Cloud and AI",
    items: [
      "AWS S3",
      "Rekognition",
      "Docker",
      "GitHub Actions",
      "Vercel",
      "Stripe",
      "Twilio",
      "LangChain",
      "FAISS",
      "OpenAI, Gemini, Anthropic APIs",
    ],
  },
];

export const education = [
  {
    degree: "M.S. in Information Systems, Northeastern University",
    meta: "Boston, 2024 to 2026",
  },
  {
    degree: "B.Tech in Electronics and Telecommunication, University of Mumbai",
    meta: "Mumbai, 2020 to 2023",
  },
];

export const nowItems = [
  {
    label: "Finishing my master's",
    text: "Graduating December 2026",
  },
  {
    label: "Looking for my next role",
    text: "Full-time from January 2027, in release, platform, or trust and safety",
  },
  {
    label: "Based in Boston",
    text: "Open to relocation and remote work",
  },
];
