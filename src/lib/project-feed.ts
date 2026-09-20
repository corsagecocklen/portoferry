import type { Category, Project } from "./types";

const homeFeedCategories = new Set<Category>([
  "Web Development",
  "IT Consulting",
  "Video Editing",
]);

export function isHomeFeedCategory(category: Category): boolean {
  return homeFeedCategories.has(category);
}

export function selectHomeFeedProjects(projects: readonly Project[]): Project[] {
  const eligible = projects.filter(
    (project) => project.published && isHomeFeedCategory(project.category),
  );

  return [
    ...eligible.filter((project) => project.featured),
    ...eligible.filter((project) => !project.featured),
  ].slice(0, 3);
}
