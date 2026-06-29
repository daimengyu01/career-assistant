# CareerAssistant 项目总结

> 大学生求职辅助桌面软件 | 项目总结文档
> 生成时间：2026-06-29

---

## 📋 项目概述

**CareerAssistant** 是一款面向大学生的开源求职辅助桌面软件，帮助用户更好地了解自己、评估企业、找到适合的职业发展方向。

### 核心定位
- 个人职业性格/兴趣测评
- 企业信息管理与稳定性评估
- 基于 AI 的智能职业推荐
- 支持自定义数据源接入

---

## ✅ 已实现功能清单

### 1. 个人评估模块
- ✅ MBTI 28题精简问卷
- ✅ 五大人格测试（OCEAN模型）
- ✅ 霍兰德职业兴趣测试（RIASEC）
- ✅ 评估结果可视化
- ✅ AI 洞察报告生成

### 2. 企业评估模块
- ✅ 公司信息手动录入
- ✅ 公司列表展示与筛选
- ✅ 公司详情页面
- ✅ 稳定性评分算法
- ✅ 晋升清晰度评估
- ✅ 公司类型标签系统

### 3. 智能推荐模块
- ✅ 多维加权匹配算法
- ✅ 匹配度评分卡片
- ✅ 职业路径可视化
- ✅ 风险与机会分析
- ✅ AI 推荐理由生成

### 4. AI 集成
- ✅ DeepSeek Provider 实现
- ✅ OpenAI Provider 实现
- ✅ AI Provider 抽象基类
- ✅ 4套内置 Prompt 模板：
  - personal_assessment.json
  - company_evaluation.json
  - career_recommendation.json
  - risk_analysis.json
- ✅ AI 客户端统一调用入口
- ✅ API Key 本地加密存储

### 5. 数据管理
- ✅ JSON 格式批量导入
- ✅ CSV 格式批量导入
- ✅ 自定义 API 配置
- ✅ 数据源管理 UI
- ✅ 本地 SQLite 数据库
- ✅ 数据持久化

### 6. 系统设置
- ✅ API Key 配置页面
- ✅ AI 提供商/模型选择
- ✅ 爬虫配置管理
- ✅ 数据源列表管理

### 7. 前端界面
- ✅ Mantine 7 UI 组件库
- ✅ 响应式布局
- ✅ 路由导航（React Router 6）
- ✅ 状态管理（Zustand）
- ✅ 加载状态与错误处理
- ✅ 16个前端组件

---

## 🛠 技术栈

| 层级 | 技术选型 |
|------|----------|
| 桌面框架 | Electron 33.4.11 |
| 构建工具 | electron-vite 2.3.0 + Vite 5.4.11 |
| 前端框架 | React 19.1.0 |
| 语言 | TypeScript 5.8.3 |
| UI 组件 | Mantine 7.17.5 + Tabler Icons |
| 状态管理 | Zustand 5.0.5 |
| 路由 | React Router 7.6.0 |
| 数据库 | SQLite (sql.js 1.10.3) |
| 加密存储 | electron-store 8.2.0 |
| HTTP 客户端 | Axios 1.9.0 |
| 表单验证 | Zod 3.25.28 |

---

## 📁 项目结构

```
career-assistant/
├── electron/                      # Electron 主进程
│   ├── main/
│   │   ├── index.ts              # 主进程入口
│   │   ├── db/
│   │   │   └── index.ts          # SQLite 数据库初始化
│   │   ├── ipc/
│   │   │   ├── assessment.ts     # 评估 IPC 处理
│   │   │   ├── company.ts        # 企业 IPC 处理
│   │   │   ├── crawler.ts        # 爬虫 IPC 处理
│   │   │   └── settings.ts       # 设置 IPC 处理
│   │   └── schema.sql            # 数据库 Schema
│   └── preload/
│       └── index.ts              # 预加载脚本（contextBridge）
│
├── src/                           # 渲染进程（React）
│   ├── components/
│   │   ├── assessment/
│   │   │   ├── PersonalAssessment.tsx
│   │   │   ├── MBTIQuestionnaire.tsx
│   │   │   ├── InterestSurvey.tsx
│   │   │   └── AssessmentResult.tsx
│   │   ├── company/
│   │   │   ├── CompanyForm.tsx
│   │   │   ├── CompanyList.tsx
│   │   │   └── CompanyDetail.tsx
│   │   ├── recommendation/
│   │   │   ├── RecommendationList.tsx
│   │   │   ├── MatchScoreCard.tsx
│   │   │   └── CareerPathVisualization.tsx
│   │   ├── settings/
│   │   │   ├── ApiKeySettings.tsx
│   │   │   ├── CrawlerConfig.tsx
│   │   │   └── DataSourceManager.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Loading.tsx
│   ├── stores/
│   │   ├── useUserStore.ts
│   │   ├── useCompanyStore.ts
│   │   ├── useAssessmentStore.ts
│   │   └── useSettingsStore.ts
│   ├── services/
│   │   ├── ai/
│   │   │   ├── AiProvider.ts
│   │   │   ├── AiClient.ts
│   │   │   ├── DeepSeekProvider.ts
│   │   │   ├── OpenAIProvider.ts
│   │   │   └── PromptTemplates.ts
│   │   ├── crawler/
│   │   │   ├── types.ts
│   │   │   ├── CrawlerEngine.ts
│   │   │   ├── ConfigParser.ts
│   │   │   └── BuiltinStrategies.ts
│   │   ├── db/
│   │   │   ├── queries.ts
│   │   │   ├── migrations.ts
│   │   │   └── schema.ts
│   │   └── assessment/
│   │       ├── MBTICalculator.ts
│   │       ├── PersonalityAnalyzer.ts
│   │       └── CareerMatcher.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── company.ts
│   │   ├── assessment.ts
│   │   └── crawler.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── App.tsx
│   └── main.tsx
│
├── public/                        # 静态资源
│   ├── crawler-examples/
│   │   ├── boss直聘.json
│   │   └── 实习僧.json
│   └── prompts/
│       ├── personal_assessment.json
│       ├── company_evaluation.json
│       ├── career_recommendation.json
│       └── risk_analysis.json
│
├── docs/                          # 文档
│   ├── crawler-guide.md
│   ├── ai-integration.md
│   └── contributing.md
│
├── out/                           # 构建输出
│   ├── main/
│   │   └── index.js
│   ├── preload/
│   │   └── index.js
│   └── main/
│       └── sql-wasm.wasm
│
├── dist-electron/                 # 前端构建输出
│   ├── index.html
│   └── assets/
│       ├── index-*.js
│       └── index-*.css
│
├── dist_electron/                 # Electron 打包输出
│   └── win-unpacked/
│       ├── CareerAssistant.exe    # ✅ 可运行 exe
│       └── ...
│
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
├── vite.config.ts
├── 启动.bat                       # 一键启动脚本
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

---

## 🚀 运行方式

### 方式一：一键启动（推荐）
```bash
双击运行：启动.bat
```

### 方式二：开发模式
```powershell
cd "C:\Users\代梦余\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a41b8987407692186d68289\career-assistant"
npm run dev
```

### 方式三：生产模式
```powershell
cd "C:\Users\代梦余\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a41b8987407692186d68289\career-assistant"
$env:NODE_ENV='production'
npx electron out/main/index.js
```

### 方式四：直接运行 EXE
```
C:\Users\代梦余\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a41b8987407692186d68289\career-assistant\dist_electron\win-unpacked\CareerAssistant.exe
```

---

## 📦 打包状态

### ✅ 已完成
- `dist_electron/win-unpacked/CareerAssistant.exe` 已生成（约 180MB）
- 该 exe 可直接运行，无需安装

### ⚠️ 安装包生成失败原因
- electron-builder 需要从 GitHub 下载 `winCodeSign-2.6.0.7z`
- 虽然网络已恢复，但该资源连接超时
- 解压时遇到权限问题（无法创建 symbolic link）
- **不影响 win-unpacked 可执行文件的运行**

### 🔧 安装包解决方案（需手动处理）
1. 以管理员身份运行 PowerShell
2. 执行打包命令：
   ```powershell
   cd "项目路径"
   $env:CSC_IDENTITY_AUTO_DISCOVERY='false'
   $env:WIN_CODESIGN_SKIP='1'
   npm run dist:win
   ```
3. 或者在 `package.json` 中移除 `"sign": false` 配置

---

## 🔧 当前已知问题

### 1. 空窗口问题（已解决）
- **原因**：首次打包时 `package.json` 的 `main` 字段指向 `.ts` 文件
- **解决**：已修改为 `./out/main/index.js`
- **状态**：✅ 已修复

### 2. winCodeSign 下载问题
- **原因**：GitHub 资源连接超时 + 解压权限问题
- **影响**：无法生成 NSIS 安装包
- **解决**：使用 win-unpacked 版本直接运行
- **状态**：⚠️ 需手动解决

### 3. electron-vite 版本兼容性
- **问题**：v5.x 与当前项目配置不兼容
- **解决**：降级到 v2.3.0 + Vite 5.4.11
- **状态**：✅ 已修复

---

## 📝 重要路径汇总

| 用途 | 路径 |
|------|------|
| 项目根目录 | `C:\Users\代梦余\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a41b8987407692186d68289\career-assistant` |
| 启动脚本 | `项目根目录\启动.bat` |
| 可运行 EXE | `项目根目录\dist_electron\win-unpacked\CareerAssistant.exe` |
| 数据库文件 | `%APPDATA%\career-assistant.db` |
| 前端源码 | `项目根目录\src\` |
| 主进程源码 | `项目根目录\electron\main\` |
| 预加载脚本 | `项目根目录\electron\preload\` |
| 配置文件 | `项目根目录\package.json` |

---

## 🎯 下一步建议

### 短期优化
1. **修复安装包生成**：
   - 手动下载 winCodeSign 工具并配置本地路径
   - 或配置国内镜像源

2. **添加示例数据**：
   - 内置一些知名公司数据
   - 帮助用户快速理解功能

3. **完善错误处理**：
   - 添加更友好的错误提示
   - 网络异常重试机制

### 中期规划
1. **数据持久化优化**：
   - 实现数据库迁移机制
   - 添加数据备份/恢复功能

2. **AI 功能增强**：
   - 添加流式响应
   - 支持多轮对话
   - 历史记录管理

3. **用户体验**：
   - 添加启动页/引导
   - 暗色主题支持
   - 快捷键支持

### 长期规划
1. **插件系统**：
   - 支持自定义评估问卷
   - 支持自定义匹配算法

2. **数据同步**：
   - 本地加密备份
   - 跨设备同步（可选）

3. **社区功能**：
   - 匿名数据分享
   - 行业报告生成

---

## 📊 代码统计

- **总文件数**：约 100+ 个文件
- **代码行数**：约 15,000+ 行
- **组件数量**：16 个 React 组件
- **服务层**：11 个服务文件
- **类型定义**：4 个类型文件
- **工具函数**：3 个工具文件

---

## 🔐 安全与隐私

- ✅ 所有数据存储在本地 SQLite
- ✅ API Key 使用 OS 密钥链加密
- ✅ 不上传个人数据到第三方服务器
- ✅ 开源代码，可审计

---

## 📄 开源协议

MIT License - 详见项目根目录 `LICENSE` 文件

---

## 🤝 贡献指南

详见 `docs/contributing.md`

---

## 📞 联系方式

- Issue 反馈：项目 GitHub Issues
- 讨论区：项目 GitHub Discussions

---

**文档结束** | CareerAssistant Team | 2026-06-29
