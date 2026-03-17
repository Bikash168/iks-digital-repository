"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Plant = {
  vendorNo: string;
  plantName: string;
  family: string;
  ethnobotanicalUse: string;
  photo: string;
};

import * as XLSX from "xlsx";




// FIX 1: Single declaration of NAVBAR_HEIGHT as a number (used for scroll offset calculations)
const NAVBAR_HEIGHT = 130;
const NAV_SECTIONS = ["home", "about", "project", "database", "contact"] as const;

export default function Home() {
  const [data, setData] = useState<Plant[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'family' | 'voucher'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load data from Excel file
  useEffect(() => {
    const loadExcelData = async () => {
      try {
        const response = await fetch("/Data.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log("Excel raw data (first row):", jsonData[0]); // Debug: log all columns
        const plants: Plant[] = jsonData.map((row: any) => ({
          vendorNo: row["Voucher No."] || row["VoucherNo"] || row["voucher_no"] || row["Voucher#"] || row["voucher"] || row["Voucher No"] || "",
          plantName: row["Plant Name"] || row["PlantName"] || row["plant_name"] || "",
          family: row["Family"] || row["family"] || "",
          ethnobotanicalUse: row["Therapeutic Use"] || row["TherapeuticUse"] || row["Use"] || row["use"] || row["Ethnobotanical Use"] || "",
          photo: row["Photo"] || row["photo"] || row["Image"] || row["image"] || "/placeholder.jpg",
        }));

        console.log("✅ Loaded plants:", plants.length);
        console.log("First plant vendorNo:", plants[0]?.vendorNo);
        console.log("Sample plant:", plants[0]);
        setData(plants);
      } catch (error) {
        console.error("Failed to load Excel data:", error);
      }
    };

    loadExcelData();
  }, []);

  useEffect(() => {
    const sections = NAV_SECTIONS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
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

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMenuOpen(false);
    const target = document.getElementById(id);
    if (!target) return;
    const offsetTop = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  }, []);

  const filteredData = data.filter(
    (item) =>
      (selectedFamily === 'all' || item.family.toLowerCase() === selectedFamily.toLowerCase()) &&
      (item.plantName.toLowerCase().includes(search.toLowerCase()) ||
        item.family.toLowerCase().includes(search.toLowerCase()) ||
        item.vendorNo.toLowerCase().includes(search.toLowerCase()) ||
        item.ethnobotanicalUse.toLowerCase().includes(search.toLowerCase()))
  );

  // Sort filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: string, bValue: string;

    switch (sortBy) {
      case 'name':
        aValue = a.plantName.toLowerCase();
        bValue = b.plantName.toLowerCase();
        break;
      case 'family':
        aValue = a.family.toLowerCase();
        bValue = b.family.toLowerCase();
        break;
      case 'voucher':
        aValue = a.vendorNo.toLowerCase();
        bValue = b.vendorNo.toLowerCase();
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Get unique families for filter dropdown
  const uniqueFamilies = Array.from(new Set(data.map(item => item.family))).sort();

  // Calculate statistics
  const totalPlants = data.length;
  const uniqueFamiliesCount = uniqueFamilies.length;
  const filteredCount = sortedData.length;

  // Export to CSV function
  const exportToCSV = () => {
    const csvData = sortedData.map(item => ({
      'Voucher No.': item.vendorNo,
      'Plant Name': item.plantName,
      'Family': item.family,
      'Therapeutic Use': item.ethnobotanicalUse
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethno-medicinal-plants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // FIX 2: navItem helper restored — used for active-link underline highlighting
  const navItem = (id: string, label: string) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={(e) => handleNavClick(e, id)}
      className={`relative pb-1 transition duration-300 ${activeSection === id ? "text-green-600" : "text-green-800 hover:text-green-600"
        }`}
    >
      {label}
      <span
        className={`absolute left-0 -bottom-1 h-[2px] bg-green-600 transition-all duration-300 ${activeSection === id ? "w-full" : "w-0"
          }`}
      />
    </a>
  );

  return (
    <main className="font-serif bg-[#f8f6f1]">

      {/* NAVBAR — FIX 3: removed stray `const` declarations that were placed inside JSX */}
      <nav
        className="fixed top-0 w-full bg-white shadow-md z-50 border-b"
        style={{ height: `${NAVBAR_HEIGHT}px` }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 h-full">

          {/* Logos + Title */}
          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-1 md:gap-3 border-r border-gray-300 pr-2 md:pr-6">
              <Image
                src="/logo1.png"
                alt="TACT Logo"
                width={90}
                height={90}
                className="w-8 sm:w-12 md:w-16 lg:w-[90px] h-8 sm:h-12 md:h-16 lg:h-[90px] object-contain"
              />
              <Image
                src="/logo2.png"
                alt="IKS Logo"
                width={110}
                height={110}
                className="w-10 sm:w-14 md:w-18 lg:w-[110px] h-10 sm:h-14 md:h-18 lg:h-[110px] object-contain"
              />
              <Image
                src="/logo3.svg"
                alt="Government Logo"
                width={120}
                height={120}
                className="w-10 sm:w-15 md:w-20 lg:w-[120px] h-10 sm:h-15 md:h-20 lg:h-[120px] object-contain"
              />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-green-800 tracking-wide">
              IKS Digital Repository
            </h1>
          </div>

          {/* Desktop Menu — FIX 4: uses navItem() helper for active highlighting */}
          <div className="hidden md:flex items-center space-x-10 text-[16px] font-semibold">
            {navItem("home", "Home")}
            {navItem("about", "About")}
            {navItem("project", "Project")}
            {navItem("database", "Database")}
            {navItem("contact", "Contact")}
          </div>

          {/* Mobile Hamburger — FIX 5: wired up to menuOpen state */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-green-800 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-green-800 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-green-800 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-green-100 shadow-lg px-8 py-4 flex flex-col gap-4 text-[15px] font-semibold">
            {navItem("home", "Home")}
            {navItem("about", "About")}
            {navItem("project", "Project")}
            {navItem("database", "Database")}
            {navItem("contact", "Contact")}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section
        id="home"
        className="relative flex items-center overflow-hidden text-white"
        style={{
          minHeight: "100vh",
          paddingTop: `${NAVBAR_HEIGHT}px`,
          background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #16a34a 100%)",
        }}
      >
        {/* Subtle dot texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full flex flex-col md:flex-row items-center justify-between gap-12 py-16">

          {/* Left — Text */}
          <div className="flex-1 text-left max-w-xl">
            <p className="text-yellow-300 uppercase tracking-[0.25em] text-xs font-semibold mb-4">
              IKS Division · Ministry of Education · Govt. of India
            </p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Indian Knowledge Systems
            </h2>
            <div className="w-16 h-1 bg-yellow-400 mb-6 rounded-full" />
            <p className="text-base md:text-lg text-green-100 leading-relaxed">
              Digital Repository for Documentation of Ethno-medicinal Plants Used by Tribal Communities of Eastern Odisha
            </p>
          </div>

          {/* Right — Diagram on white card */}
          <div className="flex-1 flex justify-center md:justify-end">
            <div className="bg-white rounded-3xl shadow-2xl p-5 w-full max-w-lg">
              <Image
                src="/hero-plant.png"
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

      {/* ABOUT */}
      <section id="about" className="py-24 px-6 md:px-16 bg-[#f8f6f1]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-green-900">IKS Digital Repository</h2>
            <p className="text-lg text-yellow-700 mt-2 font-semibold">Trident Translational Initiative</p>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-justify hyphens-auto text-gray-700 leading-relaxed text-lg">
              <p>The Indian Knowledge Systems (IKS) are a well-organized and scientifically valid body of knowledge developed over the centuries through practice and observation. It is imperative to give prime importance to the documentation and digital preservation of the IKS. This will ensure the preservation of the indigenous intellectual heritage for the coming generations. The enhancement of the IKS in the empirical knowledge systems will make it more relevant to the present-day challenges faced by society.</p>
              <p>The IKS sanctioned project, <span className="font-semibold text-green-900">&ldquo;Development of Digital Repository for Documentation of Ethno-medicinal Plants Used by Different Tribal Communities of Eastern Odisha for Holistic Healthcare Management,&rdquo;</span> led by <strong>Dr. Manisha Mohapatra</strong>, is one of the examples of the efforts put forth to demonstrate the translational approach for empirical knowledge-driven health assessments in tribal communities of eastern Odisha.</p>
            </div>
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-full h-full border-4 border-yellow-500 rounded-2xl pointer-events-none" />
              <div className="relative z-10 w-full min-h-[260px] md:min-h-[340px] rounded-2xl overflow-hidden shadow-2xl">
                <Image src="/about-plant.jpg" alt="Medicinal Plant" fill className="object-cover" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center mt-20">
            <div className="relative order-2 md:order-1">
              <div className="absolute -bottom-3 -right-3 w-full h-full border-4 border-green-800 rounded-2xl pointer-events-none" />
              <div className="relative z-10 w-full min-h-[260px] md:min-h-[340px] rounded-2xl overflow-hidden shadow-2xl">
                <Image src="/tribal-medicine.jpg" alt="Tribal Ethnomedicine" fill className="object-cover" />
              </div>
            </div>
            <div className="space-y-6 text-justify hyphens-auto text-gray-700 leading-relaxed text-lg order-1 md:order-2">
              <p>In the tribal scenario of eastern Odisha, the ethnomedicinal systems have shown a deep understanding of biodiversity, plant identification, preparation methods, dosage standards, and their usage. However, due to the largely oral and embedded nature of such knowledge in the cultural practices of the communities, it is susceptible to deterioration due to socio-economic changes, environmental changes, and the loss of continuity.</p>
              <p>In light of the urgent need to document and preserve such knowledge, an attempt is being made to document and digitize the knowledge in a way that preserves it while maintaining its authenticity and integrity. Ethnographic documentation, authentication of plant species, and documentation of preparation techniques, applications, and traditional stories associated with them are being done systematically. The digital platform is being developed to allow for searching, metadata integration, and long-term preservation in conformity with established data management practices.</p>
              <p>Through the conversion of tacit indigenous knowledge into a scientifically organized digital platform, this project is enhancing knowledge continuity, facilitating inter-disciplinary research, and informing decision-making on biodiversity conservation and sustainable healthcare practices. Simultaneously, ethical considerations including intellectual property protection and equitable benefit-sharing are being incorporated to ensure responsible and community-sensitive knowledge governance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECT DETAILS */}
      <section id="project" className="py-24 px-6 md:px-16 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-green-900">Project Details</h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>
          <div className="bg-white shadow-2xl rounded-3xl p-8 md:p-10 border border-green-200 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Project Title</h3>
              <p className="text-gray-700 leading-relaxed">Development of Digital Repository for Documentation of Ethno-medicinal Plants Used by Different Tribal Communities of Eastern Odisha for Holistic Healthcare Management</p>
            </div>
            <hr className="border-green-100" />
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-green-900 mb-1">Lead Principal Investigator</h4>
                <p className="text-gray-700">Dr. Manisha Mohapatra</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-900 mb-1">Co-Principal Investigators</h4>
                <p className="text-gray-700">Dr. S N Mallick<br />Dr. P Chand</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DATABASE */}
      <section id="database" className="py-16 md:py-20 bg-[#f8f6f1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-green-900 text-center mb-2 md:mb-4">Database</h2>
          <p className="text-center text-sm md:text-base text-gray-600 mb-6 md:mb-10">
            Ethno-medicinal plant records documented from tribal communities of Eastern Odisha.
          </p>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-green-50 rounded-xl p-6 shadow-lg border border-green-200 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-2">🌿</div>
              <div className="text-3xl font-bold text-green-800 mb-1">{totalPlants}</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Plants</div>
            </div>
            <div className="bg-gradient-to-br from-white to-green-50 rounded-xl p-6 shadow-lg border border-green-200 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-2">🏠</div>
              <div className="text-3xl font-bold text-green-800 mb-1">{uniqueFamiliesCount}</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Families</div>
            </div>
            <div className="bg-gradient-to-br from-white to-green-50 rounded-xl p-6 shadow-lg border border-green-200 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-3xl font-bold text-green-800 mb-1">{filteredCount}</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Filtered</div>
            </div>
          </div>

          {/* Advanced Search & Filters */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-900">Research Tools</h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-green-700 hover:text-green-900 font-medium text-sm"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
              </button>
            </div>

            {/* Basic Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by plant name, family, voucher number, or therapeutic use…"
                className="w-full px-4 md:px-5 py-2 md:py-3 border-2 border-green-800 rounded-lg md:rounded-xl focus:outline-none focus:ring-4 focus:ring-green-300 text-sm md:text-base text-gray-800 placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="grid md:grid-cols-3 gap-4 mb-4 p-4 bg-green-50 rounded-lg">
                {/* Family Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Family</label>
                  <select
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="all">All Families</option>
                    {uniqueFamilies.map(family => (
                      <option key={family} value={family}>{family}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'family' | 'voucher')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="name">Plant Name</option>
                    <option value="family">Family</option>
                    <option value="voucher">Voucher No.</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="asc">Ascending (A-Z)</option>
                    <option value="desc">Descending (Z-A)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(search || selectedFamily !== 'all') && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedFamily('all');
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-green-200 shadow-2xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-green-900 text-white uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-4 py-4 text-left whitespace-nowrap">Voucher No.</th>
                    <th className="px-4 py-4 text-left whitespace-nowrap">Plant Name</th>
                    <th className="px-4 py-4 text-left whitespace-nowrap">Family</th>
                    <th className="px-4 py-4 text-left">Therapeutic Use</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.vendorNo} className="hover:bg-green-50 border-b border-green-100">
                      <td className="px-4 py-3 font-medium text-green-900">{item.vendorNo}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{item.plantName}</td>
                      <td className="px-4 py-3 text-gray-700">{item.family}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="line-clamp-2">{item.ethnobotanicalUse}</span>
                          <button
                            onClick={() => setSelectedPlant(item)}
                            className="bg-green-800 text-white px-3 py-1 rounded hover:bg-green-600 whitespace-nowrap text-xs"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4 p-4">
              {paginatedData.map((item) => (
                <div key={item.vendorNo} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Voucher No.</p>
                      <p className="text-sm font-bold text-green-900">{item.vendorNo}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Plant Name</p>
                      <p className="text-sm font-semibold text-gray-800">{item.plantName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Family</p>
                      <p className="text-sm text-gray-700">{item.family}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Therapeutic Use</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{item.ethnobotanicalUse}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPlant(item)}
                      className="w-full bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-6 gap-2 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium transition-all ${currentPage === i + 1
                    ? "bg-green-800 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="text-right text-xs text-gray-400 mt-3">
            Showing {filteredCount} of {totalPlants} records
          </p>
        </div>
      </section>
      {selectedPlant && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] md:max-h-none overflow-y-auto">

            <button
              onClick={() => setSelectedPlant(null)}
              className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-600 z-10"
            >
              ✕
            </button>

            <div className="mt-4 md:mt-0 space-y-4">
              <img
                src={selectedPlant.photo}
                className="w-full h-48 md:h-64 object-cover rounded-xl"
                alt={selectedPlant.plantName}
              />

              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-900 mb-2">
                  {selectedPlant.plantName}
                </h2>
                <p className="text-xs md:text-sm text-gray-500 font-semibold">
                  Voucher No: {selectedPlant.vendorNo}
                </p>
              </div>

              <div className="border-t border-green-100 pt-4">
                <p className="text-sm md:text-base font-semibold text-green-700 mb-2">
                  Family: <span className="text-gray-700 font-normal">{selectedPlant.family}</span>
                </p>
              </div>

              <div className="border-t border-green-100 pt-4">
                <p className="text-sm md:text-base font-semibold text-green-700 mb-2">Therapeutic Use:</p>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                  {selectedPlant.ethnobotanicalUse}
                </p>
              </div>

              <button
                onClick={() => setSelectedPlant(null)}
                className="w-full bg-green-800 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm md:text-base mt-6"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONTACT */}
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
                <span className="inline-block mb-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full uppercase tracking-wide">For Any Query</span>
                <h3 className="text-xl font-bold text-green-900 mb-1">Dr. Manisha Mohapatra</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Project PI, Biotechnology Department<br />
                  Trident Academy of Creative Technology<br />
                  Infocity, Bhubaneswar&#8209;751024, India
                </p>
              </div>
              <a href="mailto:manishamohapatra7@gmail.com" className="inline-block mt-6 px-6 py-2.5 bg-green-900 text-white rounded-xl hover:bg-green-700 active:scale-95 transition-all text-sm font-medium w-fit">
                Send Email
              </a>
            </div>

            {/* Contact 2 */}
            <div className="bg-white shadow-xl rounded-3xl p-8 border border-green-200 flex flex-col justify-between">
              <div>
                <span className="inline-block mb-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full uppercase tracking-wide">For Technical Support</span>
                <h3 className="text-xl font-bold text-green-900 mb-1">Sumanta Sahoo</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  DGM&#8209;Technical<br />
                  Trident Academy of Creative Technology<br />
                  Infocity, Bhubaneswar&#8209;751024, India
                </p>
              </div>
              <a href="mailto:sumanta@trident.ac.in" className="inline-block mt-6 px-6 py-2.5 bg-green-900 text-white rounded-xl hover:bg-green-700 active:scale-95 transition-all text-sm font-medium w-fit">
                Send Email
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* ABOUT US + GET IN TOUCH */}
      <section className="relative bg-[#0f1123] text-gray-300 py-20 px-6 md:px-16 overflow-hidden">

        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-900 opacity-20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-800 opacity-20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">

          {/* ── About Us ── */}
          <div className="space-y-5">
            <div>
              <h3 className="text-3xl font-extrabold text-white tracking-wide">
                ABOUT <span className="text-green-400">US</span>
              </h3>
              <div className="mt-2 w-12 h-1 bg-green-500 rounded-full" />
            </div>
            <p className="text-gray-400 leading-relaxed text-[15px]">
              Trident Academy of Creative Technology, a name that has become a brand in the field of
              technical education, is today synonymous with excellence. Trident is where Education meets
              Enthusiasm. Within just a few years of its establishment, Trident group of institutions has
              built an image amongst the aspiring masses which is worth the quality of education it imparts.
            </p>
            <a
              href="https://tact.ac.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors group"
            >
              Learn More
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>

          {/* Divider (vertical on desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-green-800 to-transparent" />

          {/* ── Get In Touch ── */}
          <div className="space-y-5 md:pl-8">
            <div>
              <h3 className="text-3xl font-extrabold text-white tracking-wide">
                GET <span className="text-green-400">IN TOUCH</span>
              </h3>
              <div className="mt-2 w-12 h-1 bg-green-500 rounded-full" />
            </div>

            <ul className="space-y-5 text-[15px]">
              {/* Address */}
              <li className="flex items-start gap-4">
                <span className="mt-1 flex-shrink-0 w-9 h-9 rounded-full bg-green-900/60 border border-green-700 flex items-center justify-center text-green-400 text-base">
                  📍
                </span>
                <span className="text-gray-400 leading-relaxed">
                  F-2, Chandaka Industrial Estate<br />
                  In front of Infocity, Infocity<br />
                  Chandrasekharpur, Bhubaneshwar<br />
                  Odisha – 751024
                </span>
              </li>

              {/* Email */}
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

              {/* Phone */}
              <li className="flex items-start gap-4">
                <span className="mt-1 flex-shrink-0 w-9 h-9 rounded-full bg-green-900/60 border border-green-700 flex items-center justify-center text-green-400 text-base">
                  📞
                </span>
                <span className="text-gray-400 leading-relaxed">
                  0674-6649003, 6649008, 6649036,<br />
                  0674-6649043
                </span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-green-950 text-gray-400 py-10 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Trident Academy of Creative Technology, BBSR &amp; IKS Division, Govt. of India. All rights reserved.</p>
      </footer>

    </main>
  );
}
