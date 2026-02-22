"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { VitalisLogo } from "@/components/ui/vitalis-logo";

const navLinks = [
  { label: "Problemas", href: "#problemas" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Preços", href: "#precos" },
  { label: "Depoimentos", href: "#depoimentos" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-700/50 bg-navy-950/90 shadow-lg backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="shrink-0">
          <VitalisLogo size="sm" variant="white" />
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-teal-400"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-white/60 transition-colors hover:text-white sm:inline-block"
          >
            Entrar
          </Link>
          <a
            href="#precos"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-teal-700"
          >
            Comece Grátis
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-white/60 hover:text-white lg:hidden"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col items-center gap-8 bg-navy-950/95 pt-16 backdrop-blur-lg lg:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-lg text-white/80 transition-colors hover:text-teal-400"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="text-lg text-white/50 transition-colors hover:text-white"
          >
            Entrar
          </Link>
        </div>
      )}
    </nav>
  );
}
