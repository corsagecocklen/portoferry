import Link from "next/link";

import { Logo } from "@/components/logo";

export function AdminSetup() {
  return (
    <main className="admin-centered-page">
      <section className="admin-message-card admin-setup-card" aria-labelledby="setup-title">
        <div className="admin-message-brand"><Logo /></div>
        <span className="admin-kicker">PANEL ADMIN</span>
        <h1 id="setup-title">Admin live belum terhubung.</h1>
        <p>
          Supabase belum dikonfigurasi di environment aplikasi ini. Sambungkan Supabase untuk
          login admin dan mengubah proyek yang tampil di situs publik.
        </p>
        <div className="admin-setup-checklist" aria-label="Yang perlu disiapkan">
          <span><code>NEXT_PUBLIC_SUPABASE_URL</code></span>
          <span><code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code></span>
        </div>
        <div className="admin-message-actions">
          <Link className="button button-primary" href="/admin/demo">Coba mode demo</Link>
          <Link className="button button-outline" href="/">Kembali ke situs</Link>
        </div>
        <p className="admin-demo-disclaimer">
          Mode demo hanya tersimpan di browser ini. Demo tidak aman untuk data produksi dan tidak
          mengubah situs publik.
        </p>
      </section>
    </main>
  );
}
