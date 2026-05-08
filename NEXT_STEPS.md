# NEXT_STEPS — Sprint backlog

## Current sprint objective
Mettre en place la base IRIELLE v0.1 avec un flux chat persistant et un noyau sécurité/approvals minimal.

## Prioritized tasks

1. **Data model**
   - Créer/valider les entités MVP (UserProfile, ChatSession, ChatMessage, MemoryItem, Todo, Note, Project, ToolDefinition, ActionRun, ApprovalRequest, Device, Skill, AuditLog).
2. **Chat flow MVP**
   - User message -> persist -> provider mock/OpenAI -> persist assistant -> display.
3. **Core tools MVP**
   - create/list/update todo
   - save/search note
   - save/search/delete memory
   - create action log
   - request/approve/deny approval
4. **Security Center v1**
   - emergency stop toggle
   - autonomy level
   - approval policy visibility
5. **Audit visibility**
   - page filtrable des actions/audits.

## Definition of done (for each task)

- Implémentation réelle (pas de claim sans code).
- Tests ou vérification documentée.
- Documentation mise à jour.

## Base44 execution task

6. **Run Lot 1 in Base44**
   - Copier `BASE44_LOT1_MASTER_PROMPT.md` dans Base44 (Plan/Discuss puis Build).
   - Capturer le résumé de sortie: implemented vs mock/future vs OpenAI prerequisites.
   - Reporter les écarts dans ce fichier avant Lot 2.
