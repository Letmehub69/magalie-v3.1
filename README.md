# IRIELLE

Irielle est un **command center personnel alimenté par IA** avec mémoire, outils, automatisations, sécurité et agents spécialisés.

## Vision

Construire un assistant personnel agentique multi-plateforme (web/PWA, mobile, CLI, desktop futur) qui reste:

- utile et concret;
- sécurisé par défaut;
- contrôlé par permissions et approbations;
- extensible par modules/skills.

## Statut du projet

Ce dépôt entre dans une phase de refondation orientée IRIELLE v0.1. Les bases documentaires, l'architecture cible et les règles de sécurité sont définies dans les documents suivants :

- `PROJECT.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `ROADMAP.md`
- `NEXT_STEPS.md`
- `IRIELLE_SYSTEM_PROMPT.md`

## MVP v0.1 (objectif)

- Chat utilisateur ↔ Irielle avec persistance des messages.
- Gestion initiale: todos, notes, memory.
- Timeline des actions + approbations (approve/deny).
- Journal d'audit avec redaction des secrets.
- Security Center avec emergency stop.
- Mode mock si aucune clé OpenAI n'est configurée.

## Principes de développement

1. Incréments petits et testables.
2. Pas de fausses promesses (stubs explicitement marqués).
3. Confirmation avant toute action risquée.
4. Documentation et `NEXT_STEPS.md` maintenus à jour à chaque sprint.

## Base44 Delivery Prompt

Le prompt maître Base44 pour le Lot 1 est versionné dans `BASE44_LOT1_MASTER_PROMPT.md`.
Utiliser ce fichier comme source de vérité pour lancer la construction initiale dans Base44 (mode Plan/Discuss puis Build).
