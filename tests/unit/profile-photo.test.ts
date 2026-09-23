import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { expect, it } from "vitest";

it("ships a small square feed avatar without source metadata", async () => {
  const image = await readFile("public/images/ferry-avatar-20260923.webp");
  const metadata = await sharp(image).metadata();

  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(192);
  expect(metadata.height).toBe(192);
  expect(metadata.exif).toBeUndefined();
  expect(image.length).toBeLessThan(20_000);
});
