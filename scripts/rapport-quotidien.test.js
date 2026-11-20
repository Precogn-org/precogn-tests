// Test du générateur de rapport quotidien (Redmine #152) -- aucun réseau, données fabriquées
// (jamais un vrai rapport.json). Lancer : node scripts/rapport-quotidien.test.js
'use strict';
const assert = require('node:assert');
const { compterParModule, genererMarkdown } = require('./rapport-quotidien');

function rapportFabrique(statutSmc, statutJdb) {
  const unexpected = [statutSmc, statutJdb].filter((s) => s === 'unexpected').length;
  const skipped = [statutSmc, statutJdb].filter((s) => s === 'skipped').length;
  return {
    stats: { expected: 2 - unexpected - skipped, unexpected, flaky: 0, skipped },
    suites: [
      { file: 'smc/smc.spec.js', specs: [{ tests: [{ status: statutSmc }] }], suites: [] },
      { file: 'jdb/jdb.spec.js', specs: [{ tests: [{ status: statutJdb }] }], suites: [] },
    ],
  };
}

// 1. tout vert
{
  const r = rapportFabrique('expected', 'expected');
  const parModule = compterParModule(r);
  assert.deepStrictEqual(parModule.get('smc'), { reussis: 1, echoues: 0, ignores: 0 });
  assert.deepStrictEqual(parModule.get('jdb'), { reussis: 1, echoues: 0, ignores: 0 });
  const md = genererMarkdown(r);
  assert.ok(md.includes('🟢 VERT'), 'etat global vert attendu');
  assert.ok(!md.includes('🔴'), 'aucun rouge attendu quand tout passe');
}

// 2. un module en echec
{
  const r = rapportFabrique('expected', 'unexpected');
  const parModule = compterParModule(r);
  assert.deepStrictEqual(parModule.get('jdb'), { reussis: 0, echoues: 1, ignores: 0 });
  const md = genererMarkdown(r);
  assert.ok(md.includes('🔴 ROUGE'), 'etat global rouge attendu si un module echoue');
  assert.ok(/🔴 jdb/.test(md), 'le module en echec doit etre marque rouge dans le tableau');
  assert.ok(/🟢 smc/.test(md), 'le module qui passe doit rester vert');
}

// 3. un module ignore (skipped) ne compte jamais comme un echec
{
  const r = rapportFabrique('expected', 'skipped');
  const parModule = compterParModule(r);
  assert.deepStrictEqual(parModule.get('jdb'), { reussis: 0, echoues: 0, ignores: 1 });
  const md = genererMarkdown(r);
  assert.ok(md.includes('🟢 VERT'), 'un test ignore seul ne doit pas rendre le global rouge');
}

// 4. un module absent du rapport n'apparait pas dans le tableau (pas de ligne fantome)
{
  const r = rapportFabrique('expected', 'expected');
  const md = genererMarkdown(r);
  assert.ok(!md.includes('compta'), 'un module non execute ne doit jamais apparaitre');
}

console.log('rapport-quotidien.test.js : OK (4 scénarios)');
