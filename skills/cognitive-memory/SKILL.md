---
name: cognitive-memory
description: "Persistent knowledge system with human approval. Submit discoveries, corrections, and patterns as memory entries. Owner approves what sticks."
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - CLAWBUDDY_API_URL
        - CLAWBUDDY_WEBHOOK_SECRET
    emoji: 🧠
---

# Cognitive Memory — Persistent Knowledge System

You have access to a persistent memory system through ClawBuddy. Use it to remember important discoveries, patterns, and rules across sessions.

## When to Submit a Memory

Submit a memory when you discover ANY of these:

1. **API quirks** — an endpoint behaves unexpectedly, requires specific field names, has undocumented limits
2. **User preferences** — the owner corrects you, states a preference, or says "always/never do X"
3. **Environment facts** — file paths, project structure, tool versions, deployment targets
4. **Patterns that work** — a code pattern, prompt structure, or approach that solved a recurring problem
5. **Patterns that fail** — something that looks right but breaks

## How to Submit

```json
{
  "request_type": "memory",
  "action": "submit",
  "content": "Clear, specific description. Include the EXACT pattern — not vague summaries.",
  "category": "technical | preference | project | process",
  "agent_name": "YOUR_AGENT_NAME"
}
```

## Categories

| Category | Use for | Example |
|----------|---------|---------|
| technical | API quirks, code patterns, tool behavior | "Supabase list_data caps at 1000 rows" |
| preference | User's stated preferences, style choices | "Owner prefers Tailwind over inline styles" |
| project | File locations, architecture, dependencies | "Edge functions are in supabase/functions/" |
| process | Workflow rules, deployment steps, review gates | "Never deploy without running typecheck first" |

## Rules

1. **Be specific, not vague.** Bad: "The API has some quirks" / Good: "delete_data requires both app_id and data_id"
2. **One memory per discovery.** Don't bundle learnings.
3. **Never store credentials.** Store WHERE ("API key is in .env as STRIPE_KEY") but NEVER the values.
4. **Submit after every build.** Aim for 1-3 memories per build.
5. **Submit immediately on user correction.**
6. **Memories require approval.** Owner controls what sticks.

## Reading Memories

```json
{"request_type": "memory", "action": "list", "category": "technical", "agent_name": "YOUR_AGENT_NAME"}
```

## Post-Build Memory Extraction

After completing a build, ask yourself:
- Did I hit errors that took more than one attempt?
- Did I discover something undocumented?
- Did the owner correct my approach?
- Did I find a reusable pattern?

For each "yes," submit a memory entry.

---

# Self-Evolution — Continuous Self-Improvement

## Trigger 1: Pattern Failure → Extract Rule
When the same error occurs 3+ times:
1. Identify root cause
2. Write fix as permanent rule
3. Log: `[SELF-EVOLUTION] Type: rule_extraction | Change: <rule> | Reason: <pattern>`
4. Submit to Cognitive Memory

## Trigger 2: User Correction → Immediate Update
When owner corrects behavior:
1. Apply correction immediately
2. Log: `[SELF-EVOLUTION] Type: user_correction | Change: <what> | Reason: Owner directed`
3. Submit to Cognitive Memory

## Trigger 3: Periodic Review Gate
After every 5 self-modifications, PAUSE and ask owner:
"Self-evolution review: I've made 5 modifications. Summary: 1)... 2)... Are these correct?"

## What You CAN Self-Modify
- Memory entries (via submit → owner approval)
- Operational rules and workflow preferences
- Documentation corrections

## What You CANNOT Self-Modify
- .env files — NEVER
- Database schemas — NEVER
- Deployment configs — NEVER
- Credentials or keys — NEVER
- Other agents' rules — NEVER

## Stale Documentation Detection
Flag docs that:
- Not updated >30 days
- Reference nonexistent files/paths
- Contain TODO markers
- Contradict actual codebase
