import type { Project, SiteSettings } from "@/lib/types";
import { settingsSchema } from "@/lib/validation";
import { z } from "zod";
import { demoProjectInputSchema } from "./admin-types";

const snapshotKey = "portoferry-admin-demo-v1";
const maxDemoImageBytes = 1_000_000;
const snapshotSchema = z.object({
  projects: z.array(demoProjectInputSchema.extend({ id: z.string().min(1).max(100), created_at: z.iso.datetime() })).max(100),
  settings: settingsSchema,
});

export function readDemoSnapshot(fallbackProjects: Project[], fallbackSettings: SiteSettings) {
  if (typeof window === "undefined") {
    return { projects: fallbackProjects, settings: fallbackSettings };
  }

  try {
    const stored = window.localStorage.getItem(snapshotKey);
    const parsed = snapshotSchema.safeParse(stored ? JSON.parse(stored) : null);
    return parsed.success ? parsed.data : { projects: fallbackProjects, settings: fallbackSettings };
  } catch {
    return { projects: fallbackProjects, settings: fallbackSettings };
  }
}

export function writeDemoSnapshot(projects: Project[], settings: SiteSettings): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(snapshotKey, JSON.stringify({ projects, settings }));
    return true;
  } catch {
    return false;
  }
}

function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Gambar tidak dapat dibaca."));
    reader.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).then((bitmap) => ({ source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }));
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ source: image, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak dapat dibaca."));
    };
    image.src = url;
  });
}

export async function downscaleDemoImage(file: File): Promise<string> {
  const image = await loadImage(file);
  const maxDimension = 1800;
  let scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  let quality = 0.86;

  try {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Browser tidak mendukung pemrosesan gambar.");

      context.drawImage(image.source, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

      if (!blob) throw new Error("Gambar tidak dapat diproses.");
      if (blob.size <= maxDemoImageBytes) return fileToDataUrl(blob);

      if (quality > 0.5) quality -= 0.1;
      else scale *= 0.78;
    }
  } finally {
    image.close?.();
  }

  throw new Error("Gambar terlalu besar untuk disimpan di mode demo.");
}
