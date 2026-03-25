// ─────────────────────────────────────────────────────────────
// FILE: app/api/plants/route.ts
//
// PLACEMENT: You must create this exact directory structure:
//   app/
//     api/
//       plants/
//         route.ts   ← this file goes HERE
//
// IMPORTANT: The filename MUST be "route.ts" (not "api.ts", not "plants.ts")
// Next.js App Router requires files named exactly "route.ts" inside app/api/
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const DATA_FILE  = path.join(process.cwd(), "public", "Data.xlsx");
const PLANTS_DIR = path.join(process.cwd(), "public", "plants");

const COLUMNS = [
  "Voucher No.",
  "Plant Name",
  "Family",
  "Therapeutic Use",
  "Local Name",
  "Habitat",
  "Collection Area",
  "Plant Parts Used",
  "Photo",
];

export async function POST(req: NextRequest) {
  try {
    // ── Parse multipart form data ──────────────────────────────
    const formData = await req.formData();

    const vendorNo       = ((formData.get("vendorNo")       as string) ?? "").trim();
    const plantName      = ((formData.get("plantName")      as string) ?? "").trim();
    const family         = ((formData.get("family")         as string) ?? "").trim();
    const therapeuticUse = ((formData.get("therapeuticUse") as string) ?? "").trim();
    const localName      = ((formData.get("localName")      as string) ?? "").trim();
    const habitat        = ((formData.get("habitat")        as string) ?? "").trim();
    const collectionArea = ((formData.get("collectionArea") as string) ?? "").trim();
    const plantPartsUsed = ((formData.get("plantPartsUsed") as string) ?? "").trim();
    const fieldPhoto     = formData.get("fieldPhoto")    as File | null;
    const herbariumPhoto = formData.get("herbariumPhoto") as File | null;

    // ── Validate ───────────────────────────────────────────────
    if (!vendorNo || !plantName || !family || !therapeuticUse) {
      return NextResponse.json(
        { error: "Missing required fields: Voucher No., Plant Name, Family, Therapeutic Use" },
        { status: 400 }
      );
    }

    // ── Ensure /public/plants/ exists ──────────────────────────
    await fs.mkdir(PLANTS_DIR, { recursive: true });

    const safeBase = plantName.replace(/[/\\?%*:|"<>]/g, "_");

    // ── Save images ────────────────────────────────────────────
    async function saveImage(file: File, suffix: string) {
      const ext      = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const filename = `${safeBase}${suffix}.${ext}`;
      const buf      = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(PLANTS_DIR, filename), buf);
    }

    if (fieldPhoto    && fieldPhoto.size    > 0) await saveImage(fieldPhoto,    "");
    if (herbariumPhoto && herbariumPhoto.size > 0) await saveImage(herbariumPhoto, "_Herbarium");

    // ── Read / create Excel using dynamic import ───────────────
    // Dynamic import avoids any SSR/bundler issues with xlsx
    const XLSX = await import("xlsx");

    let workbook: import("xlsx").WorkBook;
    try {
      const existing = await fs.readFile(DATA_FILE);
      workbook = XLSX.read(existing, { type: "buffer" });
    } catch {
      // Data.xlsx doesn't exist yet — create fresh with headers
      workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([COLUMNS]);
      XLSX.utils.book_append_sheet(workbook, ws, "Plants");
    }

    const sheetName = workbook.SheetNames[0];
    const ws        = workbook.Sheets[sheetName];

    // ── Append new row ─────────────────────────────────────────
    XLSX.utils.sheet_add_aoa(
      ws,
      [[vendorNo, plantName, family, therapeuticUse,
        localName, habitat, collectionArea, plantPartsUsed, safeBase]],
      { origin: -1 }
    );

    // ── Write Excel back to disk ───────────────────────────────
    const outBuf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await fs.writeFile(DATA_FILE, outBuf);

    return NextResponse.json({
      success: true,
      message: `"${plantName}" added successfully.`,
    });

  } catch (err: any) {
    console.error("[POST /api/plants]", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Health-check GET so you can verify the route is live ──────
// Visit http://localhost:3000/api/plants in the browser — should return {"ok":true}
export async function GET() {
  return NextResponse.json({ ok: true, route: "api/plants is reachable" });
}
