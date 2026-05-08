# PROJECT — IRIELLE

## Product statement

**Irielle est un command center personnel alimenté par IA, avec mémoire, voix, outils, automatisations, sécurité et agents spécialisés, conçu pour devenir l’assistant numérique central de l’utilisateur sur mobile, ordinateur et terminal.**

## Core goals

Irielle doit pouvoir:

1. dialoguer en texte (puis voix) ;
2. mémoriser préférences/projets/décisions ;
3. organiser notes/todos/projets ;
4. exécuter des actions via outils avec policy engine ;
5. demander des approbations explicites pour actions risquées ;
6. garder un audit log complet et redacted ;
7. fonctionner sur plusieurs appareils via pairing sécurisé.

## Non-goals

- Prétendre être consciente ou AGI complète.
- Contourner des contrôles de sécurité.
- Utiliser cookies/tokens non autorisés.
- Exécuter automatiquement des actions destructrices, financières, ou credential-sensitive.

## Target surfaces

- Web/PWA Base44 (principal)
- Mobile installable
- CLI companion (`irielle`) pour actions locales limitées
- Desktop companion (futur)

## Acceptance baseline (v0.1)

- Chat fonctionnel avec persistance.
- CRUD de base pour todos, notes, memories.
- Workflow d’approval (request/approve/deny).
- Timeline d’actions et audit logs visibles.
- Provider mock actif sans clé OpenAI.
