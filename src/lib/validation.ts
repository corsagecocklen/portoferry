import { z } from "zod";

import { categories } from "./types";

const localImagePathPattern = /^\/images\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const whatsappValidationMessage =
  "Nomor belum valid. Pakai 08... atau kode negara (+62...). Panjang setelah dirapikan harus 7–15 digit.";

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

function hasValidWhatsappFormatting(value: string, hasPlus: boolean): boolean {
  let previous: "digit" | "open" | "close" | "hyphen" | null = null;
  let parentheses = 0;

  for (const character of value) {
    if (/\s/.test(character)) {
      continue;
    }

    if (/\d/.test(character)) {
      previous = "digit";
      continue;
    }

    if (character === "-") {
      if (previous !== "digit" && previous !== "close") {
        return false;
      }
      previous = "hyphen";
      continue;
    }

    if (character === "(") {
      if (parentheses > 0 || (previous !== null && previous !== "digit") || (previous === null && hasPlus)) {
        return false;
      }
      parentheses = 1;
      previous = "open";
      continue;
    }

    if (character === ")") {
      if (parentheses === 0 || previous !== "digit") {
        return false;
      }
      parentheses = 0;
      previous = "close";
      continue;
    }

    return false;
  }

  return parentheses === 0 && previous !== null && previous !== "open" && previous !== "hyphen";
}

export function normalizeWhatsapp(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed === "") {
    return "";
  }

  const hasPlus = trimmed.startsWith("+");
  const formatted = hasPlus ? trimmed.slice(1) : trimmed;

  if (!/^[0-9\s()-]+$/.test(formatted) || !hasValidWhatsappFormatting(formatted, hasPlus)) {
    return null;
  }

  const digits = formatted.replace(/[^0-9]/g, "");

  if (digits === "") {
    return null;
  }

  const international = !hasPlus && digits.startsWith("08")
    ? `62${digits.slice(1)}`
    : digits;
  // Indonesian display numbers may retain the domestic 0 after +62.
  const normalized = international.replace(/^620(?=[1-9])/, "62");

  return !normalized.startsWith("620") && /^[1-9][0-9]{6,14}$/.test(normalized) ? normalized : null;
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
    whatsapp: z.string().trim().transform((value, context) => {
      const normalized = normalizeWhatsapp(value);

      if (normalized === null) {
        context.addIssue({ code: "custom", message: whatsappValidationMessage });
        return z.NEVER;
      }

      return normalized;
    }),
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
