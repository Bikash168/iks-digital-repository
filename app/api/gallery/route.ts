import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const galleryDir = path.join(process.cwd(), "public", "gallery");

    if (!fs.existsSync(galleryDir)) {
      return NextResponse.json({ images: [] });
    }

    const files = fs.readdirSync(galleryDir);

    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    const images = files
      .filter((file) => {
        const lower = file.toLowerCase();
        return imageExtensions.some((ext) => lower.endsWith(ext));
      })
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((file) => {
        // ✅ encodeURIComponent but restore forward slash
        // Use encodeURIComponent only on the filename, NOT the path separator
        return `/gallery/${file
          .split("")
          .map((c) => {
            // Only encode characters that break URLs
            if (/[^a-zA-Z0-9._\-~ ]/.test(c)) return encodeURIComponent(c);
            return c;
          })
          .join("")
          .replace(/ /g, "%20")}`;
      });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Gallery API error:", error);
    return NextResponse.json({ images: [] });
  }
}