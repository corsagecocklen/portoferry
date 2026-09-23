import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultSettings, demoProjects } from "@/lib/demo-data";
import { demoProjectInputSchema, projectToInput } from "@/components/admin/admin-types";
import { readDemoSnapshot, writeDemoSnapshot } from "@/components/admin/admin-demo-storage";
import type { Project, ProjectBodyImage, ProjectInput } from "@/lib/types";
import { projectSchema } from "@/lib/validation";

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

function payload(overrides: Record<string, unknown> = {}) {
  return { ...validProject(), ...overrides };
}

function bodyImage(index: number, overrides: Partial<ProjectBodyImage> = {}): ProjectBodyImage {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    url: `/images/body-${index}.webp`,
    alt: `Body image ${index}`,
    caption: `Caption ${index}`,
    after_paragraph: index,
    ...overrides,
  };
}

function installDemoStorage() {
  const values = new Map<string, string>();
  const getItem = vi.fn((key: string) => values.get(key) ?? null);
  const setItem = vi.fn((key: string, value: string) => values.set(key, value));
  vi.stubGlobal("window", { localStorage: { getItem, setItem } });
  return { getItem, setItem };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("post media validation", () => {
  it("accepts legacy payloads without adding optional media fields", () => {
    const parsed = projectSchema.safeParse(validProject());

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("body_images");
      expect(parsed.data).not.toHaveProperty("thumbnail_crop");
    }

    const input = projectToInput(demoProjects[0]);
    expect(input).not.toHaveProperty("body_images");
    expect(input).not.toHaveProperty("thumbnail_crop");

    installDemoStorage();
    expect(writeDemoSnapshot([demoProjects[0]], defaultSettings)).toBe(true);
    const snapshot = readDemoSnapshot([], defaultSettings);
    expect(snapshot.projects[0]).not.toHaveProperty("body_images");
    expect(snapshot.projects[0]).not.toHaveProperty("thumbnail_crop");
  });

  it("accepts three live body images and an adjustable thumbnail crop", () => {
    const media = [bodyImage(1), bodyImage(2), bodyImage(3)];
    const crop = { x: 0, y: 100, zoom: 3 };

    expect(projectSchema.safeParse(payload({ body_images: media, thumbnail_crop: crop })).success).toBe(true);
    expect(projectSchema.safeParse(payload({
      body_images: [bodyImage(1)],
      thumbnail_crop: { x: 100, y: 0, zoom: 1 },
    })).success).toBe(true);
  });

  it("accepts only local or configured public Supabase image URLs for live posts", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://media-fixture.supabase.co");

    const allowedUrls = [
      "/images/body/cover.webp",
      "https://media-fixture.supabase.co/storage/v1/object/public/project-images/body/cover.webp",
    ];
    for (const url of allowedUrls) {
      expect(projectSchema.safeParse(payload({ body_images: [bodyImage(1, { url })] })).success, url).toBe(true);
    }

    const rejectedUrls = [
      "https://images.example.com/cover.webp",
      "https://other.supabase.co/storage/v1/object/public/project-images/cover.webp",
      "https://media-fixture.supabase.co/storage/v1/object/sign/project-images/cover.webp?token=secret",
      "https://media-fixture.supabase.co/storage/v1/object/public/project-images/cover.webp?token=secret",
      "https://media-fixture.supabase.co/storage/v1/object/public/other-bucket/cover.webp",
      "data:image/svg+xml,<svg/onload=alert(1)>",
      "data:image/svg+xml;base64,PHN2Zz4=",
      "javascript:alert(1)",
      "//images.example.com/cover.webp",
      "/uploads/cover.webp",
      "/images/../private.webp",
      "/images/%2e%2e/private.webp",
      "/images/cover.webp?download=1",
    ];
    for (const url of rejectedUrls) {
      expect(projectSchema.safeParse(payload({ body_images: [bodyImage(1, { url })] })).success, url).toBe(false);
    }
  });

  it("allows bounded JPEG, PNG, and WebP data URLs only in demo storage", () => {
    const demoImages = [
      bodyImage(1, { url: "data:image/jpeg;base64,/9j/2Q==" }),
      bodyImage(2, { url: "data:image/png;base64,iVBORw0KGgo=" }),
      bodyImage(3, { url: "data:image/webp;base64,UklGRg==" }),
    ];
    const input = payload({ body_images: demoImages });

    expect(demoProjectInputSchema.safeParse(input).success).toBe(true);
    expect(projectSchema.safeParse(input).success).toBe(false);

    for (const url of [
      "data:image/svg+xml;base64,PHN2Zz4=",
      "data:text/html;base64,PGh0bWw+",
      "data:image/jpeg;base64,not+base64?",
      `data:image/jpeg;base64,${"A".repeat(1_400_001)}`,
    ]) {
      expect(demoProjectInputSchema.safeParse(payload({ body_images: [bodyImage(1, { url })] })).success, url.slice(0, 64)).toBe(false);
    }
  });

  it("rejects crop ranges, non-finite values, missing values, and extra keys", () => {
    const invalidCrops: unknown[] = [
      { x: -0.01, y: 50, zoom: 1 },
      { x: 100.01, y: 50, zoom: 1 },
      { x: 50, y: -0.01, zoom: 1 },
      { x: 50, y: 100.01, zoom: 1 },
      { x: 50, y: 50, zoom: 0.99 },
      { x: 50, y: 50, zoom: 3.01 },
      { x: Number.NaN, y: 50, zoom: 1 },
      { x: Number.POSITIVE_INFINITY, y: 50, zoom: 1 },
      { x: 50, y: Number.NEGATIVE_INFINITY, zoom: 1 },
      { x: 50, y: 50, zoom: Number.POSITIVE_INFINITY },
      { x: 50, y: 50 },
      { x: 50, y: 50, zoom: 1, rotation: 0 },
    ];

    for (const thumbnail_crop of invalidCrops) {
      expect(projectSchema.safeParse(payload({ thumbnail_crop })).success, JSON.stringify(thumbnail_crop)).toBe(false);
    }
  });

  it("rejects blank or oversized metadata, repeated IDs, invalid positions, and more than six images", () => {
    const invalidImageSets: Array<{ name: string; images: unknown }> = [
      { name: "blank alt", images: [bodyImage(1, { alt: " \n " })] },
      { name: "oversized alt", images: [bodyImage(1, { alt: "a".repeat(301) })] },
      { name: "oversized caption", images: [bodyImage(1, { caption: "c".repeat(301) })] },
      { name: "duplicate IDs", images: [bodyImage(1), bodyImage(2, { id: bodyImage(1).id })] },
      { name: "negative position", images: [bodyImage(1, { after_paragraph: -1 })] },
      { name: "fractional position", images: [bodyImage(1, { after_paragraph: 1.5 })] },
      { name: "position overflow", images: [bodyImage(1, { after_paragraph: 10_001 })] },
      { name: "extra image property", images: [{ ...bodyImage(1), tracking: true }] },
      { name: "too many images", images: Array.from({ length: 7 }, (_, index) => bodyImage(index + 1)) },
    ];

    for (const { name, images } of invalidImageSets) {
      expect(projectSchema.safeParse(payload({ body_images: images })).success, name).toBe(false);
    }
  });

  it("clones nested media for the editor and preserves explicit clear values", () => {
    const original: Project = {
      ...demoProjects[0],
      body_images: [bodyImage(1), bodyImage(2), bodyImage(3)],
      thumbnail_crop: { x: 40, y: 60, zoom: 1.5 },
    };
    const input = projectToInput(original);

    expect(input.body_images).toEqual(original.body_images);
    expect(input.body_images).not.toBe(original.body_images);
    expect(input.body_images?.[0]).not.toBe(original.body_images?.[0]);
    expect(input.thumbnail_crop).toEqual(original.thumbnail_crop);
    expect(input.thumbnail_crop).not.toBe(original.thumbnail_crop);

    if (input.body_images && input.thumbnail_crop) {
      input.body_images[0].caption = "Edited copy";
      input.thumbnail_crop.x = 10;
    }
    expect(original.body_images?.[0].caption).toBe("Caption 1");
    expect(original.thumbnail_crop?.x).toBe(40);

    const cleared = projectToInput({ ...demoProjects[0], body_images: [], thumbnail_crop: null });
    expect(cleared.body_images).toEqual([]);
    expect(cleared.thumbnail_crop).toBeNull();
  });

  it("round-trips three demo body images and thumbnail crop through storage", () => {
    installDemoStorage();
    const project: Project = {
      ...demoProjects[0],
      body_images: [
        bodyImage(1, { url: "data:image/jpeg;base64,/9j/2Q==" }),
        bodyImage(2, { url: "data:image/png;base64,iVBORw0KGgo=" }),
        bodyImage(3, { url: "data:image/webp;base64,UklGRg==" }),
      ],
      thumbnail_crop: { x: 37.5, y: 62, zoom: 1.8 },
    };

    expect(writeDemoSnapshot([project], defaultSettings)).toBe(true);
    const snapshot = readDemoSnapshot([], defaultSettings);

    expect(snapshot.projects).toEqual([project]);
    expect(snapshot.projects[0].body_images).toHaveLength(3);
    expect(snapshot.projects[0].thumbnail_crop).toEqual(project.thumbnail_crop);
  });
});
