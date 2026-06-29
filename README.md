# CareerAssistant - 大学生求职辅助工具

![Electron](https://img.shields.io/badge/Electron-33.x-blue?logo=electron)
![React](https://img.shields.io/badge/React-19.x-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

CareerAssistant 是一款面向大学生的开源求职辅助桌面软件，帮助你更好地了解自己、评估企业、找到适合的职业发展方向。

## 功能特性

### 个人评估
- **MBTI 性格测试**：标准 28 题精简问卷，快速了解性格类型
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

## 技术栈

- **桌面框架**: Electron 33 + electron-vite 3
- **前端**: React 19 + TypeScript + Vite 6
- **UI 组件**: Mantine 7
- **状态管理**: Zustand
- **数据库**: SQLite (sql.js)
- **加密存储**: electron-store
- **AI**: 支持 DeepSeek / OpenAI API

## 快速开始

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

# 打包 Windows 安装包
npm run dist:win
```

## 项目结构

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
│   ├── stores/               # Zustand 状态管理
│   ├── services/             # 业务服务层
│   ├── types/                # TypeScript 类型定义
│   └── utils/                # 工具函数
├── public/                   # 静态资源
│   ├── crawler-examples/     # 爬虫配置示例
│   └── prompts/              # AI Prompt 模板
└── docs/                     # 文档
```

## 数据隐私

- 所有用户数据存储在本地 SQLite 数据库
- API Key 使用 OS 密钥链加密存储
- 不上传任何个人数据到第三方服务器（AI 评估除外，由用户自行控制）

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 开源协议

本项目采用 MIT 协议开源。详见 [LICENSE](LICENSE) 文件。

## 致谢

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Mantine](https://mantine.dev/)
- [sql.js](https://sql.js.org/)
- [electron-vite](https://electron-vite.org/)
