import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { getConfig, setConfig } from "@/lib/config";
import { MODULE_PRESETS, isPresetKey } from "@/lib/modulePresets";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, data: MODULE_PRESETS });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const key = String(body?.preset || "");
  if (!isPresetKey(key)) {
    return NextResponse.json({ success: false, message: "invalid preset" }, { status: 400 });
  }

  const cfg: any = await getConfig();
  cfg.modules = { ...cfg.modules, ...MODULE_PRESETS[key].modules };
  const ok = await setConfig(cfg);
  return NextResponse.json({ success: ok, data: { preset: key, modules: cfg.modules } });
}
