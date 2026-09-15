import { expect, test } from '@playwright/test';

test('submits, advances, and reloads an IT request', async ({ page }) => {
  const title = `Browser E2E IT request ${Date.now()}`;
  const requestCard = () => page.locator('article.request-item').filter({ hasText: title });

  await page.goto('/');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill('Browser E2E persistence check.');
  await page.getByLabel('Department').selectOption('IT');
  await page.getByRole('button', { name: 'Submit request' }).click();

  await expect(requestCard()).toHaveCount(1);
  await expect(requestCard().getByText('Submitted', { exact: true })).toBeVisible();

  await page.getByLabel('Local-development teaching actor').selectOption('it-staff-001');
  await requestCard().getByRole('button', { name: 'Move to In Progress' }).click();
  await expect(requestCard().getByText('In Progress', { exact: true })).toBeVisible();

  await page.reload();
  await expect(requestCard().getByText('In Progress', { exact: true })).toBeVisible();
});