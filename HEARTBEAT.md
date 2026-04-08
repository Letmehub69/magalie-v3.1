# HEARTBEAT.md — Magalie v3.1

## Checklist (executer dans l'ordre, garder court)

### 1. Infrastructure
- [ ] Gateway 18789 up? (`curl -s http://localhost:18789/health`)
- [ ] Supabase 54321 up? (`curl -s http://127.0.0.1:54321/rest/v1/ -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"`)

### 2. Queue & Tasks
- [ ] `pending_tasks` — items stuck >15 min?
- [ ] Kanban — tasks in "doing" >24h sans update?
- [ ] Agent comms — messages non lus?

### 3. Budget
- [ ] Depenses du jour < $7.50?

### 4. Proactif (rotation, 2-4x/jour)
- [ ] Discord — messages urgents non traites?
- [ ] Update `memory/heartbeat-state.json` timestamps

## Regles
- Si tout OK et rien de nouveau : `HEARTBEAT_OK`
- Si probleme detecte : decrire brievement + action suggeree
- Late night (23h-8h) : toujours `HEARTBEAT_OK` sauf urgence
- NE PAS spawner de sub-agent complexe depuis le heartbeat — utiliser cron pour ca
