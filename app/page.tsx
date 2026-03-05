"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Plant = {
  district: string;
  tribalCommunity: string;
  plantName: string;
  localName: string;
  usage: string;
};

// FIX: moved outside component — was re-created on every render
const PLANT_DATA: Plant[] = [
  {
    district: "Keonjhar",
    tribalCommunity: "Ho",
    plantName: "Azadirachta indica",
    localName: "Neem",
    usage: "Skin infections",
  },
  {
    district: "Mayurbhanj",
    tribalCommunity: "Santhal",
    plantName: "Ocimum sanctum",
    localName: "Tulsi",
    usage: "Cold & cough",
  },
];

const NAV_SECTIONS = ["home", "about", "project", "database", "contact"] as const;
// FIX: navbar is ~72px tall — scroll offset must match this exactly
const NAVBAR_HEIGHT = 72;

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  // FIX: close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // FIX: scroll spy with priority — picks the section whose top is closest
  // to the navbar bottom, avoiding the "last entry wins" race condition
  useEffect(() => {
    const sections = NAV_SECTIONS.map((id) => document.getElementById(id)).filter(
      Boolean
    ) as HTMLElement[];

    const handler = () => {
      let best: string | null = null;
      let bestDist = Infinity;
      for (const section of sections) {
        const top = section.getBoundingClientRect().top - NAVBAR_HEIGHT;
        // section must be at or above the trigger line
        if (top <= 10 && Math.abs(top) < bestDist) {
          bestDist = Math.abs(top);
          best = section.id;
        }
      }
      if (best) setActiveSection(best);
    };

    window.addEventListener("scroll", handler, { passive: true });
    handler(); // run once on mount
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // FIX: smooth scroll that accounts for fixed navbar height
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

  // FIX: search now covers all five fields
  const filteredData = PLANT_DATA.filter(
    (item) =>
      item.plantName.toLowerCase().includes(search.toLowerCase()) ||
      item.localName.toLowerCase().includes(search.toLowerCase()) ||
      item.district.toLowerCase().includes(search.toLowerCase()) ||
      item.tribalCommunity.toLowerCase().includes(search.toLowerCase()) ||
      item.usage.toLowerCase().includes(search.toLowerCase())
  );

  const navItem = (id: string, label: string) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={(e) => handleNavClick(e, id)}
      className={`relative pb-1 transition duration-300 ${
        activeSection === id
          ? "text-yellow-400"
          : "text-white hover:text-yellow-200"
      }`}
    >
      {label}
      <span
        className={`absolute left-0 -bottom-1 h-[2px] bg-yellow-400 transition-all duration-300 ${
          activeSection === id ? "w-full" : "w-0"
        }`}
      />
    </a>
  );

  return (
    <main className="font-serif bg-[#f8f6f1]">

      {/* ================= NAVBAR ================= */}
      <nav
        className="fixed top-0 w-full bg-green-950/95 backdrop-blur-md text-white shadow-lg z-50"
        style={{ height: NAVBAR_HEIGHT }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-full">
          <h1 className="text-lg md:text-xl font-bold text-yellow-400 tracking-wide">
            IKS Digital Repository
          </h1>

          <div className="hidden md:flex space-x-8 text-sm font-medium">
            {navItem("home", "Home")}
            {navItem("about", "About")}
            {navItem("project", "Project")}
            {navItem("database", "Database")}
            {navItem("contact", "Contact")}
          </div>

          <button
            className="md:hidden text-2xl leading-none"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* FIX: absolute so it doesn't push page content down */}
        {menuOpen && (
          <div className="absolute top-full left-0 w-full md:hidden bg-green-900/98 px-6 pb-6 pt-4 flex flex-col gap-5 text-base font-medium shadow-xl">
            {navItem("home", "Home")}
            {navItem("about", "About")}
            {navItem("project", "Project")}
            {navItem("database", "Database")}
            {navItem("contact", "Contact")}
          </div>
        )}
      </nav>

      {/* ================= HERO ================= */}
      <section
        id="home"
        className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden"
      >
        <Image
          src="/hero-plant.jpg"
          alt="Hero Background"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl px-6">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight drop-shadow-lg">
            Indian Knowledge Systems
          </h2>
          <p className="mt-6 text-lg md:text-xl text-gray-200 drop-shadow-md">
            Digital Repository for Documentation of Ethno-medicinal Plants
            Used by Tribal Communities of Eastern Odisha
          </p>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section id="about" className="py-24 px-6 md:px-16 bg-[#f8f6f1]">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-green-900">
              IKS Digital Repository
            </h2>
            <p className="text-lg text-yellow-700 mt-2 font-semibold">
              Trident Translational Initiative
            </p>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>

          {/* Row 1 — Text + Image */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-justify hyphens-auto text-gray-700 leading-relaxed text-lg">
              <p>
                The Indian Knowledge Systems (IKS) are a well-organized and
                scientifically valid body of knowledge developed over centuries
                through practice and observation. Documentation and digital
                preservation are essential to safeguard this indigenous heritage.
              </p>
              <p>
                The IKS sanctioned project titled{" "}
                <span className="font-semibold text-green-900">
                  &ldquo;Development of Digital Repository for Documentation of
                  Ethno-medicinal Plants Used by Different Tribal Communities of
                  Eastern Odisha for Holistic Healthcare Management&rdquo;
                </span>{" "}
                led by <strong>Dr. Manisha Mohapatra</strong>, demonstrates a
                translational approach to empirical knowledge-driven health research.
              </p>
            </div>

            {/* FIX: image uses fill inside a min-height container — no more collapsed height on mobile */}
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-full h-full border-4 border-yellow-500 rounded-2xl pointer-events-none" />
              <div className="relative z-10 w-full min-h-[260px] md:min-h-[340px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/about-plant.jpg"
                  alt="Medicinal Plant"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Row 2 — Image + Text */}
          <div className="grid md:grid-cols-2 gap-12 items-center mt-20">
            <div className="relative order-2 md:order-1">
              <div className="absolute -bottom-3 -right-3 w-full h-full border-4 border-green-800 rounded-2xl pointer-events-none" />
              <div className="relative z-10 w-full min-h-[260px] md:min-h-[340px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/tribal-medicine.jpg"
                  alt="Tribal Ethnomedicine"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-6 text-justify hyphens-auto text-gray-700 leading-relaxed text-lg order-1 md:order-2">
              <p>
                Ethnomedicinal systems in Eastern Odisha demonstrate deep
                understanding of biodiversity, plant identification, preparation
                methods, and dosage standards. However, much of this knowledge is
                orally transmitted and vulnerable to socio-economic and environmental
                change.
              </p>
              <p>
                Through systematic documentation, plant authentication, and digital
                archiving, this platform ensures long-term preservation and promotes
                interdisciplinary research, biodiversity conservation, and sustainable
                healthcare practices with ethical governance.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ================= PROJECT DETAILS ================= */}
      <section id="project" className="py-24 px-6 md:px-16 bg-green-50">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-green-900">Project Details</h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="bg-white shadow-2xl rounded-3xl p-8 md:p-10 border border-green-200 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Project Title</h3>
              <p className="text-gray-700 leading-relaxed">
                Development of Digital Repository for Documentation of Ethno-medicinal
                Plants Used by Different Tribal Communities of Eastern Odisha
                for Holistic Healthcare Management
              </p>
            </div>

            <hr className="border-green-100" />

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-green-900 mb-1">
                  Lead Principal Investigator
                </h4>
                <p className="text-gray-700">Dr. Manisha Mohapatra</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-900 mb-1">
                  Co-Principal Investigators
                </h4>
                <p className="text-gray-700">
                  Dr. S N Mallick<br />
                  Dr. P Chand
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DATABASE ================= */}
      <section id="database" className="py-20 bg-[#f8f6f1]">
        <div className="max-w-6xl mx-auto px-6 md:px-8">

          <h2 className="text-4xl font-bold text-green-900 text-center mb-4">
            Database Search
          </h2>
          <p className="text-center text-gray-600 mb-10">
            Data sourced from the authenticated Excel repository of Keonjhar &amp; Mayurbhanj districts.
          </p>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-green-200">
            <input
              type="text"
              placeholder="Search by plant, local name, district, community or usage…"
              className="w-full px-5 py-3 border-2 border-green-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-300 text-gray-800 placeholder:text-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* FIX: border on outer div, overflow-hidden inside — shadow renders correctly */}
          <div className="rounded-2xl border border-green-200 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-green-900 text-white uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-6 py-4 text-left whitespace-nowrap">District</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Tribal Community</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Plant Name</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Local Name</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Usage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-gray-400 italic"
                      >
                        No results found for &ldquo;{search}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr
                        key={`${item.district}-${item.plantName}`}
                        className="hover:bg-green-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-700">{item.district}</td>
                        <td className="px-6 py-4 text-gray-700">{item.tribalCommunity}</td>
                        <td className="px-6 py-4 font-semibold text-green-900 italic">
                          {item.plantName}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{item.localName}</td>
                        <td className="px-6 py-4 text-gray-700">{item.usage}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FIX: result count so user knows how many records match */}
          <p className="text-right text-xs text-gray-400 mt-3">
            Showing {filteredData.length} of {PLANT_DATA.length} records
          </p>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section id="contact" className="py-24 px-6 md:px-16 bg-green-50">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-green-900">Contact Us</h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="bg-white shadow-xl rounded-3xl p-8 md:p-10 border border-green-200">
            <h3 className="text-xl font-semibold text-green-800 mb-3">For Any Query</h3>
            <p className="text-gray-700 leading-relaxed">
              Dr. Manisha Mohapatra<br />
              Project PI, Biotechnology Department<br />
              Trident Academy of Creative Technology<br />
              Infocity, Bhubaneswar&#8209;751024, India
            </p>
            <a
              href="mailto:manisha@trident.ac.in"
              className="inline-block mt-5 px-7 py-2.5 bg-green-900 text-white rounded-xl hover:bg-green-700 active:scale-95 transition-all text-sm font-medium"
            >
              Send Email
            </a>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-green-950 text-gray-400 py-10 text-center text-sm">
        <p>
          &copy; {new Date().getFullYear()} Trident Academy of Creative Technology, BBSR &amp; IKS Division, Govt. of India. All rights reserved.
        </p>
      </footer>

    </main>
  );
}
