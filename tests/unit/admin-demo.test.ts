import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSettings, demoProjects } from "@/lib/demo-data";
import { projectToInput, slugify, textToTags, validateProjectInput } from "@/components/admin/admin-types";
import { readDemoSnapshot, writeDemoSnapshot } from "@/components/admin/admin-demo-storage";
import { settingsSchema } from "@/lib/validation";

afterEach(() => vi.unstubAllGlobals());

describe("admin project helpers", () => {
  it("preserves a valid slug after length truncation", () => {
    const slug = slugify(`${"a".repeat(79)} a`);
    expect(slug).toBe("a".repeat(79));
    expect(slugify("Kopi, Kode & Cerita!")).toBe("kopi-kode-cerita");
  });

  it("normalizes comma-separated tags", () => {
    expect(textToTags("Next.js, React, Next.js, , ")).toEqual(["Next.js", "React"]);
  });

  it("does not carry the legacy featured field into editor input", () => {
    const legacyProject = { ...demoProjects[0], featured: true };

    expect(projectToInput(legacyProject)).not.toHaveProperty("featured");
  });

  it("accepts uploaded demo images larger than a URL, but never in live mode", () => {
    const input = { ...projectToInput(demoProjects[0]), image_url: `data:image/jpeg;base64,${"A".repeat(8000)}` };
    expect(validateProjectInput(input, "demo")).toEqual({});
    expect(validateProjectInput(input, "live").image_url).toBeDefined();
  });

  it("rejects executable and oversized demo images", () => {
    const input = projectToInput(demoProjects[0]);
    expect(validateProjectInput({ ...input, image_url: "data:image/svg+xml;base64,PHN2Zz4=" }, "demo").image_url).toBeDefined();
    expect(validateProjectInput({ ...input, image_url: `data:image/jpeg;base64,${"A".repeat(1_400_000)}` }, "demo").image_url).toBeDefined();
  });
});

describe("atomic demo persistence", () => {
  function storage(initial = new Map<string, string>()) {
    const getItem = vi.fn((key: string) => initial.get(key) ?? null);
    const setItem = vi.fn((key: string, value: string) => { initial.set(key, value); });
    vi.stubGlobal("window", { localStorage: { getItem, setItem } });
    return { getItem, setItem };
  }

  it("writes projects and settings as a single atomic snapshot", () => {
    const { setItem } = storage();
    expect(writeDemoSnapshot(demoProjects, defaultSettings)).toBe(true);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(readDemoSnapshot([], defaultSettings).projects).toEqual(demoProjects);
  });

  it("keeps normalized settings when the demo snapshot is reloaded", () => {
    const { setItem } = storage();
    const settings = settingsSchema.parse({
      ...defaultSettings,
      whatsapp: "0812 0000 0000",
    });

    expect(writeDemoSnapshot(demoProjects, settings)).toBe(true);
    expect(JSON.parse(setItem.mock.calls[0][1]).settings.whatsapp).toBe("6281200000000");
    expect(readDemoSnapshot([], defaultSettings).settings.whatsapp).toBe("6281200000000");
  });

  it("keeps an intentionally empty catalog empty", () => {
    storage();
    writeDemoSnapshot([], defaultSettings);
    expect(readDemoSnapshot(demoProjects, defaultSettings).projects).toEqual([]);
  });

  it("loads older demo records while ignoring the legacy featured property", () => {
    const { getItem } = storage();
    const legacyProjects = demoProjects.map((project) => ({ ...project, featured: true }));
    getItem.mockReturnValue(JSON.stringify({ projects: legacyProjects, settings: defaultSettings }));

    const snapshot = readDemoSnapshot([], defaultSettings);

    expect(snapshot.projects).toEqual(demoProjects);
    expect(snapshot.projects[0]).not.toHaveProperty("featured");
  });

  it("recovers from corrupt or structurally invalid storage", () => {
    const { getItem } = storage();
    for (const corrupt of ["not json", JSON.stringify({ projects: [{ title: "broken" }], settings: {} })]) {
      getItem.mockReturnValue(corrupt);
      expect(readDemoSnapshot(demoProjects, defaultSettings)).toEqual({ projects: demoProjects, settings: defaultSettings });
    }
  });

  it("reports quota failures rather than claiming to save", () => {
    const { setItem } = storage();
    setItem.mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(writeDemoSnapshot(demoProjects, defaultSettings)).toBe(false);
  });
});
