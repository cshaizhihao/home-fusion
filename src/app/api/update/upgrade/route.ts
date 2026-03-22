import { NextRequest, NextResponse } from "next/server";
import { exec } from "node:child_process";

export const revalidate = 0;

function runCommand(command: string): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    exec(command, { timeout: 1000 * 60 * 8 }, (error, stdout, stderr) => {
      const output = `${stdout || ""}\n${stderr || ""}`.trim();
      if (error) {
        resolve({ ok: false, output: output || error.message });
        return;
      }
      resolve({ ok: true, output: output || "ok" });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token || "";

    const requiredToken = process.env.UPGRADE_TOKEN || "";
    if (requiredToken && token !== requiredToken) {
      return NextResponse.json(
        { ok: false, message: "unauthorized: invalid upgrade token" },
        { status: 401 }
      );
    }

    const command =
      process.env.UPGRADE_COMMAND ||
      "curl -fsSL https://raw.githubusercontent.com/cshaizhihao/home-fusion/main/scripts/install-12379.sh | sudo bash";

    const inDocker = String(process.env.IS_DOCKER || "0") === "1";
    if (inDocker) {
      return NextResponse.json(
        {
          ok: false,
          mode: "ssh_required",
          message:
            "当前运行在容器环境，无法在容器内直接升级宿主机。请复制命令到服务器 SSH 执行。",
          command,
        },
        { status: 409 }
      );
    }

    const dryRun = String(process.env.UPGRADE_DRY_RUN || "0") === "1";
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        message: "dry-run enabled, command not executed",
        command,
      });
    }

    const { ok, output } = await runCommand(command);
    return NextResponse.json({ ok, mode: "server_upgrade", command, output });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "upgrade failed" },
      { status: 500 }
    );
  }
}
