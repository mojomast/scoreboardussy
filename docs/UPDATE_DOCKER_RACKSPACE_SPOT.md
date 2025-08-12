# Update Docker image and push to Rackspace Spot

This file contains precise, copy-pasteable commands and a checklist for building the repository Docker image, pushing it to a container registry (GHCR recommended), and updating the Rackspace Spot Kubernetes deployment included in this repository.

It references repository files such as [`Dockerfile`](Dockerfile:1), [`scripts/build_and_deploy.sh`](scripts/build_and_deploy.sh:1), the kubeconfig at [`scoreboard1-kubeconfig.yaml`](scoreboard1-kubeconfig.yaml:1), and the manifest [`k8s-deployment.yaml`](k8s-deployment.yaml:1). Use the commands below from the repository root.

Prerequisites
- Docker installed and running
- kubectl installed
- Access to the cluster kubeconfig file: [`scoreboard1-kubeconfig.yaml`](scoreboard1-kubeconfig.yaml:1)
- Registry credentials for the registry you will push to (example below uses GHCR: ghcr.io)
- Git access to commit manifest changes if you choose to update manifests in-repo

1. Choose image name and tag
- Recommended registry & image (default in repo): ghcr.io/mojomast/improvscoreboard
- Choose a tag pattern you will use consistently:
  - Semantic: v0.5.7
  - Date-based: v0.5.7-20250812
  - Commit-based: sha-abcdef1
- Example final image: ghcr.io/mojomast/improvscoreboard:v0.5.7-20250812

2. Build the image locally (multi-stage build)
- From repository root (where [`Dockerfile`](Dockerfile:1) lives):
```bash
# replace <TAG> with chosen tag
export IMAGE=ghcr.io/mojomast/improvscoreboard:<TAG>
docker build -t "$IMAGE" .
```

3. Local smoke test
- Run the container locally and verify the server and static client serve correctly:
```bash
# run container and map port 3001
docker run --rm -p 3001:3001 "$IMAGE"
# In another terminal:
curl -i http://localhost:3001/      # should return HTML from client or a 200
curl -i http://localhost:3001/api/  # or any known API endpoint
```

4. Push to registry (GHCR example)
- Login and push. Use environment variables to avoid leaking credentials in shell history.
```bash
# Set chosen image
export IMAGE=ghcr.io/mojomast/improvscoreboard:<TAG>

# Login to GHCR (replace GHCR_USERNAME and pipe GHCR_TOKEN)
# You can set GHCR_TOKEN as an environment variable (preferred)
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

# Push
docker push "$IMAGE"
```

Alternative: Docker Hub
```bash
# Docker Hub example (image name: mojomast/improvscoreboard:<TAG>)
export IMAGE=mojomast/improvscoreboard:<TAG>
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
docker push "$IMAGE"
```

5. (Optional) Use included helper script (GHCR + kubectl)
- The repository includes [`scripts/build_and_deploy.sh`](scripts/build_and_deploy.sh:1) and [`scripts/build_and_deploy.ps1`](scripts/build_and_deploy.ps1:1) which:
  - build the image
  - log into GHCR
  - push the image
  - update a Kubernetes Deployment via kubectl
- Example invocation (Bash):
```bash
# Example env variables to set:
export GHCR_USERNAME=owner
export GHCR_TOKEN=ghp_xxx
export IMAGE=ghcr.io/mojomast/improvscoreboard:<TAG>
export DEPLOYMENT=improvscoreboard
export CONTAINER=improvscoreboard
export NAMESPACE=default
export KUBECONFIG_PATH="$(pwd)/scoreboard1-kubeconfig.yaml"

# Run the script
./scripts/build_and_deploy.sh
```
- The script expects GHCR_USERNAME and GHCR_TOKEN to be present in the environment.

6. Ensure cluster can pull the private image (create imagePullSecret)
- If your image is private (GHCR or Docker Hub), create a Kubernetes secret the deployment references. The repo's [`k8s-deployment.yaml`](k8s-deployment.yaml:1) expects a secret named `ghcr-login-secret`.
- Create the secret using the included kubeconfig [`scoreboard1-kubeconfig.yaml`](scoreboard1-kubeconfig.yaml:1):
```bash
# For GHCR
kubectl --kubeconfig scoreboard1-kubeconfig.yaml create secret docker-registry ghcr-login-secret \
  --docker-server=ghcr.io \
  --docker-username="$GHCR_USERNAME" \
  --docker-password="$GHCR_TOKEN" \
  --docker-email="you@example.com" \
  -n default
```
- For Docker Hub:
```bash
kubectl --kubeconfig scoreboard1-kubeconfig.yaml create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username="$DOCKERHUB_USERNAME" \
  --docker-password="$DOCKERHUB_TOKEN" \
  --docker-email="you@example.com" \
  -n default
```
- If the secret already exists and you need to update it, use `kubectl delete secret ...` then re-create, or `kubectl create secret --dry-run=client -o yaml ... | kubectl apply -f -`.

7. Update the Deployment image (recommended: kubectl set image)
- Prefer `kubectl set image` to avoid editing and committing manifests for transient changes:
```bash
kubectl --kubeconfig scoreboard1-kubeconfig.yaml set image deployment/improvscoreboard \
  improvscoreboard="$IMAGE" \
  -n default

# Wait for rollout to complete:
kubectl --kubeconfig scoreboard1-kubeconfig.yaml rollout status deployment/improvscoreboard -n default
```

8. Verify rollout, pods and service
```bash
# Check pods and status
kubectl --kubeconfig scoreboard1-kubeconfig.yaml get pods -l app=improvscoreboard -n default

# View logs
kubectl --kubeconfig scoreboard1-kubeconfig.yaml logs -l app=improvscoreboard -n default -f

# Check service and LoadBalancer IP (if using LoadBalancer)
kubectl --kubeconfig scoreboard1-kubeconfig.yaml get svc improvscoreboard-service -n default -o wide

# Save external IP to file (the repo tracks loadbalancer-ip.txt)
kubectl --kubeconfig scoreboard1-kubeconfig.yaml get svc improvscoreboard-service -n default -o jsonpath='{.status.loadBalancer.ingress[0].ip}' > loadbalancer-ip.txt
cat loadbalancer-ip.txt
```

9. Manifest-based workflow (if you prefer to update repo and apply manifests)
- Edit [`k8s-deployment.yaml`](k8s-deployment.yaml:1), change the `image:` field under the container to the new `$IMAGE`.
- Commit the change and push:
```bash
git add k8s-deployment.yaml
git commit -m "chore(k8s): update image to $IMAGE"
git push origin main
```
- Apply to cluster:
```bash
kubectl --kubeconfig scoreboard1-kubeconfig.yaml apply -f k8s-deployment.yaml
kubectl --kubeconfig scoreboard1-kubeconfig.yaml rollout status deployment/improvscoreboard -n default
```

10. Rollback plan
- If the new image causes errors, perform:
```bash
kubectl --kubeconfig scoreboard1-kubeconfig.yaml rollout undo deployment/improvscoreboard -n default
# Then check pod status and logs
kubectl --kubeconfig scoreboard1-kubeconfig.yaml get pods -l app=improvscoreboard -n default
kubectl --kubeconfig scoreboard1-kubeconfig.yaml logs -l app=improvscoreboard -n default -f
```

11. Common checks & troubleshooting
- Image pull issues:
  - Check events and describe pods:
  ```bash
  kubectl --kubeconfig scoreboard1-kubeconfig.yaml describe pod <pod-name> -n default
  kubectl --kubeconfig scoreboard1-kubeconfig.yaml get events -n default --sort-by='.metadata.creationTimestamp'
  ```
- If the kubeconfig token expires:
  - The repository contains an OIDC-enabled context in [`scoreboard1-kubeconfig.yaml`](scoreboard1-kubeconfig.yaml:1) (`-oidc`) that can be used with `kubelogin` per [`rackspace_spot_cli.md`](rackspace_spot_cli.md:1). See Notes below.

12. Notes about kubeconfig token expiry (Rackspace Spot)
- The kubeconfig embedded token is short-lived (typically up to 72 hours). Long-term options:
  - Use the OIDC context with `kubelogin` (`kubeconfig` has an `-oidc` context) and follow the instructions in [`rackspace_spot_cli.md`](rackspace_spot_cli.md:1).
  - Re-download kubeconfig from the Spot UI if needed.

13. Example end-to-end GHCR commands (compact)
```bash
# From repo root:
export TAG=v0.5.7-$(date +%Y%m%d)
export IMAGE=ghcr.io/mojomast/improvscoreboard:$TAG
export GHCR_USERNAME=mojomast
export GHCR_TOKEN=<<<your_token_here>>>
export KUBECONFIG_PATH="$(pwd)/scoreboard1-kubeconfig.yaml"

# Build
docker build -t "$IMAGE" .

# Push
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
docker push "$IMAGE"

# Create/update pull secret in cluster
kubectl --kubeconfig "$KUBECONFIG_PATH" create secret docker-registry ghcr-login-secret \
  --docker-server=ghcr.io --docker-username="$GHCR_USERNAME" --docker-password="$GHCR_TOKEN" --docker-email="you@example.com" -n default

# Update deployment image
kubectl --kubeconfig "$KUBECONFIG_PATH" set image deployment/improvscoreboard improvscoreboard="$IMAGE" -n default
kubectl --kubeconfig "$KUBECONFIG_PATH" rollout status deployment/improvscoreboard -n default
```

14. Minimal CI/CD recommendations
- Store credentials as encrypted secrets (GHCR_TOKEN, GHCR_USERNAME, KUBECONFIG) in your CI system.
- Example GitHub Actions job steps:
  - Build Docker image
  - Log in to GHCR using secrets
  - Push image with tag
  - Use `kubectl` (with kubeconfig secret) to `set image` and `rollout status`
- Keep the kubeconfig short-lived: prefer creating a service principal / automation token via Spot API or use temporary kubeconfig retrieval as part of CI.

15. Checklist (copy and follow)
- [ ] Pick image tag and set IMAGE
- [ ] Build image: `docker build -t $IMAGE .`
- [ ] Test image locally
- [ ] Push image to registry
- [ ] Create/refresh imagePullSecret in cluster (`ghcr-login-secret`)
- [ ] Update deployment image (`kubectl set image ...`)
- [ ] Validate rollout and logs
- [ ] Save LoadBalancer IP to [`loadbalancer-ip.txt`](loadbalancer-ip.txt:1)
- [ ] Commit any manifest changes if using manifest-based workflow
- [ ] Document the new tag in changelog or release notes

16. Useful repo locations
- Multi-stage build: [`Dockerfile`](Dockerfile:1)
- GHCR helper script: [`scripts/build_and_deploy.sh`](scripts/build_and_deploy.sh:1)
- Kubernetes manifest: [`k8s-deployment.yaml`](k8s-deployment.yaml:1)
- Kubeconfig for Rackspace Spot: [`scoreboard1-kubeconfig.yaml`](scoreboard1-kubeconfig.yaml:1)
- Rackspace Spot CLI notes: [`rackspace_spot_cli.md`](rackspace_spot_cli.md:1)
- Kubernetes deployment guide: [`K8S_DEPLOYMENT.md`](K8S_DEPLOYMENT.md:1)

If you want, I can now:
- (A) Produce a ready-to-run single command you can paste (I will prepare it using the default GHCR image name and the repo kubeconfig), or
- (B) Update the repository manifest [`k8s-deployment.yaml`](k8s-deployment.yaml:1) to use a specific image tag and commit the change for you to apply, or
- (C) Draft a GitHub Actions workflow that automates build → push → kubectl rollout using repository secrets.

Pick one of the three options and I will proceed.
## Setting the required GitHub Actions secrets

The workflow at [` .github/workflows/ci-deploy.yml`](.github/workflows/ci-deploy.yml:1) requires three repository secrets:

- GHCR_USERNAME — GHCR username or organization (example: mojomast)  
- GHCR_TOKEN — Personal access token with registry permissions (read:packages + write:packages)  
- KUBECONFIG_DATA — base64-encoded contents of the kubeconfig file for the Rackspace Spot cluster (the repo includes [`scoreboard1-kubeconfig.yaml`](scoreboard1-kubeconfig.yaml:1))

Below are two ways to add these secrets: GitHub web UI (manual) and gh CLI (scriptable).

A. Web UI (recommended for one-off setup)
1. Open your repository on GitHub.
2. Go to Settings → Secrets and variables → Actions → New repository secret.
3. Add each secret (Name / Value):
   - GHCR_USERNAME → your GHCR username/org
   - GHCR_TOKEN → the PAT you created for GHCR
   - KUBECONFIG_DATA → the base64 string produced from [`scoreboard1-kubeconfig.yaml`](scoreboard1-kubeconfig.yaml:1)
4. Save each secret.

B. gh CLI (scriptable)
1. Install and authenticate gh: https://cli.github.com/
2. From the repo root, run:

Linux/macOS:
```bash
# set GHCR username and token variables locally first
export GHCR_USERNAME="mojomast"
export GHCR_TOKEN="ghp_xxx"

# Base64-encode the kubeconfig into a single-line string
base64 -w0 scoreboard1-kubeconfig.yaml > scoreboard1-kubeconfig.b64

# Create/replace secrets via gh
gh secret set GHCR_USERNAME --body "$GHCR_USERNAME"
gh secret set GHCR_TOKEN --body "$GHCR_TOKEN"
gh secret set KUBECONFIG_DATA --body "$(cat scoreboard1-kubeconfig.b64)"
```

Windows PowerShell:
```powershell
# Prompt for values or set them beforehand
$env:GHCR_USERNAME = "mojomast"
$env:GHCR_TOKEN = Read-Host -AsSecureString "Enter GHCR token" | ConvertFrom-SecureString

# Base64 encode kubeconfig
$b = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content -Raw -Path 'scoreboard1-kubeconfig.yaml')))

# Set secrets
gh secret set GHCR_USERNAME --body $env:GHCR_USERNAME
gh secret set GHCR_TOKEN --body "<paste_plain_token_here>"
gh secret set KUBECONFIG_DATA --body $b
```

Notes and tips
- To generate the GHCR token: create a GitHub PAT with packages permissions (write:packages + read:packages) or use a fine-grained token with registry package write/read scopes.
- To produce KUBECONFIG_DATA reliably: ensure you base64-encode the exact contents of the [`scoreboard1-kubeconfig.yaml`](scoreboard1-kubeconfig.yaml:1) file and that the resulting single-line string is what you paste into the secret.
- Verify secrets are present: GitHub UI → Settings → Secrets and variables → Actions, or run `gh secret list`.
- After secrets are set, trigger the workflow from GitHub Actions UI or push to main; monitor the run logs for build/push and kubectl stages.
- For long-term automation: consider a CI-specific machine account and rotate tokens regularly.

If you want, I can append the exact gh CLI snippet tailored to your OS (Linux/macOS or Windows) into this document and produce a single command that base64-encodes your kubeconfig and uploads it as `KUBECONFIG_DATA`. Tell me which OS you are using if you'd like that.
PowerShell (Windows) one-liner / small script to base64-encode the kubeconfig and create the three GitHub Actions secrets (requires gh CLI authenticated).

- Files referenced: [`scoreboard1-kubeconfig.yaml`](scoreboard1-kubeconfig.yaml:1), workflow: [`.github/workflows/ci-deploy.yml`](.github/workflows/ci-deploy.yml:1)

Copy-paste this into PowerShell (run from the repository root):

```powershell
# Ensure gh is logged in first:
gh auth login

# Prompt for GHCR username and token (token input hidden)
$ghcrUser = Read-Host "GHCR username (owner/org)"
$secureToken = Read-Host "GHCR token (input hidden)" -AsSecureString
$ghcrToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken))

# Base64-encode the kubeconfig file (single-line)
$kubeB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content -Raw -Path 'scoreboard1-kubeconfig.yaml')))

# Create/update repository secrets via gh CLI
gh secret set GHCR_USERNAME --body $ghcrUser
gh secret set GHCR_TOKEN --body $ghcrToken
gh secret set KUBECONFIG_DATA --body $kubeB64

# Cleanup sensitive variables in memory
$ghcrToken = $null
$secureToken = $null
```

Notes:
- After running this, verify secrets with `gh secret list` or in the GitHub web UI (Settings → Secrets and variables → Actions).
- The workflow [`.github/workflows/ci-deploy.yml`](.github/workflows/ci-deploy.yml:1) will use these secrets when triggered.
- If you prefer to avoid prompts, you can replace the Read-Host lines with literal values (not recommended) or supply them from a secure vault.