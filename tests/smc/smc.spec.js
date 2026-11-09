// Pilote (Redmine #152) : démo publique "Suivre Mes Comptes" (orgId=smcdemo, confirmé via
// /api/demo/orgs). CORRECTIF 08/11/2026 : une première version de ce fichier affirmait que la
// démo n'était accessible que via connexion Google -- c'était FAUX (mauvaise URL testée, voir
// correction envoyée à V00). Le vrai accès anonyme est https://structory.ai/demo/smc?lang=<fr|en>,
// identique au mécanisme des autres modules Structory (JdB, Compta, Compta Copro).
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal, texteMelange, texteVisible } = require('../helpers');

const URL_VITRINE = 'https://structory.ai/smc/';
const URL_DEMO = 'https://structory.ai/demo/smc?lang=fr';

test.describe('SMC — page vitrine', () => {
  test('charge sans erreur console', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    const reponse = await page.goto(URL_VITRINE);
    expect(reponse.status(), 'code HTTP de la page vitrine').toBeLessThan(400);
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
  });

  test('aucun débordement horizontal à 390 px', async ({ page }) => {
    await page.goto(URL_VITRINE);
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
  });

  test('texte FR non mélangé avec de l\'anglais', async ({ page }) => {
    await page.goto(URL_VITRINE);
    const texte = await page.locator('body').innerText();
    expect(texteMelange(texte, 'fr'), 'texte anglais inattendu dans la page FR').toBe(false);
  });
});

test.describe('SMC — démo connectée (sans compte, lecture seule)', () => {
  test('charge et affiche le patrimoine sans erreur console', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    await page.goto(URL_DEMO);
    await page.getByText('PATRIMOINE TOTAL', { exact: false }).waitFor({ timeout: 15000 });
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
  });

  test('aucun débordement horizontal à 390 px', async ({ page }, testInfo) => {
    // Défaut connu, NON contourné : la barre de navigation déborde de ~249px à 390px de large
    // (boutons "Automatiser"/"Rapports"/"Organisation"), voir issue #6. Échec attendu sur le
    // projet mobile-390px seulement -- la suite alerte d'elle-même si ça finit par passer sans
    // raison (régression inverse non expliquée).
    test.fail(testInfo.project.name === 'mobile-390px', 'nav débordante à 390px, issue #6');
    await page.goto(URL_DEMO);
    await page.getByText('PATRIMOINE TOTAL', { exact: false }).waitFor({ timeout: 15000 });
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
  });

  test('texte FR non mélangé avec de l\'anglais', async ({ page }) => {
    await page.goto(URL_DEMO);
    await page.getByText('PATRIMOINE TOTAL', { exact: false }).waitFor({ timeout: 15000 });
    const texte = await texteVisible(page);
    expect(texteMelange(texte, 'fr'), 'texte anglais inattendu dans la démo FR').toBe(false);
  });

  test('action clé : rafraîchir les comptes', async ({ page }) => {
    await page.goto(URL_DEMO);
    const bouton = page.getByRole('button', { name: /Rafraichir/i });
    await bouton.waitFor({ timeout: 15000 });
    await bouton.click();
    // Pas d'assertion plus fine que "le bouton reste présent et cliquable sans planter la page" --
    // la démo est en lecture seule, aucune donnée n'est modifiée par ce clic.
    await expect(bouton).toBeVisible();
  });
});
