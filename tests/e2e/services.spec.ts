import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { demoProjects } from "../../src/lib/demo-data";

const serviceRoutes = [
  { slug: "web-development", title: "Web Development" },
  { slug: "video-editing", title: "Video Editing" },
  { slug: "it-consulting", title: "IT Consulting" },
] as const;

for (const service of serviceRoutes) {
  test(`${service.title} page has its own metadata, scope, and project context`, async ({ page }) => {
    const response = await page.goto(`/layanan/${service.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(service.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/layanan/${service.slug}$`));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.getByRole("heading", { name: "Ruang kerja yang jelas dari awal." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Begini cara kita bekerja." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pertanyaan yang wajar." })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(service.title.toUpperCase());
    await expect(page.getByRole("link", { name: "Kembali ke semua layanan" })).toHaveAttribute("href", "/#layanan");
  });
}

test("service pages link to each other and preselect the contextual contact category", async ({ page }) => {
  for (const service of serviceRoutes) {
    await page.goto(`/layanan/${service.slug}`);
    for (const other of serviceRoutes.filter((item) => item.slug !== service.slug)) {
      await expect(page.getByRole("navigation", { name: "Layanan lainnya" }).getByRole("link", { name: other.title, exact: true })).toHaveAttribute("href", `/layanan/${other.slug}`);
    }
    await expect(page.getByRole("radio", { name: service.title, exact: true })).toBeChecked();
  }
});

test("service contact form prepares an honest, contextual brief", async ({ page }) => {
  await page.goto("/layanan/video-editing#kontak");
  await expect(page.getByRole("radio", { name: "Video Editing", exact: true })).toBeChecked();
  await page.getByLabel("Nama kamu", { exact: true }).fill("Pengunjung Layanan");
  await page.getByLabel("Ceritakan sedikit idemu").fill("Saya punya footage promosi dan ingin versi vertikal untuk Reels.");
  await page.getByRole("button", { name: "Siapkan brief", exact: true }).click();
  const dialog = page.locator(".brief-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("pre")).toContainText("Video Editing");
  await expect(dialog.locator("pre")).toContainText("footage promosi");
  await expect(dialog).toContainText("belum ada pesan yang terkirim");
});

test("unknown service slug returns 404", async ({ page }) => {
  const response = await page.goto("/layanan/tidak-ada");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("nggak ketemu");
});

test("client-side service navigation resets the brief to the new service", async ({ page }) => {
  await page.goto("/layanan/web-development");
  await page.getByRole("radio", { name: "Graphic Design", exact: true }).check();
  for (const service of [serviceRoutes[1], serviceRoutes[2], serviceRoutes[0]]) {
    await page.getByRole("navigation", { name: "Layanan lainnya" }).getByRole("link", { name: service.title, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/layanan/${service.slug}$`));
    await expect(page.getByRole("radio", { name: service.title, exact: true })).toBeChecked();
    await expect(page.locator(".header-cta")).toHaveAttribute("href", "#kontak");
  }
});

test("service links are reachable from landing cards, footer, and sitemap", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator(".service-title h3")).toHaveText(serviceRoutes.map(service => service.title));
  await expect(page.locator(".service-number")).toHaveText(["/01", "/02", "/03"]);
  for (const service of serviceRoutes) {
    await expect(page.locator(".service-list").getByRole("link", { name: service.title, exact: true })).toHaveAttribute("href", `/layanan/${service.slug}`);
    await expect(page.getByRole("navigation", { name: "Halaman layanan" }).getByRole("link", { name: service.title, exact: true })).toHaveAttribute("href", `/layanan/${service.slug}`);
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const service of serviceRoutes) expect(xml).toContain(`/layanan/${service.slug}</loc>`);
});

for (const service of serviceRoutes) {
  test(`${service.title} is responsive and passes accessibility basics`, async ({ page }) => {
    await page.goto(`/layanan/${service.slug}`);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
    const expectedProjects = demoProjects.filter(project => project.published && project.category === service.title);
    await expect(page.locator(".project-card")).toHaveCount(expectedProjects.length);
    for (const project of expectedProjects) {
      const card = page.locator(".project-card").filter({ has: page.getByRole("link", { name: `Lihat proyek ${project.title}`, exact: true }) });
      if (project.is_concept) await expect(card).toContainText("Studi konsep");
      else await expect(card).not.toContainText("Studi konsep");
    }
  });
}
