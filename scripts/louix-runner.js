#!/usr/bin/env node
// Louix Runner — Automated UI validation post-BUILD
// Usage: node scripts/louix-runner.js --files "src/components/TaskBoard.tsx,src/components/CommandDeck.tsx" --project-dir /Users/house/clawbuddy
// Called by Magalie after any BUILD that modifies .tsx files

require('./load-env.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith('--')) args[arg.slice(2)] = arr[i + 1] || true;
});

const projectDir = args['project-dir'] || '/Users/house/clawbuddy';
const files = (args.files || '').split(',').filter(Boolean);
const criteria = JSON.parse(fs.readFileSync(path.join(__dirname, 'agents/louix-mc-criteria.json'), 'utf8'));

const results = [];

function check(name, fn) {
  try {
    const passed = fn();
    results.push({ name, passed, detail: passed ? 'OK' : 'FAIL' });
    return passed;
  } catch (e) {
    results.push({ name, passed: false, detail: e.message });
    return false;
  }
}

console.log('🎨 LOUIX — UI Validation Starting');
console.log(`Project: ${projectDir}`);
console.log(`Files: ${files.length > 0 ? files.join(', ') : 'all modified'}\n`);

// 1. Build clean
check('Build Clean', () => {
  const out = execSync(`cd ${projectDir} && npm run build 2>&1`, { encoding: 'utf8', timeout: 60000 });
  return !out.includes('error TS') && out.includes('built in');
});

// 2. UI States — check for common issues in modified files
check('UI States', () => {
  const targetFiles = files.length > 0 ? files : [];
  let issues = 0;

  for (const f of targetFiles) {
    const fullPath = path.join(projectDir, f);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');

    // Check for common UI issues
    if (content.includes('TODO') || content.includes('FIXME')) issues++;
    if (content.includes('display: none') && !content.includes('conditional')) issues++;
    if (content.includes('z-index: 9999')) issues++;
    if (content.includes('overflow: hidden') && content.includes('scroll')) issues++;
  }

  return issues === 0;
});

// 3. Design System
check('Design System', () => {
  const targetFiles = files.length > 0 ? files : [];
  let violations = 0;
  const palette = ['#0a0a0f', '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#f9fafb', '#9ca3af', '#6b7280',
    'rgba(17, 24, 39', 'rgba(255, 255, 255', 'var(--', 'emerald', 'cyan', 'amber', 'red', 'gray'];

  for (const f of targetFiles) {
    const fullPath = path.join(projectDir, f);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');

    // Find hardcoded colors not in palette
    const colorMatches = content.match(/#[0-9a-fA-F]{6}/g) || [];
    for (const color of colorMatches) {
      if (!palette.some(p => p.toLowerCase() === color.toLowerCase())) {
        // Allow common Tailwind colors
        if (!content.includes(`'${color}'`) || color === '#ffffff' || color === '#000000') continue;
        violations++;
      }
    }
  }

  return violations === 0;
});

// 4. Responsive
check('Responsive', () => {
  const targetFiles = files.length > 0 ? files : [];
  let hasResponsive = files.length === 0; // Pass if no files specified

  for (const f of targetFiles) {
    const fullPath = path.join(projectDir, f);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');

    // Check for responsive classes
    if (content.includes('sm:') || content.includes('md:') || content.includes('lg:') ||
        content.includes('grid-cols-1') || content.includes('flex-col')) {
      hasResponsive = true;
    }
  }

  return hasResponsive;
});

// 5. Animations
check('Animations', () => {
  const targetFiles = files.length > 0 ? files : [];
  let hasMotion = files.length === 0;

  for (const f of targetFiles) {
    const fullPath = path.join(projectDir, f);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes('motion.') || content.includes('AnimatePresence') ||
        content.includes('transition') || content.includes('framer-motion')) {
      hasMotion = true;
    }
  }

  return hasMotion;
});

// Report
const score = results.filter(r => r.passed).length;
const verdict = score === 5 ? 'APPROVED' : score === 4 ? 'NEEDS_FIX (minor)' : 'NEEDS_FIX (critical)';

const report = `
🎨 LOUIX — UI Validation Report
Files: ${files.join(', ') || 'general check'}
Score: ${score}/5

${results.map(r => `[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}${r.passed ? '' : ' — ' + r.detail}`).join('\n')}

Verdict: ${verdict}
${score < 5 ? 'Issues: ' + results.filter(r => !r.passed).map(r => r.name).join(', ') : ''}
`.trim();

console.log('\n' + report);

// Output as JSON for automation
console.log('\n' + JSON.stringify({
  agent: 'louix',
  score,
  max_score: 5,
  verdict,
  results: results.map(r => ({ name: r.name, passed: r.passed, detail: r.detail })),
  files,
  timestamp: new Date().toISOString(),
}));

process.exit(score >= 5 ? 0 : 1);
