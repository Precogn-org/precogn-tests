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

module.exports = { sansDebordementHorizontal, texteMelange, texteVisible, cadreContenu };
