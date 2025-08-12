# How to run [`scripts/create_branch_and_move.ps1:1`](scripts/create_branch_and_move.ps1:1)

From the repository root run:

powershell -ExecutionPolicy Bypass -File scripts/create_branch_and_move.ps1

To create the branch but skip pushing to origin:

powershell -ExecutionPolicy Bypass -File scripts/create_branch_and_move.ps1 -NoPush

Expected behavior:
- Creates branch 0.5-beta/ci-deploy
- Stages all changes, commits them with message "chore(ci): add GHCR workflow and Rackspace Spot docs"
- Pushes the new branch to origin (unless -NoPush)
- Switches you back to your original branch

Verify after running:
git checkout 0.5-beta/ci-deploy
git log --oneline -n 5