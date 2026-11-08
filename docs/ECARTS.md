# Écarts produit relevés par la suite (Redmine #152)

1 STRUCTORY §7.3 : une personne non connectée doit pouvoir tout essayer dans la démo publique
d'un module. Ce fichier liste les écarts constatés — jamais contournés par cette suite, qui ne
teste que ce qui est réellement accessible sans connexion.

## Green — aucune démo accessible

`https://structory.ai/demo/green?lang=fr` répond « Démo inconnue », alors que l'organisation
`greendemo` existe bien et est marquée `"statut": "officielle"` dans `/api/demo/orgs` (vérifié en
direct le 08/11/2026). Le mapping `/demo/<module>` du site vitrine (dépôt `sites-internet`) n'a
simplement pas d'entrée pour `green`. À corriger côté `sites-internet`, pas dans ce dépôt.

## Correction d'un signalement précédent (08/11/2026)

Une première investigation avait conclu, à tort, que la démo SMC n'était accessible que via
connexion Google. C'était une erreur de méthode (mauvaise URL testée : la page vitrine
`structory.ai/smc/`, qui ne montre pas de lien direct vers la démo, au lieu de
`structory.ai/demo/smc?lang=fr`, qui fonctionne sans connexion comme les autres modules). Corrigé
avant toute action produit inutile ; SMC, JdB, Compta et Compta Copro ont tous un accès démo
anonyme fonctionnel via ce même mécanisme `/demo/<module>`.
