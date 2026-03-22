"use client";

export function YearProgress() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  const current = now.getTime();
  const percent = Math.min(100, Math.max(0, ((current - start) / (end - start)) * 100));

  return (
    <div className="fixed bottom-4 left-1/2 z-10 w-[min(680px,92vw)] -translate-x-1/2 rounded-md bg-black/35 p-2 text-xs text-white backdrop-blur">
      <div className="mb-1 flex items-center justify-between opacity-90">
        <span>{now.getFullYear()} 时光进度</span>
        <span>{percent.toFixed(1)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-white/20">
        <div
          className="h-full rounded bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
