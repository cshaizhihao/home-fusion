"use client";

import Script from "next/script";

type MusicConfig = {
  api?: string;
  server?: string;
  type?: string;
  id?: string;
  autoplay?: boolean;
  loop?: string;
};

export const Player = ({ size = 18, musicConfig }: { size?: number; musicConfig?: MusicConfig }) => {
  const cfg = {
    api: musicConfig?.api || "https://api-meting.imsyy.top",
    server: musicConfig?.server || "netease",
    type: musicConfig?.type || "playlist",
    id: musicConfig?.id || "7452421335",
    autoplay: musicConfig?.autoplay ? "true" : "false",
    loop: musicConfig?.loop || "all",
  };

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js" strategy="afterInteractive" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css" />

      <div
        style={{
          backgroundColor: "rgba(var(--mio-main), 0.15)",
        }}
        className="fixed left-4 top-4 z-10 max-w-[340px] select-none rounded-md p-2 backdrop-blur"
      >
        {/** @ts-ignore */}
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
