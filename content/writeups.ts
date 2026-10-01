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
      role: "Team lead, mobile and backend",
      when: "Jan 2026 to Jun 2026",
      surface: "iOS, Android",
      stack: "React Native, Expo, expo-updates, EAS",
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
          "I also added a backend force-update protocol behind GET /api/app-version, consumed by useAppUpdate and useNativeVersionCheck on the client. That gave the app a single source of truth for continue, prompt, or force-update decisions.",
      },
      { kind: "h", text: "Result" },
      {
        kind: "p",
        text:
          "The team could route each change through the right path, keep production bundles away from local environment values, and move users off outdated builds without a scramble. The release-hardening work cleared App Store review with no release rejections.",
      },
    ],
  },
  {
    slug: "on-device-moderation",
    title: "Moderating images before they leave the phone",
    deck:
      "Screening sensitive images on the device first, with server-side fallback and hash-based verdict caching for a platform where what got through mattered.",
    meta: {
      role: "Team lead, mobile and backend",
      when: "Jan 2026 to Jun 2026",
      surface: "iOS, Android, server",
      stack: "React Native, Swift, NestJS, AWS Rekognition",
    },
    body: [
      { kind: "h", text: "The problem" },
      {
        kind: "p",
        text:
          "Families sent photos through posts, profiles, uploads, and physical mail. Every image needed screening, but shipping every file to the cloud first was slower, more expensive, and worse for privacy.",
      },
      { kind: "h", text: "What I built" },
      {
        kind: "p",
        text:
          "I built a custom Swift native module around Apple's SCSensitivityAnalyzer for supported iOS devices, then used AWS Rekognition from the NestJS backend as the fallback path. Files moved through an S3 staging lifecycle until a verdict decided whether they could be published.",
      },
      {
        kind: "p",
        text:
          "The client computed a SHA-256 hash for each image, so repeated content could reuse a cached verdict instead of being scanned again.",
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
      role: "Team lead, mobile and backend",
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
          "I extended the backend with a ConversationReport entity and four new endpoints, added per-user unread aggregation and a mark-as-read API, then rebuilt the client around 1:1 and group DMs with adaptive polling and typing indicators.",
      },
      {
        kind: "p",
        text:
          "The work also covered global search, post sharing, report and block flows, and a rewrite of the username and handle system across profiles and follows.",
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
