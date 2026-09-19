import { beforeEach, describe, expect, it, vi } from "vitest";

import { demoProjects } from "@/lib/demo-data";
import {
  getAdminProjects,
  getProject,
  getPublicProjects,
  getSiteSettings,
} from "@/lib/data";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  isSupabaseConfigured: vi.fn(),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

type QueryResult = { data: unknown; error: unknown };

function queryFor(result: QueryResult) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
  };
  let orderCount = 0;

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockImplementation(() => {
    orderCount += 1;
    return orderCount === 2 ? Promise.resolve(result) : query;
  });
  query.maybeSingle.mockResolvedValue(result);
  return query;
}

function useQuery(result: QueryResult) {
  const query = queryFor(result);
  const from = vi.fn().mockReturnValue(query);
  mocks.createClient.mockResolvedValue({ from });
  return { query, from };
}

describe("portfolio data access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSupabaseConfigured.mockReturnValue(false);
  });

  it("filters unpublished demo projects when Supabase is unavailable", async () => {
    const projects = await getPublicProjects();

    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((project) => project.published)).toBe(true);
    expect(projects).toEqual(demoProjects.filter((project) => project.published));
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("always applies the published filter to public Supabase reads", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(true);
    const published = [demoProjects[0]];
    const { query, from } = useQuery({ data: published, error: null });

    await expect(getPublicProjects()).resolves.toEqual(published);

    expect(from).toHaveBeenCalledWith("projects");
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.eq).toHaveBeenCalledWith("published", true);
    expect(query.order).toHaveBeenNthCalledWith(1, "sort_order", { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, "created_at", { ascending: false });
  });

  it("propagates backend errors instead of silently returning an empty portfolio", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(true);
    const backendError = new Error("projects unavailable");
    useQuery({ data: null, error: backendError });

    await expect(getPublicProjects()).rejects.toBe(backendError);
  });

  it("hides draft detail pages in demo mode", async () => {
    const draft = { ...demoProjects[0], slug: "draft-only", published: false };

    // The demo branch is based on the module's seed data, so an unknown slug is not found.
    await expect(getProject(draft.slug)).resolves.toBeNull();
    await expect(getProject(demoProjects[0].slug)).resolves.toEqual(demoProjects[0]);
  });

  it("filters project details by both slug and published state", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(true);
    const project = demoProjects[0];
    const { query, from } = useQuery({ data: project, error: null });

    await expect(getProject(project.slug)).resolves.toEqual(project);

    expect(from).toHaveBeenCalledWith("projects");
    expect(query.eq).toHaveBeenNthCalledWith(1, "slug", project.slug);
    expect(query.eq).toHaveBeenNthCalledWith(2, "published", true);
    expect(query.maybeSingle).toHaveBeenCalledOnce();
  });

  it("propagates project detail errors and distinguishes a missing row", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(true);
    const backendError = new Error("detail unavailable");
    useQuery({ data: null, error: backendError });
    await expect(getProject("missing-project")).rejects.toBe(backendError);

    useQuery({ data: null, error: null });
    await expect(getProject("missing-project")).resolves.toBeNull();
  });

  it("returns configured site settings and rejects a missing settings row", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(true);
    const settings = {
      whatsapp: "6281234567890",
      email: "hello@example.com",
      instagram: "https://instagram.com/ferry",
      available: true,
    };
    const { query } = useQuery({ data: settings, error: null });

    await expect(getSiteSettings()).resolves.toEqual(settings);
    expect(query.select).toHaveBeenCalledWith("whatsapp, email, instagram, available");
    expect(query.eq).toHaveBeenCalledWith("id", 1);
    expect(query.maybeSingle).toHaveBeenCalledOnce();

    useQuery({ data: null, error: null });
    await expect(getSiteSettings()).rejects.toThrow("Pengaturan situs belum tersedia.");
  });

  it("returns defaults offline and exposes drafts only through the admin read", async () => {
    const defaults = await getSiteSettings();
    expect(defaults).toEqual({ whatsapp: "", email: "", instagram: "", available: true });

    mocks.isSupabaseConfigured.mockReturnValue(true);
    const rows = [demoProjects[0], { ...demoProjects[1], published: false }];
    const { query, from } = useQuery({ data: rows, error: null });
    await expect(getAdminProjects()).resolves.toEqual(rows);

    expect(from).toHaveBeenCalledWith("projects");
    expect(query.eq).not.toHaveBeenCalledWith("published", true);
    expect(query.order).toHaveBeenNthCalledWith(1, "sort_order", { ascending: true });
  });
});
