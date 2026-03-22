"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { version: string; mtime: string; file: string };
type Log = { type: string; at: string; version?: string; remark?: string };

type FilterType = "all" | "publish" | "save";

export function AdminOpsPanel() {
  const [history, setHistory] = useState<Item[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [logFilter, setLogFilter] = useState<FilterType>("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/history", { cache: "no-store" });
      const json = await res.json();
      if (json?.success) {
        setHistory(json.data.files || []);
        setLogs(json.data.logs || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publish = async () => {
    const remark = window.prompt("发布备注", "manual publish") || "manual publish";
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark }),
      });
      const json = await res.json();
      if (json?.success) {
        alert(`发布成功: ${json.data.version}`);
        await load();
      } else {
        alert(`发布失败: ${json?.message || "unknown"}`);
      }
    } finally {
      setPublishing(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (logFilter === "all") return logs;
    return logs.filter((l) => l.type === logFilter);
  }, [logs, logFilter]);

  const lastPublish = useMemo(
    () => logs.find((l) => l.type === "publish") || null,
    [logs]
  );

  return (
    <section className="mb-4 rounded border border-white/15 bg-white/5 p-4">
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Card title="发布版本数" value={String(history.length)} />
        <Card title="日志条数" value={String(logs.length)} />
        <Card
          title="最近发布"
          value={lastPublish?.version || "暂无"}
          sub={lastPublish?.at ? new Date(lastPublish.at).toLocaleString() : "-"}
        />
        <Card title="当前状态" value={publishing ? "发布中" : loading ? "加载中" : "空闲"} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">发布中心 / 版本记录 / 操作日志</h2>
        <div className="flex gap-2">
          <button
            onClick={publish}
            disabled={publishing}
            className="rounded bg-emerald-500/70 px-3 py-1 text-xs hover:bg-emerald-500 disabled:opacity-60"
          >
            {publishing ? "发布中..." : "一键发布"}
          </button>
          <button onClick={load} className="rounded bg-white/20 px-3 py-1 text-xs hover:bg-white/30">
            刷新
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold opacity-80">版本记录</p>
          <div className="max-h-52 overflow-auto rounded bg-black/30 p-2 text-xs">
            {history.length ? (
              history.map((v) => (
                <div key={v.version} className="mb-2 border-b border-white/10 pb-1 last:mb-0 last:border-0">
                  <div className="font-mono">{v.version}</div>
                  <div className="opacity-70">{new Date(v.mtime).toLocaleString()}</div>
                </div>
              ))
            ) : (
              <div className="opacity-70">暂无发布记录</div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold opacity-80">操作日志</p>
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value as FilterType)}
              className="rounded bg-white/10 px-2 py-1 text-xs"
            >
              <option value="all">全部</option>
              <option value="publish">仅发布</option>
              <option value="save">仅保存</option>
            </select>
          </div>
          <div className="max-h-52 overflow-auto rounded bg-black/30 p-2 text-xs">
            {filteredLogs.length ? (
              filteredLogs.map((l, idx) => (
                <div key={`${l.at}-${idx}`} className="mb-2 border-b border-white/10 pb-1 last:mb-0 last:border-0">
                  <div>
                    <span className="inline-block rounded bg-white/10 px-1 py-[1px] mr-1">{l.type}</span>
                    {l.version ? `· ${l.version}` : ""}
                  </div>
                  <div className="opacity-70">
                    {new Date(l.at).toLocaleString()} {l.remark ? `· ${l.remark}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <div className="opacity-70">暂无日志</div>
            )}
          </div>
        </div>
      </div>
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
