// Déclinaison ADDON du module Compta Copro. Limite volontaire (voir
// helpers.verifierPageAddonPublique) : seule la page publique est testée, jamais la vraie
// connexion Google Sheets (CI sans compte).
const { test } = require('@playwright/test');
const { verifierPageAddonPublique } = require('../helpers');

test('Compta Copro — page publique de l\'add-on Google Sheets (titre, marque, liens légaux, 390px)', async ({ page }) => {
  await verifierPageAddonPublique(page, 'https://structory.ai/comptacopro/addon/', 'Compta Copro');
});
