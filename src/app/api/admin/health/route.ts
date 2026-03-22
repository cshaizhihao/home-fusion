import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { listHealthHistory, runHealthcheck } from "@/lib/healthcheck";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, data: listHealthHistory(20) });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  const data = runHealthcheck();
  return NextResponse.json({ success: true, data });
}
