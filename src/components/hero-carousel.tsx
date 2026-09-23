"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const slides = [
  {
    label: "Perkenalan",
    intro: "HALO, SAYA FERRY KURNIAWAN",
    title: "Website Optimal,",
    accent: "Bisnis Maksimal.",
    description: "Saya bikin website, bantu urusan IT, dan edit video. Kamu fokus ke bisnis. Bagian digitalnya, kita kerjakan bareng.",
    cta: "Ceritakan idemu",
    href: "#kontak",
  },
  {
    label: "Web Development",
    intro: "WEB DEVELOPMENT",
    title: "Dari ide,",
    accent: "jadi website.",
    description: "Kenalkan usahamu lewat website yang ringan dibuka di HP. Landing page, company profile, atau web app, kita pilih sesuai kebutuhan.",
    cta: "Lihat layanan web",
    href: "/layanan/web-development",
  },
  {
    label: "Video Editing",
    intro: "VIDEO EDITING",
    title: "Ide Menarik,",
    accent: "Siap Naikkan Trafik.",
    description: "Reels, video promosi, atau dokumentasi. Saya rapikan potongan, suara, dan warna supaya pesannya sampai tanpa bertele-tele.",
    cta: "Lihat layanan video",
    href: "/layanan/video-editing",
  },
  {
    label: "IT Consulting",
    intro: "IT CONSULTING",
    title: "Sistem Andal,",
    accent: "Kinerja Maksimal.",
    description: "Pilih sistem, rapikan alur kerja, atau cari sumber gangguan. Kita cek kebutuhanmu dulu, lalu tentukan langkah yang masuk akal.",
    cta: "Bahas urusan IT",
    href: "/layanan/it-consulting",
  },
] as const;

const interval = 3_000;

function subscribeToMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function subscribeToVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

export function HeroCarousel({ available }: { available: boolean }) {
  const [active, setActive] = useState(0);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const section = useRef<HTMLElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeToMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const pageVisible = useSyncExternalStore(subscribeToVisibility, () => document.visibilityState !== "hidden", () => false);
  const rotating = !reducedMotion && !pausedByUser && !keyboardFocused && inView && pageVisible;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setActive(index => (index + 1) % slides.length), interval);
    return () => window.clearTimeout(timer);
  }, [active, rotating]);

  function selectSlide(index: number) {
    setPausedByUser(true);
    setActive((index + slides.length) % slides.length);
  }

  return (
    <section
      ref={section}
      className="hero hero-carousel"
      aria-label="Kenalan dengan Ferry dan layanannya"
      aria-roledescription="karusel"
      data-active-slide={active + 1}
      data-rotating={rotating}
      onPointerDownCapture={() => setKeyboardFocused(false)}
      onKeyDownCapture={() => setKeyboardFocused(true)}
      onFocusCapture={event => setKeyboardFocused(event.target.matches(":focus-visible"))}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocused(false);
      }}
    >
      <div className="hero-visual">
        <Image src="/images/ferry-landing.webp" alt="Ferry Kurniawan" fill sizes="100vw" className="hero-portrait" priority />
      </div>
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="hero-slide" id="hero-slide" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
            {slides.map((slide, index) => (
              <div
                key={slide.label}
                className="hero-slide-content"
                data-active={index === active}
                aria-hidden={index !== active}
                inert={index !== active}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} dari ${slides.length}: ${slide.label}`}
              >
                <div className="hero-intro"><span className="intro-line" />{slide.intro}<span className="wave" aria-hidden="true">✳</span></div>
                <h1>{slide.title}<br /> <em>{slide.accent}</em></h1>
                <p className="hero-description">{slide.description}</p>
                <div className="hero-actions">
                  <Link href={slide.href} className="button button-primary">{slide.cta}<ArrowUpRight size={19} /></Link>
                  <Link href="/proyek" className="text-link">Lihat hasil kerja<ArrowRight size={17} /></Link>
                </div>
              </div>
            ))}
          </div>
          <div className="hero-availability"><span className={available ? "status-dot" : "status-dot busy"} /><span>{available ? "Siap Bekerja • Di Kantor / Hibrid / Jarak Jauh / Freelance" : "Let’s talk about your next project"}</span></div>
          <p id="hero-navigation-help" className="sr-only">Memilih slide menghentikan pergantian otomatis agar kamu bisa membaca.</p>
          <div className="hero-carousel-controls" role="group" aria-label="Navigasi karusel" aria-describedby="hero-navigation-help">
            <div className="hero-slide-picker" role="group" aria-label="Pilih slide">
              {slides.map((item, index) => (
                <button key={item.label} type="button" onClick={() => selectSlide(index)} aria-label={`Slide ${index + 1}: ${item.label}`} aria-pressed={index === active} aria-controls="hero-slide">
                  <span className="mono">0{index + 1}</span><span className="slide-indicator" />
                </button>
              ))}
            </div>
            <div className="hero-navigation-controls">
              <button type="button" onClick={() => selectSlide(active - 1)} aria-label="Slide sebelumnya" aria-controls="hero-slide"><ArrowLeft size={15} /></button>
              <button type="button" onClick={() => selectSlide(active + 1)} aria-label="Slide berikutnya" aria-controls="hero-slide"><ArrowRight size={15} /></button>
            </div>
          </div>
        </div>
      </div>
      <div className="container hero-bottom"><span className="mono">INDEPENDENT MIND. HANDS-ON WORK.</span><a href="#layanan">Kenalan lebih jauh<ArrowDown size={15} /></a><span className="mono hero-year">PORTOFERRY © 2026</span></div>
    </section>
  );
}
