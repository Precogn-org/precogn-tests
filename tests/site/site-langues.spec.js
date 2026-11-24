// Spec « site-langues » (issue n° 37, ticket Redmine n° 338) : les pages TRANSVERSES du site public et le sélecteur de langue, que les specs par module ne couvrent pas.
// Lecture seule, aucune clé, aucun secret : le test ne lit que ce qui est public (sitemap.xml, pages HTML). Il part du SITEMAP, donc couvre toute page indexée sans liste écrite à la main.
//
// Règles vérifiées :
//   1. aucune page du sitemap ne répond en 404 ni en erreur ;
//   2. le sélecteur de langue mène, pour chaque langue, à LA MÊME PAGE si elle existe dans cette langue, sinon à l'ACCUEIL de la langue, jamais à une 404 ;
//   3. hreflang cohérents : l'adresse de chaque alternative répond, la page se référence elle-même, la réciproque existe, x-default présent ;
//   4. liens internes non cassés (liens de navigation des pages indexées) ;
//   5. dans un vrai navigateur : choisir une langue dans le sélecteur ouvre la même page, pas l'accueil.
// Ces tests DOIVENT échouer tant que le site a ces défauts ; ils passent quand le site est corrigé.
const { test, expect } = require('@playwright/test');

const BASE = (process.env.SITE_URL || 'https://structory.ai').replace(/\/$/, '');
const CONCURRENCE = 10;
const MAX_LIENS = 800;

test.describe.configure({ mode: 'default' });
test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'spec indépendant de la taille d\'écran : joué une seule fois');
});

// ---- utilitaires (sans dépendance) ----
async function enParallele(elements, fonction, n = CONCURRENCE) {
  const resultats = new Array(elements.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, elements.length) }, async () => {
    while (i < elements.length) { const k = i++; resultats[k] = await fonction(elements[k], k); }
  }));
  return resultats;
}

const cacheStatuts = new Map();
async function statut(request, chemin) {
  if (!cacheStatuts.has(chemin)) {
    cacheStatuts.set(chemin, (async () => {
      try {
        const r = await request.get(BASE + chemin, { maxRedirects: 0, timeout: 20000, failOnStatusCode: false });
        return r.status();
      } catch (e) { return 0; }
    })());
  }
  return cacheStatuts.get(chemin);
}
const existe = (s) => s >= 200 && s < 400;

const cachePages = new Map();
async function page(request, chemin) {
  if (!cachePages.has(chemin)) {
    cachePages.set(chemin, (async () => {
      try {
        const r = await request.get(BASE + chemin, { maxRedirects: 3, timeout: 20000, failOnStatusCode: false });
        return { statut: r.status(), html: r.status() < 400 ? await r.text() : '' };
      } catch (e) { return { statut: 0, html: '' }; }
    })());
  }
  return cachePages.get(chemin);
}

let sitemapMemo;
async function pagesDuSitemap(request) {
  if (!sitemapMemo) {
    sitemapMemo = (async () => {
      const r = await request.get(BASE + '/sitemap.xml', { timeout: 30000 });
      expect(r.status(), 'sitemap.xml doit répondre').toBe(200);
      const xml = await r.text();
      const chemins = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => { try { return new URL(m[1]).pathname; } catch (e) { return null; } }).filter(Boolean);
      return [...new Set(chemins)];
    })();
  }
  return sitemapMemo;
}

/** Valeurs du sélecteur de langue (<select onchange="location.href=this.value">). */
function optionsSelecteur(html) {
  const m = /<select[^>]*onchange="location\.href=this\.value"[^>]*>([\s\S]*?)<\/select>/i.exec(html);
  if (!m) return null;
  return [...m[1].matchAll(/<option[^>]*value="([^"]*)"/gi)].map((x) => x[1]);
}

/** Alternatives hreflang d'une page : { 'fr': '/fr/ce-que-fait-structory/', 'en': '/what-structory-does/', ... } (chemins normalises). Source de verite quand l'adresse change selon la langue (nom de page traduit). */
function alternatives(html) {
  const sortie = {};
  for (const m of html.matchAll(/<link[^>]*rel="alternate"[^>]*>/gi)) {
    const hl = /hreflang="([^"]+)"/i.exec(m[0]), hr = /href="([^"]+)"/i.exec(m[0]);
    if (hl && hr) { try { sortie[hl[1].toLowerCase()] = new URL(hr[1], BASE).pathname.replace(/\.html$/, '').replace(/(.)\/$/, '$1/'); } catch (e) { /* adresse illisible : ignoree */ } }
  }
  return sortie;
}

/** « /fr/lyos/ » -> { langue: 'fr', cle: '/lyos/' } ; « /lyos/ » -> { langue: '', cle: '/lyos/' } (racine = langue par défaut). */
function separerLangue(chemin, codes) {
  const m = /^\/([^/]+)(\/.*)?$/.exec(chemin);
  if (m && codes.has(m[1])) return { langue: m[1], cle: m[2] || '/' };
  if (m && m[1] === 'en') return { langue: '', cle: m[2] || '/' };   // « /en/remote » : la variante anglaise d'une page, la clé est « /remote » (l'anglais est la langue par défaut, à la racine ailleurs)
  return { langue: '', cle: chemin };
}
const accueilDe = (langue) => (langue ? `/${langue}/` : '/');
const cheminDans = (langue, cle) => (langue ? `/${langue}${cle}` : cle);
const normalise = (c) => { try { return new URL(c, BASE).pathname.replace(/\.html$/, '').replace(/(.)\/$/, '$1/'); } catch (e) { return c; } };       // « /x.html » et « /x » sont la même page

let codesMemo;
async function codesLangues(request) {
  if (!codesMemo) {
    codesMemo = (async () => {
      const { html } = await page(request, '/');
      const opts = optionsSelecteur(html) || [];
      return new Set(opts.map((v) => v.replace(/\//g, '')).filter(Boolean));
    })();
  }
  return codesMemo;
}

function resume(titre, problemes) {
  return `${titre} : ${problemes.length} problème(s)\n` + problemes.slice(0, 30).map((p) => '  - ' + p).join('\n') + (problemes.length > 30 ? `\n  … et ${problemes.length - 30} autres` : '');
}

// ---- 1. pages indexées ----
test('1. aucune page indexée (sitemap) ne répond en 404 ni en erreur', async ({ request }) => {
  const pages = await pagesDuSitemap(request);
  expect(pages.length, 'le sitemap doit lister des pages').toBeGreaterThan(5);
  const statuts = await enParallele(pages, (p) => statut(request, p));
  const mauvais = pages.map((p, i) => ({ p, s: statuts[i] })).filter((x) => !existe(x.s)).map((x) => `${x.p} → ${x.s}`);
  expect(mauvais, resume('Pages indexées en erreur', mauvais)).toEqual([]);
});

// ---- 2. sélecteur : même page, sinon accueil de la langue, jamais 404 ----
test('2. le sélecteur de langue mène à la même page (ou à l\'accueil de la langue), jamais en 404', async ({ request }) => {
  const pages = await pagesDuSitemap(request);
  const codes = await codesLangues(request);
  expect(codes.size, 'le sélecteur doit proposer des langues').toBeGreaterThan(10);
  const problemes = [];
  const sansSelecteur = [];
  await enParallele(pages, async (chemin) => {
    const { html, statut: s } = await page(request, chemin);
    if (!existe(s)) return;
    const options = optionsSelecteur(html);
    if (!options) { sansSelecteur.push(chemin); return; }
    const { langue: langueCourante, cle } = separerLangue(chemin, codes);
    const faux = [];
    for (const valeur of options) {
      const cible = normalise(valeur);
      const { langue: lg } = separerLangue(cible, codes);                  // langue lue dans le PREMIER segment du chemin (« /fr/privacy » -> fr), pas dans le chemin entier : sinon les pages profondes sont prises pour la langue par défaut
      if (lg === langueCourante) continue;                                 // option de la langue courante
      const alt = alternatives(html)[lg || 'en'];                            // la page a une alternative declaree (hreflang) dans cette langue : c'est LA meme page, meme si son adresse est traduite
      const memePage = alt || cheminDans(lg, cle);
      const attendu = alt || (existe(await statut(request, memePage)) ? memePage : accueilDe(lg));
      if (normalise(attendu) !== cible) faux.push(`${lg || 'défaut'} → ${cible} (attendu ${normalise(attendu)})`);
      else if (!existe(await statut(request, cible))) faux.push(`${lg || 'défaut'} → ${cible} répond en erreur`);
    }
    if (faux.length) problemes.push(`${chemin} : ${faux.length} langue(s) du sélecteur mal routée(s), par exemple ${faux.slice(0, 3).join(' ; ')}`);
  });
  if (sansSelecteur.length) test.info().annotations.push({ type: 'pages sans sélecteur', description: `${sansSelecteur.length} page(s) indexée(s) sans sélecteur de langue (information, non bloquant) : ${sansSelecteur.slice(0, 10).join(', ')}` });
  expect(problemes, resume('Sélecteur de langue', problemes)).toEqual([]);
});

// ---- 3. hreflang ----
function hreflangs(html) {
  const sortie = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const t = m[0];
    if (!/rel="alternate"/i.test(t)) continue;
    const l = /hreflang="([^"]+)"/i.exec(t); const h = /href="([^"]+)"/i.exec(t);
    if (l && h) sortie.push({ langue: l[1], chemin: normalise(h[1]) });
  }
  return sortie;
}
test('3. les hreflang sont cohérents (adresses valides, auto-référence, réciproque, x-default)', async ({ request }) => {
  const pages = await pagesDuSitemap(request);
  const problemes = [];
  await enParallele(pages, async (chemin) => {
    const { html, statut: s } = await page(request, chemin);
    if (!existe(s)) return;
    const alt = hreflangs(html);
    if (!alt.length) return;                                               // page sans hreflang : hors périmètre de cette règle
    const chemins = new Set(alt.map((a) => a.chemin));
    if (!chemins.has(normalise(chemin))) problemes.push(`${chemin} : ne se référence pas elle-même dans ses hreflang`);
    if (!alt.some((a) => a.langue === 'x-default')) problemes.push(`${chemin} : pas de hreflang x-default`);
    for (const a of alt) {
      if (!existe(await statut(request, a.chemin))) { problemes.push(`${chemin} : hreflang ${a.langue} → ${a.chemin} répond en erreur`); continue; }
      if (a.chemin === normalise(chemin)) continue;
      const autre = await page(request, a.chemin);
      const retour = hreflangs(autre.html).map((x) => x.chemin);
      if (autre.html && !retour.includes(normalise(chemin))) problemes.push(`${chemin} : l'alternative ${a.chemin} ne renvoie pas vers elle (réciproque manquante)`);
    }
  });
  expect(problemes, resume('hreflang', problemes)).toEqual([]);
});

// ---- 4. liens internes ----
test('4. les liens internes des pages indexées ne sont pas cassés', async ({ request }) => {
  const pages = await pagesDuSitemap(request);
  const liens = new Map();                                                  // lien -> première page qui le contient
  await enParallele(pages, async (chemin) => {
    const { html, statut: s } = await page(request, chemin);
    if (!existe(s)) return;
    for (const m of html.matchAll(/<a\b[^>]*\shref="([^"#?]+)[^"]*"/gi)) {
      const v = m[1];
      if (/^(mailto:|tel:|javascript:|data:)/i.test(v)) continue;
      let u; try { u = new URL(v, BASE + chemin); } catch (e) { continue; }
      if (u.origin !== BASE) continue;
      if (!liens.has(u.pathname)) liens.set(u.pathname, chemin);
    }
  });
  const uniques = [...liens.keys()].slice(0, MAX_LIENS);
  const statuts = await enParallele(uniques, (l) => statut(request, l));
  const casses = uniques.map((l, i) => ({ l, s: statuts[i] })).filter((x) => !existe(x.s)).map((x) => `${x.l} → ${x.s} (lien trouvé sur ${liens.get(x.l)})`);
  expect(casses, resume('Liens internes cassés', casses)).toEqual([]);
});

// ---- 5. sélecteur dans un vrai navigateur ----
test('5. dans un navigateur, choisir une langue ouvre la même page (pas l\'accueil de la langue)', async ({ page: navigateur, request }) => {
  const pages = await pagesDuSitemap(request);
  const codes = await codesLangues(request);
  // première page transverse (hors accueil de langue) qui a le sélecteur ET existe aussi en français
  let cible = null;
  for (const p of pages) {
    const { langue, cle } = separerLangue(p, codes);
    if (langue === '' && cle !== '/' && existe(await statut(request, cheminDans('fr', cle))) && optionsSelecteur((await page(request, p)).html)) { cible = { p, cle }; break; }
  }
  test.skip(!cible, 'aucune page transverse disponible en français dans le sitemap');
  await navigateur.goto(BASE + cible.p, { waitUntil: 'domcontentloaded' });
  const select = navigateur.locator('select[onchange*="location.href"]').first();
  await expect(select, 'la page doit avoir le sélecteur de langue').toBeVisible();
  // la valeur de l'option « fr » est lue dans la page (sur une page profonde elle vaut « /fr/<page>.html », pas « /fr/ » : le sélecteur mène à la MÊME page)
  const valeurFr = (optionsSelecteur((await page(request, cible.p)).html) || []).find((v) => separerLangue(normalise(v), codes).langue === 'fr');
  expect(valeurFr, 'le sélecteur doit proposer le français').toBeTruthy();
  await Promise.all([navigateur.waitForURL((u) => u.pathname.startsWith('/fr'), { timeout: 20000 }), select.selectOption(valeurFr)]);
  expect(normalise(new URL(navigateur.url()).pathname), 'le sélecteur doit ouvrir la même page en français').toBe(normalise(cheminDans('fr', cible.cle)));
});

// ---- 6. information : couverture des langues des pages transverses (non bloquant) ----
test('6. information : couverture des langues par page indexée (non bloquant)', async ({ request }) => {
  const pages = await pagesDuSitemap(request);
  const codes = await codesLangues(request);
  const parCle = new Map();
  for (const p of pages) {
    const { langue, cle } = separerLangue(p, codes);
    if (!parCle.has(cle)) parCle.set(cle, new Set());
    parCle.get(cle).add(langue || 'défaut');
  }
  const lignes = [...parCle.entries()].filter(([cle]) => cle !== '/').map(([cle, l]) => `${cle} : ${l.size}/${codes.size + 1} langue(s)`);
  test.info().annotations.push({ type: 'couverture', description: lignes.slice(0, 40).join(' ; ') });
  expect(parCle.size).toBeGreaterThan(0);
});
