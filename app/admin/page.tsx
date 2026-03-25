"use client";

// ─────────────────────────────────────────────────────────────
// FILE: app/admin/page.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────

type PlantForm = {
  vendorNo: string;
  plantName: string;
  family: string;
  therapeuticUse: string;
  localName: string;
  habitat: string;
  collectionArea: string;
  plantPartsUsed: string;
};

type ImageSlot = {
  file: File | null;
  preview: string | null;
  label: string;
  icon: string;
  suffix: string; // "" for field photo, "_Herbarium" for herbarium
};

const EMPTY_FORM: PlantForm = {
  vendorNo: "",
  plantName: "",
  family: "",
  therapeuticUse: "",
  localName: "",
  habitat: "",
  collectionArea: "",
  plantPartsUsed: "",
};

const FIELDS: {
  key: keyof PlantForm;
  label: string;
  placeholder: string;
  required: boolean;
  textarea?: boolean;
  icon: string;
}[] = [
  { key: "vendorNo",       label: "Voucher No.",      placeholder: "e.g. TACT-001",                     required: true,  icon: "🔖" },
  { key: "plantName",      label: "Plant Name",        placeholder: "Scientific name (italic)",           required: true,  icon: "🌿" },
  { key: "family",         label: "Family",            placeholder: "e.g. Fabaceae",                     required: true,  icon: "🏷️" },
  { key: "localName",      label: "Local Name",        placeholder: "Local / common name",               required: false, icon: "🗣️" },
  { key: "habitat",        label: "Habitat",           placeholder: "e.g. Moist deciduous forest",      required: false, icon: "🌍" },
  { key: "collectionArea", label: "Collection Area",   placeholder: "District / village / coordinates",  required: false, icon: "📍" },
  { key: "plantPartsUsed", label: "Plant Parts Used",  placeholder: "e.g. Leaves, Bark, Root",          required: false, icon: "✂️" },
  { key: "therapeuticUse", label: "Therapeutic Use",   placeholder: "Describe the medicinal uses…",     required: true,  textarea: true, icon: "🩺" },
];

// ─── Drag-and-drop image uploader ────────────────────────────

function ImageUploader({
  slot,
  onChange,
}: {
  slot: ImageSlot;
  onChange: (file: File | null, preview: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(file, e.target?.result as string);
    reader.readAsDataURL(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold uppercase tracking-widest text-green-800 flex items-center gap-1.5">
        <span>{slot.icon}</span> {slot.label}
      </label>

      {slot.preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-green-300 shadow-sm group" style={{ height: "200px" }}>
          <img src={slot.preview} alt={slot.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-green-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null, null)}
              className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
            >
              Remove
            </button>
          </div>
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {slot.label}
          </span>
          <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ✓ Ready
          </span>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 select-none
            ${dragging
              ? "border-green-500 bg-green-50 scale-[1.02]"
              : "border-green-200 bg-[#f8faf7] hover:border-green-400 hover:bg-green-50"
            }`}
          style={{ height: "200px" }}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-transform ${dragging ? "scale-110" : ""}`}
            style={{ background: "linear-gradient(135deg, #d1fae5, #bbf7d0)" }}>
            {slot.icon}
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-green-800">{slot.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {dragging ? "Drop to upload" : "Click or drag & drop · JPG, PNG, WEBP"}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────

function Toast({ message, type, onClose }: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  const colors = {
    success: "bg-green-800 text-white",
    error:   "bg-red-700 text-white",
    info:    "bg-blue-700 text-white",
  };
  const icons = { success: "✅", error: "❌", info: "ℹ️" };

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold ${colors[type]} animate-bounce-once`}
      style={{ minWidth: "280px", maxWidth: "90vw" }}>
      <span className="text-lg">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [form, setForm] = useState<PlantForm>(EMPTY_FORM);
  const [images, setImages] = useState<ImageSlot[]>([
    { file: null, preview: null, label: "Field Photo",     icon: "📷", suffix: ""           },
    { file: null, preview: null, label: "Herbarium Sheet", icon: "🌿", suffix: "_Herbarium" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [submitted, setSubmitted] = useState<PlantForm | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PlantForm, string>>>({});

  function setField(key: keyof PlantForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function updateImage(idx: number, file: File | null, preview: string | null) {
    setImages((imgs) => imgs.map((img, i) => i === idx ? { ...img, file, preview } : img));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof PlantForm, string>> = {};
    if (!form.vendorNo.trim())       errs.vendorNo      = "Voucher No. is required";
    if (!form.plantName.trim())      errs.plantName     = "Plant Name is required";
    if (!form.family.trim())         errs.family        = "Family is required";
    if (!form.therapeuticUse.trim()) errs.therapeuticUse = "Therapeutic Use is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function showToast(message: string, type: "success" | "error" | "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Download images as ZIP instructions ────────────────────
  // Since we can't write to the server directly, we:
  // 1. Trigger individual image downloads named correctly
  // 2. Append row to Data.xlsx and trigger download
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    setSubmitting(true);

    try {
      // ── Step 1: Fetch existing Excel, append row ──────────
      let workbook: XLSX.WorkBook;
      try {
        const res = await fetch("/Data.xlsx");
        const buf = await res.arrayBuffer();
        workbook = XLSX.read(buf, { type: "array" });
      } catch {
        // If no existing file, create fresh workbook
        workbook = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([[
          "Voucher No.", "Plant Name", "Family", "Therapeutic Use",
          "Local Name", "Habitat", "Collection Area", "Plant Parts Used", "Photo"
        ]]);
        XLSX.utils.book_append_sheet(workbook, ws, "Plants");
      }

      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];

      // Derive the photo filename from plant name
      const safePhotoName = form.plantName.trim().replace(/[/\\?%*:|"<>]/g, "_");

      // Append row
      const newRow = [
        form.vendorNo.trim(),
        form.plantName.trim(),
        form.family.trim(),
        form.therapeuticUse.trim(),
        form.localName.trim(),
        form.habitat.trim(),
        form.collectionArea.trim(),
        form.plantPartsUsed.trim(),
        safePhotoName, // Photo column — filename without extension
      ];
      XLSX.utils.sheet_add_aoa(ws, [newRow], { origin: -1 });

      // Download updated Excel
      const xlsxBuf = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
      const xlsxBlob = new Blob([xlsxBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const xlsxUrl = URL.createObjectURL(xlsxBlob);
      const xlsxA = document.createElement("a");
      xlsxA.href = xlsxUrl;
      xlsxA.download = "Data.xlsx";
      xlsxA.click();
      URL.revokeObjectURL(xlsxUrl);

      // ── Step 2: Download each image with correct filename ─
      for (const slot of images) {
        if (!slot.file || !slot.preview) continue;

        const ext = slot.file.name.split(".").pop() ?? "jpg";
        const filename = `${safePhotoName}${slot.suffix}.${ext}`;

        // Convert dataURL → blob → download
        const res = await fetch(slot.preview);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        // Small delay between downloads so browser doesn't block
        await new Promise((r) => setTimeout(r, 300));
      }

      setSubmitted(form);
      setForm(EMPTY_FORM);
      setImages([
        { file: null, preview: null, label: "Field Photo",     icon: "📷", suffix: ""           },
        { file: null, preview: null, label: "Herbarium Sheet", icon: "🌿", suffix: "_Herbarium" },
      ]);
      setErrors({});
      showToast("Plant record saved! Move downloaded files to /public/plants/", "success");

    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setForm(EMPTY_FORM);
    setImages([
      { file: null, preview: null, label: "Field Photo",     icon: "📷", suffix: ""           },
      { file: null, preview: null, label: "Herbarium Sheet", icon: "🌿", suffix: "_Herbarium" },
    ]);
    setErrors({});
    setSubmitted(null);
  }

  const hasImages = images.some((s) => s.file !== null);

  return (
    <div className="font-serif min-h-screen bg-[#f4f7f4]">

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-green-950 shadow-lg border-b border-green-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-green-300 hover:text-white font-semibold text-sm transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Home</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center text-lg shadow-inner">🌿</div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm leading-tight">Admin Panel</span>
              <span className="text-green-400 text-[10px] tracking-widest uppercase">Plant Data Entry</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/database")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">View Database</span>
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="bg-green-950 text-white pb-10 pt-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-5">
            <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-green-700/50 border border-green-600/40 items-center justify-center text-4xl shrink-0">
              ➕
            </div>
            <div>
              <p className="text-green-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">IKS Digital Repository</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Add New Plant Record</h1>
              <p className="text-green-300 text-sm mt-2 max-w-xl leading-relaxed">
                Fill in the plant details and upload photos. The system will generate a
                properly named Excel row and image files ready to place in{" "}
                <code className="bg-green-800/60 px-1.5 py-0.5 rounded text-green-200 text-xs">/public/plants/</code>.
              </p>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="mt-8 flex items-center gap-0 flex-wrap sm:flex-nowrap">
            {["Fill Plant Details", "Upload Photos", "Download & Save Files"].map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-2 bg-green-800/50 border border-green-700/40 rounded-lg px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-green-200 text-xs font-medium whitespace-nowrap">{step}</span>
                </div>
                {i < 2 && <div className="w-6 h-px bg-green-700 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FORM ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Success banner */}
        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl shrink-0">✅</div>
            <div className="flex-1">
              <p className="font-bold text-green-900 text-sm">Record submitted successfully!</p>
              <p className="text-green-700 text-xs mt-0.5">
                <span className="font-semibold italic">{submitted.plantName}</span> ({submitted.vendorNo}) — Excel and images downloaded.
                Move images to <code className="bg-green-100 px-1 rounded">/public/plants/</code> and replace{" "}
                <code className="bg-green-100 px-1 rounded">/public/Data.xlsx</code> on your server.
              </p>
            </div>
            <button
              onClick={resetAll}
              className="shrink-0 px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition"
            >
              Add Another
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* ── PLANT DETAILS CARD ──────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden">
            <div className="bg-green-900 px-6 py-4 flex items-center gap-3">
              <span className="text-xl">📋</span>
              <div>
                <h2 className="text-white font-bold text-sm">Plant Information</h2>
                <p className="text-green-300 text-[11px]">Fields marked with * are required</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FIELDS.filter(f => !f.textarea).map((field) => (
                <div key={field.key} className={field.key === "therapeuticUse" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-green-800 mb-1.5">
                    <span className="mr-1">{field.icon}</span>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 transition focus:outline-none focus:ring-4
                      ${errors[field.key]
                        ? "border-red-400 focus:ring-red-100 bg-red-50"
                        : "border-gray-200 focus:border-green-600 focus:ring-green-100"
                      }`}
                  />
                  {errors[field.key] && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>⚠️</span> {errors[field.key]}
                    </p>
                  )}
                </div>
              ))}

              {/* Textarea for therapeutic use */}
              {FIELDS.filter(f => f.textarea).map((field) => (
                <div key={field.key} className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-green-800 mb-1.5">
                    <span className="mr-1">{field.icon}</span>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    rows={4}
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 transition focus:outline-none focus:ring-4 resize-none leading-relaxed
                      ${errors[field.key]
                        ? "border-red-400 focus:ring-red-100 bg-red-50"
                        : "border-gray-200 focus:border-green-600 focus:ring-green-100"
                      }`}
                  />
                  {errors[field.key] && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>⚠️</span> {errors[field.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── IMAGE UPLOAD CARD ────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden">
            <div className="bg-green-900 px-6 py-4 flex items-center gap-3">
              <span className="text-xl">🖼️</span>
              <div>
                <h2 className="text-white font-bold text-sm">Plant Photography</h2>
                <p className="text-green-300 text-[11px]">Upload field photo and/or herbarium sheet — optional but recommended</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {images.map((slot, idx) => (
                <ImageUploader
                  key={slot.label}
                  slot={slot}
                  onChange={(file, preview) => updateImage(idx, file, preview)}
                />
              ))}
            </div>

            {/* Naming convention notice */}
            <div className="mx-6 mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <span className="text-lg shrink-0">💡</span>
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-bold mb-1">Auto-naming convention</p>
                <p>Images will be downloaded as:</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  <li className="bg-amber-100 rounded px-2 py-0.5">
                    {form.plantName.trim()
                      ? `${form.plantName.trim().replace(/[/\\?%*:|"<>]/g, "_")}.jpg`
                      : "<Plant Name>.jpg"} <span className="text-amber-600 font-sans">(field photo)</span>
                  </li>
                  <li className="bg-amber-100 rounded px-2 py-0.5">
                    {form.plantName.trim()
                      ? `${form.plantName.trim().replace(/[/\\?%*:|"<>]/g, "_")}_Herbarium.jpg`
                      : "<Plant Name>_Herbarium.jpg"} <span className="text-amber-600 font-sans">(herbarium)</span>
                  </li>
                </ul>
                <p className="mt-1.5 text-amber-700">Place these in <code className="bg-amber-200 px-1 rounded">/public/plants/</code> on your server.</p>
              </div>
            </div>
          </div>

          {/* ── ACTION ROW ──────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center gap-4">

            <button
              type="button"
              onClick={resetAll}
              className="w-full sm:w-auto order-2 sm:order-1 px-6 py-3 border-2 border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 rounded-xl text-sm font-semibold transition-colors"
            >
              Clear Form
            </button>

            {/* Download summary */}
            <div className="flex-1 order-3 sm:order-2 hidden sm:flex items-center gap-4 justify-center">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${form.vendorNo && form.plantName && form.family && form.therapeuticUse ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {form.vendorNo && form.plantName && form.family && form.therapeuticUse ? "✓" : "1"}
                </span>
                Form valid
              </div>
              <div className="w-6 h-px bg-gray-200" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${hasImages ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {hasImages ? "✓" : "2"}
                </span>
                Photos ready
              </div>
              <div className="w-6 h-px bg-gray-200" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] font-bold">3</span>
                Download
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto order-1 sm:order-3 relative overflow-hidden px-8 py-3 bg-green-800 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-green-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                  </svg>
                  Save & Download Files
                </>
              )}
            </button>
          </div>

          {/* Instructions card */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-green-900 flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center text-sm">📌</span>
              After Downloading
            </h3>
            <ol className="space-y-2">
              {[
                { step: "Replace", detail: "Overwrite /public/Data.xlsx on your server with the downloaded Data.xlsx" },
                { step: "Move images", detail: "Place the downloaded image files into /public/plants/ directory" },
                { step: "Verify", detail: "Open the Database page and search for the new plant to confirm it appears" },
              ].map(({ step, detail }, i) => (
                <li key={step} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-green-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-600">
                    <span className="font-semibold text-green-900">{step} — </span>
                    {detail}
                  </span>
                </li>
              ))}
            </ol>
          </div>

        </form>
      </div>

      {/* ── TOAST ─────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="mt-12 bg-green-950 text-gray-500 py-6 text-center text-xs">
        <p>
          &copy; {new Date().getFullYear()} Trident Academy of Creative Technology, BBSR
          &amp; IKS Division, Govt. of India — Admin Panel
        </p>
      </footer>

    </div>
  );
}
