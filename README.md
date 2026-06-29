# CareerAssistant - 大学生求职辅助工具

![Electron](https://img.shields.io/badge/Electron-33.x-blue?logo=electron)
![React](https://img.shields.io/badge/React-19.x-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

CareerAssistant 是一款面向大学生的开源求职辅助桌面软件，帮助你更好地了解自己、评估企业、找到适合的职业发展方向。

## ✨ 功能特性

### 个人评估
- **MBTI 性格测试**：28 题精简问卷，快速了解性格类型
- **五大人格分析**：内外向、开放性、尽责性、宜人性、神经质维度
- **霍兰德职业兴趣**：发现你的职业兴趣倾向
- **AI 洞察**：基于评估结果的个性化分析报告

### 企业评估
- **公司信息管理**：手动添加或批量导入公司数据
- **多维度评估**：公司稳定性、晋升清晰度、行业前景
- **地域发展分析**：结合城市产业布局和人才政策
- **公司类型标签**：分部公司、新兴公司、稳定公司

### 智能推荐
- **多维匹配算法**：结合专业、性格、兴趣、年龄、地域
- **职业路径规划**：AI 生成的个性化职业发展路径
- **风险与机会分析**：年龄风险、机会成本评估
- **行动建议**：具体的求职策略和技能提升建议

### 灵活数据源
- 支持 JSON/CSV 批量导入
- 支持自定义 API 配置
- 内置爬虫方法论文档
- 用户自行负责数据合规性

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
# 构建
npm run build

# 打包 Windows 免安装版
npm run dist:win
```

### 免安装版直接运行

```bash
# Windows 免安装版
npx electron out/main/index.js
```

## 📸 应用截图

> 应用界面截图

## 🛠 技术栈

- **桌面框架**: Electron 33.4.11
- **构建工具**: electron-vite 2.3.0 + Vite 5.4.11
- **前端框架**: React 19.1.0
- **语言**: TypeScript 5.8.3
- **UI 组件**: Mantine 7.17.5 + Tabler Icons
- **状态管理**: Zustand 5.0.5
- **路由**: React Router 7.6.0
- **数据库**: SQLite (sql.js 1.10.3)
- **加密存储**: electron-store 8.2.0
- **HTTP 客户端**: Axios 1.9.0
- **表单验证**: Zod 3.25.28

## 📁 项目结构

```
career-assistant/
├── electron/                 # Electron 主进程
│   ├── main/                 # 主进程代码
│   │   ├── index.ts          # 入口文件
│   │   ├── ipc/              # IPC 通信处理
│   │   └── db/               # SQLite 数据库
│   └── preload/              # 预加载脚本
├── src/                      # 渲染进程（React）
│   ├── components/           # UI 组件
│   │   ├── assessment/       # 个人评估组件
│   │   ├── company/          # 企业评估组件
│   │   ├── recommendation/   # 智能推荐组件
│   │   ├── settings/         # 设置组件
│   │   └── common/           # 通用组件
│   ├── stores/               # Zustand 状态管理
│   ├── services/             # 业务服务层
│   │   ├── ai/               # AI 服务
│   │   ├── crawler/          # 爬虫服务
│   │   ├── db/               # 数据库服务
│   │   └── assessment/       # 评估服务
│   ├── types/                # TypeScript 类型定义
│   ├── utils/                # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── public/                   # 静态资源
│   ├── crawler-examples/     # 爬虫配置示例
│   └── prompts/              # AI Prompt 模板
├── docs/                     # 文档
├── out/                      # 构建输出
├── dist-electron/            # 前端构建输出
├── dist_electron/            # Electron 打包输出
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
├── vite.config.ts
├── 启动.bat                   # 一键启动脚本
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

## 🔧 故障排查

### Windows 安装包打包失败

如果 `npm run dist:win` 失败，请尝试：

1. **使用管理员权限运行 PowerShell**
2. **清理缓存后重试**：
   ```powershell
   Remove-Item "$env:LOCALAPPDATA\electron-builder\Cache" -Recurse -Force
   npm run dist:win
   ```
3. **或直接使用免安装版**：
   ```powershell
   npx electron out/main/index.js
   ```

### 数据库初始化失败

确保 `node_modules/sql.js/dist/sql-wasm.wasm` 存在，如果不存在请运行：
```bash
npm install sql.js
```

## 🔐 数据隐私

- 所有用户数据存储在本地 SQLite 数据库
- API Key 使用 OS 密钥链加密存储
- 不上传任何个人数据到第三方服务器（AI 评估除外，由用户自行控制）

## 📝 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 🤝 贡献指南

详见 [docs/contributing.md](docs/contributing.md)

## 📄 开源协议

本项目采用 MIT 协议开源。详见 [LICENSE](LICENSE) 文件。

## 📞 联系方式

- Issue 反馈：[GitHub Issues](https://github.com/daimengyu01/career-assistant/issues)
- 讨论区：[GitHub Discussions](https://github.com/daimengyu01/career-assistant/discussions)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=daimengyu01/career-assistant&type=Date)](https://star-history.com/#daimengyu01/career-assistant&Date)

---

**Made with ❤️ by CareerAssistant Team**
