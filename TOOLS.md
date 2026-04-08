# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

### Supabase (Local)

- **Project dir:** ~/supabase-project
- **API URL:** http://127.0.0.1:54321
- **DB URL:** postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Studio:** http://127.0.0.1:54323
- **MCP:** http://127.0.0.1:54321/mcp
- **Anon Key:** [REDACTED]
- **Service Role Key:** [REDACTED]
- **How to use:** You have a Supabase MCP server injected in your ACP sessions. Use the MCP tools (list_tables, execute_sql, etc.) to interact with the database. Do NOT use `docker ps` to check if Supabase is running — use `curl http://127.0.0.1:54321/rest/v1/ -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"` instead.
- **Docker socket:** /var/run/docker.sock (symlink to ~/.docker/run/docker.sock). If you need Docker access, set DOCKER_HOST=unix:///var/run/docker.sock

---

Add whatever helps you do your job. This is your cheat sheet.
