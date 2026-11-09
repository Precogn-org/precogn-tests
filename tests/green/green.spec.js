// Démo publique "Green" (orgId=greendemo, confirmé via /api/demo/orgs). Même mécanisme que
// Compta (iframe Apps Script imbriqué + widget chat PreCogn) -- voir cadreContenu() (helpers.js).
// Démo sans données saisies pour l'instant ("Aucune donnée"/"Aucune écriture") : les vérifications
// portent sur le chargement de la coquille, pas sur un contenu métier qui n'existe pas encore.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal, texteMelange, texteVisible, cadreContenu } = require('../helpers');

const URL_DEMO = 'https://structory.ai/demo/green?lang=fr';

test.describe('Green — démo connectée (sans compte, lecture seule)', () => {
  test('charge et affiche le journal sans erreur console', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    await page.goto(URL_DEMO, { waitUntil: 'load' });
    const cadre = await cadreContenu(page);
    await cadre.getByText('STRUCTORY — JOURNAL', { exact: false }).first().waitFor({ timeout: 15000 });
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
  });

  test('aucun débordement horizontal à 390 px', async ({ page }) => {
    await page.goto(URL_DEMO, { waitUntil: 'load' });
    const cadre = await cadreContenu(page);
    await cadre.getByText('STRUCTORY — JOURNAL', { exact: false }).first().waitFor({ timeout: 15000 });
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
  });

  test('texte FR non mélangé avec de l\'anglais', async ({ page }) => {
    await page.goto(URL_DEMO, { waitUntil: 'load' });
    const cadre = await cadreContenu(page);
    await cadre.getByText('STRUCTORY — JOURNAL', { exact: false }).first().waitFor({ timeout: 15000 });
    const texte = await texteVisible(page);
    expect(texteMelange(texte, 'fr'), 'texte anglais inattendu dans la démo FR').toBe(false);
  });
});
