import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/content/site";

export const alt = `${site.name}, ${site.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const garamond = await readFile(
  join(process.cwd(), "assets/fonts/EBGaramond-Regular.ttf")
);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "64px 80px",
          background: "linear-gradient(145deg, #f5f3ff 0%, #fbfaf7 50%, #f8e9d5 100%)",
          color: "#191b22",
          fontFamily: "EB Garamond",
          borderLeft: "12px solid #3448a4",
        }}
      >
        <div style={{ display: "flex", fontSize: 42, color: "#3448a4", marginBottom: 24 }}>
          {site.name}
        </div>
        <div style={{ display: "flex", fontSize: 72, lineHeight: 1.08, marginBottom: 32 }}>
          {site.headline}
        </div>
        <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35, color: "#454854", maxWidth: 880 }}>
          Mobile, backend, and platform systems, from database schema to App Store release.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "EB Garamond", data: garamond, weight: 400, style: "normal" }],
    }
  );
}
