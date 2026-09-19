"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { categories, type Project } from "@/lib/types";
import { ProjectCard } from "./project-card";

export function ProjectGallery({ projects }: { projects: Project[] }) {
  const [category, setCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const filtered = projects.filter(project => (category === "Semua" || project.category === category) && `${project.title} ${project.summary} ${project.tags.join(" ")}`.toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id").trim()));

  return <div className="project-gallery">
    <div className="gallery-toolbar"><div className="category-filters" role="group" aria-label="Filter kategori proyek">{["Semua", ...categories].map(item => <button className={category === item ? "active" : ""} aria-pressed={category === item} key={item} onClick={() => setCategory(item)}>{item}{item === "Semua" && <span>{projects.length}</span>}</button>)}</div><label className="search-field"><Search size={17} /><span className="sr-only">Cari proyek</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari sesuatu..." />{query && <button className="icon-button" onClick={() => setQuery("")} aria-label="Hapus pencarian"><X size={15} /></button>}</label></div>
    <div className="gallery-count"><span className="mono" aria-live="polite">{String(filtered.length).padStart(2, "0")} PROYEK</span><span><SlidersHorizontal size={13} /> Urutan pilihan</span></div>
    {filtered.length ? <div className="project-grid">{filtered.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div> : <div className="empty-state"><Search size={32} /><h2>Belum ketemu.</h2><p>Coba kata lain atau lihat semua kategori.</p><button className="button button-outline" onClick={() => { setCategory("Semua"); setQuery(""); }}>Tampilkan semua proyek</button></div>}
  </div>;
}
