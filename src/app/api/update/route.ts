import { NextResponse } from "next/server";

export const revalidate = 0;

const REPO = "cshaizhihao/home-fusion";
const DEFAULT_UPGRADE_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/cshaizhihao/home-fusion/main/scripts/install-12379.sh | sudo bash";

export async function GET() {
  const currentVersion = process.env.VERSION || "unknown";
  const upgradeCommand = process.env.UPGRADE_COMMAND || DEFAULT_UPGRADE_COMMAND;
  const inDocker = String(process.env.IS_DOCKER || "0") === "1";

  const mode = inDocker ? "ssh_required" : "server_upgrade";
  const modeHint = inDocker
    ? "当前运行在容器内，无法直接升级宿主机。请复制命令到SSH执行。"
    : "可直接使用服务端一键升级。";

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 60 },
    });

    const latest = await res.json();
    const latestSha = latest?.sha ? String(latest.sha).slice(0, 7) : "unknown";
    const latestTime = latest?.commit?.author?.date || null;

    const hasUpdate =
      currentVersion !== "unknown" && latestSha !== "unknown"
        ? !currentVersion.includes(latestSha)
        : null;

    return NextResponse.json({
      repo: REPO,
      currentVersion,
      latestSha,
      latestTime,
      hasUpdate,
      upgradeCommand,
      mode,
      modeHint,
      inDocker,
    });
  } catch {
    return NextResponse.json({
      repo: REPO,
      currentVersion,
      latestSha: "unknown",
      latestTime: null,
      hasUpdate: null,
      upgradeCommand,
      mode,
      modeHint,
      inDocker,
    });
  }
}
