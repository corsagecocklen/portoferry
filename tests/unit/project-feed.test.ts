import { describe, expect, it } from "vitest";

import { demoProjects } from "@/lib/demo-data";
import { isHomeFeedCategory, selectHomeFeedProjects } from "@/lib/project-feed";
import type { Project } from "@/lib/types";

function makeProject(id: string, overrides: Partial<Project> = {}): Project {
  return {
    ...demoProjects[0],
    id,
    slug: id,
    title: id,
    category: "Web Development",
    published: true,
    featured: false,
    ...overrides,
  };
}

describe("homepage project feed", () => {
  it.each(["Web Development", "IT Consulting", "Video Editing"] as const)(
    "includes published %s projects without requiring featured",
    (category) => {
      const project = makeProject("published-project", { category });

      expect(isHomeFeedCategory(category)).toBe(true);
      expect(selectHomeFeedProjects([project])).toEqual([project]);
    },
  );

  it("shows unfeatured web work when the other published project is catalog-only", () => {
    const design = makeProject("catalog-project", { category: "Graphic Design", sort_order: 1 });
    const web = makeProject("web-project", { sort_order: 2 });

    expect(selectHomeFeedProjects([design, web])).toEqual([web]);
  });

  it("prioritizes featured work and fills remaining slots while preserving order within each group", () => {
    const first = makeProject("first");
    const second = makeProject("second", { featured: true });
    const third = makeProject("third");
    const fourth = makeProject("fourth", { featured: true });
    const projects = Object.freeze([first, second, third, fourth]);

    expect(selectHomeFeedProjects(projects)).toEqual([second, fourth, first]);
    expect(projects).toEqual([first, second, third, fourth]);
  });

  it("limits an entirely unfeatured feed to three projects in the supplied order", () => {
    const projects = Array.from({ length: 4 }, (_, index) => makeProject(`project-${index}`));

    expect(selectHomeFeedProjects(projects)).toEqual(projects.slice(0, 3));
  });

  it("keeps the first three featured projects when all slots are already curated", () => {
    const featured = Array.from({ length: 4 }, (_, index) => makeProject(`featured-${index}`, { featured: true }));

    expect(selectHomeFeedProjects([makeProject("unfeatured"), ...featured])).toEqual(featured.slice(0, 3));
  });

  it("excludes drafts before selecting or limiting the feed, even when featured", () => {
    const drafts = Array.from({ length: 3 }, (_, index) => makeProject(`draft-${index}`, { published: false, featured: index !== 0 }));
    const published = makeProject("published");

    expect(selectHomeFeedProjects([...drafts, published])).toEqual([published]);
    expect(selectHomeFeedProjects(drafts)).toEqual([]);
  });

  it.each(["Graphic Design", "AI Consulting"] as const)(
    "keeps %s in the catalog regardless of featured status",
    (category) => {
      const projects = [false, true].map((featured) => makeProject(`catalog-${featured}`, { category, featured }));

      expect(isHomeFeedCategory(category)).toBe(false);
      expect(selectHomeFeedProjects(projects)).toEqual([]);
    },
  );

  it("returns no cards when there are no projects", () => {
    expect(selectHomeFeedProjects([])).toEqual([]);
  });
});
