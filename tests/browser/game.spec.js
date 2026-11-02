import { test, expect } from '@playwright/test';

test('create, vote, reveal, refresh, reset, and join from a second browser', async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Create New Game', exact: true })
    .click();
  await expect(page).toHaveURL(/\/game\/[a-z0-9]+$/);
  const roomURL = page.url();
  await page.getByLabel('Your name', { exact: true }).fill('Alice');
  await page.getByRole('button', { name: 'Create Game', exact: true }).click();
  await expect(page.getByText('Alice', { exact: true })).toBeVisible();
  const other = await browser.newContext();
  const bob = await other.newPage();
  try {
    await bob.goto(roomURL);
    await bob.getByLabel('Your name', { exact: true }).fill('Bob');
    await bob.getByRole('button', { name: 'Join Game', exact: true }).click();
    await expect(page.getByText('Bob', { exact: true })).toBeVisible();
    // Select the first voting card.
    await page
      .locator('button')
      .filter({ has: page.locator('[class*="votingCardEmoji"]') })
      .first()
      .click();
    await expect(
      page.getByRole('button', { name: 'Reveal Votes', exact: true }).first()
    ).toBeEnabled();
    await page
      .getByRole('button', { name: 'Reveal Votes', exact: true })
      .first()
      .click();
    await expect(
      bob.getByRole('button', { name: 'Start New Round', exact: true }).first()
    ).toBeVisible();
    await page.reload();
    await expect(page.getByText('Alice', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Your name', { exact: true })).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Start New Round', exact: true })
      .first()
      .click();
    await expect(
      bob.getByRole('button', { name: 'Reveal Votes', exact: true }).first()
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Edit your name', exact: true })
      .click();
    const nameInput = page.locator('input').first();
    await nameInput.fill('Alice renamed');
    await nameInput.press('Enter');
    await expect(bob.getByText('Alice renamed', { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByText('Alice renamed', { exact: true })
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await other.close();
  }
});
