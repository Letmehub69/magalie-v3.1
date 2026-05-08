# ARCHITECTURE — IRIELLE

## High-level flow

```text
Clients (Web/PWA/Mobile/CLI/Desktop)
  -> Irielle Gateway
  -> Brain / Orchestrator
  -> Memory + Tool Registry + Policy Engine + Approvals + Audit Logs
  -> Actions (todos, notes, files, code, shell-limited, external tools)
```

## Brain pipeline

1. Intent classification
2. Context retrieval
3. Risk classification
4. Planning
5. Tool selection
6. Approval check
7. Tool execution
8. Verification
9. Final response
10. Memory update
11. Audit log write

## Key modules

- **Memory System**: conversation, semantic, episodic, project, skill, safety.
- **Tool Registry**: outils typés + niveau de risque + scopes + approval requirements.
- **Policy Engine**: autorise/refuse/escale selon risque.
- **Approval Engine**: demandes explicites avec action exacte et conséquences.
- **Audit Engine**: logs redacted, traçables, exportables.
- **Device Pairing**: tokens scoped, révocation, heartbeat.

## Initial entities

UserProfile, ChatSession, ChatMessage, MemoryItem, Todo, Note, Project, ToolDefinition, ActionRun, ApprovalRequest, Device, Skill, AuditLog.
