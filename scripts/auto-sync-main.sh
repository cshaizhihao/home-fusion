#!/usr/bin/env bash
set -euo pipefail

LOCK="/tmp/home-fusion-auto-sync.lock"
LOG="/var/log/home-fusion-auto-sync.log"
REPO="cshaizhihao/home-fusion"

exec 9>"$LOCK"
flock -n 9 || exit 0

latest=$(curl -fsSL "https://api.github.com/repos/${REPO}/commits/main" | sed -n 's/.*"sha": "\([a-f0-9]\{40\}\)".*/\1/p' | head -n1)
if [[ -z "${latest:-}" ]]; then
  echo "[$(date '+%F %T')] failed to fetch latest sha" >> "$LOG"
  exit 0
fi

# 仅当 ghcr workflow 已成功构建 latest sha 时才升级，避免循环重启
run_json=$(curl -fsSL "https://api.github.com/repos/${REPO}/actions/workflows/ghcr.yml/runs?per_page=10")
ready=$(echo "$run_json" | tr -d '\n' | sed 's/},{/}\n{/g' | grep "\"head_sha\":\"${latest}\"" | grep '"conclusion":"success"' | head -n1 || true)
if [[ -z "$ready" ]]; then
  echo "[$(date '+%F %T')] skip update: ghcr image for ${latest:0:7} not ready" >> "$LOG"
  exit 0
fi

current=$(docker inspect home-fusion-12379 --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | sed -n 's/^VERSION=//p' | head -n1 || true)
if [[ "$current" == "$latest" ]]; then
  exit 0
fi

echo "[$(date '+%F %T')] updating from ${current:-none} -> ${latest}" >> "$LOG"
if curl -fsSL https://raw.githubusercontent.com/cshaizhihao/home-fusion/main/scripts/install-12379.sh | bash >> "$LOG" 2>&1; then
  echo "[$(date '+%F %T')] update success" >> "$LOG"
else
  echo "[$(date '+%F %T')] update failed" >> "$LOG"
fi
