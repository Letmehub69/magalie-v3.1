#!/usr/bin/env node
// Decompose Task — Create nodes in project_tree and pending_tasks
// Usage: node scripts/decompose-task.js --project "mon-projet" --nodes '[{"id":"node-001","title":"Create component","parent":null,"validation_louix":true},{"id":"node-002","title":"Add API","parent":"node-001","validation_tester":true}]'
// Creates nodes in project_tree + dispatches pending_tasks for Bob

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

async function decompose() {
  const projectId = args.project || 'default';
  let nodes = [];
  try { nodes = JSON.parse(args.nodes || '[]'); } catch (e) {
    console.error('Invalid --nodes JSON');
    process.exit(1);
  }

  if (nodes.length === 0) {
    console.log('Usage: --project "name" --nodes \'[{"id":"node-001","title":"...","parent":null}]\'');
    return;
  }

  console.log(`🔨 DECOMPOSE — Creating ${nodes.length} nodes for project: ${projectId}\n`);

  const created = [];

  for (const node of nodes) {
    // 1. Insert into project_tree
    const { data: treeNode, error: treeErr } = await supabase
      .from('project_tree')
      .upsert({
        project_id: projectId,
        node_id: node.id,
        parent_id: node.parent || null,
        title: node.title,
        description: node.description || '',
        status: 'pending',
        priority: node.priority || 3,
        estimated_hours: node.hours || null,
        validation_required: {
          louix: node.validation_louix || false,
          tester: node.validation_tester || false,
        },
      }, { onConflict: 'project_id,node_id' })
      .select().single();

    if (treeErr) {
      console.error(`  ❌ project_tree: ${node.id} — ${treeErr.message}`);
      continue;
    }

    // 2. Create pending_task for Bob
    const brief = node.brief || `## Task\n${node.title}\n\n## Requirements\n${node.description || node.title}\n\n## Deliverables\n1. Working code\n2. ClawBuddy logs`;

    const { data: task, error: taskErr } = await supabase
      .from('pending_tasks')
      .insert({
        project_id: projectId,
        node_id: node.id,
        title: node.title,
        description: node.description || '',
        brief,
        assigned_agent: 'bob',
        status: 'pending',
        priority: node.priority || 3,
        validation_louix: node.validation_louix || false,
        validation_tester: node.validation_tester || false,
      })
      .select().single();

    if (taskErr) {
      console.error(`  ❌ pending_tasks: ${node.id} — ${taskErr.message}`);
      continue;
    }

    created.push({ node_id: node.id, title: node.title, task_id: task.id });
    console.log(`  ✅ ${node.id}: "${node.title}" → task ${task.id}`);
  }

  // Log decomposition
  await supabase.from('agent_logs').insert({
    agent_name: 'Magalie',
    agent_emoji: '👩‍⚕️',
    category: 'general',
    message: `DECOMPOSE: ${created.length}/${nodes.length} nodes created for project ${projectId}`,
    phase: 'DECOMPOSE',
    data: { project_id: projectId, nodes: created.map(c => c.node_id) },
  });

  console.log(`\nDecomposition: ${created.length}/${nodes.length} nodes created`);
  console.log(JSON.stringify({
    agent: 'magalie',
    action: 'decompose',
    project: projectId,
    created: created.length,
    total: nodes.length,
    nodes: created,
    timestamp: new Date().toISOString(),
  }));
}

decompose().catch(e => {
  console.error(JSON.stringify({ level: 'error', msg: e.message }));
  process.exit(1);
});
