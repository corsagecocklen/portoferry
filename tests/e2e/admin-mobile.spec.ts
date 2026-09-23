import { expect, test, type Browser, type Page } from "@playwright/test";

const adminDemoUrl = new URL("/admin/demo", process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000").toString();

async function openDemo(browser: Browser, width: number, isMobile: boolean) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 1,
    isMobile,
    hasTouch: isMobile,
  });
  const page = await context.newPage();

  await page.goto(adminDemoUrl);
  await expect(page.getByRole("heading", { name: "Karya yang siap diceritakan." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tambah proyek", exact: true })).toBeEnabled();
  const categoryFilter = page.locator("#project-category-filter");
  await expect(categoryFilter).toHaveValue("all");
  await expect(categoryFilter.locator("option")).toHaveText([
    "Semua kategori",
    "Web Development",
    "IT Consulting",
    "Video Editing",
    "Graphic Design",
    "AI Consulting",
    "Artikel",
  ]);
  await expect(page.locator("#project-category")).toHaveCount(1);
  await expect(page.locator(".admin-project-row")).toHaveCount(7);
  await categoryFilter.selectOption({ label: "Artikel" });
  await expect(page.locator(".admin-project-row")).toHaveCount(1);
  await categoryFilter.selectOption("all");
  await expect(page.locator(".admin-project-row")).toHaveCount(7);

  return { context, page };
}

async function expectMobileControlTextSize(page: Page) {
  const sizes = await page.locator(
    '.admin-route input:not([type="checkbox"]):not([type="file"]), .admin-route textarea, .admin-route select',
  ).evaluateAll((controls) => controls
    .filter((control) => control.getClientRects().length > 0)
    .map((control) => Number.parseFloat(getComputedStyle(control).fontSize)));

  expect(sizes.length).toBeGreaterThan(0);
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
}

async function expectUnzoomed(page: Page) {
  await expect.poll(() => page.evaluate(() => Math.abs((window.visualViewport?.scale ?? 1) - 1) < 0.01)).toBe(true);
}

async function expectLayoutFits(page: Page, width: number, editorOpen = false) {
  const metrics = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right };
    };
    const size = (selector: string) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return null;
      return { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth };
    };

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      navigation: rect(".admin-sidebar-nav"),
      dialog: rect(".admin-dialog"),
      dialogPanel: size(".admin-dialog-panel"),
      editorLayout: size(".admin-editor-layout"),
    };
  });

  expect(metrics.viewportWidth).toBe(width);
  expect(metrics.documentWidth).toBeLessThanOrEqual(width);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(width);
  expect(metrics.navigation?.right).toBeLessThanOrEqual(width + 1);

  if (editorOpen) {
    expect(metrics.dialog?.left).toBeGreaterThanOrEqual(-1);
    expect(metrics.dialog?.right).toBeLessThanOrEqual(width + 1);
    expect(metrics.dialogPanel?.scrollWidth).toBeLessThanOrEqual(metrics.dialogPanel?.clientWidth ?? 0);
    expect(metrics.editorLayout?.scrollWidth).toBeLessThanOrEqual(metrics.editorLayout?.clientWidth ?? 0);
  }
}

async function closeWithEscape(page: Page, width: number) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: "Tambah proyek", exact: true })).toBeFocused();
  await expectLayoutFits(page, width);
  await expectUnzoomed(page);
}

async function expectEditorFields(page: Page) {
  await expect(page.locator("#project-category-filter")).toHaveCount(1);
  await expect(page.locator("#project-category")).toHaveCount(1);
  await expect(page.locator("#project-title")).toHaveCount(1);
  await expect(page.locator("#project-summary")).toHaveCount(1);
  await expect(page.locator("#project-description")).toHaveCount(1);
}

test("admin dashboard and editor fit mobile, tablet, and desktop breakpoints", async ({ browser }) => {
  test.setTimeout(120_000);

  const viewports = [
    { width: 320, isMobile: true },
    { width: 360, isMobile: true },
    { width: 390, isMobile: true },
    { width: 430, isMobile: true },
    { width: 680, isMobile: true },
    { width: 681, isMobile: true },
    { width: 768, isMobile: true },
    { width: 980, isMobile: true },
    { width: 981, isMobile: false },
    { width: 1024, isMobile: false },
  ];

  for (const { width, isMobile } of viewports) {
    const { context, page } = await openDemo(browser, width, isMobile);

    try {
      await expectLayoutFits(page, width);
      if (isMobile) await expectMobileControlTextSize(page);

      const addProject = page.getByRole("button", { name: "Tambah proyek", exact: true });
      if (isMobile) await addProject.tap();
      else await addProject.click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expectEditorFields(page);
      const title = page.locator("#project-title");
      await expect(title).toBeFocused();
      await expect.poll(() => page.locator(".admin-dialog-panel").evaluate((panel) => (panel as HTMLElement).scrollTop)).toBe(0);
      await expect(title).toBeInViewport();
      await expectLayoutFits(page, width, true);
      await expectUnzoomed(page);

      const saveButton = page.getByRole("button", { name: "Simpan proyek", exact: true });
      if (width <= 680) await expect(saveButton).toBeInViewport({ ratio: 1 });
      await saveButton.scrollIntoViewIfNeeded();
      await expect(saveButton).toBeInViewport({ ratio: 1 });

      await closeWithEscape(page, width);
    } finally {
      await context.close();
    }
  }
});

test("mobile editor keeps long previews usable and restores the dashboard after each close path", async ({ browser }) => {
  test.setTimeout(120_000);

  for (const width of [320, 360, 390, 430]) {
    const { context, page } = await openDemo(browser, width, true);

    try {
      const addProject = page.getByRole("button", { name: "Tambah proyek", exact: true });
      await addProject.tap();

      const dialog = page.getByRole("dialog");
      const title = page.locator("#project-title");
      const tags = page.locator("#project-tags");
      const preview = page.locator(".admin-project-card-preview");

      await expect(dialog).toBeVisible();
      await expectEditorFields(page);
      await expect(title).toBeFocused();
      await expect.poll(() => dialog.evaluate((element) => (element as HTMLDialogElement).scrollTop)).toBe(0);
      await expect(title).toBeInViewport();
      await expectMobileControlTextSize(page);
      await expectUnzoomed(page);

      await dialog.evaluate((element) => {
        const scrollDialog = element as HTMLDialogElement;
        scrollDialog.scrollTop = scrollDialog.scrollHeight;
      });
      await tags.scrollIntoViewIfNeeded();
      await tags.tap();
      await expect(tags).toBeFocused();

      const firstTag = "portfolio".repeat(10);
      const secondTag = "branding".repeat(10);
      const longTitle = "t".repeat(120);
      const longSummary = "s".repeat(300);
      const category = page.locator("#project-category");

      await category.selectOption({ label: "Artikel" });
      await expect(page.getByLabel("Judul artikel", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Isi artikel", { exact: true })).toBeVisible();
      await tags.fill(`${firstTag}, ${secondTag}`);
      await title.fill(longTitle);
      await page.locator("#project-summary").fill(longSummary);

      await expect(preview.locator(".project-title")).toHaveText(longTitle);
      await expect(preview.locator(".project-summary")).toHaveText(longSummary);
      await expect(preview.locator(".post-footnote > span")).toContainText(`#${firstTag}`);

      const previewSize = await preview.locator(".project-card").evaluate((card) => ({
        clientWidth: card.clientWidth,
        scrollWidth: card.scrollWidth,
      }));
      expect(previewSize.clientWidth).toBeGreaterThan(0);
      expect(previewSize.scrollWidth).toBeLessThanOrEqual(previewSize.clientWidth);
      await expectLayoutFits(page, width, true);
      await expectMobileControlTextSize(page);
      await expectUnzoomed(page);

      await category.scrollIntoViewIfNeeded();
      await expect(category).toBeInViewport();
      await category.selectOption({ label: "Video Editing" });
      await expect(page.getByLabel("Judul proyek", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Cerita proyek", { exact: true })).toBeVisible();

      const saveButton = page.getByRole("button", { name: "Simpan proyek", exact: true });
      const cancelButton = page.getByRole("button", { name: "Batal", exact: true });
      await saveButton.scrollIntoViewIfNeeded();
      await expect(saveButton).toBeInViewport({ ratio: 1 });
      await expect(cancelButton).toBeInViewport({ ratio: 1 });
      await expect.poll(() => dialog.evaluate((element) => (element as HTMLDialogElement).scrollTop)).toBeGreaterThan(0);
      await cancelButton.tap();

      await expect(dialog).toBeHidden();
      await expect(addProject).toBeFocused();
      await expectLayoutFits(page, width);
      await expectUnzoomed(page);

      await addProject.tap();
      await expect(dialog).toBeVisible();
      await expect(title).toBeFocused();
      await expect.poll(() => dialog.evaluate((element) => (element as HTMLDialogElement).scrollTop)).toBe(0);
      await expect(title).toBeInViewport();
      await closeWithEscape(page, width);

      await addProject.tap();
      await expect(dialog).toBeVisible();
      const closeButton = page.getByRole("button", { name: "Tutup editor", exact: true });
      await expect(closeButton).toBeInViewport();
      await closeButton.tap();

      await expect(dialog).toBeHidden();
      await expect(addProject).toBeFocused();
      await expectLayoutFits(page, width);
      await expectUnzoomed(page);
    } finally {
      await context.close();
    }
  }
});
