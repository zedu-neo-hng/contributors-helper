import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Exercise the real chat page without Google sign-in or paid AI calls.
  await page.route('**/api/auth/session', route => route.fulfill({ json: {} }));
});

test('pasted code and line breaks reach the chat API through Send', async ({ page }) => {
  const requests: { messages: { role: string; content: string }[] }[] = [];
  await page.route('**/api/chat', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: { reply: 'Received the structured question.' } });
  });
  await page.goto('/');
  const draft = 'Please check:\n```js\nconst answer = 42;\nconsole.log(answer);\n```\n1. Reproduce\n2. Inspect the log';
  const composer = page.getByRole('textbox', { name: 'Message Zoe' });
  await composer.fill(draft);
  await expect(composer).toHaveValue(draft);
  await test.info().attach('Multiline code draft', { body: await page.screenshot(), contentType: 'image/png' });
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Received the structured question.')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].messages.at(-1)).toEqual({ role: 'user', content: draft });
  await expect(composer).toHaveValue('');
});

test('Shift+Enter adds a line, Enter sends once, and whitespace never sends', async ({ page }) => {
  const messages: string[] = [];
  await page.route('**/api/chat', async route => {
    messages.push(route.request().postDataJSON().messages.at(-1).content);
    await route.fulfill({ json: { reply: 'Keyboard submission received.' } });
  });
  await page.goto('/');
  const composer = page.getByRole('textbox', { name: 'Message Zoe' });
  await composer.fill('  \n  ');
  await composer.press('Enter');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  expect(messages).toHaveLength(0);
  await composer.fill('First line');
  await composer.press('End');
  await composer.press('Shift+Enter');
  await composer.pressSequentially('Second line');
  await expect(composer).toHaveValue('First line\nSecond line');
  expect(messages).toHaveLength(0);
  await composer.press('Enter');
  await expect(page.getByText('Keyboard submission received.')).toBeVisible();
  expect(messages).toEqual(['First line\nSecond line']);
});

test('IME confirmation and held Enter do not accidentally submit', async ({ page }) => {
  const messages: string[] = [];
  await page.route('**/api/chat', async route => {
    messages.push(route.request().postDataJSON().messages.at(-1).content);
    await route.fulfill({ json: { reply: 'IME submission received.' } });
  });
  await page.goto('/');
  const composer = page.getByRole('textbox', { name: 'Message Zoe' });
  await composer.fill('こんにちは');
  await composer.dispatchEvent('compositionstart');
  await composer.press('Enter');
  await composer.dispatchEvent('compositionend');
  await composer.dispatchEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true });
  await composer.dispatchEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true });
  await composer.dispatchEvent('keydown', { key: 'Enter', repeat: true, bubbles: true });
  expect(messages).toHaveLength(0);
  await composer.press('Enter');
  await expect(page.getByText('IME submission received.')).toBeVisible();
  expect(messages).toEqual(['こんにちは']);
});

test('pending requests cannot be duplicated and failure unlocks the composer', async ({ page }) => {
  let requestCount = 0;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/chat', async route => {
    requestCount++;
    await pending;
    await route.fulfill({ status: 500, json: { error: 'Test server unavailable' } });
  });
  await page.goto('/');
  const composer = page.getByRole('textbox', { name: 'Message Zoe' });
  const send = page.getByRole('button', { name: 'Send', exact: true });
  await composer.fill('Line one\nLine two');
  // Two submissions in one event turn exercise the synchronous request lock.
  await page.locator('form').evaluate(form => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(send).toBeDisabled();
  await expect(composer).toHaveAttribute('readonly', '');
  await composer.press('Enter');
  await expect.poll(() => requestCount).toBe(1);
  release();
  await expect(page.getByText('Error: Test server unavailable')).toBeVisible();
  await expect(composer).not.toHaveAttribute('readonly', '');
  await composer.fill('Follow-up question');
  await send.click();
  await expect.poll(() => requestCount).toBe(2);
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`long drafts stay scrollable and Send stays reachable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const composer = page.getByRole('textbox', { name: 'Message Zoe' });
    await composer.fill('Short draft');
    const compact = (await composer.boundingBox())!.height;
    await composer.fill(Array.from({ length: 60 }, (_, i) => `Log line ${i + 1}: ${'x'.repeat(100)}`).join('\n'));
    const long = (await composer.boundingBox())!;
    expect(long.height).toBeLessThanOrEqual(160);
    expect(long.height).toBeGreaterThan(compact);
    expect(await composer.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    const send = page.getByRole('button', { name: 'Send', exact: true });
    await expect(send).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await test.info().attach(`Long draft ${viewport.width}x${viewport.height}`, { body: await page.screenshot(), contentType: 'image/png' });
    await composer.fill('Short again');
    await expect.poll(async () => (await composer.boundingBox())!.height).toBe(compact);
  });
}
