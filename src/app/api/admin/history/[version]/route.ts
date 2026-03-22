import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { getHistoryDetail } from "@/lib/adminOps";

export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { version: string } }
) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  const detail = getHistoryDetail(params.version);
  if (!detail) {
    return NextResponse.json({ success: false, message: "not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: detail });
}
