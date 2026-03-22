import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { getHistoryDetail, getLatestHistoryVersion } from "@/lib/adminOps";

export const revalidate = 0;

function diffTopLevel(prev: Record<string, any>, curr: Record<string, any>) {
  const keys = new Set([...Object.keys(prev || {}), ...Object.keys(curr || {})]);
  const changed: string[] = [];
  for (const k of keys) {
    const a = JSON.stringify(prev?.[k]);
    const b = JSON.stringify(curr?.[k]);
    if (a !== b) changed.push(k);
  }
  return changed;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  const latestVersion = getLatestHistoryVersion();
  const current = await getConfig();
  if (!latestVersion) {
    return NextResponse.json({ success: true, data: { latestVersion: null, changedKeys: Object.keys(current || {}), summary: "无历史版本，当前将作为首个发布快照" } });
  }

  const latest = getHistoryDetail(latestVersion);
  const prev = (latest?.json || {}) as Record<string, any>;
  const curr = (current || {}) as Record<string, any>;

  const changedKeys = diffTopLevel(prev, curr);

  return NextResponse.json({
    success: true,
    data: {
      latestVersion,
      changedKeys,
      summary: changedKeys.length ? `检测到 ${changedKeys.length} 个顶层字段变化` : "与最近发布版本无差异",
    },
  });
}
