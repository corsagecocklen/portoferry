import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

test("landing page prioritizes web, IT, and video with working navigation and FAQ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Website siap.Bisnis jalan.");
  await expect(page.locator(".service-row")).toHaveCount(3);
  await expect(page.locator(".home-project-grid .project-card")).toHaveCount(6);
  await page.getByRole("link", { name: "Lihat syaratnya" }).click();
  await page.locator("summary").filter({ hasText: "Beneran bisa" }).click();
  await expect(page.locator("details[open]")).toContainText("setelah semua bahan dan lingkup disepakati");
  await page.getByRole("link", { name: "Lihat hasil kerja" }).click();
  await expect(page).toHaveURL(/\/proyek$/);
});

test("Latest Feed includes every published category newest first and opens Graphic Design work", async ({ page }) => {
  await page.goto("/");
  const feed = page.locator(".home-project-grid");
  await expect(feed.locator(".project-card")).toHaveCount(6);
  await expect(feed.locator(".post-subtitle")).toHaveText([
    "Web Development", "Web Development", "Video Editing", "Graphic Design", "IT Consulting", "AI Consulting",
  ]);
  const dates = await feed.locator("time").evaluateAll(elements => elements.map(element => Date.parse((element as HTMLTimeElement).dateTime)));
  expect(dates).toEqual([...dates].sort((a, b) => b - a));
  await feed.getByRole("link", { name: "Lihat proyek A face behind the pixels.", exact: true }).click();
  await expect(page).toHaveURL(/\/proyek\/creative-profile$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A face behind the pixels.");
});

test("Latest Feed never hides a project at mobile, two-column, or desktop widths", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator(".home-project-grid .project-card:visible");
  for (const width of [320, 390, 539, 540, 640, 760, 761, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(cards, `Every feed card must remain visible at ${width}px`).toHaveCount(6);
  }
});

test("gallery filters every category, searches, and opens a real project detail", async ({ page }) => {
  await page.goto("/proyek");
  await expect(page.locator(".project-card")).toHaveCount(6);
  for (const [category, count] of [["Web Development", 2], ["IT Consulting", 1], ["Video Editing", 1], ["Graphic Design", 1], ["AI Consulting", 1]] as const) {
    await page.getByRole("button", { name: category, exact: true }).click();
    await expect(page.locator(".project-card")).toHaveCount(count);
    await expect(page.locator(".post-subtitle").first()).toHaveText(category);
  }
  await page.getByRole("textbox", { name: "Cari proyek" }).fill("tidak-ada-proyek-ini");
  await expect(page.getByRole("heading", { name: "Belum ketemu." })).toBeVisible();
  await page.getByRole("button", { name: "Tampilkan semua proyek" }).click();
  await expect(page.locator(".project-card")).toHaveCount(6);
  await page.getByRole("link", { name: "Lihat proyek Ruang Kopi, ruang untuk singgah.", exact: true }).click();
  await expect(page).toHaveURL(/\/proyek\/ruang-kopi$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ruang Kopi, ruang untuk singgah.");
  await expect(page.locator(".detail-story")).toContainText("bukan proyek klien");
  await page.getByRole("link", { name: "Kembali ke semua proyek" }).click();
  await expect(page.locator(".project-card")).toHaveCount(6);
});

test("post reactions are accessible and unknown project returns 404", async ({ page }) => {
  await page.goto("/proyek");
  const like = page.getByRole("button", { name: "Suka Portoferry. A little bit of me." });
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "false");
  const bookmark = page.getByRole("button", { name: "Tandai Portoferry. A little bit of me." });
  await bookmark.click();
  await expect(bookmark).toHaveAttribute("aria-pressed", "true");
  const response = await page.goto("/proyek/tidak-pernah-ada");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("nggak ketemu");
});

test("contact form prepares an honest brief without pretending to send it", async ({ page }) => {
  await page.goto("/#kontak");
  await page.getByRole("radio", { name: "Video Editing", exact: true }).check();
  await page.getByLabel("Nama kamu", { exact: true }).fill("Pengunjung Uji");
  await page.getByLabel("Ceritakan sedikit idemu").fill("Saya ingin mengedit video promosi berdurasi 30 detik.");
  await page.getByRole("button", { name: "Siapkan brief", exact: true }).click();
  const dialog = page.locator(".brief-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("belum ada pesan yang terkirim");
  await expect(dialog.locator("pre")).toContainText("Pengunjung Uji");
  await expect(dialog.locator("pre")).toContainText("Video Editing");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Unduh .txt" }).click();
  expect((await download).suggestedFilename()).toBe("brief-untuk-ferry.txt");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("mobile menu supports keyboard dismissal and routes without horizontal overflow", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await expect(page.locator(".mobile-menu")).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.locator(".mobile-menu")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Buka navigasi" })).toBeFocused();
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page.getByRole("navigation", { name: "Navigasi seluler" }).getByRole("link", { name: /Proyek/ }).click();
  await expect(page).toHaveURL(/\/proyek$/);
  await expect(page.locator(".mobile-menu")).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("admin removes featured controls while keeping new projects in draft for every category", async ({ page }) => {
  await page.goto("/admin/demo");
  await expect(page.getByText("Unggulan", { exact: true })).toHaveCount(0);
  await expect(page.locator(".admin-stat-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Tambah proyek", exact: true }).click();
  const editor = page.getByRole("dialog");
  const published = editor.getByRole("checkbox", { name: /^Tandai terbit/ });

  await expect(editor.getByRole("checkbox", { name: /Unggulan/ })).toHaveCount(0);
  await expect(editor.getByRole("checkbox")).toHaveCount(2);
  await expect(editor.getByRole("spinbutton", { name: /Urutan.*katalog/ })).toHaveValue("0");
  await expect(published).not.toBeChecked();
  for (const category of ["Web Development", "IT Consulting", "Video Editing", "Graphic Design", "AI Consulting"]) {
    await editor.locator("#project-category").selectOption(category);
    await expect(editor.locator("#project-category")).toHaveValue(category);
    await expect(published).not.toBeChecked();
  }
  await editor.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(editor).not.toBeVisible();
});

test("admin demo supports validated create, upload, persistent edit, and delete without public writes", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: /demo/i }).first()).toBeVisible();
  await page.goto("/admin/demo");
  await expect(page.getByText(/Mode demo.*Tersimpan di browser ini/)).toBeVisible();
  await page.getByRole("button", { name: "Tambah proyek", exact: true }).click();
  const editor = page.getByRole("dialog");
  await expect(editor).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await expect(page.getByText("Judul wajib diisi.", { exact: true })).toBeVisible();
  await editor.getByRole("textbox", { name: /^Judul proyek/ }).fill("Proyek Pengujian Otomatis");
  await editor.getByRole("textbox", { name: /^Ringkasan singkat/ }).fill("Contoh untuk memverifikasi alur admin.");
  await editor.getByRole("textbox", { name: /^Cerita proyek/ }).fill("Ini data pengujian lokal. Tidak boleh masuk ke situs publik.");
  await expect(page.locator("#project-slug")).toHaveValue("proyek-pengujian-otomatis");
  await page.locator('input[type="file"]').setInputFiles({ name: "unsafe.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') });
  await expect(page.getByText("Gunakan gambar JPG, PNG, atau WebP. SVG tidak didukung.")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/images/project-kopi.webp"));
  await expect(page.locator("#project-image-url")).toHaveValue(/^data:image\/jpeg;base64,/);
  await page.getByLabel(/Tandai terbit \(demo\)/).check();
  await page.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await expect(editor).not.toBeVisible();
  const row = page.locator(".admin-project-row").filter({ hasText: "Proyek Pengujian Otomatis" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Terbit");
  await page.reload();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit Proyek Pengujian Otomatis" }).click();
  await page.getByLabel(/Tandai terbit \(demo\)/).uncheck();
  await page.getByLabel("Judul proyek", { exact: true }).fill("Proyek Pengujian Diperbarui");
  await page.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  const updatedRow = page.locator(".admin-project-row").filter({ hasText: "Proyek Pengujian Diperbarui" });
  await expect(updatedRow).toContainText("Draft");
  await page.goto("/proyek");
  await expect(page.locator(".project-card")).toHaveCount(6);
  await expect(page.getByText("Proyek Pengujian Diperbarui")).toHaveCount(0);
  await page.goto("/admin/demo");
  await expect(updatedRow).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await updatedRow.getByRole("button", { name: "Hapus Proyek Pengujian Diperbarui" }).click();
  await expect(updatedRow).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".admin-project-row")).toHaveCount(6);
});

test("demo settings validate contact details and persist without changing public contacts", async ({ page }) => {
  await page.goto("/admin/demo");
  await page.locator("#settings-whatsapp").fill("0812");
  await page.getByRole("button", { name: "Simpan pengaturan", exact: true }).click();
  await expect(page.locator("#settings-whatsapp-error")).toContainText("7–15 digit");
  await page.locator("#settings-whatsapp").fill("6281200000000");
  await page.locator("#settings-email").fill("test@example.com");
  await page.getByRole("button", { name: "Simpan pengaturan", exact: true }).click();
  await expect(page.getByText("Pengaturan demo tersimpan di browser ini.")).toBeVisible();
  await page.reload();
  await expect(page.locator("#settings-whatsapp")).toHaveValue("6281200000000");
  await expect(page.locator("#settings-email")).toHaveValue("test@example.com");
  await page.goto("/#kontak");
  await expect(page.getByRole("button", { name: "Siapkan brief", exact: true })).toBeVisible();
});

for (const route of ["/", "/proyek", "/admin", "/admin/demo"]) {
  test(`accessibility basics: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  });
}
