"use client";

import { ArrowUpRight, Bookmark, Heart, Layers, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/lib/types";

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const isArticle = project.category === "Artikel";

  async function share() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/proyek/${project.slug}`);
      setNotice("Tautan disalin");
    } catch { setNotice("Buka detail proyek untuk menyalin tautannya."); }
  }

  return <article className="project-card">
    <div className="post-header"><Image className="post-avatar" src="/images/ferry-avatar-20260923.webp" alt="" width={30} height={30} /><div><span className="post-author">ferry.kurniawan</span><span className="post-subtitle">{project.category}</span></div><span className="post-index mono">0{index + 1}</span><button className="icon-button post-more" onClick={share} aria-label={`Salin tautan ${project.title}`}><MoreHorizontal size={19} /></button></div>
    <Link href={`/proyek/${project.slug}`} className="project-art" aria-label={`${isArticle ? "Baca artikel" : "Lihat proyek"} ${project.title}`}>
      <Image src={project.image_url || "/images/project-placeholder.svg"} alt={project.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" unoptimized={project.image_url.startsWith("https:")} />
      {project.is_concept && <span className="concept-badge">Studi konsep</span>}
      <span className="project-hover"><ArrowUpRight size={28} /></span>
      <span className="project-stack" aria-hidden="true"><Layers size={17} /></span>
    </Link>
    <div className="post-actions"><button className={`icon-button ${liked ? "is-liked" : ""}`} onClick={() => setLiked(!liked)} aria-pressed={liked} aria-label={`Suka ${project.title}`}><Heart size={21} fill={liked ? "currentColor" : "none"} /></button><Link href={`/proyek/${project.slug}`} className="post-detail">{isArticle ? "Baca artikel" : "Lihat cerita proyek"} <ArrowUpRight size={15} /></Link><button className={`icon-button ${saved ? "is-saved" : ""}`} onClick={() => setSaved(!saved)} aria-pressed={saved} aria-label={`Tandai ${project.title}`} title="Penanda untuk kunjungan ini"><Bookmark size={20} fill={saved ? "currentColor" : "none"} /></button></div>
    <Link className="project-title" href={`/proyek/${project.slug}`}>{project.title}</Link>
    <p className="project-summary">{project.summary}</p>
    <div className="post-footnote"><span>{project.tags.slice(0, 2).map(tag => `#${tag.replaceAll(" ", "")}`).join(" ")}</span><time dateTime={project.created_at}>{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(project.created_at))}</time></div>
    {notice && <p className="post-notice" role="status">{notice}</p>}
    <span className="sr-only" role="status">{saved ? "Ditandai untuk kunjungan ini" : ""}</span>
  </article>;
}
