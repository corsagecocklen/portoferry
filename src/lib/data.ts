import { defaultSettings, demoProjects } from "./demo-data";
import type { Project, SiteSettings } from "./types";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

function throwBackendError(operation: string, error: unknown): never {
  if (error instanceof Error) {
    throw error;
  }

  throw new Error(`${operation} gagal mengambil data.`);
}

export async function getPublicProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) {
    return demoProjects.filter((project) => project.published);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throwBackendError("Daftar proyek", error);
  }

  return (data ?? []) as Project[];
}

export async function getProject(slug: string): Promise<Project | null> {
  if (!isSupabaseConfigured()) {
    return demoProjects.find((project) => project.published && project.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throwBackendError("Detail proyek", error);
  }

  return (data as Project | null) ?? null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) {
    return { ...defaultSettings };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("whatsapp, email, instagram, available")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throwBackendError("Pengaturan situs", error);
  }

  if (!data) {
    throw new Error("Pengaturan situs belum tersedia.");
  }

  return data as SiteSettings;
}

export async function getAdminProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) {
    return [...demoProjects];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throwBackendError("Daftar proyek admin", error);
  }

  return (data ?? []) as Project[];
}
