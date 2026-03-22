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
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`rounded px-3 py-1 text-xs transition ${
              active === t.key
                ? "bg-cyan-500/80 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/20"
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
