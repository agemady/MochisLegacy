import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

test("render public/og.png at 1200x630", async ({ page }) => {
  const html = pathToFileURL(path.resolve("scripts/og.html")).href;
  const out = path.resolve("public/og.png");

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(html);

  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: 1200, height: 630 },
    scale: "css",
  });
  fs.writeFileSync(out, buf);

  expect(buf.readUInt32BE(16)).toBe(1200);
  expect(buf.readUInt32BE(20)).toBe(630);
});
