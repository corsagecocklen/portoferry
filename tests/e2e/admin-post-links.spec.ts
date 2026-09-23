import { expect, test } from "@playwright/test";

for (const { slug, title } of [
  { slug: "ruang-kopi", title: "Ruang Kopi, ruang untuk singgah." },
  { slug: "contoh-artikel-brief-website", title: "Contoh artikel: menyiapkan brief website." },
]) {
  test(`admin opens the selected published post in a separate tab: ${slug}`, async ({ page }) => {
    await page.goto("/admin/demo");
    const row = page.locator(".admin-project-row").filter({ hasText: title });
    const openLink = row.getByRole("link", { name: `Buka tulisan ${title} di tab baru`, exact: true });

    await expect(openLink).toHaveAttribute("href", `/proyek/${slug}`);
    await expect(openLink).toHaveAttribute("target", "_blank");
    await expect(openLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(await openLink.evaluate(element => element.previousElementSibling?.getAttribute("aria-label"))).toBe(`Edit ${title}`);

    const popupPromise = page.waitForEvent("popup");
    await openLink.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(new RegExp(`/proyek/${slug}$`));
    await expect(popup.getByRole("heading", { level: 1 })).toHaveText(title);
    expect(await popup.evaluate(() => window.opener === null)).toBe(true);
    await expect(page).toHaveURL(/\/admin\/demo$/);
    await popup.close();

    await row.getByRole("button", { name: `Edit ${title}`, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
}

test("drafts and locally published demo posts do not link to unavailable public pages", async ({ page }) => {
  const title = "Tulisan lokal untuk menguji tautan";
  await page.goto("/admin/demo");
  await page.getByRole("button", { name: "Tambah proyek", exact: true }).click();
  const editor = page.getByRole("dialog");
  await editor.locator("#project-category").selectOption("Artikel");
  await editor.getByRole("textbox", { name: "Judul artikel", exact: true }).fill(title);
  await editor.getByRole("textbox", { name: "Ringkasan singkat", exact: true }).fill("Contoh posting yang hanya tersimpan dalam demo.");
  await editor.getByRole("textbox", { name: "Isi artikel", exact: true }).fill("Posting ini tidak boleh memiliki tautan publik yang menyesatkan.");
  await editor.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await expect(editor).toBeHidden();

  const row = page.locator(".admin-project-row").filter({ hasText: title });
  const openButton = row.getByRole("button", { name: /^Buka tulisan/ });
  await expect(openButton).toBeDisabled();
  await expect(openButton).toHaveAttribute("title", /Terbitkan posting terlebih dahulu/);
  await expect(row.getByRole("link", { name: /^Buka tulisan/ })).toHaveCount(0);

  await row.getByRole("button", { name: `Edit ${title}`, exact: true }).click();
  await editor.getByRole("checkbox", { name: /^Tandai terbit \(demo\)/ }).check();
  await editor.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(row.locator(".admin-project-state")).toHaveText("Terbit");
  await expect(openButton).toBeDisabled();
  await expect(openButton).toHaveAttribute("title", /hanya tersimpan di browser/);
  await expect(row.getByRole("link", { name: /^Buka tulisan/ })).toHaveCount(0);
});

test("all three posting actions remain adjacent and fit mobile and desktop rows", async ({ page }) => {
  await page.goto("/admin/demo");
  await expect(page.locator(".admin-project-row")).toHaveCount(7);

  for (const width of [320, 390, 680, 681, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const rowsFit = await page.locator(".admin-project-row").evaluateAll(rows => rows.every(row => {
      const bounds = row.getBoundingClientRect();
      const controls = Array.from(row.querySelectorAll(".admin-project-actions > *"));
      const boxes = controls.map(control => control.getBoundingClientRect());
      return controls.length === 3 && boxes.every((box, index) =>
        box.width >= 24 && box.height >= 24 &&
        box.left >= bounds.left && box.right <= bounds.right &&
        box.top >= bounds.top && box.bottom <= bounds.bottom &&
        (index === 0 || (box.left >= boxes[index - 1].right && box.top === boxes[index - 1].top)),
      );
    }));
    expect(rowsFit, `Posting actions fit at ${width}px`).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
