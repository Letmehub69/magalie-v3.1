#!/usr/bin/env node
// Scout Runner — Atomicity validation before BUILD
// Usage: node scripts/scout-runner.js --task "Build auth system" --nodes '["Create login form","Add API endpoint","Write tests"]'
// Returns: APPROVED or NEEDS_DECOMPOSITION with suggestions

require('./load-env.js');
const fs = require('fs');
const path = require('path');

const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith('--')) args[arg.slice(2)] = arr[i + 1] || true;
});

const task = args.task || 'Unknown task';
let nodes = [];
try { nodes = JSON.parse(args.nodes || '[]'); } catch { nodes = (args.nodes || '').split(',').filter(Boolean); }

const results = [];

function validate(node, index) {
  const issues = [];
  const title = typeof node === 'string' ? node : node.title || node;

  // Check 1: Title clarity
  const vagueWords = ['fix stuff', 'update things', 'make changes', 'do work', 'misc', 'various'];
  if (vagueWords.some(w => title.toLowerCase().includes(w))) {
    issues.push('Title trop vague — preciser exactement quoi');
  }

  // Check 2: Scope (multiple actions = not atomic)
  const multiAction = title.match(/\b(et|and|plus|aussi|then|puis)\b/gi);
  if (multiAction && multiAction.length > 0) {
    issues.push(`Multiple actions detectees ("${multiAction.join('", "')}") — decomposer`);
  }

  // Check 3: File count estimate
  const fileRefs = title.match(/\.(tsx|ts|js|css|md|json|sql)/gi);
  if (fileRefs && fileRefs.length > 3) {
    issues.push(`${fileRefs.length} fichiers references — max 3 par noeud atomique`);
  }

  // Check 4: Estimable (<10 min)
  const bigWords = ['entire', 'complete', 'full', 'all', 'refactor', 'migrate', 'rewrite', 'tout', 'complet', 'entier'];
  if (bigWords.some(w => title.toLowerCase().includes(w))) {
    issues.push('Scope potentiellement trop large — verifier estimation <10min');
  }

  const passed = issues.length === 0;
  results.push({
    index: index + 1,
    title,
    status: passed ? 'OK' : 'SPLIT',
    issues,
  });

  return passed;
}

console.log(`🔍 SCOUT — Atomicity Validation`);
console.log(`Task: ${task}`);
console.log(`Nodes: ${nodes.length}\n`);

if (nodes.length === 0) {
  console.log('❌ Aucun noeud fourni. Usage: --nodes \'["node1","node2"]\'');
  process.exit(1);
}

nodes.forEach((n, i) => validate(n, i));

const passed = results.filter(r => r.status === 'OK').length;
const total = results.length;
const verdict = passed === total ? 'APPROVED' : 'NEEDS_DECOMPOSITION';

const report = `
🔍 SCOUT — Atomicity Report
Task: ${task}
Nodes: ${total}

${results.map(r =>
  `[${r.status}] Noeud ${r.index}: "${r.title}"${r.issues.length > 0 ? '\n     ' + r.issues.join('\n     ') : ''}`
).join('\n')}

Verdict: ${verdict} (${passed}/${total} atomiques)
`.trim();

console.log('\n' + report);

console.log('\n' + JSON.stringify({
  agent: 'scout',
  task,
  score: passed,
  total,
  verdict,
  results: results.map(r => ({ title: r.title, status: r.status, issues: r.issues })),
  timestamp: new Date().toISOString(),
}));

process.exit(verdict === 'APPROVED' ? 0 : 1);
