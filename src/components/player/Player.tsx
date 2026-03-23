"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

type MusicConfig = {
  api?: string;
  server?: string;
  type?: string;
  id?: string;
  autoplay?: boolean;
  loop?: string;
};

export const Player = ({ musicConfig }: { size?: number; musicConfig?: MusicConfig }) => {
  const [metingReady, setMetingReady] = useState(false);

  const cfg = {
    api: musicConfig?.api || "https://api-meting.imsyy.top",
    server: musicConfig?.server || "netease",
    type: musicConfig?.type || "playlist",
    id: musicConfig?.id || "7452421335",
    autoplay: musicConfig?.autoplay ? "true" : "false",
    loop: musicConfig?.loop || "all",
  };

  useEffect(() => {
    const t = setTimeout(() => {
      const ok = typeof window !== "undefined" && !!(window as any).customElements?.get("meting-js");
      setMetingReady(ok);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js" strategy="afterInteractive" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css" />

      <div
        style={{ backgroundColor: "rgba(var(--mio-main), 0.22)" }}
        className="home-widget home-widget-player fixed right-4 bottom-16 z-20 w-[320px] max-w-[90vw] select-none rounded-md p-2 text-white backdrop-blur"
      >
        <div className="mb-1 text-xs font-semibold">音乐模块</div>
        {!metingReady && (
          <div className="mb-2 text-[11px] text-white/80">
            正在加载播放器资源... 若长时间无内容，请在后台检查网络/CDN访问。
          </div>
        )}
        {/* @ts-ignore */}
        <meting-js
          server={cfg.server}
          type={cfg.type}
          id={cfg.id}
          api={cfg.api}
          autoplay={cfg.autoplay}
          loop={cfg.loop}
          fixed="false"
          list-folded="true"
          theme="#0dbf56"
        />
      </div>
    </>
  );
};
