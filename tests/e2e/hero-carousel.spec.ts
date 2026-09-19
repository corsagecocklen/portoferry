import { expect, test } from "@playwright/test";

const slides = [
  { label: "Perkenalan", heading: "Website siap.Bisnis jalan.", cta: "Ceritakan idemu", href: "#kontak" },
  { label: "Web Development", heading: "Dari ide,jadi website.", cta: "Lihat layanan web", href: "/layanan/web-development" },
  { label: "Video Editing", heading: "Footage ada.Saatnya tayang.", cta: "Lihat layanan video", href: "/layanan/video-editing" },
  { label: "IT Consulting", heading: "Rapikan IT,fokus kerja.", cta: "Bahas urusan IT", href: "/layanan/it-consulting" },
] as const;

test("all four hero slides have distinct copy and working service links", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const carousel = page.locator(".hero-carousel");
  await expect(carousel.getByRole("group", { name: "Pilih slide", exact: true }).getByRole("button")).toHaveCount(4);

  for (const [index, slide] of slides.entries()) {
    const picker = carousel.getByRole("button", { name: `Slide ${index + 1}: ${slide.label}`, exact: true });
    await picker.click();
    await expect(picker).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(slide.heading);
    await expect(carousel.getByRole("link", { name: slide.cta, exact: true })).toHaveAttribute("href", slide.href);
  }

  await expect(carousel.getByRole("img", { name: "Ferry Kurniawan untuk konsultasi IT" })).toHaveCount(1);
  await carousel.getByRole("link", { name: "Bahas urusan IT", exact: true }).click();
  await expect(page).toHaveURL(/\/layanan\/it-consulting$/);
  await expect(page.getByRole("radio", { name: "IT Consulting", exact: true })).toBeChecked();
});

test("previous and next controls wrap and keep a manually selected slide paused", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  const carousel = page.locator(".hero-carousel");
  await carousel.getByRole("button", { name: "Slide sebelumnya", exact: true }).click();
  await expect(carousel).toHaveAttribute("data-active-slide", "4");
  await carousel.getByRole("button", { name: "Slide berikutnya", exact: true }).click();
  await expect(carousel).toHaveAttribute("data-active-slide", "1");
  await page.mouse.move(0, 0);
  await page.clock.fastForward(24_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "1");
  await expect(carousel).toHaveAttribute("data-rotating", "false");
});

test("autoplay rotates after eight seconds and can be paused and resumed", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const carousel = page.locator(".hero-carousel");
  await page.mouse.move(0, 0);
  await expect(carousel).toHaveAttribute("data-rotating", "true");
  await page.clock.fastForward(8_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "2");
  await carousel.getByRole("button", { name: "Jeda pergantian otomatis", exact: true }).click();
  await page.mouse.move(0, 0);
  await expect(carousel).toHaveAttribute("data-rotating", "false");
  await page.clock.fastForward(24_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "2");
  await carousel.getByRole("button", { name: "Mulai pergantian otomatis", exact: true }).click();
  await page.mouse.move(0, 0);
  await expect(carousel).toHaveAttribute("data-rotating", "true");
  await page.clock.fastForward(8_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "3");
});

test("hover pauses temporarily and keyboard focus stops autoplay until resumed", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const carousel = page.locator(".hero-carousel");
  await expect(carousel).toHaveAttribute("data-rotating", "true");
  await carousel.getByRole("heading", { level: 1 }).hover();
  await expect(carousel).toHaveAttribute("data-rotating", "false");
  await page.clock.fastForward(16_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "1");
  await page.mouse.move(0, 0);
  await expect(carousel).toHaveAttribute("data-rotating", "true");
  await carousel.getByRole("link", { name: "Ceritakan idemu" }).focus();
  await expect(carousel).toHaveAttribute("data-rotating", "false");
  await page.getByRole("link", { name: "Portoferry, beranda" }).first().focus();
  await page.clock.fastForward(16_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "1");
});

test("reduced motion keeps the first slide still and all slides fit narrow screens", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const carousel = page.locator(".hero-carousel");
  await expect(carousel).toHaveAttribute("data-rotating", "false");
  await page.clock.fastForward(32_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "1");

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [index, slide] of slides.entries()) {
      await carousel.getByRole("button", { name: `Slide ${index + 1}: ${slide.label}`, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const bounds = await carousel.locator(".hero-carousel-controls").boundingBox();
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      const heading = carousel.getByRole("heading", { level: 1 });
      expect(await heading.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
  }
});
