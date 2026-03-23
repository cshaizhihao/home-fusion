"use client";

import { useMemo, useState } from "react";
import { Settings } from "@/components/settings/Settings";
import { AdminOpsPanel } from "@/components/admin/AdminOpsPanel";

export function AdminConsole({ config }: { config: any }) {
  const tabs = useMemo(
    () => [
      { key: "ops", label: "运维面板" },
      { key: "config", label: "配置编辑" },
    ],
    []
  );
  const [active, setActive] = useState<string>("ops");

  return (
    <div>
      <div className="sticky top-2 z-20 mb-4 flex flex-wrap gap-2 rounded-lg border border-cyan-300/20 bg-[#0b1220cc] p-2 backdrop-blur">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${
              active === t.key
                ? "bg-cyan-500/90 text-white shadow-[0_0_0_1px_rgba(255,255,255,.2)]"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "ops" ? <AdminOpsPanel /> : null}
      {active === "config" ? <Settings config={config} /> : null}
    </div>
  );
}
