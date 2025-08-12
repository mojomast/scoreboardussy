#!/usr/bin/env bash
set -euo pipefail

# build_and_deploy.sh
# Builds the repository Docker image, pushes it to GitHub Container Registry (GHCR),
# and updates a Kubernetes Deployment image via kubectl.
#
# Usage example:
#  GHCR_USERNAME=owner GHCR_TOKEN=ghp_xxx IMAGE=ghcr.io/owner/repo:emoji-test \
#    DEPLOYMENT=my-deployment CONTAINER=my-container NAMESPACE=default \
#    KUBECONFIG_PATH="$HOME/.kube/config" ./scripts/build_and_deploy.sh
#
# Notes:
# - This script does NOT store or echo secrets. Provide GHCR_TOKEN and GHCR_USERNAME
#   via environment variables when running locally.
# - Make the script executable locally: chmod +x ./scripts/build_and_deploy.sh

if [ "${1:-}" = "--help" ]; then
  sed -n '1,200p' "$0"
  exit 0
fi

IMAGE="${IMAGE:-ghcr.io/OWNER/REPO:emoji-test}"
GHCR_USERNAME="${GHCR_USERNAME:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"
DEPLOYMENT="${DEPLOYMENT:-your-deployment-name}"
CONTAINER="${CONTAINER:-your-container-name}"
NAMESPACE="${NAMESPACE:-default}"
KUBECONFIG_PATH="${KUBECONFIG_PATH:-$HOME/.kube/config}"

if [ -z "$GHCR_USERNAME" ] || [ -z "$GHCR_TOKEN" ]; then
  echo "ERROR: GHCR_USERNAME and GHCR_TOKEN must be set in the environment."
  echo "Example:"
  echo "  GHCR_USERNAME=owner GHCR_TOKEN=token IMAGE=ghcr.io/owner/repo:tag DEPLOYMENT=my-deploy CONTAINER=my-container ./scripts/build_and_deploy.sh"
  exit 1
fi

echo
echo "=== build_and_deploy.sh starting ==="
echo "Image:    $IMAGE"
echo "Deployment: $DEPLOYMENT"
echo "Container:  $CONTAINER"
echo "Namespace:  $NAMESPACE"
echo

echo "--- Building Docker image: $IMAGE"
docker build -t "$IMAGE" .

echo "--- Logging into GHCR (ghcr.io) as $GHCR_USERNAME"
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

echo "--- Pushing image to registry"
docker push "$IMAGE"

echo "--- Updating Kubernetes deployment image: $DEPLOYMENT -> $IMAGE (container: $CONTAINER) in namespace: $NAMESPACE"
if [ -n "$KUBECONFIG_PATH" ]; then
  kubectl --kubeconfig "$KUBECONFIG_PATH" set image "deployment/$DEPLOYMENT" "$CONTAINER"="$IMAGE" -n "$NAMESPACE"
  kubectl --kubeconfig "$KUBECONFIG_PATH" rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE"
else
  kubectl set image "deployment/$DEPLOYMENT" "$CONTAINER"="$IMAGE" -n "$NAMESPACE"
  kubectl rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE"
fi

echo
echo "--- Done. Refresh your front-end URL to confirm the emoji is visible."