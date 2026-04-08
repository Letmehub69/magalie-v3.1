#!/usr/bin/env node
// Bob Supabase — Bob reports status, claims tasks, posts results via Supabase
// Usage:
//   node scripts/bob-supabase.js --claim                          # Claim next pending task
//   node scripts/bob-supabase.js --status "Building auth" --node node-001
//   node scripts/bob-supabase.js --done --task-id <uuid> --result '{"files":["auth.tsx"]}'
//   node scripts/bob-supabase.js --log "Completed step 1" --phase BUILD --node node-001
//   node scripts/bob-supabase.js --comms --to Magalie --message "Build done"

require('./load-env.js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith('--')) args[arg.slice(2)] = arr[i + 1] || true;
});

const AGENT = 'Bob';
const EMOJI = '🔨';

async function claimTask() {
  // Get highest priority pending task
  const { data: tasks, error } = await supabase
    .from('pending_tasks')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw error;
  if (!tasks || tasks.length === 0) {
    console.log(JSON.stringify({ level: 'info', msg: 'No pending tasks', agent: AGENT }));
    return null;
  }

  const task = tasks[0];
  const { error: claimErr } = await supabase
    .from('pending_tasks')
    .update({ status: 'claimed', claimed_at: new Date().toISOString(), assigned_agent: AGENT })
    .eq('id', task.id)
    .eq('status', 'pending'); // Optimistic lock

  if (claimErr) throw claimErr;

  // Update agent status
  await supabase.from('agent_status').update({
    is_online: true,
    status_message: `Claimed: ${task.title}`,
    ring_color: 'green',
    current_task_id: task.id,
    current_node_id: task.node_id,
    last_heartbeat: new Date().toISOString(),
  }).eq('agent_name', AGENT);

  console.log(JSON.stringify({ level: 'info', msg: `Claimed task: ${task.title}`, task_id: task.id, node_id: task.node_id, agent: AGENT }));
  return task;
}

async function updateStatus() {
  const msg = args.status;
  const nodeId = args.node;

  await supabase.from('agent_status').update({
    is_online: true,
    status_message: msg,
    ring_color: 'green',
    current_node_id: nodeId || null,
    last_heartbeat: new Date().toISOString(),
  }).eq('agent_name', AGENT);

  console.log(JSON.stringify({ level: 'info', msg: `Status: ${msg}`, node: nodeId, agent: AGENT }));
}

async function markDone() {
  const taskId = args['task-id'];
  let result = {};
  try { result = JSON.parse(args.result || '{}'); } catch {}

  await supabase.from('pending_tasks').update({
    status: 'done',
    completed_at: new Date().toISOString(),
    result,
  }).eq('id', taskId);

  // Update node in project_tree if node_id is set
  if (args.node) {
    await supabase.from('project_tree').update({ status: 'done' }).eq('node_id', args.node);
  }

  // Set agent idle
  await supabase.from('agent_status').update({
    status_message: 'Task complete. Idle.',
    ring_color: 'green',
    current_task_id: null,
    current_node_id: null,
    last_heartbeat: new Date().toISOString(),
  }).eq('agent_name', AGENT);

  console.log(JSON.stringify({ level: 'info', msg: `Task done: ${taskId}`, node: args.node, agent: AGENT }));
}

async function postLog() {
  const message = args.log;
  await supabase.from('agent_logs').insert({
    agent_name: AGENT,
    agent_emoji: EMOJI,
    category: args.category || 'general',
    message,
    phase: args.phase,
    node_id: args.node,
    task_id: args['task-id'],
    run_id: args['run-id'],
  });

  console.log(JSON.stringify({ level: 'info', msg: `Log: ${message}`, agent: AGENT }));
}

async function sendComms() {
  const to = args.to || 'Magalie';
  const message = args.message;
  const type = args.type || 'status_response';

  const { data, error } = await supabase.from('agent_comms').insert({
    from_agent: AGENT,
    to_agent: to,
    message_type: type,
    message,
  }).select().single();

  if (error) throw error;
  console.log(JSON.stringify({ level: 'info', msg: `Sent to ${to}: ${message}`, id: data.id, agent: AGENT }));
}

async function main() {
  try {
    if (args.claim) await claimTask();
    else if (args.status) await updateStatus();
    else if (args.done) await markDone();
    else if (args.log) await postLog();
    else if (args.comms) await sendComms();
    else {
      console.log('Usage:');
      console.log('  --claim                  Claim next pending task');
      console.log('  --status "msg" --node X  Update Bob status');
      console.log('  --done --task-id <uuid>  Mark task done');
      console.log('  --log "msg" --phase X    Post a log entry');
      console.log('  --comms --to X --message "msg"  Send message to agent');
    }
  } catch (e) {
    console.error(JSON.stringify({ level: 'error', msg: e.message, agent: AGENT }));
    process.exit(1);
  }
}

main();
