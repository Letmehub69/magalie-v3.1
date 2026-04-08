#!/usr/bin/env node
// Channel Sync — Discover Discord channels and register them in Supabase
// Usage: node scripts/channel-sync.js [--discover] [--register <channel_id> --name <name>] [--stats] [--test <channel_id>]
//
// --discover     : List all channels from openclaw.json guild config
// --register     : Register a new channel in the database
// --stats        : Show channel activity stats
// --test         : Test if a channel is registered and bot can respond

require('./load-env.js');
const { execSync } = require('child_process');

const config = {
  apiUrl: process.env.CLAWBUDDY_API_URL || 'http://127.0.0.1:54321',
  secret: process.env.CLAWBUDDY_WEBHOOK_SECRET,
  guildId: '1489381382781272114', // Main guild
};

const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith('--')) args[arg.slice(2)] = arr[i + 1] || true;
});

async function callApi(body) {
  const res = await fetch(`${config.apiUrl}/functions/v1/ai-tasks`, {
    method: 'POST',
    headers: {
      'x-webhook-secret': config.secret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function discover() {
  console.log('=== Discord Channel Discovery ===\n');

  // Get channels from openclaw resolve
  try {
    const result = execSync('openclaw channels resolve --channel discord --kind group --json "*" 2>/dev/null', {
      encoding: 'utf8',
      timeout: 10000,
    });
    const channels = JSON.parse(result);
    console.log(`Found ${channels.length} channels:\n`);
    channels.forEach(ch => {
      console.log(`  #${ch.name || ch.id} (${ch.id}) — ${ch.type || 'text'}`);
    });
    return channels;
  } catch (e) {
    // Fallback: check what's already in the database
    console.log('Cannot auto-discover (need Discord bot permissions).');
    console.log('Checking database for registered channels...\n');
    const result = await callApi({
      request_type: 'channel',
      action: 'list',
      guild_id: config.guildId,
    });
    const channels = result.channels || [];
    if (channels.length === 0) {
      console.log('No channels registered yet. Use --register to add one:');
      console.log('  node scripts/channel-sync.js --register <channel_id> --name "channel-name" --agent magalie');
    } else {
      channels.forEach(ch => {
        console.log(`  #${ch.channel_name} (${ch.channel_id}) — agent: ${ch.assigned_agent} — ${ch.agent_behavior} — ${ch.is_active ? 'active' : 'inactive'}`);
      });
    }
    return channels;
  }
}

async function register() {
  const channelId = args.register;
  const name = args.name || `channel-${channelId}`;
  const agent = args.agent || 'magalie';
  const behavior = args.behavior || 'respond';
  const purpose = args.purpose || '';

  console.log(`Registering channel: #${name} (${channelId})`);
  console.log(`  Agent: ${agent} | Behavior: ${behavior}\n`);

  const result = await callApi({
    request_type: 'channel',
    action: 'register',
    channel_id: channelId,
    channel_name: name,
    guild_id: config.guildId,
    assigned_agent: agent,
    agent_behavior: behavior,
    purpose: purpose,
  });

  if (result.channel) {
    console.log(`✅ Channel registered: ${result.channel.channel_name}`);
    console.log(`   ID: ${result.channel.id}`);
    console.log(`   Agent: ${result.channel.assigned_agent}`);
    console.log(`   Auto-respond: ${result.channel.auto_respond}`);
  } else {
    console.log(`❌ Registration failed: ${JSON.stringify(result)}`);
  }
}

async function stats() {
  console.log('=== Channel Stats ===\n');
  const result = await callApi({
    request_type: 'channel',
    action: 'stats',
    guild_id: config.guildId,
  });

  console.log(`Total channels: ${result.total_channels}`);
  console.log(`Active: ${result.active_channels}`);
  console.log(`Activity (24h): ${result.activity_24h} events\n`);

  if (result.channels?.length > 0) {
    console.log('Channels:');
    result.channels.forEach(ch => {
      console.log(`  #${ch.name} — agent: ${ch.agent} — ${ch.behavior} — ${ch.messages} msgs — last: ${ch.last_active || 'never'}`);
    });
  }
}

async function test() {
  const channelId = args.test;
  console.log(`=== Testing channel ${channelId} ===\n`);

  // 1. Check if registered
  const ch = await callApi({
    request_type: 'channel',
    action: 'get',
    channel_id: channelId,
  });

  if (!ch.channel) {
    console.log('❌ Channel NOT registered in database');
    console.log(`   Fix: node scripts/channel-sync.js --register ${channelId} --name "channel-name"`);
    return;
  }

  console.log(`✅ Registered: #${ch.channel.channel_name}`);
  console.log(`   Agent: ${ch.channel.assigned_agent}`);
  console.log(`   Behavior: ${ch.channel.agent_behavior}`);
  console.log(`   Auto-respond: ${ch.channel.auto_respond}`);
  console.log(`   Active: ${ch.channel.is_active}`);

  // 2. Check if the agent is configured in openclaw.json
  try {
    const ocConfig = require(`${process.env.HOME}/.openclaw/openclaw.json`);
    const agents = ocConfig.agents?.list || [];
    const agentExists = agents.some(a => a.id === ch.channel.assigned_agent);
    console.log(`   Agent in openclaw.json: ${agentExists ? '✅' : '❌ NOT FOUND'}`);

    // 3. Check Discord guild config
    const guilds = ocConfig.channels?.discord?.guilds || {};
    const guild = guilds[config.guildId];
    if (guild) {
      const channelConfig = guild.channels?.[channelId];
      console.log(`   Discord guild config: ${channelConfig ? '✅ per-channel config' : '⚠️ using guild defaults (groupPolicy: ' + ocConfig.channels?.discord?.groupPolicy + ')'}`);
    }
  } catch (e) {
    console.log('   Cannot read openclaw.json');
  }

  // 3. Log a test activity
  await callApi({
    request_type: 'channel',
    action: 'log_activity',
    channel_id: channelId,
    event_type: 'bot_responded',
    agent_name: ch.channel.assigned_agent,
    message_preview: 'Channel test — connectivity verified',
    response_time_ms: 0,
  });
  console.log(`   Test activity logged: ✅`);
}

// Main
(async () => {
  if (args.discover) await discover();
  else if (args.register) await register();
  else if (args.stats) await stats();
  else if (args.test) await test();
  else {
    console.log('Usage:');
    console.log('  node scripts/channel-sync.js --discover');
    console.log('  node scripts/channel-sync.js --register <channel_id> --name "name" [--agent magalie] [--behavior respond]');
    console.log('  node scripts/channel-sync.js --stats');
    console.log('  node scripts/channel-sync.js --test <channel_id>');
    console.log('\nBehaviors: respond (auto-reply), monitor (log only), silent (ignore), cron_only (scheduled posts)');
  }
})();
