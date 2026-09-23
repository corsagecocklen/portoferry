import type { CSSProperties } from "react";

import type { ThumbnailCrop } from "./types";

const DEFAULT_CROP: ThumbnailCrop = { x: 50, y: 50, zoom: 1 };
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function cropPercentage(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.round(clamp(value, 0, 100));
}

function cropZoom(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return MIN_ZOOM;
  const bounded = clamp(value, MIN_ZOOM, MAX_ZOOM);
  const stepped = MIN_ZOOM + Math.round((bounded - MIN_ZOOM) / ZOOM_STEP) * ZOOM_STEP;
  return Number(clamp(stepped, MIN_ZOOM, MAX_ZOOM).toFixed(2));
}

export function normalizeThumbnailCrop(value: unknown): ThumbnailCrop {
  if (typeof value !== "object" || value === null) return { ...DEFAULT_CROP };

  const crop = value as Partial<Record<keyof ThumbnailCrop, unknown>>;
  return {
    x: cropPercentage(crop.x, DEFAULT_CROP.x),
    y: cropPercentage(crop.y, DEFAULT_CROP.y),
    zoom: cropZoom(crop.zoom),
  };
}

export function getThumbnailStyle(value: ThumbnailCrop | null | undefined): CSSProperties {
  const crop = normalizeThumbnailCrop(value);
  const position = `${crop.x}% ${crop.y}%`;

  return {
    objectFit: "cover",
    objectPosition: position,
    transform: `scale(${crop.zoom})`,
    transformOrigin: position,
  };
}

export function getThumbnailCropOverflow(
  naturalWidth: number,
  naturalHeight: number,
  squareSize: number,
  zoom: number,
): { x: number; y: number } {
  if (
    !Number.isFinite(naturalWidth) || naturalWidth <= 0 ||
    !Number.isFinite(naturalHeight) || naturalHeight <= 0 ||
    !Number.isFinite(squareSize) || squareSize <= 0
  ) {
    return { x: 0, y: 0 };
  }

  const scale = squareSize / Math.min(naturalWidth, naturalHeight);
  const crop = normalizeThumbnailCrop({ x: 50, y: 50, zoom });
  return {
    x: Math.max(0, naturalWidth * scale * crop.zoom - squareSize),
    y: Math.max(0, naturalHeight * scale * crop.zoom - squareSize),
  };
}

export function getThumbnailCropAfterDrag(
  value: ThumbnailCrop | null | undefined,
  pointerDeltaX: number,
  pointerDeltaY: number,
  naturalWidth: number,
  naturalHeight: number,
  squareSize: number,
): ThumbnailCrop {
  const crop = normalizeThumbnailCrop(value);
  const overflow = getThumbnailCropOverflow(naturalWidth, naturalHeight, squareSize, crop.zoom);

  return normalizeThumbnailCrop({
    ...crop,
    x: overflow.x > 0 && Number.isFinite(pointerDeltaX)
      ? crop.x - (pointerDeltaX / overflow.x) * 100
      : crop.x,
    y: overflow.y > 0 && Number.isFinite(pointerDeltaY)
      ? crop.y - (pointerDeltaY / overflow.y) * 100
      : crop.y,
  });
}
