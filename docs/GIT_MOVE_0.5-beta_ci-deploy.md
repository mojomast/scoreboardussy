# Move changes into new branch 0.5-beta/ci-deploy

This document gives exact git commands to create a new branch named 0.5-beta/ci-deploy and move any commits and/or uncommitted changes into that branch, leaving main without these changes.

Assumptions:
- You're in the repository root (where `.git` is).
- Remote is named `origin`.
- Current branch with the changes is `main`.
- The files added by the work in this session are:
  - [`docs/UPDATE_DOCKER_RACKSPACE_SPOT.md:1`]
  - [`.github/workflows/ci-deploy.yml:1`]
- You will run the commands locally in your environment (PowerShell, Bash, etc.).

Step 1 — Create the new branch and capture current state (committed + uncommitted)
1. Create and switch to the new branch:
   git checkout -b 0.5-beta/ci-deploy

2. If you have uncommitted changes, commit them on the new branch:
   git add docs/UPDATE_DOCKER_RACKSPACE_SPOT.md .github/workflows/ci-deploy.yml
   git commit -m "chore(ci): add GHCR workflow and Rackspace Spot docs"

3. Push the new branch to the remote:
   git push -u origin 0.5-beta/ci-deploy

At this point the new branch preserves the current work (both commits and new commits you just made). Now decide how to remove the changes from `main`.

Step 2 — Restore main to previous state (choose one)

Option A — Safe, non-destructive (recommended)
- Use this if you want to keep history intact and create inverse commits on main.
1. Switch to main:
   git checkout main

2. Identify the commits you want to remove (look for the commits that introduced the workflow/docs):
   git log --oneline --decorate --no-merges

3. Revert each unwanted commit (oldest → newest). Example:
   git revert <commit-hash-to-remove>

   Repeat git revert for each commit hash you recorded.

4. Push the revert commits:
   git push origin main

Notes: Revert creates new commits that undo the changes — safe for shared repos and CI.

Option B — Rewrite history (destructive — only if acceptable)
- Use this only if you control the repo and are OK force-pushing.
1. Fetch latest origin:
   git fetch origin

2. Find the last good commit SHA on origin/main (GOOD_SHA). Example:
   git log origin/main --oneline

   Identify the SHA of the commit before the accidental commits.

3. Reset local main to that GOOD_SHA:
   git checkout main
   git reset --hard GOOD_SHA

4. Force-push the cleaned main:
   git push --force origin main

Warning: This rewrites remote history. Coordinate with collaborators and CI before doing this.

Step 3 — Quick automation shortcuts

- If you just want to snapshot current HEAD into the branch and then clean main later:
  git branch 0.5-beta/ci-deploy HEAD
  git push -u origin 0.5-beta/ci-deploy

- To list recent commits on main to decide which to revert/reset:
  git checkout main
  git log --oneline -n 10

Verification
- Confirm the new branch contains your changes:
  git fetch origin
  git checkout 0.5-beta/ci-deploy
  git log --oneline

- Confirm main no longer contains the files (after revert/reset):
  git checkout main
  git show HEAD:docs/UPDATE_DOCKER_RACKSPACE_SPOT.md   # should fail if removed

Notes & recommendations
- If you are unsure, use Option A (git revert) — it is safe for shared repositories.
- If you must completely remove the commits from main and they have been pushed, do Option B only after agreeing with your team because it requires force-push.
- After creating `0.5-beta/ci-deploy`, consider opening a Pull Request from it when you are ready to merge.

Done.