import { afterEach, describe, expect, it, vi } from "vitest";

import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

describe("Supabase configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires both non-empty environment values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ferry.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("trims configured values before returning them", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "  https://ferry.supabase.co  ");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "  publishable-key  ");

    expect(getSupabaseConfig()).toEqual({
      url: "https://ferry.supabase.co",
      publishableKey: "publishable-key",
    });
  });

  it("throws a useful error when configuration is missing or malformed", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    expect(() => getSupabaseConfig()).toThrow("Supabase belum dikonfigurasi.");

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    expect(() => getSupabaseConfig()).toThrow("URL Supabase tidak valid.");
  });
});
