"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clientes" },
  { href: "/appointments", label: "Citas" },
  { href: "/staff", label: "Staff" },
  { href: "/services", label: "Servicios" },
  { href: "/reports", label: "Reportes" },
] as const;

function NavLinks({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Cerrar menú"
        className="fixed inset-0 z-[1000] bg-black/50 md:hidden"
        onClick={onClose}
      />
      <aside
        id="mobile-navigation"
        className="fixed left-0 top-0 z-[1001] flex h-dvh w-[min(20rem,90vw)] flex-col border-r border-white/10 bg-[#0c0c0e] text-white shadow-2xl md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">GlamourOS</p>
            <p className="text-lg font-semibold">Panel</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <NavLinks onNavigate={onClose} />
      </aside>
    </>,
    document.body,
  );
}

export default function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const close = () => setMenuOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b border-black/10 bg-[#FAF7F8] px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg border border-black/10 bg-white p-2.5 text-[#18181B] shadow-sm active:bg-neutral-100"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm font-semibold text-[#18181B]">GlamourOS</span>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <aside className="hidden h-screen w-80 shrink-0 flex-col border-r border-white/10 bg-[#0c0c0e] text-white md:flex">
        <div className="border-b border-white/10 px-8 pb-4 pt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">GlamourOS</p>
          <h2 className="text-2xl font-semibold">Panel</h2>
        </div>
        <NavLinks onNavigate={() => undefined} />
      </aside>
    </>
  );
}
