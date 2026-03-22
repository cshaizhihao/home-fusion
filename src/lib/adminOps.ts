import { createHash } from "crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { CONFIG_DIR } from "@/lib/config";

const ADMIN_DIR = join(CONFIG_DIR, ".admin");
const HISTORY_DIR = join(ADMIN_DIR, "history");
const LOG_FILE = join(ADMIN_DIR, "ops.log");

function ensureAdminDirs() {
  if (!existsSync(ADMIN_DIR)) mkdirSync(ADMIN_DIR, { recursive: true });
  if (!existsSync(HISTORY_DIR)) mkdirSync(HISTORY_DIR, { recursive: true });
}

export function createPublishSnapshot(config: any, remark = "") {
  ensureAdminDirs();
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-");
  const raw = JSON.stringify(config, null, 2);
  const hash = createHash("sha1").update(raw).digest("hex").slice(0, 8);
  const version = `${ts}_${hash}`;
  const file = join(HISTORY_DIR, `${version}.json`);
  writeFileSync(file, raw, "utf8");

  appendOpLog({
    type: "publish",
    version,
    remark,
    at: now.toISOString(),
  });

  return { version, file };
}

export function appendOpLog(data: Record<string, any>) {
  ensureAdminDirs();
  const line = JSON.stringify(data) + "\n";
  writeFileSync(LOG_FILE, (existsSync(LOG_FILE) ? readFileSync(LOG_FILE, "utf8") : "") + line, "utf8");
}

export function listHistory(limit = 20) {
  ensureAdminDirs();
  const files = readdirSync(HISTORY_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const p = join(HISTORY_DIR, f);
      const stat = statSync(p);
      return { file: f, version: f.replace(/\.json$/, ""), mtime: stat.mtime.toISOString() };
    })
    .sort((a, b) => (a.mtime < b.mtime ? 1 : -1))
    .slice(0, limit);

  const logs = existsSync(LOG_FILE)
    ? readFileSync(LOG_FILE, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .slice(-limit)
        .reverse()
    : [];

  return { files, logs };
}
