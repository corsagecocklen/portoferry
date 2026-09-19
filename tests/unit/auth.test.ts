import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAdmin, requireAdmin } from "@/lib/auth";

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

function useAuthClient(options: {
  user?: { email?: string } | null;
  userError?: Error | null;
  admin?: boolean;
  adminError?: Error | null;
} = {}) {
  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: options.user === undefined ? { email: "admin@example.com" } : options.user },
      error: options.userError ?? null,
    }),
  };
  const rpc = vi.fn().mockResolvedValue({
    data: options.admin ?? true,
    error: options.adminError ?? null,
  });
  const client = { auth, rpc };
  mocks.createClient.mockResolvedValue(client);
  return { auth, rpc };
}

describe("admin authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSupabaseConfigured.mockReturnValue(true);
  });

  it("denies authentication when Supabase is not configured", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(false);

    await expect(getAdmin()).resolves.toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("requires a user email before checking the admin allowlist", async () => {
    const { auth, rpc } = useAuthClient({ user: null });

    await expect(getAdmin()).resolves.toBeNull();
    expect(auth.getUser).toHaveBeenCalledOnce();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns the authenticated email only when the is_admin RPC allows it", async () => {
    const { auth, rpc } = useAuthClient({ user: { email: "ferry@example.com" }, admin: true });

    await expect(getAdmin()).resolves.toEqual({ email: "ferry@example.com" });
    expect(auth.getUser).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("is_admin");
  });

  it("denies non-admin RPC results and RPC errors", async () => {
    useAuthClient({ admin: false });
    await expect(getAdmin()).resolves.toBeNull();

    useAuthClient({ admin: true, adminError: new Error("RPC unavailable") });
    await expect(getAdmin()).resolves.toBeNull();
  });

  it("fails closed when the client or auth call throws", async () => {
    mocks.createClient.mockRejectedValue(new Error("cookie store unavailable"));
    await expect(getAdmin()).resolves.toBeNull();

    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockRejectedValue(new Error("session unavailable")) },
    });
    await expect(getAdmin()).resolves.toBeNull();
  });

  it("returns the allowlisted admin from requireAdmin", async () => {
    useAuthClient({ user: { email: "ferry@example.com" }, admin: true });

    await expect(requireAdmin()).resolves.toEqual({ email: "ferry@example.com" });
  });

  it("throws when requireAdmin cannot establish an allowlisted admin", async () => {
    useAuthClient({ user: { email: "visitor@example.com" }, admin: false });

    await expect(requireAdmin()).rejects.toThrow("Akses admin diperlukan.");
  });
});
