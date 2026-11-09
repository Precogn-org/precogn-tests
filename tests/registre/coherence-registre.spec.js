// Cohérence du registre des démos (demande relayée par V00/larose75 09/11/2026, signalement
// Gimly : « structorydemo »/« structory_demo » absente du registre Docling, seule « structory »
// -- backend gdrive -- y figure). Lecture seule, AUCUNE clé de service : ce fichier ne couvre que
// ce qui est public.
//
// IMPORTANT -- limite connue et documentée, pas contournée : la résolution orgId -> backend dans
// Docling elle-même (ce que le signalement Gimly met en cause précisément) vit derrière
// GET /api/docling/orgs et GET /api/docling/connectors, tous deux protégés par X-Service-Key
// (analyzor/main.py, _require_service_key_dep) -- vérifié en direct (401 sans clé). Cette suite ne
// peut donc PAS confirmer ou infirmer directement qu'un orgId a un backend Docling enregistré.
// GET /api/docling/stats?orgId=... est public mais lit un tout autre fichier (compteurs
// d'analyses déjà effectuées, _docling_analyses.json) : un org sans activité y donne le même
// repli générique qu'un org totalement inconnu -- vérifié en direct (structory_demo, structorydemo
// et structory donnent tous les trois le même {"n_orgs":9,...} global) -- impossible d'en déduire
// une résolution Docling. Cette vérification-là reste à faire par quelqu'un qui a la clé (V01).
//
// Ce qui EST vérifié ici, en public et bout en bout dans un vrai navigateur : que chaque
// organisation "officielle" du registre PUBLIC /api/demo/orgs (demo_orgs.json) charge réellement
// du contenu sur sa démo publique -- preuve indirecte mais réelle que la chaîne complète
// (registre démo -> résolution -> Docling -> contenu affiché) fonctionne pour cette organisation
// précise, et que le registre lui-même ne contient pas d'incohérence interne détectable sans clé.
const { test, expect } = require('@playwright/test');
const { cadreContenu } = require('../helpers');

const URL_REGISTRE = 'https://structory.ai/api/demo/orgs';

// Marqueur de contenu réel + mécanisme de rendu, un par module effectivement joignable via
// structory.ai/demo/<module>?lang=<langue> (confirmé en lisant chaque tests/<module>/*.spec.js
// existant). La Briqueterie (et donc Le coureur/L'emprunt/THE FACTORY) N'EST PAS jointe par ce
// mécanisme -- sa propre démo vit sur precogn.org/briqueterie/?monde=..., un registre et un chemin
// entièrement différents -- volontairement exclue ici, pas un oubli.
// attendre : 'load' pour compta/comptacopro/green/smc (comme leurs propres tests/<module>/*.spec.js
// existants), 'networkidle' pour jdb seulement (même choix que tests/jdb/jdb.spec.js).
const MODULES_VIA_DEMO_GENERIQUE = {
  compta: { marqueur: 'STRUCTORY — JOURNAL', iframe: true, attendre: 'load' },
  comptacopro: { marqueur: 'STRUCTORY — JOURNAL', iframe: true, attendre: 'load' },
  green: { marqueur: 'STRUCTORY — JOURNAL', iframe: true, attendre: 'load' },
  jdb: { marqueur: 'JOURNAL DE BANQUE', iframe: true, attendre: 'networkidle' },
  smc: { marqueur: 'PATRIMOINE TOTAL', iframe: false, attendre: 'load' },
};

async function registre(request) {
  const r = await request.get(URL_REGISTRE);
  expect(r.ok(), 'registre /api/demo/orgs injoignable').toBeTruthy();
  const d = await r.json();
  expect(d.success, 'registre : success attendu').toBe(true);
  return d.orgs;
}

test.describe('Registre des démos — cohérence (lecture seule, sans clé)', () => {
  test('aucun orgId dupliqué (entrées officielles + héritées + variantes)', async ({ request }) => {
    const orgs = await registre(request);
    const tousLesOrgIds = [];
    for (const org of orgs) {
      // Le champ orgId au niveau de l'entrée duplique volontairement celui de sa variante par
      // défaut (vu dans le JSON réel) -- ne compter QUE les variantes quand elles existent, sinon
      // l'orgId de l'entrée (cas des organisations héritées, qui n'ont pas de variantes).
      if (org.variantes && org.variantes.length) {
        for (const v of org.variantes) if (v.orgId) tousLesOrgIds.push(v.orgId);
      } else if (org.orgId) {
        tousLesOrgIds.push(org.orgId);
      }
    }
    const doublons = tousLesOrgIds.filter((id, i) => tousLesOrgIds.indexOf(id) !== i);
    expect([...new Set(doublons)], 'orgId apparaissant plus d\'une fois dans le registre').toEqual([]);
  });

  test('chaque organisation héritée pointe vers une organisation officielle existante', async ({ request }) => {
    const orgs = await registre(request);
    const orgsOfficielles = new Set(orgs.filter(o => o.statut === 'officielle').map(o => o.orgId));
    const heritees = orgs.filter(o => o.statut === 'héritée');
    expect(heritees.length, 'au moins une organisation héritée attendue (structory_demo, jdbshow)').toBeGreaterThan(0);
    for (const org of heritees) {
      expect(org.remplacéePar, `${org.orgId} : champ remplacéePar manquant`).toBeTruthy();
      expect(orgsOfficielles.has(org.remplacéePar), `${org.orgId} déclare remplacéePar="${org.remplacéePar}", introuvable parmi les organisations officielles`).toBe(true);
    }
  });

  for (const [module, { marqueur, iframe, attendre }] of Object.entries(MODULES_VIA_DEMO_GENERIQUE)) {
    test(`${module} : chaque variante officielle du registre résout réellement sur sa démo publique`, async ({ page, request }) => {
      const orgs = await registre(request);
      const entree = orgs.find(o => o.module === module && o.statut === 'officielle');
      expect(entree, `aucune organisation officielle pour le module ${module} dans le registre`).toBeTruthy();
      const variantes = entree.variantes && entree.variantes.length ? entree.variantes : [entree];
      for (const v of variantes) {
        const url = `https://structory.ai/demo/${module}?lang=${v.langue}`;
        await page.goto(url, { waitUntil: attendre });
        const cadre = iframe ? await cadreContenu(page) : page;
        await expect(
          cadre.getByText(marqueur, { exact: false }).first(),
          `${module} (orgId=${v.orgId}, lang=${v.langue}) : contenu réel absent sur ${url} -- résolution de l'organisation probablement en échec`
        ).toBeVisible({ timeout: 15000 });
      }
    });
  }
});
