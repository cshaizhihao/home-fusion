import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { getConfigProfile } from "@/lib/config";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  const profile = getConfigProfile();
  const fileName = profile === "prod" ? "config.json" : `config.${profile}.json`;

  return NextResponse.json({
    success: true,
    data: {
      profile,
      fileName,
      supported: ["dev", "staging", "prod"],
      hint: "通过环境变量 CONFIG_PROFILE 切换配置环境",
    },
  });
}
