import type { Metadata } from "next";
import { education } from "@/content/portfolio";
import { site } from "@/content/site";

export const defaultTitle = `${site.name}, ${site.headline}`;

// Same route the app/opengraph-image.tsx file convention serves. A page that sets
// its own `openGraph` replaces the inherited one wholesale, image included, so
// those pages have to name the image again.
const sharedImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: defaultTitle,
};

export function socialMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type,
      url: path,
      title,
      description,
      siteName: site.name,
      locale: "en_US",
      images: [sharedImage],
    },
    // Twitter falls back to the Open Graph image when it has none of its own.
    twitter: { card: "summary_large_image", title, description },
  };
}

// "M.S. in Information Systems, Northeastern University" -> "Northeastern University"
function schoolOf(degree: string): string | null {
  const at = degree.lastIndexOf(", ");
  return at === -1 ? null : degree.slice(at + 2).trim() || null;
}

export function personJsonLd() {
  const schools = [
    ...new Set(
      education
        .map((item) => schoolOf(item.degree))
        .filter((name): name is string => Boolean(name))
    ),
  ];

  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.navHeadline,
    description: site.description,
    url: site.url,
    image: new URL(site.profileImage, site.url).toString(),
    email: `mailto:${site.email}`,
    sameAs: [site.github, site.linkedin].filter(Boolean),
    alumniOf: schools.map((name) => ({ "@type": "CollegeOrUniversity", name })),
  };

  // Escape "<" so no string in the payload can close the script tag early.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
