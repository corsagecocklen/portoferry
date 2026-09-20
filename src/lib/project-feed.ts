import type { Project } from "./types";

export function selectHomeFeedProjects(projects: readonly Project[]): Project[] {
  return projects
    .filter((project) => project.published)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
