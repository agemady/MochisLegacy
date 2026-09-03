import { expect, test } from '@playwright/test';

/** The three hero buttons and the dialog each one must open. */
const ACTIONS = [
  { button: 'I have a dog', title: 'Join with your dog', dog: true },
  { button: 'I want to volunteer', title: 'Lend a hand', dog: false },
  { button: 'I want to support', title: 'Back the mission', dog: false },
];

const KICKOFF_DOGS = [
  'Benny', 'Honey', 'Bear', 'Juni', 'Louie', 'Moss',
  'Buddy', 'Jaz', 'Mini Mochi', 'Luna',
];

test('kickoff line names the October 2 event', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/October 2/).first()).toBeVisible();
});

for (const { button, title, dog } of ACTIONS) {
  test(`"${button}" opens "${title}" and demo-submits`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: button }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: title })).toBeVisible();

    await dialog.getByLabel('Your name').fill('Test Human');
    await dialog.getByLabel('Email').fill('test@example.com');
    if (dog) await dialog.getByLabel(/Your dog.s name/).fill('Mochi');

    await dialog.locator('button[type="submit"]').click();
    await expect(dialog.getByText(/nothing was saved/i)).toBeVisible();
  });
}

test('Escape closes the signup modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'I have a dog' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('/roster lists all 11 kickoff dogs', async ({ page }) => {
  await page.goto('/roster');
  for (const name of KICKOFF_DOGS) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
  // "Juni" appears twice (two different dogs), so 10 unique names = 11 dogs.
  await expect(page.getByText('Juni', { exact: true })).toHaveCount(2);
});
