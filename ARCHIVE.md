# Archive Status

This public research workspace is closed for active development as of 2026-05-05.

Purpose:
- Preserve the research/prototype state for future lab reopening.
- Keep deployment, local Supabase, and agent scripts documented without committed live credentials.
- Make future work start from an explicit review instead of accidental production use.

Reopen checklist:
1. Clone the repository into an isolated lab workspace.
2. Install dependencies with the current Node version selected for the lab.
3. Create `.env.local` from documented placeholders; do not reuse old tokens.
4. Start local Supabase or a fresh hosted project and generate new keys outside git.
5. Run the relevant smoke scripts before exposing any deployment publicly.
6. Record resumed work on a new branch before changing `main`.

Security notes:
- Committed scripts must use placeholders or environment variables for keys.
- Do not commit `.env`, provider keys, deploy tokens, database dumps, or private data.
- Treat any credential previously copied into local scripts as rotated before reuse.
