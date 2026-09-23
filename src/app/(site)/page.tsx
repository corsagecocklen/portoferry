import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Film, Settings2, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ContactSection } from "@/components/contact-section";
import { HeroCarousel } from "@/components/hero-carousel";
import { ProjectCard } from "@/components/project-card";
import { getPublicProjects, getSiteSettings } from "@/lib/data";
import { selectHomeFeedProjects } from "@/lib/project-feed";
import { services } from "@/lib/services";

const serviceSummaries = {
  "web-development": { icon: Code2, line: "Dari link di bio, jadi tempat bisnismu.", description: "Landing page, company profile, sampai web app. Ringan dibuka, enak dilihat di HP, dan gampang kamu kelola.", tags: ["Landing page", "Company profile", "Web app"] },
  "it-consulting": { icon: Settings2, line: "Urusan teknis, kita bereskan.", description: "Bingung pilih sistem, atur alur kerja, atau cari penyebab masalah IT? Kita petakan dulu, lalu cari solusi yang sesuai.", tags: ["Audit kebutuhan", "Solusi sistem", "Pendampingan"] },
  "video-editing": { icon: Film, line: "Footage-mu punya cerita.", description: "Saya bantu susun jadi video yang enak ditonton. Dari konten pendek, video promosi, sampai dokumentasi.", tags: ["Reels & TikTok", "Video promosi", "Dokumentasi"] },
};
const landingServices = services.map(({ slug, title, number }) => ({ slug, title, number, ...serviceSummaries[slug] }));

const faqs = [
  ["Beneran bisa bikin website dalam 1 jam?", "Bisa kita bahas untuk landing page sederhana dari struktur siap pakai, kalau teks, foto, dan brief sudah lengkap. Waktunya dihitung setelah semua bahan dan lingkup disepakati. Website dengan fitur khusus tentu perlu waktu lebih panjang."],
  ["Kalau belum punya desain atau gambaran?", "Nggak apa-apa. Ceritakan bisnisnya, siapa yang akan memakai website atau menonton videonya, dan apa yang ingin dicapai. Dari situ kita susun arah dan referensinya bareng."],
  ["Revisinya bagaimana?", "Revisi visual dan konten dibahas di awal sesuai lingkup pekerjaan. Kalau ada tambahan halaman, fitur, atau perubahan arah besar di tengah jalan, kita sepakati waktu dan biayanya dulu."],
  ["Bisa bantu setelah proyek selesai?", "Bisa. Pendampingan, update konten, dan perawatan teknis bisa kita masukkan ke kesepakatan. Untuk website dengan admin panel, saya juga siapkan panduan supaya kamu bisa update sendiri."],
];

export default async function HomePage() {
  const [projects, settings] = await Promise.all([getPublicProjects(), getSiteSettings()]);
  const recent = selectHomeFeedProjects(projects);

  return <main id="main">
    <HeroCarousel available={settings.available} />

    <div className="expertise-strip"><div className="container"><span>WEB DEVELOPMENT</span><span className="strip-star">✳</span><span>IT CONSULTING</span><span className="strip-star">✳</span><span>VIDEO EDITING</span><span className="strip-star">✳</span><span className="strip-note">One person. Many possibilities.</span></div></div>

    <section className="section services-section" id="layanan"><div className="container"><div className="section-heading"><div><span className="eyebrow">01 / YANG BISA SAYA BANTU</span><h2>Kebutuhanmu,<br /><em>saya kerjakan.</em></h2></div><p>Nggak perlu cari orang berbeda<br />untuk setiap urusan digital.</p></div><div className="service-list">{landingServices.map(service => <article className="service-row" key={service.number}><span className="service-number mono">/{service.number}</span><div className="service-title"><service.icon size={22} strokeWidth={1.4} /><h3><Link href={`/layanan/${service.slug}`}>{service.title}</Link></h3><p>{service.line}</p></div><div className="service-description"><p>{service.description}</p><div className="service-tags">{service.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><Link href={`/layanan/${service.slug}`} className="service-arrow" aria-label={`Lihat layanan ${service.title}`}><ArrowUpRight size={26} /></Link></article>)}</div><div className="quick-offer"><span className="quick-offer-icon"><Zap size={16} /></span><p>Butuh cepat? <strong>Landing page dalam 1 jam*</strong> bisa kita bahas.</p><a href="#faq">Lihat syaratnya <ArrowUpRight size={14} /></a></div></div></section>

    <section className="section selected-work" id="proyek"><div className="container"><div className="section-heading"><div><span className="eyebrow">02 / DARI MEJA KERJA</span><h2>Sedikit karya.<br /><em>Banyak cerita.</em></h2></div><div className="work-heading-right"><p>Yang baru dikerjakan, dan yang lagi dieksplorasi.<br />Karya personal & studi konsep.</p><Link href="/proyek" className="text-link">Semua proyek <ArrowUpRight size={17} /></Link></div></div><div className="feed-label"><span><span className="status-dot" /> RECENT WORKS</span><span className="mono">SCROLL. EXPLORE. GET INSPIRED.</span></div>{recent.length ? <div className="project-grid home-project-grid">{recent.map((project, i) => <ProjectCard project={project} index={i} key={project.id} />)}</div> : <div className="empty-state"><h3>Karya berikutnya sedang disiapkan.</h3><Link href="/proyek" className="text-link">Lihat katalog proyek <ArrowUpRight size={16} /></Link></div>}</div></section>

    <section className="section about-section" id="tentang"><div className="container about-grid"><div className="about-photo-wrap"><div className="about-photo"><Image src="/images/ferry-portrait.webp" alt="Potret Ferry Kurniawan" fill sizes="(max-width: 760px) 80vw, 330px" /><span className="about-photo-caption mono">THE PERSON BEHIND THE PIXELS.</span></div><span className="about-label">Yep, that’s me. <ArrowDownRight size={25} /></span></div><div className="about-copy"><span className="eyebrow">03 / DI BALIK LAYAR</span><h2>Kenalin, Ferry.<br /><em>Teman digitalmu.</em></h2><p>Saya suka mengerjakan banyak hal. Menulis kode, merapikan visual, menyusun video, sampai mencari tahu kenapa sebuah sistem nggak berjalan semestinya.</p><p>Di sini, kamu ngobrol langsung dengan orang yang mengerjakan proyekmu. Dari brief pertama sampai hasilnya siap dipakai.</p><div className="about-notes"><span><Check size={16} /> Komunikasi langsung</span><span><Check size={16} /> Lingkup kerja yang jelas</span></div><Link href="/proyek" className="text-link">Lihat sisi kreatif saya yang lain <ArrowUpRight size={16} /></Link></div></div></section>

    <section className="process-section section"><div className="container"><div className="process-heading"><span className="eyebrow">DARI “KAYAKNYA SERU” JADI “UDAH JADI”</span><h2>Nggak perlu <em>ribet.</em></h2></div><div className="process-grid"><article><span className="process-number mono">01 <span /><ArrowRight size={16} /></span><h3>Ngobrol dulu.</h3><p>Kamu cerita, saya dengarkan. Kita sepakati kebutuhan, waktu, dan biaya sebelum mulai.</p></article><article><span className="process-number mono">02 <span /><ArrowRight size={16} /></span><h3>Saya kerjakan.</h3><p>Kamu tetap dapat kabar prosesnya. Ada yang kurang pas? Kita bahas selagi dikerjakan.</p></article><article><span className="process-number mono">03 <span /><Check size={16} /></span><h3>Cek, lalu tayang.</h3><p>Kita periksa bareng, rapikan revisinya, lalu siapkan hasilnya untuk dipakai.</p></article></div></div></section>

    <section className="faq-section section" id="faq"><div className="container faq-grid"><div><span className="eyebrow">BIAR NGGAK MENGGANJAL</span><h2>Mungkin kamu<br /><em>juga mikir ini.</em></h2><span className="faq-doodle" aria-hidden="true"><Sparkles size={38} strokeWidth={1} /></span></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{answer}</p></details>)}</div></div></section>

    <ContactSection settings={settings} />
  </main>;
}
