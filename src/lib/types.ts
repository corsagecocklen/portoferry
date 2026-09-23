export const serviceCategories = [
  "Web Development",
  "IT Consulting",
  "Video Editing",
  "Graphic Design",
  "AI Consulting",
] as const;

export const categories = [...serviceCategories, "Artikel"] as const;

export type ContactService = (typeof serviceCategories)[number];
export type Category = (typeof categories)[number];

export type ThumbnailCrop = { x: number; y: number; zoom: number };

export type ProjectBodyImage = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  after_paragraph: number;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  summary: string;
  description: string;
  image_url: string;
  body_images?: ProjectBodyImage[];
  thumbnail_crop?: ThumbnailCrop | null;
  project_url: string;
  year: number;
  tags: string[];
  published: boolean;
  is_concept: boolean;
  sort_order: number;
  created_at: string;
};

export type ProjectInput = Omit<Project, "id" | "created_at">;

export type SiteSettings = {
  whatsapp: string;
  email: string;
  instagram: string;
  available: boolean;
};

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };
