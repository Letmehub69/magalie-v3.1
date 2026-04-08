#!/usr/bin/env node
// Magalie Wakeup Check — Run at session start to load state
// Usage: node scripts/magalie-wakeup-check.js
// Reports: pending tasks, unread comms, stale bobs, agent statuses

require('./load-env.js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function wakeup() {
  console.log('👩‍⚕️ MAGALIE — Wakeup Check\n');

  // 1. Pending tasks
  const { data: pending } = await supabase
    .from('pending_tasks')
    .select('*')
    .in('status', ['pending', 'claimed', 'in_progress'])
    .order('priority', { ascending: true });

  console.log(`--- Pending Tasks: ${pending?.length || 0} ---`);
  (pending || []).forEach(t => {
    console.log(`  [${t.status}] ${t.title} (node: ${t.node_id || '-'}) — assigned: ${t.assigned_agent}`);
  });

  // 2. Unread agent comms
  const { data: comms } = await supabase
    .from('agent_comms')
    .select('*')
    .eq('to_agent', 'Magalie')
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  console.log(`\n--- Unread Messages: ${comms?.length || 0} ---`);
  (comms || []).forEach(c => {
    console.log(`  [${c.message_type}] from ${c.from_agent}: ${c.message.substring(0, 80)}`);
  });

  // 3. Agent statuses
  const { data: agents } = await supabase
    .from('agent_status')
    .select('*')
    .order('agent_name');

  console.log('\n--- Agent Status ---');
  (agents || []).forEach(a => {
    const stale = a.last_heartbeat && (Date.now() - new Date(a.last_heartbeat).getTime()) > 10 * 60 * 1000;
    const indicator = a.is_online ? (stale ? '⚠️ STALE' : '🟢') : '⚫';
    console.log(`  ${indicator} ${a.agent_emoji || ''} ${a.agent_name}: ${a.status_message || 'idle'}`);
  });

  // 4. Project tree — incomplete nodes
  const { data: nodes } = await supabase
    .from('project_tree')
    .select('*')
    .neq('status', 'done')
    .order('id');

  console.log(`\n--- Project Tree: ${nodes?.length || 0} incomplete nodes ---`);
  (nodes || []).forEach(n => {
    console.log(`  [${n.status}] ${n.node_id}: ${n.title}`);
  });

  // 5. Stale WIP check
  const fs = require('fs');
  const path = require('path');
  const wipPath = path.join(__dirname, '..', '.work-in-progress.json');
  if (fs.existsSync(wipPath)) {
    const wip = JSON.parse(fs.readFileSync(wipPath, 'utf8'));
    if (wip.status === 'in-progress') {
      const elapsed = (Date.now() - new Date(wip.startedAt).getTime()) / 60000;
      console.log(`\n--- ⚠️ WIP ACTIVE ---`);
      console.log(`  Task: ${wip.description}`);
      console.log(`  Started: ${Math.floor(elapsed)}min ago`);
      if (elapsed > 15) console.log(`  ⚠️ STALE — consider killing and relaunching`);
    }
  }

  // Summary
  const summary = {
    pending_tasks: pending?.length || 0,
    unread_comms: comms?.length || 0,
    agents_online: (agents || []).filter(a => a.is_online).length,
    incomplete_nodes: nodes?.length || 0,
  };

  console.log('\n' + JSON.stringify({ agent: 'magalie', check: 'wakeup', ...summary, timestamp: new Date().toISOString() }));
}

wakeup().catch(e => {
  console.error(JSON.stringify({ level: 'error', msg: e.message }));
  process.exit(1);
});
