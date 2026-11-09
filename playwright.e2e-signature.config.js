// Config DÉDIÉE au parcours réel de signature (tests/signature-e2e/) -- jamais utilisée par la
// CI ni le nocturne (qui chargent playwright.config.js, lequel ignore ce dossier). Lancée à la
// main via `npm run test:e2e-signature`, avec E2E_SIGNATURE_URL/E2E_SIGNATURE_EMAIL fraîchement
// fournis à chaque fois -- voir l'en-tête de tests/signature-e2e/e2e-signature.manual.spec.js.
//
// Autonome plutôt que fusionnée avec playwright.config.js : defineConfig() fusionne `projects`
// PAR NOM (il réinjecte tout projet du socle non explicitement écrasé) -- un simple
// `projects: [...]` dans une fusion n'exclut donc PAS mobile-390px comme on pourrait s'y
// attendre, vérifié en direct avant d'écrire ce fichier ainsi.
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/signature-e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Un seul navigateur suffit pour mesurer un délai serveur -- pas besoin du projet mobile-390px.
  projects: [{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } }],
});
