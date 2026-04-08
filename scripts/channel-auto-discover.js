#!/usr/bin/env node
// Channel Auto-Discover — Detect new Discord channels and auto-register them
// Usage: node scripts/channel-auto-discover.js
// Run via cron every 4h or on demand
// Compares Discord guild channels vs registered channels in Supabase
// New channels get auto-registered with default config

require('./load-env.js');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const config = {
  apiUrl: process.env.CLAWBUDDY_API_URL || 'http://127.0.0.1:54321',
  secret: process.env.CLAWBUDDY_WEBHOOK_SECRET,
  guildId: '1489381382781272114',
  botId: '1489382031807742054',
  ownerId: '1489378089141276923',
  defaultAgent: 'magalie',
  defaultBehavior: 'respond',
  openclawConfig: path.join(process.env.HOME, '.openclaw', 'openclaw.json'),
};

async function callApi(body) {
  const res = await fetch(`${config.apiUrl}/functions/v1/ai-tasks`, {
    method: 'POST',
    headers: { 'x-webhook-secret': config.secret, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function getDiscordChannels() {
  // Get channels the bot can see via openclaw resolve
  try {
    // Read openclaw.json to get configured channels
    const ocConfig = JSON.parse(fs.readFileSync(config.openclawConfig, 'utf8'));
    const guild = ocConfig.channels?.discord?.guilds?.[config.guildId];
    const configuredChannels = guild?.channels ? Object.keys(guild.channels) : [];

    // Also try to discover via CLI
    let cliChannels = [];
    try {
      const result = execSync(`openclaw channels resolve --channel discord --kind group "${config.guildId}" --json 2>/dev/null`, {
        encoding: 'utf8', timeout: 10000,
      });
      const resolved = JSON.parse(result);
      cliChannels = resolved.filter(r => r.resolved).map(r => ({ id: r.id, name: r.name }));
    } catch { /* CLI resolve may not work for all channels */ }

    return { configuredChannels, cliChannels };
  } catch (e) {
    console.error(`Error reading Discord config: ${e.message}`);
    return { configuredChannels: [], cliChannels: [] };
  }
}

async function getRegisteredChannels() {
  const result = await callApi({
    request_type: 'channel',
    action: 'list',
    guild_id: config.guildId,
  });
  return (result.channels || []).map(c => c.channel_id);
}

async function registerNewChannel(channelId, channelName) {
  // 1. Register in Supabase
  const result = await callApi({
    request_type: 'channel',
    action: 'register',
    channel_id: channelId,
    channel_name: channelName || `channel-${channelId}`,
    guild_id: config.guildId,
    assigned_agent: config.defaultAgent,
    agent_behavior: config.defaultBehavior,
    auto_respond: true,
    purpose: `Auto-discovered channel`,
  });

  // 2. Add to openclaw.json
  try {
    const ocConfig = JSON.parse(fs.readFileSync(config.openclawConfig, 'utf8'));
    const guild = ocConfig.channels?.discord?.guilds?.[config.guildId];
    if (guild && guild.channels) {
      if (!guild.channels[channelId]) {
        guild.channels[channelId] = {};
        fs.writeFileSync(config.openclawConfig, JSON.stringify(ocConfig, null, 2));
        console.log(`  Added to openclaw.json ✓`);
      }
    }
  } catch (e) {
    console.log(`  ⚠️ Could not update openclaw.json: ${e.message}`);
  }

  return result;
}

async function notifyDiscord(message) {
  try {
    execSync(`openclaw message send --channel discord -t "1491278300197421097" -m "${message.replace(/"/g, '\\"')}" 2>/dev/null`, {
      encoding: 'utf8', timeout: 10000,
    });
  } catch { /* silent */ }
}

async function discover() {
  console.log('🔍 Channel Auto-Discover\n');

  const { configuredChannels } = await getDiscordChannels();
  const registeredChannels = await getRegisteredChannels();

  console.log(`Configured in openclaw.json: ${configuredChannels.length}`);
  console.log(`Registered in Supabase: ${registeredChannels.length}\n`);

  // Find channels in openclaw.json but not in Supabase
  const unregistered = configuredChannels.filter(id => !registeredChannels.includes(id));

  if (unregistered.length === 0) {
    console.log('✅ All channels are registered. Nothing to do.');
    console.log(JSON.stringify({ action: 'auto-discover', new_channels: 0, timestamp: new Date().toISOString() }));
    return;
  }

  console.log(`Found ${unregistered.length} new channel(s):\n`);

  const newChannels = [];
  for (const channelId of unregistered) {
    // Try to resolve the name
    let name = `channel-${channelId}`;
    try {
      const res = execSync(`openclaw channels resolve --channel discord --kind group "${channelId}" --json 2>/dev/null`, {
        encoding: 'utf8', timeout: 5000,
      });
      const resolved = JSON.parse(res);
      if (resolved[0]?.name) name = resolved[0].name;
    } catch {}

    console.log(`  Registering #${name} (${channelId})...`);
    const result = await registerNewChannel(channelId, name);
    console.log(`  ${result.channel ? '✅ Registered' : '❌ Failed'}`);

    if (result.channel) {
      newChannels.push({ id: channelId, name });
    }
  }

  // Notify on Discord
  if (newChannels.length > 0) {
    const msg = `🔍 **Auto-Discover** — ${newChannels.length} nouveau(x) channel(s) detecte(s) et enregistre(s):\\n${newChannels.map(c => `- #${c.name}`).join('\\n')}\\nAgent: ${config.defaultAgent} | Behavior: ${config.defaultBehavior}`;
    await notifyDiscord(msg);

    // Log to agent_logs
    await supabase.from('agent_logs').insert({
      agent_name: 'Magalie',
      agent_emoji: '👩‍⚕️',
      category: 'general',
      message: `Auto-discover: ${newChannels.length} new channels registered: ${newChannels.map(c => '#' + c.name).join(', ')}`,
      data: { event_type: 'channel_auto_discover', channels: newChannels },
    });
  }

  console.log(`\n${JSON.stringify({
    action: 'auto-discover',
    new_channels: newChannels.length,
    channels: newChannels,
    timestamp: new Date().toISOString(),
  })}`);
}

discover().catch(e => {
  console.error(JSON.stringify({ level: 'error', msg: e.message }));
  process.exit(1);
});
