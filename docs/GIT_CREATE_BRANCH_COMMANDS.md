 person# Exact PowerShell commands to create branch 0.5-beta/ci-deploy from parent 0.5beta, commit current changes, and push

Run these commands from the repository root in PowerShell. They:
- record your current branch,
- ensure the parent branch 0.5beta exists (create from origin if needed),
- create branch 0.5-beta/ci-deploy from that parent,
- stage and commit all current changes,
- push the new branch to origin,
- switch you back to your original branch.

Copy-paste and run the block below in PowerShell:

```powershell
# 1) Record current branch
$orig = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Original branch: $orig"

# 2) Fetch remote refs
git fetch origin

# 3) Ensure parent branch 0.5beta exists locally (try local, else create from origin/0.5beta)
try {
  git rev-parse --verify 0.5beta
  git checkout 0.5beta
} catch {
  Write-Host "Local branch 0.5beta not found; attempting to create from origin/0.5beta"
  git checkout -b 0.5beta origin/0.5beta
}

# 4) Create new branch from 0.5beta
git checkout -b 0.5-beta/ci-deploy

# 5) Stage all changes (adjust the paths if you prefer to only move a subset)
git add -A

# 6) Commit (change message if you prefer)
git commit -m "chore(ci): add GHCR workflow and Rackspace Spot docs"

# 7) Push new branch to origin
git push -u origin 0.5-beta/ci-deploy

# 8) Switch back to your original branch
git checkout $orig

# 9) Verify new branch exists on remote
git ls-remote --heads origin 0.5-beta/ci-deploy
```

Notes and troubleshooting:
- If `git commit` reports "nothing to commit", there were no staged changes; inspect `git status` to see any untracked/modified files.
- If `git checkout -b 0.5beta origin/0.5beta` fails, the remote branch `origin/0.5beta` may not exist; confirm with `git branch -r`.
- If you want to preview what will be committed before committing, replace `git add -A` with `git status --porcelain` and stage files selectively.
- If you prefer not to push immediately, skip the `git push` step and run it later.
- If you want the script form instead, run the existing PowerShell helper:
  powershell -ExecutionPolicy Bypass -File scripts/create_branch_and_move.ps1 -ParentBranch "0.5beta" -NoPush

Run the commands and paste the output here if you want me to help verify success or troubleshoot any errors.