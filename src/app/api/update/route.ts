import { NextResponse } from "next/server";

export const revalidate = 0;

const REPO = "cshaizhihao/home-fusion";

export async function GET() {
  const currentVersion = process.env.VERSION || "unknown";
  const upgradeCommand =
    "curl -fsSL https://raw.githubusercontent.com/cshaizhihao/home-fusion/main/scripts/install-12379.sh | sudo bash";

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
    });
  } catch {
    return NextResponse.json({
      repo: REPO,
      currentVersion,
      latestSha: "unknown",
      latestTime: null,
      hasUpdate: null,
      upgradeCommand,
    });
  }
}
