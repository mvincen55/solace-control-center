# Auto-Commit Protocol — Control Center

## The Problem

If changes are made but not committed, they:
1. Get mixed into future commits (loses granularity)
2. Get lost on rollback (desktop shortcut runs uncomitted code)
3. Make debugging impossible ("when did this break?")

## The Rule

**Every work session MUST end with a commit.**

A "work session" is:
- Builder makes changes and reports "done"
- I make manual edits via file operations
- Testing reveals bugs that get fixed
- Configuration changes (.env, vite.config, etc.)

**Frequency:** Minimum daily. Ideally after each logical unit of work.

## Responsibility Chain

**Sol (me)** is accountable. I can delegate execution but not accountability.

**Who can execute:**
- **Sol** — Manual commits via exec commands (current approach)
- **Builder agents** — Should commit their own changes before reporting "done"
- **Worker agents** — Bulk operations should commit with descriptive message
- **Haiku workers** — Simple file ops, batch commits ok

**Delegation protocol:**
- If I delegate to Builder: "Build X, commit when done, report commit hash"
- If I forget to commit: Heartbeat audit catches it and reminds me
- If uncommitted work piles up: Emergency commit before any new work starts

## Automation Layer

### Heartbeat Check (Every Hour — Weekend Only)
```bash
cd solace-control-center
git status --short
```

**If output is non-empty:** Uncommitted changes detected.

**Action:**
1. Review changes: `git diff --stat`
2. Generate commit message from diffs
3. Commit: `git add -A && git commit -m "auto: [description]"`
4. Tag if significant: `git tag v0.x.x`
5. Log to memory/audit/

**If output is empty:** Nothing to commit. HEARTBEAT_OK.

### Daily Summary Commit (11:59 PM)
If any work happened today but not yet committed:
- Aggregate all changes
- Commit with summary: "daily: [date] - [summary of changes]"
- Tag as patch version increment

### Before Major Changes
Any time Builder is invoked or I start significant work:
1. Check git status first
2. Commit any pending changes
3. Then proceed with new work
4. Commit new work separately

## Commit Message Format

**Auto-commits use prefix:**
- `auto:` — Automated commit from protocol
- `daily:` — End-of-day summary commit
- `session:` — End of work session commit

**Manual commits use semantic:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `style:` — Visual changes
- `refactor:` — Code cleanup
- `test:` — Testing
- `chore:` — Dependencies, config

## Git Hooks (Future)

**Pre-commit hook** (optional, not implemented yet):
- Runs before every commit
- Checks for common mistakes (API keys in code, etc.)
- Validates files compile

**Post-merge hook** (optional):
- After pulling changes from remote
- Auto-restart dev server if running
- Notify Megan of breaking changes

## Memory vs Code Separation

**IMPORTANT:** Control Center code rollback DOES NOT affect memory.

**Control Center location:**
`C:\Users\Megan\.openclaw\workspace\solace-control-center/`

**Memory location:**
`C:\Users\Megan\.openclaw\workspace/memory/`
`C:\Users\Megan\.openclaw\workspace/MEMORY.md`

**Separate git repos (future consideration):**
- Control Center could be its own repo
- Memory files stay in main workspace
- Prevents cross-contamination

## Verification

**Check last commit:**
```bash
cd solace-control-center
git log -1 --oneline
```

**Check uncommitted changes:**
```bash
git status --short
```

**Check commit history:**
```bash
git log --oneline -10
```

## Emergency Recovery

**If uncommitted changes are lost:**
1. Check git reflog: `git reflog`
2. Check stash: `git stash list`
3. Check IDE history (VS Code, Cursor, etc. often auto-save)
4. Worst case: Builder can rebuild from description

**If commit history is messy:**
1. Interactive rebase: `git rebase -i HEAD~5`
2. Squash related commits
3. Rewrite commit messages
4. Force push: `git push -f origin main` (ONLY if solo repo)

## Accountability

If uncommitted work causes problems:
- I document the failure in memory/
- Update this protocol to prevent recurrence
- No blame on Builder/Worker — responsibility chain flows up to me
- Learn and improve the automation

---

**Created:** 2026-02-14  
**Last updated:** 2026-02-14  
**Owner:** Sol (can delegate execution, not accountability)
