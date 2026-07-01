# CareerAssistant 项目开发上下文文档

> 本文档是项目的完整开发上下文存档，涵盖项目愿景、对话记录、技术架构、开发历程和未来计划。
> 面向开发者和 AI 助手，用于在代码编辑器中继续开发时快速恢复全部上下文。
> 最后更新：2026-07-02

---

## 1. 项目愿景与原始思路

### 我最初想做什么

我想做一款**大学生求职辅助桌面软件**。市面上有很多招聘平台，但它们只帮你找工作，不帮你了解自己。我想反过来：先帮大学生了解自己的性格、兴趣和能力，再帮他们评估目标公司，最后用 AI 给出个性化的职业推荐。

### 核心思路

整个产品的逻辑链条是这样的：

1. **认识自己** — 通过 MBTI、大五人格、霍兰德兴趣测试，让用户了解自己的性格特质和职业倾向
2. **认识企业** — 评估目标公司的稳定性、晋升空间、行业前景和地域发展
3. **智能匹配** — 用 AI 把"自己"和"企业"做多维匹配，给出评分和理由
4. **数据获取** — 通过爬虫、API 或手动导入获取职位和公司信息
5. **AI 贯穿全程** — 评估结果有 AI 洞察、公司评估有 AI 分析、推荐有 AI 理由

### 为什么选 Electron

- 桌面应用，离线可用，数据全部存在本地（隐私安全）
- 可以打包成 Windows 安装包，方便分发
- 用 React 写界面，开发效率高
- 可以通过 Node.js 访问文件系统，做爬虫和数据持久化

### 技术选型

| 领域 | 选择 | 原因 |
|------|------|------|
| 桌面框架 | Electron 33 | 跨平台、Node.js 生态 |
| 前端框架 | React 19 | 生态成熟、组件丰富 |
| UI 组件库 | Mantine 7 | 现代设计、开箱即用 |
| 状态管理 | Zustand | 轻量、无模板代码 |
| 数据库 | sql.js (SQLite WASM) | 纯 JS 实现、无需原生编译 |
| 设置存储 | electron-store | 加密存储 API Key |
| 路由 | react-router-dom (HashRouter) | Electron file:// 兼容 |
| 构建工具 | electron-vite + Vite | 快速构建、HMR |
| 打包 | electron-builder | NSIS + Portable |

### GitHub 地址

https://github.com/daimengyu01/career-assistant

---

## 2. 完整对话记录

以下是项目开发过程中所有关键对话节点的完整记录。每条记录包含：用户说了什么、为什么这样说、AI 做了什么、结果如何。

### 阶段一：白屏调试

用户打开 Electron 应用后发现界面完全空白，开始了漫长的调试过程。

**对话节选：**

> 用户："完全空白"
> 用户："能看到页面"（去掉 BrowserRouter 后）
> 用户："还是一样"
> 用户："仍白屏"
> 用户："1.测试看不到 2.如图"

**为什么反复白屏：** 在 Electron 的 `file://` 协议下，Vite 默认的 `base: '/'` 会导致资源路径变成绝对路径（如 `/assets/index.js`），但 `file://` 协议下这种路径无法正确解析。此外 `BrowserRouter` 依赖 History API，在 `file://` 下也不工作。

**AI 做了什么：** 经过多轮排查（测试 BrowserRouter vs HashRouter、测试有无 Mantine、测试有无 Router、浏览器 vs Electron），最终通过子代理研究确认了根因。

**修复方案：**
1. `electron.vite.config.ts` 中添加 `base: './'`
2. `main.tsx` 中使用 `HashRouter` 替代 `BrowserRouter`
3. 清理被手动损坏的 `dist-electron/index.html`
4. 恢复正确的 `main.tsx` 入口

**结果：** 白屏问题彻底解决。

---

### 阶段二：推送到 GitHub

> 用户："推送到github"

**动机：** 代码修好了，想备份到远程仓库。

**问题：** `git push` 连接被重置（connection reset）。

**修复：** 配置 git 代理到系统代理端口：
```bash
git config http.proxy http://127.0.0.1:7890
git config https.proxy http://127.0.0.1:7890
```

**结果：** 成功推送到 `origin/main`，commit hash `aecb393`。

---

### 阶段三：安装包构建

> 用户："你现在做一个安装版"

**动机：** 想要一个可以直接运行的 Windows 安装程序，方便分发。

**问题 1：** winCodeSign 符号链接错误（Windows 无法创建 macOS dylib 的符号链接）
**修复：** 手动下载并用 7za 解压，忽略 macOS 符号链接错误

**问题 2：** 代码签名错误 `Cannot use 'in' operator to search for 'file' in undefined`
**修复：** 在 `package.json` 中设置 `signAndEditExecutable: false`，设置环境变量 `CSC_IDENTITY_AUTO_DISCOVERY=false`

**结果：** 成功生成 NSIS 安装包 + Portable 便携版。

---

### 阶段四：再次推送

> 用户："推送到github"

**结果：** 成功推送安装包构建相关的修改。

---

### 阶段五：发现功能被阉割

> 用户："为什么感觉你阉割了侧边栏还有很多功能"

**动机：** 在白屏调试过程中，AI 为了简化排查，把 `App.tsx` 的侧边栏从 10 个导航项缩减到了几个，很多功能页面被移除。用户启动后发现功能大量缺失。

**AI 做了什么：** 恢复了完整的 10 项侧边栏导航（首页、个人评估、个人情况、简历上传、职位获取、企业评估、智能推荐、AI配置、数据源管理、数据备份）和 8 个功能卡片。

**结果：** 功能恢复，但用户对"阉割"不满，引出了下一阶段的核心请求。

---

### 阶段六：全面功能增强（核心请求）

> 用户："把所有功能都给我丰满起来，比如说什么爬虫啊什么鬼的 任何实在不行想一想怎么自动获取岗位和公司详情"

**动机：** 用户发现虽然功能页面恢复了，但很多功能是空壳——按钮不工作、IPC 不通、数据不持久化。用户要求把所有功能都做实，特别提到了爬虫功能。最后一句"任何实在不行想一想怎么自动获取岗位和公司详情"表明用户对数据获取方式有灵活性的要求——不拘泥于某种技术方案，只要能获取到数据就行。

**AI 做了什么：** 进行了全面的代码审计，发现了 10 个关键缺陷：
1. `src/services/` 层是死代码，从未被调用
2. IPC 链路断裂（preload 暴露了 API 但后端没有注册 handler）
3. 路由缺失（`/companies/new` 等路由未定义）
4. Store 不持久化（刷新后数据丢失）
5. 爬虫按钮是假的（点击无效果）
6. AI 配置 schema 不匹配
7. 评估问卷无法提交
8. 推荐算法未接通 AI
9. 数据备份功能损坏
10. `crawler:getJobs` 和 `crawler:import` 未注册

制定了 7 阶段增强计划，启动了 3 个并行子代理：
- **后端 IPC**：crawler.ts、company.ts、user.ts、ai.ts 全面扩展
- **前端组件**：ApiKeySettings、CrawlerConfig、CompanyDetail、DataBackup 重写
- **Store + 路由 + Preload**：持久化、路由补全、API 桥接

**结果：** 22 个文件变更（+2435 行，-712 行），commit `d61c6fc` 推送到 GitHub。

---

### 阶段七：意外中断

> 用户："不小心点到终止了，您继续按照你的plan文件修改"

**动机：** 子代理执行过程中用户不小心点了终止按钮，但用户希望继续按计划完成。

**AI 做了什么：** 补充了缺失的 `crawler:getJobs` handler，启动了 Phase 6 子代理（推荐 + AI 洞察），然后遇到 `JobDiscovery.tsx` 的 esbuild 解析错误（`Expected ">" but found "\" py=\""`），通过完全重写文件修复。

---

### 阶段八：sql-wasm 路径修复

构建后启动应用时，sql.js 报错找不到 `sql-wasm.wasm` 文件。

**根因：** 构建后 `__dirname` 指向 `out/main/`，但 wasm 文件在 `node_modules/sql.js/dist/` 中。

**修复：** 使用 `require.resolve('sql.js')` 动态定位 wasm 文件路径，并将 `schema.sql` 内联为常量字符串（避免构建后文件丢失）。

---

### 阶段九：10 步测试反馈

用户按照建议的 10 步测试顺序逐一测试，反馈了大量问题：

> **第 1 步（首页）：** 可以，没有问题
>
> **第 2 步（AI 配置）：** API 测试联通都无法进行（上传了截图"API错误"）
>
> **第 3 步（个人情况）：** 数据持久化无法做到，填完跳转职位获取，再回头点开显示空白
>
> **第 4 步（个人评估）：** 问卷无法选中答案，AI 洞察预计也无法实现
>
> **第 5 步（简历上传）：** 无法保存并且无法提取文本。希望接入包含视觉的模型，可以接入两个模型（一个负责视觉，一个主模型）
>
> **第 6 步（职位获取）：** 导入报错（NOT NULL constraint failed: job_listings.title），联网刷新报错（未配置搜索源），数据源管理点击添加爬虫跳回首页。希望用视觉模型 OCR 招聘网站页面
>
> **第 7 步（企业评估）：** 保存报错，但退出再进能看到数据。自动评估可以用但应该接入 AI，公司信息应该由 AI 获取并自动填写
>
> **第 8 步（智能推荐）：** AI 刷新显示"暂不可用，已使用规则匹配"。匹配分数和理由不够详细
>
> **第 9 步（数据源管理）：** 只有导入数据可用，爬虫点了跳回首页
>
> **第 10 步（数据备份）：** 导出报错（`.all is not a function`），导入无法进行

**根因分析：** 所有数据库相关功能故障的根因是**sql.js 与 better-sqlite3 的 API 不兼容**。代码使用了 better-sqlite3 的 `.all()`、`.get(params)`、`stmt.run(positional, args)` 语法，但 sql.js 的 API 完全不同。

**修复内容：**
1. 在 `db/index.ts` 添加 `queryAll()`、`queryOne()`、`executeRun()` 三个兼容辅助函数
2. 替换 5 个 IPC 处理器文件中所有不兼容的数据库调用
3. 修复 AI URL 双重 `/v1` 拼接问题
4. 修复前端组件：SelfIntro 持久化、MBTI/BigFive/Interest 问卷选择（Radio.Card → UnstyledButton）、ResumeUpload、DataSourceManager 路由、App.tsx 路由、CrawlerConfig 字段名
5. 修复 electron-store 的 `store.save()` 调用（v8 无此方法，改用 `store.set()`）

---

### 阶段十：迁移到代码编辑器

> 用户："现在做项目的窗口不是code窗口我想迁移过去，是不是要用markdown格式写下我们对话以及做的一切"

**动机：** 用户想从 TRAE 对话窗口迁移到代码编辑器窗口继续开发，需要一份完整的项目上下文文档。

**AI 做了什么：** 创建了这份 `PROJECT_CONTEXT.md` 文档。

---

## 3. 项目概览

| 项目 | 说明 |
|------|------|
| 名称 | CareerAssistant |
| 定位 | 大学生求职辅助桌面软件 |
| 版本 | 0.1.0 |
| 协议 | MIT |
| GitHub | https://github.com/daimengyu01/career-assistant |
| 当前状态 | 核心功能已实现并修复，可启动运行，部分高级功能待实现 |

**一句话描述：** Electron + React + sql.js 桌面应用，通过 AI + 数据采集帮助大学生进行职业规划、企业评估和智能推荐。

---

## 4. 架构说明

### Electron 三层结构

```
┌─────────────────────────────────────────────┐
│              Renderer Process               │
│         (React 19 + Mantine 7)              │
│                                             │
│  Components → Stores → electronAPI (preload)│
└──────────────────┬──────────────────────────┘
                   │ IPC (contextBridge)
┌──────────────────┴──────────────────────────┐
│              Preload Script                  │
│    contextBridge.exposeInMainWorld           │
│    暴露 window.electronAPI.* 方法            │
└──────────────────┬──────────────────────────┘
                   │ ipcMain.handle
┌──────────────────┴──────────────────────────┐
│              Main Process                    │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ IPC     │→│ Database │→│ sql.js (WASM)│  │
│  │ Handlers│ │ Helpers  │ │ SQLite       │  │
│  └─────────┘ └──────────┘ └──────┬───────┘  │
│  ┌─────────┐ ┌──────────┐        │          │
│  │ AI Svc  │ │ Crawler  │        ▼          │
│  │ (fetch) │ │ (fetch)  │  文件持久化        │
│  └─────────┘ └──────────┘  (userData/)      │
└─────────────────────────────────────────────┘
```

### 关键设计决策

| 决策 | 原因 | 影响 |
|------|------|------|
| `base: './'` | Electron `file://` 协议需要相对路径 | 必须保留，否则白屏 |
| `HashRouter` | `BrowserRouter` 依赖 History API，`file://` 下不工作 | 必须保留，否则路由失效 |
| `sql.js` 而非 `better-sqlite3` | 纯 JS 实现，无需原生编译 | API 不同，需用兼容层 |
| `contextIsolation: true` | 安全性要求 | 必须通过 preload 桥接 |
| `sandbox: true` | 安全性要求 | preload 中不能直接用 Node API |
| `signAndEditExecutable: false` | 无代码签名证书 | 必须保留，否则打包失败 |
| schema 内联到代码 | 构建后 `schema.sql` 文件丢失 | 已内联到 `db/index.ts` |

### 数据流

```
用户操作 → React Component → Zustand Store → window.electronAPI.*
    → ipcMain.handle → queryAll/queryOne/executeRun → sql.js → 文件持久化
```

---

## 5. 文件结构速查

### src/ 目录

```
src/
├── App.tsx                          # 应用根组件，侧边栏 + 路由
├── main.tsx                         # React 入口（MantineProvider + HashRouter）
├── components/
│   ├── assessment/
│   │   ├── AssessmentResult.tsx     # 测评结果展示 + AI 洞察
│   │   ├── BigFiveQuestionnaire.tsx # 大五人格问卷（28题）
│   │   ├── InterestSurvey.tsx       # 霍兰德兴趣调查
│   │   ├── MBTIQuestionnaire.tsx    # MBTI 问卷（28题）
│   │   ├── PersonalAssessment.tsx   # 测评入口页
│   │   ├── ResumeUpload.tsx         # 简历上传
│   │   └── SelfIntro.tsx           # 个人情况说明
│   ├── company/
│   │   ├── CompanyDetail.tsx        # 公司详情 + 自动评估
│   │   ├── CompanyForm.tsx          # 录入公司信息
│   │   └── CompanyList.tsx          # 公司列表
│   ├── recommendation/
│   │   ├── CareerPathVisualization.tsx  # 职业路径可视化
│   │   ├── JobDiscovery.tsx             # 职位获取
│   │   ├── MatchScoreCard.tsx           # 匹配度卡片
│   │   └── RecommendationList.tsx       # 推荐列表 + AI 刷新
│   └── settings/
│       ├── ApiKeySettings.tsx       # AI 供应商配置
│       ├── CrawlerConfig.tsx        # 爬虫配置
│       ├── DataBackup.tsx           # 数据备份导入导出
│       └── DataSourceManager.tsx    # 数据源管理
├── stores/
│   ├── useAssessmentStore.ts        # 测评状态
│   ├── useCompanyStore.ts           # 公司状态
│   ├── useSettingsStore.ts          # 设置状态（AI 供应商）
│   └── useUserStore.ts              # 用户状态（profile + resume）
├── services/                        # ⚠️ 死代码层，未被调用
│   ├── ai/                          # AI 客户端（未使用）
│   ├── assessment/                  # 评估服务（未使用）
│   ├── crawler/                     # 爬虫服务（未使用）
│   └── db/                          # 数据库服务（未使用）
├── types/
│   ├── assessment.ts
│   ├── company.ts
│   ├── crawler.ts
│   └── user.ts
└── utils/
    ├── constants.ts
    ├── helpers.ts
    └── validators.ts
```

### electron/ 目录

```
electron/
├── main/
│   ├── index.ts                     # 主进程入口（窗口创建 + IPC 注册）
│   ├── config.ts                    # 应用配置（加密密钥）
│   ├── db/
│   │   └── index.ts                 # 数据库管理（sql.js + 兼容层 + schema）
│   ├── ipc/
│   │   ├── ai.ts                    # AI: chat, verify, saveProviders, getActive
│   │   ├── assessment.ts            # 测评: save, getAll
│   │   ├── backup.ts                # 备份: export, import
│   │   ├── company.ts               # 公司: save, getAll, get, delete, autoEvaluate
│   │   ├── crawler.ts               # 爬虫: getSources, saveSource, searchJobs, import, saveJobs, deleteSource, runCrawler, getJobs
│   │   ├── settings.ts              # 设置: get, save, export, import
│   │   └── user.ts                  # 用户: getProfile, saveProfile, getResume, saveResume
│   └── services/
│       └── ai.ts                    # AI 服务实现（OpenAI 兼容 API）
├── preload/
│   └── index.ts                     # 预加载脚本（contextBridge 桥接）
└── resources/
    └── icon.ico                     # 应用图标
```

---

## 6. 开发环境与构建命令

### 常用命令

```bash
# 安装依赖
npm install

# 开发模式（HMR）
npm run dev

# 构建（electron-vite build）
npm run build

# 打包 Windows 安装包
npm run dist:win

# 直接运行构建产物
npx electron .
```

### 构建产物

| 路径 | 说明 |
|------|------|
| `out/main/index.js` | 主进程构建产物 |
| `out/preload/index.js` | Preload 构建产物 |
| `dist-electron/index.html` | 前端构建产物入口 |
| `dist-electron/assets/` | 前端 CSS/JS 资源 |
| `dist_electron/win-unpacked/` | 解压版应用 |
| `dist_electron/*.exe` | NSIS 安装包 + Portable |

### 构建注意事项

- `signAndEditExecutable: false` 必须保留（无代码签名环境）
- 环境变量 `CSC_IDENTITY_AUTO_DISCOVERY=false` 可跳过签名检测
- 如需推送到 GitHub，可能需要配置代理：`git config http.proxy http://127.0.0.1:7890`

---

## 7. 开发历程与修复记录

### 修复 1：React 白屏（2026-06-29）

**问题：** Electron 生产模式下界面完全空白

**根因：**
1. Vite 默认 `base: '/'` 导致 `file://` 下资源路径错误
2. `BrowserRouter` 在 `file://` 下不工作
3. `dist-electron/index.html` 被手动损坏

**修复：**
- `electron.vite.config.ts` 添加 `base: './'`
- `main.tsx` 改用 `HashRouter`
- 清理并重建 `dist-electron/`

### 修复 2：GitHub 推送代理（2026-06-29）

**问题：** `git push` 连接被重置

**修复：** `git config http.proxy http://127.0.0.1:7890`

### 修复 3：安装包代码签名（2026-06-29）

**问题：** 代码签名错误

**修复：** `package.json` 中 `signAndEditExecutable: false` + 环境变量 `CSC_IDENTITY_AUTO_DISCOVERY=false`

### 修复 4：功能全面增强（2026-06-30）

**问题：** 10 个关键缺陷（IPC 断裂、Store 不持久化、爬虫假按钮等）

**修复：** 7 阶段计划，22 个文件变更（+2435 行，-712 行），commit `d61c6fc`

### 修复 5：sql-wasm 路径（2026-06-30）

**问题：** 构建后找不到 `sql-wasm.wasm`

**修复：** 使用 `require.resolve('sql.js')` 动态定位，schema 内联到代码

### 修复 6：JobDiscovery esbuild 解析错误（2026-06-30）

**问题：** `Expected ">" but found "\" py=\""`

**修复：** 完全重写 `JobDiscovery.tsx`

### 修复 7：sql.js API 兼容性（2026-07-02）— 核心修复

**问题：** 代码使用 better-sqlite3 API（`.all()`, `.get()`, `stmt.run(positional)`），但数据库是 sql.js

**修复：**
- `db/index.ts` 添加 `queryAll()`, `queryOne()`, `executeRun()` 三个辅助函数
- 替换 5 个 IPC 文件中所有不兼容调用

### 修复 8：AI URL 双重 /v1（2026-07-02）

**问题：** baseUrl 已含 `/v1` 时拼接出 `/v1/v1/chat/completions`

**修复：** 智能判断 baseUrl 是否已含 `/v1`

### 修复 9：前端组件（2026-07-02）

| 问题 | 修复 |
|------|------|
| SelfIntro 返回空白 | 挂载时 `loadFromBackend()` |
| 问卷无法选择答案 | `Radio.Card` → `UnstyledButton` |
| ResumeUpload 无法保存 | 修复 FileInput 类型 + 接入 `saveResume` IPC |
| DataSourceManager 跳回首页 | 路由 `/settings/crawler` → `/settings/crawler-config` |
| CrawlerConfig 字段名不匹配 | `targetUrl` → `url`, `cardSelector` → `selector` |
| electron-store `store.save()` | 改用 `store.set()` |

---

## 8. 数据库 Schema 说明

### 表结构

数据库使用 sql.js（WebAssembly SQLite），数据文件存储在 `app.getPath('userData')/career-assistant.db`。

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `user_profiles` | 用户个人资料 | name, age, major, personality_mbti, self_intro, resume_text |
| `companies` | 公司信息 | name, industry, scale, funding_stage, location_city, stability_score, analysis_result |
| `assessment_results` | 评估结果 | user_id, type, data(JSON), ai_insights |
| `recommendations` | 推荐记录 | user_id, company_id, match_score, match_reasons |
| `job_listings` | 职位列表 | title, company, location_city, salary, source, source_url |
| `data_sources` | 数据源 | name, type, config(JSON) |
| `ai_providers` | AI 供应商 | name, base_url, api_key, model |
| `search_sources` | 搜索源 | name, type, config(JSON) |
| `peer_reviews` | 同行评价 | user_id, source_type, raw_text, extracted_tags |
| `resumes` | 简历 | user_id, file_name, file_path, extracted_text |

### sql.js 兼容层（重要）

**绝对不要使用 better-sqlite3 的 API。** 以下是正确的用法：

```ts
import { queryAll, queryOne, executeRun, persist } from '../db/index';

// 查询多行
const rows = queryAll('SELECT * FROM companies WHERE industry = ?', ['互联网']);

// 查询单行
const row = queryOne('SELECT * FROM companies WHERE id = ?', [id]);

// 执行 INSERT/UPDATE/DELETE
executeRun('INSERT INTO companies (id, name) VALUES (?, ?)', [id, name]);

// 持久化到文件
persist();
```

**错误用法（不要这样写）：**
```ts
// ❌ 这些都不工作
db.prepare(sql).all(...params);
db.prepare(sql).get(param);
stmt.run(positional, arg1, arg2);
```

---

## 9. IPC 通信清单

### IPC 通道一览

| Channel | Handler File | 功能 |
|---------|-------------|------|
| `ai:chat` | ai.ts | AI 对话（OpenAI 兼容） |
| `ai:verify` | ai.ts | 验证 AI 供应商连接 |
| `ai:saveProviders` | ai.ts | 保存供应商列表 |
| `ai:getActiveProvider` | ai.ts | 获取活跃供应商 |
| `assessment:save` | assessment.ts | 保存评估结果 |
| `assessment:getAll` | assessment.ts | 获取所有评估 |
| `company:save` | company.ts | 保存公司 |
| `company:getAll` | company.ts | 获取公司列表 |
| `company:get` | company.ts | 获取单个公司 |
| `company:delete` | company.ts | 删除公司 |
| `company:autoEvaluate` | company.ts | 自动评估公司（4维打分） |
| `crawler:getSources` | crawler.ts | 获取搜索源 |
| `crawler:saveSource` | crawler.ts | 保存搜索源 |
| `crawler:searchJobs` | crawler.ts | 搜索职位 |
| `crawler:import` | crawler.ts | 导入 JSON/CSV |
| `crawler:saveJobs` | crawler.ts | 批量保存职位 |
| `crawler:deleteSource` | crawler.ts | 删除搜索源 |
| `crawler:runCrawler` | crawler.ts | 运行网页爬虫 |
| `crawler:getJobs` | crawler.ts | 获取本地职位列表 |
| `settings:get` | settings.ts | 获取设置 |
| `settings:save` | settings.ts | 保存设置 |
| `data:export` | backup.ts | 导出全部数据 |
| `data:import` | backup.ts | 导入数据 |
| `user:getProfile` | user.ts | 获取用户资料 |
| `user:saveProfile` | user.ts | 保存用户资料 |
| `user:getResume` | user.ts | 获取简历 |
| `user:saveResume` | user.ts | 保存简历 |

### Preload API

所有 API 通过 `window.electronAPI.*` 调用。完整列表见 `electron/preload/index.ts`。

前端调用示例：
```ts
// 保存公司
await window.electronAPI.saveCompany(companyData);

// AI 对话
const response = await window.electronAPI.chatWithAI([
  { role: 'user', content: '你好' }
]);

// 获取职位列表
const jobs = await window.electronAPI.getJobListings();
```

---

## 10. 测试反馈与已修复问题

用户 10 步测试中发现的所有问题及修复状态：

| 步骤 | 问题 | 根因 | 修复方式 | 状态 |
|------|------|------|----------|------|
| 2 | API 测试 404 | URL 双重 `/v1` | 智能判断 baseUrl | 已修复 |
| 3 | 个人情况返回空白 | 未从后端加载 | 挂载时 `loadFromBackend()` | 已修复 |
| 4 | 问卷无法选中答案 | `Radio.Card` 缺少 `Radio.Indicator` | 改用 `UnstyledButton` | 已修复 |
| 5 | 简历无法保存 | FileInput 类型错误 + 未用 IPC | 修复类型 + 接入 `saveResume` | 已修复 |
| 6 | 导入 NOT NULL 约束 | sql.js `stmt.run()` 只绑定第一个参数 | 改用 `executeRun()` | 已修复 |
| 6 | 联网搜索报错 | 未配置搜索源（正常行为） | - | 正常 |
| 6 | 数据源管理跳回首页 | 路由不存在 | 添加 `/settings/crawler-config` | 已修复 |
| 7 | 公司保存报错 | sql.js API 不兼容 | 改用 `executeRun()` | 已修复 |
| 8 | AI 推荐不可用 | 依赖 API 配置（已修复） | - | 已修复 |
| 9 | 爬虫配置无法运行 | 字段名不匹配 | 修正 config 对象 | 已修复 |
| 10 | 导出报错 `.all` 不是函数 | sql.js 无此方法 | 改用 `queryAll()` | 已修复 |

---

## 11. 用户改进建议与待实现功能

以下是用户明确提出的改进建议，以及每个建议背后的动机。这些功能尚未实现。

### 视觉模型支持

**用户原话：** "我希望可以在这里接入包含视觉的模型，API设置在配置第二步的时候可以额外说明然后可以接入带视觉的模型，或者可以接入两个模型，第一个专门负责视觉，另外一个则是主要使用模型"

**动机：** 简历上传时需要识别图片/PDF 中的文字；招聘网站页面需要视觉识别。当前只支持文本模型，无法处理图片内容。

**设想方案：**
- AI 配置页面添加两个供应商字段：视觉模型 + 主模型
- 视觉模型用于：简历图片 OCR、招聘页面截图分析
- 主模型用于：评估洞察、推荐理由、公司分析等文本任务
- 在配置页面额外说明两个模型的用途区别

### OCR 招聘页面抓取

**用户原话：** "数据源是不是可以变成利用视觉模型 OCR 中文互联网的招聘网站页面然后因为绝大多数界面都需要登录然后可以叫用户登录接着呢就可以 OCR 网站页面的 HTML 然后获取岗位"

**动机：** 传统爬虫需要为每个网站编写 CSS 选择器，不同网站结构不同，维护成本高。而且绝大多数招聘网站（Boss直聘、拉勾、智联）需要登录后才能看到完整信息。用视觉模型 OCR 网页页面，不依赖网站结构变化，更通用。

**设想方案：**
1. 用户在应用内打开招聘网站（嵌入 WebView 或引导用户在浏览器登录）
2. 用户登录后，截取网页页面
3. 视觉模型 OCR 截图内容，提取职位信息（标题、公司、薪资、地点等）
4. 结构化数据后保存到 `job_listings` 表
5. 优势：不依赖网站 HTML 结构变化，不需要 CSS 选择器

### AI 主导公司分析

**用户原话：** "这个功能在我的计划里面应该是由 AI 主导用户进行一个自动化分析填写而不是还要让用户自己选择和填写，公司的具体信息应该由 AI 获取并且验证自动填写并且让用户最少审核一次"

**动机：** 当前需要用户手动填写公司名称、行业、规模、融资阶段等信息，然后手动点击"自动评估"。体验不佳，用户觉得这是"让用户做苦力"。

**设想方案：**
1. 用户只需输入公司名称
2. AI 自动搜索获取公司信息（行业、规模、融资阶段、地理位置等）
3. AI 验证信息准确性并自动填写表单
4. 用户最少审核一次（确认或修改）
5. AI 自动进行多维度评估并给出理由
6. 目标：AI 主导整个分析流程，用户只做最终确认

### 智能推荐详细信息完善

**用户原话：** "详细信息我觉得不够完全而且没有对应解释"

**动机：** 当前匹配分数和理由过于简略，用户不理解为什么得到这个分数。

**设想方案：**
- 每个评分维度都有详细解释（如"稳定性 75 分是因为该公司已上市，融资阶段稳定"）
- 匹配理由具体到用户的哪些特质与公司的哪些特点匹配
- 风险分析要有具体建议而非笼统描述
- 行动建议要有可操作的步骤

### 数据源管理改进

**用户原话：** "我很不满意数据源管理，因为点击添加爬虫就直接跳回到首页界面"

**动机：** 当前数据源管理体验差，爬虫方案不实用。

**设想方案：**
- 用 OCR + HTML 方案替代传统 CSS 选择器爬虫
- 数据源列表显示已配置的搜索源和爬虫任务
- 添加爬虫不再跳转，而是内嵌表单或模态框
- 支持定时爬取任务

---

## 12. 关键注意事项（避坑指南）

以下是开发过程中踩过的所有坑，修改代码时务必注意：

### 数据库相关

- **sql.js 不兼容 better-sqlite3 API**：不要使用 `.all()`, `.get(params)`, `stmt.run(positional, args)`。使用 `queryAll()`, `queryOne()`, `executeRun()` 辅助函数
- **schema.sql 构建后会丢失**：schema 已内联到 `db/index.ts` 的 `SCHEMA_SQL` 常量中，修改表结构时改这里
- **sql-wasm.wasm 路径**：通过 `require.resolve('sql.js')` 动态定位，不要硬编码路径

### 前端相关

- **Mantine 7 的 `Radio.Card`**：需要配合 `Radio.Indicator` 才能点击。已改用 `UnstyledButton` 方案。如果新增问卷，不要用 `Radio.Card`
- **`base: './'` 必须保留**：`electron.vite.config.ts` 中的 `base: './'` 是 `file://` 协议下加载资源的必要条件，删除会导致白屏
- **`HashRouter` 必须保留**：`BrowserRouter` 在 `file://` 下不工作
- **路由路径要匹配**：新增路由时确保 `App.tsx` 中的 `<Route path>` 与 `navigate()` 调用一致

### 后端相关

- **electron-store v8 没有 `store.save()`**：使用 `store.set(key, value)` 代替
- **`store.store = {...}` 赋值也不推荐**：用 `store.set()` 逐个设置
- **IPC handler 必须注册**：在 `electron/main/index.ts` 的 `app.whenReady()` 中调用 `registerXxxHandlers()`

### 构建相关

- **`signAndEditExecutable: false`**：无代码签名环境必须保留
- **`CSC_IDENTITY_AUTO_DISCOVERY=false`**：环境变量，跳过签名检测
- **GitHub 推送代理**：如推送失败，配置 `git config http.proxy http://127.0.0.1:7890`（或当前代理端口）

### 死代码提醒

- `src/services/` 目录下的所有代码（ai/、assessment/、crawler/、db/）都是早期编写的死代码，从未被任何组件调用。实际功能都在 `electron/main/ipc/` 中实现。如果要清理，可以删除整个 `src/services/` 目录

---

*本文档由 TRAE AI 助手根据对话历史和代码探索生成，用于项目上下文交接。*
