# 项目上下文: AI 实时翻译

## 项目简介

这是一个基于 Web 的 AI 实时翻译应用，利用浏览器麦克风捕捉音频，并在中英文之间进行实时翻译。支持主题管理、翻译历史记录，以及 Google / Hotmail OAuth 登录。

## 品牌与网站标识

- **网站名字**：待确认（需更新 `frontend/app/layout.tsx` 中的 `<title>` 和 `metadata.title`，以及登录页的 App Title 显示文字）
- **网站图标（favicon）**：待替换（Next.js 默认放在 `frontend/app/favicon.ico` 或 `frontend/public/favicon.ico`）

---

## 核心功能

- 实时语音输入（麦克风）
- 英文 ↔ 中文双向翻译
- 逐句实时显示翻译结果
- 创建和管理主题（如"cosc1908 课程"），每次只能有一个活动主题
- 保存并查看各主题的翻译历史（含原文和译文），支持分页加载（默认最近10条）
- 将当前 topic 的翻译历史导出为 PDF 或 TXT 文件
- 支持 Google / Hotmail OAuth 登录
- **界面双语化**：UI 语言支持中文 / English 切换，用户偏好持久化到 localStorage

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
- Login页面同时也承接跳转任务。当API oauth callback成功时，返回跳转到前台的/login页面且附带token和refreshToken作为queryString（`/login?token=xxx&refreshToken=yyy`），前端存储两者。
- 实现authGuard：当用户登录成功，跳转到/dashboard页面；当用户未登录，跳转到/login页面。
- 实现token自动续期：当access token即将过期时，使用refresh token调用后端接口换取新token。
- 实现定时器驱动的后台 token 主动刷新：页面加载后启动定期检查（如每分钟轮询），当 access token 距过期时间低于阈值（如5分钟）时，自动续期，解决页面长时间打开但无操作时 token 静默过期的问题。

### 后端（服务器）
- 提供 RESTful API，支持完整的 CRUD 操作（GET / POST / PUT / PATCH / DELETE）
- Fastify CORS 配置允许的 HTTP methods：`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- 管理用户认证与会话
- 提供 Google 和 Hotmail 的 OAuth 登录 callback 路由（`GET /oauth/{oauthProvider}/callback`）
- **callback 处理逻辑**：收到 OAuth code → 向提供商换取用户信息 → 查找/创建用户（如不存在则新建）→ 同时签发 **JWT（access token）** 和 **refresh token** → redirect 到前台 `/login?token=xxx&refreshToken=yyy`
- JWT（access token）和 refresh token 均存储于 Redis（各自含 TTL）
- 翻译流程协调：
  1. 接收客户端音频
  2. 调用语音识别 API → 得到文本
  3. 调用翻译 API（Gemini / Kimi）→ 得到译文
  4. 将译文返回客户端并存入 MongoDB

### 用户角色（RBAC）

系统支持三种用户身份（`role` 字段存储于 User model）：

| 角色 | 说明 |
|------|------|
| `customer` | 普通用户，默认角色，仅能使用翻译核心功能 |
| `agent` | 代理/运营人员，可创建和查看邀请码 |
| `admin` | 管理员，可访问全部管理功能（含用户管理和邀请码管理） |

- 只有 `agent` 和 `admin` 可访问 `POST /invitation-codes` 和 `GET /invitation-codes`。
- 只有 `admin` 可访问 `/admin/*` 路由（用户管理、邀请码管理完整 CRUD）。
- 后端通过 `requireRole()` 钩子工厂函数统一拦截权限不足的请求，返回 403。

---

### 用户认证（OAuth + JWT）

- **不支持本地注册/密码**，用户只能通过 Google Gmail 或 Microsoft Hotmail 的 OAuth 登录。
- **登录逻辑（server-side OAuth flow）**：
  1. 用户点击登录按钮 → 前端跳转至 OAuth 提供商授权页
  2. 提供商授权后回调后端 `GET /oauth/{provider}/callback`（携带 code）
  3. 后端用 code 换取用户 email/name
  4. 在 MongoDB 中查找该 email 的用户
     - **已存在** → 直接签发 access token + refresh token
     - **不存在** → 创建新 User 文档，再签发 access token + refresh token
  5. access token 和 refresh token 均存入 Redis（各自含 TTL）
  6. 后端 redirect 到前台 `/login?token=xxx&refreshToken=yyy`
  7. 登出时删除 Redis 中对应的 session key
- `userService` 的新用户创建**仅由 OAuth 回调触发**，不暴露独立的注册接口。

---

## 数据流（实时翻译请求）

```
用户说话
  → 前端采集音频（WebRTC/WebSocket）
  → 建立 WebSocket 连接：GET /topics/:topicId/translation/live
  → 前端持续发送 audio_chunk（base64 PCM）
  → 后端调用语音识别 API → 断句 → 返回 transcript 消息
  → 后端调用翻译 API → 返回 translation 消息 + 存入 MongoDB
  → 前端实时渲染原文和译文
```

**WebSocket 消息协议（客户端 → 服务端）：**
- **Binary frame（ArrayBuffer）**：原始语音 binary chunk，每 250ms 发送一次（通过 MediaRecorder `ondataavailable`）
- **Text frame（String）**：main panel 文字输入框输入的文本，直接作为字符串发送

**WebSocket 消息协议（服务端 → 客户端）：**
- `{ type: "transcript", text: "..." }` — 语音识别中间结果
- `{ type: "translation", original: "...", translated: "...", recordId: "..." }` — 翻译完成
- `{ type: "error", message: "..." }` — 错误通知

**前端静音检测（VAD）：**
- 利用 `AnalyserNode` 实时监测音量；静音持续超过 1 秒时，通过 WebSocket 发送 `{ type: "end_utterance" }`，通知后端本段语音结束

**后端文件存储 + AI 翻译（end_utterance 触发时并发执行）：**
- 收到 binary → 拼接至 buffer（不再使用定时器切割）
- 收到 `end_utterance` → 同时并发执行（互不等待）：
  1. 将当前 buffer 保存为音频文件（文件名含时间戳），清空 buffer（保留 header chunk）
  2. 将 buffer 发送给 AI API，使用 pre-prompt 要求返回 JSON `{o: 原文, t: 译文}`；AI 返回后将 original + translated **保存为 TranslationRecord（MongoDB，关联 topicId + userId）**，再通过 WebSocket 推送至前端
- 收到 string（非 JSON）→ 追加至 `backend/test/message.txt`

**前端 OT Loading Card 与有序揭示：**
- 每段音频开始时，前端生成唯一 segmentId，通过 WebSocket 发送 `{ type: "segment_start", segmentId }` 消息，同时在 main panel 中按顺序创建一个 OT loading card（带马赛克/skeleton 占位效果）
- 后端翻译完成后，在 `{ type: "translation" }` 消息中附带 `segmentId`，前端据此定位对应 loading card
- **有序揭示保证**：即使后端翻译结果乱序返回（如第 2 段比第 1 段先完成），第 2 段 card 的马赛克效果也必须等第 1 段 card 的翻译结果显示完成后才能揭示；所有 card 按音频录入顺序依次显示

**前端实时展示翻译结果：**
- Dashboard 页面 WebSocket 监听 `{ type: "translation" }` 消息
- 收到时，将 `{ original, translated }` 填入对应 segmentId 的 loading card，移除马赛克效果；若前一段 card 尚未揭示，则排队等待
- 每当展示区新增对话内容（新 card 追加或历史记录加载完毕）时，自动滚动至展示区底部，确保最新内容始终可见

**导出 PDF：**
- main panel 的 Topic Header 区域提供「导出 PDF」按钮
- 点击后加载该 topic 全部翻译历史，客户端使用 `jspdf` 生成 PDF 并触发浏览器下载
- PDF 内容包含：topic 标题、每条记录的原文（O）和译文（T）、时间戳

**前端加载历史记录（分页）：**
- 用户点击 sidebar 中某个 topic 时，调用 `GET /topics/:topicId/translations` 默认只获取最近 10 条历史翻译记录
- 历史记录按时间顺序渲染到 main panel 展示区（之后实时收到的新条目继续追加）
- 若历史记录超过 10 条，在展示区**顶部**显示两个按钮：
  - **「查看之前十条」**：加载前一页 10 条记录，追加到展示区顶部
  - **「查看之前所有记录」**：一次性加载全部剩余历史记录，追加到展示区顶部
- 当所有历史记录已全部加载后，隐藏上述按钮

**Pre-prompt 配置文件**：
- 位置：`backend/src/config/prompts.ts`
- 定义 AI 音频翻译的 system instruction：检测语言后输出原文 + 对应方向的译文，仅返回 JSON 格式 `{"o": "<原文>", "t": "<译文>"}`，不输出其他任何内容

---

## 用户画像

- **学生**：学习中文或英文，练习发音、获取即时反馈
- **商务人士**：与不同语言的同事或客户沟通
- **游客**：出行中需要基本语言交流帮助

---

## 部署方案

- **前端**：Next.js standalone 模式，Docker 容器化，部署至 Coolify
- **后端**：TypeScript 编译后 Docker 容器化，部署至 Coolify
- **数据库**：使用外部托管的 MongoDB 和 Redis 服务（生产环境不在 compose 中管理）
- **本地开发**：`docker-compose.dev.yml` 包含前端、后端、MongoDB、Redis 四个服务，支持热更新
- **生产部署**：`docker-compose.yml` 仅包含前端和后端服务，环境变量通过 Coolify 平台注入

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

#### 右侧区域 — 默认状态（OAuth 登录）
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

#### 右侧区域 — 激活码状态（用户未激活时）

当后端 OAuth 回调携带 `needActivation=true` 参数重定向到 `/login` 时，右侧区域替换为激活页面：

- **Title**：「激活账户 / Activate Account」
- **激活码输入框**：单行文本 input，占位符提示输入邀请码
- **提交按钮**：点击后调用 `POST /auth/activate`
- **错误状态**：激活码无效时，input 边框变红并在下方显示错误提示文字
- **成功状态**：激活成功后显示成功提示，1 秒后自动跳转至主页（`/dashboard`）

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
  - 每条 topic 条目右侧按钮区：**edit icon button**（在 delete button 左边）+ delete icon button
    - 点击 edit button 后，条目变为 inline input，右侧出现 submit/cancel button；提交后调用后端更新 title 接口并刷新列表
    - 若被编辑的 topic 是当前选中项，编辑成功后同步更新 `selectedTopic` 状态，确保 main panel title 实时反映新名称
  - 点击 delete icon button 后弹出确认 dialog，确认则调用 API 删除该 topic 并刷新列表
  - **「新增 Topic」按钮位于 topic list 顶端**（搜索框正下方）
  - topic 列表支持**拖拽排序**：可拖拽条目调整顺序，松手后调用 `PUT /topics/reorder` 接口批量更新 order
  - topic 列表按 `order` 字段升序展示，新建的 topic 自动排在最前
  - topic list有最高高度，超过最高高度，需要展示滚动条
  - 设置 icon 保持可见，展开时整体向左平移
  - 设置 icon **左侧**显示当前登录用户名：取 email `@` 前半部分，若过长则用 `...` 截断
- **设置 icon 点击行为**：点击后弹出 button group，以设置 icon 为锚点向**右上方**展开，包含以下选项：
  - **User Profile**：点击后替换中间 Panel，显示 User Profile 页面（见下方 User Profile 页面设计）
  - **Logout**：点击后执行登出（清除 token、调用后端登出接口、跳转到 /login）

#### User Profile 页面

- 点击导航栏设置 button group 中的 **User Profile** 后，**中间 Panel 区域**被替换为 User Profile 页面（不跳转路由，仅替换内容区域）。
- **页面内容**：
  - 显示当前登录用户的用户名（User Name）
  - 提供编辑用户名的输入框，用户可修改并保存
- **返回**：用户可通过页面内关闭/返回操作回到原 Main Panel 视图

---

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
GEMINI_API_KEY=your-gemini-api-key
KIMI_API_KEY=your-kimi-api-key
```

---

### 隐私政策页（/policy）

**整体布局：单栏，全屏**

```
┌──────────────────────────────────────┐
│  [← Return]                          │
│                                      │
│  （隐私政策 Markdown 内容渲染区）      │
│                                      │
└──────────────────────────────────────┘
```

- **Return 按钮**：位于页面左上角，点击后返回上一页（`router.back()`）
- **内容区**：将 `scaffold/privacy-policy.md` 的内容渲染为 HTML，支持标题、表格、列表等 Markdown 格式
- 页面无导航栏、无侧边栏，全页仅显示内容和 Return 按钮

---

### 服务条款页（/terms-of-service）

**整体布局：单栏，全屏**

```
┌──────────────────────────────────────┐
│  [← Return]                          │
│                                      │
│  （服务条款 Markdown 内容渲染区）      │
│                                      │
└──────────────────────────────────────┘
```

- **Return 按钮**：位于页面左上角，点击后返回上一页（`router.back()`）
- **内容区**：将 `scaffold/terms-of-service.md` 的内容渲染为 HTML，支持标题、表格、列表等 Markdown 格式
- 页面无导航栏、无侧边栏，全页仅显示内容和 Return 按钮

---

### Admin 管理页（/admin）

**整体布局：独立路由页，含子界面切换**

```
┌──────────────────────────────────────────────────┐
│  Admin Panel                    [Users] [Codes]   │
├──────────────────────────────────────────────────┤
│                                                  │
│   （子界面内容区域）                               │
│                                                  │
└──────────────────────────────────────────────────┘
```

- 页面路由：`/admin`，需要 `agent` 或 `admin` 角色鉴权（其他角色用户重定向到 `/dashboard`）
- 顶部 Tab 切换：**用户管理** / **激活码管理**

#### 用户管理子界面

- 表格上方工具栏：
  - **Filter 输入框**：按 name 或 email 模糊搜索，实时触发查询（防抖处理）；默认为空（不过滤）
  - **Order 切换**：按创建时间升序 / 降序排列，默认**倒序**（最新注册用户在前）
- 展示用户表格，列：
  - `id`（用户 MongoDB `_id`）
  - `名字`（name）
  - `email`
  - `用户身份`（role：customer / agent / admin）
  - `激活状态`（active：true / false）
  - `操作`（Edit 按钮）
- 每行的 Edit 功能：**仅允许修改 `active` 字段**（切换激活/禁用状态），点击 Edit 后该行出现确认/取消操作，提交后调用 `PATCH /admin/users/:userId`（`agent` 和 `admin` 均可操作）
- 表格下方 **分页控件**：显示当前页 / 总页数，支持上一页/下一页；每页默认 15 条，最多 15 条；查询参数变化时重置为第 1 页

#### 激活码管理子界面

- 表格上方工具栏：
  - **Filter 下拉选择**：筛选使用状态，选项为「未使用」/ 「已使用」/ 「全部」，默认选中**未使用**（filter=unused）
  - **Order 切换**：按创建时间升序 / 降序排列，默认**倒序**
- 展示邀请码表格，列：
  - `code`（邀请码字符串）
  - `使用状态`（used：已使用 / 未使用）
  - `操作`（切换 used 状态的按钮）
- 页面顶部提供「添加邀请码」输入框 + 提交按钮，调用 `POST /admin/invitation-codes` 创建新邀请码（**仅 `admin` 可见/可用**）
- 每行操作按钮：切换该邀请码的 `used` 状态，调用 `PATCH /admin/invitation-codes/:codeId`（**仅 `admin` 可用**）
- 表格下方 **分页控件**：显示当前页 / 总页数，支持上一页/下一页；每页默认 15 条，最多 15 条；filter/order 变化时重置为第 1 页

---

## 未来规划

- 支持更多语言
- 离线模式
- 编辑与分享翻译内容
- 移动端应用（iOS / Android）
