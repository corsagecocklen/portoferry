import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/service-detail";
import { getPublicProjects, getSiteSettings } from "@/lib/data";
import { getService, services } from "@/lib/services";
import { socialImage } from "@/lib/site-metadata";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) {
    return {
      title: "Layanan tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${service.title} | ${service.heroAccent}`,
    description: service.heroDescription,
    alternates: { canonical: `/layanan/${service.slug}` },
    openGraph: {
      title: `${service.title} | Portoferry`,
      description: service.heroDescription,
      url: `/layanan/${service.slug}`,
      type: "website",
      locale: "id_ID",
      siteName: "Portoferry",
      images: [socialImage],
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) notFound();

  const [projects, settings] = await Promise.all([getPublicProjects(), getSiteSettings()]);
  const relevantProjects = projects.filter((project) => project.category === service.category);

  return <ServiceDetail service={service} projects={relevantProjects} settings={settings} />;
}
