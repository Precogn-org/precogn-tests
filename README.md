# precogn-tests

Automated, deterministic tests of PreCogn / Structory **public demos** — Playwright only, no
language model and no secret at execution time (Redmine #152, parent #140).

## Coverage matrix — module × declination

Every cell below is either a real, passing test or explicitly marked "not applicable" with the
precise reason — never a green cell with nothing behind it. Verified live on 2026-11-09; a
declination can be added later for a module once it genuinely exists.

9 modules total: 5 from Structory (SMC, JdB, Compta, Compta Copro, Green) and 4 from PreCogn (Le
coureur, L'emprunt, THE FACTORY, CTI). **La Briqueterie is not a module** — it's the shared engine
hosting Le coureur, L'emprunt and THE FACTORY, reachable via its current URL parameter; it isn't
tested as a module in its own right, only through each of those three.

| Module | Main (public demo) | App (PWA) | Add-on | Game |
|---|---|---|---|---|
| SMC | ✅ `tests/smc/` | ⛔ no `pwa.smc` entry in `modules.json` (sites-internet) | ✅ `tests/smc/addon.spec.js` (public page only, no Google account) | ⛔ not applicable |
| JdB | ✅ `tests/jdb/` | ⛔ no `pwa.jdb` entry | ⛔ `structory.ai/jdb/addon/` → 404, no add-on exists | ⛔ not applicable |
| Compta | ✅ `tests/compta/` | ✅ `tests/compta/app.spec.js` | ⛔ `structory.ai/compta/addon/` → 404, no add-on exists | ⚠️ `tests/game/` tests `structory.ai/game/` (load, 390px) but its attachment to Compta specifically is unconfirmed (content didn't vary by `orgId` in a live check) — kept in a neutral `tests/game/` folder, not forced under this module |
| Compta Copro | ✅ `tests/comptacopro/` | ✅ `tests/comptacopro/app.spec.js` | ✅ `tests/comptacopro/addon.spec.js` (public page only) | ⛔ not applicable |
| Green | ✅ `tests/green/` | ⛔ no `pwa.green` entry | ✅ `tests/green/addon.spec.js` (public page only) | ⛔ not applicable |
| Le coureur | ✅ `tests/lecoureur/` (shared engine, reached via its current URL parameter — coordinated with A15, who covers deep CI tests in the `briqueterie` repo) | ⛔ no PWA entry | ⛔ no add-on exists | ⚠️ this module's own demo is itself a game, but distinct from the dedicated `structory.ai/game/` declination — not re-tested here, already covered as part of Main |
| L'emprunt | ✅ `tests/lemprunt/` (shared engine, same coordination with A15) | ⛔ no PWA entry | ⛔ no add-on exists | ⛔ not applicable |
| THE FACTORY | ✅ `tests/thefactory/` (`precogn.org/thefactory/` page + `structory.ai/thefactory/demo/` fictional walkthrough, no real payment triggered; also reachable and tested via the shared engine) | ⛔ no `pwa.thefactory` entry | ⛔ `structory.ai/thefactory/addon/` → 404, no add-on exists | ⛔ not applicable |
| CTI (Connect the Internet) | ⛔ not testable — no public demo yet (repo `Precogn-org/precogn-connect`, private); `precogn.org/connect/` returns 200 but is only the generic PreCogn homepage, served identically for any unrecognized path (confirmed live, not a dedicated CTI page) | ⛔ not testable, same reason | ⛔ not testable, same reason | ⛔ not testable, same reason |

**Add-on testing boundary** (deliberate, Google-account demos can't run in CI): only the public
marketing page, privacy/terms links and naming are checked — never the actual Google Sheets
connection, which needs a real signed-in account.

**End-to-end signature walkthrough** (email verification, Sign click, confirmation screen, and
the click→confirmation delay that caused a real production incident on 2026-11-08): now written,
`tests/signature-e2e/e2e-signature.manual.spec.js` — but **never** picked up by the normal suite
or the nightly run (`testIgnore` in `playwright.config.js`): it sends a real email and consumes a
single-use signing token. Manual only, with a fresh token each time: `npm run test:e2e-signature`
(uses `playwright.e2e-signature.config.js`), reading `E2E_SIGNATURE_URL`/`E2E_SIGNATURE_EMAIL`
(required) and `E2E_SIGNATURE_CODE` (optional — without it, the test stops cleanly right after
requesting a code, token still unconsumed) from the environment, never hardcoded. Measures the
click "Sign" → confirmation-screen delay, capped at 10s (the threshold proposed after the
2026-11-08 incident).

## PreSeed page (investor outreach)

`tests/preseed/preseed.spec.js` covers `structory.ai/preseed/` (EN) and `structory.ai/fr/preseed/`
(FR) — not a module, a single dedicated page, so it sits outside the matrix above. Six checks per
language: traction figures are real (fetched from `/api/preseed/traction` directly, not just read
off the DOM) and never 0; no table of repositories and no direct link to a named repository (only
the generic organization link); every link on the page resolves 2xx; no common word from the other
language appears in the visible text (a short, deliberately unambiguous function-word list per
language, with an explicit exception list for shared proper nouns — Structory, BYOS, WhatsApp,
PreCogn, GitHub, country/founder names); the EN|FR selector actually navigates and updates
`aria-current`/`<html lang>`; the last collection timestamp is under 36h (the daily collection has
its own cron, separate from this suite's nightly one — a stale timestamp here means that cron
failed, surfaced the same way as any other nightly failure, see CI below).

## Demo registry consistency

`tests/registre/coherence-registre.spec.js` checks the public `/api/demo/orgs` registry itself,
cross-cutting rather than per-module: no duplicate `orgId`, every legacy ("héritée") entry points
to an official one that actually exists, and — driven live off that same registry, not a hardcoded
list — every officially listed organization for Compta, Compta Copro, Green, JdB and SMC really
resolves to real content on its public demo. **Known, documented limit, not worked around**:
whether an `orgId` has a backend registered in Docling itself can only be checked directly via
`GET /api/docling/orgs`/`GET /api/docling/connectors`, both protected by a service key (confirmed
live: 401 without one) — this suite cannot and does not attempt to read that. La Briqueterie (and
so Le coureur/L'emprunt/THE FACTORY) is intentionally excluded from the per-module check above: its
demo lives at a different URL entirely (`precogn.org/briqueterie/`), not through this registry's
`/demo/<module>` mechanism.

## What is covered (static checks, every Main/App declination)

- the page loads without a console error
- no horizontal overflow at a 390px viewport
- the page's language (FR/EN) isn't mixed with the other
- a safe key action where one exists and is stable (reset, a toggle, a short guided flow) — never
  invented, never a button that sends a real email, charges a real payment, or calls a real AI

## Running locally

```bash
npm install
npx playwright install chromium
npx playwright test
```

Reports: an HTML report (`rapport-html/`) and a JSON report (`rapport.json`), both git-ignored —
regenerated on every run, never committed.

## CI

`.github/workflows/demos.yml` runs the suite nightly (cron) and on every pull request that
touches `tests/`, `playwright.config.js` or the workflow itself. The GitHub Actions runner is
isolated from our infrastructure: no secret is used or needed, only public demo organizations
(`smcdemo`, `jdbdemo`, `comptademo`, `comptacoprodemo`, `greendemo`, `briqueteriedemo`, …) are
ever touched. A failed nightly run opens or updates a GitHub issue in this repo — never a Redmine
ticket or config change.

## Adding a demo

One folder per module under `tests/<module>/`, one spec file per declination
(`<module>.spec.js` for Main, `app.spec.js`, `addon.spec.js`, `game.spec.js`). Reuse the helpers
in `tests/helpers.js` (`sansDebordementHorizontal`, `texteMelange`, `cadreContenu`/`texteVisible`
for apps rendered inside nested iframes, `verifierPwaInstallable` for App declinations) rather
than duplicating them. Update the matrix above in the same PR.

---

# precogn-tests (FR)

Tests automatiques, déterministes, des **démos publiques** PreCogn / Structory — Playwright
seul, aucun modèle de langage ni secret à l'exécution (Redmine #152, parent #140).

## Matrice de couverture — module × déclinaison

Chaque case ci-dessous est soit un vrai test qui passe, soit explicitement marquée « non
applicable » avec la raison précise — jamais une case verte sans rien derrière. Vérifiée en
direct le 09/11/2026 ; une déclinaison pourra être ajoutée plus tard pour un module dès qu'elle
existera vraiment.

9 modules en tout : 5 côté Structory (SMC, JdB, Compta, Compta Copro, Green) et 4 côté PreCogn
(Le coureur, L'emprunt, THE FACTORY, CTI). **La Briqueterie n'est pas un module** — c'est le
moteur commun qui héberge Le coureur, L'emprunt et THE FACTORY, atteignable via le paramètre de
son URL actuelle ; elle n'est pas testée comme module en elle-même, seulement à travers ces trois-là.

| Module | Main (démo publique) | Appli (PWA) | Add-on | Game |
|---|---|---|---|---|
| SMC | ✅ `tests/smc/` | ⛔ aucune entrée `pwa.smc` dans `modules.json` (sites-internet) | ✅ `tests/smc/addon.spec.js` (page publique seulement, aucun compte Google) | ⛔ non applicable |
| JdB | ✅ `tests/jdb/` | ⛔ aucune entrée `pwa.jdb` | ⛔ `structory.ai/jdb/addon/` → 404, aucun add-on n'existe | ⛔ non applicable |
| Compta | ✅ `tests/compta/` | ✅ `tests/compta/app.spec.js` | ⛔ `structory.ai/compta/addon/` → 404, aucun add-on n'existe | ⚠️ `tests/game/` teste `structory.ai/game/` (chargement, 390px) mais son rattachement précis à Compta n'est pas confirmé (contenu identique quel que soit `orgId` en vérification directe) — gardé dans un dossier neutre `tests/game/`, pas forcé sous ce module |
| Compta Copro | ✅ `tests/comptacopro/` | ✅ `tests/comptacopro/app.spec.js` | ✅ `tests/comptacopro/addon.spec.js` (page publique seulement) | ⛔ non applicable |
| Green | ✅ `tests/green/` | ⛔ aucune entrée `pwa.green` | ✅ `tests/green/addon.spec.js` (page publique seulement) | ⛔ non applicable |
| Le coureur | ✅ `tests/lecoureur/` (moteur commun, atteint via le paramètre de son URL actuelle — coordonné avec A15, qui couvre les tests profonds en CI dans le dépôt `briqueterie`) | ⛔ aucune entrée PWA | ⛔ aucun add-on n'existe | ⚠️ la démo de ce module est elle-même un jeu, mais distincte de la déclinaison dédiée `structory.ai/game/` — pas retestée ici, déjà couverte dans Main |
| L'emprunt | ✅ `tests/lemprunt/` (moteur commun, même coordination avec A15) | ⛔ aucune entrée PWA | ⛔ aucun add-on n'existe | ⛔ non applicable |
| THE FACTORY | ✅ `tests/thefactory/` (page `precogn.org/thefactory/` + parcours fictif `structory.ai/thefactory/demo/`, aucun paiement réel déclenché ; aussi atteignable et testée via le moteur commun) | ⛔ aucune entrée `pwa.thefactory` | ⛔ `structory.ai/thefactory/addon/` → 404, aucun add-on n'existe | ⛔ non applicable |
| CTI (Connect the Internet) | ⛔ non testable — aucune démo publique pour l'instant (dépôt `Precogn-org/precogn-connect`, privé) ; `precogn.org/connect/` répond 200 mais n'est que la page d'accueil générique de PreCogn, servie à l'identique pour n'importe quelle URL non reconnue (vérifié en direct, pas une page CTI dédiée) | ⛔ non testable, même raison | ⛔ non testable, même raison | ⛔ non testable, même raison |

**Limite volontaire du test Add-on** (les démos à compte Google ne peuvent pas tourner en CI) :
seules la page publique, les liens confidentialité/conditions et le nom/la marque sont vérifiés —
jamais la vraie connexion Google Sheets, qui exige un compte réel.

**Parcours de bout en bout de la signature** (vérification e-mail, clic Signer, écran de
confirmation, et le délai clic→confirmation à l'origine d'un vrai incident en production le
08/11/2026) : désormais écrit, `tests/signature-e2e/e2e-signature.manual.spec.js` -- mais
**jamais** ramassé par la suite normale ni par le passage nocturne (`testIgnore` dans
`playwright.config.js`) : il envoie un vrai e-mail et consomme un jeton de signature à usage
unique. Geste manuel uniquement, avec un jeton frais à chaque fois : `npm run
test:e2e-signature` (utilise `playwright.e2e-signature.config.js`), lit `E2E_SIGNATURE_URL`/
`E2E_SIGNATURE_EMAIL` (obligatoires) et `E2E_SIGNATURE_CODE` (optionnel -- sans lui, le test
s'arrête proprement juste après avoir demandé le code, jeton pas encore consommé) depuis
l'environnement, jamais en dur. Mesure le délai clic « Signer » → écran de confirmation,
plafonné à 10s (seuil proposé à la suite de l'incident du 08/11/2026).

## Page PreSeed (démarchage investisseurs)

`tests/preseed/preseed.spec.js` couvre `structory.ai/preseed/` (EN) et `structory.ai/fr/preseed/`
(FR) — pas un module, une seule page dédiée, donc hors de la matrice ci-dessus. Six vérifications
par langue : les chiffres de traction sont réels (lus directement sur `/api/preseed/traction`, pas
seulement sur le DOM) et jamais à 0 ; aucun tableau de dépôts ni lien direct vers un dépôt nommé
(seul le lien générique vers l'organisation reste) ; tous les liens de la page répondent en 2xx ;
aucun mot courant de l'autre langue dans le texte visible (liste courte et volontairement sans
ambiguïté par langue, avec une liste d'exceptions explicite pour les noms propres partagés --
Structory, BYOS, WhatsApp, PreCogn, GitHub, noms de pays/fondateur) ; le sélecteur EN|FR navigue
réellement et met à jour `aria-current`/`<html lang>` ; l'horodatage de dernière collecte a moins
de 36h (la collecte quotidienne a son propre cron, distinct de celui, nocturne, de cette suite --
un horodatage périmé ici signale que ce cron-là a échoué, visible via la même alerte que tout autre
échec nocturne, voir CI ci-dessous).

## Cohérence du registre des démos

`tests/registre/coherence-registre.spec.js` vérifie le registre public `/api/demo/orgs`
lui-même, transversal plutôt que par module : aucun `orgId` dupliqué, chaque entrée héritée
pointe vers une organisation officielle qui existe vraiment, et -- piloté en direct par ce même
registre, pas par une liste codée en dur -- chaque organisation officielle de Compta, Compta
Copro, Green, JdB et SMC résout réellement du contenu sur sa démo publique. **Limite connue,
documentée, pas contournée** : savoir si un `orgId` a un backend enregistré dans Docling lui-même
ne peut se vérifier directement que via `GET /api/docling/orgs`/`GET /api/docling/connectors`,
tous deux protégés par une clé de service (vérifié en direct : 401 sans clé) -- cette suite ne
peut pas et ne tente pas de le lire. La Briqueterie (donc Le coureur/L'emprunt/THE FACTORY) est
volontairement exclue de la vérification par module ci-dessus : sa démo vit à une URL entièrement
différente (`precogn.org/briqueterie/`), pas via le mécanisme `/demo/<module>` de ce registre.

## Ce qui est couvert (vérifications statiques, chaque déclinaison Main/Appli)

- la page charge sans erreur console
- aucun débordement horizontal à 390px de large
- la langue de la page (FR/EN) n'est pas mélangée avec l'autre
- une action clé sûre là où elle existe et reste stable (réinitialiser, basculer un affichage, un
  court parcours guidé) — jamais inventée, jamais un bouton qui envoie un vrai e-mail, débite un
  vrai paiement ou appelle une vraie IA

## Lancer en local

```bash
npm install
npx playwright install chromium
npx playwright test
```

Rapports : un rapport HTML (`rapport-html/`) et un rapport JSON (`rapport.json`), tous deux
ignorés par git — regénérés à chaque exécution, jamais commités.

## CI

`.github/workflows/demos.yml` lance la suite chaque nuit (cron) et à chaque pull request qui
touche `tests/`, `playwright.config.js` ou le workflow lui-même. Le runner GitHub Actions est
isolé de notre infrastructure : aucun secret n'est utilisé ni nécessaire, seules des
organisations de démo publiques (`smcdemo`, `jdbdemo`, `comptademo`, `comptacoprodemo`,
`greendemo`, `briqueteriedemo`, …) sont jamais touchées. Un passage nocturne en échec ouvre ou
met à jour une issue GitHub dans ce dépôt — jamais un ticket Redmine ni une modification de
configuration.

## Ajouter une démo

Un dossier par module sous `tests/<module>/`, un fichier de spec par déclinaison
(`<module>.spec.js` pour Main, `app.spec.js`, `addon.spec.js`, `game.spec.js`). Réutiliser les
fonctions de `tests/helpers.js` (`sansDebordementHorizontal`, `texteMelange`,
`cadreContenu`/`texteVisible` pour les applis rendues dans des iframes imbriquées,
`verifierPwaInstallable` pour la déclinaison Appli) plutôt que de les dupliquer. Mettre à jour la
matrice ci-dessus dans la même PR.
