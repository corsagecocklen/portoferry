import { expect, test } from "@playwright/test";

test("demo settings accepts Indonesian WhatsApp formats and rejects malformed input", async ({ page }) => {
  await page.goto("/admin/demo");

  const whatsapp = page.locator("#settings-whatsapp");
  await expect(whatsapp).toHaveAttribute("type", "tel");
  await expect(whatsapp).toHaveAttribute("inputmode", "tel");
  await expect(page.locator("#settings-whatsapp-help")).toContainText("08...");
  await expect(page.locator("#settings-whatsapp-help")).toContainText("tanpa tanda +");

  await whatsapp.fill("0812 0000 0000");
  await page.getByRole("button", { name: "Simpan pengaturan", exact: true }).click();
  await expect(page.getByText("Pengaturan demo tersimpan di browser ini.")).toBeVisible();
  await expect(whatsapp).toHaveValue("6281200000000");

  await whatsapp.fill("+62 812-0000-0000");
  await page.getByRole("button", { name: "Simpan pengaturan", exact: true }).click();
  await expect(whatsapp).toHaveValue("6281200000000");

  await whatsapp.fill("+62 (0)812-0000-0000");
  await page.getByRole("button", { name: "Simpan pengaturan", exact: true }).click();
  await expect(whatsapp).toHaveValue("6281200000000");

  await whatsapp.fill("62+812-0000-0000");
  await page.getByRole("button", { name: "Simpan pengaturan", exact: true }).click();
  await expect(page.locator("#settings-whatsapp-error")).toContainText("7–15 digit");
  await expect(whatsapp).toHaveValue("62+812-0000-0000");
});

test("demo settings persist the canonical number without changing public data", async ({ page }) => {
  await page.goto("/admin/demo");

  const whatsapp = page.locator("#settings-whatsapp");
  await whatsapp.fill("+1 (202) 555-0100");
  await page.getByRole("button", { name: "Simpan pengaturan", exact: true }).click();
  await expect(page.getByText("Pengaturan demo tersimpan di browser ini.")).toBeVisible();
  await expect(whatsapp).toHaveValue("12025550100");

  await page.reload();
  await expect(page.locator("#settings-whatsapp")).toHaveValue("12025550100");

  await page.goto("/#kontak");
  await expect(page.getByRole("button", { name: "Siapkan brief", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("12025550100");
});

test("demo waits for stored settings before accepting edits, then persists a different number", async ({ page }) => {
  await page.addInitScript(() => {
    const key = "portoferry-admin-demo-v1";
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      projects: [],
      settings: { whatsapp: "6281200000000", email: "", instagram: "", available: true },
    }));
  });

  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve; });
  await page.route("**/_next/static/**/*.js", async route => {
    await scriptsReady;
    await route.continue();
  });

  const whatsapp = page.locator("#settings-whatsapp");
  try {
    await page.goto("/admin/demo", { waitUntil: "commit" });
    await expect(whatsapp).toBeDisabled();
    await expect(page.getByRole("button", { name: "Simpan pengaturan", exact: true })).toBeDisabled();
  } finally {
    releaseScripts();
  }
  await expect(whatsapp).toBeEnabled();
  await expect(whatsapp).toHaveValue("6281200000000");
  await whatsapp.fill("0813 0000 0000");
  await page.getByRole("button", { name: "Simpan pengaturan", exact: true }).click();
  await expect(whatsapp).toHaveValue("6281300000000");
  await page.reload();
  await expect(whatsapp).toHaveValue("6281300000000");
});
