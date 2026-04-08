#!/usr/bin/env node
// Evolution Sync — Dual-write to evolution-log.md AND Supabase evolution_logs
// Usage: node scripts/evolution-sync.js --type rule_extraction --change "Always use ISO dates" --reason "Date parsing failed 3x"
// Usage: node scripts/evolution-sync.js --type user_correction --change "Use Tailwind not inline" --reason "Owner directed"
// Usage: node scripts/evolution-sync.js --type stale_detection --file "README.md" --issue "References deleted endpoint"

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

const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith('--')) args[arg.slice(2)] = arr[i + 1] || true;
});

async function sync() {
  const eventType = args.type || 'rule_extraction';
  const change = args.change || '';
  const reason = args.reason || '';
  const category = args.category || 'technical';
  const file = args.file || '';
  const now = new Date();

  // 1. Write to evolution-log.md
  const logPath = path.join(__dirname, '..', 'evolution-log.md');
  const entry = `\n### ${now.toISOString().split('T')[0]} — ${eventType}\n` +
    `- **Change:** ${change}\n` +
    `- **Reason:** ${reason}\n` +
    (file ? `- **File:** ${file}\n` : '') +
    `- **Category:** ${category}\n`;

  fs.appendFileSync(logPath, entry, 'utf8');

  // 2. Write to Supabase evolution_logs
  const { data, error } = await supabase.from('evolution_logs').insert({
    event_type: eventType,
    change_description: change,
    reason: reason,
    category: category,
    metadata: { file, synced_from: 'evolution-sync.js' },
  }).select().single();

  if (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'Supabase write failed', error: error.message }));
  }

  // 3. Submit to Cognitive Memory (ClawBuddy)
  if (config.clawbuddySecret && (eventType === 'rule_extraction' || eventType === 'user_correction')) {
    try {
      await fetch(`${config.clawbuddyUrl}/functions/v1/ai-tasks`, {
        method: 'POST',
        headers: {
          'x-webhook-secret': config.clawbuddySecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: 'memory',
          action: 'submit',
          content: `[${eventType}] ${change}. Reason: ${reason}`,
          category,
          agent_name: 'Magalie',
        }),
      });
    } catch { /* optional */ }
  }

  // 4. Check safety brake (5 modifications in 24h)
  const { data: recentLogs } = await supabase
    .from('evolution_logs')
    .select('id')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const count = recentLogs?.length || 0;

  console.log(JSON.stringify({
    level: 'info',
    msg: `Evolution logged: ${eventType}`,
    change,
    reason,
    supabase_id: data?.id,
    modifications_24h: count,
    safety_brake: count >= 5 ? 'REVIEW_REQUIRED' : 'OK',
  }));

  if (count >= 5) {
    console.log(JSON.stringify({
      level: 'warn',
      msg: '⚠️ SAFETY BRAKE: 5+ self-modifications in 24h. Review required before continuing.',
    }));
  }
}

sync();
