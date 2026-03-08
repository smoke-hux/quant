"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Clock,
  FileSpreadsheet,
  ArrowRight,
  Shield,
  Users,
  Zap,
  CheckCircle2,
  Lock,
  Globe,
  Layers,
  Sparkles,
} from "lucide-react";

/* ================================================================
   Hook: Intersection Observer for scroll-triggered animations
   ================================================================ */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ================================================================
   Hook: Animated counter
   ================================================================ */
function useCounter(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

/* ================================================================
   Hook: Typewriter effect
   ================================================================ */
function useTypewriter(words: string[], typingSpeed = 80, deletingSpeed = 50, pauseDuration = 2000) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && text === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    } else {
      timeout = setTimeout(
        () => {
          setText(
            isDeleting
              ? currentWord.substring(0, text.length - 1)
              : currentWord.substring(0, text.length + 1)
          );
        },
        isDeleting ? deletingSpeed : typingSpeed
      );
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return text;
}

/* ================================================================
   Component: Animated background particles
   ================================================================ */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10 animate-particle"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${Math.random() * 10 + 8}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ================================================================
   Main Component
   ================================================================ */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  // Typewriter words
  const typedText = useTypewriter(
    ["master your time.", "boost productivity.", "streamline workflows.", "empower your team."],
    70,
    40,
    2500
  );

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mouse tracking for hero gradient
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  // Scroll reveal hooks
  const heroPreview = useInView(0.1);
  const statsSection = useInView(0.1);
  const ctaSection = useInView(0.1);

  // Animated counters
  const uptimeCount = useCounter(99, 1500, statsSection.inView);

  return (
    <div className="min-h-screen bg-white">
      {/* ========== Navbar ========== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/60 backdrop-blur-xl shadow-sm border-b border-white/30"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  scrolled
                    ? "bg-blue-600 shadow-lg shadow-blue-600/25"
                    : "bg-white/20 backdrop-blur-sm"
                }`}
              >
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span
                className={`text-lg font-bold tracking-tight transition-colors duration-300 ${
                  scrolled ? "text-gray-900" : "text-white"
                }`}
              >
                Trumpet Courts
              </span>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className={`hidden sm:inline-flex px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  scrolled
                    ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  scrolled
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200/50"
                    : "bg-white text-blue-700 hover:bg-blue-50 shadow-lg shadow-black/10"
                }`}
              >
                Get Started
              </Link>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg cursor-pointer ${
                  scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
                }`}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className={`md:hidden pb-4 border-t ${scrolled ? "border-gray-100" : "border-white/10"}`}>
              <div className="flex flex-col gap-2 pt-4">
                <Link
                  href="/login"
                  className={`sm:hidden px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
                    scrolled ? "text-gray-700 hover:bg-gray-50" : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ========== Hero Section ========== */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"
      >
        {/* Mouse-following radial glow */}
        <div
          className="absolute inset-0 opacity-30 transition-all duration-500 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(99,163,255,0.4), transparent 60%)`,
          }}
        />

        {/* Animated background grid */}
        <div
          className="absolute inset-0 opacity-[0.07] animate-grid-shift"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Floating orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-[10%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-blue-100 font-medium mb-6 animate-fade-in-up">
                <Sparkles className="w-3.5 h-3.5" />
                Trusted by teams worldwide
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] animate-fade-in-up">
                Manage your work,{" "}
                <span className="relative">
                  <span className="text-blue-200">{typedText}</span>
                  <span className="inline-block w-[3px] h-[0.9em] bg-blue-300 ml-0.5 animate-blink align-middle" />
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-blue-100/80 leading-relaxed max-w-xl animate-fade-in-up stagger-1 opacity-0">
                A unified platform for time-controlled access and collaborative
                Excel project management. Stay organized, stay on schedule.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up stagger-2 opacity-0">
                <Link
                  href="/login?mode=signup"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Interactive trust pills */}
              <div className="mt-10 flex flex-wrap gap-3 animate-fade-in-up stagger-3 opacity-0">
                {[
                  { icon: Shield, text: "Secure Access" },
                  { icon: Clock, text: "Schedule Control" },
                  { icon: FileSpreadsheet, text: "Excel Editor" },
                  { icon: Users, text: "Team Management" },
                ].map(({ icon: Icon, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-sm text-blue-100 font-medium hover:bg-white/20 hover:border-white/20 transition-all cursor-default"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Interactive App Preview */}
            <div
              ref={heroPreview.ref}
              className={`hidden lg:block transition-all duration-700 ${
                heroPreview.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="relative">
                {/* Glow behind the card */}
                <div className="absolute -inset-4 bg-blue-400/20 rounded-3xl blur-2xl" />

                {/* Dashboard preview card */}
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                  {/* Top bar */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                    <div className="ml-3 flex-1 h-6 bg-white/10 rounded-md flex items-center px-2">
                      <span className="text-xs text-white/40">trumpetcourts.app/dashboard</span>
                    </div>
                  </div>

                  {/* Mini dashboard */}
                  <div className="space-y-3">
                    {/* Stat cards */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Active Users", value: "24", color: "text-emerald-300", bar: "bg-emerald-400/30" },
                        { label: "Projects", value: "12", color: "text-blue-300", bar: "bg-blue-400/30" },
                        { label: "Files Edited", value: "87", color: "text-violet-300", bar: "bg-violet-400/30" },
                      ].map((stat, i) => (
                        <div
                          key={stat.label}
                          className="bg-white/10 rounded-lg p-3 border border-white/10 hover:bg-white/15 transition-colors cursor-default"
                        >
                          <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                          <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
                          <div className={`h-1 rounded-full ${stat.bar} mt-2`}>
                            <div
                              className={`h-full rounded-full ${stat.bar.replace("/30", "")} transition-all duration-1000`}
                              style={{ width: heroPreview.inView ? `${60 + i * 15}%` : "0%" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Activity feed with pulse */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-white/70">Recent Activity</div>
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                      </div>
                      {[
                        { action: "Sarah edited Q4-Report.xlsx", time: "2m ago", color: "bg-blue-400" },
                        { action: "John uploaded Budget.xlsx", time: "5m ago", color: "bg-emerald-400" },
                        { action: "Admin updated schedule", time: "12m ago", color: "bg-amber-400" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                            <span className="text-xs text-white/60">{item.action}</span>
                          </div>
                          <span className="text-xs text-white/30">{item.time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Mini spreadsheet */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs font-semibold text-white/70 mb-2">Excel Editor</div>
                      <div className="grid grid-cols-4 gap-px bg-white/10 rounded overflow-hidden">
                        {["A", "B", "C", "D"].map((col) => (
                          <div key={col} className="bg-white/10 px-2 py-1 text-center text-xs text-white/50 font-medium">
                            {col}
                          </div>
                        ))}
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className={`bg-white/5 px-2 py-1 text-xs text-white/30 ${i === 1 ? "ring-1 ring-blue-400/50 bg-blue-400/10 text-blue-300" : ""}`}
                          >
                            {i === 0 ? "Revenue" : i === 1 ? "$45.2K" : i === 2 ? "$52.1K" : i === 3 ? "$61.8K" : i === 4 ? "Costs" : i === 5 ? "$22.1K" : i === 6 ? "$24.5K" : "$28.2K"}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification */}
                <div className="absolute -right-4 top-16 bg-white rounded-xl shadow-xl p-3 animate-float border border-gray-100" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">File Saved</div>
                      <div className="text-xs text-gray-500">Q4-Report.xlsx</div>
                    </div>
                  </div>
                </div>

                {/* Floating user badge */}
                <div className="absolute -left-4 bottom-20 bg-white rounded-xl shadow-xl p-3 animate-float" style={{ animationDelay: "2.5s" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">3 Online</div>
                      <div className="text-xs text-gray-500">Team members</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ========== Stats Section ========== */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div
          ref={statsSection.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
            statsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
            {[
              {
                value: `${uptimeCount}.9%`,
                label: "Uptime",
                icon: Zap,
                color: "text-amber-600",
                bg: "bg-amber-50",
                ring: "ring-amber-100",
              },
              {
                value: "24/7",
                label: "Admin Access",
                icon: Shield,
                color: "text-violet-600",
                bg: "bg-violet-50",
                ring: "ring-violet-100",
              },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-4 group">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ring-1 ${stat.ring} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA Section ========== */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <FloatingParticles />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

        <div
          ref={ctaSection.ref}
          className={`relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${
            ctaSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to transform your workflow?
          </h2>
          <p className="mt-4 text-lg text-blue-100/80 max-w-xl mx-auto">
            Join your team on Trumpet Courts and take control of your work
            schedule today. No credit card required.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login?mode=signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10 cursor-pointer"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-white/30 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            >
              Sign In to your account
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-blue-200/70">
            {[
              { icon: Lock, text: "SSL Encrypted" },
              { icon: Globe, text: "99.9% Uptime" },
              { icon: Shield, text: "SOC 2 Compliant" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-gray-800">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                  Trumpet Courts
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                A unified platform for time-controlled access and collaborative
                Excel project management.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2">
                {["Pricing"].map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Account</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/login?mode=signup" className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                    Create Account
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Trumpet Courts. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms"].map((link) => (
                <a key={link} href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


