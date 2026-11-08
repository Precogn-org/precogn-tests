// Démo publique "Compta" (orgId=comptademo, confirmé via /api/demo/orgs). Même mécanisme que JdB
// (iframe Apps Script imbriqué), mais avec un widget chat PreCogn EN PLUS, embarqué dans sa
// propre iframe à l'intérieur du contenu réel -- cadreContenu() (helpers.js) s'arrête dès qu'un
// cadre a un texte substantiel plutôt que de descendre dans ce widget.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal, texteMelange, texteVisible, cadreContenu } = require('../helpers');

const URL_DEMO = 'https://structory.ai/demo/compta?lang=fr';

test.describe('Compta — démo connectée (sans compte, lecture seule)', () => {
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

  test('action clé : afficher la balance', async ({ page }) => {
    await page.goto(URL_DEMO, { waitUntil: 'load' });
    const cadre = await cadreContenu(page);
    await cadre.getByText('STRUCTORY — JOURNAL', { exact: false }).first().waitFor({ timeout: 15000 });
    const avant = await cadre.locator('body').innerText();
    const lien = cadre.getByText('Balance', { exact: true }).first();
    await lien.waitFor({ timeout: 10000 });
    await lien.click();
    await expect(async () => {
      const apres = await cadre.locator('body').innerText();
      expect(apres).not.toEqual(avant);
    }).toPass({ timeout: 5000 });
  });
});
