#!/usr/bin/env node
// Auto-Rollback — Emergency recovery when build breaks things
// Usage: node scripts/auto-rollback.js [--confirm]
// Without --confirm: dry-run showing what would happen
// With --confirm: executes rollback

require('./load-env.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(__dirname, '..');
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const confirm = process.argv.includes('--confirm');

const steps = [];

function log(msg, level = 'info') {
  steps.push({ msg, level, timestamp: new Date().toISOString() });
  console.log(JSON.stringify({ level, msg }));
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: WORKSPACE, ...opts }).trim();
  } catch (e) {
    return e.stderr || e.message;
  }
}

async function alertDiscord(message) {
  if (!DISCORD_WEBHOOK) return;
  try {
    execSync(`curl -sS -X POST "${DISCORD_WEBHOOK}" -H "Content-Type: application/json" -d '${JSON.stringify({ content: message })}'`, { encoding: 'utf8' });
  } catch { /* silent */ }
}

async function rollback() {
  log('🔴 AUTO-ROLLBACK INITIATED');

  // Step 1: Stop any active work
  log('Step 1: Resetting WIP Protocol');
  const wipPath = path.join(WORKSPACE, '.work-in-progress.json');
  if (confirm) {
    fs.writeFileSync(wipPath, JSON.stringify({
      status: 'idle',
      taskId: null,
      description: 'Auto-rollback',
      startedAt: new Date().toISOString(),
      nextStep: 'Review what went wrong',
    }, null, 2));
  }

  // Step 2: Check git status
  const gitStatus = run('git status --porcelain');
  const changedFiles = gitStatus.split('\n').filter(l => l.trim()).length;
  log(`Step 2: ${changedFiles} files changed in working tree`);

  // Step 3: Stash changes (don't lose work)
  if (changedFiles > 0) {
    log('Step 3: Stashing changes (preserving work)');
    if (confirm) {
      run('git stash push -m "auto-rollback-' + Date.now() + '"');
    }
  } else {
    log('Step 3: Working tree clean, no stash needed');
  }

  // Step 4: Validate agents
  const validatorPath = path.join(__dirname, 'agents-validator.js');
  if (fs.existsSync(validatorPath)) {
    log('Step 4: Running agents-validator.js');
    if (confirm) {
      const result = run(`node ${validatorPath}`);
      log(`Validator result: ${result.substring(0, 200)}`);
    }
  } else {
    log('Step 4: agents-validator.js not found, skipping');
  }

  // Step 5: Verify critical files exist
  const criticalFiles = ['AGENTS.md', 'SOUL.md', 'BLUEPRINT.md', 'HEARTBEAT.md', 'TOOLS.md'];
  const missing = criticalFiles.filter(f => !fs.existsSync(path.join(WORKSPACE, f)));
  if (missing.length > 0) {
    log(`Step 5: CRITICAL — Missing files: ${missing.join(', ')}`, 'error');
    if (confirm) {
      // Restore from git
      missing.forEach(f => {
        run(`git checkout HEAD -- ${f}`);
        log(`  Restored ${f} from HEAD`);
      });
    }
  } else {
    log('Step 5: All critical files present');
  }

  // Step 6: Alert Discord
  const summary = `🔴 **AUTO-ROLLBACK** ${confirm ? 'EXECUTED' : '(DRY RUN)'}\n` +
    `- ${changedFiles} files affected\n` +
    `- ${missing.length} critical files ${missing.length > 0 ? 'restored: ' + missing.join(', ') : 'OK'}\n` +
    `- Changes stashed (not lost)\n` +
    `- Run \`git stash list\` to see saved work`;

  log(`Step 6: ${confirm ? 'Alerting' : 'Would alert'} Discord`);
  if (confirm) {
    await alertDiscord(summary);
  }

  // Final report
  console.log(JSON.stringify({
    result: confirm ? 'ROLLBACK_COMPLETE' : 'DRY_RUN',
    files_changed: changedFiles,
    critical_missing: missing,
    steps: steps.length,
    note: confirm ? 'Changes stashed, not lost. Run: git stash pop' : 'Add --confirm to execute',
  }, null, 2));
}

rollback();
