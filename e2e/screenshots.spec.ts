import { mkdirSync } from 'node:fs';
import { test } from '@playwright/test';

/** Full-page review shots, written to .scratch/shots (never committed). */
const DIR = '.scratch/shots';
mkdirSync(DIR, { recursive: true });

async function snap(page: import('@playwright/test').Page, file: string) {
  await page.screenshot({ path: `${DIR}/${file}`, fullPage: true });
}

test('home at 390x844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await snap(page, 'home-390.png');
});

test('home at 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await snap(page, 'home-1280.png');
});

test('roster at 390x844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/roster');
  await snap(page, 'roster-390.png');
});

const MODALS = [
  { button: 'I have a dog', file: 'modal-dog-390.png' },
  { button: 'I want to volunteer', file: 'modal-volunteer-390.png' },
  { button: 'I want to support', file: 'modal-pledge-390.png' },
];

for (const { button, file } of MODALS) {
  test(`modal "${button}" at 390x844`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: button }).click();
    await page.getByRole('dialog').waitFor();
    await snap(page, file);
  });
}
