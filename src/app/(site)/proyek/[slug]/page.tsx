import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getProject, getPublicProjects } from "@/lib/data";
import { ProjectCard } from "@/components/project-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Proyek tidak ditemukan" };
  return { title: project.title, description: project.summary, alternates: { canonical: `/proyek/${slug}` }, openGraph: { title: project.title, description: project.summary, images: [project.image_url] } };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const related = (await getPublicProjects()).filter(p => p.id !== project.id).slice(0, 3);
  return <main id="main" className="project-detail"><div className="container"><Link className="text-link detail-back" href="/proyek"><ArrowLeft size={17} /> Kembali ke semua proyek</Link><div className="detail-heading"><span className="eyebrow">{project.category.toUpperCase()} / {project.year}</span><h1>{project.title}</h1><p>{project.summary}</p><div className="detail-tags">{project.is_concept && <span className="tag concept-tag">Studi konsep, bukan proyek klien</span>}{project.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div></div><div className="detail-cover"><Image src={project.image_url || "/images/project-placeholder.svg"} alt={project.title} width={1400} height={1000} sizes="100vw" unoptimized={project.image_url.startsWith("https:")} priority /></div><div className="detail-story"><div><span className="eyebrow">DI BALIK PROYEK</span><h2>Catatan <em>pengerjaan.</em></h2></div><div>{project.description.split("\n\n").map((paragraph, i) => <p key={i}>{paragraph}</p>)}{project.project_url && <a href={project.project_url} className="button button-primary" target="_blank" rel="noopener noreferrer">Kunjungi proyek <ArrowUpRight size={18} /></a>}</div></div><div className="detail-cta"><h2>Punya kebutuhan serupa?</h2><Link href="/#kontak" className="button button-outline">Kita ngobrol dulu <ArrowUpRight size={18} /></Link></div>{related.length > 0 && <section className="related-projects"><div className="section-heading"><h2>Cerita <em>lainnya.</em></h2><Link href="/proyek" className="text-link">Semua proyek <ArrowUpRight size={16} /></Link></div><div className="project-grid">{related.map((p, index) => <ProjectCard key={p.id} project={p} index={index} />)}</div></section>}</div></main>;
}
