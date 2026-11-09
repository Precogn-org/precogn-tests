// Déclinaison APP (PWA) du module Compta -- voir pwa.compta dans modules.json (sites-internet).
// Seuls les modules avec une entrée dans cette rubrique ont une déclinaison APP ; les autres
// (SMC, JdB, Green, Briqueterie) n'en ont pas, consigné en non applicable dans docs/ECARTS.md.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal, verifierPwaInstallable } = require('../helpers');

const URL_APP = 'https://structory.ai/compta-app/';

test.describe('Compta — déclinaison APP (PWA)', () => {
  test('charge sans erreur console', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    const reponse = await page.goto(URL_APP);
    expect(reponse.status(), 'code HTTP').toBeLessThan(400);
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
  });

  test('aucun débordement horizontal à 390 px', async ({ page }) => {
    await page.goto(URL_APP);
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
  });

  test('installable : manifeste valide et service worker actif', async ({ page }) => {
    await page.goto(URL_APP);
    const manifeste = await verifierPwaInstallable(page);
    expect(manifeste.name).toBeTruthy();
  });
});
