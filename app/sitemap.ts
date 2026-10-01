import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { writeups } from "@/content/writeups";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url },
    ...writeups.map((writeup) => ({
      url: `${site.url}/work/${writeup.slug}`,
    })),
  ];
}
