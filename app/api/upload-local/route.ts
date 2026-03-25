// FILE: app/api/upload-local/route.ts
// Used ONLY on localhost for saving images to /public/plants/
// On Vercel, images go directly to Blob CDN via /api/upload — this route is never called.

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const PLANTS_DIR = path.join(process.cwd(), "public", "plants");

export async function POST(req: NextRequest) {
  // Safety guard — should never be called on Vercel
  if (process.env.VERCEL) {
    return NextResponse.json({ error: "Not available on Vercel" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file     = formData.get("file")     as File | null;
    const filename = formData.get("filename") as string | null;

    if (!file || !filename) {
      return NextResponse.json({ error: "Missing file or filename" }, { status: 400 });
    }

    await fs.mkdir(PLANTS_DIR, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(PLANTS_DIR, filename), buf);

    return NextResponse.json({ success: true, filename });
  } catch (err: any) {
    console.error("[POST /api/upload-local]", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}