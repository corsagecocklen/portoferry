import { describe, expect, it } from "vitest";

import { buildProjectBodyBlocks, splitProjectParagraphs } from "@/lib/project-body";
import type { ProjectBodyImage } from "@/lib/types";

function makeImage(id: string, after_paragraph: number): ProjectBodyImage {
  return {
    id,
    url: `/images/${id}.webp`,
    alt: `Gambar ${id}`,
    caption: "",
    after_paragraph,
  };
}

describe("project body content", () => {
  it("splits trimmed paragraphs on blank lines while keeping plain text intact", () => {
    expect(splitProjectParagraphs("  Pembuka biasa.\n Baris berikutnya tetap di paragraf yang sama.\n\nPenutup."))
      .toEqual([
        "Pembuka biasa.\n Baris berikutnya tetap di paragraf yang sama.",
        "Penutup.",
      ]);
  });

  it("normalizes CRLF and multiple blank lines into separate paragraphs", () => {
    expect(splitProjectParagraphs("  Pertama.\r\n\r\n\r\n  Kedua.\r\n   \r\nKetiga.  "))
      .toEqual(["Pertama.", "Kedua.", "Ketiga."]);
  });

  it("interleaves images before and after paragraphs without parsing their text", () => {
    const blocks = buildProjectBodyBlocks(
      "Teks <b>pertama</b>.\n\nTeks kedua.\n\nTeks ketiga.",
      [makeImage("awal", 0), makeImage("tengah", 1), makeImage("akhir", 2)],
    );

    expect(blocks.map((block) => block.type === "paragraph"
      ? `paragraph:${block.paragraph}:${block.text}`
      : `image:${block.image.id}:${block.after_paragraph}`)).toEqual([
      "image:awal:0",
      "paragraph:1:Teks <b>pertama</b>.",
      "image:tengah:1",
      "paragraph:2:Teks kedua.",
      "image:akhir:2",
      "paragraph:3:Teks ketiga.",
    ]);
  });

  it("clamps stale image placements to the last remaining paragraph", () => {
    const blocks = buildProjectBodyBlocks("Satu.\n\nDua.", [
      makeImage("stale", 9),
      makeImage("last-paragraph", 2),
    ]);

    expect(blocks.slice(-3)).toEqual([
      { type: "paragraph", paragraph: 2, text: "Dua." },
      { type: "image", after_paragraph: 2, image: makeImage("stale", 9) },
      { type: "image", after_paragraph: 2, image: makeImage("last-paragraph", 2) },
    ]);
  });

  it("keeps original image array order when multiple images share a placement", () => {
    const blocks = buildProjectBodyBlocks("Satu.\n\nDua.", [
      makeImage("pertama", 1),
      makeImage("kedua", 1),
      makeImage("sebelum", 0),
    ]);

    expect(blocks.filter((block) => block.type === "image").map((block) => block.image.id))
      .toEqual(["sebelum", "pertama", "kedua"]);
  });

  it("places images at the start when there are no paragraphs", () => {
    expect(buildProjectBodyBlocks(" \n\n ", [makeImage("one", 4)]))
      .toEqual([{ type: "image", after_paragraph: 0, image: makeImage("one", 4) }]);
  });
});
