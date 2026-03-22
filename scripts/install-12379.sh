#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/cshaizhihao/home-fusion.git"
BRANCH="main"
APP_DIR="/opt/home-fusion"
ENV_FILE="${APP_DIR}/.env"
CONFIG_MOUNT_DIR="${APP_DIR}/config"
CONTAINER_NAME="home-fusion-12379"
IMAGE_NAME="home-fusion:latest"
REMOTE_IMAGE="ghcr.io/cshaizhihao/home-fusion:main"
HOST_PORT="12379"
CONTAINER_PORT="3000"

log(){ echo -e "\033[1;34m[fusion-installer]\033[0m $*"; }
err(){ echo -e "\033[1;31m[error]\033[0m $*"; }

if [[ ${EUID} -ne 0 ]]; then err "请使用 sudo/root 执行"; exit 1; fi

need_cmd(){ command -v "$1" >/dev/null 2>&1; }

install_pkg(){
  if need_cmd apt-get; then apt-get update -y && apt-get install -y "$@";
  elif need_cmd dnf; then dnf -y install "$@";
  elif need_cmd yum; then yum -y install "$@";
  else err "不支持的包管理器"; exit 1; fi
}

ensure_env_password(){
  mkdir -p "$APP_DIR"

  local force_reset="${FORCE_PASSWORD_RESET:-0}"
  local pass="${HOME_FUSION_PASSWORD:-}"

  if [[ "$force_reset" != "1" && -z "$pass" && -f "$ENV_FILE" ]]; then
    pass="$(grep -E '^PASSWORD=' "$ENV_FILE" | tail -n1 | cut -d= -f2- || true)"
    if [[ -n "$pass" ]]; then
      log "检测到已存在 PASSWORD，默认复用（如需重置：FORCE_PASSWORD_RESET=1）"
    fi
  fi

  if [[ -z "$pass" ]]; then
    if [[ -t 0 ]]; then
      read -r -s -p "请输入 /admin 密码（首次安装必填）: " pass
      echo
      if [[ -z "$pass" ]]; then
        err "密码不能为空"
        exit 1
      fi
    else
      err "未检测到 PASSWORD。请通过环境变量传入：HOME_FUSION_PASSWORD='your_pass'"
      exit 1
    fi
  fi

  # 写入/更新 ENV_FILE
  if [[ -f "$ENV_FILE" ]]; then
    grep -v '^PASSWORD=' "$ENV_FILE" > "${ENV_FILE}.tmp" || true
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
  fi
  {
    echo "PASSWORD=${pass}"
    # 可选：保留已有扩展变量
    [[ -n "${UPGRADE_TOKEN:-}" ]] && echo "UPGRADE_TOKEN=${UPGRADE_TOKEN}"
    [[ -n "${GITHUB_TOKEN:-}" ]] && echo "GITHUB_TOKEN=${GITHUB_TOKEN}"
  } >> "$ENV_FILE"

  chmod 600 "$ENV_FILE"
  log "已写入环境配置：$ENV_FILE"
}

if ! need_cmd docker; then
  log "安装 Docker..."
  if need_cmd apt-get; then
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") $(. /etc/os-release; echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  else
    install_pkg docker
  fi
  systemctl enable --now docker || true
fi

ensure_config_mount(){
  mkdir -p "$CONFIG_MOUNT_DIR"

  if [[ ! -f "$CONFIG_MOUNT_DIR/config.json" ]]; then
    if [[ -f "$APP_DIR/src/config/config.json" ]]; then
      cp "$APP_DIR/src/config/config.json" "$CONFIG_MOUNT_DIR/config.json"
    else
      curl -fsSL "https://raw.githubusercontent.com/cshaizhihao/home-fusion/main/src/config/config.json" -o "$CONFIG_MOUNT_DIR/config.json" || true
    fi
  fi

  chmod -R 777 "$CONFIG_MOUNT_DIR" || true
  log "配置目录已就绪：$CONFIG_MOUNT_DIR"
}

ensure_env_password

# 优先拉取预构建镜像（最快）
USE_REMOTE_IMAGE=0
if docker pull "$REMOTE_IMAGE" >/dev/null 2>&1; then
  log "已拉取预构建镜像: $REMOTE_IMAGE"
  docker tag "$REMOTE_IMAGE" "$IMAGE_NAME"
  USE_REMOTE_IMAGE=1
else
  log "未拉取到远程镜像，回退为本地构建"
  if ! need_cmd git; then install_pkg git; fi

  if [[ -d "$APP_DIR/.git" ]]; then
    log "更新已有项目..."
    git -C "$APP_DIR" fetch origin "$BRANCH"
    git -C "$APP_DIR" checkout "$BRANCH"
    git -C "$APP_DIR" reset --hard "origin/$BRANCH"
  else
    log "克隆项目..."
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi

  VERSION="$(git -C "$APP_DIR" rev-parse --short HEAD || echo unknown)"
  APP_VERSION="$(cat "$APP_DIR/VERSION" 2>/dev/null || echo Vol.dev)"
  log "构建镜像... app=${APP_VERSION}, commit=${VERSION}"
  docker build --build-arg VERSION="$VERSION" --build-arg APP_VERSION="$APP_VERSION" -t "$IMAGE_NAME" "$APP_DIR"
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

ensure_config_mount

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -v "$CONFIG_MOUNT_DIR:/remio-home/config" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "$IMAGE_NAME" >/dev/null

if [[ "$USE_REMOTE_IMAGE" -eq 1 ]]; then
  log "部署完成 ✅（极速镜像模式） 访问: http://<服务器IP>:${HOST_PORT}"
else
  log "部署完成 ✅（本地构建模式） 访问: http://<服务器IP>:${HOST_PORT}"
fi
