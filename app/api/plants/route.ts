// FILE: app/api/plants/route.ts

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const IS_VERCEL   = !!process.env.VERCEL;          // true on Vercel, false on localhost
const DATA_FILE   = path.join(process.cwd(), "public", "Data.xlsx");
const PLANTS_DIR  = path.join(process.cwd(), "public", "plants");

const COLUMNS = [
  "Voucher No.", "Plant Name", "Family", "Therapeutic Use",
  "Local Name", "Habitat", "Collection Area", "Plant Parts Used", "Photo",
];

// ─── Excel helpers ────────────────────────────────────────────

async function readWorkbook(XLSX: any) {
  if (IS_VERCEL) {
    // Production: read from Vercel Blob
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "data/Data.xlsx" });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].downloadUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return XLSX.read(buf, { type: "buffer" });
  } else {
    // Local: read from /public/Data.xlsx
    try {
      const buf = await fs.readFile(DATA_FILE);
      return XLSX.read(buf, { type: "buffer" });
    } catch {
      return null;
    }
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

// ─── Image helpers ────────────────────────────────────────────

async function saveImage(file: File, safeBase: string, suffix: string): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const filename = `${safeBase}${suffix}.${ext}`;

  if (IS_VERCEL) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`plants/${filename}`, file, {
      access: "public",
      contentType: file.type || "image/jpeg",
    });
    return blob.url;           // full https:// CDN URL
  } else {
    await fs.mkdir(PLANTS_DIR, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(PLANTS_DIR, filename), buf);
    return filename;            // just the filename — local /plants/ path
  }
}

// ─── POST handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const XLSX = await import("xlsx");

    // ── Parse form data ────────────────────────────────────────
    const formData       = await req.formData();
    const vendorNo       = ((formData.get("vendorNo")       as string) ?? "").trim();
    const plantName      = ((formData.get("plantName")      as string) ?? "").trim();
    const family         = ((formData.get("family")         as string) ?? "").trim();
    const therapeuticUse = ((formData.get("therapeuticUse") as string) ?? "").trim();
    const localName      = ((formData.get("localName")      as string) ?? "").trim();
    const habitat        = ((formData.get("habitat")        as string) ?? "").trim();
    const collectionArea = ((formData.get("collectionArea") as string) ?? "").trim();
    const plantPartsUsed = ((formData.get("plantPartsUsed") as string) ?? "").trim();
    const fieldPhoto     = formData.get("fieldPhoto")     as File | null;
    const herbariumPhoto = formData.get("herbariumPhoto") as File | null;

    // ── Validate ───────────────────────────────────────────────
    if (!vendorNo || !plantName || !family || !therapeuticUse) {
      return NextResponse.json(
        { error: "Missing required fields: Voucher No., Plant Name, Family, Therapeutic Use" },
        { status: 400 }
      );
    }

    const safeBase = plantName.replace(/[/\\?%*:|"<>]/g, "_");

    // ── Save images ────────────────────────────────────────────
    let photoValue = safeBase; // default: just the name (no image uploaded)

    if (fieldPhoto && fieldPhoto.size > 0) {
      photoValue = await saveImage(fieldPhoto, safeBase, "");
    }
    if (herbariumPhoto && herbariumPhoto.size > 0) {
      await saveImage(herbariumPhoto, safeBase, "_Herbarium");
    }

    // ── Load or create workbook ────────────────────────────────
    let workbook = await readWorkbook(XLSX);
    if (!workbook) {
      workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([COLUMNS]);
      XLSX.utils.book_append_sheet(workbook, ws, "Plants");
    }

    const ws = workbook.Sheets[workbook.SheetNames[0]];

    // ── Append row ─────────────────────────────────────────────
    XLSX.utils.sheet_add_aoa(
      ws,
      [[vendorNo, plantName, family, therapeuticUse,
        localName, habitat, collectionArea, plantPartsUsed,
        photoValue]],
      { origin: -1 }
    );

    // ── Save workbook ──────────────────────────────────────────
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
  return NextResponse.json({
    ok: true,
    env: IS_VERCEL ? "vercel" : "local",
    route: "api/plants is reachable",
  });
}