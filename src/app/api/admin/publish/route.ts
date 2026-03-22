import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { createPublishSnapshot } from "@/lib/adminOps";

export const revalidate = 0;

export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const remark = body?.remark || "manual publish";
  const config = await getConfig();
  const snapshot = createPublishSnapshot(config, remark);

  return NextResponse.json({ success: true, data: snapshot });
}
