#!/usr/bin/env node
// Log Token Cost — Track spending per session/task
// Usage: node scripts/log-token-cost.js --model "deepseek/deepseek-chat" --input 5000 --output 2000 --description "Build kanban feature"
// Called by Bob after each session, or by Magalie for budget checks

require('./load-env.js');
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
};

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Cost per million tokens (USD)
const MODEL_COSTS = {
  'deepseek/deepseek-chat':     { input: 0.28,  output: 0.42 },
  'deepseek/deepseek-reasoner': { input: 0.28,  output: 0.42 },
  'ollama/qwen3:8b':            { input: 0,     output: 0 },
  'ollama/glm-4.7-flash':       { input: 0,     output: 0 },
  'anthropic/claude-sonnet-4':   { input: 3.0,   output: 15.0 },
  'anthropic/claude-haiku':      { input: 0.25,  output: 1.25 },
  'anthropic/claude-opus':       { input: 15.0,  output: 75.0 },
};

function calculateCost(model, inputTokens, outputTokens) {
  const costs = MODEL_COSTS[model] || { input: 1.0, output: 3.0 }; // default conservative
  return ((inputTokens * costs.input) + (outputTokens * costs.output)) / 1_000_000;
}

async function logCost(args) {
  const model = args.model || 'deepseek/deepseek-chat';
  const inputTokens = parseInt(args.input) || 0;
  const outputTokens = parseInt(args.output) || 0;
  const description = args.description || '';
  const projectId = args.project || null;
  const sessionId = args.session || null;

  const costUsd = calculateCost(model, inputTokens, outputTokens);

  // Insert two rows: input + output (matches table schema)
  const rows = [
    {
      tokens_used: inputTokens,
      token_type: 'input',
      activity: description,
      agent_id: args.agent || 'magalie',
      metadata: { model, cost_usd: (inputTokens * (MODEL_COSTS[model]?.input || 1.0)) / 1_000_000, logged_by: 'log-token-cost.js' },
    },
    {
      tokens_used: outputTokens,
      token_type: 'output',
      activity: description,
      agent_id: args.agent || 'magalie',
      metadata: { model, cost_usd: (outputTokens * (MODEL_COSTS[model]?.output || 3.0)) / 1_000_000, logged_by: 'log-token-cost.js' },
    },
  ];
  const { data, error } = await supabase.from('token_logs').insert(rows).select();

  if (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'Failed to log cost', error: error.message }));
    process.exit(1);
  }

  console.log(JSON.stringify({
    level: 'info',
    msg: 'Cost logged',
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: costUsd.toFixed(6),
    ids: (data || []).map(d => d.id),
  }));
}

async function checkBudget(dailyLimit = 10.0) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('token_logs')
    .select('tokens_used, token_type, metadata')
    .gte('created_at', today.toISOString());

  if (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'Failed to check budget', error: error.message }));
    process.exit(1);
  }

  const totalSpent = (data || []).reduce((sum, row) => sum + parseFloat(row.metadata?.cost_usd || 0), 0);
  const pct = (totalSpent / dailyLimit) * 100;
  const status = totalSpent >= dailyLimit ? 'OVER_BUDGET' :
                 totalSpent >= dailyLimit * 0.75 ? 'WARNING' : 'OK';

  console.log(JSON.stringify({
    level: status === 'OK' ? 'info' : 'warn',
    msg: `Budget: $${totalSpent.toFixed(4)} / $${dailyLimit} (${pct.toFixed(1)}%)`,
    total_spent: totalSpent,
    daily_limit: dailyLimit,
    percentage: pct,
    status,
  }));

  return { totalSpent, dailyLimit, pct, status };
}

// Parse CLI args
const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    args[key] = arr[i + 1] || true;
  }
});

if (args.check || args.budget) {
  checkBudget(parseFloat(args.limit) || 10.0);
} else {
  logCost(args);
}
