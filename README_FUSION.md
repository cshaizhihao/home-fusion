# Home Fusion（融合版说明）

## 仓库链接

- Fusion 主仓库：https://github.com/cshaizhihao/home-fusion
- 上游 A（imsyy/home）：https://github.com/imsyy/home
- 上游 B（remio-home）：https://github.com/kasuie/remio-home

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

- [x] v0.3.x：升级中心完善 + imsyy 音乐/时光进度条
- [x] v0.4.x（MVP 起步）：`/admin` 控制台入口 + 鉴权后编辑
- [x] v0.5.x：运维能力（任务队列 / 回滚 / 健康检查）

### v0.3.x 最新进展（已完成）

- 升级中心完善（模式识别/Vol 版本/快速升级链路）
- imsyy 风格音乐组件（Meting/APlayer）已接入，可通过模块开关控制
- 时光进度条组件已接入，可通过模块开关控制

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
- [~] v0.6.x：强融合版（多主题 / 插件化 / 多环境）

### v0.6.x 最新进展（进行中）

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
- 插件化第三版（收官）：
  - 模块预设一键切换：`Personal / Minimal / Showcase`
  - 新增接口：`/api/admin/modules/preset`
  - `/admin` 可直接应用预设并刷新校验结果

### 控制台体验打磨（持续）

- `/admin` 信息架构升级为 Tab 结构：
  - 运维面板（发布/升级队列/回滚/健康）
  - 配置编辑（原 Settings）
- 运维面板进一步分组导航：
  - 发布与日志 / 升级队列 / 健康检查 / 模块与预设
- 高风险动作防误触：
  - 发布 / 回滚 / 升级执行 均增加二次确认
  - 增加动作冷却（防连点重复触发）
- 后台可读性与操作逻辑优化：
  - 提升配置编辑页对比度（输入、标签、背景）
  - 配置分组搜索、未保存状态提示、底部固定操作栏（重置/保存）
- 前台节奏（P1-P3）已落地第一版：
  - 浮层布局系统（升级中心/天气/音乐/时光进度条）避免互相遮挡
  - 首屏容器宽度与留白重排，提升信息结构清晰度
  - 移动端浮层自动避让与自适应尺寸
- CI 可视化增强：
  - `/admin` 直接展示 GHCR 工作流最近 5 次构建状态
  - 点击可跳转 GitHub Actions 详情
- 升级队列增强：
  - 失败自动重试（最多 2 次）
  - 失败原因分类（network/permission/timeout/unknown）
