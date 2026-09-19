import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

export async function getAdmin(): Promise<{ email: string } | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return null;
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

    if (adminError || isAdmin !== true) {
      return null;
    }

    return { email: user.email };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<{ email: string }> {
  const admin = await getAdmin();

  if (!admin) {
    throw new Error("Akses admin diperlukan.");
  }

  return admin;
}
