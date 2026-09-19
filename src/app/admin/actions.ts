"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdmin, requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { projectSchema, settingsSchema } from "@/lib/validation";
import type { ActionResult, Project, ProjectInput, SiteSettings } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid.").max(254),
  password: z.string().min(1, "Password wajib diisi.").max(256),
});

const projectIdSchema = z.string().uuid("ID proyek tidak valid.");

function failure(error: string): ActionResult {
  return { success: false, error };
}

function validationError(error: z.ZodError): ActionResult {
  return failure(error.issues[0]?.message ?? "Data tidak valid.");
}

function revalidatePublicPaths() {
  revalidatePath("/");
  revalidatePath("/proyek");
  revalidatePath("/proyek/[slug]", "page");
  revalidatePath("/layanan/[slug]", "page");
}

export async function login(email: string, password: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email, password });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (!isSupabaseConfigured()) {
    return failure("Supabase belum dikonfigurasi.");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return failure("Email atau password salah.");
    }

    const admin = await getAdmin();

    if (!admin) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Logout best effort agar akun non-admin tidak dipertahankan.
      }

      return failure("Akun ini tidak memiliki akses admin.");
    }

    return { success: true };
  } catch {
    return failure("Login gagal.");
  }
}

export async function logout(): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return failure("Supabase belum dikonfigurasi.");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return failure("Logout gagal.");
    }

    return { success: true };
  } catch {
    return failure("Logout gagal.");
  }
}

export async function saveProject(
  id: string | null,
  input: ProjectInput,
): Promise<ActionResult<Project>> {
  const parsedId = id === null ? null : projectIdSchema.safeParse(id);

  if (parsedId !== null && !parsedId.success) {
    return validationError(parsedId.error) as ActionResult<Project>;
  }

  const parsed = projectSchema.safeParse(input);

  if (!parsed.success) {
    return validationError(parsed.error) as ActionResult<Project>;
  }

  if (!isSupabaseConfigured()) {
    return failure("Supabase belum dikonfigurasi.") as ActionResult<Project>;
  }

  try {
    await requireAdmin();
    const supabase = await createClient();

    if (id === null) {
      const { data, error } = await supabase
        .from("projects")
        .insert(parsed.data)
        .select("*")
        .single();

      if (error || !data) {
        return failure(error?.code === "23505" ? "Slug sudah dipakai proyek lain. Pilih slug berbeda." : "Proyek gagal disimpan.") as ActionResult<Project>;
      }

      revalidatePublicPaths();
      return { success: true, data: data as Project };
    }

    const { data, error } = await supabase
      .from("projects")
      .update(parsed.data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return failure(error?.code === "23505" ? "Slug sudah dipakai proyek lain. Pilih slug berbeda." : "Proyek gagal disimpan.") as ActionResult<Project>;
    }

    revalidatePublicPaths();
    return { success: true, data: data as Project };
  } catch {
    return failure("Akses admin diperlukan atau proyek gagal disimpan.") as ActionResult<Project>;
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const parsedId = projectIdSchema.safeParse(id);

  if (!parsedId.success) {
    return validationError(parsedId.error);
  }

  if (!isSupabaseConfigured()) {
    return failure("Supabase belum dikonfigurasi.");
  }

  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("projects").delete().eq("id", parsedId.data);

    if (error) {
      return failure("Proyek gagal dihapus.");
    }

    revalidatePublicPaths();
    return { success: true };
  } catch {
    return failure("Akses admin diperlukan atau proyek gagal dihapus.");
  }
}

export async function saveSettings(
  input: SiteSettings,
): Promise<ActionResult<SiteSettings>> {
  const parsed = settingsSchema.safeParse(input);

  if (!parsed.success) {
    return validationError(parsed.error) as ActionResult<SiteSettings>;
  }

  if (!isSupabaseConfigured()) {
    return failure("Supabase belum dikonfigurasi.") as ActionResult<SiteSettings>;
  }

  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .upsert({ id: 1, ...parsed.data }, { onConflict: "id" })
      .select("whatsapp, email, instagram, available")
      .single();

    if (error || !data) {
      return failure("Pengaturan situs gagal disimpan.") as ActionResult<SiteSettings>;
    }

    revalidatePublicPaths();
    return { success: true, data: data as SiteSettings };
  } catch {
    return failure("Akses admin diperlukan atau pengaturan gagal disimpan.") as ActionResult<SiteSettings>;
  }
}
