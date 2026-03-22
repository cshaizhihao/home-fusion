#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [,, siteLinksPath, socialLinksPath, outputPath = "./config/home-imsyy-migrated.json"] = process.argv;

if (!siteLinksPath || !socialLinksPath) {
  console.error("Usage: node scripts/import-imsyy-config.mjs <siteLinks.json> <socialLinks.json> [outputPath]");
  process.exit(1);
}

const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(p), "utf8"));
const siteLinks = readJson(siteLinksPath);
const socialLinks = readJson(socialLinksPath);

const iconMap = {
  Github: "github",
  Twitter: "twitter",
  Telegram: "telegram",
  Email: "email",
  QQ: "qq",
  BiliBili: "bilibili",
};

const configPatch = {
  name: "Fusion Home",
  description: "Merged from imsyy/home + kasuie/remio-home",
  links: socialLinks.map((item) => ({
    title: String(item.name || "link").toLowerCase(),
    color: "#ffffff",
    url: item.url || "",
    icon: iconMap[item.name] || item.icon || ""
  })),
  sites: siteLinks.map((item) => ({
    icon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f517.svg",
    title: item.name || "Untitled",
    url: item.link || "",
    desc: `Imported from imsyy/home (${item.icon || "custom"})`
  })),
  resources: {
    css: [],
    js: [],
    bodyHtml: ""
  }
};

const finalOut = path.resolve(outputPath);
fs.mkdirSync(path.dirname(finalOut), { recursive: true });
fs.writeFileSync(finalOut, JSON.stringify(configPatch, null, 2));
console.log(`✅ Migrated config written to: ${finalOut}`);
