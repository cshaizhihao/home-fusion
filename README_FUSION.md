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
  - 自动识别升级模式：`服务端直升` 或 `SSH 执行`
  - 在容器环境下会禁用直升按钮并给出 SSH 命令，避免误报失败
  - 安装脚本优先拉取 GHCR 预构建镜像（极速升级），失败再回退本地构建
  - 版本展示采用 `Vol.xx.xx` + commit 短哈希

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

## 迭代路线（固定）

- [ ] v0.3.x：升级中心完善 + imsyy 音乐/时光进度条
- [x] v0.4.x（MVP 起步）：`/admin` 控制台入口 + 鉴权后编辑
- [ ] v0.5.x：运维能力（任务队列 / 回滚 / 健康检查）

### v0.5.x 最新进展（MVP）

- `/admin` 新增升级任务队列面板：
  - 添加升级任务
  - 执行下一个任务
  - 查看任务状态与输出（pending/running/success/failed）
- `/admin` 新增一键回滚：
  - 在版本详情弹窗可直接“回滚到此版本”
  - 记录 rollback 日志
- `/admin` 新增健康检查基础版：
  - 手动执行健康检查
  - 展示健康历史与告警状态（ok/warn）

### v0.4.x 最新进展

- `/admin` 已支持：
  - 一键发布（生成配置快照版本）
  - 版本记录列表
  - 操作日志列表（save/publish）
  - Dashboard 概览卡片（发布数/日志数/最近发布/当前状态）
  - 操作日志筛选（全部/仅发布/仅保存）
  - 操作日志分页（上一页/下一页）
  - 发布备注模板 + 发布结果详情
  - 发布版本详情查看（点击版本记录弹出配置快照）
  - 单条日志展开查看详情
  - 操作日志导出（admin-ops.log）
  - 发布前差异预览（与最近发布版本对比）
- [ ] v0.6.x：强融合版（多主题 / 插件化 / 多环境）

### v0.6.x 最新进展（起步）

- 多主题引擎基础版：
  - `globalStyle.fusionTheme` 支持 `remio | imsyy`
  - 根据主题切换全局视觉风格（卡片圆角 / 阴影）
- 组件插件化开关（第一版）：
  - 新增 `modules.weather / modules.music / modules.sliders`
  - 后台支持模块开关配置
  - 主页会按模块开关控制天气、背景音频、技能模块
- 多环境配置基础版：
  - 支持 `CONFIG_PROFILE=dev|staging|prod`
  - 对应配置文件：`config.dev.json / config.staging.json / config.json`
  - `/admin` 可查看当前环境与配置文件
- 插件化第二版：
  - 新增模块依赖检查接口：`/api/admin/modules/check`
  - `/admin` 显示模块依赖风险（天气/音乐/技能）
  - 保存配置时执行开关联动约束（关闭模块自动收敛相关配置）
