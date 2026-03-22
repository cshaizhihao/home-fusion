import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";

export const revalidate = 0;

const REPO = "cshaizhihao/home-fusion";
const WORKFLOW = "ghcr.yml";

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        next: { revalidate: 60 },
      }
    );

    const json = await res.json();
    const runs = (json?.workflow_runs || []).map((r: any) => ({
      id: r.id,
      title: r.display_title,
      status: r.status,
      conclusion: r.conclusion,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      url: r.html_url,
      branch: r.head_branch,
      sha: String(r.head_sha || "").slice(0, 7),
    }));

    return NextResponse.json({ success: true, data: { runs } });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "fetch ci status failed" }, { status: 500 });
  }
}
