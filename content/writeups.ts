export type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "code"; text: string };

export type Writeup = {
  slug: string;
  title: string;
  deck: string;
  meta: {
    role: string;
    when: string;
    surface: string;
    stack: string;
  };
  body: Block[];
};

export const writeups: Writeup[] = [
  {
    slug: "release-pipeline",
    title: "A release pipeline where shipping is uneventful",
    deck:
      "Store binaries and over-the-air updates for a production React Native app, with runtime fingerprints and backend version checks keeping users on safe builds.",
    meta: {
      role: "Full-stack engineer, mobile and backend",
      when: "Jan 2026 to Jun 2026",
      surface: "iOS, Android",
      stack: "React Native, Expo, EAS, Play Core, Jest",
    },
    body: [
      { kind: "h", text: "The problem" },
      {
        kind: "p",
        text:
          "Some fixes could ship over the air in minutes, while native changes needed TestFlight, Play Console, and store review. The risky part was making sure a JavaScript update never landed on a binary it could not run on, and that old builds were handled intentionally.",
      },
      { kind: "h", text: "What I built" },
      {
        kind: "p",
        text:
          "I split releases into two tracks: Expo OTA for JavaScript-only changes and EAS builds for native changes. OTA updates were runtime-fingerprinted so compatible builds could receive fixes without waiting on review.",
      },
      {
        kind: "p",
        text:
          "Native changes were gated by version thresholds on the backend. On Android the app used Google Play Core in-app updates; on iOS it redirected to the App Store. That gave the app one source of truth for continue, prompt, or force-update decisions.",
      },
      {
        kind: "p",
        text:
          "Publishing was channel-pinned across dev, preview, TestFlight, and production, and I wrote 19 Jest unit tests for the semantic-version logic, including malformed API responses.",
      },
      { kind: "h", text: "Result" },
      {
        kind: "p",
        text:
          "The team could route each change through the right path, keep production bundles away from local environment values, and move users off outdated builds without a scramble. I owned the App Store and Google Play submissions, with no release rejections.",
      },
    ],
  },
  {
    slug: "recommendation-feed",
    title: "A For You feed that learns from real interactions",
    deck:
      "The client for a Recombee-powered recommendation feed, with paging that never shows a post twice and event tracking that counts every interaction exactly once.",
    meta: {
      role: "Full-stack engineer, mobile and backend",
      when: "Jan 2026 to Jun 2026",
      surface: "iOS, Android",
      stack: "React Native, Zustand, Recombee, TypeScript",
    },
    body: [
      { kind: "h", text: "The problem" },
      {
        kind: "p",
        text:
          "A recommendation feed is only as good as the signals behind it. The feed had to scroll smoothly through an endless list, and every like, view, or share had to reach Recombee once, attributed to the recommendation that produced it, without leaking between accounts.",
      },
      { kind: "h", text: "What I built" },
      {
        kind: "p",
        text:
          "I built the feed client on a Zustand store with cursor pagination, infinite scroll, pull-to-refresh, duplicate filtering, and optimistic updates, so the list stayed fast and never repeated a post.",
      },
      {
        kind: "p",
        text:
          "I instrumented seven interaction types with per-post recommendation attribution. Tracking used 300 ms debouncing, UUID idempotency keys, and per-session deduplication, and the event queue reset on logout so events could never cross user sessions.",
      },
      { kind: "h", text: "Result" },
      {
        kind: "p",
        text:
          "Recommendations trained on clean, deduplicated signals, and tracking stayed privacy-safe across account switches.",
      },
    ],
  },
  {
    slug: "on-device-moderation",
    title: "Moderating images before they leave the phone",
    deck:
      "Screening sensitive images on the device first, with server-side fallback and hash-based verdict caching for a platform where what got through mattered.",
    meta: {
      role: "Full-stack engineer, mobile and backend",
      when: "Jan 2026 to Jun 2026",
      surface: "iOS, Android, server",
      stack: "React Native, Swift, NestJS, AWS Rekognition, S3",
    },
    body: [
      { kind: "h", text: "The problem" },
      {
        kind: "p",
        text:
          "Families shared photos across five upload surfaces. Every image needed screening, but shipping every file to the cloud first was slower, more expensive, and worse for privacy.",
      },
      { kind: "h", text: "What I built" },
      {
        kind: "p",
        text:
          "I built a Swift bridge to Apple's on-device SCSensitivityAnalyzer for supported iOS devices, with AWS Rekognition on the backend as the fallback. Fallback files went through private S3 staging, and magic-byte validation rejected files whose contents did not match their claimed type.",
      },
      {
        kind: "p",
        text:
          "Results were cached by SHA-256 hash, so repeated content reused a verdict instead of being scanned again. Sensitive images were blurred behind a warning on all five surfaces.",
      },
      { kind: "h", text: "Result" },
      {
        kind: "p",
        text:
          "The system made moderation faster on supported devices, reduced duplicate scanning, and kept a reliable server-side path for devices or cases where on-device analysis could not produce a confident result.",
      },
    ],
  },
  {
    slug: "direct-messaging",
    title: "Direct messaging with safety built in",
    deck:
      "A messaging subsystem with unread state, reporting, blocking, search, and group conversations designed as first-class product behavior.",
    meta: {
      role: "Full-stack engineer, mobile and backend",
      when: "Jan 2026 to Jun 2026",
      surface: "iOS, Android, server",
      stack: "React Native, NestJS, MongoDB",
    },
    body: [
      { kind: "h", text: "The problem" },
      {
        kind: "p",
        text:
          "Direct messaging needed to feel immediate, but the safety model could not be an afterthought. Reporting, blocking, unread state, and conversation search all had to move together across the backend and mobile client.",
      },
      { kind: "h", text: "What I built" },
      {
        kind: "p",
        text:
          "I extended the backend with a conversation reporting model, four new endpoints, and per-user unread aggregation, then rebuilt the client for group chats with typing indicators.",
      },
      {
        kind: "p",
        text:
          "The client work also covered search and report and block flows, and it shipped alongside a deny-by-default iOS and Android age gate.",
      },
      { kind: "h", text: "Result" },
      {
        kind: "p",
        text:
          "Messaging shipped as a full product surface, with safety and discovery built into the same release instead of added later as separate cleanup work.",
      },
    ],
  },
];

export function writeupBySlug(slug: string): Writeup | undefined {
  return writeups.find((w) => w.slug === slug);
}
