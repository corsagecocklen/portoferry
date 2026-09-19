"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Braces, Pause, Play, Settings2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const slides = [
  {
    label: "Perkenalan",
    intro: "HALO, SAYA FERRY KURNIAWAN",
    title: "Website siap.",
    accent: "Bisnis jalan.",
    description: "Saya bikin website, bantu urusan IT, dan edit video. Kamu fokus ke bisnis. Bagian digitalnya, kita kerjakan bareng.",
    cta: "Ceritakan idemu",
    href: "#kontak",
    coordinate: "IDE → EKSEKUSI → TAYANG",
  },
  {
    label: "Web Development",
    intro: "WEB DEVELOPMENT",
    title: "Dari ide,",
    accent: "jadi website.",
    description: "Kenalkan usahamu lewat website yang ringan dibuka di HP. Landing page, company profile, atau web app, kita pilih sesuai kebutuhan.",
    cta: "Lihat layanan web",
    href: "/layanan/web-development",
    coordinate: "BRIEF → DESAIN → WEBSITE",
  },
  {
    label: "Video Editing",
    intro: "VIDEO EDITING",
    title: "Footage ada.",
    accent: "Saatnya tayang.",
    description: "Reels, video promosi, atau dokumentasi. Saya rapikan potongan, suara, dan warna supaya pesannya sampai tanpa bertele-tele.",
    cta: "Lihat layanan video",
    href: "/layanan/video-editing",
    coordinate: "FOOTAGE → EDIT → TAYANG",
  },
  {
    label: "IT Consulting",
    intro: "IT CONSULTING",
    title: "Rapikan IT,",
    accent: "fokus kerja.",
    description: "Pilih sistem, rapikan alur kerja, atau cari sumber gangguan. Kita cek kebutuhanmu dulu, lalu tentukan langkah yang masuk akal.",
    cta: "Bahas urusan IT",
    href: "/layanan/it-consulting",
    coordinate: "CEK → PETAKAN → BERESKAN",
  },
] as const;

const interval = 8_000;

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
  const [rotation, setRotation] = useState<"auto" | "playing" | "paused">("auto");
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(true);
  const section = useRef<HTMLElement>(null);
  const rotationButton = useRef<HTMLButtonElement>(null);
  const pointerOnRotation = useRef(false);
  const reducedMotion = useSyncExternalStore(subscribeToMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const pageVisible = useSyncExternalStore(subscribeToVisibility, () => document.visibilityState !== "hidden", () => false);
  const rotationRequested = rotation === "playing" || (rotation === "auto" && !reducedMotion);
  const rotating = rotationRequested && !hovered && inView && pageVisible;
  const slide = slides[active];
  const formalPortrait = active === 3;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % slides.length), interval);
    return () => window.clearInterval(timer);
  }, [rotating]);

  function selectSlide(index: number) {
    setRotation("paused");
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
      onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={event => {
        // A pointer click must toggle once, rather than pause on focus and restart on click.
        if (event.target === rotationButton.current && pointerOnRotation.current) return;
        setRotation("paused");
      }}
    >
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="hero-slide" id="hero-slide" aria-live={rotationRequested ? "off" : "polite"} aria-atomic="true">
            <div key={active} className="hero-slide-content" role="group" aria-roledescription="slide" aria-label={`${active + 1} dari ${slides.length}: ${slide.label}`}>
              <div className="hero-intro"><span className="intro-line" />{slide.intro}<span className="wave" aria-hidden="true">✳</span></div>
              <h1>{slide.title}<br /><em>{slide.accent}</em></h1>
              <p className="hero-description">{slide.description}</p>
              <div className="hero-actions">
                <Link href={slide.href} className="button button-primary">{slide.cta}<ArrowUpRight size={19} /></Link>
                <Link href="/proyek" className="text-link">Lihat hasil kerja<ArrowRight size={17} /></Link>
              </div>
            </div>
          </div>
          <div className="hero-availability"><span className={available ? "status-dot" : "status-dot busy"} /><span>{available ? "Available for freelance projects" : "Let’s talk about your next project"}</span></div>
          <div className="hero-carousel-controls">
            <div className="hero-slide-picker" role="group" aria-label="Pilih slide">
              {slides.map((item, index) => (
                <button key={item.label} type="button" onClick={() => selectSlide(index)} aria-label={`Slide ${index + 1}: ${item.label}`} aria-pressed={index === active} aria-controls="hero-slide">
                  <span className="mono">0{index + 1}</span><span className="slide-indicator" />
                </button>
              ))}
            </div>
            <div className="hero-playback-controls">
              <button type="button" onClick={() => selectSlide(active - 1)} aria-label="Slide sebelumnya" aria-controls="hero-slide"><ArrowLeft size={15} /></button>
              <button type="button" onClick={() => selectSlide(active + 1)} aria-label="Slide berikutnya" aria-controls="hero-slide"><ArrowRight size={15} /></button>
              <button
                ref={rotationButton}
                type="button"
                onPointerDown={() => { pointerOnRotation.current = true; }}
                onPointerUp={() => { pointerOnRotation.current = false; }}
                onPointerCancel={() => { pointerOnRotation.current = false; }}
                onClick={() => setRotation(rotationRequested ? "paused" : "playing")}
                aria-label={rotationRequested ? "Jeda pergantian otomatis" : "Mulai pergantian otomatis"}
                aria-controls="hero-slide"
              >{rotationRequested ? <Pause size={13} /> : <Play size={13} />}</button>
            </div>
          </div>
        </div>
        <div className={`hero-visual${formalPortrait ? " hero-visual-formal" : ""}`}>
          <div className="hero-halo" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <span className="hero-coordinate mono">{slide.coordinate}</span><span className="hero-spark" aria-hidden="true">✳</span>
          <div className="portrait-frame">
            <Image src="/images/ferry-hero.webp" alt="Ferry Kurniawan, web developer dan video editor" fill sizes="(max-width: 760px) 95vw, 550px" className={`hero-portrait${formalPortrait ? " portrait-hidden" : ""}`} aria-hidden={formalPortrait} priority />
            <Image src="/images/ferry-formal-cutout.webp" alt="Ferry Kurniawan untuk konsultasi IT" fill sizes="(max-width: 760px) 95vw, 550px" className={`hero-portrait hero-portrait-formal${formalPortrait ? "" : " portrait-hidden"}`} aria-hidden={!formalPortrait} />
          </div>
          <div className="floating-tag tag-code">{formalPortrait ? <Settings2 size={19} /> : <Braces size={19} />}<span>{formalPortrait ? "Sistem sesuai kebutuhan." : "Built with purpose."}</span><span className="tag-dot" /></div>
          <div className="floating-tag tag-video"><span className="tag-play"><Play size={13} fill="currentColor" /></span><div>{formalPortrait ? "Dari masalah ke langkah kerja." : "Make every frame count."}<span className="tag-timeline"><i /><i /><i /><i /><i /><i /></span></div></div>
          <div className="hero-signature">Ferry Kurniawan<span>YOUR DIGITAL PARTNER</span></div><span className="hero-bracket bracket-top" /><span className="hero-bracket bracket-bottom" />
        </div>
      </div>
      <div className="container hero-bottom"><span className="mono">INDEPENDENT MIND. HANDS-ON WORK.</span><a href="#layanan">Kenalan lebih jauh<ArrowDown size={15} /></a><span className="mono hero-year">PORTOFERRY © 2026</span></div>
    </section>
  );
}
