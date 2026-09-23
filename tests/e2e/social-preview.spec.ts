import { expect, test, type APIRequestContext } from "@playwright/test";
import { socialImage } from "../../src/lib/site-metadata";

const crawlers = {
  facebook: "facebookexternalhit/1.1",
  whatsapp: "WhatsApp/2.23.20.9 A",
  twitter: "Twitterbot/1.0",
} as const;

function getHead(html: string) {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0];
  expect(head, "metadata must be present in the initial head").toBeTruthy();
  return head!;
}

function getMeta(head: string, attribute: "name" | "property", value: string) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = head.match(new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${escapedValue}["'])[^>]*>`, "i"))?.[0];
  return tag?.match(/\bcontent=["']([^"']*)["']/i)?.[1];
}

async function getCrawlerHead(request: APIRequestContext, pathname: string, userAgent: string) {
  const response = await request.get(pathname, { headers: { "user-agent": userAgent } });
  expect(response.ok(), `${pathname} should be crawlable`).toBe(true);
  return getHead(await response.text());
}

function expectVersionedImage(head: string, attribute: "name" | "property", value: string) {
  const image = getMeta(head, attribute, value);
  expect(image).toBeTruthy();
  expect(new URL(image!).pathname).toBe(socialImage.url);
  return image;
}

test("browser titles consistently use pipe separators", async ({ page }) => {
  const routes = [
    ["/", "Ferry Kurniawan | Web, IT & Video | Portoferry"],
    ["/admin", "Admin | Portoferry"],
    ["/admin/demo", "Admin | Portoferry"],
    ["/layanan/web-development", "Web Development | Website yang bekerja. | Portoferry"],
    ["/layanan/video-editing", "Video Editing | Rapikan footage‑mu. | Portoferry"],
    ["/layanan/it-consulting", "IT Consulting | Tentukan langkahnya. | Portoferry"],
    ["/proyek", "Proyek & Eksplorasi | Portoferry"],
    ["/proyek/ruang-kopi", "Ruang Kopi, ruang untuk singgah. | Portoferry"],
    ["/proyek/contoh-artikel-brief-website", "Contoh artikel: menyiapkan brief website. | Portoferry"],
  ];

  for (const [pathname, title] of routes) {
    await page.goto(pathname);
    await expect(page).toHaveTitle(title);
  }
});

test("homepage exposes OG and Twitter metadata in the initial crawler head", async ({ request }) => {
  for (const [crawler, userAgent] of Object.entries(crawlers)) {
    const head = await getCrawlerHead(request, "/", userAgent);
    expect(getMeta(head, "property", "og:title"), crawler).toBe("Ferry Kurniawan | Website Optimal, Bisnis Maksimal.");
    expect(getMeta(head, "property", "og:description"), crawler).toContain("Web Development");
    const ogImage = expectVersionedImage(head, "property", "og:image");
    expect(getMeta(head, "name", "twitter:card"), crawler).toBe("summary_large_image");
    expect(getMeta(head, "name", "twitter:title"), crawler).toBe("Ferry Kurniawan | Website Optimal, Bisnis Maksimal.");
    expect(getMeta(head, "name", "twitter:description"), crawler).toContain("Web Development");
    expect(getMeta(head, "name", "twitter:image"), crawler).toBe(ogImage);
  }
});

test("service pages expose the current versioned image to OG and Twitter crawlers", async ({ request }) => {
  for (const [slug, title] of [["web-development", "Web Development"], ["video-editing", "Video Editing"], ["it-consulting", "IT Consulting"]]) {
    for (const [crawler, userAgent] of Object.entries(crawlers)) {
      const head = await getCrawlerHead(request, `/layanan/${slug}`, userAgent);
      expect(getMeta(head, "property", "og:title"), crawler).toBe(`${title} | Portoferry`);
      const description = getMeta(head, "property", "og:description");
      expect(description, crawler).toBeTruthy();
      const ogImage = expectVersionedImage(head, "property", "og:image");
      expect(getMeta(head, "name", "twitter:card"), crawler).toBe("summary_large_image");
      expect(getMeta(head, "name", "twitter:title"), crawler).toBe(`${title} | Portoferry`);
      expect(getMeta(head, "name", "twitter:description"), crawler).toBe(description);
      expect(getMeta(head, "name", "twitter:image"), crawler).toBe(ogImage);
    }
  }
});

test("project pages retain project-specific OG and Twitter metadata", async ({ request }) => {
  for (const [crawler, userAgent] of Object.entries(crawlers)) {
    const head = await getCrawlerHead(request, "/proyek/ruang-kopi", userAgent);
    expect(getMeta(head, "property", "og:title"), crawler).toBe("Ruang Kopi, ruang untuk singgah.");
    expect(getMeta(head, "property", "og:description"), crawler).toContain("Eksplorasi website kedai kopi");
    const ogImage = getMeta(head, "property", "og:image");
    expect(ogImage, crawler).toContain("/images/project-kopi.webp");
    expect(ogImage).not.toContain(socialImage.url);
    expect(getMeta(head, "name", "twitter:card"), crawler).toBe("summary_large_image");
    expect(getMeta(head, "name", "twitter:title"), crawler).toBe("Ruang Kopi, ruang untuk singgah.");
    expect(getMeta(head, "name", "twitter:description"), crawler).toContain("Eksplorasi website kedai kopi");
    expect(getMeta(head, "name", "twitter:image"), crawler).toBe(ogImage);
  }
});
