import { expect, test } from "@playwright/test";

test("demo Article saves, reopens, filters by category, and stays out of public data", async ({ page }) => {
  const title = "Catatan lokal tentang menyiapkan website";
  const summary = "Artikel uji untuk alur kategori tulisan.";
  const body = "Paragraf pembuka artikel uji.\n\nParagraf lanjutan berisi catatan yang disimpan.";

  await page.goto("/admin/demo");
  await expect(page.getByText(/Mode demo.*Tersimpan di browser ini/)).toBeVisible();
  await page.getByRole("button", { name: "Tambah proyek", exact: true }).click();

  const editor = page.getByRole("dialog");
  await editor.locator("#project-category").selectOption("Artikel");
  await expect(editor.getByRole("textbox", { name: "Judul artikel", exact: true })).toBeVisible();
  await expect(editor.getByRole("textbox", { name: "Isi artikel", exact: true })).toBeVisible();
  await expect(editor.getByRole("button", { name: "Simpan proyek", exact: true })).toBeVisible();
  await editor.getByRole("textbox", { name: "Judul artikel", exact: true }).fill(title);
  await editor.getByRole("textbox", { name: "Ringkasan singkat", exact: true }).fill(summary);
  await editor.getByRole("textbox", { name: "Isi artikel", exact: true }).fill(body);
  await editor.getByRole("checkbox", { name: /^Tandai terbit \(demo\)/ }).check();
  await editor.getByRole("button", { name: "Simpan proyek", exact: true }).click();

  const row = page.locator(".admin-project-row").filter({ hasText: title });
  await expect(row).toContainText("Artikel");
  await expect(row).toContainText("Terbit");
  await row.getByRole("button", { name: `Edit ${title}` }).click();
  await expect(editor.locator("#project-category")).toHaveValue("Artikel");
  await expect(editor.getByRole("textbox", { name: "Judul artikel", exact: true })).toHaveValue(title);
  await expect(editor.getByRole("textbox", { name: "Isi artikel", exact: true })).toHaveValue(body);
  await editor.getByRole("button", { name: "Batal", exact: true }).click();

  await page.reload();
  await expect(row).toBeVisible();
  await page.locator("#project-category-filter").selectOption("Artikel");
  await expect(page.locator(".admin-project-row")).toHaveCount(2);
  await expect(row).toBeVisible();

  await page.goto("/proyek");
  await expect(page.locator(".project-card")).toHaveCount(7);
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
});

test("demo tags keep typed commas, normalize on save, persist edits, and reset for a new post", async ({ page }) => {
  const title = "Tag typing regression";
  await page.goto("/admin/demo");
  await page.getByRole("button", { name: "Tambah proyek", exact: true }).click();

  const editor = page.getByRole("dialog");
  await editor.getByRole("textbox", { name: "Judul proyek", exact: true }).fill(title);
  await editor.getByRole("textbox", { name: "Ringkasan singkat", exact: true }).fill("Menguji daftar tag yang diketik.");
  await editor.getByRole("textbox", { name: "Cerita proyek", exact: true }).fill("Konten lokal untuk uji penyimpanan beberapa tag.");

  const tags = editor.locator("#project-tags");
  await tags.pressSequentially("Website, ");
  await expect(tags).toHaveValue("Website, ");
  await tags.pressSequentially("Tips, , Website, Catatan, ");
  await expect(tags).toHaveValue("Website, Tips, , Website, Catatan, ");
  await editor.getByRole("button", { name: "Simpan proyek", exact: true }).click();

  const row = page.locator(".admin-project-row").filter({ hasText: title });
  await expect(row).toBeVisible();
  await page.reload();
  await row.getByRole("button", { name: `Edit ${title}` }).click();
  await expect(editor.locator("#project-tags")).toHaveValue("Website, Tips, Catatan");

  const editedTags = editor.locator("#project-tags");
  await editedTags.press("End");
  await editedTags.pressSequentially(", Updated, , ");
  await expect(editedTags).toHaveValue("Website, Tips, Catatan, Updated, , ");
  await editor.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await page.reload();
  await row.getByRole("button", { name: `Edit ${title}` }).click();
  await expect(editor.locator("#project-tags")).toHaveValue("Website, Tips, Catatan, Updated");
  await editor.getByRole("button", { name: "Batal", exact: true }).click();

  await page.getByRole("button", { name: "Tambah proyek", exact: true }).click();
  await expect(page.getByRole("dialog").locator("#project-tags")).toHaveValue("");
  await page.getByRole("dialog").getByRole("button", { name: "Batal", exact: true }).click();
});

test("demo tags still enforce the 20-tag and 32-character limits", async ({ page }) => {
  await page.goto("/admin/demo");
  await page.getByRole("button", { name: "Tambah proyek", exact: true }).click();

  const editor = page.getByRole("dialog");
  await editor.getByRole("textbox", { name: "Judul proyek", exact: true }).fill("Tag limits regression");
  await editor.getByRole("textbox", { name: "Ringkasan singkat", exact: true }).fill("Memastikan validasi tag tetap aktif.");
  await editor.getByRole("textbox", { name: "Cerita proyek", exact: true }).fill("Konten lokal untuk menguji batas jumlah dan panjang tag.");

  const tags = editor.locator("#project-tags");
  await tags.fill(Array.from({ length: 21 }, (_, index) => `tag${index + 1}`).join(", "));
  await editor.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await expect(editor.locator("#project-tags-error")).toHaveText("Maksimal 20 tag.");

  await tags.fill("x".repeat(33));
  await editor.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await expect(editor.locator("#project-tags-error")).toHaveText("Tag maksimal 32 karakter.");
});
