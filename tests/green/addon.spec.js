// Déclinaison ADDON du module Green. Limite volontaire (voir helpers.verifierPageAddonPublique) :
// seule la page publique est testée, jamais la vraie connexion Google Sheets (CI sans compte).
const { test } = require('@playwright/test');
const { verifierPageAddonPublique } = require('../helpers');

test('Green — page publique de l\'add-on Google Sheets (titre, marque, liens légaux, 390px)', async ({ page }) => {
  await verifierPageAddonPublique(page, 'https://structory.ai/green/addon/', 'Structory Green');
});
