// Suite de tests automatiques des démos publiques PreCogn/Structory (Redmine #152, parent #140).
// Déterministe : aucun modèle de langage, aucune clé, aucun secret à l'exécution. Déclenché par
// GitHub Actions (cron nocturne + sur PR, runner isolé -- voir workflow .github/workflows/).
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  // tests/signature-e2e/ : parcours réel de signature, envoie un vrai e-mail et consomme un
  // jeton à usage unique -- JAMAIS ramassé ici (CI, nocturne), geste manuel uniquement via
  // `npm run test:e2e-signature` (voir playwright.e2e-signature.config.js et l'en-tête du spec).
  testIgnore: ['**/signature-e2e/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { outputFolder: 'rapport-html', open: 'never' }],
    ['json', { outputFile: 'rapport.json' }],
    ['list'],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Desktop : navigation standard.
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    // Mobile 390px : exigence "aucun débordement à 390 px" du ticket #152. Chromium explicitement
    // (pas devices['iPhone 12'], qui utilise WebKit par défaut) : le workflow CI n'installe QUE
    // chromium (`playwright install --with-deps chromium`), jamais webkit.
    { name: 'mobile-390px', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
