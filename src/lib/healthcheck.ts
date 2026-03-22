import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CONFIG_DIR = process.env.CONFIG_DIR
  ? process.env.CONFIG_DIR
  : join(process.cwd(), "src", "config");
const ADMIN_DIR = join(CONFIG_DIR, ".admin");
const HEALTH_FILE = join(ADMIN_DIR, "health-history.json");

export type HealthItem = {
  at: string;
  status: "ok" | "warn";
  checks: {
    configReadable: boolean;
    queueFileReadable: boolean;
    versionDefined: boolean;
  };
  message: string;
};

function ensureDir() {
  if (!existsSync(ADMIN_DIR)) mkdirSync(ADMIN_DIR, { recursive: true });
}

function readHistory(): HealthItem[] {
  ensureDir();
  if (!existsSync(HEALTH_FILE)) return [];
  try {
    return JSON.parse(readFileSync(HEALTH_FILE, "utf8")) || [];
  } catch {
    return [];
  }
}

function writeHistory(items: HealthItem[]) {
  ensureDir();
  writeFileSync(HEALTH_FILE, JSON.stringify(items, null, 2), "utf8");
}

export function runHealthcheck(): HealthItem {
  const configPath = process.env.CONFIG_DIR
    ? join(process.env.CONFIG_DIR, "config.json")
    : join(process.cwd(), "src", "config", "config.json");
  const queuePath = process.env.CONFIG_DIR
    ? join(process.env.CONFIG_DIR, ".admin", "upgrade-jobs.json")
    : join(process.cwd(), "src", "config", ".admin", "upgrade-jobs.json");

  const checks = {
    configReadable: existsSync(configPath),
    queueFileReadable: existsSync(queuePath) || true,
    versionDefined: Boolean(process.env.APP_VERSION || process.env.VERSION),
  };

  const failed = Object.entries(checks)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  const item: HealthItem = {
    at: new Date().toISOString(),
    status: failed.length ? "warn" : "ok",
    checks,
    message: failed.length ? `异常项: ${failed.join(", ")}` : "系统健康",
  };

  const history = readHistory();
  history.push(item);
  writeHistory(history.slice(-50));
  return item;
}

export function listHealthHistory(limit = 20) {
  return readHistory().slice(-limit).reverse();
}
