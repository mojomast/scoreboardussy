param(
  [string]$BranchName = "0.5-beta/ci-deploy",
  [string]$ParentBranch = "0.5beta",
  [string]$CommitMessage = "chore(ci): add GHCR workflow and Rackspace Spot docs",
  [switch]$NoPush
)

function Run-Git([string]$Args) {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "git"
  $psi.Arguments = $Args
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  $p.Start() | Out-Null
  $out = $p.StandardOutput.ReadToEnd()
  $err = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  return @{ ExitCode = $p.ExitCode; StdOut = $out; StdErr = $err }
}

try {
  Write-Host "Preparing to create branch: $BranchName" -ForegroundColor Cyan

  $curRes = Run-Git "rev-parse --abbrev-ref HEAD"
  if ($curRes.ExitCode -ne 0) { throw "git not available or this is not a git repo: $($curRes.StdErr)" }
  $currentBranch = $curRes.StdOut.Trim()
  Write-Host "Current branch: $currentBranch"

  if ($currentBranch -eq $BranchName) {
    Write-Host "You are already on branch $BranchName" -ForegroundColor Yellow
  } else {
    Write-Host "Creating branch $BranchName from parent branch $ParentBranch..."
    # Ensure we have latest refs
    $fetch = Run-Git "fetch origin"
    if ($fetch.ExitCode -ne 0) {
      Write-Warning "git fetch returned non-zero exit. Continuing but this may fail if parent branch isn't available remotely."
    }

    # Try to checkout the parent branch locally; if it doesn't exist, attempt to create it from origin/$ParentBranch
    $parentCheckout = Run-Git "checkout $ParentBranch"
    if ($parentCheckout.ExitCode -ne 0) {
      Write-Host "Parent branch $ParentBranch not found locally; attempting to create from origin/$ParentBranch..."
      $parentCheckout = Run-Git "checkout -b $ParentBranch origin/$ParentBranch"
      if ($parentCheckout.ExitCode -ne 0) {
        throw "Failed to checkout or create parent branch $ParentBranch: $($parentCheckout.StdErr)"
      }
      Write-Host $parentCheckout.StdOut
    } else {
      Write-Host $parentCheckout.StdOut
    }

    # Create the new branch from the checked-out parent
    $res = Run-Git "checkout -b $BranchName"
    if ($res.ExitCode -ne 0) { throw "Failed to create branch: $($res.StdErr)" }
    Write-Host $res.StdOut
  }

  # Stage all changes
  Write-Host "Staging all changes..."
  $add = Run-Git "add -A"
  if ($add.ExitCode -ne 0) { throw "git add failed: $($add.StdErr)" }

  # Check staged changes
  $staged = Run-Git "diff --cached --name-only"
  if ($staged.ExitCode -ne 0) { throw "git diff check failed: $($staged.StdErr)" }

  if ([string]::IsNullOrWhiteSpace($staged.StdOut)) {
    Write-Host "No staged changes to commit on branch $BranchName." -ForegroundColor Yellow
  } else {
    Write-Host "Committing staged changes..."
    $commit = Run-Git "commit -m `"$CommitMessage`""
    if ($commit.ExitCode -ne 0) { throw "git commit failed: $($commit.StdErr)" }
    Write-Host $commit.StdOut
  }

  if (-not $NoPush) {
    Write-Host "Pushing branch $BranchName to origin..."
    $push = Run-Git "push -u origin $BranchName"
    if ($push.ExitCode -ne 0) { throw "git push failed: $($push.StdErr)" }
    Write-Host $push.StdOut
  } else {
    Write-Host "Skipping push (--NoPush supplied)." -ForegroundColor Yellow
  }

  # Return to original branch if different
  if ($currentBranch -ne $BranchName) {
    Write-Host "Switching back to original branch: $currentBranch"
    $checkout = Run-Git "checkout $currentBranch"
    if ($checkout.ExitCode -ne 0) { throw "Failed to checkout ${currentBranch}: $($checkout.StdErr)" }
    Write-Host $checkout.StdOut
  }

  Write-Host "Done. Created branch $BranchName and committed staged changes there." -ForegroundColor Green
  if (-not $NoPush) { Write-Host "Branch pushed to origin/$BranchName." -ForegroundColor Green }
} catch {
  Write-Error "Error: $_"
  exit 1
}

exit 0