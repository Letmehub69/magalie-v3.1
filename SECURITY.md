# SECURITY — IRIELLE

## Security-first principles

1. Ne jamais exposer les secrets.
2. Ne jamais exécuter une action risquée sans approbation explicite.
3. Ne jamais bypass les systèmes de sécurité.
4. Journaliser les actions importantes (sans secrets en clair).
5. Permettre la révocation des devices et un kill switch global.

## Risk classes

- `safe_read`
- `safe_write`
- `local_write`
- `external_read`
- `external_write`
- `shell_command`
- `destructive`
- `financial`
- `private_data`
- `credential_sensitive`
- `blocked`

## Default policy

- `safe_read`: auto si outil activé.
- `local_write`: approval requise.
- `external_write`: approval stricte.
- `shell_command`: approval forte.
- `destructive`: approval forte + résumé conséquence.
- `financial`: bloqué par défaut.
- `credential_sensitive`: bloqué par défaut.
- `blocked`: jamais exécuté.

## Logging rules

- Redacter systématiquement arguments sensibles et résultats secrets.
- Enregistrer statut d'approbation, erreur, résumé et métadonnées minimales.
