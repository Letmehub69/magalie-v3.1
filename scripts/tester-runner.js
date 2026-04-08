#!/usr/bin/env node
// Tester Runner — Automated API/logic validation post-BUILD
// Usage: node scripts/tester-runner.js --scope "ai-tasks" --endpoints "task/create,log/create,memory/submit"
// Usage: node scripts/tester-runner.js --scope "scripts" --scripts "preflight-check.js,log-token-cost.js"

require('./load-env.js');
const { execSync } = require('child_process');

const config = {
  apiUrl: process.env.CLAWBUDDY_API_URL || 'http://127.0.0.1:54321',
  secret: process.env.CLAWBUDDY_WEBHOOK_SECRET,
};

const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith('--')) args[arg.slice(2)] = arr[i + 1] || true;
});

const results = [];

function check(name, fn) {
  try {
    const result = fn();
    results.push({ name, passed: !!result, detail: result || 'OK' });
    return !!result;
  } catch (e) {
    results.push({ name, passed: false, detail: e.message.substring(0, 200) });
    return false;
  }
}

async function testEndpoints() {
  const endpoints = (args.endpoints || 'task/list,log/create,memory/list,queue/list,status/update,channel/list').split(',');

  const testPayloads = {
    'task/list': '{"request_type":"task","action":"list"}',
    'task/create': '{"request_type":"task","action":"create","title":"Tester validation","column":"to_do","priority":"low","agent_name":"Tester","agent_emoji":"✅"}',
    'log/create': '{"request_type":"log","action":"create","category":"general","message":"Tester validation run","agent_name":"Tester","agent_emoji":"✅"}',
    'memory/list': '{"request_type":"memory","action":"list"}',
    'memory/submit': '{"request_type":"memory","action":"submit","content":"Tester validation pass","category":"technical","agent_name":"Tester"}',
    'queue/list': '{"request_type":"queue","action":"list","status":"pending"}',
    'status/update': '{"request_type":"status","action":"update","status_message":"Tester running","ring_color":"cyan","agent_name":"Tester","agent_emoji":"✅"}',
    'channel/list': '{"request_type":"channel","action":"list"}',
    'insight/create': '{"request_type":"insight","action":"create","insight_type":"summary","title":"Test","content":"Validation","agent_name":"Tester","agent_emoji":"✅"}',
    'question/ask': '{"request_type":"question","action":"ask","question_type":"question","priority":"low","question":"Tester validation","agent_name":"Tester","agent_emoji":"✅"}',
  };

  for (const ep of endpoints) {
    const payload = testPayloads[ep];
    if (!payload) {
      results.push({ name: `API: ${ep}`, passed: false, detail: 'No test payload defined' });
      continue;
    }

    check(`API: ${ep}`, () => {
      const res = execSync(
        `curl -sS --max-time 5 "${config.apiUrl}/functions/v1/ai-tasks" -X POST ` +
        `-H "x-webhook-secret: ${config.secret}" -H "Content-Type: application/json" ` +
        `-d '${payload}'`,
        { encoding: 'utf8' }
      );
      const data = JSON.parse(res);
      if (data.error) return false;
      return `OK (${Object.keys(data)[0]})`;
    });
  }
}

function testScripts() {
  const scripts = (args.scripts || 'preflight-check.js,log-token-cost.js --check').split(',');
  const scriptsDir = require('path').join(__dirname);

  for (const script of scripts) {
    check(`Script: ${script.trim()}`, () => {
      const res = execSync(`node ${scriptsDir}/${script.trim()} 2>&1`, {
        encoding: 'utf8',
        timeout: 15000,
        env: { ...process.env },
      });
      // Check if output is valid JSON
      try {
        const data = JSON.parse(res.trim().split('\n').pop());
        return data.result || data.status || data.msg || 'OK';
      } catch {
        return res.includes('error') ? false : 'OK';
      }
    });
  }
}

function testInfra() {
  check('Gateway health', () => {
    const res = execSync('curl -sS --max-time 3 http://127.0.0.1:18789/health', { encoding: 'utf8' });
    return JSON.parse(res).status === 'live' ? 'live' : false;
  });

  check('Supabase REST', () => {
    const res = execSync(
      'curl -sS --max-time 3 "http://127.0.0.1:54321/rest/v1/" ' +
      '-H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"',
      { encoding: 'utf8' }
    );
    return res ? 'up' : false;
  });

  check('Edge function reachable', () => {
    const res = execSync(
      `curl -sS --max-time 5 "${config.apiUrl}/functions/v1/ai-tasks" -X POST ` +
      `-H "x-webhook-secret: ${config.secret}" -H "Content-Type: application/json" ` +
      `-d '{"request_type":"status","action":"update","status_message":"tester-probe","ring_color":"cyan","agent_name":"Tester","agent_emoji":"✅"}'`,
      { encoding: 'utf8' }
    );
    return JSON.parse(res).status ? 'OK' : false;
  });
}

// Run based on scope
const scope = args.scope || 'full';

console.log('✅ TESTER — API/Logic Validation Starting');
console.log(`Scope: ${scope}\n`);

if (scope === 'full' || scope === 'infra') testInfra();
if (scope === 'full' || scope === 'api' || scope === 'ai-tasks') testEndpoints();
if (scope === 'full' || scope === 'scripts') testScripts();

const score = results.filter(r => r.passed).length;
const total = results.length;
const pct = total > 0 ? Math.round((score / total) * 100) : 0;
const verdict = pct === 100 ? 'APPROVED' : pct >= 80 ? 'NEEDS_FIX (minor)' : 'NEEDS_FIX (critical)';

const report = `
✅ TESTER — Validation Report
Scope: ${scope}
Score: ${score}/${total} (${pct}%)

${results.map(r => `[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}${r.passed ? '' : ' — ' + r.detail}`).join('\n')}

Verdict: ${verdict}
`.trim();

console.log('\n' + report);

console.log('\n' + JSON.stringify({
  agent: 'tester',
  scope,
  score,
  total,
  pct,
  verdict,
  results: results.map(r => ({ name: r.name, passed: r.passed })),
  timestamp: new Date().toISOString(),
}));

process.exit(pct >= 80 ? 0 : 1);
