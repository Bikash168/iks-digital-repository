import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const galleryDir = path.join(process.cwd(), "public", "gallery");
    const entries = await fs.readdir(galleryDir);
    const images = entries
      .filter((name) => /\.(jpe?g|png|webp|gif)$/i.test(name))
      .map((name) => `/gallery/${encodeURIComponent(name)}`);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to list gallery images:", error);
    return NextResponse.json({ images: [] });
  }
}
