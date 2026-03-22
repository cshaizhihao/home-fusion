import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { exec } from "child_process";

const CONFIG_DIR = process.env.CONFIG_DIR
  ? process.env.CONFIG_DIR
  : join(process.cwd(), "src", "config");
const ADMIN_DIR = join(CONFIG_DIR, ".admin");
const QUEUE_FILE = join(ADMIN_DIR, "upgrade-jobs.json");

export type UpgradeJob = {
  id: string;
  createdAt: string;
  status: "pending" | "running" | "success" | "failed";
  command: string;
  output?: string;
  finishedAt?: string;
  attempts?: number;
  maxAttempts?: number;
  errorType?: "network" | "permission" | "timeout" | "unknown";
};

function ensureDir() {
  if (!existsSync(ADMIN_DIR)) mkdirSync(ADMIN_DIR, { recursive: true });
}

function readJobs(): UpgradeJob[] {
  ensureDir();
  if (!existsSync(QUEUE_FILE)) return [];
  try {
    return JSON.parse(readFileSync(QUEUE_FILE, "utf8")) || [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: UpgradeJob[]) {
  ensureDir();
  writeFileSync(QUEUE_FILE, JSON.stringify(jobs, null, 2), "utf8");
}

function classifyError(output: string): UpgradeJob["errorType"] {
  const s = (output || "").toLowerCase();
  if (s.includes("timed out") || s.includes("timeout")) return "timeout";
  if (s.includes("permission denied") || s.includes("unauthorized") || s.includes("sudo")) return "permission";
  if (s.includes("connection") || s.includes("network") || s.includes("could not resolve") || s.includes("tls")) return "network";
  return "unknown";
}

export function listUpgradeJobs(limit = 30) {
  return readJobs().slice(-limit).reverse();
}

export function enqueueUpgrade(command: string) {
  const jobs = readJobs();
  const job: UpgradeJob = {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    command,
    attempts: 0,
    maxAttempts: 2,
  };
  jobs.push(job);
  writeJobs(jobs);
  return job;
}

export async function runNextUpgradeJob() {
  const jobs = readJobs();
  const index = jobs.findIndex((j) => j.status === "pending");
  if (index < 0) return null;

  jobs[index].status = "running";
  jobs[index].attempts = (jobs[index].attempts || 0) + 1;
  writeJobs(jobs);

  const job = jobs[index];
  const result = await new Promise<{ ok: boolean; output: string }>((resolve) => {
    exec(job.command, { timeout: 1000 * 60 * 15 }, (error, stdout, stderr) => {
      const output = `${stdout || ""}\n${stderr || ""}`.trim();
      if (error) resolve({ ok: false, output: output || error.message });
      else resolve({ ok: true, output: output || "ok" });
    });
  });

  const latest = readJobs();
  const i = latest.findIndex((j) => j.id === job.id);
  if (i >= 0) {
    const attempts = latest[i].attempts || 1;
    const maxAttempts = latest[i].maxAttempts || 2;

    if (result.ok) {
      latest[i].status = "success";
    } else if (attempts < maxAttempts) {
      latest[i].status = "pending"; // 自动重试
    } else {
      latest[i].status = "failed";
    }

    latest[i].errorType = result.ok ? undefined : classifyError(result.output);
    latest[i].output = result.output.slice(0, 4000);
    latest[i].finishedAt = new Date().toISOString();
    writeJobs(latest);
    return latest[i];
  }
  return null;
}
