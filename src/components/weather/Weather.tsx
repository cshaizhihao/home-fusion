"use client";
import { useEffect, useState } from "react";
import request from "@/lib/fetch";
import dynamic from "next/dynamic";

const SunFill = dynamic(async () => (await import("@kasuie/icon")).SunFill);
const CloudSun = dynamic(async () => (await import("@kasuie/icon")).CloudSun);
const CloudSunRain = dynamic(async () => (await import("@kasuie/icon")).CloudSunRain);
const CloudMoon = dynamic(async () => (await import("@kasuie/icon")).CloudMoon);

export const Weather = ({ size = 18 }: { size: number }) => {
  const [weatherInfo, setWeatherInfo] = useState<Record<string, string> | null>(null);

  const renderIcon = (weather: string) => {
    const props = { size, color: "#fff" };
    const hours = new Date().getHours();
    if (["多云"].includes(weather)) return hours < 19 && hours > 6 ? <CloudSun {...props} /> : <CloudMoon {...props} />;
    if (["雨"].includes(weather)) return <CloudSunRain {...props} />;
    return hours < 19 && hours > 6 ? <SunFill {...props} /> : <CloudMoon {...props} />;
  };

  useEffect(() => {
    request
      .get("/api/weather")
      .then((res) => {
        if (res.success && res.data) setWeatherInfo(res.data);
        else setWeatherInfo({ city: "天气", temperature: "--", weather: "未知" });
      })
      .catch(() => setWeatherInfo({ city: "天气", temperature: "--", weather: "未知" }));
  }, []);

  if (!weatherInfo) return null;

  return (
    <div style={{ backgroundColor: "rgba(var(--mio-main), 0.22)" }} className="home-widget home-widget-weather fixed left-4 top-16 z-20 flex min-w-[128px] select-none items-center justify-between gap-2 rounded-md px-2 py-1 backdrop-blur">
      <div className="flex items-center text-white">
        <span className="text-xs">{weatherInfo?.city?.replace("市", "") || "天气"}</span>
        <span>·</span>
        <span className="text-xs">
          {weatherInfo?.temperature || "--"}
          <sup>℃</sup>
        </span>
      </div>
      {renderIcon(weatherInfo?.weather || "未知")}
    </div>
  );
};
