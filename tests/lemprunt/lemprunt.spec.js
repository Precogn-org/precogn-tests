// Démo publique "L'emprunt" (PreCogn). Hébergée par le moteur commun partagé avec Le coureur et
// THE FACTORY (coordination A15, qui couvre les tests profonds en CI de son côté -- répartition
// convenue : ici, fumée nocturne sur l'URL publique). URL et sélecteurs confirmés par A15 ET
// revérifiés en direct avant d'écrire ce fichier (08/11/2026) : page directe, SANS iframe ni Apps
// Script (contrairement à SMC/JdB/Compta/Compta Copro/Green). Paramètres ?lang=fr|en.
//
// ATTENTION (A15) : ne jamais cliquer "Envoyer" dans le panneau Communicator -- appelle une vraie
// IA, non déterministe.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal } = require('../helpers');

const URL = 'https://precogn.org/briqueterie/?monde=pret';

test.describe("L'emprunt (FR)", () => {
  const url = `${URL}&lang=fr`;

  test('charge sans erreur console', async ({ page }) => {
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
    const reponse = await page.goto(url);
    expect(reponse.status(), 'code HTTP').toBeLessThan(400);
    expect(erreurs, 'aucune erreur console attendue').toEqual([]);
  });

  test('aucun débordement horizontal à 390 px', async ({ page }) => {
    await page.goto(url);
    const debordants = await sansDebordementHorizontal(page);
    expect(debordants, `éléments débordants : ${debordants.join(', ')}`).toEqual([]);
  });

  test('langue de la page correcte (<html lang>)', async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('.langues button[data-lang="fr"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('affiche ses valeurs clés (capital, mensualité)', async ({ page }) => {
    await page.goto(url);
    await expect(page.getByText('Capital emprunté').first()).toBeVisible();
    await expect(page.getByText('Mensualité').first()).toBeVisible();
  });
});

test.describe("L'emprunt — langue EN", () => {
  test('<html lang="en"> et bouton EN actif avec ?lang=en', async ({ page }) => {
    await page.goto(`${URL}&lang=en`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.langues button[data-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
  });
});
