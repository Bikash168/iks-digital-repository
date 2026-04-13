"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plant = {
  vendorNo: string;
  plantName: string;
  family: string;
  ethnobotanicalUse: string;
  photo: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NAVBAR_HEIGHT = 130;
const NAV_SECTIONS = ["home", "about", "project", "database", "conservation", "dissemination", "gallery", "contact"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPlantImageCandidates = (photo: string, plantName: string): string[] => {
  const rawPhoto = (photo || "").trim();
  const rawName = (plantName || "").trim();
  const source = rawPhoto || rawName;

  if (!source) return ["/hero-plant.png"];

  if (
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("/")
  ) {
    return [source, "/hero-plant.png"];
  }

  const exts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const hasExistingExt = /\.(jpe?g|png|webp|gif)$/i.test(source);
  const baseName = source.replace(/\.(jpe?g|png|webp|gif)$/i, "").trim();

  const normalizeBase = (name: string) => name.replace(/\s+/g, " ").trim();
  const withoutTrailingDot = (name: string) => name.replace(/\.+$/, "").trim();

  const makeCandidates = (name: string): string[] => {
    const normalized = normalizeBase(name);
    const withoutDot = withoutTrailingDot(normalized);
    const bases = Array.from(new Set([normalized, withoutDot]));
    const candidates: string[] = [];

    for (const base of bases) {
      if (hasExistingExt) {
        candidates.push(`/plants/${encodeURIComponent(base)}`);
        candidates.push(`/plants/${encodeURIComponent(`${base} `)}`);
      } else {
        for (const ext of exts) {
          candidates.push(`/plants/${encodeURIComponent(`${base}${ext}`)}`);
          candidates.push(`/plants/${encodeURIComponent(`${base} ${ext}`)}`);
        }
      }
    }
    return candidates;
  };

  const candidates = makeCandidates(source);

  if (!/\(2\)\.jpe?g$/i.test(source) && !/\(2\)$/i.test(source)) {
    candidates.push(...makeCandidates(`${baseName} (2)`));
  }

  const noTwo = baseName.replace(/\s*\(2\)$/, "").trim();
  if (noTwo && noTwo !== baseName) {
    candidates.push(...makeCandidates(noTwo));
  }

  candidates.push("/hero-plant.png");
  return Array.from(new Set(candidates));
};

// ─── PlantImageCarousel ───────────────────────────────────────────────────────

function PlantImageCarousel({
  photo,
  plantName,
  className,
}: {
  photo: string;
  plantName: string;
  className?: string;
  [key: string]: any;
}) {
  const candidates = getPlantImageCandidates(photo, plantName);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [photo, plantName]);

  const normalizedIndex = Math.min(index, Math.max(0, candidates.length - 1));
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(candidates.length - 1, i + 1));
  const handleError = () => {
    setIndex((i) => (i < candidates.length - 1 ? i + 1 : i));
  };

  return (
    <div className="relative">
      <img
        src={candidates[normalizedIndex]}
        className={className}
        onError={handleError}
        alt={plantName}
      />

      {candidates.length > 1 && (
        <div className="absolute inset-x-0 top-2 flex items-center justify-between px-4">
          <button
            onClick={prev}
            className="rounded-full bg-black/40 text-white p-2 hover:bg-black/60 transition"
            disabled={normalizedIndex === 0}
          >
            ‹
          </button>
          <button
            onClick={next}
            className="rounded-full bg-black/40 text-white p-2 hover:bg-black/60 transition"
            disabled={normalizedIndex === candidates.length - 1}
          >
            ›
          </button>
        </div>
      )}

      {candidates.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {candidates.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${
                i === normalizedIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();

  const [data, setData] = useState<Plant[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "family" | "voucher">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load Excel data
  useEffect(() => {
    const loadExcelData = async () => {
      try {
        const response = await fetch("/Data.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const plants: Plant[] = jsonData.map((row: any) => ({
          vendorNo:
            row["Voucher No."] ||
            row["VoucherNo"] ||
            row["voucher_no"] ||
            row["Voucher#"] ||
            row["voucher"] ||
            row["Voucher No"] ||
            "",
          plantName:
            row["Plant Name"] || row["PlantName"] || row["plant_name"] || "",
          family: row["Family"] || row["family"] || "",
          ethnobotanicalUse:
            row["Therapeutic Use"] ||
            row["TherapeuticUse"] ||
            row["Use"] ||
            row["use"] ||
            row["Ethnobotanical Use"] ||
            "",
          photo:
            row["Photo"] || row["photo"] || row["Image"] || row["image"] || "",
        }));

        setData(plants);
      } catch (error) {
        console.error("Failed to load Excel data:", error);
      }
    };

    loadExcelData();
  }, []);

  // Load gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        const res = await fetch("/api/gallery");
        const json = await res.json();
        if (Array.isArray(json.images)) {
          setGalleryImages(json.images);
        }
      } catch (error) {
        console.error("Failed to load gallery images:", error);
      }
    };

    loadGalleryImages();
  }, []);

  // Active section tracking
  useEffect(() => {
    const sections = NAV_SECTIONS.map((id) =>
      document.getElementById(id)
    ).filter(Boolean) as HTMLElement[];

    const handler = () => {
      let best: string | null = null;
      let bestDist = Infinity;
      for (const section of sections) {
        const top = section.getBoundingClientRect().top - NAVBAR_HEIGHT;
        if (top <= 10 && Math.abs(top) < bestDist) {
          bestDist = Math.abs(top);
          best = section.id;
        }
      }
      if (best) setActiveSection(best);
    };

    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Smooth scroll nav click
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      setMenuOpen(false);
      const target = document.getElementById(id);
      if (!target) return;
      const offsetTop =
        target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    },
    []
  );

  // Nav item renderer
  const navItem = (id: string, label: string) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={(e) => handleNavClick(e, id)}
      className={`relative pb-1 transition duration-300 ${
        activeSection === id
          ? "text-green-600"
          : "text-green-800 hover:text-green-600"
      }`}
    >
      {label}
      <span
        className={`absolute left-0 -bottom-1 h-[2px] bg-green-600 transition-all duration-300 ${
          activeSection === id ? "w-full" : "w-0"
        }`}
      />
    </a>
  );

  // Filtering & sorting
  const filteredData = data.filter(
    (item) =>
      (selectedFamily === "all" ||
        item.family.toLowerCase() === selectedFamily.toLowerCase()) &&
      (item.plantName.toLowerCase().includes(search.toLowerCase()) ||
        item.family.toLowerCase().includes(search.toLowerCase()) ||
        item.vendorNo.toLowerCase().includes(search.toLowerCase()) ||
        item.ethnobotanicalUse.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: string, bValue: string;
    switch (sortBy) {
      case "name":
        aValue = a.plantName.toLowerCase();
        bValue = b.plantName.toLowerCase();
        break;
      case "family":
        aValue = a.family.toLowerCase();
        bValue = b.family.toLowerCase();
        break;
      case "voucher":
        aValue = a.vendorNo.toLowerCase();
        bValue = b.vendorNo.toLowerCase();
        break;
      default:
        return 0;
    }
    return sortOrder === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const uniqueFamilies = Array.from(
    new Set(data.map((item) => item.family))
  ).sort();

  // Statistics
  const totalPlants = data.length;
  const uniqueFamiliesCount = uniqueFamilies.length;
  const filteredCount = sortedData.length;

  // Export CSV
  const exportToCSV = () => {
    if (sortedData.length === 0) return;
    const csvData = sortedData.map((item) => ({
      "Voucher No.": item.vendorNo,
      "Plant Name": item.plantName,
      Family: item.family,
      "Therapeutic Use": item.ethnobotanicalUse,
    }));
    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ethno-medicinal-plants-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="font-serif bg-[#f8f6f1]">

      {/* ── NAVBAR ───────────────────────────────────────────────────────────── */}
<nav className="fixed top-0 w-full bg-white shadow-md z-50">
  <div className="max-w-screen-xl mx-auto flex items-center px-4 md:px-10 py-3 md:py-5 gap-4 md:gap-6">

    {/* LEFT SECTION */}
    <div className="flex items-center gap-2 md:gap-4 pr-4 md:pr-10 border-r-2 border-green-200 shrink-0">

      {/* Logos */}
      <Image src="/logo1.png" alt="TACT Logo" width={72} height={72} className="w-9 h-9 md:w-[72px] md:h-[72px] object-contain" />
      <Image src="/logo2.png" alt="IKS Logo"  width={72} height={72} className="w-9 h-9 md:w-[72px] md:h-[72px] object-contain" />
      <Image src="/logo3.svg" alt="Govt Logo" width={72} height={72} className="w-9 h-9 md:w-[72px] md:h-[72px] object-contain" />

      {/* Vertical divider — desktop only */}
      <div className="hidden md:block w-px h-14 bg-green-200 mx-3" />

      {/* Title — desktop only */}
      <div className="hidden lg:flex flex-col justify-center">
        <span className="text-[16px] font-bold text-green-900 whitespace-nowrap leading-tight">
          IKS Digital Repository
        </span>
        <span className="text-[12px] text-green-600 whitespace-nowrap">
          Ethno-medicinal knowledge
        </span>
      </div>
    </div>

    {/* MOBILE TITLE — shown between logos and hamburger on small screens */}
    <div className="flex flex-col justify-center flex-1 md:hidden">
      <span className="text-[13px] font-bold text-green-900 leading-tight">
        IKS Digital Repository
      </span>
      <span className="text-[10px] text-green-600">
        Ethno-medicinal knowledge
      </span>
    </div>

    {/* SPACER — desktop only */}
    <div className="hidden md:flex flex-1" />

    {/* DESKTOP MENU */}
    <div className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-7 text-[13px] lg:text-[14px] font-semibold text-green-800 shrink-0">
      {navItem("home", "Home")}
      {navItem("about", "About")}
      {navItem("project", "Project")}
      {navItem("database", "Database")}
      {navItem("conservation", "Conservation")}
      {navItem("dissemination", "Dissemination")}
      {navItem("gallery", "Gallery")}
      {navItem("contact", "Contact")}
    </div>

    {/* MOBILE HAMBURGER */}
    <button
      className="md:hidden flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border border-green-200 shadow-sm shrink-0"
      onClick={() => setMenuOpen((prev) => !prev)}
      aria-label="Toggle menu"
    >
      <span className={`block w-6 h-0.5 bg-green-800 transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
      <span className={`block w-6 h-0.5 bg-green-800 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
      <span className={`block w-6 h-0.5 bg-green-800 transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
    </button>

  </div>

  {/* MOBILE MENU */}
  {menuOpen && (
    <div className="md:hidden bg-white border-t border-green-100 shadow-lg px-6 py-4 flex flex-col gap-4 text-[15px] font-semibold">
      {navItem("home", "Home")}
      {navItem("about", "About")}
      {navItem("project", "Project")}
      {navItem("database", "Database")}
      {navItem("conservation", "Conservation")}
      {navItem("dissemination", "Dissemination")}
      {navItem("gallery", "Gallery")}
      {navItem("contact", "Contact")}
    </div>
  )}
</nav>
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        id="home"
        className="relative flex items-center overflow-hidden text-white"
        style={{
          minHeight: "100vh",
          paddingTop: `${NAVBAR_HEIGHT}px`,
          background:
            "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #16a34a 100%)",
        }}
      >
        {/* Dot texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full flex flex-col md:flex-row items-center justify-between gap-12 py-16">

          {/* Left — Text */}
          <div className="flex-1 text-left max-w-xl">
            <p className="text-yellow-300 uppercase tracking-[0.25em] text-xs font-semibold mb-4">
              In Collaboration with
            </p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Indian Knowledge Systems (IKS Division) Ministry of Education · Govt. of India
            </h2>
            <div className="w-16 h-1 bg-yellow-400 mb-6 rounded-full" />
            <p className="text-base md:text-lg text-green-100 leading-relaxed">
              Digital Repository for Documentation of Ethno-medicinal Plants Used by Tribal
              Communities of Eastern Odisha
            </p>
          </div>

          {/* Right — Image card */}
          <div className="flex-1 flex justify-center md:justify-end">
            <div className="bg-white rounded-3xl shadow-2xl p-5 w-full max-w-lg">
              <Image
                src="/about-plant.jpg"
                alt="IKS System Diagram"
                width={600}
                height={450}
                priority
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────────────── */}
      <section id="about" className="py-24 px-6 md:px-16 bg-[#f8f6f1]">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-green-900">
              IKS digital repository
            </h2>
            <p className="text-lg text-yellow-700 mt-2 font-semibold">
              Trident Translational Initiative
            </p>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>

          {/* First row */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-justify text-gray-700 leading-relaxed text-lg space-y-6">
              <p>
                The Indian Knowledge Systems (IKS) are a well-organized and scientifically
                valid body of knowledge developed over the centuries through practice and
                observation. It is imperative to give prime importance to the documentation
                and digital preservation of the IKS. This will ensure the preservation of
                the indigenous intellectual heritage for the coming generations. The
                enhancement of the IKS in the empirical knowledge systems will make it more
                relevant to the present-day challenges faced by society. The IKS sanctioned
                project, "Development of Digital Repository for Documentation of
                Ethno-medicinal Plants Used by Different Tribal Communities of Eastern Odisha
                for Holistic Healthcare Management," led by Dr. Manisha Mohapatra, is one of
                the examples of the efforts put forth to demonstrate the translational
                approach for empirical knowledge-driven health assessments in tribal
                communities of eastern Odisha.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-green-100">
                <Image
                  src="/hero-plant.png"
                  alt="IKS About"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Second row */}
          <div className="grid md:grid-cols-2 gap-12 items-center mt-16">
            <div className="order-2 md:order-1 flex flex-col items-center">
              <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-green-100">
                <Image
                  src="/tribal-medicine.jpg"
                  alt="Tribal Ethnomedicine"
                  width={700}
                  height={450}
                  className="w-full h-auto object-contain bg-white"
                />
              </div>
            </div>
            <div className="text-justify text-gray-700 leading-relaxed text-lg space-y-6 order-1 md:order-2">
              <p>
                In the tribal scenario of eastern Odisha, the ethnomedicinal systems have
                shown a deep understanding of biodiversity, plant identification, preparation
                methods, dosage standards, and their usage. However, due to the largely oral
                and embedded nature of such knowledge in the cultural practices of the
                communities, it is susceptible to deterioration due to socio-economic
                changes, environmental changes, and the loss of continuity. In light of the
                urgent need to document and preserve such knowledge, an attempt is being made
                to document and digitize the knowledge in a way that preserves it while
                maintaining its authenticity and integrity. Ethnographic documentation,
                authentication of plant species, and documentation of preparation techniques,
                applications, and traditional stories associated with them are being done
                systematically. The digital platform is being developed to allow for
                searching, metadata integration, and long-term preservation in conformity
                with established data management practices. Through the conversion of tacit
                indigenous knowledge into a scientifically organized digital platform, this
                project is enhancing knowledge continuity, facilitating inter-disciplinary
                research, and informing decision-making on biodiversity conservation and
                sustainable healthcare practices. Simultaneously, ethical considerations
                including intellectual property protection and equitable benefit-sharing are
                being incorporated to ensure responsible and community-sensitive knowledge
                governance.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── PROJECT ──────────────────────────────────────────────────────────── */}
      <section id="project" className="py-20 sm:py-28 px-5 sm:px-8 lg:px-16 bg-green-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-green-900">
              Project Details
            </h2>
            <div className="w-20 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>
          <div className="bg-white shadow-xl rounded-3xl overflow-hidden border border-green-100">
            <div className="bg-green-900 px-8 py-6">
              <p className="text-xs font-bold uppercase tracking-widest text-green-300 mb-2">
                Project Title
              </p>
              <p className="text-white text-base sm:text-lg font-semibold leading-snug">
                Development of Digital Repository for Documentation of Ethno-medicinal Plants
                Used by Different Tribal Communities of Eastern Odisha for Holistic Healthcare
                Management
              </p>
            </div>
            <div className="px-8 py-8 grid sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                  Lead Principal Investigator
                </p>
                <p className="text-gray-800 font-semibold">Dr. Manisha Mohapatra</p>
                <p className="text-sm text-gray-500">Trident Academy of Creative Technology</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                  Co-Principal Investigators
                </p>
                <p className="text-gray-800 font-semibold">Dr. S N Mallick</p>
                <p className="text-sm text-gray-500">Ravenshaw University</p>
                <p className="text-gray-800 font-semibold">Dr. P Chand</p>
                <p className="text-sm text-gray-500">Trident Academy of Technology</p>
              </div>
              <div className="sm:col-span-2 pt-4 border-t border-green-100">
                <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-1">
                  Funding Body
                </p>
                <p className="text-gray-700 text-sm">
                  IKS Division, Ministry of Education, Government of India
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATABASE TEASER ──────────────────────────────────────────────────── */}
      <section id="database" className="py-16 md:py-20 bg-[#f8f6f1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">

          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900">Database</h2>
            <div className="w-20 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
            <p className="mt-4 text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Ethno-medicinal plant records documented from tribal communities of Eastern
              Odisha. Explore the full repository with search, filters, and detailed plant
              profiles.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {[
              { emoji: "🌿", value: totalPlants, label: "Total Plants" },
              { emoji: "🏠", value: uniqueFamiliesCount, label: "Families" },
              { emoji: "💊", value: 187, label: "Therapeutic Uses" },
              { emoji: "📍", value: "Eastern Odisha", label: "Region" },
            ].map(({ emoji, value, label }) => (
              <div
                key={label}
                className="bg-gradient-to-br from-white to-green-50 rounded-xl p-6 shadow-lg border border-green-200 text-center hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-2">{emoji}</div>
                <div className="text-3xl font-bold text-green-800 mb-1">{value}</div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Preview table — first 5 rows with gradient fade */}
          {data.length > 0 && (
            <div className="relative rounded-2xl border border-green-200 shadow-xl overflow-hidden mb-8">
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-green-900 text-white uppercase tracking-wide text-xs">
                    <tr>
                      <th className="px-5 py-4 text-left">Voucher No.</th>
                      <th className="px-5 py-4 text-left">Plant Name</th>
                      <th className="px-5 py-4 text-left">Family</th>
                      <th className="px-5 py-4 text-left">Therapeutic Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((item, i) => (
                      <tr
                        key={item.vendorNo + i}
                        className={`border-b border-green-100 ${
                          i % 2 === 0 ? "bg-white" : "bg-[#fafdf8]"
                        }`}
                      >
                        <td className="px-5 py-3 font-mono text-xs text-green-800 font-semibold">
                          {item.vendorNo}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-800 italic">
                          {item.plantName}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          <span className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                            {item.family}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600 text-sm">
                          <span className="line-clamp-1">{item.ethnobotanicalUse}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gradient fade-out */}
              <div
                className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(248,246,241,0) 0%, rgba(248,246,241,0.97) 100%)",
                }}
              />
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => router.push("/database")}
              className="inline-flex items-center gap-3 bg-green-900 hover:bg-green-700 active:scale-95 text-white px-8 py-4 rounded-2xl text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h10"
                />
              </svg>
              Open Full Repository
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7" />
              </svg>
            </button>
            <p className="mt-3 text-xs text-gray-500">
              Search, filter, and explore all {totalPlants} plant records with full details
            </p>
          </div>

        </div>
      </section>

      {/* ── CONSERVATION STRATEGIES ──────────────────────────────────────────── */}
      <section id="conservation" className="py-20 sm:py-28 px-5 sm:px-8 lg:px-16 bg-green-50">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-green-900">
              Conservation Strategies
            </h2>
            <div className="w-20 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
            <p className="mt-4 text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Safeguarding indigenous knowledge through ethical frameworks, IP protection, and
              responsible digital preservation.
            </p>
          </div>

          {/* IP & Access Protection */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-green-800 mb-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-900 text-white text-sm font-bold shrink-0">1</span>
              Intellectual Property &amp; Access Protection
            </h3>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  icon: "🔒",
                  title: "Built-in IP Protection Protocols",
                  desc: "Integration of built-in intellectual property (IP) protection protocols within the digital repository to safeguard indigenous knowledge.",
                },
                {
                  icon: "🔐",
                  title: "Controlled Access &amp; Consent-based Sharing",
                  desc: "Implementation of controlled access and consent-based data sharing mechanisms to prevent unauthorized use or exploitation.",
                },
                {
                  icon: "🏷️",
                  title: "Proper Attribution",
                  desc: "Ensuring proper attribution and recognition of traditional knowledge holders and communities.",
                },
                {
                  icon: "⚖️",
                  title: "Ethical Documentation &amp; Utilization",
                  desc: "Promoting ethical documentation, preservation, and responsible utilization of indigenous knowledge through the repository.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-2xl p-6 border border-green-200 shadow-md hover:shadow-lg transition-shadow flex gap-4"
                >
                  <span className="text-2xl shrink-0 mt-0.5">{card.icon}</span>
                  <div>
                    <p
                      className="font-bold text-green-900 mb-1 text-[15px]"
                      dangerouslySetInnerHTML={{ __html: card.title }}
                    />
                    <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Platforms & Community Networks */}
          <div>
            <h3 className="text-xl font-bold text-green-800 mb-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-900 text-white text-sm font-bold shrink-0">2</span>
              Knowledge Platforms &amp; Community Networks
            </h3>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  icon: "💻",
                  title: "Digital Knowledge Platforms",
                  desc: "Integration of documented information into a structured digital repository to facilitate knowledge sharing among researchers, policymakers, and healthcare practitioners.",
                },
                {
                  icon: "🤝",
                  title: "Local Markets &amp; Community Networks",
                  desc: "Interaction with local markets, self-help groups, and community organizations to understand the collection, trade, and utilization patterns of ethnomedicinal plants.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-2xl p-6 border border-green-200 shadow-md hover:shadow-lg transition-shadow flex gap-4"
                >
                  <span className="text-2xl shrink-0 mt-0.5">{card.icon}</span>
                  <div>
                    <p
                      className="font-bold text-green-900 mb-1 text-[15px]"
                      dangerouslySetInnerHTML={{ __html: card.title }}
                    />
                    <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright Notice */}
          <div className="mt-12 bg-green-900 text-green-100 rounded-2xl p-6 md:p-8 border border-green-700 text-sm leading-relaxed space-y-3">
            <p className="font-bold text-white text-base">
              © {new Date().getFullYear()} All Rights Reserved — Trident Academy of Creative Technology, BBSR &amp; IKS Division, Govt. of India
            </p>
            <p>
              The contents of this digital herbarium website cannot be reproduced partially or
              fully, without due permission from the Chief Mentor, Trident Academy of Creative
              Technology, BBSR and/or the IKS Division, Ministry of Education, Govt. of India.
              If referred to as a part of another publication, both the sources should be
              properly acknowledged. No part of this web-portal can be copied or reproduced in
              any available format.
            </p>
            <p className="text-green-300 text-xs">
              The Copyright Act 1957 and Copyright (Amendment) Act, 2012, Govt. of India will
              be applicable for any dispute. &nbsp;|&nbsp; Designed &amp; Developed by Trident
              Academy of Creative Technology, BBSR
            </p>
          </div>

        </div>
      </section>

      {/* ── KNOWLEDGE DISSEMINATION / OUTPUT ─────────────────────────────────── */}
      <section id="dissemination" className="py-20 sm:py-28 px-5 sm:px-8 lg:px-16 bg-[#f8f6f1]">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-green-900">
              Knowledge Dissemination / Output
            </h2>
            <div className="w-20 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>

          {/* Main text */}
          <div className="bg-white rounded-3xl shadow-xl border border-green-100 p-8 md:p-12 mb-10">
            <p className="text-gray-700 leading-relaxed text-lg text-justify">
              The ethnobiological knowledge of tribal communities in Odisha embodies a profound
              understanding of nature's pharmacopoeia, reflecting centuries of experiential wisdom
              rooted in the Indian Knowledge System (IKS). This study explores the indigenous
              medicinal plant use among major tribal groups of Odisha—such as the Kondh, Santal,
              Saora, and Juang—highlighting their traditional health practices, cultural beliefs,
              and ecological stewardship. These communities possess intricate knowledge of plant
              taxonomy, habitat ecology, and therapeutic formulations, passed orally through
              generations.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg text-justify mt-5">
              Medicinal flora such as <em>Rauvolfia serpentina</em>, <em>Terminalia chebula</em>,{" "}
              <em>Withania somnifera</em>, and <em>Curcuma longa</em> are extensively used to treat
              ailments ranging from fever, wounds, and digestive disorders to chronic illnesses.
              The IKS framework provides a holistic perspective that integrates spiritual,
              environmental, and health dimensions, emphasizing balance and sustainability.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg text-justify mt-5">
              Documentation and validation of this ethnobiological wisdom are vital for developing
              bio-conservation strategies and novel drug discovery. Moreover, integrating
              traditional practices with contemporary pharmacological research can bridge knowledge
              systems and foster equitable benefit-sharing with tribal custodians. This will ensure
              the preservation of the indigenous intellectual heritage for the coming generations.
              The enhancement of the IKS in the empirical knowledge systems will make it more
              relevant to the present-day challenges faced by society.
            </p>
          </div>

          {/* Highlighted tribal groups */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {["Kondh", "Santal", "Saora", "Juang"].map((tribe) => (
              <div
                key={tribe}
                className="bg-green-900 text-white rounded-2xl p-5 text-center shadow-md hover:bg-green-700 transition-colors"
              >
                <p className="text-2xl mb-2">🏕️</p>
                <p className="font-bold text-base">{tribe}</p>
                <p className="text-green-300 text-xs mt-1">Tribal Community</p>
              </div>
            ))}
          </div>

          {/* Key plants */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-green-800 mb-5 text-center">Key Documented Medicinal Plants</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Rauvolfia serpentina", use: "Hypertension, snake bite" },
                { name: "Terminalia chebula", use: "Digestive disorders, immunity" },
                { name: "Withania somnifera", use: "Stress, chronic illness" },
                { name: "Curcuma longa", use: "Wounds, inflammation, fever" },
              ].map((plant) => (
                <div
                  key={plant.name}
                  className="bg-white rounded-2xl p-5 border border-green-200 shadow-md hover:shadow-lg transition-shadow"
                >
                  <p className="font-bold italic text-green-900 text-sm mb-1">{plant.name}</p>
                  <p className="text-gray-500 text-xs">{plant.use}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Poster & Glossary links */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-green-200 shadow-md p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">🖼️</span>
                <h4 className="font-bold text-green-900 text-base">Research Poster</h4>
              </div>
              <p className="text-gray-500 text-sm">
                View the official research poster summarising the project findings and methodology.
              </p>
              {/* Replace href below with your actual poster URL */}
              <a
                href="/POSTER FINAL IKS.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-auto px-5 py-2.5 bg-green-900 text-white rounded-xl hover:bg-green-700 active:scale-95 transition-all text-sm font-semibold w-fit"
              >
                View Poster
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-yellow-200 shadow-md p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">📖</span>
                <h4 className="font-bold text-green-900 text-base">Glossary</h4>
              </div>
              <p className="text-gray-500 text-sm">
                A comprehensive glossary of ethnobotanical and medicinal terms used in this
                repository.
              </p>
              <a
                href="/Biotech flyer.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-auto px-5 py-2.5 bg-green-900 text-white rounded-xl hover:bg-green-700 active:scale-95 transition-all text-sm font-semibold w-fit"
              >
                View Poster
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

        </div>
      </section>

    {/* ── GALLERY ──────────────────────────────────────────────────────────── */}
<section id="gallery" className="py-20 px-4 md:px-10 bg-white">
  <div className="max-w-7xl mx-auto">

    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-green-900">Gallery</h2>
      <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
    </div>

    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
    >
      {(galleryImages.length ? galleryImages : ["/hero-plant.png"]).map(
        (src, idx) => (
          <div
            key={idx}
            className="rounded-2xl overflow-hidden border border-green-100 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* ✅ Plain <img> avoids Next.js Image encoding issues with special filenames */}
            <img
              src={src}
              alt={`Gallery image ${idx + 1}`}
              className="w-full h-40 md:h-44 object-cover"
              loading={idx < 6 ? "eager" : "lazy"}
              onError={(e: any) => {
                e.currentTarget.src = "/hero-plant.png";
              }}
            />
          </div>
        )
      )}
    </div>

  </div>
</section>

      {/* ── CONTACT ──────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-6 md:px-16 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-green-900">Contact Us</h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">

            {/* Contact 1 */}
            <div className="bg-white shadow-xl rounded-3xl p-8 border border-green-200 flex flex-col justify-between">
              <div>
                <span className="inline-block mb-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full uppercase tracking-wide">
                  For Any Query
                </span>
                <h3 className="text-xl font-bold text-green-900 mb-1">
                  Dr. Manisha Mohapatra
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Project PI, Biotechnology Department
                  <br />
                  Trident Academy of Creative Technology
                  <br />
                  Infocity, Bhubaneswar&#8209;751024, India
                </p>
              </div>
              <a
                href="mailto:manishamohapatra7@gmail.com"
                className="inline-block mt-6 px-6 py-2.5 bg-green-900 text-white rounded-xl hover:bg-green-700 active:scale-95 transition-all text-sm font-medium w-fit"
              >
                Send Email
              </a>
            </div>

            {/* Contact 2 */}
            <div className="bg-white shadow-xl rounded-3xl p-8 border border-green-200 flex flex-col justify-between">
              <div>
                <span className="inline-block mb-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full uppercase tracking-wide">
                  For Technical Support
                </span>
                <h3 className="text-xl font-bold text-green-900 mb-1">Sumanta Sahoo</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  DGM&#8209;Technical
                  <br />
                  Trident Academy of Creative Technology
                  <br />
                  Infocity, Bhubaneswar&#8209;751024, India
                </p>
              </div>
              <a
                href="mailto:sumanta@trident.ac.in"
                className="inline-block mt-6 px-6 py-2.5 bg-green-900 text-white rounded-xl hover:bg-green-700 active:scale-95 transition-all text-sm font-medium w-fit"
              >
                Send Email
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── ABOUT US + GET IN TOUCH ───────────────────────────────────────────── */}
      <section className="relative bg-[#0f1123] text-gray-300 py-20 px-6 md:px-16 overflow-hidden">

        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-900 opacity-20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-800 opacity-20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">

          {/* About Us */}
          <div className="space-y-5">
            <div>
              <h3 className="text-3xl font-extrabold text-white tracking-wide">
                ABOUT <span className="text-green-400">US</span>
              </h3>
              <div className="mt-2 w-12 h-1 bg-green-500 rounded-full" />
            </div>
            <p className="text-gray-400 leading-relaxed text-[15px]">
              Trident Academy of Creative Technology, a name that has become a brand in the
              field of technical education, is today synonymous with excellence. Trident is
              where Education meets Enthusiasm. Within just a few years of its establishment,
              Trident group of institutions has built an image amongst the aspiring masses
              which is worth the quality of education it imparts.
            </p>
            <a
              href="https://tsbs.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors group"
            >
              Learn More
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-green-800 to-transparent" />

          {/* Get In Touch */}
          <div className="space-y-5 md:pl-8">
            <div>
              <h3 className="text-3xl font-extrabold text-white tracking-wide">
                GET <span className="text-green-400">IN TOUCH</span>
              </h3>
              <div className="mt-2 w-12 h-1 bg-green-500 rounded-full" />
            </div>
            <ul className="space-y-5 text-[15px]">
              <li className="flex items-start gap-4">
                <span className="mt-1 flex-shrink-0 w-9 h-9 rounded-full bg-green-900/60 border border-green-700 flex items-center justify-center text-green-400 text-base">
                  📍
                </span>
                <span className="text-gray-400 leading-relaxed">
                  F-2, Chandaka Industrial Estate
                  <br />
                  In front of Infocity, Infocity
                  <br />
                  Chandrasekharpur, Bhubaneshwar
                  <br />
                  Odisha – 751024
                </span>
              </li>
              <li className="flex items-center gap-4">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-green-900/60 border border-green-700 flex items-center justify-center text-green-400 text-base">
                  ✉️
                </span>
                <a
                  href="mailto:info@trident.ac.in"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  info@trident.ac.in
                </a>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="bg-green-950 text-gray-400 py-10 text-center text-sm space-y-2 px-4">
        <p>
          &copy; {new Date().getFullYear()} Trident Academy of Creative Technology, BBSR
          &amp; IKS Division, Govt. of India. All rights reserved.
        </p>
        
        <p className="text-gray-600 text-xs">
          Designed &amp; Developed by Trident Academy of Creative Technology, BBSR
        </p>
      </footer>

    </main>
  );
}
