import { z } from "zod";

import { categories } from "./types";

const localImagePathPattern = /^\/images\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const whatsappPattern = /^[1-9][0-9]{6,14}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isLocalImagePath(value: string): boolean {
  if (
    !localImagePathPattern.test(value) ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#")
  ) {
    return false;
  }

  return value
    .slice("/images/".length)
    .split("/")
    .every((segment) => segment !== "." && segment !== "..");
}

function isSupabaseProjectImageUrl(value: string): boolean {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!configuredUrl) {
    return false;
  }

  try {
    const configured = new URL(configuredUrl);
    const candidate = new URL(value);
    const decodedPath = decodeURIComponent(candidate.pathname);
    const allowedPrefixes = [
      "/storage/v1/object/public/project-images/",
    ];

    return (
      configured.protocol === "https:" &&
      candidate.protocol === "https:" &&
      candidate.origin === configured.origin &&
      !candidate.username &&
      !candidate.password &&
      !candidate.hash &&
      !candidate.search &&
      allowedPrefixes.some(
        (prefix) =>
          decodedPath.startsWith(prefix) &&
          decodedPath.slice(prefix.length).length > 0 &&
          !decodedPath.slice(prefix.length).startsWith("/"),
      ) &&
      !decodedPath.includes("..")
    );
  } catch {
    return false;
  }
}

function isAllowedImageUrl(value: string): boolean {
  return isLocalImagePath(value) || isSupabaseProjectImageUrl(value);
}

function isSafeProjectUrl(value: string): boolean {
  if (value === "") {
    return true;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function isSafeWhatsapp(value: string): boolean {
  return value === "" || whatsappPattern.test(value);
}

function isSafeInstagram(value: string): boolean {
  if (value === "") {
    return true;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "instagram.com" || url.hostname === "www.instagram.com") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export const projectSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1, "Slug wajib diisi.")
      .max(80, "Slug maksimal 80 karakter.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."),
    title: z.string().trim().min(1, "Judul wajib diisi.").max(120, "Judul maksimal 120 karakter."),
    category: z.enum(categories),
    summary: z.string().trim().min(1, "Ringkasan wajib diisi.").max(300, "Ringkasan maksimal 300 karakter."),
    description: z
      .string()
      .trim()
      .min(1, "Deskripsi wajib diisi.")
      .max(10_000, "Deskripsi maksimal 10.000 karakter."),
    image_url: z
      .string()
      .trim()
      .min(1, "Gambar wajib diisi.")
      .max(2_048, "URL gambar maksimal 2.048 karakter.")
      .refine(isAllowedImageUrl, "Gambar hanya boleh berasal dari /images/ atau bucket Supabase project-images."),
    project_url: z
      .string()
      .trim()
      .max(2_048, "URL proyek maksimal 2.048 karakter.")
      .refine(isSafeProjectUrl, "URL proyek harus memakai https."),
    year: z.number().int("Tahun harus berupa angka bulat.").min(1900).max(2200),
    tags: z
      .array(z.string().trim().min(1, "Tag tidak boleh kosong.").max(32, "Tag maksimal 32 karakter."))
      .max(20, "Maksimal 20 tag.")
      .refine((tags) => new Set(tags).size === tags.length, "Tag tidak boleh duplikat."),
    featured: z.boolean(),
    published: z.boolean(),
    is_concept: z.boolean(),
    sort_order: z.number().int("Urutan harus berupa angka bulat.").min(0).max(100_000),
  })
  .strict();

export const settingsSchema = z
  .object({
    whatsapp: z
      .string()
      .trim()
      .max(15, "Nomor WhatsApp maksimal 15 digit.")
      .refine(isSafeWhatsapp, "Gunakan 7–15 digit internasional tanpa +, spasi, atau awalan 0."),
    email: z
      .string()
      .trim()
      .max(254, "Email maksimal 254 karakter.")
      .refine((value) => value === "" || emailPattern.test(value), "Email tidak valid."),
    instagram: z
      .string()
      .trim()
      .max(2_048, "Instagram maksimal 2.048 karakter.")
      .refine(isSafeInstagram, "Instagram harus berupa URL Instagram HTTPS yang aman."),
    available: z.boolean(),
  })
  .strict();
