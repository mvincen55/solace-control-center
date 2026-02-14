# Deployment Protocol — Solace Control Center

## ⚠️ Critical Rules

1. **ALWAYS commit before deploying** — uncommitted changes get lost on version rollback
2. **Test locally before pushing** — broken deploys can brick your workflow
3. **Document changes in CHANGELOG.md** — future-you needs to know what changed
4. **Never skip version tags** — tags are your rollback lifeline

## 🚀 Pre-Deployment Checklist

Before running `npm run dev` or deploying updates:

- [ ] **Check git status:** `git status` — anything uncommitted?
- [ ] **Review changes:** What files changed? Do they make sense?
- [ ] **Update CHANGELOG.md:** Document what's new/fixed/changed
- [ ] **Commit changes:** `git add -A && git commit -m "descriptive message"`
- [ ] **Tag version:** `git tag v0.x.x` (increment based on change size)
- [ ] **Push to remote:** `git push origin main --tags`

## 🏷️ Version Tagging

**Semantic versioning:**
- `v0.1.x` — Bug fixes, minor tweaks
- `v0.x.0` — New features, significant changes
- `v1.0.0` — Production-ready milestone

**Why tags matter:**
- If deployment breaks, you can roll back to last known-good version
- `git checkout v0.3.2` instantly reverts to that state
- Without tags, you're fishing through commit history blindly

## 🔄 Deployment Workflow

### Standard Update
```bash
cd C:\Users\Megan\.openclaw\workspace\solace-control-center

# 1. Check current state
git status
git log --oneline -5

# 2. Stage and commit
git add -A
git commit -m "feat: describe what you built"

# 3. Tag version
git tag v0.x.x

# 4. Push
git push origin main --tags

# 5. Start dev server
npm run dev
```

### Emergency Rollback
```bash
# Find last good version
git tag

# Roll back (example: v0.3.2)
git checkout v0.3.2

# Restart dev server
npm run dev
```

### Return to Latest After Rollback
```bash
git checkout main
npm run dev
```

## 📝 Commit Message Format

Use conventional commit prefixes:
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `style:` — Visual/CSS changes
- `refactor:` — Code cleanup, no behavior change
- `test:` — Testing updates
- `chore:` — Dependency updates, config

**Examples:**
```
feat: add streaming TTS with sentence buffering
fix: voice mode auto-listen loop breaking on error
docs: update DEPLOY.md with rollback instructions
```

## 🛡️ Safety Nets

**Current uncommitted changes:**
Run this to see what's uncommitted:
```bash
git status
```

**Stash changes temporarily:**
If you need to test something else without committing:
```bash
git stash save "work in progress"
git checkout v0.3.0
# Test old version
git checkout main
git stash pop  # Restore your work
```

## 🖥️ Desktop Shortcut

**Location:** `C:\Users\Megan\Desktop\Solace Control Center.url`

**Points to:** http://localhost:5173

**Before clicking shortcut:**
1. Open PowerShell/Terminal
2. `cd C:\Users\Megan\.openclaw\workspace\solace-control-center`
3. `npm run dev`
4. Wait for "Local: http://localhost:5173" message
5. Click shortcut

**Bookmark this checklist:** Pin this file in your editor for quick reference.

## 📊 Current State (Auto-Generated)

**Last checked:** 2026-02-14 12:48 PM

**Uncommitted files:**
- .gitignore (modified)
- README.md (modified)
- package-lock.json (modified)
- package.json (modified)
- src/index.css (modified)
- src/pages/ChatPage.tsx (modified)
- vite.config.ts (modified)
- .env.example (new)
- CHANGELOG.md (new)
- SETUP.md (new)
- VOICE_FEATURES.md (new)
- VOICE_MODE.md (new)
- src/services/ (new directory)

**Action required:** Commit these changes before next deployment.

## 🤖 Sol's Automation

I'll remind you to commit before major changes. If you see uncommitted work piling up, ask me to:
- Review changes: `git diff`
- Generate commit message: I'll suggest one based on diffs
- Tag version: I'll increment based on change scope
- Push everything: One command to commit + tag + push

**You're in control.** I'll flag risks, but you decide when to deploy.
