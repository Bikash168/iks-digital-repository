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

const PLANT_DATA: Plant[] = [
  { vendorNo: "IKS-Trident-001", plantName: "Aegle marmelos", family: "Rutaceae", ethnobotanicalUse: "Leaves used for treatment of diabetes, diarrhea, dysentery, constipation, and respiratory disorders. Fruits used for digestive disorders.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Bael_Aegle_marmelos_fruit.jpg/320px-Bael_Aegle_marmelos_fruit.jpg" },
  { vendorNo: "IKS-Trident-002", plantName: "Aloe vera", family: "Asphodelaceae", ethnobotanicalUse: "Gel used for skin burns, wound healing, moisturizing, and anti-inflammatory purposes. Also used for digestive health.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Aloe_vera_flower_inset.png/320px-Aloe_vera_flower_inset.png" },
  { vendorNo: "IKS-Trident-003", plantName: "Andrographis paniculata", family: "Acanthaceae", ethnobotanicalUse: "Used for fever, common cold, upper respiratory infections, diarrhea, dysentery, cholera, pneumonia, and hypertension.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Andrographis_paniculata.jpg/320px-Andrographis_paniculata.jpg" },
  { vendorNo: "IKS-Trident-004", plantName: "Asparagus racemosus", family: "Asparagaceae", ethnobotanicalUse: "Used as a galactagogue, adaptogen, and for gastric ulcers, dyspepsia, diarrhea, and as a nervine tonic.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Asparagus_racemosus.jpg/320px-Asparagus_racemosus.jpg" },
  { vendorNo: "IKS-Trident-005", plantName: "Azadirachta indica", family: "Meliaceae", ethnobotanicalUse: "Leaves, bark, and seeds used for skin infections, malaria, dental hygiene, anti-inflammatory, and insecticidal properties.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Azadirachta_indica_%28Neem%29_in_Hyderabad%2C_AP_W2_IMG_0208.jpg/320px-Azadirachta_indica_%28Neem%29_in_Hyderabad%2C_AP_W2_IMG_0208.jpg" },
  { vendorNo: "IKS-Trident-006", plantName: "Bacopa monnieri", family: "Plantaginaceae", ethnobotanicalUse: "Used as a nootropic for memory enhancement, anxiety, epilepsy, and as a nervine tonic in traditional medicine.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Bacopa_monnieri_MS_4066.jpg/320px-Bacopa_monnieri_MS_4066.jpg" },
  { vendorNo: "IKS-Trident-007", plantName: "Boerhavia diffusa", family: "Nyctaginaceae", ethnobotanicalUse: "Roots used for diuretic, anti-inflammatory, and hepatoprotective properties. Used in kidney disorders and jaundice.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Boerhavia_diffusa_MS_4362.jpg/320px-Boerhavia_diffusa_MS_4362.jpg" },
  { vendorNo: "IKS-Trident-008", plantName: "Calotropis gigantea", family: "Apocynaceae", ethnobotanicalUse: "Latex and leaves used for skin diseases, pain relief, fever, and as an antiseptic. Root bark used for digestive issues.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Calotropis_gigantea_R_Br_flowers.jpg/320px-Calotropis_gigantea_R_Br_flowers.jpg" },
  { vendorNo: "IKS-Trident-009", plantName: "Centella asiatica", family: "Apiaceae", ethnobotanicalUse: "Used for wound healing, mental clarity, skin disorders, leprosy, and venous insufficiency. Important in Ayurveda and folk medicine.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Centella_asiatica_MS_4377.jpg/320px-Centella_asiatica_MS_4377.jpg" },
  { vendorNo: "IKS-Trident-010", plantName: "Curcuma longa", family: "Zingiberaceae", ethnobotanicalUse: "Rhizome used for anti-inflammatory, antioxidant, wound healing, digestive disorders, and as a spice in traditional cooking.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Curcuma_longa_roots.jpg/320px-Curcuma_longa_roots.jpg" },
  { vendorNo: "IKS-Trident-011", plantName: "Eclipta prostrata", family: "Asteraceae", ethnobotanicalUse: "Used for liver disorders, hair care, wound healing, and as a hepatoprotective agent. Also used for skin and eye diseases.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Eclipta_prostrata_MS_4154.jpg/320px-Eclipta_prostrata_MS_4154.jpg" },
  { vendorNo: "IKS-Trident-012", plantName: "Emblica officinalis", family: "Phyllanthaceae", ethnobotanicalUse: "Rich in Vitamin C. Used for digestive health, immunity, hair growth, diabetes, and as a rejuvenating tonic (Rasayana).", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Amla_Fruit.JPG/320px-Amla_Fruit.JPG" },
  { vendorNo: "IKS-Trident-013", plantName: "Hemidesmus indicus", family: "Apocynaceae", ethnobotanicalUse: "Root used as a blood purifier, anti-inflammatory, and for skin diseases, fever, and urinary tract infections.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Hemidesmus_indicus.jpg/320px-Hemidesmus_indicus.jpg" },
  { vendorNo: "IKS-Trident-014", plantName: "Leucas aspera", family: "Lamiaceae", ethnobotanicalUse: "Used for skin diseases, insect bites, fever, cold, cough, and as an antiseptic. Also used for nervous disorders.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Leucas_aspera_MS_4379.jpg/320px-Leucas_aspera_MS_4379.jpg" },
  { vendorNo: "IKS-Trident-015", plantName: "Morinda citrifolia", family: "Rubiaceae", ethnobotanicalUse: "Fruit and leaves used for hypertension, diabetes, pain relief, immune boosting, and antibacterial purposes.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Noni_Flower_Fruit_Leaves.jpg/320px-Noni_Flower_Fruit_Leaves.jpg" },
  { vendorNo: "IKS-Trident-016", plantName: "Moringa oleifera", family: "Moringaceae", ethnobotanicalUse: "Leaves, pods, and seeds used for malnutrition, anti-inflammatory, antibacterial, and for water purification.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Moringa_oleifera_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-107.jpg/320px-Moringa_oleifera_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-107.jpg" },
  { vendorNo: "IKS-Trident-017", plantName: "Mucuna pruriens", family: "Fabaceae", ethnobotanicalUse: "Seeds used for Parkinson's disease, aphrodisiac, anti-venom, and as a nervine tonic. Used in Ayurvedic Rasayana therapy.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Mucuna_pruriens_MS_4370.jpg/320px-Mucuna_pruriens_MS_4370.jpg" },
  { vendorNo: "IKS-Trident-018", plantName: "Ocimum sanctum", family: "Lamiaceae", ethnobotanicalUse: "Leaves used for cold, cough, fever, respiratory disorders, stress relief, and as an antibacterial and antifungal agent.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Tulsi_%28Ocimum_tenuiflorum%29_in_Hyderabad%2C_AP_W_IMG_0912.jpg/320px-Tulsi_%28Ocimum_tenuiflorum%29_in_Hyderabad%2C_AP_W_IMG_0912.jpg" },
  { vendorNo: "IKS-Trident-019", plantName: "Phyllanthus niruri", family: "Phyllanthaceae", ethnobotanicalUse: "Used for kidney stones, liver disorders, jaundice, diabetes, and as an antiviral agent especially against hepatitis B.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Phyllanthus_niruri_MS_4057.jpg/320px-Phyllanthus_niruri_MS_4057.jpg" },
  { vendorNo: "IKS-Trident-020", plantName: "Piper longum", family: "Piperaceae", ethnobotanicalUse: "Fruits and roots used for respiratory disorders, digestive ailments, fever, and as a bioavailability enhancer for other medicines.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Piper_longum_MS_4348.jpg/320px-Piper_longum_MS_4348.jpg" },
  { vendorNo: "IKS-Trident-021", plantName: "Saraca asoca", family: "Fabaceae", ethnobotanicalUse: "Bark used for menstrual disorders, uterine health, dysentery, and as an anti-inflammatory and astringent agent.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Saraca_asoca_flowers.jpg/320px-Saraca_asoca_flowers.jpg" },
  { vendorNo: "IKS-Trident-022", plantName: "Swertia chirayita", family: "Gentianaceae", ethnobotanicalUse: "Entire plant used for fever, malaria, liver disorders, diabetes, and as an antimicrobial and antiparasitic agent.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Swertia_chirayita.jpg/320px-Swertia_chirayita.jpg" },
  { vendorNo: "IKS-Trident-023", plantName: "Terminalia arjuna", family: "Combretaceae", ethnobotanicalUse: "Bark used for cardiovascular diseases, heart failure, hypertension, and as a cardioprotective and antioxidant agent.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Terminalia_arjuna_MS_4166.jpg/320px-Terminalia_arjuna_MS_4166.jpg" },
  { vendorNo: "IKS-Trident-024", plantName: "Terminalia chebula", family: "Combretaceae", ethnobotanicalUse: "Fruit used for digestive health, constipation, wound healing, and as an antioxidant. One of the three fruits in Triphala.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Terminalia_chebula_fruits.jpg/320px-Terminalia_chebula_fruits.jpg" },
  { vendorNo: "IKS-Trident-025", plantName: "Tinospora cordifolia", family: "Menispermaceae", ethnobotanicalUse: "Stem used for immunity boosting, fever, diabetes, jaundice, and as an adaptogen and anti-inflammatory agent.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Tinospora_cordifolia.jpg/320px-Tinospora_cordifolia.jpg" },
  { vendorNo: "IKS-Trident-026", plantName: "Vitex negundo", family: "Lamiaceae", ethnobotanicalUse: "Leaves and roots used for joint pain, inflammation, fever, respiratory disorders, and as an analgesic and insect repellent.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Vitex_negundo_MS_4172.jpg/320px-Vitex_negundo_MS_4172.jpg" },
  { vendorNo: "IKS-Trident-027", plantName: "Withania somnifera", family: "Solanaceae", ethnobotanicalUse: "Root used as an adaptogen for stress, fatigue, anxiety, immune support, and as a rejuvenating tonic (Rasayana).", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Withania_somnifera_MS_4373.jpg/320px-Withania_somnifera_MS_4373.jpg" },
  { vendorNo: "IKS-Trident-028", plantName: "Zingiber officinale", family: "Zingiberaceae", ethnobotanicalUse: "Rhizome used for nausea, digestive disorders, cold, cough, inflammation, and as an antimicrobial and analgesic agent.", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Zingiber_officinale_MS_4158.jpg/320px-Zingiber_officinale_MS_4158.jpg" },
];

// FIX 1: Single declaration of NAVBAR_HEIGHT as a number (used for scroll offset calculations)
const NAVBAR_HEIGHT = 130;
const NAV_SECTIONS = ["home", "about", "project", "database", "contact"] as const;

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const filteredData = PLANT_DATA.filter(
    (item) =>
      item.plantName.toLowerCase().includes(search.toLowerCase()) ||
      item.family.toLowerCase().includes(search.toLowerCase()) ||
      item.vendorNo.toLowerCase().includes(search.toLowerCase()) ||
      item.ethnobotanicalUse.toLowerCase().includes(search.toLowerCase())
  );

  // FIX 2: navItem helper restored — used for active-link underline highlighting
  const navItem = (id: string, label: string) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={(e) => handleNavClick(e, id)}
      className={`relative pb-1 transition duration-300 ${
        activeSection === id ? "text-green-600" : "text-green-800 hover:text-green-600"
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

  return (
    <main className="font-serif bg-[#f8f6f1]">

      {/* NAVBAR — FIX 3: removed stray `const` declarations that were placed inside JSX */}
      <nav
        className="fixed top-0 w-full bg-white shadow-md z-50 border-b"
        style={{ height: `${NAVBAR_HEIGHT}px` }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 h-full">

          {/* Logos + Title */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-5 border-r border-gray-300 pr-6">
              <Image
                src="/logo1.png"
                alt="TACT Logo"
                width={90}
                height={90}
                style={{ width: "90px", height: "90px", objectFit: "contain" }}
              />
              <Image
                src="/logo2.png"
                alt="IKS Logo"
                width={110}
                height={110}
                style={{ width: "110px", height: "110px", objectFit: "contain" }}
              />
              <Image
                src="/logo3.svg"
                alt="Government Logo"
                width={120}
                height={120}
                style={{ width: "120px", height: "120px", objectFit: "contain" }}
              />
            </div>
            <h1 className="text-xl font-bold text-green-800 tracking-wide">
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
      <section id="database" className="py-20 bg-[#f8f6f1]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <h2 className="text-4xl font-bold text-green-900 text-center mb-4">Database</h2>
          <p className="text-center text-gray-600 mb-10">
            Ethno-medicinal plant records documented from tribal communities of Eastern Odisha.
          </p>

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-green-200">
            <input
              type="text"
              placeholder="Search by plant name, family, usage…"
              className="w-full px-5 py-3 border-2 border-green-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-300 text-gray-800 placeholder:text-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-green-200 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-green-900 text-white uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-4 py-4 text-left whitespace-nowrap">Photo</th>
                    <th className="px-4 py-4 text-left whitespace-nowrap">Voucher No.</th>
                    <th className="px-4 py-4 text-left whitespace-nowrap">Plant Name</th>
                    <th className="px-4 py-4 text-left whitespace-nowrap">Family</th>
                    <th className="px-4 py-4 text-left">Therapeutic Use</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                        No results found for &ldquo;{search}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.vendorNo} className="hover:bg-green-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-20 h-16 rounded-lg overflow-hidden bg-green-100 flex items-center justify-center flex-shrink-0">
                            {imgErrors[item.vendorNo] ? (
                              <span className="text-2xl">🌿</span>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.photo}
                                alt={item.plantName}
                                className="w-full h-full object-cover"
                                onError={() =>
                                  setImgErrors((prev) => ({ ...prev, [item.vendorNo]: true }))
                                }
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{item.vendorNo}</td>
                        <td className="px-4 py-3 font-semibold text-green-900 italic whitespace-nowrap">{item.plantName}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.family}</td>
                        <td className="px-4 py-3 text-gray-700 leading-relaxed max-w-sm">{item.ethnobotanicalUse}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-right text-xs text-gray-400 mt-3">
            Showing {filteredData.length} of {PLANT_DATA.length} records
          </p>
        </div>
      </section>

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

      {/* FOOTER */}
      <footer className="bg-green-950 text-gray-400 py-10 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Trident Academy of Creative Technology, BBSR &amp; IKS Division, Govt. of India. All rights reserved.</p>
      </footer>

    </main>
  );
}
