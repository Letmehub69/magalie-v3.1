#!/usr/bin/env node
// Pre-flight Check — Run before spawning Bob
// Usage: node scripts/preflight-check.js
// Returns: exit 0 = GO, exit 1 = NO-GO (with reason)

require('./load-env.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(__dirname, '..');
const checks = [];

function check(name, fn) {
  try {
    const result = fn();
    checks.push({ name, status: result ? 'PASS' : 'FAIL', detail: result });
    return result;
  } catch (e) {
    checks.push({ name, status: 'FAIL', detail: e.message });
    return false;
  }
}

// 1. Gateway alive
check('Gateway (18789)', () => {
  const res = execSync('curl -sS --max-time 3 http://127.0.0.1:18789/health 2>/dev/null', { encoding: 'utf8' });
  const data = JSON.parse(res);
  return data.status === 'live' ? 'live' : false;
});

// 2. Supabase alive
check('Supabase (54321)', () => {
  const res = execSync('curl -sS --max-time 3 http://127.0.0.1:54321/rest/v1/ -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" 2>/dev/null', { encoding: 'utf8' });
  return res ? 'up' : false;
});

// 3. No active WIP (Bob not already running)
check('No active Bob (.work-in-progress.json)', () => {
  const wipPath = path.join(WORKSPACE, '.work-in-progress.json');
  if (!fs.existsSync(wipPath)) return 'no WIP file';
  const wip = JSON.parse(fs.readFileSync(wipPath, 'utf8'));
  if (wip.status === 'idle' || !wip.status) return 'idle';
  // Check if stale (>15 min)
  const started = new Date(wip.startedAt);
  const elapsed = (Date.now() - started.getTime()) / 60000;
  if (elapsed > 15) return `stale (${Math.floor(elapsed)}min) — safe to override`;
  return false; // Active Bob
});

// 4. Disk space
check('Disk space (>1GB free)', () => {
  const res = execSync("df -g / | tail -1 | awk '{print $4}'", { encoding: 'utf8' }).trim();
  const freeGB = parseInt(res);
  return freeGB >= 1 ? `${freeGB}GB free` : false;
});

// 5. Budget check
check('Budget (<$10 today)', () => {
  try {
    const res = execSync(`node ${path.join(__dirname, 'log-token-cost.js')} --check 2>/dev/null`, { encoding: 'utf8' });
    const data = JSON.parse(res);
    return data.status !== 'OVER_BUDGET' ? `$${data.total_spent?.toFixed(2) || '0'} spent` : false;
  } catch {
    return 'no cost data (OK)';
  }
});

// 6. Git clean (no uncommitted danger)
check('Git status (no conflicts)', () => {
  try {
    const res = execSync(`cd ${WORKSPACE} && git status --porcelain 2>/dev/null | grep "^UU" | wc -l`, { encoding: 'utf8' }).trim();
    return parseInt(res) === 0 ? 'clean' : false;
  } catch {
    return 'no git';
  }
});

// Report
const failed = checks.filter(c => c.status === 'FAIL');
const allPass = failed.length === 0;

console.log(JSON.stringify({
  result: allPass ? 'GO' : 'NO-GO',
  checks: checks.map(c => `[${c.status}] ${c.name}: ${c.detail || ''}`),
  failed: failed.map(c => c.name),
  timestamp: new Date().toISOString(),
}, null, 2));

process.exit(allPass ? 0 : 1);
