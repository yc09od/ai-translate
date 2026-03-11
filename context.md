# 项目上下文: AI 实时翻译

## 项目简介

这是一个基于 Web 的 AI 实时翻译应用，利用浏览器麦克风捕捉音频，并在中英文之间进行实时翻译。支持主题管理、翻译历史记录，以及 Google / Hotmail OAuth 登录。

---

## 核心功能

- 实时语音输入（麦克风）
- 英文 ↔ 中文双向翻译
- 逐句实时显示翻译结果
- 创建和管理主题（如"cosc1908 课程"），每次只能有一个活动主题
- 保存并查看各主题的翻译历史（含原文和译文）
- 支持 Google / Hotmail OAuth 登录

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js (React) |
| UI 组件库 | MUI (Material UI)，用于主题与组件 |
| 后端 | Node.js (Express.js 或 Fastify) |
| 主数据库 | MongoDB（存储用户、主题、翻译历史） |
| 缓存数据库 | Redis（会话信息、近期翻译缓存） |
| 实时通信 | WebRTC / WebSocket |
| 语音转文本 | 语音识别 API |
| 翻译 | Gemini API / Gemini Live API / Kimi API |
| 身份认证 | Google OAuth / Hotmail OAuth |

---

## 系统架构

### 前端（客户端）
- 渲染 UI，处理麦克风音频采集
- 通过 WebRTC / WebSocket 将音频流发送至后端
- 显示实时翻译结果
- 处理 OAuth 登录、主题管理、历史查看

### 后端（服务器）
- 提供 RESTful API
- 管理用户认证与会话
- 翻译流程协调：
  1. 接收客户端音频
  2. 调用语音识别 API → 得到文本
  3. 调用翻译 API（Gemini / Kimi）→ 得到译文
  4. 将译文返回客户端并存入 MongoDB

### 用户认证（OAuth + JWT）

- **不支持本地注册/密码**，用户只能通过 Google Gmail 或 Microsoft Hotmail 的 OAuth 登录。
- **登录逻辑**：
  1. 前端将 OAuth token 发给后端（`POST /auth/oauth`）
  2. 后端向 OAuth 提供商验证 token，获取用户 email
  3. 在 MongoDB 中查找该 email 的用户
     - **已存在** → 直接签发本地 JWT
     - **不存在** → 创建新 User 文档，再签发 JWT
  4. JWT 存储于 Redis（含 TTL）作为 session
  5. 登出时删除 Redis session key
- `userService` 的新用户创建**仅由 OAuth 回调触发**，不暴露独立的注册接口。

---

## 数据流（实时翻译请求）

```
用户说话
  → 前端采集音频（WebRTC/WebSocket）
  → 后端接收音频
  → 语音识别 API 返回转录文本
  → 翻译 API 返回翻译文本
  → 后端推送译文到前端
  → 前端展示译文 + 后端存入 MongoDB
```

---

## 用户画像

- **学生**：学习中文或英文，练习发音、获取即时反馈
- **商务人士**：与不同语言的同事或客户沟通
- **游客**：出行中需要基本语言交流帮助

---

## 部署方案

- **前端**：部署至 Vercel 或类似静态托管平台
- **后端**：Docker 容器化，部署至 AWS / Google Cloud / Azure
- **数据库**：使用云托管的 MongoDB 和 Redis 服务

---

## 页面排版设计

### 登录页（/login）

**整体布局：左右两栏，全屏高度**

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│   渐变色背景          │    居中内容区         │
│   Container          │                      │
│                      │   [App Title]        │
│   （装饰性区域，      │                      │
│    无交互元素）        │   ┌──────────────┐   │
│                      │   │ G  Gmail 登录 │   │
│                      │   └──────────────┘   │
│                      │                      │
│                      │   ┌──────────────┐   │
│                      │   │ ⊞  Hotmail登录│   │
│                      │   └──────────────┘   │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

#### 左侧区域
- **背景**：渐变色（如品牌色渐变，例如 `linear-gradient(135deg, #667eea, #764ba2)`）
- 纯装饰性，无交互元素

#### 右侧区域
- **整体对齐**：内容垂直水平居中
- **Title**：App 名称，位于按钮上方
- **Gmail 登录按钮**：
  - 左侧：Google logo（SVG icon）
  - 右侧文字：`Sign in with Gmail`
  - 样式：outlined 或 contained，白底/品牌色
- **Hotmail 登录按钮**：
  - 左侧：Microsoft logo（SVG icon）
  - 右侧文字：`Sign in with Hotmail`
  - 样式与 Gmail 按钮一致，保持视觉统一
- 两个按钮宽度相同，垂直排列，间距适中

---

### 主页（/）

**整体布局：左右两栏，无顶部导航栏**

```
┌──────┬─────────────────────────────┐
│ 导航 │                             │
│ 栏   │        中间 Panel           │
│      │                             │
└──────┴─────────────────────────────┘
```

#### 左侧导航栏

- **收起状态（默认）**：宽度仅为一个 icon 宽度
  - 最顶部：展开 icon（点击后展开导航栏）
  - 最底部：设置 icon
  - 背景：填充色
  - 字体和icon：白色
- **展开状态**：导航栏变宽，展示 topic 列表
  - 展开 icon 变为缩小 icon（点击后收起）
  - 显示 topic 过滤输入框（搜索框），用于筛选 topic 列表
  - 显示所有已有 topic 列表（根据搜索框内容过滤）
  - 提供新增 topic 的入口
  - topic list有最高高度，超过最高高度，需要展示滚动条
  - 设置 icon 保持可见，展开时整体向左平移

#### 中间 Panel

分为上下两部分：

```
┌─────────────────────────────────────┐
│                                     │
│         上部分（主显示区）           │
│   · Topic title | 麦克风录入的音频波形/状态 │
│   · 原文（识别文本）与 译文         │
│                                     │
│  （空间较大，内容从上往下排列）      │
│                                     │
├─────────────────────────────────────┤
│  [🎤]  [ 文字输入框 ] [提交]        │
└─────────────────────────────────────┘
```

- **上部分（主显示区）**：占据大部分高度
  - 显示麦克风录入的音频状态
  - 显示原文（语音识别结果）显示译文
- **下部分（输入区）**：固定在底部
  - 麦克风按钮（Mic Button）：点击开始/停止录音
  - 文字输入框（Input）
  - 提交按钮（Submit Button）：提交文字输入

---

## 后端实现进度（数据库层）

### MongoDB (mongoose)

**数据模型**
- `backend/src/models/User.ts` — 字段：`email`, `name`, `provider`(google/hotmail), `createdAt`
- `backend/src/models/Topic.ts` — 字段：`userId`, `title`, `sourceLang`, `targetLang`, `createdAt`
- `backend/src/models/TranslationRecord.ts` — 字段：`topicId`, `userId`, `originalText`, `translatedText`, `timestamp`

**连接**
- `backend/src/db/mongodb.ts` — `connectMongoDB()` / `disconnectMongoDB()`，带事件监听（connected / error / disconnected）
- `backend/src/index.ts` 启动时调用 `connectMongoDB()`
- 本地开发：`MONGODB_URI=mongodb://localhost:27017/ai-translate`（Docker）
- 测试脚本：`yarn test:db`

### Redis (ioredis)

**连接**
- `backend/src/db/redis.ts` — 导出 `redis` 实例，`connectRedis()` / `disconnectRedis()`，带事件监听
- `backend/src/index.ts` 启动时调用 `connectRedis()`
- 本地开发：`REDIS_URL=redis://localhost:6379`（Docker）
- 测试脚本：`yarn test:redis`

**会话管理**
- `backend/src/services/sessionStore.ts` — `setSession()` / `getSession()` / `deleteSession()`
  - key 格式：`session:{userId}`
  - TTL：7天（604800秒）
  - 登出时调用 `deleteSession(userId)` 删除 key
- 测试脚本：`yarn test:session`

### 环境变量（backend/.env）

```
PORT=8000
MONGODB_URI=mongodb://localhost:27017/ai-translate
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret
```

---

## 未来规划

- 支持更多语言
- 离线模式
- 编辑与分享翻译内容
- 移动端应用（iOS / Android）
