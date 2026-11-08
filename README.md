# precogn-tests

Automated, deterministic tests of PreCogn / Structory **public demos** — Playwright only, no
language model and no secret at execution time (Redmine #152, parent #140).

## What is covered

Static checks, no login required:
- the page loads without a console error
- no horizontal overflow at a 390px viewport
- the page's language (FR/EN) isn't mixed with the other

A connected walkthrough (the demo itself, the "Reset demo" action) is deliberately **not**
included yet: the public demo pages currently require a Google sign-in before reaching the demo
itself, which is a product gap (tracked separately), not something this suite works around.

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
(`smcdemo`, `jdbdemo`, `comptademo`, `comptacoprodemo`, `briqueteriedemo`, …) are ever touched.

## Adding a demo

One folder per demo under `tests/<demo>/`, one spec file per concern. Reuse the helpers in
`tests/helpers.js` (overflow check, FR/EN mixed-text heuristic) rather than duplicating them.

---

# precogn-tests (FR)

Tests automatiques, déterministes, des **démos publiques** PreCogn / Structory — Playwright
seul, aucun modèle de langage ni secret à l'exécution (Redmine #152, parent #140).

## Ce qui est couvert

Vérifications statiques, sans connexion :
- la page charge sans erreur console
- aucun débordement horizontal à 390px de large
- la langue de la page (FR/EN) n'est pas mélangée avec l'autre

Un parcours connecté (la démo elle-même, l'action « Réinitialiser la démo ») n'est volontairement
**pas** encore inclus : les pages de démo publiques exigent actuellement une connexion Google
avant d'atteindre la démo elle-même, ce qui est un écart produit (suivi à part), pas quelque
chose que cette suite contourne.

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
`briqueteriedemo`, …) sont jamais touchées.

## Ajouter une démo

Un dossier par démo sous `tests/<demo>/`, un fichier de spec par sujet. Réutiliser les
fonctions de `tests/helpers.js` (débordement, heuristique FR/EN mélangé) plutôt que de les
dupliquer.
