import type { Project, ProjectInput } from "@/lib/types";
import { projectSchema } from "@/lib/validation";
import { z } from "zod";

export type EditorResult =
  | { success: true }
  | { success: false; error: string };

export type UploadResult =
  | { success: true; url: string }
  | { success: false; error: string };

export type ProjectField = keyof ProjectInput;

export function projectToInput(project: Project): ProjectInput {
  return {
    slug: project.slug,
    title: project.title,
    category: project.category,
    summary: project.summary,
    description: project.description,
    image_url: project.image_url,
    project_url: project.project_url,
    year: project.year,
    tags: [...project.tags],
    published: project.published,
    is_concept: project.is_concept,
    sort_order: project.sort_order,
  };
}

export function createBlankProject(): ProjectInput {
  return {
    slug: "",
    title: "",
    category: "Web Development",
    summary: "",
    description: "",
    image_url: "/images/project-placeholder.svg",
    project_url: "",
    year: new Date().getFullYear(),
    tags: [],
    published: false,
    is_concept: false,
    sort_order: 0,
  };
}

export function slugify(value: string): string {
  return value
    .toLocaleLowerCase("id-ID")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export function tagsToText(tags: string[]): string {
  return tags.join(", ");
}

export function textToTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index);
}

export const demoProjectInputSchema = projectSchema.extend({
  image_url: z.string().max(1_400_000, "Gambar demo terlalu besar.").refine(
    (value) => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value) || projectSchema.shape.image_url.safeParse(value).success,
    "Gunakan gambar yang diunggah atau path /images/ yang valid.",
  ),
});

export function validateProjectInput(input: ProjectInput, mode: "live" | "demo" = "live"): Partial<Record<ProjectField, string>> {
  const parsed = (mode === "demo" ? demoProjectInputSchema : projectSchema).safeParse(input);
  const errors: Partial<Record<ProjectField, string>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as ProjectField;
      errors[field] ??= issue.message;
    }
  }
  return errors;
}
