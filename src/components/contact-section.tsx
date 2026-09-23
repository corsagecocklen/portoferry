import type { ContactService, SiteSettings } from "@/lib/types";
import { ContactForm } from "./contact-form";

export function ContactSection({
  settings,
  initialService,
}: {
  settings: SiteSettings;
  initialService?: ContactService;
}) {
  return <section className="contact-section section" id="kontak"><div className="container contact-grid"><div><span className="eyebrow"><span className="small-cross">✳</span> PUNYA IDE DI KEPALA?</span><h2>Kita bikin<br /><em>jadi nyata.</em></h2><p>Website baru, IT yang perlu dibereskan,<br className="desktop-break" /> atau video yang masih di folder.<br />Ceritakan saja dulu.</p><div className="availability"><span className={settings.available ? "status-dot" : "status-dot busy"} /><span>{settings.available ? "Siap Bekerja • Di Kantor / Hibrid / Jarak Jauh / Freelance" : "Jadwal berikutnya bisa didiskusikan"}</span></div><span className="contact-scribble" aria-hidden="true">Let’s make it happen. <svg width="68" height="40" viewBox="0 0 68 40" fill="none"><path d="M2 3C13 29 31 33 57 22M50 15L61 21L55 33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span></div><ContactForm settings={settings} initialService={initialService} /></div></section>;
}
