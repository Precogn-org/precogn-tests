// Déclinaison GAME (1 PRECOGN §Déclinaison : "déclinaison gamifiée", partage les mêmes Flows/
// Rules et la même source de vérité qu'un module, sans en être un). `structory.ai/game/` ("Le
// Journal", vocabulaire comptable -- écriture, journal) est très probablement rattachée à Compta,
// mais le contenu textuel observé ne varie pas selon `orgId` (testé en direct 08/11/2026) : le
// rattachement précis à un module donné n'est pas confirmé ici (0 PRECOGN doit être mis à jour par
// une PR dédiée, pas celle-ci). Dossier neutre tant que ce n'est pas tranché -- jamais forcé dans
// un dossier de module sur une supposition.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal } = require('../helpers');

const URL_GAME = 'https://structory.ai/game/';

test.describe('Game — page publique', () => {
  test('charge sans erreur console', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    const reponse = await page.goto(URL_GAME);
    expect(reponse.status(), 'code HTTP').toBeLessThan(400);
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
  });

  test('aucun débordement horizontal à 390 px', async ({ page }) => {
    await page.goto(URL_GAME);
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
  });
});
