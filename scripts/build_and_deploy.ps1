<#
.SYNOPSIS
  Build a Docker image, push to GHCR, and update a Kubernetes Deployment.
.NOTES
  - Run this in PowerShell (Windows). You can pass parameters or set env vars:
      GHCR_TOKEN (recommended) or you will be prompted to enter the token securely.
  - Example:
      $env:GHCR_TOKEN = "ghp_xxx"
      .\scripts\build_and_deploy.ps1 -Image "ghcr.io/owner/repo:emoji-test" -GHCRUsername "owner" -Deployment "improv-deployment" -Container "improv-container" -Namespace "default" -KubeconfigPath "C:\Users\kyle\.kube\config"
#>

param(
  [string]$Image = "ghcr.io/OWNER/REPO:emoji-test",
  [string]$GHCRUsername = $env:GHCR_USERNAME,
  [string]$Deployment = "your-deployment-name",
  [string]$Container = "your-container-name",
  [string]$Namespace = "default",
  [string]$KubeconfigPath = "$env:USERPROFILE\.kube\config"
)

Write-Host "Starting build-and-deploy with image: $Image" -ForegroundColor Cyan

if (-not $GHCRUsername) {
  $GHCRUsername = Read-Host "GHCR username (owner/org)"
}

# Obtain GHCR token either from env var GHCR_TOKEN or prompt securely
if (-not $env:GHCR_TOKEN) {
  Write-Host "GHCR token not found in environment. You will be prompted to enter it (input hidden)." -ForegroundColor Yellow
  $secure = Read-Host -AsSecureString "Enter GHCR token"
  $GHCRToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
} else {
  $GHCRToken = $env:GHCR_TOKEN
}

Write-Host "Building Docker image: $Image" -ForegroundColor Cyan
docker build -t $Image .

Write-Host "Logging in to ghcr.io as $GHCRUsername" -ForegroundColor Cyan
# Pass token to docker login via stdin
$GHCRToken | docker login ghcr.io -u $GHCRUsername --password-stdin

Write-Host "Pushing image: $Image" -ForegroundColor Cyan
docker push $Image

if (Test-Path $KubeconfigPath) {
  Write-Host "Updating Kubernetes deployment '$Deployment' (container '$Container') in namespace '$Namespace' using kubeconfig: $KubeconfigPath" -ForegroundColor Cyan
  kubectl --kubeconfig $KubeconfigPath set image "deployment/$Deployment" "$Container"="$Image" -n $Namespace
  kubectl --kubeconfig $KubeconfigPath rollout status "deployment/$Deployment" -n $Namespace
} else {
  Write-Host "Kubeconfig not found at $KubeconfigPath. Attempting to run kubectl using default kubeconfig." -ForegroundColor Yellow
  kubectl set image "deployment/$Deployment" "$Container"="$Image" -n $Namespace
  kubectl rollout status "deployment/$Deployment" -n $Namespace
}

Write-Host "Deploy complete. Refresh your front-end URL to confirm the emoji is visible." -ForegroundColor Green