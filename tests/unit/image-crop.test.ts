import { describe, expect, it } from "vitest";

import {
  getThumbnailCropAfterDrag,
  getThumbnailCropOverflow,
  getThumbnailStyle,
  normalizeThumbnailCrop,
} from "@/lib/image-crop";

describe("thumbnail crop normalization", () => {
  it("uses a centered, unzoomed crop for legacy null or missing values", () => {
    const center = { x: 50, y: 50, zoom: 1 };

    expect(normalizeThumbnailCrop(null)).toEqual(center);
    expect(normalizeThumbnailCrop(undefined)).toEqual(center);
    expect(getThumbnailStyle(null)).toEqual({
      objectFit: "cover",
      objectPosition: "50% 50%",
      transform: "scale(1)",
      transformOrigin: "50% 50%",
    });
  });

  it("clamps and rounds percentages and zoom to the supported step", () => {
    expect(normalizeThumbnailCrop({ x: -3.4, y: 104.7, zoom: 3.5 })).toEqual({ x: 0, y: 100, zoom: 3 });
    expect(normalizeThumbnailCrop({ x: 34.6, y: 55.4, zoom: 1.13 })).toEqual({ x: 35, y: 55, zoom: 1.15 });
    expect(normalizeThumbnailCrop({ x: 50, y: 50, zoom: 0.7 })).toEqual({ x: 50, y: 50, zoom: 1 });
  });

  it("falls back safely when metadata is malformed", () => {
    expect(normalizeThumbnailCrop({ x: "30", y: Number.NaN, zoom: Number.POSITIVE_INFINITY })).toEqual({
      x: 50,
      y: 50,
      zoom: 1,
    });
    expect(normalizeThumbnailCrop({ x: 24, y: null, zoom: 2 })).toEqual({ x: 24, y: 50, zoom: 2 });
  });
});

describe("thumbnail crop geometry", () => {
  it("calculates cover overflow for landscape, portrait, and square images", () => {
    expect(getThumbnailCropOverflow(1600, 900, 200, 1).x).toBeCloseTo(155.56, 2);
    expect(getThumbnailCropOverflow(1600, 900, 200, 1).y).toBe(0);
    expect(getThumbnailCropOverflow(900, 1600, 200, 1).x).toBe(0);
    expect(getThumbnailCropOverflow(900, 1600, 200, 1).y).toBeCloseTo(155.56, 2);
    expect(getThumbnailCropOverflow(800, 800, 200, 1)).toEqual({ x: 0, y: 0 });
  });

  it("includes zoom in the total overflow", () => {
    expect(getThumbnailCropOverflow(800, 800, 200, 2)).toEqual({ x: 200, y: 200 });
    expect(getThumbnailCropOverflow(1600, 900, 200, 2).x).toBeCloseTo(511.11, 2);
  });

  it("moves the crop opposite the pointer and leaves an axis fixed without overflow", () => {
    const crop = getThumbnailCropAfterDrag({ x: 50, y: 50, zoom: 1 }, 10, 25, 1600, 900, 200);

    expect(crop).toEqual({ x: 44, y: 50, zoom: 1 });
  });

  it("uses zoomed overflow for drag movement and clamps at the image edges", () => {
    const zoomed = getThumbnailCropAfterDrag({ x: 50, y: 50, zoom: 2 }, 10, 10, 800, 800, 200);
    const leftEdge = getThumbnailCropAfterDrag({ x: 2, y: 2, zoom: 2 }, -1000, -1000, 800, 800, 200);
    const rightEdge = getThumbnailCropAfterDrag({ x: 98, y: 98, zoom: 2 }, 1000, 1000, 800, 800, 200);

    expect(zoomed).toEqual({ x: 45, y: 45, zoom: 2 });
    expect(leftEdge).toEqual({ x: 100, y: 100, zoom: 2 });
    expect(rightEdge).toEqual({ x: 0, y: 0, zoom: 2 });
  });

  it("does not move on an axis when the source dimensions cannot overflow", () => {
    expect(getThumbnailCropAfterDrag({ x: 50, y: 50, zoom: 1 }, 40, 40, 800, 800, 200)).toEqual({
      x: 50,
      y: 50,
      zoom: 1,
    });
  });
});
