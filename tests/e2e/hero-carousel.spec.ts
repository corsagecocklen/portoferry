import { expect, test, type Page } from "@playwright/test";

const slides = [
  { label: "Perkenalan", heading: "Website siap.Bisnis jalan.", cta: "Ceritakan idemu", href: "#kontak" },
  { label: "Web Development", heading: "Dari ide,jadi website.", cta: "Lihat layanan web", href: "/layanan/web-development" },
  { label: "Video Editing", heading: "Footage ada.Saatnya tayang.", cta: "Lihat layanan video", href: "/layanan/video-editing" },
  { label: "IT Consulting", heading: "Rapikan IT,fokus kerja.", cta: "Bahas urusan IT", href: "/layanan/it-consulting" },
] as const;

async function loadWithPausedClock(page: Page, reducedMotion: "reduce" | "no-preference" = "no-preference") {
  await page.clock.install({ time: new Date("2026-09-19T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-19T01:00:00Z"));
  await page.emulateMedia({ reducedMotion });
  await page.goto("/");
  const carousel = page.locator(".hero-carousel");
  await expect(carousel).toHaveAttribute("data-rotating", String(reducedMotion !== "reduce"));
  return carousel;
}

test("all four hero slides share one photo with distinct copy and working service links", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const carousel = page.locator(".hero-carousel");
  await expect(carousel.getByRole("group", { name: "Pilih slide", exact: true }).getByRole("button")).toHaveCount(4);
  await expect(carousel.getByRole("img")).toHaveCount(1);
  const portrait = carousel.getByRole("img", { name: "Ferry Kurniawan", exact: true });
  await expect(portrait).toHaveAttribute("src", /ferry-landing\.webp/);
  const imageSource = await portrait.getAttribute("src");
  await expect(carousel.getByRole("button", { name: /pergantian otomatis/ })).toHaveCount(0);
  await expect(carousel.locator(".lucide-play, .lucide-pause")).toHaveCount(0);

  for (const [index, slide] of slides.entries()) {
    const picker = carousel.getByRole("button", { name: `Slide ${index + 1}: ${slide.label}`, exact: true });
    await picker.click();
    await expect(picker).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(slide.heading);
    await expect(carousel.getByRole("link", { name: slide.cta, exact: true })).toHaveAttribute("href", slide.href);
    await expect(carousel.getByRole("img")).toHaveCount(1);
    await expect(portrait).toHaveAttribute("src", imageSource!);
  }

  await carousel.getByRole("link", { name: "Bahas urusan IT", exact: true }).click();
  await expect(page).toHaveURL(/\/layanan\/it-consulting$/);
  await expect(page.getByRole("radio", { name: "IT Consulting", exact: true })).toBeChecked();
});

test("arrows wrap between slides and keep autoplay stopped after manual navigation", async ({ page }) => {
  const carousel = await loadWithPausedClock(page);
  await carousel.getByRole("button", { name: "Slide sebelumnya", exact: true }).click();
  await expect(carousel).toHaveAttribute("data-active-slide", "4");
  await expect(carousel).toHaveAttribute("data-rotating", "false");
  await carousel.getByRole("button", { name: "Slide berikutnya", exact: true }).click();
  await expect(carousel).toHaveAttribute("data-active-slide", "1");
  await page.mouse.move(0, 0);
  await page.getByRole("link", { name: "Portoferry, beranda" }).first().focus();
  await expect(carousel).toHaveAttribute("data-rotating", "false");
  await expect(carousel.locator("#hero-slide")).toHaveAttribute("aria-live", "polite");
  await page.clock.fastForward(12_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "1");
  await page.locator("#kontak").scrollIntoViewIfNeeded();
  await carousel.scrollIntoViewIfNeeded();
  await page.clock.fastForward(6_000);
  await expect(carousel).toHaveAttribute("data-rotating", "false");
  await expect(carousel).toHaveAttribute("data-active-slide", "1");
  await carousel.getByRole("button", { name: "Slide berikutnya", exact: true }).click();
  await expect(carousel).toHaveAttribute("data-active-slide", "2");
  await page.clock.fastForward(6_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "2");
});

test("desktop autoplay advances every three seconds even with the pointer over the hero", async ({ page }) => {
  const carousel = await loadWithPausedClock(page);
  await carousel.hover();
  await expect(carousel).toHaveAttribute("data-rotating", "true");

  for (const [current, next] of [[1, 2], [2, 3], [3, 4], [4, 1]]) {
    await page.clock.fastForward(2_999);
    await expect(carousel).toHaveAttribute("data-active-slide", String(current));
    await page.clock.fastForward(1);
    await expect(carousel).toHaveAttribute("data-active-slide", String(next));
  }
});

test("keyboard focus still pauses autoplay until focus leaves without selecting a slide", async ({ page }) => {
  const carousel = await loadWithPausedClock(page);
  await page.keyboard.press("Tab");
  await carousel.getByRole("link", { name: "Ceritakan idemu" }).focus();
  await expect(carousel).toHaveAttribute("data-rotating", "false");
  await page.clock.fastForward(9_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "1");
  await page.getByRole("link", { name: "Portoferry, beranda" }).first().focus();
  await expect(carousel).toHaveAttribute("data-rotating", "true");
  await page.clock.fastForward(3_000);
  await expect(carousel).toHaveAttribute("data-active-slide", "2");
});

test("slides crossfade in a stable layout and inactive links stay out of keyboard navigation", async ({ page }) => {
  const carousel = await loadWithPausedClock(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(carousel.locator(".hero-slide-content")).toHaveCount(4);

  for (const width of [320, 390, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const controlsBefore = await carousel.locator(".hero-carousel-controls").boundingBox();
    const heightBefore = (await carousel.boundingBox())!.height;
    for (const [index, slide] of slides.entries()) {
      await carousel.getByRole("button", { name: `Slide ${index + 1}: ${slide.label}`, exact: true }).click();
      const active = carousel.locator('.hero-slide-content[data-active="true"]');
      const inactive = carousel.locator('.hero-slide-content[data-active="false"]');
      await expect(active).toHaveCount(1);
      await expect(inactive).toHaveCount(3);
      expect(await inactive.evaluateAll(elements => elements.every(element => element.hasAttribute("inert") && element.getAttribute("aria-hidden") === "true"))).toBe(true);
      expect(await active.evaluate(element => getComputedStyle(element).transitionProperty)).toContain("opacity");
      expect((await carousel.locator(".hero-carousel-controls").boundingBox())!.y).toBeCloseTo(controlsBefore!.y, 0);
      expect((await carousel.boundingBox())!.height).toBeCloseTo(heightBefore, 0);
    }
  }

  await carousel.getByRole("link", { name: "Bahas urusan IT", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(carousel.getByRole("link", { name: "Lihat hasil kerja", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(carousel.getByRole("button", { name: "Slide 1: Perkenalan", exact: true })).toBeFocused();
});

test.describe("touch navigation", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("mobile autoplay works until a slide is chosen, then stays stopped", async ({ page }) => {
    const carousel = await loadWithPausedClock(page);
    await page.clock.fastForward(3_000);
    await expect(carousel).toHaveAttribute("data-active-slide", "2");
    await carousel.getByRole("button", { name: "Slide 3: Video Editing", exact: true }).tap();
    await expect(carousel).toHaveAttribute("data-active-slide", "3");
    await expect(carousel).toHaveAttribute("data-rotating", "false");
    await page.clock.fastForward(9_000);
    await expect(carousel).toHaveAttribute("data-active-slide", "3");
    await carousel.getByRole("button", { name: "Slide berikutnya", exact: true }).tap();
    await page.clock.fastForward(9_000);
    await expect(carousel).toHaveAttribute("data-active-slide", "4");
  });
});

test("reduced motion keeps the first slide still and all slides fit narrow screens", async ({ page }) => {
  const carousel = await loadWithPausedClock(page, "reduce");
  await expect(carousel).toHaveAttribute("data-rotating", "false");
  expect(await carousel.locator('.hero-slide-content[data-active="true"]').evaluate(element => getComputedStyle(element).transitionProperty)).toBe("none");
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
