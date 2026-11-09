// Déclinaison ADDON du module SMC. Limite volontaire (voir helpers.verifierPageAddonPublique) :
// seule la page publique est testée, jamais la vraie connexion Google Sheets (CI sans compte).
const { test } = require('@playwright/test');
const { verifierPageAddonPublique } = require('../helpers');

test('SMC — page publique de l\'add-on Google Sheets (titre, marque, liens légaux, 390px)', async ({ page }) => {
  await verifierPageAddonPublique(page, 'https://structory.ai/smc/addon/', 'Suivre Mes Comptes');
});
