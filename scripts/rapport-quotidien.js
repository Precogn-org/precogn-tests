#!/usr/bin/env node
// Rapport quotidien (Redmine #152, premier lot) : résumé vert/rouge par module, lu depuis
// rapport.json (déjà généré par le reporter JSON de Playwright, voir playwright.config.js) --
// aucun réseau, aucune clé, aucun modèle de langage. Affiché sur $GITHUB_STEP_SUMMARY chaque
// nuit (voir .github/workflows/demos.yml), jamais un ticket Redmine ni une modification de
// configuration (même règle que l'alerte d'échec existante).
'use strict';
const fs = require('fs');
const path = require('path');

function compterParModule(rapport) {
  const parModule = new Map();

  function enregistrer(module_, status) {
    if (!parModule.has(module_)) parModule.set(module_, { reussis: 0, echoues: 0, ignores: 0 });
    const c = parModule.get(module_);
    if (status === 'skipped') c.ignores++;
    else if (status === 'expected') c.reussis++;
    else c.echoues++;
  }

  function parcourirSuite(suite, module_) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        enregistrer(module_, test.status);
      }
    }
    for (const s of suite.suites || []) parcourirSuite(s, module_);
  }

  for (const suite of rapport.suites || []) {
    // Fichier top-level = "<module>/<declinaison>.spec.js" (convention du dépôt, voir README
    // "Adding a demo") -- le premier segment est toujours le module.
    const module_ = (suite.file || suite.title || 'inconnu').split('/')[0];
    parcourirSuite(suite, module_);
  }
  return parModule;
}

function genererMarkdown(rapport) {
  const parModule = compterParModule(rapport);
  const { expected = 0, unexpected = 0, flaky = 0, skipped = 0 } = rapport.stats || {};
  const etatGlobal = unexpected === 0 ? '🟢 VERT' : '🔴 ROUGE';

  const lignes = [];
  lignes.push('## Rapport quotidien des démos publiques (Redmine #152)');
  lignes.push('');
  lignes.push(`**État global : ${etatGlobal}** — ${expected} réussi(s), ${unexpected} échoué(s), ${flaky} instable(s), ${skipped} ignoré(s).`);
  lignes.push('');
  lignes.push('| Module | Réussis | Échoués | Ignorés |');
  lignes.push('|---|---|---|---|');
  for (const module_ of [...parModule.keys()].sort()) {
    const c = parModule.get(module_);
    const etat = c.echoues > 0 ? '🔴' : '🟢';
    lignes.push(`| ${etat} ${module_} | ${c.reussis} | ${c.echoues} | ${c.ignores} |`);
  }
  lignes.push('');
  lignes.push('Détail complet (captures d\'écran, traces) : artefact `rapport-playwright` de ce run.');
  return lignes.join('\n') + '\n';
}

function main() {
  const cheminRapport = process.argv[2] || path.join(__dirname, '..', 'rapport.json');
  const rapport = JSON.parse(fs.readFileSync(cheminRapport, 'utf-8'));
  process.stdout.write(genererMarkdown(rapport));
}

if (require.main === module) main();

module.exports = { compterParModule, genererMarkdown };
