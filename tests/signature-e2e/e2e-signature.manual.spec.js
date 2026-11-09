// Parcours de bout en bout de la signature (clic "Signer" -> écran "Signature enregistrée"),
// le délai à l'origine d'un vrai incident en production le 08/11/2026. JAMAIS ramassé par la
// suite normale (`npx playwright test`) ni par le passage nocturne -- voir `testIgnore` dans
// playwright.config.js. Envoie un VRAI e-mail et consomme un jeton de signature à USAGE UNIQUE :
// un geste manuel, déclenché par V00/larose75 avec un jeton frais à chaque fois
// (`npm run test:e2e-signature`), jamais par la CI. Jamais de jeton ni d'adresse e-mail en dur :
// lus depuis l'environnement (voir ci-dessous), jamais écrits dans ce fichier ni dans un rapport.
//
// Variables d'environnement :
//   E2E_SIGNATURE_URL   (obligatoire) lien complet /sign/<jeton>, encore valide, non consommé.
//   E2E_SIGNATURE_EMAIL (obligatoire) adresse qui recevra le code à 6 chiffres et la copie.
//   E2E_SIGNATURE_CODE  (optionnel) code reçu par e-mail. Sans lui, le test s'arrête PROPREMENT
//                       juste après avoir demandé le code (jeton pas encore consommé à ce stade :
//                       demander un code ne signe rien) -- relancer avec la variable une fois le
//                       code en main pour mesurer le parcours complet.
//
// Seuil de délai clic "Signer" -> écran de confirmation : 10s (proposé par V00/larose75,
// 09/11/2026, à la suite de l'incident où ce délai avait semblé infini côté candidat).
const { test, expect } = require('@playwright/test');

const URL = process.env.E2E_SIGNATURE_URL;
const EMAIL = process.env.E2E_SIGNATURE_EMAIL;
const CODE = process.env.E2E_SIGNATURE_CODE;
const SEUIL_MS = 10_000;

test.skip(!URL || !EMAIL, 'E2E_SIGNATURE_URL et E2E_SIGNATURE_EMAIL doivent être fournis -- geste manuel, jamais en CI (voir l\'en-tête de ce fichier)');

test('parcours de signature : remplir, demander le code, [si fourni] vérifier et signer', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#sg'), 'formulaire de signature absent -- jeton invalide/expiré ?').toBeVisible();

  await page.fill('#tape', 'Test E2E Signature');
  await page.fill('#adresse', 'Test E2E - ne pas traiter');
  await page.fill('#pays', 'France');
  await page.fill('#email', EMAIL);
  await page.fill('#email2', EMAIL);
  await page.check('#accepte');

  await page.click('#btnCode');
  await expect(page.locator('#evSt')).not.toBeEmpty({ timeout: 10_000 });

  if (!CODE) {
    test.info().annotations.push({
      type: 'arrêt volontaire',
      description: 'E2E_SIGNATURE_CODE non fourni -- code demandé avec succès, jeton non consommé. Relancer avec le code reçu par e-mail pour mesurer le parcours complet.',
    });
    return;
  }

  await page.fill('#code', CODE);
  await page.click('#btnVerif');
  await expect(page.locator('#evSt')).toContainText(/vérifiée|verified/i, { timeout: 10_000 });

  const debut = Date.now();
  const reponseSignature = page.waitForResponse(r => r.url().includes('/api/sign') && r.request().method() === 'POST');
  await page.click('#btnSigner');
  const r = await reponseSignature;
  const delaiReponseApi = Date.now() - debut;

  await expect(page.locator('#fin'), 'écran de confirmation jamais apparu').toBeVisible({ timeout: SEUIL_MS });
  const delaiEcran = Date.now() - debut;

  console.log(`[e2e-signature] POST /api/sign : ${r.status()} en ${delaiReponseApi} ms -- écran de confirmation après ${delaiEcran} ms`);
  expect(r.status(), 'POST /api/sign doit répondre 200').toBe(200);
  expect(delaiEcran, `délai clic Signer -> écran de confirmation (${delaiEcran} ms) doit rester sous le seuil`).toBeLessThan(SEUIL_MS);
});
