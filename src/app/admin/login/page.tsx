import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminSetup } from "@/components/admin/admin-setup";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!isSupabaseConfigured()) {
    return <AdminSetup />;
  }

  const admin = await getAdmin();

  if (admin) {
    return (
      <main className="admin-centered-page">
        <section className="admin-message-card" aria-labelledby="already-signed-in">
          <span className="admin-kicker">PANEL ADMIN</span>
          <h1 id="already-signed-in">Kamu sudah masuk.</h1>
          <p>Panel siap mengelola proyek sebagai {admin.email}.</p>
          <a className="button button-primary" href="/admin">Buka panel</a>
        </section>
      </main>
    );
  }

  return <AdminLogin />;
}
