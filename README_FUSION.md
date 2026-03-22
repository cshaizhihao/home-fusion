# Home Fusion（融合版说明）

## 项目定位

`home-fusion` = `imsyy/home` + `kasuie/remio-home`

- 保留 `imsyy/home` 的轻量视觉与主页表达
- 采用 `remio-home` 的 Next.js SSR + 配置化 + 在线编辑能力

## 为什么先用 remio-home 做底座

1. **架构更稳**：Next.js 14，SSR/SEO 更好
2. **配置能力强**：支持在线编辑 + 文件配置 +（可选）PostgreSQL持久化
3. **部署路线成熟**：Docker / Vercel 都可用

## 已落地内容（v0.2.0）

- 新增配置迁移脚本：`scripts/import-imsyy-config.mjs`
  - 输入：`siteLinks.json` + `socialLinks.json`
  - 输出：`config/home-imsyy-migrated.json`
- 新增一键部署脚本：`scripts/install-12379.sh`
  - 固定部署端口 `12379`
- 新增主页右上角【升级中心】按钮
  - 可查看当前版本 / 最新提交 / 是否有更新
  - 支持“一键升级（服务端执行）” + 复制命令

### 升级中心环境变量

- `UPGRADE_TOKEN`：升级令牌（建议设置，避免未授权触发）
- `UPGRADE_COMMAND`：实际执行的升级命令（可覆盖默认命令）
- `UPGRADE_DRY_RUN=1`：调试模式，只返回命令不执行

## 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/cshaizhihao/home-fusion/main/scripts/install-12379.sh | sudo bash
```

## 迁移命令

```bash
node scripts/import-imsyy-config.mjs \
  /path/to/siteLinks.json \
  /path/to/socialLinks.json \
  ./config/home-imsyy-migrated.json
```

## 下一步融合计划

- [ ] 接入 imsyy 的 APlayer/Meting 组件
- [ ] 增加“时光进度条”组件
- [ ] 增强图标映射（imsyy icon -> remio icon）
- [ ] 增加主题包（imsyy-style / remio-style 可切换）
