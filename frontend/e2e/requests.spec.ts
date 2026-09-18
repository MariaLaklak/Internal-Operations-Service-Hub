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

test('reviews AI intake advice before submitting an IT request', async ({ page }) => {
  const originalDescription = 'My company laptop cannot connect to the VPN.';
  await page.goto('/');
  const beforeAdviceCount = await page.getByRole('article').count();

  await page.getByLabel('Description').fill(originalDescription);
  await page.getByLabel('This request requires approval').check();
  await page.getByRole('button', { name: 'Get AI intake advice' }).click();

  const adviceCard = page.getByRole('region', { name: 'AI intake advice' });
  await expect(adviceCard).toBeVisible();
  await expect(adviceCard.getByText('Suggested title', { exact: true })).toBeVisible();
  await expect(adviceCard.getByText('Suggested department', { exact: true })).toBeVisible();
  await expect(adviceCard.getByText('Summary', { exact: true })).toBeVisible();
  await expect(adviceCard.getByText('Missing information', { exact: true })).toBeVisible();
  await expect(adviceCard.getByText('Suggested next step', { exact: true })).toBeVisible();
  await expect(adviceCard.getByText('IT', { exact: true })).toBeVisible();

  const adviceDefinitions = adviceCard.getByRole('definition');
  const suggestedTitle = (await adviceDefinitions.nth(0).textContent())?.trim() ?? '';
  const summary = (await adviceDefinitions.nth(2).textContent())?.trim() ?? '';
  const nextStep = (await adviceDefinitions.nth(4).textContent())?.trim() ?? '';
  expect(suggestedTitle).not.toBe('');
  expect(summary).not.toBe('');
  expect(nextStep).not.toBe('');

  await page.getByRole('button', { name: 'Use suggestion' }).click();
  await expect(page.getByLabel('Title')).toHaveValue(suggestedTitle);
  await expect(page.getByLabel('Department')).toHaveValue('IT');
  await expect(page.getByLabel('Description')).toHaveValue(originalDescription);
  await expect(page.getByLabel('This request requires approval')).toBeChecked();
  await expect(page.getByRole('article')).toHaveCount(beforeAdviceCount);

  await page.getByRole('button', { name: 'Submit request' }).click();

  const requestCard = page.getByRole('article').filter({ hasText: suggestedTitle });
  await expect(requestCard).toHaveCount(1);
  await expect(requestCard.getByText('Submitted', { exact: true })).toBeVisible();
  await expect(requestCard.getByText(originalDescription, { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('article').filter({ hasText: suggestedTitle })).toHaveCount(1);
});