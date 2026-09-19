import type { Metadata } from "next";
import { ArrowDownRight } from "lucide-react";
import { ProjectGallery } from "@/components/project-gallery";
import { ContactSection } from "@/components/contact-section";
import { getPublicProjects, getSiteSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Proyek & Eksplorasi",
  description: "Karya Ferry Kurniawan di web development, IT consulting, video editing, graphic design, dan AI consulting. Lihat proses dan cerita di balik proyeknya.",
  alternates: { canonical: "/proyek" },
};

export default async function ProjectsPage() {
  const [projects, settings] = await Promise.all([getPublicProjects(), getSiteSettings()]);
  return <main id="main"><section className="projects-intro container"><div className="breadcrumb mono">PORTOFERRY <span>/</span> PROYEK</div><div className="projects-intro-grid"><div><span className="eyebrow">A COLLECTION OF THINGS I MAKE</span><h1>Kerja serius.<br /><em>Eksplorasi terus.</em></h1></div><div><ArrowDownRight className="large-arrow" size={56} strokeWidth={1} /><p>Website, video, desain, dan ide yang<br className="desktop-break" /> berhasil keluar dari kepala.<br />Ini sebagian ceritanya.</p></div></div><div className="catalog-note"><span className="status-dot" /> Karya personal & studi konsep. Konsep ditandai, bukan klaim proyek klien.</div></section><section className="container projects-body"><ProjectGallery projects={projects} /></section><ContactSection settings={settings} /></main>;
}
