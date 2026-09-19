import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteProject,
  login,
  logout,
  saveProject,
  saveSettings,
} from "@/app/admin/actions";
import type { Project, ProjectInput, SiteSettings } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getAdmin: vi.fn(),
  isSupabaseConfigured: vi.fn(),
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));
vi.mock("@/lib/auth", () => ({
  getAdmin: mocks.getAdmin,
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

const projectInput: ProjectInput = {
  slug: "portfolio-case-study",
  title: "Portfolio case study",
  category: "Web Development",
  summary: "A concise project summary.",
  description: "A longer project description for the portfolio detail page.",
  image_url: "/images/project-cover.webp",
  project_url: "https://example.com/work",
  year: 2026,
  tags: ["Next.js", "Supabase"],
  featured: true,
  published: true,
  is_concept: false,
  sort_order: 0,
};

const settingsInput: SiteSettings = {
  whatsapp: "12025550100",
  email: "hello@example.com",
  instagram: "https://www.instagram.com/ferry.kurniawan/",
  available: true,
};

function savedProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "4d3c745a-7711-4000-8000-000000000099",
    created_at: "2026-09-19T06:00:00Z",
    ...projectInput,
    ...overrides,
  };
}

function useAuthClient(auth: Record<string, unknown>) {
  const client = { auth };
  mocks.createClient.mockResolvedValue(client);
  return client;
}

describe("admin server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getAdmin.mockResolvedValue({ email: "ferry@example.com" });
    mocks.requireAdmin.mockResolvedValue({ email: "ferry@example.com" });
  });

  it("rejects invalid login input before touching Supabase", async () => {
    await expect(login("not-an-email", "")).resolves.toEqual({ success: false, error: "Email tidak valid." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("denies login and logout while Supabase is unconfigured", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(false);

    await expect(login("ferry@example.com", "secret")).resolves.toEqual({
      success: false,
      error: "Supabase belum dikonfigurasi.",
    });
    await expect(logout()).resolves.toEqual({
      success: false,
      error: "Supabase belum dikonfigurasi.",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("logs in an allowlisted user and signs out a non-admin", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    useAuthClient({ signInWithPassword, signOut });
    mocks.getAdmin.mockResolvedValueOnce({ email: "ferry@example.com" });

    await expect(login(" ferry@example.com ", "secret")).resolves.toEqual({ success: true });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "ferry@example.com", password: "secret" });

    const rejectedSignIn = vi.fn().mockResolvedValue({ error: null });
    const rejectedSignOut = vi.fn().mockResolvedValue({ error: null });
    useAuthClient({ signInWithPassword: rejectedSignIn, signOut: rejectedSignOut });
    mocks.getAdmin.mockResolvedValueOnce(null);

    await expect(login("visitor@example.com", "secret")).resolves.toEqual({
      success: false,
      error: "Akun ini tidak memiliki akses admin.",
    });
    expect(rejectedSignOut).toHaveBeenCalledOnce();
  });

  it("returns generic login and logout failures for auth errors", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: new Error("invalid credentials") });
    const signOut = vi.fn().mockResolvedValue({ error: new Error("signout failed") });
    useAuthClient({ signInWithPassword, signOut });

    await expect(login("ferry@example.com", "secret")).resolves.toEqual({
      success: false,
      error: "Email atau password salah.",
    });
    await expect(logout()).resolves.toEqual({ success: false, error: "Logout gagal." });
  });

  it("requires admin authorization before creating a project or opening a client", async () => {
    const invalidId = await saveProject("not-a-uuid", projectInput);
    expect(invalidId).toEqual({ success: false, error: "ID proyek tidak valid." });
    expect(mocks.requireAdmin).not.toHaveBeenCalled();

    mocks.isSupabaseConfigured.mockReturnValue(false);
    await expect(saveProject(null, projectInput)).resolves.toEqual({
      success: false,
      error: "Supabase belum dikonfigurasi.",
    });
    expect(mocks.requireAdmin).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();

    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.requireAdmin.mockRejectedValueOnce(new Error("not admin"));
    await expect(saveProject(null, projectInput)).resolves.toEqual({
      success: false,
      error: "Akses admin diperlukan atau proyek gagal disimpan.",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("validates project payloads before authorization", async () => {
    const result = await saveProject(null, { ...projectInput, slug: "../escape" });

    expect(result).toEqual({
      success: false,
      error: "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.",
    });
    expect(mocks.requireAdmin).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("inserts a project only after requireAdmin and revalidates public paths", async () => {
    const chain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: savedProject(), error: null }),
    };
    chain.insert.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    const from = vi.fn().mockReturnValue(chain);
    mocks.createClient.mockResolvedValue({ from });

    const result = await saveProject(null, projectInput);

    expect(result).toEqual({ success: true, data: savedProject() });
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(from).toHaveBeenCalledWith("projects");
    expect(chain.insert).toHaveBeenCalledWith(projectInput);
    expect(chain.select).toHaveBeenCalledWith("*");
    expect(chain.single).toHaveBeenCalledOnce();
    expect(mocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(mocks.createClient.mock.invocationCallOrder[0]);
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/proyek");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(3, "/proyek/[slug]", "page");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(4, "/layanan/[slug]", "page");
  });

  it("updates a project by UUID and does not revalidate after a database failure", async () => {
    const id = "4d3c745a-7711-4000-8000-000000000001";
    const chain = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: savedProject({ id }), error: null }),
    };
    chain.update.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(chain) });

    await expect(saveProject(id, projectInput)).resolves.toEqual({ success: true, data: savedProject({ id }) });
    expect(chain.update).toHaveBeenCalledWith(projectInput);
    expect(chain.eq).toHaveBeenCalledWith("id", id);

    const failedChain = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("write failed") }),
    };
    failedChain.update.mockReturnValue(failedChain);
    failedChain.eq.mockReturnValue(failedChain);
    failedChain.select.mockReturnValue(failedChain);
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(failedChain) });
    mocks.revalidatePath.mockClear();

    await expect(saveProject(id, projectInput)).resolves.toEqual({
      success: false,
      error: "Proyek gagal disimpan.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("deletes only a valid UUID after admin authorization", async () => {
    await expect(deleteProject("not-a-uuid")).resolves.toEqual({
      success: false,
      error: "ID proyek tidak valid.",
    });
    expect(mocks.requireAdmin).not.toHaveBeenCalled();

    const id = "4d3c745a-7711-4000-8000-000000000001";
    const chain = { delete: vi.fn(), eq: vi.fn() };
    chain.delete.mockReturnValue(chain);
    chain.eq.mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(chain) });

    await expect(deleteProject(id)).resolves.toEqual({ success: true });
    expect(chain.delete).toHaveBeenCalledOnce();
    expect(chain.eq).toHaveBeenCalledWith("id", id);
  });

  it("returns deletion failures without invalidating public pages", async () => {
    const chain = { delete: vi.fn(), eq: vi.fn() };
    chain.delete.mockReturnValue(chain);
    chain.eq.mockResolvedValue({ error: new Error("delete failed") });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(chain) });

    await expect(deleteProject("4d3c745a-7711-4000-8000-000000000001")).resolves.toEqual({
      success: false,
      error: "Proyek gagal dihapus.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("upserts settings after authorization and returns the selected row", async () => {
    const formattedSettings = { ...settingsInput, whatsapp: "+1 (202) 555-0100" };
    const chain = {
      upsert: vi.fn(),
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: settingsInput, error: null }),
    };
    chain.upsert.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(chain) });

    await expect(saveSettings(formattedSettings)).resolves.toEqual({ success: true, data: settingsInput });
    expect(chain.upsert).toHaveBeenCalledWith({ id: 1, ...settingsInput }, { onConflict: "id" });
    expect(chain.select).toHaveBeenCalledWith("whatsapp, email, instagram, available");
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(4);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/layanan/[slug]", "page");
  });

  it("validates settings and denies unconfigured settings writes", async () => {
    await expect(saveSettings({ ...settingsInput, whatsapp: "not-a-number" })).resolves.toEqual({
      success: false,
      error: "Nomor belum valid. Pakai 08... atau kode negara (+62...). Panjang setelah dirapikan harus 7–15 digit.",
    });
    expect(mocks.requireAdmin).not.toHaveBeenCalled();

    mocks.isSupabaseConfigured.mockReturnValue(false);
    await expect(saveSettings(settingsInput)).resolves.toEqual({
      success: false,
      error: "Supabase belum dikonfigurasi.",
    });
    expect(mocks.requireAdmin).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("keeps settings writes behind admin authorization", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("not admin"));

    await expect(saveSettings(settingsInput)).resolves.toEqual({
      success: false,
      error: "Akses admin diperlukan atau pengaturan gagal disimpan.",
    });
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
