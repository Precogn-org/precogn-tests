# Écarts produit relevés par la suite (Redmine #152)

1 STRUCTORY §7.3 : une personne non connectée doit pouvoir tout essayer dans la démo publique
d'un module. Ce fichier liste les écarts constatés — jamais contournés par cette suite, qui ne
teste que ce qui est réellement accessible sans connexion.

## Green — résolu (08/11/2026)

`https://structory.ai/demo/green?lang=fr` répondait « Démo inconnue » alors que l'organisation
`greendemo` existe bien dans `/api/demo/orgs` (statut « officielle »). Revérifié le 08/11/2026 :
la démo répond maintenant correctement (corrigé côté `sites-internet`, hors de ce dépôt). Testée
dans `tests/green/green.spec.js`.

## Déclinaisons non applicables, par module (QA quotidien Boss, demande relayée par V00 08/11/2026)

Seules les déclinaisons qui existent réellement sont testées ; jamais d'URL inventée pour celles
qui n'existent pas. Vérifié avant d'écrire ce tableau (lecture de `pwa` dans `modules.json`,
dépôt `sites-internet`, et de l'accueil de chaque module) :

| Module | MAIN (démo) | APP (PWA) | ADD-ON | GAME |
|---|---|---|---|---|
| SMC | testé | non applicable -- aucune entrée `pwa.smc` dans `modules.json` | non applicable à cette suite -- l'add-on Google Sheets de SMC exige un compte de test dédié, liste de contrôle manuelle (#152, hors Playwright) | non applicable -- SMC n'a pas de déclinaison jeu |
| JdB | testé | non applicable -- aucune entrée `pwa.jdb` | non applicable -- pas d'add-on connu pour JdB | non applicable |
| Compta | testé | testé (`tests/compta/app.spec.js`, manifeste + service worker vérifiés sur `/compta-app/`) | non applicable -- pas d'add-on connu pour Compta | non applicable |
| Compta Copro | testé | testé (`tests/comptacopro/app.spec.js`, `/comptacopro-app/`) | non applicable -- pas d'add-on connu pour Compta Copro | non applicable |
| Green | testé | non applicable -- aucune entrée `pwa.green` | non applicable | non applicable |
| Briqueterie | testé (`tests/briqueterie/`, coordination A15) | non applicable -- aucune entrée `pwa.briqueterie`, page directe sans manifeste détecté | non applicable | « Game » (`structory.ai/game/`) est un produit séparé, pas une déclinaison de la Briqueterie -- non applicable ici |

## Correction d'un signalement précédent (08/11/2026)

Une première investigation avait conclu, à tort, que la démo SMC n'était accessible que via
connexion Google. C'était une erreur de méthode (mauvaise URL testée : la page vitrine
`structory.ai/smc/`, qui ne montre pas de lien direct vers la démo, au lieu de
`structory.ai/demo/smc?lang=fr`, qui fonctionne sans connexion comme les autres modules). Corrigé
avant toute action produit inutile ; SMC, JdB, Compta et Compta Copro ont tous un accès démo
anonyme fonctionnel via ce même mécanisme `/demo/<module>`.
