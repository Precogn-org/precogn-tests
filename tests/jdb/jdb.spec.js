// Démo publique "Journal de banque" (orgId=jdbdemo, confirmé via /api/demo/orgs). Contenu rendu
// dans un iframe Apps Script imbriqué (cross-origin, googleusercontent.com) -- voir cadreContenu()/
// texteVisible() dans helpers.js, qui descendent jusqu'au vrai contenu au lieu du body (vide) de
// la page hôte. `page.goto` attend toujours `networkidle` : cadreContenu() suppose les iframes
// déjà attachés.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal, texteMelange, texteVisible, cadreContenu } = require('../helpers');

const URL_DEMO = 'https://structory.ai/demo/jdb?lang=fr';

test.describe('JdB — démo connectée (sans compte, lecture seule)', () => {
  test('charge et affiche le journal sans erreur console', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    await page.goto(URL_DEMO, { waitUntil: 'networkidle' });
    const cadre = await cadreContenu(page);
    await cadre.getByText('JOURNAL DE BANQUE', { exact: false }).first().waitFor({ timeout: 15000 });
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
  });

  test('aucun débordement horizontal à 390 px', async ({ page }, testInfo) => {
    // Défaut connu, NON contourné : ~9px de débordement dus à la bannière Google "application
    // créée par un utilisateur Apps Script" (disparaît une fois l'app vérifiée par Google -- hors
    // de ce dépôt), voir issue #6. Échec attendu sur mobile-390px seulement.
    test.fail(testInfo.project.name === 'mobile-390px', 'bannière Apps Script non vérifiée, issue #6');
    await page.goto(URL_DEMO, { waitUntil: 'networkidle' });
    const cadre = await cadreContenu(page);
    await cadre.getByText('JOURNAL DE BANQUE', { exact: false }).first().waitFor({ timeout: 15000 });
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
  });

  test('texte FR non mélangé avec de l\'anglais', async ({ page }) => {
    await page.goto(URL_DEMO, { waitUntil: 'networkidle' });
    const cadre = await cadreContenu(page);
    await cadre.getByText('JOURNAL DE BANQUE', { exact: false }).first().waitFor({ timeout: 15000 });
    const texte = await texteVisible(page);
    expect(texteMelange(texte, 'fr'), 'texte anglais inattendu dans la démo FR').toBe(false);
  });

  test('action clé : rafraîchir le journal', async ({ page }) => {
    await page.goto(URL_DEMO, { waitUntil: 'networkidle' });
    const cadre = await cadreContenu(page);
    const bouton = cadre.getByText('rafraîchir', { exact: false });
    await bouton.waitFor({ timeout: 15000 });
    await bouton.click();
    await expect(bouton).toBeVisible();
  });
});
