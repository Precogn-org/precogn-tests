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
the click→confirmation delay that caused a real production incident on 2026-11-08): prepared
separately, gated on an explicit go-ahead for sending real production emails — see Redmine #152.

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
08/11/2026) : préparé à part, soumis à un accord explicite avant tout envoi de vrai e-mail en
production — voir Redmine #152.

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
