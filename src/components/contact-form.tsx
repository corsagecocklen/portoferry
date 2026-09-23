"use client";

import { ArrowDownToLine, ArrowUpRight, Check, Copy, MessageCircle, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { serviceCategories, type ContactService, type SiteSettings } from "@/lib/types";

export function ContactForm({ settings, initialService }: { settings: SiteSettings; initialService?: ContactService }) {
  const [service, setService] = useState<ContactService>(initialService ?? "Web Development");
  const [brief, setBrief] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [validationError, setValidationError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const hasContact = Boolean(settings.whatsapp || settings.email);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (name.length < 2 || message.length < 10) {
      setValidationError("Isi nama minimal 2 karakter dan cerita minimal 10 karakter, bukan hanya spasi.");
      return;
    }
    setValidationError("");
    setBrief(`Halo Ferry! Saya ${name}.\n\nSaya ingin ngobrol soal ${service}.\n\n${message}\n\nBoleh diskusi lebih lanjut?`);
    setCopied(false);
    setCopyError("");
    dialog.current?.showModal();
  }

  async function copy() {
    try { await navigator.clipboard.writeText(brief); setCopied(true); setCopyError(""); }
    catch { setCopyError("Belum bisa menyalin otomatis. Pilih teks brief lalu salin manual."); }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([brief], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "brief-untuk-ferry.txt"; a.click(); URL.revokeObjectURL(url);
  }

  return <>
    <form className="contact-form" onSubmit={submit}>
      <fieldset><legend>Kamu butuh bantuan apa?</legend><div className="service-choices">{serviceCategories.map(item => <label key={item} className={service === item ? "selected" : ""}><input type="radio" name="service" value={item} checked={service === item} onChange={() => setService(item)} />{item}</label>)}</div></fieldset>
      <label className="field">Nama kamu<input name="name" autoComplete="name" placeholder="Biar kita kenalan dulu" minLength={2} maxLength={80} required /></label>
      <label className="field">Ceritakan sedikit idemu<textarea name="message" placeholder="Mau bikin apa? Ada target waktu atau referensi?" rows={3} minLength={10} maxLength={2000} required /></label>
      <div className="contact-submit"><button className="button button-primary" type="submit">{hasContact ? "Lanjut ngobrol" : "Siapkan brief"}<ArrowUpRight size={19} /></button><span>Belum perlu brief yang sempurna.<br />Cerita singkat juga boleh.</span></div>
      {!hasContact && <p className="contact-note">Kontak langsung sedang disiapkan. Kamu bisa salin atau unduh brief dulu; form ini belum mengirim pesan.</p>}
      {validationError && <p className="form-message" role="alert">{validationError}</p>}
    </form>
    <dialog ref={dialog} className="brief-dialog" aria-labelledby="brief-dialog-title"><div className="dialog-heading"><div><span className="eyebrow">SATU LANGKAH LAGI</span><h2 id="brief-dialog-title">Brief kamu sudah siap.</h2></div><button className="icon-button" onClick={() => dialog.current?.close()} aria-label="Tutup brief"><X /></button></div><p className="muted">{hasContact ? "Cek pesannya, lalu kirim lewat kontak pilihanmu. Pesan belum dikirim otomatis." : "Kontak Ferry belum diaktifkan. Simpan brief ini dulu; belum ada pesan yang terkirim."}</p><pre className="brief-preview">{brief}</pre><div className="dialog-actions">{settings.whatsapp && <a className="button button-primary" href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(brief)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> Kirim via WhatsApp</a>}{settings.email && <a className="button button-outline" href={`mailto:${settings.email}?subject=${encodeURIComponent(`Diskusi ${service}`)}&body=${encodeURIComponent(brief)}`}>Kirim via email <ArrowUpRight size={17} /></a>}<button className="button button-outline" onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Brief disalin" : "Salin brief"}</button><button className="button button-quiet" onClick={download}><ArrowDownToLine size={17} /> Unduh .txt</button></div><p className="form-message" role="status">{copyError || (copied ? "Brief berhasil disalin." : "")}</p></dialog>
  </>;
}
