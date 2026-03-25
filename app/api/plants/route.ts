// ─────────────────────────────────────────────────────────────
// FILE: app/api/plants/route.ts
//
// Works on BOTH localhost AND Vercel.
//
// Storage strategy:
//   • Images  → Vercel Blob  (permanent, public CDN URLs)
//   • Excel   → Vercel Blob  (read latest, append row, re-upload)
//
// Setup (one-time):
//   1. In Vercel dashboard → Storage → Create Blob store → link to project
//   2. Run:  npx vercel env pull   (pulls BLOB_READ_WRITE_TOKEN to .env.local)
//   3. Run:  npm install @vercel/blob
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { put, list, getDownloadUrl } from "@vercel/blob";

const XLSX_BLOB_PATHNAME = "data/Data.xlsx"; // fixed path in Blob store

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

// ── Helper: fetch the current Data.xlsx from Blob (or null) ───
async function fetchWorkbook() {
  const XLSX = await import("xlsx");

  try {
    // List blobs to find the xlsx
    const { blobs } = await list({ prefix: XLSX_BLOB_PATHNAME });
    if (blobs.length === 0) return null;

    const res = await fetch(blobs[0].downloadUrl);
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    return XLSX.read(buf, { type: "buffer" });
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const XLSX = await import("xlsx");

    // ── 1. Parse form data ─────────────────────────────────────
    const formData = await req.formData();

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

    // ── 2. Validate ────────────────────────────────────────────
    if (!vendorNo || !plantName || !family || !therapeuticUse) {
      return NextResponse.json(
        { error: "Missing required fields: Voucher No., Plant Name, Family, Therapeutic Use" },
        { status: 400 }
      );
    }

    const safeBase = plantName.replace(/[/\\?%*:|"<>]/g, "_");

    // ── 3. Upload images to Vercel Blob ────────────────────────
    let fieldPhotoUrl    = "";
    let herbariumUrl     = "";

    if (fieldPhoto && fieldPhoto.size > 0) {
      const ext  = (fieldPhoto.name.split(".").pop() ?? "jpg").toLowerCase();
      const blob = await put(`plants/${safeBase}.${ext}`, fieldPhoto, {
        access: "public",
        contentType: fieldPhoto.type || "image/jpeg",
      });
      fieldPhotoUrl = blob.url;
    }

    if (herbariumPhoto && herbariumPhoto.size > 0) {
      const ext  = (herbariumPhoto.name.split(".").pop() ?? "jpg").toLowerCase();
      const blob = await put(`plants/${safeBase}_Herbarium.${ext}`, herbariumPhoto, {
        access: "public",
        contentType: herbariumPhoto.type || "image/jpeg",
      });
      herbariumUrl = blob.url;
    }

    // ── 4. Load or create workbook ─────────────────────────────
    let workbook = await fetchWorkbook();

    if (!workbook) {
      workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([COLUMNS]);
      XLSX.utils.book_append_sheet(workbook, ws, "Plants");
    }

    const ws = workbook.Sheets[workbook.SheetNames[0]];

    // ── 5. Append row ──────────────────────────────────────────
    // Photo column stores the Blob URL (full URL) so the database
    // page can load it directly without guessing the path.
    // The fieldPhotoUrl IS the full https:// URL to the image.
    XLSX.utils.sheet_add_aoa(
      ws,
      [[
        vendorNo, plantName, family, therapeuticUse,
        localName, habitat, collectionArea, plantPartsUsed,
        fieldPhotoUrl || safeBase,   // store full URL if uploaded, else name
      ]],
      { origin: -1 }
    );

    // ── 6. Write updated Excel back to Blob ────────────────────
    const outBuf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await put(XLSX_BLOB_PATHNAME, outBuf, {
      access: "public",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return NextResponse.json({
      success: true,
      message: `"${plantName}" added successfully.`,
      fieldPhotoUrl,
      herbariumUrl,
    });

  } catch (err: any) {
    console.error("[POST /api/plants]", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "api/plants is reachable" });
}