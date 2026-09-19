import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { defaultSettings, demoProjects } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default function AdminDemoPage() {
  if (isSupabaseConfigured()) {
    notFound();
  }

  return <AdminShell mode="demo" initialProjects={demoProjects} initialSettings={defaultSettings} />;
}
