"use client";

import { useEffect, useState } from "react";

type Item = { version: string; mtime: string; file: string };

type Log = { type: string; at: string; version?: string; remark?: string };

export function AdminOpsPanel() {
  const [history, setHistory] = useState<Item[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

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
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remark }),
    });
    const json = await res.json();
    if (json?.success) {
      alert(`发布成功: ${json.data.version}`);
      load();
    } else {
      alert(`发布失败: ${json?.message || "unknown"}`);
    }
  };

  return (
    <section className="mb-4 rounded border border-white/15 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">发布中心 / 版本记录 / 操作日志</h2>
        <div className="flex gap-2">
          <button onClick={publish} className="rounded bg-emerald-500/70 px-3 py-1 text-xs hover:bg-emerald-500">一键发布</button>
          <button onClick={load} className="rounded bg-white/20 px-3 py-1 text-xs hover:bg-white/30">刷新</button>
        </div>
      </div>

      {loading ? <p className="text-xs opacity-70">加载中...</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold opacity-80">版本记录</p>
          <div className="max-h-52 overflow-auto rounded bg-black/30 p-2 text-xs">
            {history.length ? history.map((v) => (
              <div key={v.version} className="mb-2 border-b border-white/10 pb-1 last:mb-0 last:border-0">
                <div className="font-mono">{v.version}</div>
                <div className="opacity-70">{new Date(v.mtime).toLocaleString()}</div>
              </div>
            )) : <div className="opacity-70">暂无发布记录</div>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold opacity-80">操作日志</p>
          <div className="max-h-52 overflow-auto rounded bg-black/30 p-2 text-xs">
            {logs.length ? logs.map((l, idx) => (
              <div key={`${l.at}-${idx}`} className="mb-2 border-b border-white/10 pb-1 last:mb-0 last:border-0">
                <div>{l.type} {l.version ? `· ${l.version}` : ""}</div>
                <div className="opacity-70">{new Date(l.at).toLocaleString()} {l.remark ? `· ${l.remark}` : ""}</div>
              </div>
            )) : <div className="opacity-70">暂无日志</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
