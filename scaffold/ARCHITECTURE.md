# 架构文档: AI 实时翻译

## 1. 概述

“AI 实时翻译”应用程序是一个基于 Web 的系统，旨在提供中英文之间的实时语音翻译。该架构基于现代客户端-服务器模型，前端采用 Next.js 单页应用程序 (SPA)，后端采用 Node.js，并使用多个外部服务进行翻译和语音转文本。

## 2. 组件

### 2.1. 前端 (客户端)
*   **框架**: Next.js (React)
*   **UI 组件库**: MUI (Material UI)，用于主题定制和 UI 组件
*   **职责**:
    *   渲染用户界面。
    *   使用 WebRTC / WebSocket 从用户的麦克风捕获音频。
    *   将音频数据发送到后端进行处理。
    *   向用户显示实时翻译结果。
    *   处理用户身份验证（Google/Hotmail 的 OAuth）。
    *   管理与主题和翻译历史相关的用户交互。
    *   authGuard。当用户登录成功，跳转到/dashboard页面。当用户未登录，跳转到/login页面。
    *   当login接到token和refresh token，记录，且实现当token快expire的时候，使用refresh token更新token。
    *   **后台 token 定时刷新**：页面加载后启动定时器（如每分钟），检查 access token 距过期时间是否低于阈值（如5分钟），若是则主动用 refresh token 换取新 token，解决页面长时间打开但无操作时 token 静默过期的问题。
    *   **PDF 导出**：Topic Header 区域提供导出按钮，客户端使用 `jspdf` 库生成 PDF（无需后端参与），内容含 topic 标题、全部原文/译文条目及时间戳，触发浏览器下载。
    
### 2.2. 后端 (服务器)
*   **框架**: Node.js (使用 Fastify 等框架)
*   **职责**:
    *   为前端提供 RESTful API。
    *   处理用户身份验证和会话管理。
    *   与数据库（MongoDB 和 Redis）交互。
    *   协调翻译过程：
        1.  从客户端接收音频数据。
        2.  调用语音识别 API 将音频转换为文本。
        3.  调用翻译 API（Gemini 或 Kimi）翻译文本。
        4.  将翻译后的文本发送回客户端。
    *   从 MongoDB 存储和检索主题和翻译历史数据。
    *   从 Redis 缓存最近的翻译记录。
    *   JWT session storage.
    *   提供gmail和hotmail的oauth登陆的callback router。
    *   oauth成功后，添加新用户如果需要。同时返回token和refresh token。
    *   callback方法重定向为前台的/login?token=xxx&refreshToken=yyy。
*   **CORS 配置**：
    *   允许的 HTTP methods：`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
    *   前端 origin 通过 `.env` 的 `CORS_ORIGINS` 环境变量配置

### 2.3. 数据库
*   **主数据库**: MongoDB
    *   **用途**: 存储用户数据、主题和翻译历史。
    *   **Topic 排序**：`Topic` model 包含 `order` 字段（Number），新建 topic 时自动赋值为当前用户所有 topic 中最小 `order` 减 1（使新 topic 始终排在列表最前）。`GET /topics` 按 `order` 升序返回。
    *   **Topic 更新 API**：`PATCH /topics/:topicId` 支持更新 topic `title` 字段（用于 inline 编辑）。
    *   **Topic 批量排序 API**：`PUT /topics/reorder` 接受 `[{ id, order }]` 数组，批量更新当前用户 topic 的 `order` 字段（用于拖拽排序）。
*   **缓存数据库**: Redis
    *   **用途**: 缓存频繁访问的数据，例如用户会话信息或最近的翻译，以提高性能。

### 2.3.1. Auth Flow — OAuth + JWT

用户**只能**通过 OAuth 登录（Google Gmail 或 Microsoft Hotmail），不支持本地注册/密码。

**登录流程：**

```
前端
  └─► POST /auth/oauth  { provider: "google"|"hotmail", oauthToken }
        │
        ▼
        后端：向 OAuth 提供商验证 token，获取 email
        │
        ├─ MongoDB 中存在该 email？
        │     └─ YES → 直接签发 JWT
        │
        └─ NO → 创建新 User 文档 → 签发 JWT
```

- JWT 由本地 server 签发，存储于 Redis（含 TTL）作为 session。
- `userService` 的创建用户逻辑**仅在此处触发**，没有独立的"注册"接口。
- 登出时删除 Redis 中对应的 session key。

**登出流程：**
- 前端：用户点击导航栏设置 icon → 弹出 button group → 点击 Logout
- 前端：清除本地 token cookie → 调用后端登出接口 → 跳转到 /login
- 后端：提供 `POST /auth/logout` 路由，删除 Redis 中对应的 session key

**User Profile 流程：**
- 前端：用户点击导航栏设置 icon → 弹出 button group → 点击 User Profile
- 前端：中间 Panel 区域替换为 User Profile 页面（不跳转路由）
- User Profile 页面显示当前用户名，支持修改并保存
- 后端：提供用户名更新接口，更新 MongoDB 中的 User 文档 `name` 字段

### 2.3.2. 实时翻译 WebSocket 端点

**路由**：`GET /topics/:topicId/translation/live`（WebSocket upgrade，需 Bearer token 鉴权）

**实现库**：`@fastify/websocket`

**消息协议（客户端 → 服务端）**：
- **Binary frame（ArrayBuffer）**：原始语音数据块，每 250ms 发送一次；服务端每 5 秒将拼接后的 buffer 写入 `backend/public/recorder/<topicId>-<timestamp>.mp4`，写入后清空 buffer
- **Text frame（String）**：来自 main panel 文字输入框的文本内容；服务端追加至 `backend/public/message.txt`
- **`{ type: "segment_start", segmentId: "<uuid>" }`**：前端在每段音频（即每次 end_utterance 触发前）开始发送前，先发送此消息，携带唯一 segmentId；服务端记录 segmentId 与当前累积 buffer 的对应关系

**消息协议（服务端 → 客户端）**：
```json
{ "type": "transcript", "text": "..." }
{ "type": "translation", "original": "...", "translated": "...", "recordId": "...", "segmentId": "..." }
{ "type": "error", "message": "..." }
```

**OT Loading Card 有序揭示机制**：
- 前端在发送 `segment_start` 消息时，同步在 main panel 中创建一个对应的 OT loading card（带马赛克/skeleton 效果），按发送顺序排列
- 后端翻译完成后，在 `translation` 消息中附带 `segmentId`，前端据此定位对应 loading card
- **有序揭示**：即使后端翻译结果乱序返回（如第 2 段比第 1 段先完成），第 2 段 card 的马赛克效果也必须等第 1 段 card 翻译结果显示完成后，才能揭示；确保展示区内容始终按音频录入顺序显示

**前端录音行为**：
- 点击 record 按钮时建立 WebSocket 连接
- 通过 MediaRecorder API 采集麦克风音频，每 250ms 触发 `ondataavailable` 事件，将 binary chunk 通过 WebSocket 发送
- 再次点击 record 按钮（停止录音）时关闭 WebSocket 连接

**前端静音检测（Voice Activity Detection）**：
- 录音过程中，利用已有的 `AnalyserNode` 实时读取音频频率数据（`getByteFrequencyData`）
- 计算当前帧的平均音量；若平均音量低于阈值（如 10/255），则判定为静音帧
- 当静音持续超过 1 秒时，通过 WebSocket 发送 `{ type: "end_utterance" }` 消息，通知后端本段语音结束
- 发送后重置静音计时器，等待下一段语音开始

**Pre-prompt 配置**：
- 后端维护一个 pre-prompt 配置文件（如 `backend/src/config/prompts.ts`），定义发给 AI API 的 system instruction
- 音频翻译 prompt 要求 AI API 基于检测到的语言，返回原文 + 译文，**仅输出 JSON 格式**：`{"o": "<原文>", "t": "<译文>"}`

**后端文件处理**：
- 收到 binary frame → 拼接 buffer（不再使用定时器）
- 收到 `end_utterance` JSON 消息 → **并发执行**以下两个操作（互不等待）：
  1. 将当前累积的 buffer 写入音频文件（文件名含时间戳），清空 buffer（保留 headerChunk）
  2. 将 buffer 发送给 AI API（使用 pre-prompt），解析返回的 `{o, t}` JSON，**保存为 TranslationRecord（MongoDB）**，再通过 WebSocket 推送至前端
- 收到 text frame（非 JSON）→ 追加文本（含换行）至 `backend/test/message.txt`
- 目录不存在时自动创建

**翻译历史 API**：
- `GET /topics/:topicId/translations` — 分页查询指定 topic 的翻译历史（TranslationRecord 列表），按时间倒序
  - 分页参数：`limit`（每页条数，默认 10）、`before`（翻译记录 timestamp/id，返回此时间点之前的记录，用于向前翻页）
  - 前端默认请求最近 10 条；若有更多记录，展示区顶部显示"查看之前十条"和"查看之前所有记录"按钮
  - 点击"查看之前十条"：带 `before` 参数请求前一页；点击"查看之前所有记录"：带 `limit=all` 或不限 limit 请求全部剩余记录
- 前端在切换 topic 时调用此接口，将历史记录渲染到 main panel 展示区

**处理流程**：
1. 客户端建立 WebSocket 连接，携带 Bearer token（query param `token=xxx` 或 Authorization header）
2. 服务端验证 token 和 topicId 归属
3. 客户端持续发送 binary 音频 chunk（每 250ms）或 `end_utterance` JSON 消息
4. 服务端分别处理：binary → 拼接缓存；`end_utterance` → 并发执行文件保存 + AI API 翻译 + 保存 TranslationRecord
5. 翻译结果通过 WebSocket 推送前端，前端实时追加到展示区
6. 连接关闭时将累积的 binary 数据写入录音文件，清理资源

### 2.4. 外部服务
*   **语音识别 API**: 将音频流转换为文本的外部服务。
*   **翻译 API**: 用于将文本从源语言翻译成目标语言的 Gemini API 或 Kimi API。
    *   **Gemini API**：通过 `@google/generative-ai` SDK 调用，支持标准文本翻译和 Gemini Live 实时流式输出。
    *   **Kimi API**：通过 HTTP 调用 Moonshot AI 的 API，支持标准文本翻译。
    *   **环境变量**：`GEMINI_API_KEY`（Google AI Studio 获取）、`KIMI_API_KEY`（Moonshot 平台获取），均配置于 `backend/.env`。
*   **OAuth 提供商**: 用于用户身份验证的 Google 和 Hotmail。

## 3. 数据流

下图说明了实时翻译请求的数据流：

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant SpeechRecognitionAPI
    participant TranslationAPI
    participant MongoDB

    User->>Frontend: 对着麦克风说话
    Frontend->>Backend: 通过 WebRTC / WebSocket 流式传输音频数据
    Backend->>SpeechRecognitionAPI: 发送音频数据
    SpeechRecognitionAPI-->>Backend: 返回转录的文本
    Backend->>TranslationAPI: 发送转录的文本
    TranslationAPI-->>Backend: 返回翻译的文本
    Backend-->>Frontend: 通过 WebSocket / HTTP 发送翻译的文本
    Frontend->>User: 显示翻译的文本
    Backend->>MongoDB: 保存翻译记录
```

## 4. 部署

该应用程序将使用现代 CI/CD 实践进行部署。
*   **前端**: Next.js 应用程序将部署到像 Vercel 这样的静态托管服务或类似平台。
*   **后端**: Node.js 后端将使用 Docker 进行容器化，并部署到像 AWS、Google Cloud 或 Azure 这样的云提供商。
*   **数据库**: 将使用云提供商的托管数据库服务来管理 MongoDB 和 Redis，以确保可伸缩性和可靠性。
