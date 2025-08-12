#!/usr/bin/env bash
# Deep scan repository for container image references and saved image archives.
# Outputs a deduplicated list to images-found.txt and prints it.
#
# Looks for:
# - YAML/YML (Kubernetes/compose): lines with "image:"
# - Dockerfiles: FROM lines
# - Scripts (.sh/.ps1): docker/podman build/run/pull/push/tag, kubectl set image, --image=
# - docker-compose.* files
# - Saved Docker image archives (*.tar, *.tar.gz): extracts RepoTags from manifest.json
#
# Usage:
#   bash ./scripts/deep_scan_images.sh
#
# Output:
#   images-found.txt (unique list of repo/name:tag or repo/name@sha256:... if present)

set -euo pipefail

ROOT_DIR="."
OUTFILE="images-found.txt"
TMP="$(mktemp -t images-scan.XXXXXX)"

cleanup() {
  rm -f "$TMP" 2>/dev/null || true
}
trap cleanup EXIT

add_candidates() {
  # Append non-empty lines to temp
  while IFS= read -r line; do
    [ -n "${line// /}" ] && echo "$line" >> "$TMP"
  done
}

echo "Scanning repository for container image references..."

# 1) YAML/YML: capture values after 'image:'
# Handles both Kubernetes and docker-compose
# Examples it will catch:
#   image: ghcr.io/org/app:1.2.3
#   image: "myrepo/app@sha256:abc..."
#   image: registry.local:5000/app:latest
YAML_MATCHES=$(
  grep -R --line-number -I -E '(^|[[:space:]])image[[:space:]]*:' "$ROOT_DIR" 2>/dev/null \
  | sed -E 's/^[^:]+:[0-9]+:[[:space:]]*//; s/^[[:space:]]*image[[:space:]]*:[[:space:]]*//I; s/[",]$//' \
  | sed -E 's/#.*$//' \
  | sed -E 's/^[[:space:]]*//; s/[[:space:]]*$//'
)
add_candidates <<< "$YAML_MATCHES"

# 2) Dockerfiles: capture FROM lines
DOCKERFILE_MATCHES=$(
  grep -R --line-number -I -E '^[[:space:]]*FROM[[:space:]]+' "$ROOT_DIR" 2>/dev/null \
  | sed -E 's/^[^:]+:[0-9]+:[[:space:]]*//; s/^[[:space:]]*FROM[[:space:]]+//I; s/[[:space:]]+AS[[:space:]]+.*$//I'
)
add_candidates <<< "$DOCKERFILE_MATCHES"

# 3) Scripts and misc: docker/podman/kubectl/helm invocations
SCRIPT_MATCHES=$(
  grep -R --line-number -I -E 'docker (build|run|pull|push|tag)|podman (build|run|pull|push|tag)|kubectl set image|--image=|image=' "$ROOT_DIR" 2>/dev/null \
  | sed -E 's/^[^:]+:[0-9]+:[[:space:]]*//' \
  | sed -E 's/^.*--image=([^[:space:]]+).*$/\1/; s/^.*image=([^[:space:]]+).*$/\1/; s/^.*\simage\s*:\s*([^[:space:]]+).*$/\1/I'
)
add_candidates <<< "$SCRIPT_MATCHES"

# 4) Saved Docker image archives: *.tar, *.tar.gz
# Extract RepoTags from manifest.json inside the tar
extract_tags_from_tar() {
  local f="$1"
  # require tar
  if ! command -v tar >/dev/null 2>&1; then
    return 0
  fi
  local manifest
  manifest="$(tar -xOf "$f" manifest.json 2>/dev/null || true)"
  [ -z "$manifest" ] && return 0

  # Prefer jq if present, otherwise try python, else best-effort text parse
  if command -v jq >/dev/null 2>&1; then
    echo "$manifest" | jq -r '.[0].RepoTags[]' 2>/dev/null || true
  elif command -v python3 >/dev/null 2>&1; then
    python3 - "$f" <<'PYCODE'
import sys, json
data=json.load(sys.stdin)
for t in data[0].get("RepoTags", []):
    print(t)
PYCODE
  else
    # very rough fallback
    echo "$manifest" \
      | tr -d '\r' \
      | tr '\n' ' ' \
      | sed -E 's/.*"RepoTags":[[:space:]]*\[([^\]]*)\].*/\1/' \
      | tr ',' '\n' \
      | tr -d ' []"' \
      | grep -E '.+[:@].+' || true
  fi
}

# Find tar archives
while IFS= read -r TARFILE; do
  # Skip empty
  [ -z "$TARFILE" ] && continue
  TAGS=$(extract_tags_from_tar "$TARFILE" || true)
  [ -n "$TAGS" ] && add_candidates <<< "$TAGS"
done < <(find "$ROOT_DIR" -type f \( -name '*.tar' -o -name '*.tar.gz' -o -name '*.oci' \) 2>/dev/null)

# 5) Normalize, filter, dedupe
# Keep lines that look like repo/name[:tag] or name@sha256:...
# Trim quotes/spaces
NORMALIZED=$(
  sed -E 's/^[[:space:]]*["'\''"]?//; s/["'\''"]?[[:space:]]*$//' "$TMP" \
  | sed -E 's/[",]$//' \
  | grep -E '.+[:@/].+' \
  | sed -E 's/[[:space:]]+//g' \
  | sort -u
)

: > "$OUTFILE"
echo "$NORMALIZED" > "$OUTFILE"

echo "Scan complete. Found image-like entries (unique):"
echo "------------------------------------------------"
cat "$OUTFILE" || true
echo "------------------------------------------------"
echo "Saved to $OUTFILE"
exit 0