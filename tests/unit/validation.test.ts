import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { demoProjects } from "@/lib/demo-data";
import type { ProjectInput, SiteSettings } from "@/lib/types";
import { categories } from "@/lib/types";
import { projectSchema, settingsSchema } from "@/lib/validation";

function validProject(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    slug: "portfolio-case-study",
    title: "Portfolio case study",
    category: "Web Development",
    summary: "A concise project summary.",
    description: "A longer project description for the portfolio detail page.",
    image_url: "/images/project-cover.webp",
    project_url: "",
    year: 2026,
    tags: ["Next.js", "Supabase"],
    published: true,
    is_concept: false,
    sort_order: 0,
    ...overrides,
  };
}

function validSettings(overrides: Partial<SiteSettings> = {}): SiteSettings {
  return {
    whatsapp: "12025550100",
    email: "hello@example.com",
    instagram: "https://www.instagram.com/ferry.kurniawan/",
    available: true,
    ...overrides,
  };
}

describe("projectSchema", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts every shipped demo project seed", () => {
    for (const { id, created_at, ...seed } of demoProjects) {
      expect(id).toBeTruthy();
      expect(created_at).toBeTruthy();
      expect(projectSchema.safeParse(seed), seed.slug).toMatchObject({ success: true });
    }
  });

  it("accepts every category and trims string fields", () => {
    for (const category of categories) {
      const parsed = projectSchema.safeParse(
        validProject({
          category,
          title: "  A trimmed title  ",
          tags: ["  one  ", "two"],
        }),
      );

      expect(parsed.success, category).toBe(true);
      if (parsed.success) {
        expect(parsed.data.title).toBe("A trimmed title");
        expect(parsed.data.tags).toEqual(["one", "two"]);
      }
    }
  });

  it("accepts URL-safe slugs and rejects traversal, markup, and malformed separators", () => {
    expect(projectSchema.safeParse(validProject({ slug: "web-2026-case-2" })).success).toBe(true);

    for (const slug of [
      "../secret",
      "foo/bar",
      "foo\\bar",
      "Foo-bar",
      "foo bar",
      "foo--bar",
      "<script>alert(1)</script>",
      "-starts-with-hyphen",
      "ends-with-hyphen-",
    ]) {
      expect(projectSchema.safeParse(validProject({ slug })).success, slug).toBe(false);
    }
  });

  it("accepts HTTPS project links but rejects other schemes and credentials", () => {
    for (const project_url of [
      "https://example.com/work/case-study?ref=portfolio#results",
      "https://sub.example.com:8443/work",
    ]) {
      expect(projectSchema.safeParse(validProject({ project_url })).success, project_url).toBe(true);
    }

    for (const project_url of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "ftp://example.com/file",
      "http://example.com/work",
      "//example.com/work",
      "https://user:password@example.com/work",
      "not a URL",
    ]) {
      expect(projectSchema.safeParse(validProject({ project_url })).success, project_url).toBe(false);
    }
  });

  it("allows local image paths and blocks external, query-bearing, and traversing paths", () => {
    for (const image_url of ["/images/cover.webp", "/images/work/cover-2.png", "/images/a.b/c.jpeg"]) {
      expect(projectSchema.safeParse(validProject({ image_url })).success, image_url).toBe(true);
    }

    for (const image_url of [
      "https://images.example.com/cover.webp",
      "data:image/svg+xml,<svg/onload=alert(1)>",
      "//cdn.example.com/cover.webp",
      "/uploads/cover.webp",
      "/images/../secret.webp",
      "/images/%2e%2e/secret.webp",
      "/images/cover.webp?download=1",
      "/images/cover.webp#fragment",
    ]) {
      expect(projectSchema.safeParse(validProject({ image_url })).success, image_url).toBe(false);
    }
  });

  it("only accepts permanent public project-images URLs on the configured Supabase origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ferry-demo.supabase.co");

    for (const image_url of [
      "https://ferry-demo.supabase.co/storage/v1/object/public/project-images/work/cover.webp",
    ]) {
      expect(projectSchema.safeParse(validProject({ image_url })).success, image_url).toBe(true);
    }

    for (const image_url of [
      "https://ferry-demo.supabase.co/storage/v1/object/sign/project-images/work/cover.webp?token=abc",
      "https://ferry-demo.supabase.co/storage/v1/object/public/project-images/cover.webp?token=abc",
      "https://other.supabase.co/storage/v1/object/public/project-images/cover.webp",
      "http://ferry-demo.supabase.co/storage/v1/object/public/project-images/cover.webp",
      "https://ferry-demo.supabase.co/storage/v1/object/public/other-bucket/cover.webp",
      "https://ferry-demo.supabase.co/storage/v1/object/public/project-images/%2e%2e/private.webp",
      "https://ferry-demo.supabase.co/storage/v1/object/public/project-images//cover.webp",
      "https://ferry-demo.supabase.co/storage/v1/object/public/project-images/cover.webp#fragment",
    ]) {
      expect(projectSchema.safeParse(validProject({ image_url })).success, image_url).toBe(false);
    }
  });

  it("enforces numeric, tag, and strict-object boundaries", () => {
    for (const year of [1899, 2201, 2026.5]) {
      expect(projectSchema.safeParse(validProject({ year })).success, String(year)).toBe(false);
    }
    for (const sort_order of [-1, 100_001, 1.5]) {
      expect(projectSchema.safeParse(validProject({ sort_order })).success, String(sort_order)).toBe(false);
    }

    expect(projectSchema.safeParse(validProject({ tags: ["same", "same"] })).success).toBe(false);
    expect(projectSchema.safeParse(validProject({ tags: [""] })).success).toBe(false);
    expect(projectSchema.safeParse(validProject({ tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`) })).success).toBe(false);
    expect(projectSchema.safeParse({ ...validProject(), featured: true }).success).toBe(false);

    expect(projectSchema.safeParse({ ...validProject(), unexpected: true }).success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("accepts empty optional contacts and a complete safe settings payload", () => {
    expect(settingsSchema.safeParse(validSettings()).success).toBe(true);
    expect(settingsSchema.safeParse(validSettings({ whatsapp: "", email: "", instagram: "" })).success).toBe(true);
  });

  it("normalizes local, formatted, and international WhatsApp numbers", () => {
    const cases = [
      ["0812 0000 0000", "6281200000000"],
      ["08-1200-0000-00", "6281200000000"],
      ["62 (812) 0000-0000", "6281200000000"],
      ["+62 812-0000-0000", "6281200000000"],
      ["+62 0812-0000-0000", "6281200000000"],
      ["62 (0)812-0000-0000", "6281200000000"],
      ["+1 (202) 555-0100", "12025550100"],
      ["12025550100", "12025550100"],
      ["9876543", "9876543"],
      ["123456789012345", "123456789012345"],
    ] as const;

    for (const [whatsapp, expected] of cases) {
      const parsed = settingsSchema.safeParse(validSettings({ whatsapp }));
      expect(parsed.success, whatsapp).toBe(true);
      if (parsed.success) expect(parsed.data.whatsapp).toBe(expected);
    }

    const blank = settingsSchema.safeParse(validSettings({ whatsapp: "   " }));
    expect(blank.success).toBe(true);
    if (blank.success) expect(blank.data.whatsapp).toBe("");
  });

  it("rejects malformed WhatsApp values after normalization", () => {
    for (const whatsapp of [
      "abc",
      "+62",
      "123456",
      "+1234567890123456",
      "()",
      "---",
      "62+812-0000-0000",
      "++6281200000000",
      "+62 00812-0000-0000",
      "+62 812 0000 0000 letters",
      "0812 3456 7890 123",
      "+1 202 555 0100 12345",
    ]) {
      expect(settingsSchema.safeParse(validSettings({ whatsapp })).success, whatsapp).toBe(false);
    }
  });

  it("rejects unsafe email or Instagram values", () => {

    for (const email of ["not-an-email", "person@example", "person @example.com", "javascript:alert(1)"]) {
      expect(settingsSchema.safeParse(validSettings({ email })).success, email).toBe(false);
    }

    for (const instagram of [
      "http://instagram.com/ferry",
      "https://evil.example/instagram",
      "https://user:pass@instagram.com/ferry",
      "javascript:alert(1)",
    ]) {
      expect(settingsSchema.safeParse(validSettings({ instagram })).success, instagram).toBe(false);
    }
  });

  it("rejects unknown settings keys", () => {
    expect(settingsSchema.safeParse({ ...validSettings(), role: "admin" }).success).toBe(false);
  });
});
