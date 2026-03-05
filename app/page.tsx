"use client";

import { useState, useEffect } from "react";

type Plant = {
  district: string;
  tribalCommunity: string;
  plantName: string;
  localName: string;
  usage: string;
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const data: Plant[] = [
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

  // Scroll Spy Effect
  useEffect(() => {
    const sections = document.querySelectorAll("section");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const filteredData = data.filter((item) =>
    item.plantName.toLowerCase().includes(search.toLowerCase()) ||
    item.localName.toLowerCase().includes(search.toLowerCase()) ||
    item.district.toLowerCase().includes(search.toLowerCase())
  );

  const navItem = (id: string, label: string) => (
    <a
      href={`#${id}`}
      onClick={() => setMenuOpen(false)}
      className={`relative cursor-pointer pb-1 transition duration-300 ${
        activeSection === id ? "text-yellow-400" : "text-white"
      }`}
    >
      {label}
      <span
        className={`absolute left-0 -bottom-1 h-[2px] bg-yellow-400 transition-all duration-300 ${
          activeSection === id ? "w-full" : "w-0"
        }`}
      ></span>
    </a>
  );

  return (
    <main className="scroll-smooth font-serif bg-[#f8f6f1]">

      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 w-full bg-green-950 text-white shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">

          <h1 className="text-lg md:text-xl font-bold text-yellow-400">
            IKS Digital Repository
          </h1>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 text-sm font-medium">
            {navItem("home", "Home")}
            {navItem("about", "About")}
            {navItem("database", "Database")}
            {navItem("contact", "Contact")}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-green-900 px-6 pb-4 space-y-3">
            {navItem("home", "Home")}
            {navItem("about", "About")}
            {navItem("database", "Database")}
            {navItem("contact", "Contact")}
          </div>
        )}
      </nav>

      <div className="h-20"></div>

      {/* ================= HERO SECTION ================= */}
      <section
        id="home"
        className="relative h-[90vh] flex items-center justify-center text-center text-white"
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/public/hero-plant.jpg')",
          }}
        ></div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>

        {/* Content */}
        <div className="relative z-10 px-6">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Indian Knowledge Systems
          </h2>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-200">
            Digital Repository for Documentation of Ethno-medicinal Plants
            Used by Tribal Communities of Eastern Odisha
          </p>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section id="about" className="py-20 px-8 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-green-900 text-center mb-8">
          About IKS Digital Repository
        </h2>
        <p className="text-justify text-gray-700 leading-relaxed">
          The Indian Knowledge Systems (IKS) represent centuries of empirical
          wisdom developed through traditional practices. This project aims to
          digitally preserve ethnomedicinal plant knowledge used by tribal
          communities of Eastern Odisha.
        </p>
      </section>

      {/* ================= DATABASE ================= */}
      <section id="database" className="py-20 bg-green-50">
        <div className="max-w-6xl mx-auto px-8">

          <h2 className="text-4xl font-bold text-green-900 text-center mb-12">
            Ethno-Medicinal Plant Database
          </h2>

          {/* Search Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-10 border border-green-200">
            <input
              type="text"
              placeholder="Search plant, district..."
              className="w-full px-6 py-3 border-2 border-green-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl shadow-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-green-900 text-white uppercase">
                <tr>
                  <th className="px-6 py-4">District</th>
                  <th className="px-6 py-4">Tribal Community</th>
                  <th className="px-6 py-4">Plant Name</th>
                  <th className="px-6 py-4">Local Name</th>
                  <th className="px-6 py-4">Usage</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-green-100">
                    <td className="px-6 py-4">{item.district}</td>
                    <td className="px-6 py-4">{item.tribalCommunity}</td>
                    <td className="px-6 py-4 font-semibold text-green-900">
                      {item.plantName}
                    </td>
                    <td className="px-6 py-4">{item.localName}</td>
                    <td className="px-6 py-4">{item.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section id="contact" className="py-20 px-8 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-green-900 text-center mb-8">
          Contact Information
        </h2>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p><strong>Dr Manisha Mohapatra</strong></p>
          <p>Project PI, Biotechnology Department</p>
          <p>Trident Academy of Creative Technology</p>
          <p>Infocity, Bhubaneswar-751024, India</p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-green-950 text-gray-300 py-10 text-center text-sm">
        <p>
          All rights reserved by Trident Academy of Creative Technology,
          BBSR & IKS Division, Govt of India.
        </p>
      </footer>

    </main>
  );
}