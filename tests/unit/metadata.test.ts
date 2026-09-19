import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { socialImage } from "@/lib/site-metadata";

describe("social metadata artwork", () => {
  it("points to the versioned 1200x630 image used by share metadata", async () => {
    expect(socialImage.url).toMatch(/^\/images\/og-portoferry-v\d+\.jpg$/);

    const imagePath = path.join(process.cwd(), "public", socialImage.url.slice(1));
    expect(fs.existsSync(imagePath)).toBe(true);

    const image = await sharp(imagePath).metadata();
    expect(image.width).toBe(socialImage.width);
    expect(image.height).toBe(socialImage.height);
    expect(image.format).toBe("jpeg");
  });
});
