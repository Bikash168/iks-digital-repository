// FILE: app/api/plants/route.ts
// Handles ONLY text data — images are uploaded client-side directly to Vercel Blob.

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const IS_VERCEL  = !!process.env.VERCEL;
const DATA_FILE  = path.join(process.cwd(), "public", "Data.xlsx");
const PLANTS_DIR = path.join(process.cwd(), "public", "plants");

const COLUMNS = [
  "Voucher No.", "Plant Name", "Family", "Therapeutic Use",
  "Local Name", "Habitat", "Collection Area", "Plant Parts Used", "Photo",
];

async function readWorkbook(XLSX: any) {
  if (IS_VERCEL) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "data/Data.xlsx" });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].downloadUrl);
    if (!res.ok) return null;
    return XLSX.read(Buffer.from(await res.arrayBuffer()), { type: "buffer" });
  } else {
    try {
      return XLSX.read(await fs.readFile(DATA_FILE), { type: "buffer" });
    } catch { return null; }
  }
}

async function writeWorkbook(XLSX: any, workbook: any) {
  const outBuf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  if (IS_VERCEL) {
    const { put } = await import("@vercel/blob");
    await put("data/Data.xlsx", outBuf, {
      access: "public",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } else {
    await fs.writeFile(DATA_FILE, outBuf);
  }
}

export async function POST(req: NextRequest) {
  try {
    const XLSX = await import("xlsx");

    // Only JSON now — no file uploads through this route
    const body = await req.json();

    const vendorNo       = (body.vendorNo       ?? "").trim();
    const plantName      = (body.plantName      ?? "").trim();
    const family         = (body.family         ?? "").trim();
    const therapeuticUse = (body.therapeuticUse ?? "").trim();
    const localName      = (body.localName      ?? "").trim();
    const habitat        = (body.habitat        ?? "").trim();
    const collectionArea = (body.collectionArea ?? "").trim();
    const plantPartsUsed = (body.plantPartsUsed ?? "").trim();
    // fieldPhotoUrl comes from client-side Blob upload (full https:// URL or empty)
    const fieldPhotoUrl  = (body.fieldPhotoUrl  ?? "").trim();

    if (!vendorNo || !plantName || !family || !therapeuticUse) {
      return NextResponse.json(
        { error: "Missing required fields: Voucher No., Plant Name, Family, Therapeutic Use" },
        { status: 400 }
      );
    }

    const safeBase   = plantName.replace(/[/\\?%*:|"<>]/g, "_");
    const photoValue = fieldPhotoUrl || safeBase;

    let workbook = await readWorkbook(XLSX);
    if (!workbook) {
      workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([COLUMNS]);
      XLSX.utils.book_append_sheet(workbook, ws, "Plants");
    }

    const ws = workbook.Sheets[workbook.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(
      ws,
      [[vendorNo, plantName, family, therapeuticUse,
        localName, habitat, collectionArea, plantPartsUsed, photoValue]],
      { origin: -1 }
    );

    await writeWorkbook(XLSX, workbook);

    return NextResponse.json({ success: true, message: `"${plantName}" added successfully.` });

  } catch (err: any) {
    console.error("[POST /api/plants]", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, env: IS_VERCEL ? "vercel" : "local" });
}