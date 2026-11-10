import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P) => ({
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const IconSound = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);
export const IconMute = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
    <path d="m16 9.5 5 5m0-5-5 5" />
  </svg>
);
export const IconGear = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
  </svg>
);
export const IconExpand = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
export const IconBack = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 5 8 12l7 7" />
  </svg>
);
export const IconArrow = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.2 4.2L19 7" />
  </svg>
);
export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="m3.5 6 8.5 7 8.5-7" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="8" y="8" width="12" height="12" rx="1.5" />
    <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  </svg>
);
export const IconGithub = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.8c-2.7.6-3.2-1.2-3.2-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.3-1.1-4.3-4.7 0-1 .4-1.9 1-2.6-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.6 1 2.6 0 3.7-2.2 4.5-4.3 4.7.3.3.6.9.6 1.8v2.6c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5Z" />
  </svg>
);
export const IconLinkedin = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M5.3 8.6h3V19h-3zM6.8 4a1.7 1.7 0 1 1 0 3.5 1.7 1.7 0 0 1 0-3.5ZM10.2 8.6h2.9V10c.4-.8 1.4-1.6 3-1.6 3.1 0 3.7 2 3.7 4.7V19h-3v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V19h-3z" />
  </svg>
);
export const IconTarget = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </svg>
);
export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);
export const IconWave = (p: P) => (
  <svg {...base(p)}>
    <path d="M7.5 12.5V6.8a1.3 1.3 0 0 1 2.6 0V11m0-5.5a1.3 1.3 0 0 1 2.6 0V11m0-4.2a1.3 1.3 0 0 1 2.6 0V12m0-3a1.3 1.3 0 0 1 2.6 0v5.2a6.3 6.3 0 0 1-11.4 3.7L4 14.3a1.4 1.4 0 0 1 2.2-1.7l1.3 1.6" />
  </svg>
);

// Tab glyphs for the bottom bar on phones.
export const TabGlyph = ({ id, ...p }: P & { id: string }) => {
  switch (id) {
    case "lobby":
      return (
        <svg {...base(p)}>
          <path d="M4 20V10l8-6 8 6v10h-5v-6H9v6z" />
        </svg>
      );
    case "missions":
      return <IconTarget {...p} />;
    case "arsenal":
      return (
        <svg {...base(p)}>
          <rect x="3.5" y="6" width="17" height="12" rx="1.5" />
          <path d="M3.5 10h17M9 6V4.5h6V6" />
        </svg>
      );
    case "loadout":
      return (
        <svg {...base(p)}>
          <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "career":
      return (
        <svg {...base(p)}>
          <path d="M4 19h16M6 19V11M10 19V7M14 19v-9M18 19V4" />
        </svg>
      );
    default:
      return (
        <svg {...base(p)}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
  }
};

export const Emblem = (p: P) => (
  <svg viewBox="0 0 64 64" width={64} height={64} aria-hidden {...p}>
    <defs>
      <linearGradient id="emb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd27a" />
        <stop offset="1" stopColor="#ff9a1f" />
      </linearGradient>
    </defs>
    <path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill="none" stroke="url(#emb)" strokeWidth="2.5" />
    <path d="M32 11 50 21.5v21L32 53 14 42.5v-21z" fill="rgba(255,178,63,0.08)" stroke="rgba(255,210,122,0.35)" strokeWidth="1" />
    <text x="32" y="39" textAnchor="middle" fontFamily="var(--font-display), sans-serif" fontWeight="800" fontSize="20" fill="url(#emb)" letterSpacing="1">
      SC
    </text>
  </svg>
);

export const RankChevrons = (p: P) => (
  <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden {...p}>
    <path d="m4 9 8-5 8 5v3l-8-5-8 5z" fill="#ffb23f" />
    <path d="m4 15 8-5 8 5v3l-8-5-8 5z" fill="#ffb23f" opacity="0.75" />
    <path d="m4 21 8-5 8 5" fill="none" stroke="#ffb23f" strokeWidth="2" opacity="0.5" />
  </svg>
);
