#!/usr/bin/env node
// Bob Heartbeat — Posts work_progress to Supabase every 3 min
// Usage: node scripts/bob-heartbeat.js --task-id <id> --phase BUILD --action "Building component X"
// Called by Bob during active builds. Magalie/Fiton can query agent_status to detect stale Bobs.

require('./load-env.js');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  clawbuddyUrl: process.env.CLAWBUDDY_API_URL || 'http://127.0.0.1:54321',
  clawbuddySecret: process.env.CLAWBUDDY_WEBHOOK_SECRET,
};

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Parse args
const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith('--')) args[arg.slice(2)] = arr[i + 1] || true;
});

async function postHeartbeat() {
  const taskId = args['task-id'] || 'unknown';
  const phase = args.phase || 'BUILD';
  const action = args.action || 'Working...';
  const percent = parseInt(args.percent) || 0;
  const agentName = args.agent || 'Bob';
  const agentEmoji = args.emoji || '🔨';

  // 1. Update WIP file
  const wipPath = path.join(__dirname, '..', '.work-in-progress.json');
  const wip = {
    status: 'in-progress',
    taskId,
    description: action,
    startedAt: fs.existsSync(wipPath) ?
      JSON.parse(fs.readFileSync(wipPath, 'utf8')).startedAt :
      new Date().toISOString(),
    lastHeartbeat: new Date().toISOString(),
    phase,
    percentComplete: percent,
  };
  fs.writeFileSync(wipPath, JSON.stringify(wip, null, 2));

  // 2. Post to Supabase system_metrics (agent_status)
  const { error: statusError } = await supabase.from('system_metrics').insert({
    metric_type: 'agent_heartbeat',
    metric_value: percent,
    labels: {
      agent_name: agentName,
      agent_emoji: agentEmoji,
      task_id: taskId,
      phase,
      current_action: action,
      percent_complete: percent,
      timestamp: new Date().toISOString(),
    },
  });

  if (statusError) {
    console.error(JSON.stringify({ level: 'error', msg: 'Heartbeat DB write failed', error: statusError.message }));
  }

  // 3. Post to ClawBuddy (if configured)
  if (config.clawbuddySecret) {
    try {
      const res = await fetch(`${config.clawbuddyUrl}/functions/v1/ai-tasks`, {
        method: 'POST',
        headers: {
          'x-webhook-secret': config.clawbuddySecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: 'log',
          action: 'create',
          category: 'observation',
          message: `Progress: ${percent}% — ${action}`,
          agent_name: agentName,
          agent_emoji: agentEmoji,
          data: {
            event_type: 'work_progress',
            task_id: taskId,
            phase,
            percent_complete: percent,
            current_action: action,
          },
        }),
      });
    } catch { /* ClawBuddy optional */ }
  }

  console.log(JSON.stringify({
    level: 'info',
    msg: `Heartbeat: ${percent}% — ${action}`,
    agent: agentName,
    task_id: taskId,
    phase,
  }));
}

postHeartbeat();
