# AI 实时翻译

这是一个网页应用，利用浏览器的麦克风捕捉音频，并实时在中英文之间进行翻译。

## 功能

*   从麦克风实时语音输入
*   英文翻译成中文
*   中文翻译成英文
*   在屏幕上逐句实时显示翻译后的文本
*   创建和管理主题（例如，“cosc1908 课程”）
*   保存特定主题的所有翻译记录
*   查看每个主题的翻译记录历史
*   支持创建多个主题，但一次只能激活一个主题进行录制
*   支持 Google 或 Hotmail OAuth 登录

## 如何使用

1.  打开网站
2.  授予麦克风访问权限
3.  选择源语言和目标语言
4.  开始说话

## 项目结构

```
ai-recorder/
├── frontend/   # Next.js 前端应用
└── backend/    # Fastify 后端服务
```

## 环境依赖

运行本项目前，请确保已安装以下软件：

*   [Node.js](https://nodejs.org/) v18+
*   [Yarn](https://yarnpkg.com/) v1.22+
*   [MongoDB](https://www.mongodb.com/) （本地或云端）
*   [Redis](https://redis.io/) （本地或云端）

## 开发环境启动

### 前端

```bash
cd frontend
yarn install
yarn dev
```

前端默认运行在 `http://localhost:3000`

### 后端

```bash
cd backend
yarn install
yarn dev
```

后端默认运行在 `http://localhost:8000`

## 构建与生产部署

### 前端构建

```bash
cd frontend
yarn build
yarn start
```

### 后端构建

```bash
cd backend
yarn build
yarn start
```

## 技术栈

*   前端: Next.js + React 19
*   UI 组件库: MUI (Material UI)，用于界面主题与组件
*   后端: Node.js + Fastify
*   缓存数据库: Redis（使用 ioredis）
*   主数据库: MongoDB（使用 Mongoose）
*   实时通信: WebSocket（使用 Socket.io）
*   语音识别 API (用于语音转文本)
*   Gemini API / Kimi API (用于翻译)
*   身份认证: NextAuth（Google / Hotmail OAuth）
