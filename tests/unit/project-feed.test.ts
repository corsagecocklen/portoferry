import { describe, expect, it } from "vitest";

import { demoProjects } from "@/lib/demo-data";
import { selectHomeFeedProjects } from "@/lib/project-feed";
import { categories, type Project } from "@/lib/types";

function makeProject(id: string, overrides: Partial<Project> = {}): Project {
  return {
    ...demoProjects[0],
    id,
    slug: id,
    title: id,
    category: "Web Development",
    published: true,
    ...overrides,
  };
}

describe("homepage project feed", () => {
  it.each(categories)(
    "includes published %s projects without category restrictions",
    (category) => {
      const project = makeProject("published-project", { category });

      expect(selectHomeFeedProjects([project])).toEqual([project]);
    },
  );

  it("shows both design and web projects newest first despite their catalog order", () => {
    const design = makeProject("design-project", { category: "Graphic Design", sort_order: 1, created_at: "2026-09-19T11:00:00Z" });
    const web = makeProject("web-project", { sort_order: 2, created_at: "2026-09-19T12:00:00Z" });

    expect(selectHomeFeedProjects([design, web])).toEqual([web, design]);
  });

  it("sorts by creation time without mutating the supplied project order", () => {
    const oldest = makeProject("oldest", { created_at: "2026-09-01T00:00:00Z" });
    const newest = makeProject("newest", { created_at: "2026-09-20T00:00:00Z" });
    const middle = makeProject("middle", { created_at: "2026-09-10T00:00:00Z" });
    const projects = Object.freeze([oldest, newest, middle]);

    expect(selectHomeFeedProjects(projects)).toEqual([newest, middle, oldest]);
    expect(projects).toEqual([oldest, newest, middle]);
  });

  it("includes every published project rather than limiting the feed to three cards", () => {
    const projects = Array.from({ length: 8 }, (_, index) => makeProject(`project-${index}`, {
      category: categories[index % categories.length],
      created_at: new Date(Date.UTC(2026, 8, index + 1)).toISOString(),
    }));

    expect(selectHomeFeedProjects(projects)).toEqual([...projects].reverse());
  });

  it("ignores legacy featured flags and manual catalog order", () => {
    const older = { ...makeProject("older", { sort_order: 0, created_at: "2026-09-01T00:00:00Z" }), featured: true };
    const newer = { ...makeProject("newer", { sort_order: 100, created_at: "2026-09-20T00:00:00Z" }), featured: false };

    expect(selectHomeFeedProjects([older, newer])).toEqual([newer, older]);
  });

  it("compares timestamps by their actual time rather than their timezone text", () => {
    const earlier = makeProject("earlier", { created_at: "2026-09-20T08:00:00+07:00" });
    const later = makeProject("later", { created_at: "2026-09-20T02:00:00Z" });

    expect(selectHomeFeedProjects([earlier, later])).toEqual([later, earlier]);
  });

  it("keeps equal timestamps in a stable order", () => {
    const projects = [makeProject("first"), makeProject("second")];

    expect(selectHomeFeedProjects(projects)).toEqual(projects);
  });

  it("excludes drafts in every category, including drafts newer than published work", () => {
    const drafts = categories.map((category, index) => makeProject(`draft-${index}`, { category, published: false, created_at: "2026-09-20T00:00:00Z" }));
    const published = makeProject("published", { category: "Graphic Design", created_at: "2026-09-01T00:00:00Z" });

    expect(selectHomeFeedProjects([...drafts, published])).toEqual([published]);
    expect(selectHomeFeedProjects(drafts)).toEqual([]);
  });

  it("returns no cards when there are no projects", () => {
    expect(selectHomeFeedProjects([])).toEqual([]);
  });
});
