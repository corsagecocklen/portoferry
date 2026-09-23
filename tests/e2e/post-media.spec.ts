import { expect, test, type Locator, type Page } from "@playwright/test";
import sharp from "sharp";

const demoSnapshotKey = "portoferry-admin-demo-v1";

type BodyImageRecord = {
  url: string;
  alt: string;
  caption: string;
  after_paragraph: number;
};

type Crop = { x: number; y: number; zoom: number };

async function syntheticPng(width: number, height: number, colors: string[]): Promise<Buffer> {
  const stripeWidth = width / colors.length;
  const stripes = colors.map((color, index) => {
    const x = Math.round(index * stripeWidth);
    const right = Math.round((index + 1) * stripeWidth);
    return `<rect x="${x}" y="0" width="${right - x}" height="${height}" fill="${color}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${stripes}</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function pngFile(name: string, buffer: Buffer) {
  return { name, mimeType: "image/png", buffer };
}

function svgFile(name = "vector.svg") {
  return {
    name,
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8"/></svg>'),
  };
}

async function openDemoProject(
  page: Page,
  title: string,
  description = "A draft paragraph for testing inline media.",
) {
  await page.goto("/admin/demo");
  await expect(page.getByText(/Mode demo.*Tersimpan di browser ini/)).toBeVisible();
  await page.getByRole("button", { name: "Tambah proyek", exact: true }).click();

  const editor = page.getByRole("dialog");
  await expect(editor).toBeVisible();
  await editor.locator("#project-category").selectOption("Artikel");
  await editor.locator("#project-title").fill(title);
  await editor.locator("#project-summary").fill("Synthetic browser-only post media regression.");
  await editor.locator("#project-description").fill(description);

  return editor;
}

async function saveDraft(page: Page, editor: Locator, title: string) {
  await editor.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await expect(editor).toBeHidden();
  const row = page.locator(".admin-project-row").filter({ hasText: title });
  await expect(row).toBeVisible();
  return row;
}

async function readStoredBodyImages(page: Page, title: string): Promise<BodyImageRecord[]> {
  return page.evaluate(({ key, projectTitle }) => {
    const snapshot = JSON.parse(localStorage.getItem(key) ?? "null") as {
      projects?: Array<{ title: string; body_images?: BodyImageRecord[] }>;
    } | null;
    return snapshot?.projects?.find((project) => project.title === projectTitle)?.body_images ?? [];
  }, { key: demoSnapshotKey, projectTitle: title });
}

async function storedBodyImagesAreExplicitlyEmpty(page: Page, title: string): Promise<boolean> {
  return page.evaluate(({ key, projectTitle }) => {
    const snapshot = JSON.parse(localStorage.getItem(key) ?? "null") as {
      projects?: Array<{ title: string; body_images?: BodyImageRecord[] }>;
    } | null;
    const project = snapshot?.projects?.find((item) => item.title === projectTitle);
    return Boolean(project && Object.prototype.hasOwnProperty.call(project, "body_images") && project.body_images?.length === 0);
  }, { key: demoSnapshotKey, projectTitle: title });
}

async function readStoredCrop(page: Page, title: string): Promise<Crop | null | undefined> {
  return page.evaluate(({ key, projectTitle }) => {
    const snapshot = JSON.parse(localStorage.getItem(key) ?? "null") as {
      projects?: Array<{ title: string; thumbnail_crop?: Crop | null }>;
    } | null;
    return snapshot?.projects?.find((project) => project.title === projectTitle)?.thumbnail_crop;
  }, { key: demoSnapshotKey, projectTitle: title });
}

async function uploadCover(editor: Locator, name: string, buffer: Buffer): Promise<string> {
  await editor.getByLabel("Unggah gambar sampul").setInputFiles(pngFile(name, buffer));
  const coverUrl = editor.locator("#project-image-url");
  await expect(coverUrl).toHaveValue(/^data:image\/jpeg;base64,/);
  return coverUrl.inputValue();
}

function cropSummary(editor: Locator) {
  return editor.locator("summary").filter({ hasText: "Atur thumbnail 1:1" });
}

function positionSelect(editor: Locator, number: number) {
  return editor.getByRole("combobox", { name: `Posisi gambar ${number}`, exact: true });
}

async function waitForCropImage(group: Locator) {
  await group.scrollIntoViewIfNeeded();
  const image = group.locator("img");
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(group).toHaveAttribute("aria-disabled", "false");
  return image;
}

async function readInlineCropStyle(image: Locator) {
  return image.evaluate((element) => {
    const style = (element as HTMLImageElement).style;
    return {
      objectFit: style.objectFit,
      objectPosition: style.objectPosition,
      transform: style.transform,
      transformOrigin: style.transformOrigin,
    };
  });
}

async function expectCropMatchesCard(editor: Locator, group: Locator) {
  const toolImage = group.locator("img");
  const cardImage = editor.locator(".admin-project-card-preview .project-card .project-art img");
  await expect(cardImage).toHaveCount(1);
  expect(await readInlineCropStyle(cardImage)).toEqual(await readInlineCropStyle(toolImage));
}

async function dragWithMouse(page: Page, target: Locator, deltaX: number, deltaY = 0) {
  const bounds = await target.boundingBox();
  if (!bounds) throw new Error("Crop preview is not visible for dragging.");

  const startX = bounds.x + bounds.width / 2;
  const startY = bounds.y + bounds.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 5 });
  await page.mouse.up();
}

async function nudgeRangeWithKeyboard(range: Locator, keys: string[]) {
  const initial = Number(await range.inputValue());
  for (const key of keys) {
    await range.focus();
    await range.press(key);
    const next = Number(await range.inputValue());
    if (next !== initial) return next;
  }

  throw new Error(`Keyboard input did not change range value ${initial}.`);
}

async function expectMobileLayoutFits(page: Page, width: number, editorOpen = true) {
  const metrics = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    };
    const dimensions = (selector: string) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return null;
      return { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth };
    };

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      dialog: bounds(".admin-dialog"),
      panel: dimensions(".admin-dialog-panel"),
      editor: dimensions(".admin-editor-layout"),
      crop: bounds('[role="group"][aria-label="Pratinjau persegi thumbnail"]'),
    };
  });

  expect(metrics.viewportWidth).toBe(width);
  expect(metrics.documentWidth).toBeLessThanOrEqual(width);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(width);
  if (!editorOpen) return;

  expect(metrics.dialog?.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.dialog?.right).toBeLessThanOrEqual(width + 1);
  expect(metrics.panel?.scrollWidth).toBeLessThanOrEqual(metrics.panel?.clientWidth ?? 0);
  expect(metrics.editor?.scrollWidth).toBeLessThanOrEqual(metrics.editor?.clientWidth ?? 0);
  expect(metrics.crop?.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.crop?.right).toBeLessThanOrEqual(width + 1);
}

async function dragWithTouch(page: Page, target: Locator, deltaX: number, deltaY = 0) {
  const bounds = await target.boundingBox();
  if (!bounds) throw new Error("Crop preview is not visible for touch dragging.");

  const session = await page.context().newCDPSession(page);
  const startX = bounds.x + bounds.width / 2;
  const startY = bounds.y + bounds.height / 2;
  const point = (x: number, y: number) => ({ x, y, id: 1, radiusX: 2, radiusY: 2, force: 1 });

  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point(startX, startY)],
    });
    for (let step = 1; step <= 4; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [point(startX + (deltaX * step) / 4, startY + (deltaY * step) / 4)],
      });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally {
    await session.detach();
  }
}

test("demo article keeps three full-ratio inline images placed between paragraphs through edits", async ({ page }) => {
  test.setTimeout(120_000);
  const writes: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) {
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });

  const title = "Inline media demo regression";
  const paragraphs = [
    "Paragraph one introduces the local test article.",
    "Paragraph two explains the synthetic images.",
    "Paragraph three closes the article without external data.",
  ];
  const description = paragraphs.join("\n\n");
  const alts = [
    "North section <img src=x onerror=alert(1)> & blue",
    "Portrait study & offset",
    "Square study with three color bands",
  ];
  const captions = [
    'Caption <strong>stays text</strong> & "quoted".',
    "Portrait shown at its complete 2:3 ratio.",
    "Square image in the final paragraph.",
  ];
  const imageBuffers = [
    await syntheticPng(1200, 675, ["#ef5964", "#19a88b", "#385ccc"]),
    await syntheticPng(600, 900, ["#f2b843", "#7c4fa0", "#26334f"]),
    await syntheticPng(800, 800, ["#0f8795", "#e47736", "#9a2757"]),
  ];
  const ratios = [1200 / 675, 600 / 900, 1];
  const editor = await openDemoProject(page, title, description);

  await editor.getByLabel("Unggah gambar tulisan").setInputFiles([
    pngFile("wide-study.png", imageBuffers[0]),
    pngFile("portrait-study.png", imageBuffers[1]),
    pngFile("square-study.png", imageBuffers[2]),
  ]);
  await expect(editor.locator("ol li")).toHaveCount(3);

  for (const [index, alt] of alts.entries()) {
    await editor.getByLabel(`Teks alternatif gambar ${index + 1}`, { exact: true }).fill(alt);
    await editor.getByLabel(new RegExp(`^Keterangan gambar ${index + 1}`)).fill(captions[index]);
    await positionSelect(editor, index + 1).selectOption(String(index + 1));
  }

  const bodyPreview = editor.locator("details.admin-body-preview");
  await bodyPreview.locator("summary").click();
  const figures = bodyPreview.locator("figure[data-body-image]");
  await expect(figures).toHaveCount(3);
  const renderedOrder = await bodyPreview.locator("p, figure[data-body-image]").evaluateAll((elements) => elements.map((element) => {
    if (element instanceof HTMLParagraphElement) {
      return { type: "paragraph", value: element.textContent?.trim() ?? "" };
    }
    return { type: "image", value: element.querySelector("img")?.getAttribute("alt") ?? "" };
  }));
  expect(renderedOrder).toEqual([
    { type: "paragraph", value: paragraphs[0] },
    { type: "image", value: alts[0] },
    { type: "paragraph", value: paragraphs[1] },
    { type: "image", value: alts[1] },
    { type: "paragraph", value: paragraphs[2] },
    { type: "image", value: alts[2] },
  ]);
  await expect(figures.nth(0).locator("img")).toHaveAttribute("alt", alts[0]);
  await expect(figures.nth(0).locator("figcaption")).toHaveText(captions[0]);
  await expect(figures.nth(0).locator("figcaption *")).toHaveCount(0);

  for (const [index, ratio] of ratios.entries()) {
    const image = figures.nth(index).locator("img");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const dimensions = await image.evaluate((element) => {
      const imageElement = element as HTMLImageElement;
      const rect = imageElement.getBoundingClientRect();
      return {
        naturalRatio: imageElement.naturalWidth / imageElement.naturalHeight,
        displayRatio: rect.width / rect.height,
        objectFit: getComputedStyle(imageElement).objectFit,
      };
    });
    expect(dimensions.naturalRatio).toBeCloseTo(ratio, 2);
    expect(dimensions.displayRatio).toBeCloseTo(ratio, 2);
    expect(dimensions.objectFit).toBe("contain");
  }

  const row = await saveDraft(page, editor, title);
  await page.reload();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: `Edit ${title}` }).click();
  await expect(editor.locator("ol li")).toHaveCount(3);
  await expect(positionSelect(editor, 1)).toHaveValue("1");
  await expect(positionSelect(editor, 2)).toHaveValue("2");
  await expect(positionSelect(editor, 3)).toHaveValue("3");

  const originalImages = await readStoredBodyImages(page, title);
  await positionSelect(editor, 2).selectOption("1");
  await editor.getByRole("button", { name: "Pindahkan gambar 2 sebelum gambar 1 pada posisi yang sama", exact: true }).click();
  await expect(editor.getByLabel("Teks alternatif gambar 1", { exact: true })).toHaveValue(alts[1]);
  await expect(editor.getByLabel("Teks alternatif gambar 2", { exact: true })).toHaveValue(alts[0]);
  await editor.getByLabel("Ganti gambar 1").setInputFiles(
    pngFile("replacement-study.png", await syntheticPng(700, 350, ["#212f7a", "#fa9b3b", "#1d9865"])),
  );
  const bodyArea = editor.locator("section").filter({ hasText: "Gambar dalam tulisan" });
  await expect(bodyArea.getByRole("status")).toContainText("Gambar 1 berhasil diganti.");
  await expect(editor.getByLabel("Teks alternatif gambar 1", { exact: true })).toHaveValue(alts[1]);
  await expect(editor.getByLabel(new RegExp("^Keterangan gambar 1"))).toHaveValue(captions[1]);
  await editor.getByRole("button", { name: "Hapus gambar 3 dari tulisan", exact: true }).click();
  await expect(editor.locator("ol li")).toHaveCount(2);
  await expect(editor.getByLabel("Teks alternatif gambar 1", { exact: true })).toHaveValue(alts[1]);
  await expect(editor.getByLabel("Teks alternatif gambar 2", { exact: true })).toHaveValue(alts[0]);

  await saveDraft(page, editor, title);
  await page.reload();
  const updatedRow = page.locator(".admin-project-row").filter({ hasText: title });
  await updatedRow.getByRole("button", { name: `Edit ${title}` }).click();
  await expect(editor.locator("ol li")).toHaveCount(2);
  await expect(editor.getByLabel("Teks alternatif gambar 1", { exact: true })).toHaveValue(alts[1]);
  await expect(editor.getByLabel("Keterangan gambar 1 (opsional)")).toHaveValue(captions[1]);
  await expect(positionSelect(editor, 1)).toHaveValue("1");
  await expect(editor.getByLabel("Teks alternatif gambar 2", { exact: true })).toHaveValue(alts[0]);
  await expect(editor.getByLabel("Keterangan gambar 2 (opsional)")).toHaveValue(captions[0]);
  await expect(positionSelect(editor, 2)).toHaveValue("1");

  const updatedImages = await readStoredBodyImages(page, title);
  expect(updatedImages).toHaveLength(2);
  expect(updatedImages[0].url === originalImages[1].url).toBe(false);
  expect(updatedImages[1].url === originalImages[0].url).toBe(true);
  await editor.getByRole("button", { name: "Hapus gambar 2 dari tulisan", exact: true }).click();
  await editor.getByRole("button", { name: "Hapus gambar 1 dari tulisan", exact: true }).click();
  await expect(editor.locator("ol li")).toHaveCount(0);
  await saveDraft(page, editor, title);
  await page.reload();
  expect(await storedBodyImagesAreExplicitlyEmpty(page, title)).toBe(true);
  await page.locator(".admin-project-row").filter({ hasText: title }).getByRole("button", { name: `Edit ${title}` }).click();
  await expect(editor.locator("ol li")).toHaveCount(0);
  await expect(editor.getByLabel("Unggah gambar tulisan")).toBeEnabled();
  await editor.getByRole("button", { name: "Batal", exact: true }).click();
  await page.goto("/proyek");
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  expect(writes).toEqual([]);
});

test("invalid uploads preserve successful cover, attachment, and draft state", async ({ page }) => {
  test.setTimeout(120_000);
  const title = "Upload validation demo regression";
  const editor = await openDemoProject(page, title, "First paragraph for upload validation.\n\nSecond paragraph remains saved.");
  const coverUrl = await uploadCover(editor, "safe-cover.png", await syntheticPng(1280, 720, ["#19335e", "#e36b4f", "#2c9c84"]));
  const coverInput = editor.locator("#project-image-url");
  const largePng = { name: "oversized.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) };

  await editor.getByLabel("Unggah gambar sampul").setInputFiles(svgFile("bad-cover.svg"));
  await expect(editor.locator(".admin-image-input-group [role='alert']")).toContainText("SVG tidak didukung");
  expect((await coverInput.inputValue()) === coverUrl).toBe(true);
  await editor.getByLabel("Unggah gambar sampul").setInputFiles(largePng);
  await expect(editor.locator(".admin-image-input-group [role='alert']")).toContainText("Ukuran gambar maksimal 5 MB.");
  expect((await coverInput.inputValue()) === coverUrl).toBe(true);

  const bodyArea = editor.locator("section").filter({ hasText: "Gambar dalam tulisan" });
  const bodyInput = editor.getByLabel("Unggah gambar tulisan");
  await bodyInput.setInputFiles([
    pngFile("first-success.png", await syntheticPng(900, 600, ["#d34d63", "#2d7898", "#edbd4e"])),
    svgFile("rejected-vector.svg"),
  ]);
  await expect(editor.locator("ol li")).toHaveCount(1);
  await expect(bodyArea.getByRole("alert")).toContainText("rejected-vector.svg");
  await expect(bodyArea.getByRole("alert")).toContainText("SVG tidak didukung");
  await editor.getByLabel("Teks alternatif gambar 1", { exact: true }).fill("Successful upload kept after errors");
  await editor.getByLabel("Keterangan gambar 1 (opsional)").fill("Caption remains in the draft.");
  await positionSelect(editor, 1).selectOption("2");

  await bodyInput.setInputFiles(largePng);
  await expect(bodyArea.getByRole("alert")).toContainText("Ukuran gambar maksimal 5 MB.");
  await expect(editor.locator("ol li")).toHaveCount(1);
  await expect(editor.getByLabel("Teks alternatif gambar 1", { exact: true })).toHaveValue("Successful upload kept after errors");

  const tooManyFiles = await Promise.all(Array.from({ length: 7 }, async (_, index) =>
    pngFile(`too-many-${index + 1}.png`, await syntheticPng(160 + index, 120, ["#3478a2", "#e6b243", "#7f476d"])),
  ));
  await bodyInput.setInputFiles(tooManyFiles);
  await expect(bodyArea.getByRole("alert")).toContainText("Maksimal 6 gambar dalam tulisan.");
  await expect(bodyArea.getByRole("alert")).toContainText("tidak ada gambar yang diunggah");
  await expect(editor.locator("ol li")).toHaveCount(1);
  await expect(editor.getByLabel("Keterangan gambar 1 (opsional)")).toHaveValue("Caption remains in the draft.");
  await expect(positionSelect(editor, 1)).toHaveValue("2");

  const row = await saveDraft(page, editor, title);
  await page.reload();
  await row.getByRole("button", { name: `Edit ${title}` }).click();
  await expect(editor.locator("#project-image-url")).toHaveValue(/^data:image\/jpeg;base64,/);
  expect((await editor.locator("#project-image-url").inputValue()) === coverUrl).toBe(true);
  await expect(editor.locator("ol li")).toHaveCount(1);
  await expect(editor.getByLabel("Teks alternatif gambar 1", { exact: true })).toHaveValue("Successful upload kept after errors");
  await expect(editor.getByLabel("Keterangan gambar 1 (opsional)")).toHaveValue("Caption remains in the draft.");
  await expect(positionSelect(editor, 1)).toHaveValue("2");
});

test("thumbnail crop is interactive, matches the card preview, persists, and resets for new covers", async ({ page }) => {
  test.setTimeout(120_000);
  const title = "Thumbnail crop demo regression";
  const editor = await openDemoProject(page, title);
  const firstCover = await uploadCover(editor, "wide-cover.png", await syntheticPng(1600, 900, ["#da4453", "#1d927b", "#334cb7", "#f0b347"]));

  await cropSummary(editor).click();
  const group = editor.getByRole("group", { name: "Pratinjau persegi thumbnail", exact: true });
  const cropImage = await waitForCropImage(group);
  expect((await cropImage.getAttribute("src")) === firstCover).toBe(true);

  const horizontal = editor.getByRole("slider", { name: "Posisi horizontal", exact: true });
  const vertical = editor.getByRole("slider", { name: "Posisi vertikal", exact: true });
  const zoom = editor.getByRole("slider", { name: "Zoom thumbnail", exact: true });
  await expect(horizontal).toHaveValue("50");
  await expect(vertical).toHaveValue("50");
  await expect(zoom).toHaveValue("1");

  await dragWithMouse(page, group, 48);
  await expect(horizontal).not.toHaveValue("50");
  await nudgeRangeWithKeyboard(horizontal, ["ArrowRight"]);
  await nudgeRangeWithKeyboard(zoom, ["ArrowRight"]);
  await nudgeRangeWithKeyboard(vertical, ["ArrowDown", "ArrowUp"]);
  const savedCrop = {
    x: Number(await horizontal.inputValue()),
    y: Number(await vertical.inputValue()),
    zoom: Number(await zoom.inputValue()),
  };
  expect(savedCrop.x).not.toBe(50);
  expect(savedCrop.y).not.toBe(50);
  expect(savedCrop.zoom).toBe(1.05);
  expect(await readInlineCropStyle(cropImage)).toEqual({
    objectFit: "cover",
    objectPosition: `${savedCrop.x}% ${savedCrop.y}%`,
    transform: `scale(${savedCrop.zoom})`,
    transformOrigin: `${savedCrop.x}% ${savedCrop.y}%`,
  });
  await expectCropMatchesCard(editor, group);
  const firstCardImage = editor.locator(".admin-project-card-preview .project-card .project-art img");
  expect((await firstCardImage.getAttribute("src")) === firstCover).toBe(true);

  const row = await saveDraft(page, editor, title);
  await page.reload();
  const reloadedRow = page.locator(".admin-project-row").filter({ hasText: title });
  const rowImageStyle = await readInlineCropStyle(reloadedRow.locator(".admin-project-thumb img"));
  expect(rowImageStyle).toEqual({
    objectFit: "cover",
    objectPosition: `${savedCrop.x}% ${savedCrop.y}%`,
    transform: `scale(${savedCrop.zoom})`,
    transformOrigin: `${savedCrop.x}% ${savedCrop.y}%`,
  });
  await reloadedRow.getByRole("button", { name: `Edit ${title}` }).click();
  await cropSummary(editor).click();
  const reloadedGroup = editor.getByRole("group", { name: "Pratinjau persegi thumbnail", exact: true });
  const reloadedCropImage = await waitForCropImage(reloadedGroup);
  await expect(editor.getByRole("slider", { name: "Posisi horizontal", exact: true })).toHaveValue(String(savedCrop.x));
  await expect(editor.getByRole("slider", { name: "Posisi vertikal", exact: true })).toHaveValue(String(savedCrop.y));
  await expect(editor.getByRole("slider", { name: "Zoom thumbnail", exact: true })).toHaveValue(String(savedCrop.zoom));
  await expectCropMatchesCard(editor, reloadedGroup);
  expect((await reloadedCropImage.getAttribute("src")) === firstCover).toBe(true);

  await editor.getByLabel("Unggah gambar sampul").setInputFiles(
    pngFile("replacement-cover.png", await syntheticPng(1400, 800, ["#1487aa", "#dd3d78", "#6c9d34"])),
  );
  const coverInput = editor.locator("#project-image-url");
  await expect.poll(async () => {
    const value = await coverInput.inputValue();
    return value.startsWith("data:image/jpeg;base64,") && value !== firstCover;
  }).toBe(true);
  const replacementCover = await coverInput.inputValue();
  await cropSummary(editor).click();
  const replacementGroup = editor.getByRole("group", { name: "Pratinjau persegi thumbnail", exact: true });
  const replacementImage = await waitForCropImage(replacementGroup);
  await expect(editor.getByRole("slider", { name: "Posisi horizontal", exact: true })).toHaveValue("50");
  await expect(editor.getByRole("slider", { name: "Posisi vertikal", exact: true })).toHaveValue("50");
  await expect(editor.getByRole("slider", { name: "Zoom thumbnail", exact: true })).toHaveValue("1");
  expect((await replacementImage.getAttribute("src")) === replacementCover).toBe(true);
  const reset = editor.getByRole("button", { name: "Atur ulang crop thumbnail", exact: true });
  await expect(reset).toBeDisabled();

  await nudgeRangeWithKeyboard(editor.getByRole("slider", { name: "Posisi horizontal", exact: true }), ["ArrowRight"]);
  await expect(reset).toBeEnabled();
  await reset.click();
  await expect(editor.getByRole("slider", { name: "Posisi horizontal", exact: true })).toHaveValue("50");
  await expect(editor.getByRole("slider", { name: "Posisi vertikal", exact: true })).toHaveValue("50");
  await expect(editor.getByRole("slider", { name: "Zoom thumbnail", exact: true })).toHaveValue("1");
  await expect(reset).toBeDisabled();
  await expectCropMatchesCard(editor, replacementGroup);
  const replacementCardImage = editor.locator(".admin-project-card-preview .project-card .project-art img");
  expect((await replacementCardImage.getAttribute("src")) === replacementCover).toBe(true);

  await saveDraft(page, editor, title);
  await page.reload();
  expect(await readStoredCrop(page, title)).toBeNull();
  await expect(row).toBeVisible();
});

test("public seeded body media and thumbnail crops render without cropping the detail cover", async ({ page }) => {
  await page.goto("/admin/demo");
  await expect(page.getByText(/Mode demo.*Tersimpan di browser ini/)).toBeVisible();

  await page.goto("/proyek/contoh-artikel-brief-website");
  const articleBody = page.locator(".detail-story");
  await expect(articleBody.locator("figure[data-body-image]")).toHaveCount(3);
  const articleBlocks = await articleBody.locator("p, figure[data-body-image]").evaluateAll((elements) => elements.map((element) =>
    element instanceof HTMLParagraphElement
      ? "paragraph"
      : `image:${element.getAttribute("data-body-image")}`,
  ));
  expect(articleBlocks).toEqual([
    "paragraph",
    "image:ecb2e8c7-3418-45e7-a98c-f1d33e7f54b1",
    "paragraph",
    "image:ecb2e8c7-3418-45e7-a98c-f1d33e7f54b2",
    "paragraph",
    "image:ecb2e8c7-3418-45e7-a98c-f1d33e7f54b3",
  ]);

  const routes = [
    "/#proyek",
    "/proyek",
    "/layanan/web-development",
  ];
  for (const route of routes) {
    await page.goto(route);
    const coffeeCard = page.locator(".project-card").filter({ hasText: "Ruang Kopi, ruang untuk singgah." });
    await expect(coffeeCard).toHaveCount(1);
    const thumbnail = coffeeCard.locator(".project-art img");
    await expect(thumbnail).toBeVisible();
    expect(await readInlineCropStyle(thumbnail)).toEqual({
      objectFit: "cover",
      objectPosition: "30% 50%",
      transform: "scale(1.2)",
      transformOrigin: "30% 50%",
    });
  }

  await page.goto("/proyek/ruang-kopi");
  const detailCover = page.locator(".detail-cover img");
  await expect(detailCover).toHaveAttribute("src", /%2Fimages%2Fproject-kopi\.webp/);
  expect(await detailCover.evaluate((element) => getComputedStyle(element).objectFit)).toBe("contain");
  expect(await detailCover.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
  expect(await detailCover.evaluate((element) => (element as HTMLImageElement).style.objectPosition)).toBe("");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /project-kopi\.webp/);
});

test("mobile crop controls fit 320px and 390px screens, support touch dragging, and cancel cleanly", async ({ browser }) => {
  test.setTimeout(120_000);
  const cover = await syntheticPng(1600, 900, ["#db4258", "#2f7eb1", "#42a66f", "#e8b844"]);

  for (const width of [320, 390]) {
    const context = await browser.newContext({
      baseURL: process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000",
      viewport: { width, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    try {
      const title = `Mobile crop ${width}px cancel regression`;
      const editor = await openDemoProject(page, title);
      await uploadCover(editor, `mobile-${width}.png`, cover);
      await cropSummary(editor).tap();

      const group = editor.getByRole("group", { name: "Pratinjau persegi thumbnail", exact: true });
      await waitForCropImage(group);
      await expectMobileLayoutFits(page, width);

      const horizontal = editor.getByRole("slider", { name: "Posisi horizontal", exact: true });
      await horizontal.scrollIntoViewIfNeeded();
      await expect(horizontal).toBeInViewport({ ratio: 1 });
      for (const label of ["Posisi vertikal", "Zoom thumbnail"]) {
        const control = editor.getByRole("slider", { name: label, exact: true });
        await control.scrollIntoViewIfNeeded();
        await expect(control).toBeInViewport({ ratio: 1 });
      }
      await group.scrollIntoViewIfNeeded();
      await dragWithTouch(page, group, 42);
      await expect(horizontal).not.toHaveValue("50");
      await expectCropMatchesCard(editor, group);
      const coverValue = await editor.locator("#project-image-url").inputValue();
      const cardImage = editor.locator(".admin-project-card-preview .project-card .project-art img");
      expect((await cardImage.getAttribute("src")) === coverValue).toBe(true);

      const actions = editor.locator(".admin-dialog-actions");
      await actions.scrollIntoViewIfNeeded();
      const save = editor.getByRole("button", { name: "Simpan proyek", exact: true });
      const cancel = editor.getByRole("button", { name: "Batal", exact: true });
      await expect(save).toBeInViewport({ ratio: 1 });
      await expect(cancel).toBeInViewport({ ratio: 1 });
      await cancel.click();
      await expect(editor).toBeHidden();
      await expect(page.locator(".admin-project-row").filter({ hasText: title })).toHaveCount(0);

      await page.reload();
      await expect(page.locator(".admin-project-row").filter({ hasText: title })).toHaveCount(0);
      await expectMobileLayoutFits(page, width, false);
    } finally {
      await context.close();
    }
  }
});
