// Source of truth: public/Soham_Chavan_Resume.pdf. Keep every claim here
// traceable to the resume so the site and the resume never disagree.

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
  tagline: "Keeping families connected to incarcerated loved ones",
  summary:
    "At OurFreedom.ai, I worked on a paid platform that kept families connected to incarcerated loved ones. I owned features end to end across the mobile app and the backend, and designed and shipped these four systems.",
  role:
    "Full-stack engineer on a React Native and Expo app for iOS and Android and a NestJS and MongoDB backend of about 40 modules and 20 contributors. I shipped 110+ commits, reviewed PRs, and coordinated releases in three-week sprints.",
  facts: [
    { label: "Role", value: "Full-Stack Software Engineer" },
    { label: "Timeline", value: "Jan 2026 to Jun 2026" },
    { label: "Team", value: "About 20 contributors" },
    { label: "Stack", value: "React Native, Expo, NestJS, MongoDB, Swift" },
  ] satisfies Fact[],
  systems: [
    {
      id: "release",
      label: "Release pipeline",
      title: "Getting fixes to users without waiting on review",
      intro:
        "Some fixes could ship over the air in minutes, and others needed a new store build. I designed a two-track update system so each change took the right path, and so outdated apps were handled safely.",
      bullets: [
        "Expo EAS over-the-air updates, channel-pinned and runtime-fingerprinted across dev, preview, TestFlight, and production.",
        "Native version gating with Google Play Core in-app updates and App Store redirects, driven by backend thresholds.",
        "19 Jest unit tests covering semantic-version logic and malformed API responses.",
        "Owned App Store and Google Play submissions with no release rejections.",
      ],
      steps: [
        {
          title: "Change reviewed and merged",
          note: "PR review, three-week sprints",
          detail:
            "Every release change went through PR review and a coordinated merge, so production code and production configuration stayed aligned.",
        },
        {
          title: "Route the change",
          note: "OTA for JavaScript, EAS for native",
          detail:
            "JavaScript-only changes went out as Expo OTA updates on pinned channels. Native changes went through an EAS build, TestFlight, and store submission.",
        },
        {
          title: "App checked its version",
          note: "Backend thresholds on launch",
          detail:
            "On launch, the client compared its version against thresholds set on the backend, so the server decided which builds were still safe to run.",
        },
        {
          title: "Update, prompt, or force",
          note: "Play in-app update or App Store redirect",
          detail:
            "Users got the right update path for their platform and build: continue, prompt, or force an update when a build was no longer safe.",
        },
      ],
    },
    {
      id: "feed",
      label: "For You feed",
      title: "A recommendation feed built on real interactions",
      intro:
        "The app's For You feed was powered by Recombee. I built the client: the store behind the feed, its paging, and the event tracking that fed every interaction back into recommendations.",
      bullets: [
        "A Zustand store with cursor pagination, infinite scroll, pull-to-refresh, duplicate filtering, and optimistic updates.",
        "Seven interaction types instrumented, each with per-post recommendation attribution.",
        "300 ms debouncing, UUID idempotency keys, and per-session deduplication, so each event counted once.",
        "Event queues reset on logout, so events never crossed between user sessions.",
      ],
      facts: [
        { label: "Recommender", value: "Recombee" },
        { label: "State", value: "Zustand" },
        { label: "Paging", value: "Cursor-based" },
        { label: "Interaction types", value: "7" },
        { label: "Debounce", value: "300 ms" },
        { label: "Dedup", value: "UUID idempotency keys" },
      ],
    },
    {
      id: "moderation",
      label: "Image moderation",
      title: "Screening sensitive images before anyone saw them",
      intro:
        "Families shared photos across five upload surfaces. Every image needed screening, but sending all of them to the cloud was slow, costly, and worse for privacy.",
      bullets: [
        "A Swift bridge to Apple's on-device SCSensitivityAnalyzer, so most checks never left the phone.",
        "An AWS Rekognition fallback with private S3 staging and magic-byte file validation.",
        "SHA-256 result caching, so the same image was never scanned twice.",
        "Blur and warn flows across all five upload surfaces.",
      ],
      steps: [
        {
          title: "Validate and hash",
          note: "Magic bytes, SHA-256",
          detail:
            "Each file's magic bytes were checked against its claimed type, then the image was hashed. If this exact content had already been judged, the cached result was reused.",
        },
        {
          title: "On-device analysis",
          note: "Swift bridge, iOS",
          detail:
            "On supported iOS devices, a Swift bridge asked Apple's SCSensitivityAnalyzer for a verdict locally. It was fast and private, and the image never left the phone.",
        },
        {
          title: "Cloud fallback",
          note: "Private S3 staging, Rekognition",
          detail:
            "When on-device analysis was unavailable, the file went to a private S3 staging bucket and the backend sent it to AWS Rekognition.",
        },
        {
          title: "Blur, warn, or show",
          note: "Five upload surfaces",
          detail:
            "Sensitive images were blurred behind a warning; safe ones showed normally. The result was cached against the hash for next time.",
        },
      ],
    },
    {
      id: "messaging",
      label: "Direct messaging",
      title: "Messaging with safety built in",
      intro:
        "I extended Direct Messaging across both halves of the stack, with reporting and blocking designed in from the start rather than bolted on.",
      bullets: [
        "Added a conversation reporting model and four new endpoints.",
        "Per-user unread aggregation across conversations.",
        "Rebuilt the client for group chats, typing indicators, blocking, and search.",
        "Shipped alongside a deny-by-default iOS and Android age gate.",
      ],
      facts: [
        { label: "New model", value: "Conversation reports" },
        { label: "New endpoints", value: "4" },
        { label: "Conversations", value: "1:1 and group" },
        { label: "Presence", value: "Typing indicators" },
        { label: "Safety", value: "Report and block" },
        { label: "Discovery", value: "Search" },
      ],
    },
  ] satisfies FeaturedSystem[],
};

export const experience = [
  {
    when: "Jan 2026 to Jun 2026, New York City",
    title: "Full-Stack Software Engineer, Mobile and Backend",
    org: "OurFreedom.ai",
    points: [
      "Owned features end to end across a React Native and Expo app for iOS and Android and a NestJS and MongoDB backend of about 40 modules and 20 contributors.",
      "Shipped 110+ commits, reviewed PRs, and coordinated releases in three-week sprints through GitHub Actions and Vercel.",
      "Built the client for a Recombee-powered For You feed, a two-track OTA and native update system, and hybrid on-device and cloud image moderation.",
      "Owned App Store and Google Play submissions with no release rejections, and hardened Apple Sign-In, Stripe, and AdMob and ATT setup.",
    ],
  },
  {
    when: "Sep 2024 to Dec 2026, Boston",
    title: "M.S. in Information Systems",
    org: "Northeastern University",
    points: [
      "Program Structures and Algorithms, System Design, Database Management, Software Quality Control and Management, Web Development, Prompt Engineering for Generative AI, UI/UX.",
    ],
  },
  {
    when: "Jun 2023 to Jul 2024, Mumbai",
    title: "Software Developer",
    org: "ACN Fiber Pvt Ltd",
    points: [
      "Built Express.js and TypeScript REST APIs with Axios that moved real-time customer data across third-party telecom infrastructure for 10,000+ daily active users.",
      "Added Zod request and response validation, standardizing data contracts across endpoints and stopping runtime failures from malformed vendor payloads.",
      "Built centralized error-handling middleware with Winston logging, speeding up production diagnostics and cutting on-call triage time.",
    ],
  },
  {
    when: "May 2019 to Apr 2020, Mumbai",
    title: "Software Testing Intern",
    org: "Digi Cable Pvt Ltd",
    points: [
      "Tested portal features before each release and logged bugs for the development team.",
      "Wrote test cases for new features and kept internal setup docs and READMEs current.",
    ],
  },
];

export const projects = [
  {
    title: "Lumina, AI Compliance Q&A Assistant",
    role: "AI Engineer and Full-Stack Developer",
    timeline: "Sep 2025 to Dec 2025",
    team: "3",
    problem:
      "Compliance teams need answers they can trust, with the source for every claim.",
    built:
      "An end-to-end RAG pipeline: PDF upload, chunking, embeddings, FAISS vector search, top-k retrieval, and source-cited answers, tuned with cosine-similarity normalization, fuzzy matching, and context-length caps.",
    stack: ["Next.js", "TypeScript", "FastAPI", "LangChain", "FAISS", "GPT-4o-mini"],
    image: "/lumina.png",
    alt: "Lumina compliance assistant showing a cited answer",
  },
  {
    title: "Fund Flow, Full-Stack Personal Finance App",
    role: "Full-Stack Engineer",
    timeline: "Aug 2024 to Dec 2024",
    team: "2",
    problem: "People lacked multilingual, AI-driven insight into their spending.",
    built:
      "Expense, budget, and shopping-list workflows on RESTful CRUD services and MongoDB, with ECharts dashboards, a Gemini insights assistant, real-time collaboration, EmailJS alerts, and i18next.",
    stack: ["React", "Next.js", "Redux", "Express", "MongoDB", "Gemini", "ECharts", "i18next"],
    image: "/fundflow.png",
    alt: "Fund Flow spending dashboard",
  },
  {
    // TODO(soham): confirm spelling, TaskTreak vs TaskTrek
    title: "TaskTreak, AI-Enhanced Task Manager",
    role: "Solo developer",
    timeline: "Dec 2024 to Feb 2025",
    team: "Solo",
    problem:
      "Scheduling needed to be automatic, with conflicts caught before they happen.",
    built:
      "A JavaFX task manager with SQLite persistence, JDBC data access, and OpenAI-assisted scheduling.",
    stack: ["Java", "JavaFX", "SQLite", "JDBC", "OpenAI API"],
    image: "/tasktreak.png",
    alt: "TaskTreak task manager interface",
  },
];

export const testimonials = [
  {
    quote:
      "Soham played a crucial role in modernizing our telecom integration systems. His REST API development scaled effortlessly to 10,000+ daily users and significantly improved our data processing reliability by 20%.",
    name: "Ralph Lobo",
    role: "CTO, ACN Fiber",
    initials: "RL",
  },
];

export const services = [
  {
    label: "Mobile apps, shipped",
    text:
      "React Native and Expo apps with Swift native modules, OTA updates, and clean App Store and Google Play releases.",
  },
  {
    label: "Backend platforms",
    text:
      "NestJS and Express services on MongoDB, with validated API contracts, structured logging, and CI/CD.",
  },
  {
    label: "Applied AI and safety",
    text:
      "RAG pipelines, LLM integrations, recommendation feeds, and content moderation that runs on device first.",
  },
];

export const skillGroups = [
  {
    label: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "Swift", "Java", "C++", "SQL"],
  },
  {
    label: "Mobile and web",
    items: [
      "React Native",
      "Expo and EAS",
      "OTA updates",
      "Swift native modules",
      "Play Core in-app updates",
      "React",
      "Next.js",
      "Redux",
      "Zustand",
      "Tailwind CSS",
    ],
  },
  {
    label: "Backend and data",
    items: [
      "Node.js",
      "NestJS",
      "Express",
      "FastAPI",
      "Zod",
      "WebSockets",
      "JWT",
      "MongoDB",
      "MySQL",
      "Redis",
      "Firebase",
      "FAISS",
    ],
  },
  {
    label: "Cloud, AI, and tools",
    items: [
      "AWS S3 and Rekognition",
      "Docker",
      "GitHub Actions",
      "Vercel",
      "TestFlight",
      "Google Play Console",
      "OpenAI, Gemini, Anthropic APIs",
      "LangChain and RAG",
      "Recombee",
      "Jest",
      "Stripe",
      "Twilio",
    ],
  },
];

export const education = [
  {
    degree: "M.S. in Information Systems, Northeastern University",
    meta: "Boston, Sep 2024 to Dec 2026",
  },
  {
    degree:
      "B.Tech in Electronics and Telecommunication Engineering, University of Mumbai",
    meta: "Mumbai, Jun 2020 to Jul 2023",
  },
];

export const about = [
  "I am Soham, a full-stack software engineer in Boston. I like owning a feature from its database schema through the API and native code to the moment it passes App Store review.",
  "My most meaningful work so far was at OurFreedom.ai, where the people using the app were families keeping in touch with someone in prison. That shaped how I think about engineering: a release that broke, or an image that slipped through moderation, affected real people.",
  "Before that I built telecom integration APIs in Mumbai serving 10,000+ daily users. Now I am finishing an M.S. in Information Systems at Northeastern.",
];

export const nowItems = [
  {
    label: "Finishing my master's",
    text: "Graduating December 2026",
  },
  {
    label: "Looking for my next role",
    text: "Full-time from January 2027, in full-stack, mobile, or platform engineering",
  },
  {
    label: "Based in Boston",
    text: "Open to relocation and remote work",
  },
];
