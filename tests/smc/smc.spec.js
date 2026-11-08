// Pilote (Redmine #152) : démo publique "Suivre Mes Comptes" (orgId=smcdemo, confirmé via
// /api/demo/orgs). Seuls les tests STATIQUES (chargement, débordement 390px, langue) sont inclus
// ici, décision V00 08/11/2026 : le parcours connecté (accès à la démo, action "Réinitialiser la
// démo") est hors scope de cette PR -- la page vitrine ne mène qu'à un lien "Mon espace" protégé
// par connexion Google (vérifié en direct, 08/11/2026), alors que 1 STRUCTORY §7.3 dit qu'une
// personne non connectée doit pouvoir tout essayer dans la démo : écart produit signalé à V00/A07
// (SMC), en cours de clarification -- PAS à contourner ici par une invention de mécanisme d'accès.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal, texteMelange } = require('../helpers');

const URL_VITRINE = 'https://structory.ai/smc/';

test.describe('SMC — démo publique', () => {
  test('la page vitrine charge sans erreur console', async ({ page }) => {
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
