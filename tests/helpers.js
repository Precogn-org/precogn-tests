// Vérifications partagées entre les specs de démo (Redmine #152).

/** Aucun élément ne doit dépasser la largeur du viewport (débordement horizontal à 390 px). */
async function sansDebordementHorizontal(page) {
  const debordants = await page.evaluate(() => {
    const largeur = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')]
      .filter(el => el.getBoundingClientRect().right > largeur + 1)
      .map(el => el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
  });
  return debordants;
}

/** FR/EN sans texte mélangé : heuristique simple sur les mots-outils les plus fréquents de
 * chaque langue dans le texte visible -- affiné une fois le vrai DOM de chaque démo connu. */
const MOTS_FR = ['le ', 'la ', 'les ', 'vous ', 'votre ', 'compte', 'solde'];
const MOTS_EN = ['the ', 'your ', 'account', 'balance'];

function texteMelange(texteVisible, langueAttendue) {
  const bas = texteVisible.toLowerCase();
  const presenceFr = MOTS_FR.some(m => bas.includes(m));
  const presenceEn = MOTS_EN.some(m => bas.includes(m));
  if (langueAttendue === 'fr') return presenceEn && !presenceFr;
  if (langueAttendue === 'en') return presenceFr && !presenceEn;
  return false;
}

/** Cadre réel d'une démo : certaines (SMC) sont une SPA directe (le contenu est dans la page
 * hôte) ; d'autres (JdB, Compta -- Apps Script) rendent le leur dans un ou plusieurs iframes
 * imbriqués (googleusercontent.com, cross-origin) -- et certaines (Compta) embarquent EN PLUS un
 * widget (chat PreCogn) dans sa propre iframe DANS le contenu réel : descendre aveuglément tant
 * qu'un iframe existe irait trop loin, dans la coquille vide du widget. S'arrête dès que le cadre
 * courant a lui-même un texte substantiel (son propre body, SANS compter celui d'un iframe
 * descendant -- `innerText` ne traverse jamais les frontières d'iframe) ; ne descend que si le
 * cadre courant est encore une coquille vide. Renvoie le dernier cadre (Page ou FrameLocator, même
 * API `.locator`/`.getByText`) -- à utiliser pour localiser un élément OU lire le texte, jamais le
 * body vide de la page hôte. Suppose que `page.goto` a déjà attendu `networkidle` ou un settle
 * équivalent (les iframes sont alors déjà attachés). */
async function cadreContenu(page) {
  let cadre = page;
  for (;;) {
    const texte = await cadre.locator('body').innerText().catch(() => '');
    // Seuil volontairement haut : le bandeau Google "application non vérifiée" (~90 caractères,
    // présent sur la page hôte de JdB/Compta) ne doit JAMAIS faire croire que c'est le vrai
    // contenu -- un vrai contenu de démo (JdB, Compta) dépasse largement 300 caractères.
    if (texte.trim().length > 300) return cadre;
    const nbIframes = await cadre.locator('iframe').count().catch(() => 0);
    if (nbIframes === 0) return cadre;
    cadre = cadre.frameLocator('iframe').first();
  }
}

async function texteVisible(page) {
  const cadre = await cadreContenu(page);
  return cadre.locator('body').innerText();
}

/** Déclinaison APP (PWA) d'un module (voir pwa.<module> dans modules.json de sites-internet) :
 * lit le manifeste lié par <link rel="manifest">, vérifie les champs minimaux d'installabilité
 * (nom, icônes, start_url, affichage autonome) et que le service worker s'enregistre réellement
 * (pas seulement présent dans le HTML). Lève si le manifeste est absent/invalide ou introuvable. */
async function verifierPwaInstallable(page) {
  const hrefManifeste = await page.locator('link[rel="manifest"]').getAttribute('href');
  if (!hrefManifeste) throw new Error('aucune balise <link rel="manifest"> trouvée');
  const manifeste = await page.evaluate(async (href) => {
    const r = await fetch(href);
    if (!r.ok) throw new Error(`manifeste HTTP ${r.status}`);
    return r.json();
  }, hrefManifeste);
  const manque = ['name', 'start_url', 'display'].filter(c => !manifeste[c]);
  if (manque.length) throw new Error(`champs manquants dans le manifeste : ${manque.join(', ')}`);
  if (!Array.isArray(manifeste.icons) || manifeste.icons.length === 0) throw new Error('aucune icône dans le manifeste');
  if (manifeste.display !== 'standalone' && manifeste.display !== 'fullscreen' && manifeste.display !== 'minimal-ui') {
    throw new Error(`display "${manifeste.display}" non installable (attendu standalone/fullscreen/minimal-ui)`);
  }
  await page.waitForFunction(() => 'serviceWorker' in navigator, null, { timeout: 5000 });
  const swPret = await page.evaluate(() => navigator.serviceWorker.ready.then(() => true).catch(() => false));
  if (!swPret) throw new Error('le service worker ne s\'est jamais activé (navigator.serviceWorker.ready)');
  return manifeste;
}

/** Déclinaison ADDON (Google Sheets) : limite de test volontaire (Redmine #152, demande
 * larose75 08/11/2026) -- une démo à compte Google ne peut pas tourner en CI, donc seule la page
 * PUBLIQUE de présentation est vérifiée (jamais la vraie connexion Sheets). Vérifie le titre
 * attendu, la mention de marque Google LLC (transparence requise par Google Workspace
 * Marketplace), et que les liens confidentialité/conditions pointent vers une vraie page (200),
 * pas seulement qu'ils existent dans le DOM. */
async function verifierPageAddonPublique(page, url, titreAttendu) {
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') erreurs.push(msg.text()); });
  const reponse = await page.goto(url);
  if (reponse.status() >= 400) throw new Error(`code HTTP ${reponse.status()} pour ${url}`);
  if (erreurs.length) throw new Error(`erreurs console : ${erreurs.join(', ')}`);
  const h1 = (await page.locator('h1').first().innerText().catch(() => '')).trim();
  if (h1 !== titreAttendu) throw new Error(`h1 "${h1}" != attendu "${titreAttendu}"`);
  const texte = await page.locator('body').innerText();
  if (!texte.includes('Google LLC')) throw new Error('mention de marque Google LLC absente');
  const debordants = await sansDebordementHorizontal(page);
  if (debordants.length) throw new Error(`débordement à 390px : ${debordants.join(', ')}`);
  for (const nom of ['Confidentialité', 'Conditions']) {
    const href = await page.getByRole('link', { name: nom, exact: true }).first().getAttribute('href');
    if (!href) throw new Error(`lien "${nom}" introuvable`);
    const urlAbsolue = new URL(href, page.url()).toString();
    const r = await page.request.get(urlAbsolue);
    if (r.status() >= 400) throw new Error(`lien "${nom}" (${urlAbsolue}) répond ${r.status()}`);
  }
}

module.exports = { sansDebordementHorizontal, texteMelange, texteVisible, cadreContenu, verifierPwaInstallable, verifierPageAddonPublique };
