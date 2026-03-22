export type ModulePresetKey = "personal" | "minimal" | "showcase";

export const MODULE_PRESETS: Record<
  ModulePresetKey,
  {
    label: string;
    modules: { weather: boolean; music: boolean; sliders: boolean };
    desc: string;
  }
> = {
  personal: {
    label: "Personal",
    modules: { weather: true, music: true, sliders: true },
    desc: "个人全功能模式：天气/音乐/技能全开",
  },
  minimal: {
    label: "Minimal",
    modules: { weather: false, music: false, sliders: false },
    desc: "极简展示：关闭扩展模块，保留核心信息",
  },
  showcase: {
    label: "Showcase",
    modules: { weather: true, music: false, sliders: true },
    desc: "演示模式：突出内容与技能，关闭背景音乐",
  },
};

export function isPresetKey(v: string): v is ModulePresetKey {
  return ["personal", "minimal", "showcase"].includes(v);
}
