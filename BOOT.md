# BOOT.md — Startup Hook

## On Every Gateway Restart

1. Read STATUS.md for previous session state
2. Set status online on ClawBuddy
3. Check queue for pending dispatched work
4. Check agent_comms for unread messages
5. Verify infrastructure health:
   - Gateway 18789 responding
   - Supabase 54321 responding
   - Ollama 11434 responding
6. Log startup to ClawBuddy:
```json
{"request_type":"log","action":"create","category":"general",
 "message":"Boot complete. Gateway restarted. Status: online.",
 "agent_name":"Magalie","agent_emoji":"👩‍⚕️"}
```
7. If pending queue items exist, begin processing
8. If no work pending, reply HEARTBEAT_OK
