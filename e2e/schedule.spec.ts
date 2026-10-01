import { expect, test, type Locator, type Page } from '@playwright/test';

// /schedule against the in-memory demo world (src/lib/demo.ts); every test gets a
// fresh page load, so the demo resets: Sam Rivera has Benny and Honey, the kickoff
// walk (tomorrow) has 5 of 15 in, and the next walk (cap 4) is full with 1 waitlisted.
const OWNER = '00000000000000000000000000000001';
const ADMIN = '0000000000000000000000000000000a';

test.use({ viewport: { width: 390, height: 844 } });

const kickoff = (page: Page) => page.getByRole('article', { name: 'Kickoff gaggle walk' });
const nextWalk = (page: Page) => page.getByRole('article', { name: 'Gaggle walk', exact: true });
const dogRow = (card: Locator, dog: string) => card.getByRole('group', { name: dog });

test('public view lists upcoming walks and the interest CTA', async ({ page }) => {
  await page.goto('/schedule');
  await expect(page.getByRole('heading', { level: 1, name: 'Gaggle walks' })).toBeVisible();

  await expect(kickoff(page)).toBeVisible();
  await expect(kickoff(page).getByText('10 of 15 spots open')).toBeVisible();
  await expect(kickoff(page).getByText('Bring a leash, water, and poop bags.')).toBeVisible();
  await expect(kickoff(page).getByRole('link', { name: /Foothills Community Park, Shelter A/ })).toHaveAttribute(
    'href',
    'https://www.google.com/maps/search/?api=1&query=Foothills%20Community%20Park%2C%20Shelter%20A',
  );
  await expect(nextWalk(page).getByText('Full · waitlist open')).toBeVisible();

  // No personal link: no sign-up controls, just the way in.
  await expect(page.getByRole('button', { name: /Sign up/ })).toHaveCount(0);
  await expect(page.getByText('Already on the roster?')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tell us about your dog' })).toHaveAttribute('href', '/#dog');
});

test('owner signs a dog up and sees the confirmed state', async ({ page }) => {
  await page.goto(`/schedule#k=${OWNER}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Hi, Sam' })).toBeVisible();
  // The key leaves the address bar on first load.
  await expect(page).not.toHaveURL(/#k=/);

  const benny = dogRow(kickoff(page), 'Benny');
  await benny.getByRole('button', { name: /Sign up/ }).click();

  // The waiver is required.
  await benny.getByRole('button', { name: "Save Benny's spot" }).click();
  await expect(benny.getByText('Please check the waiver box')).toBeVisible();

  await benny.getByLabel('I agree to the walk waiver for this outing').check();
  await benny.getByLabel("It's OK to include my dog in group photos").check();
  await benny.getByRole('button', { name: "Save Benny's spot" }).click();

  await expect(benny.getByText(/^You're walking! Benny is in for [A-Z][a-z]{2} \d{1,2}\.$/)).toBeVisible();
  await expect(kickoff(page).getByText("You're set. See you there!")).toBeVisible();
  await expect(kickoff(page).getByText('9 of 15 spots open')).toBeVisible();
  // Each dog is managed on its own: Honey is untouched.
  await expect(dogRow(kickoff(page), 'Honey').getByText('Not signed up yet')).toBeVisible();
});

test('owner joins a full walk and sees the waitlist position', async ({ page }) => {
  await page.goto(`/schedule#k=${OWNER}`);
  const honey = dogRow(nextWalk(page), 'Honey');
  await honey.getByRole('button', { name: /Join waitlist/ }).click();
  await honey.getByLabel('I agree to the walk waiver for this outing').check();
  await honey.getByRole('button', { name: 'Join the waitlist' }).click();

  await expect(
    honey.getByText("Honey is #2 on the waitlist. We'll move you up automatically if a spot opens."),
  ).toBeVisible();
  await expect(honey.getByRole('button', { name: "Can't make it?" })).toBeVisible();
  await expect(nextWalk(page).getByText('Full · waitlist open')).toBeVisible();
});

test('owner opts out with a confirm step', async ({ page }) => {
  await page.goto(`/schedule#k=${OWNER}`);
  const benny = dogRow(kickoff(page), 'Benny');
  await benny.getByRole('button', { name: /Sign up/ }).click();
  await benny.getByLabel('I agree to the walk waiver for this outing').check();
  await benny.getByRole('button', { name: "Save Benny's spot" }).click();
  await expect(benny.getByText(/You're walking!/)).toBeVisible();

  await benny.getByRole('button', { name: "Can't make it?" }).click();
  await benny.getByRole('button', { name: "Tap again to give up Benny's spot" }).click();

  await expect(benny.getByText('No worries, Benny is off this one. See you next time!')).toBeVisible();
  await expect(benny.getByRole('button', { name: /Sign up/ })).toBeVisible();
  await expect(kickoff(page).getByText('10 of 15 spots open')).toBeVisible();
});

test('a bad link explains itself and can be forgotten', async ({ page }) => {
  await page.goto('/schedule#k=ffffffffffffffffffffffffffffffff');
  await expect(page.getByText("This link isn't valid. Ask a founder for a fresh one.")).toBeVisible();
  await expect(kickoff(page)).toBeVisible();
  await page.getByRole('button', { name: 'Forget this link' }).click();
  await expect(page.getByText("This link isn't valid.")).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Gaggle walks' })).toBeVisible();
});

test('admins get a way to the walk-day tools', async ({ page }) => {
  await page.goto(`/schedule#k=${ADMIN}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Hi, Founder' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open walk-day tools/ })).toHaveAttribute('href', '/checkin');
  await expect(dogRow(kickoff(page), 'Luna').getByText('Walking · spot saved')).toBeVisible();
});
