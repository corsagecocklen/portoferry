import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Film,
  Layers3,
  Network,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ContactSection } from "@/components/contact-section";
import { ProjectCard } from "@/components/project-card";
import type { Project, SiteSettings } from "@/lib/types";
import { services, type Service } from "@/lib/services";
import styles from "@/app/(site)/layanan/service-pages.module.css";

const visualIcons = {
  web: Code2,
  video: Film,
  consulting: Network,
};

function WebVisual() {
  return <div className={styles.webVisual} role="img" aria-label="Ilustrasi struktur website Portoferry">
    <div className={styles.windowBar}><span /><span /><span /><small>portoferry / landing</small><b>READY</b></div>
    <div className={styles.webCanvas}>
      <div className={styles.webCanvasTop}><span className={styles.miniLine} /><span className={styles.miniLineShort} /><span className={styles.miniPill}>START A PROJECT <ArrowUpRight size={11} /></span></div>
      <div className={styles.webCanvasTitle}><span>Website<br /><em>yang bekerja.</em></span><i /></div>
      <div className={styles.webCanvasRows}><span /><span /><span /></div>
      <div className={styles.webCanvasFooter}><span>STRUCTURE</span><span>CONTENT</span><span>CTA</span></div>
    </div>
    <span className={styles.visualStamp}>RESPONSIVE / CLEAR / READY</span>
  </div>;
}

function VideoVisual() {
  return <div className={styles.videoVisual} role="img" aria-label="Moodboard video editing, studi konsep dan bukan video playable">
    <div className={styles.videoFrame}><Image src="/images/project-jeda.webp" alt="" fill sizes="(max-width: 760px) 84vw, 430px" /></div>
    <span className={styles.conceptStamp}>STUDI KONSEP</span>
    <div className={styles.videoMeta}><span>DI ANTARA JEDA</span><small>MOODBOARD / 01</small></div>
    <div className={styles.timeline}><span /><span /><span /><span /><span /><i /></div>
  </div>;
}

function ConsultingVisual() {
  return <div className={styles.consultingVisual}>
    <Image src="/images/ferry-formal.webp" alt="Ferry Kurniawan, IT consultant" fill sizes="(max-width: 760px) 84vw, 430px" priority />
    <div className={styles.consultingGlow} />
    <span className={styles.consultingLabel}>DENGARKAN / PETAKAN / KERJAKAN</span>
    <span className={styles.consultingTag}><Sparkles size={13} /> FERRY KURNIAWAN · IT CONSULTING</span>
  </div>;
}

function HeroVisual({ service }: { service: Service }) {
  if (service.visual === "web") return <WebVisual />;
  if (service.visual === "video") return <VideoVisual />;
  return <ConsultingVisual />;
}

export function ServiceDetail({
  service,
  projects,
  settings,
}: {
  service: Service;
  projects: Project[];
  settings: SiteSettings;
}) {
  const Icon = visualIcons[service.visual];
  const otherServices = services.filter((item) => item.slug !== service.slug);

  return <main id="main" className={styles.page} data-service={service.slug}>
    <div className={styles.shell}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">PORTOFERRY</Link><span>/</span><Link href="/#layanan">LAYANAN</Link><span>/</span><span aria-current="page">{service.title.toUpperCase()}</span>
      </nav>

      <Link className={styles.backLink} href="/#layanan"><ArrowLeft size={16} /> Kembali ke semua layanan</Link>

      <section className={`${styles.hero} ${styles[service.visual]}`}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><Icon size={15} /> {service.eyebrow}</p>
          <h1>{service.title}<br /><em>{service.heroAccent}</em></h1>
          <p className={styles.heroDescription}>{service.heroDescription}</p>
          <div className={styles.heroActions}>
            <Link className="button button-primary" href="#kontak">Mulai dari brief <ArrowUpRight size={18} /></Link>
            <Link className={styles.inlineLink} href="/#layanan">Lihat layanan lain <ArrowRight size={16} /></Link>
          </div>
          <p className={styles.heroNote}><span>✳</span>{service.heroNote}</p>
        </div>
        <div className={styles.heroVisual}><HeroVisual service={service} /></div>
      </section>

      <section className={styles.signalBar} aria-label="Ringkasan layanan">
        <div><span className="mono">{service.number}</span><strong>{service.title}</strong></div>
        <p>{service.deliverablesIntro}</p>
        <span className={styles.signalArrow} aria-hidden="true"><ArrowDownMark /></span>
      </section>

      <section className={styles.contentSection} id="cakupan">
        <div className={styles.sectionHeader}><div><p className={styles.sectionEyebrow}>APA YANG BISA DIKERJAKAN</p><h2>Ruang kerja yang<br /><em>jelas dari awal.</em></h2></div><p className={styles.sectionIntro}>{service.deliverablesIntro}</p></div>
        <div className={styles.deliverablesGrid}>{service.deliverables.map((item, index) => <article className={styles.deliverable} key={item.title}><div className={styles.itemNumber}>0{index + 1}</div><h3>{item.title}</h3><p>{item.description}</p><ul>{item.items.map(detail => <li key={detail}><Check size={14} />{detail}</li>)}</ul></article>)}</div>
      </section>

      <section className={styles.processSection} id="proses">
        <div className={styles.processHeader}><p className={styles.sectionEyebrow}>CARA KERJA</p><h2>Begini cara<br /><em>kita bekerja.</em></h2><p>Kita sepakati bahan, hasil yang dibutuhkan, dan jadwal review sebelum pengerjaan dimulai.</p></div>
        <ol className={styles.processList}>{service.process.map((step, index) => <li key={step.title}><span className={styles.itemNumber}>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div><ArrowRight size={19} /></li>)}</ol>
      </section>

      <section className={styles.workSection} id="contoh-kerja">
        <div className={styles.sectionHeader}><div><p className={styles.sectionEyebrow}>KARYA TERKAIT</p><h2>Contoh karya<br /><em>di bidang ini.</em></h2></div><Link className={styles.inlineLink} href="/proyek">Lihat semua proyek <ArrowUpRight size={16} /></Link></div>
        {projects.length > 0 ? <div className={styles.projectGrid}>{projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div> : <div className={styles.emptyProjects}><Layers3 size={22} /><p>Belum ada karya publik di kategori ini. Cerita dan kebutuhanmu tetap bisa kita mulai dari brief.</p></div>}
        <p className={styles.projectDisclaimer}><span className={styles.disclaimerMark}>✳</span>{service.visual === "video" ? "Artwork video yang tampil adalah moodboard atau studi konsep, bukan video playable dan bukan klaim proyek klien." : "Karya bertanda Studi konsep adalah eksplorasi mandiri, bukan klaim proyek klien."}</p>
      </section>

      <section className={styles.faqSection} id="faq">
        <div className={styles.faqIntro}><p className={styles.sectionEyebrow}>SEBELUM KITA MULAI</p><h2>Pertanyaan<br /><em>yang wajar.</em></h2><p>Kalau masih ada yang belum jelas, tulis saja di brief. Kita bahas berdasarkan kebutuhan nyata.</p></div>
        <div className={styles.faqList}>{service.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<ChevronDown size={17} /></summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <section className={styles.terms} aria-label="Catatan pengerjaan"><div><span className={styles.sectionEyebrow}>EKSPETASI YANG JUJUR</span><h2>Waktu dan revisi<br /><em>dibahas terbuka.</em></h2></div><div className={styles.termsCopy}><p><strong>Estimasi.</strong> {service.timeline}</p><p><strong>Revisi.</strong> {service.revisions}</p></div></section>

      <nav className={styles.serviceSwitch} aria-label="Layanan lainnya"><div><span className={styles.sectionEyebrow}>LAYANAN LAINNYA</span><h2>Butuh bantuan<br /><em>yang lain?</em></h2></div><div className={styles.serviceSwitchLinks}>{otherServices.map((item) => <Link href={`/layanan/${item.slug}`} key={item.slug} aria-label={item.title}><span className="mono">{item.number}</span><span>{item.title}</span><ArrowUpRight size={17} /></Link>)}</div></nav>
    </div>

    <ContactSection key={service.category} settings={settings} initialService={service.category} />
  </main>;
}

function ArrowDownMark() {
  return <span className={styles.downMark} aria-hidden="true">↓</span>;
}
