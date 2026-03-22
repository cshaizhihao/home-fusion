import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { listHistory } from "@/lib/adminOps";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }
  const data = listHistory(30);
  return NextResponse.json({ success: true, data });
}
