import { ArrowUp, ArrowUpRight, Camera } from "lucide-react";
import Link from "next/link";
import { Logo } from "./logo";
import type { SiteSettings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return <footer className="site-footer">
    <div className="container">
      <div className="footer-top"><div><Logo /><p>Ide kamu, saya bantu kerjakan.</p></div><div className="footer-links"><Link href="/proyek">Lihat karya <ArrowUpRight size={15} /></Link>{settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer"><Camera size={16} /> Instagram</a>}<a href="#top" className="back-to-top">Kembali ke atas <ArrowUp size={16} /></a></div></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Ferry Kurniawan</span><span>Dibuat dengan niat. Dan sedikit kopi.</span><Link href="/admin">Admin <ArrowUpRight size={12} /></Link></div>
    </div>
  </footer>;
}
