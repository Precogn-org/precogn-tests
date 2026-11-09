// Page PreSeed (démarchage investisseurs), demande relayée par V00 (larose75), 6 points précis.
// Pas de déclinaison App/Add-on/Game ici : une seule page publique, EN (/preseed/) et FR
// (/fr/preseed/). Les chiffres de traction sont chargés en JS depuis /api/preseed/traction
// (repli local sur un instantané statique si l'API est indisponible, cf. le script de la page) --
// on vérifie ici le JSON réellement servi, pas seulement son affichage.
const { test, expect } = require('@playwright/test');

const PAGES = [
  { lang: 'en', url: 'https://structory.ai/preseed/' },
  { lang: 'fr', url: 'https://structory.ai/fr/preseed/' },
];

// Mots-outils très fréquents, choisis pour ne jamais apparaître comme mot entier dans l'autre
// langue (ex. "plus"/"on"/"a" exclus : ambigus, valides dans les deux langues ou trop courts).
const MOTS_FR = ['le', 'la', 'les', 'de', 'des', 'un', 'une', 'et', 'est', 'pour', 'avec', 'dans', 'votre', 'vous', 'qui', 'que', 'sur', 'par', 'où', 'être', 'avoir', 'sans', 'tout', 'cette', 'ces'];
const MOTS_EN = ['the', 'and', 'your', 'you', 'that', 'this', 'are', 'with', 'for', 'not', 'all', 'where', 'is', 'to', 'by', 'of'];
// Exceptions explicites : noms propres / marque partagés entre les deux langues, jamais comptés.
const EXCEPTIONS = ['structory', 'byos', 'whatsapp', 'precogn', 'docling', 'anthropic', 'openai', 'france', 'martinique', 'larose75', 'github'];

function motsDuTexte(texte) {
  return new Set(
    texte.toLowerCase().normalize('NFC').replace(/[^a-zà-öø-ÿ']+/g, ' ').split(/[\s']+/).filter(Boolean)
  );
}

for (const { lang, url } of PAGES) {
  test.describe(`PreSeed — ${lang.toUpperCase()}`, () => {
    test('charge sans erreur console', async ({ page }) => {
      const erreurs = [];
      page.on('pageerror', e => erreurs.push(e.message));
      page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
      const reponse = await page.goto(url, { waitUntil: 'load' });
      expect(reponse.status(), 'code HTTP').toBeLessThan(400);
      expect(erreurs, 'aucune erreur console attendue').toEqual([]);
    });

    test('chiffres de traction chargés, jamais 0, plausibles', async ({ page, request }) => {
      // Vérifie le JSON réellement servi (pas seulement l'affichage, qui peut retomber sur
      // l'instantané statique de secours si l'API échoue -- on veut détecter CE cas aussi).
      const r = await request.get('https://structory.ai/api/preseed/traction');
      expect(r.ok(), 'API traction injoignable').toBeTruthy();
      const d = await r.json();
      for (const cle of ['repositories', 'activeRepositories30d', 'sourceLines', 'commits6m', 'pullRequests']) {
        expect(d.totals[cle], `totals.${cle} ne doit jamais être 0`).toBeGreaterThan(0);
      }
      expect(d.totals.activeRepositories30d, 'dépôts actifs <= total').toBeLessThanOrEqual(d.totals.repositories);

      await page.goto(url, { waitUntil: 'load' });
      await page.locator('#traction-data').waitFor({ state: 'visible', timeout: 15000 });
      const texteVersNombre = t => parseInt(t.replace(/[^\d]/g, ''), 10);
      for (const id of ['t-lines', 't-commits', 't-prs']) {
        const txt = await page.locator('#' + id).textContent();
        expect(texteVersNombre(txt), `#${id} affiché ("${txt}") doit être > 0`).toBeGreaterThan(0);
      }
      const actif = await page.locator('#t-active').textContent();
      const [vActif, vTotal] = actif.split('/').map(texteVersNombre);
      expect(vActif, `#t-active ("${actif}") : partie active doit être > 0`).toBeGreaterThan(0);
      expect(vTotal, `#t-active ("${actif}") : total doit être > 0`).toBeGreaterThan(0);
    });

    test('aucun dépôt privé nommé, aucun tableau de dépôts', async ({ page }) => {
      await page.goto(url, { waitUntil: 'load' });
      await page.locator('#traction-data').waitFor({ state: 'visible', timeout: 15000 });
      const nbTables = await page.locator('table').count();
      expect(nbTables, 'plus aucun tableau de dépôts sur cette page').toBe(0);
      const html = await page.content();
      // Seuls les liens génériques vers l'organisation (sans chemin de dépôt précis) sont admis.
      const cheminsRepo = [...html.matchAll(/github\.com\/Precogn-org\/[A-Za-z0-9_.-]+/g)].map(m => m[0]);
      expect(cheminsRepo, 'aucun lien direct vers un dépôt précis (nommé) ne doit apparaître').toEqual([]);
    });

    test('tous les liens de la page répondent 200', async ({ page, request }) => {
      await page.goto(url, { waitUntil: 'load' });
      await page.locator('#traction-data').waitFor({ state: 'visible', timeout: 15000 });
      const hrefs = await page.locator('a[href]').evaluateAll(els => els.map(e => e.getAttribute('href')));
      const cibles = new Set(
        hrefs
          .filter(h => h && !h.startsWith('#') && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('javascript:'))
          .map(h => new URL(h, url).toString())
      );
      expect(cibles.size, 'au moins un lien à vérifier').toBeGreaterThan(0);
      for (const cible of cibles) {
        const r = await request.get(cible);
        expect(r.ok(), `lien ${cible} doit répondre 2xx (obtenu ${r.status()})`).toBeTruthy();
      }
    });

    test(`texte sans mélange de langue (${lang === 'fr' ? 'aucun mot anglais courant' : 'aucun mot français courant'})`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'load' });
      await page.locator('#traction-data').waitFor({ state: 'visible', timeout: 15000 });
      const texte = await page.locator('body').innerText();
      const mots = motsDuTexte(texte);
      for (const exception of EXCEPTIONS) mots.delete(exception);
      const liste = lang === 'fr' ? MOTS_EN : MOTS_FR;
      const trouves = liste.filter(m => mots.has(m));
      expect(trouves, `mots de l'autre langue trouvés : ${trouves.join(', ')}`).toEqual([]);
    });

    test('sélecteur EN|FR fonctionnel', async ({ page }) => {
      await page.goto(url, { waitUntil: 'load' });
      const autre = lang === 'fr' ? { code: 'EN', href: '/preseed/' } : { code: 'FR', href: '/fr/preseed/' };
      const lienActuel = page.locator(`nav.lang a[hreflang="${lang}"]`);
      const lienAutre = page.locator(`nav.lang a[hreflang="${autre.code.toLowerCase()}"]`);
      await expect(lienActuel).toHaveAttribute('aria-current', 'true');
      await expect(lienAutre).not.toHaveAttribute('aria-current', 'true');
      await lienAutre.click();
      await expect(page).toHaveURL(new RegExp(autre.href.replace('/', '\\/') + '$'));
      await expect(page.locator('html')).toHaveAttribute('lang', autre.code.toLowerCase());
    });

    test('date de dernière collecte < 36h', async ({ request }) => {
      const r = await request.get('https://structory.ai/api/preseed/traction');
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      const ageHeures = (Date.now() - new Date(d.generatedAt).getTime()) / 3_600_000;
      expect(ageHeures, `dernière collecte vieille de ${ageHeures.toFixed(1)} h (generatedAt=${d.generatedAt}) -- le cron quotidien a probablement échoué, l'alerte nocturne doit le signaler`).toBeLessThan(36);
    });
  });
}
