// Module THE FACTORY (7e module, pas une déclinaison -- correction larose75 08/11/2026). Page
// vitrine precogn.org/thefactory/ (paiement réel Stripe, jamais testée automatiquement : on
// vérifie seulement sa présence) et démo publique structory.ai/thefactory/demo/, parcours fictif
// explicitement marqué "SAMPLE"/"No payment, nothing sent or stored" -- aucune donnée réelle,
// aucun paiement déclenché par ces tests.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal, texteMelange } = require('../helpers');

test.describe('THE FACTORY — page vitrine', () => {
  test('precogn.org/thefactory/ charge et propose un lien de paiement', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    const reponse = await page.goto('https://precogn.org/thefactory/');
    expect(reponse.status(), 'code HTTP').toBeLessThan(400);
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
    const lienPaiement = page.getByRole('link', { name: /Enroll/i }).first();
    await expect(lienPaiement).toBeVisible();
    await expect(lienPaiement).toHaveAttribute('href', /^https:\/\/buy\.stripe\.com\//);
  });

  test('structory.ai/thefactory (sans /demo/) répond 404 -- pas de page fantôme', async ({ page }) => {
    const reponse = await page.goto('https://structory.ai/thefactory', { waitUntil: 'load' });
    expect(reponse.status()).toBe(404);
  });

  test('aucun débordement horizontal à 390 px', async ({ page }) => {
    await page.goto('https://precogn.org/thefactory/');
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
  });
});

test.describe('THE FACTORY — démo publique (parcours fictif, sans paiement)', () => {
  const URL_DEMO = 'https://structory.ai/thefactory/demo/';

  test('charge sans erreur console', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    const reponse = await page.goto(URL_DEMO);
    expect(reponse.status(), 'code HTTP').toBeLessThan(400);
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
  });

  test('aucun débordement horizontal à 390 px', async ({ page }) => {
    await page.goto(URL_DEMO);
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
  });

  test('texte EN non mélangé avec du français (langue de départ EN, comme sign/<jeton>)', async ({ page }) => {
    await page.goto(URL_DEMO);
    const texte = await page.locator('body').innerText();
    expect(texteMelange(texte, 'en'), 'texte français inattendu dans la démo EN').toBe(false);
  });

  test('FR : aucun débordement et langue correcte via /fr/thefactory/demo/', async ({ page }) => {
    await page.goto('https://structory.ai/fr/thefactory/demo/');
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
    const texte = await page.locator('body').innerText();
    expect(texteMelange(texte, 'fr'), 'texte anglais inattendu dans la démo FR').toBe(false);
  });

  test('action clé : parcours Sign up → Agreement (case puis Sign) → Activation, jamais de paiement réel', async ({ page }) => {
    await page.goto(URL_DEMO);
    await page.getByRole('button', { name: 'Sign up (demo)' }).click();
    await page.getByText('Student partnership agreement').first().waitFor({ timeout: 10000 });
    await expect(page.getByText('SAMPLE', { exact: false }).first()).toBeVisible();

    const bouton = page.getByRole('button', { name: 'Sign the sample agreement' });
    await expect(bouton).toBeDisabled();
    await page.getByRole('checkbox', { name: /I have read this sample agreement/i }).check();
    await expect(bouton).toBeEnabled();
    await bouton.click();

    await expect(page.getByText('Activate your month', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /activate my month/i })).toBeVisible();
    // Jamais cliqué plus loin ici : au-delà, la démo peut appeler des mécanismes non déterministes
    // (Cockpit) -- "Sign up/Agreement/Activation" suffit à prouver le parcours fonctionnel.
  });
});
