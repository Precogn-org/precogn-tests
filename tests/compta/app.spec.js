// Déclinaison APP (PWA) du module Compta -- voir pwa.compta dans modules.json (sites-internet).
// Seuls les modules avec une entrée dans cette rubrique ont une déclinaison APP ; les autres
// (SMC, JdB, Green, Le coureur, L'emprunt, THE FACTORY) n'en ont pas, consigné en non applicable
// dans docs/ECARTS.md.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal, verifierPwaInstallable, texteMelange, cadreContenu } = require('../helpers');

const URL_APP = 'https://structory.ai/compta-app/';
// ?lang=fr explicite (pas le défaut du navigateur, qui dépend de la locale du runner) -- même
// convention que compta.spec.js pour les 2 tests sensibles à la langue ci-dessous.
const URL_APP_FR = URL_APP + '?lang=fr';

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

  test('texte FR non mélangé avec de l\'anglais', async ({ page }) => {
    await page.goto(URL_APP_FR, { waitUntil: 'load' });
    const texte = await page.locator('body').innerText();
    expect(texteMelange(texte, 'fr'), 'texte anglais inattendu sur l\'accueil de l\'Appli').toBe(false);
  });

  test('action clé : entrer dans la démo depuis l\'accueil de l\'Appli', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    await page.goto(URL_APP_FR, { waitUntil: 'load' });
    const lien = page.getByRole('link', { name: 'Essayer la démo (sans compte)' });
    await lien.click();
    await page.waitForLoadState('domcontentloaded');
    const cadre = await cadreContenu(page);
    await cadre.getByText('Voici la démo', { exact: false }).first().waitFor({ timeout: 15000 });
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
  });
});
