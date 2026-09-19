"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

const links = [
  { href: "/#layanan", label: "Layanan" },
  { href: "/proyek", label: "Proyek" },
  { href: "/#tentang", label: "Tentang saya" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">Langsung ke konten</a>
      <div className="container header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname.startsWith("/proyek") && link.href === "/proyek" ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <Link href="/#kontak" className="button button-outline header-cta">Ngobrol dulu <ArrowUpRight size={16} /></Link>
        <button className="icon-button menu-toggle" onClick={() => setOpen(true)} aria-label="Buka navigasi" aria-expanded={open} aria-controls="mobile-navigation"><Menu /></button>
      </div>
      <dialog ref={dialog} id="mobile-navigation" aria-label="Navigasi situs" className="mobile-menu" onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
        <div className="mobile-menu-head"><Logo /><button className="icon-button" onClick={() => setOpen(false)} aria-label="Tutup navigasi"><X /></button></div>
        <nav aria-label="Navigasi seluler">
          {[...links, { href: "/#kontak", label: "Ngobrol dulu" }].map((link, i) => <Link onClick={() => setOpen(false)} key={link.href} href={link.href}><span className="mono">0{i + 1}</span>{link.label}<ArrowUpRight /></Link>)}
        </nav>
        <p>Ferry Kurniawan<br /><span className="muted">Web, IT & video. Dari ide sampai tayang.</span></p>
      </dialog>
    </header>
  );
}
