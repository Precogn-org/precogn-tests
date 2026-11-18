const { test, expect } = require('@playwright/test');

const baseURL = process.env.ANALYZOR_BASE_URL;

test.skip(!baseURL, 'Test actif uniquement quand ANALYZOR_BASE_URL pointe vers Analyzor');

test('la route de contexte LlmPrecogn refuse une requête sans clé dédiée', async ({ request }) => {
  const response = await request.get(baseURL + '/api/org/watchdog-probe/llm-context');
  expect(response.status()).toBe(401);
});

test('la route de téléchargement Own Storage refuse une requête sans clé de service', async ({ request }) => {
  const response = await request.get(baseURL + '/api/org/watchdog-probe/storage/file?fileId=watchdog-probe');
  expect(response.status()).toBe(401);
});
