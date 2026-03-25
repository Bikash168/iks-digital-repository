"use client";

// ─────────────────────────────────────────────────────────────
// FILE: app/login/page.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Hardcoded credentials ────────────────────────────────────
const VALID_USER = "admin";
const VALID_PASS = "iks@2024";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId]     = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect immediately
    if (typeof window !== "undefined" && sessionStorage.getItem("iks_auth") === "1") {
      router.replace("/admin");
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !password) {
      setError("Please enter both User ID and Password.");
      return;
    }

    setLoading(true);

    // Simulate a brief auth check delay for UX
    setTimeout(() => {
      if (userId.trim() === VALID_USER && password === VALID_PASS) {
        sessionStorage.setItem("iks_auth", "1");
        router.push("/admin");
      } else {
        setError("Invalid User ID or Password. Please try again.");
        setLoading(false);
      }
    }, 700);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #052e16 0%, #14532d 40%, #166534 70%, #15803d 100%)" }}
    >
      {/* ── Decorative botanical background ─────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Large blurred circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4ade80, transparent 70%)" }} />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #86efac, transparent 70%)" }} />
        <div className="absolute top-1/3 right-10 w-48 h-48 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #bbf7d0, transparent 70%)" }} />

        {/* Floating leaf shapes */}
        {mounted && (
          <>
            <svg className="absolute top-16 left-[8%] opacity-10 animate-float-slow" width="60" height="80" viewBox="0 0 60 80">
              <path d="M30 5 C10 20 5 50 30 75 C55 50 50 20 30 5Z" fill="#4ade80" />
            </svg>
            <svg className="absolute bottom-20 left-[15%] opacity-10 animate-float-mid" width="40" height="55" viewBox="0 0 40 55">
              <path d="M20 3 C7 14 3 35 20 52 C37 35 33 14 20 3Z" fill="#86efac" />
            </svg>
            <svg className="absolute top-24 right-[12%] opacity-10 animate-float-slow" width="50" height="70" viewBox="0 0 50 70" style={{ transform: "rotate(25deg)" }}>
              <path d="M25 4 C8 18 4 44 25 66 C46 44 42 18 25 4Z" fill="#4ade80" />
            </svg>
            <svg className="absolute bottom-32 right-[18%] opacity-10 animate-float-mid" width="35" height="48" viewBox="0 0 35 48" style={{ transform: "rotate(-15deg)" }}>
              <path d="M17 3 C6 12 3 30 17 45 C31 30 28 12 17 3Z" fill="#bbf7d0" />
            </svg>
          </>
        )}
      </div>

      {/* ── Login card ───────────────────────────────────────── */}
      <div
        className={`relative w-full max-w-md mx-4 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        {/* Glow behind card */}
        <div className="absolute -inset-1 rounded-3xl opacity-30 blur-xl"
          style={{ background: "linear-gradient(135deg, #4ade80, #16a34a)" }} />

        <div className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/60">

          {/* Card header */}
          <div
            className="px-8 pt-8 pb-6 text-center relative"
            style={{ background: "linear-gradient(160deg, #14532d 0%, #166534 60%, #15803d 100%)" }}
          >
            {/* Emblem */}
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg relative"
              style={{ background: "linear-gradient(135deg, #4ade80 0%, #16a34a 100%)" }}>
              <span className="text-4xl">🌿</span>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center">
                <span className="text-[10px]">🔐</span>
              </div>
            </div>

            <h1 className="text-white text-xl font-bold leading-tight">IKS Digital Repository</h1>
            <p className="text-green-200 text-xs mt-1 tracking-wide">Admin Portal — Authorized Access Only</p>

            {/* Decorative line */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px bg-green-600/50" />
              <span className="text-green-400 text-xs tracking-widest uppercase">Secure Login</span>
              <div className="flex-1 h-px bg-green-600/50" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5" noValidate>

            {/* Error alert */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-shake">
                <span className="text-lg shrink-0 mt-0.5">⚠️</span>
                <p className="text-red-700 text-sm font-medium leading-snug">{error}</p>
              </div>
            )}

            {/* User ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-green-900">
                User ID
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setError(""); }}
                  placeholder="Enter your user ID"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-green-900">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:shadow-green-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: loading ? "#15803d" : "linear-gradient(135deg, #14532d 0%, #16a34a 100%)" }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3" />
                  </svg>
                  Authenticating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In to Admin Panel
                </>
              )}
              {/* Shimmer effect */}
              {!loading && (
                <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              )}
            </button>

            {/* Back link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-xs text-gray-400 hover:text-green-700 transition-colors"
              >
                ← Return to Public Database
              </button>
            </div>
          </form>

          {/* Footer strip */}
          <div className="bg-green-50 border-t border-green-100 px-8 py-3 flex items-center justify-center gap-2">
            <span className="text-[10px] text-green-600 font-medium">
              🔒 Secured · IKS Division, Ministry of Education, Govt. of India
            </span>
          </div>
        </div>

        {/* Institution credit */}
        <p className="text-center text-green-300/60 text-[11px] mt-5">
          Trident Academy of Creative Technology, Bhubaneswar
        </p>
      </div>

      {/* ── Animation styles ─────────────────────────────────── */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(4deg); }
        }
        @keyframes float-mid {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-3deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-mid  { animation: float-mid  4.5s ease-in-out infinite; }
        .animate-shake      { animation: shake 0.4s ease; }
      `}</style>
    </div>
  );
}
