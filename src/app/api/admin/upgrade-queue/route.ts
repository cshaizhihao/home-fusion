import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { enqueueUpgrade, listUpgradeJobs, runNextUpgradeJob } from "@/lib/upgradeQueue";

export const revalidate = 0;

const DEFAULT_CMD =
  "curl -fsSL https://raw.githubusercontent.com/cshaizhihao/home-fusion/main/scripts/install-12379.sh | sudo bash";

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: listUpgradeJobs(30) });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action || "enqueue";

  if (action === "run-next") {
    const job = await runNextUpgradeJob();
    return NextResponse.json({ success: true, data: job });
  }

  const command = body?.command || process.env.UPGRADE_COMMAND || DEFAULT_CMD;
  const job = enqueueUpgrade(command);
  return NextResponse.json({ success: true, data: job });
}
