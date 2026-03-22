"use client";

import { useEffect, useState } from "react";

type UpdateInfo = {
  repo: string;
  currentVersion: string;
  latestSha: string;
  latestTime: string | null;
  hasUpdate: boolean | null;
  upgradeCommand: string;
};

export function UpdateCenter() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UpdateInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/update", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleCopy = async () => {
    if (!data?.upgradeCommand) return;
    await navigator.clipboard.writeText(data.upgradeCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-14 z-20 rounded-md bg-black/40 px-3 py-1 text-xs text-white backdrop-blur hover:bg-black/60"
      >
        升级中心
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-white/20 bg-black/70 p-4 text-white backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">项目升级中心</h3>
              <button onClick={() => setOpen(false)} className="text-sm opacity-80 hover:opacity-100">✕</button>
            </div>

            {loading ? (
              <p className="text-sm opacity-80">正在获取更新信息...</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p>当前版本：<code>{data?.currentVersion || "unknown"}</code></p>
                <p>最新提交：<code>{data?.latestSha || "unknown"}</code></p>
                <p>
                  更新状态：
                  {data?.hasUpdate === true
                    ? "有可用更新"
                    : data?.hasUpdate === false
                    ? "已是最新"
                    : "未知（可手动升级）"}
                </p>
                {data?.latestTime && (
                  <p>最新时间：{new Date(data.latestTime).toLocaleString()}</p>
                )}

                <div className="mt-3 rounded-md bg-white/10 p-2 text-xs break-all">
                  {data?.upgradeCommand}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="rounded-md bg-white/20 px-3 py-1 text-xs hover:bg-white/30"
                  >
                    {copied ? "已复制" : "一键复制升级命令"}
                  </button>
                  <button
                    onClick={fetchInfo}
                    className="rounded-md bg-white/20 px-3 py-1 text-xs hover:bg-white/30"
                  >
                    刷新状态
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
