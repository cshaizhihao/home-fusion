import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { getConfig } from "@/lib/config";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  const cfg: any = await getConfig();
  const modules = cfg?.modules || {};
  const warnings: string[] = [];

  if (modules.weather === true && cfg?.globalStyle?.weather === false) {
    warnings.push("天气模块已开启，但全局天气显示为关闭（globalStyle.weather=false）");
  }

  if (modules.music === true && !cfg?.bgConfig?.audio) {
    warnings.push("音乐模块已开启，但未配置背景音频地址（bgConfig.audio 为空）");
  }

  if (modules.sliders === true) {
    const list = cfg?.sliders?.data;
    if (!Array.isArray(list) || list.length === 0) {
      warnings.push("技能模块已开启，但 sliders.data 为空");
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      modules,
      warnings,
      healthy: warnings.length === 0,
    },
  });
}
