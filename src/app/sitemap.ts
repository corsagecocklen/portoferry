import type { MetadataRoute } from "next";
import { getPublicProjects } from "@/lib/data";
import { services } from "@/lib/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://portoferry.my.id";
  const projects = await getPublicProjects();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/proyek`, changeFrequency: "weekly", priority: 0.8 },
    ...services.map(service => ({ url: `${base}/layanan/${service.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...projects.map(project => ({ url: `${base}/proyek/${project.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
