import { NextResponse } from "next/server";

export const revalidate = 0;

const REPO = "cshaizhihao/home-fusion";
const DEFAULT_UPGRADE_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/cshaizhihao/home-fusion/main/scripts/install-12379.sh | sudo bash";

export async function GET() {
  const currentCommit = process.env.VERSION || "unknown";
  const currentVol = process.env.APP_VERSION || "Vol.unknown";
  const upgradeCommand = process.env.UPGRADE_COMMAND || DEFAULT_UPGRADE_COMMAND;
  const inDocker = String(process.env.IS_DOCKER || "0") === "1";

  const mode = inDocker ? "ssh_required" : "server_upgrade";
  const modeHint = inDocker
    ? "当前运行在容器内，无法直接升级宿主机。请复制命令到SSH执行。"
    : "可直接使用服务端一键升级。";

  try {
    const [commitRes, volRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${REPO}/commits/main`, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 60 },
      }),
      fetch(`https://raw.githubusercontent.com/${REPO}/main/VERSION`, {
        next: { revalidate: 60 },
      }),
    ]);

    const latest = await commitRes.json();
    const latestSha = latest?.sha ? String(latest.sha).slice(0, 7) : "unknown";
    const latestTime = latest?.commit?.author?.date || null;
    const latestVol = volRes.ok ? (await volRes.text()).trim() : "Vol.unknown";

    const hasUpdate =
      currentCommit !== "unknown" && latestSha !== "unknown"
        ? !currentCommit.includes(latestSha)
        : null;

    return NextResponse.json({
      repo: REPO,
      currentCommit,
      latestSha,
      currentVol,
      latestVol,
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
      currentCommit,
      latestSha: "unknown",
      currentVol,
      latestVol: "Vol.unknown",
      latestTime: null,
      hasUpdate: null,
      upgradeCommand,
      mode,
      modeHint,
      inDocker,
    });
  }
}
