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

module.exports = { sansDebordementHorizontal, texteMelange };
