import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { getHistoryDetail, appendOpLog } from "@/lib/adminOps";
import { setConfig } from "@/lib/config";

export const revalidate = 0;

export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const version = String(body?.version || "");
  if (!version) {
    return NextResponse.json({ success: false, message: "version is required" }, { status: 400 });
  }

  const detail = getHistoryDetail(version);
  if (!detail?.json) {
    return NextResponse.json({ success: false, message: "history version not found" }, { status: 404 });
  }

  const ok = await setConfig(detail.json as any);
  if (!ok) {
    return NextResponse.json({ success: false, message: "rollback failed on setConfig" }, { status: 500 });
  }

  appendOpLog({
    type: "rollback",
    at: new Date().toISOString(),
    version,
    remark: "rollback from admin",
  });

  return NextResponse.json({ success: true, data: { version } });
}
