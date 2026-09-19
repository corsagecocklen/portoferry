import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAdmin } from "@/lib/auth";
import { getAdminProjects, getSiteSettings } from "@/lib/data";
import Link from "next/link";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSetup } from "@/components/admin/admin-setup";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return <AdminSetup />;
  }

  const admin = await getAdmin();

  if (!admin) {
    return <AdminLogin />;
  }

  let projects;
  let settings;

  try {
    [projects, settings] = await Promise.all([getAdminProjects(), getSiteSettings()]);
  } catch {
    return (
      <main className="admin-centered-page">
        <section className="admin-message-card" aria-labelledby="admin-load-error">
          <span className="admin-kicker">PANEL ADMIN</span>
          <h1 id="admin-load-error">Data admin belum bisa dimuat.</h1>
          <p>Periksa koneksi Supabase, lalu coba muat ulang halaman ini.</p>
          <Link className="button button-primary" href="/admin">Coba lagi</Link>
        </section>
      </main>
    );
  }

  return <AdminShell mode="live" adminEmail={admin.email} initialProjects={projects} initialSettings={settings} />;
}
