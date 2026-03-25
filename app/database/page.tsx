"use client";

// ─────────────────────────────────────────────────────────────
// FILE: app/database/page.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────

type Plant = {
  vendorNo: string;
  plantName: string;
  family: string;
  ethnobotanicalUse: string;
  photo: string;
};

// ─── Image helper ─────────────────────────────────────────────

function getPlantImageCandidates(photo: string, plantName: string): string[] {
  const source = (photo || plantName || "").trim();
  if (!source) return ["/hero-plant.png"];

  if (
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("/")
  ) {
    return [source, "/hero-plant.png"];
  }

  const exts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const hasExt = /\.(jpe?g|png|webp|gif)$/i.test(source);
  const base = source.replace(/\.(jpe?g|png|webp|gif)$/i, "").trim();

  function variants(name: string): string[] {
    const n = name.replace(/\s+/g, " ").replace(/\.+$/, "").trim();
    const out: string[] = [];
    if (hasExt) {
      out.push(`/plants/${encodeURIComponent(n)}`);
    } else {
      for (const ext of exts) {
        out.push(`/plants/${encodeURIComponent(n + ext)}`);
      }
    }
    return out;
  }

  const all = [...variants(source)];

  if (!/\(2\)$/i.test(base)) {
    all.push(...variants(`${base} (2)`));
  }
  const noTwo = base.replace(/\s*\(2\)$/, "").trim();
  if (noTwo && noTwo !== base) {
    all.push(...variants(noTwo));
  }

  all.push("/hero-plant.png");
  return [...new Set(all)];
}

// ─── PlantImageGrid ───────────────────────────────────────────
// Shows all resolved images in a grid:
//   1 image  → full-width, tall
//   2 images → side by side, equal width
//   3+       → first image full-width, rest in a row below

function PlantImageGrid({
  photo,
  plantName,
}: {
  photo: string;
  plantName: string;
}) {
  const allCandidates = getPlantImageCandidates(photo, plantName);

  // Track which candidate indices have successfully loaded
  const [loaded, setLoaded] = useState<number[]>([]);
  // Track which have errored so we skip them
  const [errored, setErrored] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoaded([]);
    setErrored(new Set());
  }, [photo, plantName]);

  // Pre-probe all candidates (excluding the fallback "/hero-plant.png")
  // so we know exactly how many real images exist before rendering.
  const probeTargets = allCandidates.filter((s) => s !== "/hero-plant.png");

  useEffect(() => {
    if (probeTargets.length === 0) return;
    probeTargets.forEach((src, i) => {
      const img = new window.Image();
      img.onload = () =>
        setLoaded((prev) =>
          prev.includes(i) ? prev : [...prev, i].sort((a, b) => a - b)
        );
      img.onerror = () =>
        setErrored((prev) => {
          const next = new Set(prev);
          next.add(i);
          return next;
        });
      img.src = src;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, plantName]);

  // Build the final display list from successfully loaded probes
  const displaySrcs: string[] =
    loaded.length > 0
      ? loaded.map((i) => probeTargets[i])
      : errored.size === probeTargets.length && probeTargets.length > 0
      ? ["/hero-plant.png"]
      : probeTargets.length > 0
      ? [] // still probing — show skeleton
      : ["/hero-plant.png"];

  // Still probing
  if (displaySrcs.length === 0) {
    return (
      <div className="w-full h-72 rounded-xl bg-green-50 border border-green-100 animate-pulse flex items-center justify-center">
        <span className="text-green-300 text-4xl">🌿</span>
      </div>
    );
  }

  const count = displaySrcs.length;

  // ── 1 image: full width, tall
  if (count === 1) {
    return (
      <div className="w-full rounded-xl overflow-hidden border border-green-100 shadow-sm">
        <img
          src={displaySrcs[0]}
          alt={plantName}
          className="w-full h-80 object-cover"
        />
      </div>
    );
  }

  // ── 2 images: side by side
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {displaySrcs.map((src, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden border border-green-100 shadow-sm"
          >
            <img
              src={src}
              alt={`${plantName} ${i + 1}`}
              className="w-full h-64 object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  // ── 3+ images: first full-width, rest in a row
  const [first, ...rest] = displaySrcs;
  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-green-100 shadow-sm">
        <img
          src={first}
          alt={`${plantName} 1`}
          className="w-full h-72 object-cover"
        />
      </div>
      <div className={`grid gap-2 grid-cols-${Math.min(rest.length, 3)}`}>
        {rest.map((src, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden border border-green-100 shadow-sm"
          >
            <img
              src={src}
              alt={`${plantName} ${i + 2}`}
              className="w-full h-40 object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Database Page ────────────────────────────────────────────

export default function DatabasePage() {
  const router = useRouter();

  const [data, setData] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "family" | "voucher">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const rowsPerPage = 12;

  // ── Load Excel ───────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/Data.xlsx");
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        const plants: Plant[] = rows.map((row) => ({
          vendorNo:
            row["Voucher No."] ??
            row["VoucherNo"] ??
            row["Voucher No"] ??
            row["voucher"] ??
            "",
          plantName:
            row["Plant Name"] ?? row["PlantName"] ?? row["plant_name"] ?? "",
          family: row["Family"] ?? row["family"] ?? "",
          ethnobotanicalUse:
            row["Therapeutic Use"] ??
            row["TherapeuticUse"] ??
            row["Ethnobotanical Use"] ??
            row["Use"] ??
            "",
          photo: row["Photo"] ?? row["photo"] ?? row["Image"] ?? "",
        }));

        setData(plants);
      } catch (err) {
        console.error("Failed to load Excel:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Derived state ────────────────────────────────────────────
  const uniqueFamilies = [...new Set(data.map((p) => p.family))].sort();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.plantName.toLowerCase().includes(q) ||
      item.family.toLowerCase().includes(q) ||
      item.vendorNo.toLowerCase().includes(q) ||
      item.ethnobotanicalUse.toLowerCase().includes(q);
    const matchesFamily =
      selectedFamily === "all" ||
      item.family.toLowerCase() === selectedFamily.toLowerCase();
    return matchesSearch && matchesFamily;
  });

  const sorted = [...filtered].sort((a, b) => {
    const keyMap: Record<"name" | "family" | "voucher", keyof Plant> = {
      name: "plantName",
      family: "family",
      voucher: "vendorNo",
    };
    const key = keyMap[sortBy];
    const av = (a[key] as string).toLowerCase();
    const bv = (b[key] as string).toLowerCase();
    return sortOrder === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const paginated = sorted.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  function clearFilters() {
    setSearch("");
    setSelectedFamily("all");
    setCurrentPage(1);
  }

  function exportCSV() {
    if (!sorted.length) return;
    const rows = sorted.map((p) => ({
      "Voucher No.": p.vendorNo,
      "Plant Name": p.plantName,
      Family: p.family,
      "Therapeutic Use": p.ethnobotanicalUse,
    }));
    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `ethno-medicinal-plants-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Pagination helper ────────────────────────────────────────
  function pageNumbers(): (number | "…")[] {
    const nums = Array.from({ length: totalPages }, (_, i) => i + 1);
    return nums
      .filter(
        (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
      )
      .reduce<(number | "…")[]>((acc, p, i, arr) => {
        if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
        acc.push(p);
        return acc;
      }, []);
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="font-serif min-h-screen bg-[#f8f6f1]">

      {/* ── TOP NAV ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white shadow-md border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Back */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-green-800 hover:text-green-600 font-semibold text-sm transition-colors group"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline">Back to Home</span>
          </button>

          {/* Title */}
          <div className="flex flex-col items-center text-center">
            <span className="text-base sm:text-lg font-bold text-green-900 leading-tight">
              IKS Digital Repository
            </span>
            <span className="text-[11px] text-green-600 tracking-wide">
              Ethno-medicinal Plant Database
            </span>
          </div>

          {/* Export */}
          <button
            onClick={exportCSV}
            disabled={sorted.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-800 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
              />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
          </button>

        </div>
      </nav>

      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #16a34a 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
          <div className="flex-1">
            <p className="text-yellow-300 uppercase tracking-[0.2em] text-xs font-semibold mb-2">
              Digital Repository
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
              Ethno-medicinal Plant Database
            </h1>
            <div className="w-14 h-1 bg-yellow-400 mb-4 rounded-full" />
            <p className="text-green-100 text-sm sm:text-base leading-relaxed max-w-lg">
              Documented records of medicinal plants used by tribal communities of Eastern
              Odisha, curated under the IKS Division, Ministry of Education, Govt. of India.
            </p>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap sm:flex-col gap-3">
            {(
              [
                { emoji: "🌿", label: "Total Plants", value: data.length },
                {
                  emoji: "🏠",
                  label: "Families",
                  value: uniqueFamilies.length,
                },
                { emoji: "🔍", label: "Filtered", value: sorted.length },
              ] as const
            ).map(({ emoji, label, value }) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 flex items-center gap-3 min-w-[140px]"
              >
                <span className="text-2xl">{emoji}</span>
                <div>
                  <div className="text-xl font-bold">{value}</div>
                  <div className="text-[11px] text-green-200 uppercase tracking-wide">
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">

        {/* Search & filter card */}
        <div className="bg-white rounded-2xl shadow-md border border-green-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-green-900 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
                />
              </svg>
              Search &amp; Filter
            </h2>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-green-700 hover:text-green-900 text-xs font-semibold transition-colors"
            >
              {showAdvanced ? "▲ Hide" : "▼ Advanced"} Filters
            </button>
          </div>

          <input
            type="text"
            placeholder="Search by plant name, family, voucher number, or therapeutic use…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-3 border-2 border-green-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 text-sm text-gray-800 placeholder:text-gray-400 transition"
          />

          {showAdvanced && (
            <div className="mt-4 grid sm:grid-cols-3 gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <div>
                <label className="block text-xs font-bold text-green-800 uppercase tracking-wide mb-1.5">
                  Filter by Family
                </label>
                <select
                  value={selectedFamily}
                  onChange={(e) => {
                    setSelectedFamily(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Families</option>
                  {uniqueFamilies.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-green-800 uppercase tracking-wide mb-1.5">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "name" | "family" | "voucher")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="name">Plant Name</option>
                  <option value="family">Family</option>
                  <option value="voucher">Voucher No.</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-green-800 uppercase tracking-wide mb-1.5">
                  Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "asc" | "desc")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="asc">Ascending (A → Z)</option>
                  <option value="desc">Descending (Z → A)</option>
                </select>
              </div>
            </div>
          )}

          {(search || selectedFamily !== "all") && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {search && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 rounded-full px-3 py-1 text-xs font-medium">
                  &ldquo;{search}&rdquo;
                  <button
                    onClick={() => setSearch("")}
                    className="ml-1 hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedFamily !== "all" && (
                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-xs font-medium">
                  {selectedFamily}
                  <button
                    onClick={() => setSelectedFamily("all")}
                    className="ml-1 hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-red-600 underline transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-green-700">
            <svg
              className="w-10 h-10 animate-spin"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.36-6.36l-2.12 2.12M8.76 15.24l-2.12 2.12M18.36 18.36l-2.12-2.12M8.76 8.76L6.64 6.64"
              />
            </svg>
            <span className="text-sm font-medium">Loading plant database…</span>
          </div>
        )}

        {/* Empty */}
        {!loading && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
            <span className="text-5xl">🌱</span>
            <p className="text-lg font-semibold text-green-900">No plants found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
            <button
              onClick={clearFilters}
              className="mt-2 px-5 py-2 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && sorted.length > 0 && (
          <div className="rounded-2xl border border-green-200 shadow-xl overflow-hidden">

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-green-900 text-white uppercase tracking-wider text-xs">
                    <th className="px-5 py-4 text-left w-28">Voucher No.</th>
                    <th className="px-5 py-4 text-left w-56">Plant Name</th>
                    <th className="px-5 py-4 text-left w-44">Family</th>
                    <th className="px-5 py-4 text-left">Therapeutic Use</th>
                    <th className="px-5 py-4 text-center w-24">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item, i) => (
                    <tr
                      key={`${item.vendorNo}-${i}`}
                      className={`border-b border-green-100 hover:bg-green-50 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-[#fafdf8]"
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-green-800 font-semibold">
                        {item.vendorNo}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800 italic">
                        {item.plantName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                          {item.family}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-sm">
                        <span className="line-clamp-2">
                          {item.ethnobotanicalUse}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedPlant(item)}
                          className="inline-flex items-center gap-1 bg-green-800 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-green-100 bg-white">
              {paginated.map((item, i) => (
                <div key={`${item.vendorNo}-${i}`} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800 italic text-base leading-tight">
                        {item.plantName}
                      </p>
                      <p className="text-xs text-green-700 font-mono mt-0.5">
                        {item.vendorNo}
                      </p>
                    </div>
                    <span className="shrink-0 bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {item.family}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {item.ethnobotanicalUse}
                  </p>
                  <button
                    onClick={() => setSelectedPlant(item)}
                    className="w-full mt-1 bg-green-800 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-semibold text-green-800">
                {(currentPage - 1) * rowsPerPage + 1}–
                {Math.min(currentPage * rowsPerPage, sorted.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-green-800">{sorted.length}</span>{" "}
              records
            </p>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-green-200 text-green-800 hover:bg-green-50 disabled:opacity-40 transition"
              >
                ← Prev
              </button>

              {pageNumbers().map((p, i) =>
                p === "…" ? (
                  <span key={`dots-${i}`} className="px-2 text-gray-400 text-xs">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      currentPage === p
                        ? "bg-green-800 text-white shadow"
                        : "bg-white border border-green-200 text-green-800 hover:bg-green-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-green-200 text-green-800 hover:bg-green-50 disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── PLANT DETAIL MODAL ──────────────────────────────── */}
      {selectedPlant !== null && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPlant(null);
          }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[95vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-green-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-green-600">
                Plant Details
              </span>
              <button
                onClick={() => setSelectedPlant(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <PlantImageGrid
                photo={selectedPlant.photo}
                plantName={selectedPlant.plantName}
              />

              <div>
                <h2 className="text-2xl font-bold text-green-900 italic leading-tight">
                  {selectedPlant.plantName}
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Voucher No: {selectedPlant.vendorNo}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-green-700">
                  Family:
                </span>
                <span className="bg-green-100 text-green-800 rounded-full px-3 py-0.5 text-sm font-medium">
                  {selectedPlant.family}
                </span>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">
                  Therapeutic Use
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedPlant.ethnobotanicalUse}
                </p>
              </div>

              <button
                onClick={() => setSelectedPlant(null)}
                className="w-full bg-green-800 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="mt-12 bg-green-950 text-gray-400 py-8 text-center text-xs">
        <p>
          &copy; {new Date().getFullYear()} Trident Academy of Creative Technology, BBSR
          &amp; IKS Division, Govt. of India. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
