import type { ProjectBodyImage } from "./types";

export const maxBodyImages = 6;

export type ProjectBodyBlock =
  | { type: "paragraph"; paragraph: number; text: string }
  | { type: "image"; after_paragraph: number; image: ProjectBodyImage };

export function splitProjectParagraphs(description: string): string[] {
  return description
    .replace(/\r\n/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function buildProjectBodyBlocks(
  description: string,
  images: readonly ProjectBodyImage[] = [],
): ProjectBodyBlock[] {
  const paragraphs = splitProjectParagraphs(description);
  const imagesByPlacement = Array.from({ length: paragraphs.length + 1 }, () => [] as ProjectBodyImage[]);

  for (const image of images) {
    const rawPlacement = Number.isFinite(image.after_paragraph)
      ? Math.trunc(image.after_paragraph)
      : 0;
    const placement = paragraphs.length === 0
      ? 0
      : Math.max(0, Math.min(paragraphs.length, rawPlacement));
    imagesByPlacement[placement].push(image);
  }

  const blocks: ProjectBodyBlock[] = [];
  const appendImages = (placement: number) => {
    for (const image of imagesByPlacement[placement]) {
      blocks.push({ type: "image", after_paragraph: placement, image });
    }
  };

  appendImages(0);

  paragraphs.forEach((text, index) => {
    const paragraph = index + 1;
    blocks.push({ type: "paragraph", paragraph, text });
    appendImages(paragraph);
  });

  return blocks;
}
