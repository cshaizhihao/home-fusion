"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { version: string; mtime: string; file: string };
type Log = { type: string; at: string; version?: string; remark?: string };

type FilterType = "all" | "publish" | "save" | "rollback";

const REMARK_TEMPLATES = ["配置微调", "主题样式更新", "链接内容更新", "发布前备份"];
const PAGE_SIZE = 8;

export function AdminOpsPanel() {
  const [history, setHistory] = useState<Item[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [logFilter, setLogFilter] = useState<FilterType>("all");
  const [logPage, setLogPage] = useState(1);
  const [remarkDraft, setRemarkDraft] = useState(REMARK_TEMPLATES[0]);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; message: string; version?: string } | null>(null);
  const [rollbacking, setRollbacking] = useState(false);
  const [expandedLogKey, setExpandedLogKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ version: string; raw: string } | null>(null);
  const [diffInfo, setDiffInfo] = useState<{ latestVersion: string | null; changedKeys: string[]; summary: string } | null>(null);
  const [queueJobs, setQueueJobs] = useState<any[]>([]);
  const [healthItems, setHealthItems] = useState<any[]>([]);
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [moduleCheck, setModuleCheck] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [res1, res2, res3, res4, res5] = await Promise.all([
        fetch("/api/admin/history", { cache: "no-store" }),
        fetch("/api/admin/upgrade-queue", { cache: "no-store" }),
        fetch("/api/admin/health", { cache: "no-store" }),
        fetch("/api/admin/env", { cache: "no-store" }),
        fetch("/api/admin/modules/check", { cache: "no-store" }),
      ]);
      const json = await res1.json();
      if (json?.success) {
        setHistory(json.data.files || []);
        setLogs(json.data.logs || []);
      }
      const q = await res2.json();
      if (q?.success) setQueueJobs(q.data || []);
      const h = await res3.json();
      if (h?.success) setHealthItems(h.data || []);
      const e = await res4.json();
      if (e?.success) setEnvInfo(e.data || null);
      const m = await res5.json();
      if (m?.success) setModuleCheck(m.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publish = async () => {
    const remark = (remarkDraft || "manual publish").trim() || "manual publish";
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark }),
      });
      const json = await res.json();
      if (json?.success) {
        setPublishResult({ ok: true, message: "发布成功", version: json?.data?.version });
        await load();
      } else {
        setPublishResult({ ok: false, message: `发布失败: ${json?.message || "unknown"}` });
      }
    } catch (e: any) {
      setPublishResult({ ok: false, message: `发布失败: ${e?.message || "network error"}` });
    } finally {
      setPublishing(false);
    }
  };

  const openDetail = async (version: string) => {
    const res = await fetch(`/api/admin/history/${encodeURIComponent(version)}`, { cache: "no-store" });
    const json = await res.json();
    if (json?.success) {
      setDetail({ version, raw: json.data.raw });
    } else {
      alert(`加载版本详情失败: ${json?.message || "unknown"}`);
    }
  };

  const rollbackVersion = async (version: string) => {
    if (!window.confirm(`确认回滚到版本 ${version} ?`)) return;
    setRollbacking(true);
    try {
      const res = await fetch("/api/admin/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      const json = await res.json();
      if (json?.success) {
        setPublishResult({ ok: true, message: "回滚成功", version });
        setDetail(null);
        await load();
      } else {
        setPublishResult({ ok: false, message: `回滚失败: ${json?.message || "unknown"}`, version });
      }
    } finally {
      setRollbacking(false);
    }
  };

  const previewDiff = async () => {
    const res = await fetch("/api/admin/diff", { cache: "no-store" });
    const json = await res.json();
    if (json?.success) {
      setDiffInfo(json.data);
    } else {
      alert(`差异预览失败: ${json?.message || "unknown"}`);
    }
  };

  const enqueueUpgradeJob = async () => {
    const res = await fetch("/api/admin/upgrade-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enqueue" }),
    });
    const json = await res.json();
    if (!json?.success) alert(`入队失败: ${json?.message || "unknown"}`);
    await load();
  };

  const runNextJob = async () => {
    const res = await fetch("/api/admin/upgrade-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run-next" }),
    });
    const json = await res.json();
    if (!json?.success) alert(`执行失败: ${json?.message || "unknown"}`);
    await load();
  };

  const runHealth = async () => {
    const res = await fetch("/api/admin/health", { method: "POST" });
    const json = await res.json();
    if (!json?.success) alert(`健康检查失败: ${json?.message || "unknown"}`);
    await load();
  };

  const filteredLogs = useMemo(() => (logFilter === "all" ? logs : logs.filter((l) => l.type === logFilter)), [logs, logFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pagedLogs = useMemo(() => {
    const start = (logPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, logPage]);

  useEffect(() => setLogPage(1), [logFilter]);
  useEffect(() => {
    if (logPage > totalPages) setLogPage(totalPages);
  }, [totalPages, logPage]);

  const lastPublish = useMemo(() => logs.find((l) => l.type === "publish") || null, [logs]);

  return (
    <section className="mb-4 rounded border border-white/15 bg-white/5 p-4">
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Card title="发布版本数" value={String(history.length)} />
        <Card title="日志条数" value={String(logs.length)} />
        <Card title="最近发布" value={lastPublish?.version || "暂无"} sub={lastPublish?.at ? new Date(lastPublish.at).toLocaleString() : "-"} />
        <Card title="当前状态" value={publishing ? "发布中" : loading ? "加载中" : "空闲"} />
      </div>

      {envInfo && (
        <div className="mb-3 rounded border border-cyan-300/30 bg-cyan-100/10 p-2 text-xs">
          <div className="font-semibold">配置环境：{envInfo.profile}</div>
          <div className="opacity-80">配置文件：{envInfo.fileName}</div>
          <div className="opacity-70">支持环境：{(envInfo.supported || []).join(" / ")}</div>
        </div>
      )}

      {moduleCheck && (
        <div className={`mb-3 rounded border p-2 text-xs ${moduleCheck.healthy ? "border-emerald-300/30 bg-emerald-100/10" : "border-amber-300/30 bg-amber-100/10"}`}>
          <div className="font-semibold">模块依赖检查：{moduleCheck.healthy ? "通过" : "存在风险"}</div>
          {moduleCheck.warnings?.length ? (
            <ul className="mt-1 list-disc pl-4">
              {moduleCheck.warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : (
            <div className="opacity-80">未发现依赖风险</div>
          )}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">发布中心 / 版本记录 / 操作日志</h2>
        <div className="flex flex-wrap gap-2">
          <input value={remarkDraft} onChange={(e) => setRemarkDraft(e.target.value)} placeholder="发布备注" className="rounded bg-white/10 px-2 py-1 text-xs" />
          <button onClick={publish} disabled={publishing} className="rounded bg-emerald-500/70 px-3 py-1 text-xs hover:bg-emerald-500 disabled:opacity-60">
            {publishing ? "发布中..." : "一键发布"}
          </button>
          <button onClick={previewDiff} className="rounded bg-amber-500/70 px-3 py-1 text-xs hover:bg-amber-500">发布前差异预览</button>
          <a href="/api/admin/logs/export" className="rounded bg-white/20 px-3 py-1 text-xs hover:bg-white/30">导出日志</a>
          <button onClick={load} className="rounded bg-white/20 px-3 py-1 text-xs hover:bg-white/30">刷新</button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {REMARK_TEMPLATES.map((tpl) => (
          <button key={tpl} onClick={() => setRemarkDraft(tpl)} className={`rounded px-2 py-1 ${remarkDraft === tpl ? "bg-indigo-500/70" : "bg-white/10 hover:bg-white/20"}`}>
            {tpl}
          </button>
        ))}
      </div>

      {diffInfo && (
        <div className="mb-3 rounded border border-amber-300/30 bg-amber-100/10 p-2 text-xs">
          <div className="font-semibold">差异预览：{diffInfo.summary}</div>
          <div className="opacity-80">对比基线：{diffInfo.latestVersion || "无"}</div>
          <div className="mt-1 break-all">变更字段：{diffInfo.changedKeys?.length ? diffInfo.changedKeys.join(", ") : "无"}</div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold opacity-80">版本记录（点击查看详情）</p>
          <div className="max-h-52 overflow-auto rounded bg-black/30 p-2 text-xs">
            {history.length ? history.map((v) => (
              <button key={v.version} onClick={() => openDetail(v.version)} className="mb-2 block w-full border-b border-white/10 pb-1 text-left last:mb-0 last:border-0 hover:bg-white/5">
                <div className="font-mono">{v.version}</div>
                <div className="opacity-70">{new Date(v.mtime).toLocaleString()}</div>
              </button>
            )) : <div className="opacity-70">暂无发布记录</div>}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold opacity-80">操作日志</p>
            <select value={logFilter} onChange={(e) => setLogFilter(e.target.value as FilterType)} className="rounded bg-white/10 px-2 py-1 text-xs">
              <option value="all">全部</option>
              <option value="publish">仅发布</option>
              <option value="save">仅保存</option>
              <option value="rollback">仅回滚</option>
            </select>
          </div>
          <div className="max-h-52 overflow-auto rounded bg-black/30 p-2 text-xs">
            {pagedLogs.length ? pagedLogs.map((l, idx) => {
              const key = `${l.at}-${idx}`;
              const expanded = expandedLogKey === key;
              return (
                <div key={key} className="mb-2 border-b border-white/10 pb-1 last:mb-0 last:border-0">
                  <button onClick={() => setExpandedLogKey(expanded ? null : key)} className="w-full text-left">
                    <div>
                      <span className="inline-block rounded bg-white/10 px-1 py-[1px] mr-1">{l.type}</span>
                      {l.version ? `· ${l.version}` : ""}
                    </div>
                    <div className="opacity-70">{new Date(l.at).toLocaleString()}</div>
                  </button>
                  {expanded && (
                    <div className="mt-1 rounded bg-white/5 p-2 opacity-90">
                      <div>remark: {l.remark || "-"}</div>
                      <div>at: {l.at}</div>
                    </div>
                  )}
                </div>
              );
            }) : <div className="opacity-70">暂无日志</div>}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs opacity-80">
            <span>第 {logPage}/{totalPages} 页</span>
            <div className="flex gap-2">
              <button disabled={logPage <= 1} onClick={() => setLogPage((p) => Math.max(1, p - 1))} className="rounded bg-white/10 px-2 py-1 disabled:opacity-40">上一页</button>
              <button disabled={logPage >= totalPages} onClick={() => setLogPage((p) => Math.min(totalPages, p + 1))} className="rounded bg-white/10 px-2 py-1 disabled:opacity-40">下一页</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded border border-white/15 bg-black/30 p-3 text-xs">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold">升级任务队列（v0.5 MVP）</div>
          <div className="flex gap-2">
            <button onClick={enqueueUpgradeJob} className="rounded bg-indigo-500/70 px-2 py-1 hover:bg-indigo-500">添加升级任务</button>
            <button onClick={runNextJob} className="rounded bg-emerald-500/70 px-2 py-1 hover:bg-emerald-500">执行下一个</button>
          </div>
        </div>
        <div className="max-h-40 overflow-auto rounded bg-black/40 p-2">
          {queueJobs.length ? queueJobs.map((j) => (
            <div key={j.id} className="mb-2 border-b border-white/10 pb-1 last:mb-0 last:border-0">
              <div>ID {j.id} · {j.status}</div>
              <div className="opacity-70">{new Date(j.createdAt).toLocaleString()}</div>
              {j.output ? <div className="mt-1 opacity-80 line-clamp-2">{j.output}</div> : null}
            </div>
          )) : <div className="opacity-70">暂无任务</div>}
        </div>
      </div>

      <div className="mt-4 rounded border border-white/15 bg-black/30 p-3 text-xs">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold">健康检查（v0.5 基础告警）</div>
          <button onClick={runHealth} className="rounded bg-amber-500/70 px-2 py-1 hover:bg-amber-500">执行健康检查</button>
        </div>
        <div className="max-h-32 overflow-auto rounded bg-black/40 p-2">
          {healthItems.length ? healthItems.map((h, idx) => (
            <div key={`${h.at}-${idx}`} className="mb-2 border-b border-white/10 pb-1 last:mb-0 last:border-0">
              <div className={h.status === "ok" ? "text-emerald-300" : "text-red-300"}>{h.status.toUpperCase()} · {new Date(h.at).toLocaleString()}</div>
              <div className="opacity-80">{h.message}</div>
            </div>
          )) : <div className="opacity-70">暂无健康记录</div>}
        </div>
      </div>

      {publishResult && (
        <div className="mt-4 rounded border border-white/15 bg-black/30 p-3 text-xs">
          <div className={`font-semibold ${publishResult.ok ? "text-emerald-300" : "text-red-300"}`}>{publishResult.ok ? "发布成功" : "发布失败"}</div>
          <div className="mt-1 opacity-90">{publishResult.message}</div>
          {publishResult.version ? <div className="mt-1 font-mono">版本：{publishResult.version}</div> : null}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-3xl rounded border border-white/20 bg-[#111] p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">版本详情：{detail.version}</h3>
              <div className="flex gap-2">
                <button
                  className="rounded bg-red-500/70 px-2 py-1 text-xs hover:bg-red-500 disabled:opacity-50"
                  onClick={() => rollbackVersion(detail.version)}
                  disabled={rollbacking}
                >
                  {rollbacking ? "回滚中..." : "回滚到此版本"}
                </button>
                <button className="rounded bg-white/10 px-2 py-1 text-xs" onClick={() => setDetail(null)}>关闭</button>
              </div>
            </div>
            <pre className="max-h-[60vh] overflow-auto rounded bg-black/40 p-2 text-xs text-green-200">{detail.raw}</pre>
          </div>
        </div>
      )}
    </section>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/20 p-2">
      <div className="text-[11px] opacity-70">{title}</div>
      <div className="mt-1 text-sm font-semibold truncate">{value}</div>
      {sub ? <div className="mt-1 text-[11px] opacity-60 truncate">{sub}</div> : null}
    </div>
  );
}
