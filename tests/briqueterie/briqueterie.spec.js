// Démo publique "La Briqueterie" (PreCogn). Coordination A15 (propriétaire du dépôt briqueterie,
// qui couvre les tests profonds en CI de son côté -- répartition convenue : ici, fumée nocturne
// sur l'URL publique). URL et sélecteurs confirmés par A15 ET revérifiés en direct avant d'écrire
// ce fichier (08/11/2026) : https://precogn.org/briqueterie/ -- page directe, SANS iframe ni Apps
// Script (contrairement à SMC/JdB/Compta/Compta Copro/Green). Paramètres ?monde=runner|pret|factory
// et ?lang=fr|en.
//
// ATTENTION (A15) : ne jamais cliquer "Envoyer" dans le panneau Communicator -- appelle une vraie
// IA, non déterministe. Le monde "runner" se joue avec une horloge réelle : ne jamais tester son
// score. Les boutons de THE FACTORY sont explicitement labellisés "(démo)"/"(simulé)" -- vérifié
// en direct avant de les cliquer, aucune vraie inscription/signature.
const { test, expect } = require('@playwright/test');
const { sansDebordementHorizontal } = require('../helpers');

const MONDES = ['runner', 'pret', 'factory'];

for (const monde of MONDES) {
  test.describe(`Briqueterie — monde ${monde} (FR)`, () => {
    const url = `https://precogn.org/briqueterie/?monde=${monde}&lang=fr`;

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
  });
}

test.describe('Briqueterie — langue EN', () => {
  test('<html lang="en"> et bouton EN actif avec ?lang=en', async ({ page }) => {
    await page.goto('https://precogn.org/briqueterie/?monde=runner&lang=en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.langues button[data-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Briqueterie — actions clés', () => {
  test('runner : réinitialiser la démo affiche la confirmation dans le fil', async ({ page }) => {
    await page.goto('https://precogn.org/briqueterie/?monde=runner&lang=fr');
    await page.click('#btn-demo');
    await expect(page.locator('#fil')).toContainText('Démo remise à son état de départ', { timeout: 10000 });
  });

  test('emprunt : le monde "pret" affiche ses valeurs clés', async ({ page }) => {
    await page.goto('https://precogn.org/briqueterie/?monde=pret&lang=fr');
    await expect(page.getByText('Capital emprunté').first()).toBeVisible();
    await expect(page.getByText('Mensualité').first()).toBeVisible();
  });

  test('THE FACTORY : inscrire → signer → activer progressent dans l\'ordre (boutons explicitement "démo"/"simulé")', async ({ page }) => {
    await page.goto('https://precogn.org/briqueterie/?monde=factory&lang=fr');
    const inscrire = page.locator('#actions button[data-action="inscrire"]');
    const signer = page.locator('#actions button[data-action="signer"]');
    const activer = page.locator('#actions button[data-action="activer"]');
    await expect(inscrire).toBeEnabled();
    await expect(signer).toBeDisabled();
    await inscrire.click();
    await expect(signer).toBeEnabled({ timeout: 10000 });
    await expect(activer).toBeDisabled();
    await signer.click();
    await expect(activer).toBeEnabled({ timeout: 10000 });
  });
});
