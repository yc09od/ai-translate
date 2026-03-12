

-- [1] [x] Create one folder for front end and one for back end.
-- [2] [x] init those npm packages.
-- [3] [x] 安装并配置 MUI (Material UI) 作为前端 UI 组件库和主题系统, yarn add all lib for nextjs.
-- [4] [x] git init this project and add gitignore files to two sub project
-- [5] [x] add all lib for backend, add all for nodejs, fastiy and mongodb client.
-- [6] [x] add test run the nextjs to see if it able to buid for dev.
-- [7] [x] add one test route for fastiy and test if fastiy dev work well.
-- [8] [x] add package script to main root package and run dev with both gui and backend
-- [9] [x] add .env file to each sub project. and change all variable with .env vairable.

## 主页排版

-- [10] [x] 创建主页基础布局：左右两栏结构（左侧导航栏 + 中间 Panel）
-- [11] [x] 实现左侧导航栏收起状态：仅显示展开 icon 和设置 icon
-- [12] [x] 实现左侧导航栏展开/收起动画与状态切换
-- [13] [x] 实现左侧导航栏展开时，在收起icon左边显示title "AI 实时翻译"
-- [14] [x] 实现左侧导航栏展开状态：显示 topic 列表、新增 topic 入口，setting icon 向右平移
-- [15] [x] topic list有最高高度，超过最高高度，除了title部分和setting icon部分之后的80%高度。当超过最高高度时，需要展示滚动条。添加一些fake topic来测试。
-- [16] [x] 左侧导航栏展开时，topic 列表上方添加文字过滤输入框，实时过滤 topic 列表
-- [17] [x] 实现中间 Panel 上下两部分布局（主显示区占大部分高度，输入区固定底部）
-- [18] [x] 实现主显示区 - Topic title 标题展示
-- [19] [x] 实现主显示区 - 麦克风音频波形/录音状态展示
-- [20] [x] 实现主显示区 - 原文（语音识别结果）展示区域
-- [21] [x] 实现主显示区 - 原文（语音识别结果）展示区域 + 译文展示区域。展示区中 每一个section都是一句原文一句译文，然后再是一句原文一句译文，以此类推。展示区高度为除了title，录音波形和之后的input录音button的所有高度。
-- [22] [x] 实现底部输入区 - 文字输入框（Input）
-- [23] [x] 实现底部输入区 - 麦克风按钮（点击开始/停止录音）
-- [24] [x] 实现底部输入区 - 提交按钮（提交文字输入）
-- [25] [x] 重新设计原文译文。所有的原文译文放在一个容器里。垂直方向紧凑一些。
-- [26] [x] 添加record按钮效果，当录音时，icon变为文字recording
-- [27] [x] 原文（语音识别结果）展示区域 + 译文展示区域 添加5px margin-top
-- [28] [x] 更改record button。当不录音的时候，mico icon应该在button中居中
-- [29] [x] 更改展示区域的css，padding改为0 12px 16px 24px。 margin-right 24px。margin-top改为16px
-- [30] [x] 更改展示区域的css，padding改为0 12px 0 24px。 margin-bottom改为16px
-- [31] [x] 更改录音波形添加在title后面，放在一排，做一个非常简单的就行。

## 后端数据库交互

### MongoDB (mongoose)

**数据模型 (Models)**
-- [32] [x] 创建 `User` model — `_id`, `email`, `name`, `provider`(google/hotmail), `createdAt`
-- [33] [x] 创建 `Topic` model — `_id`, `userId`, `title`, `sourceLang`, `targetLang`, `createdAt`
-- [34] [x] 创建 `TranslationRecord` model — `_id`, `topicId`, `userId`, `originalText`, `translatedText`, `timestamp`

**连接与初始化**
-- [35] [x] 创建 `db/mongodb.ts` — 封装 mongoose 连接逻辑，支持重连
-- [36] [x] 在 `index.ts` 启动时初始化 MongoDB 连接
-- [37] [x] 添加dev 参数，我的mongodb本地为docker 为localhost:27017。写一个测试，测试链接，测试添加一个user，topic和 TranslationRecord 实例。

### Redis (ioredis)

**连接与初始化**
-- [38] [x] 创建 `db/redis.ts` — 封装 ioredis 连接，含错误处理
-- [39] [x] 在 `index.ts` 启动时初始化 Redis 连接
-- [40] [x] 添加dev 参数，我的redis本地为docker 为localhost:6379。写一个测试，测试链接

**会话管理**
-- [41] [x] 实现 `sessionStore` — 用 Redis 存储 JWT session（含 TTL 过期）
-- [42] [x] 实现登出时删除 session（token blacklist 或直接删 key）

**缓存**
-- [43] [x] 缓存用户基本信息（减少重复 MongoDB 查询）
-- [44] [x] 缓存最近的翻译记录列表（按 topicId）

**数据访问层**
-- [45] [x] `userService` + OAuth 登录流程实现（架构 2.3.1）
  -- [45.1] [x] 实现 `findByEmail(email)` — 按 email 查询 MongoDB 中的 User 文档
  -- [45.2] [x] 实现 `createUser({ email, name, provider })` — 创建新 User 文档（仅在 OAuth 登录时触发，无独立注册接口）
  -- [45.3] [x] 实现 `POST /auth/oauth` 路由 — 接收 `{ provider: "google"|"hotmail", oauthToken }`
    -- 向 OAuth 提供商（Google/Hotmail）验证 oauthToken，获取 email 和 name
    -- 调用 `findByEmail`：存在 → 直接签发 JWT；不存在 → 调用 `createUser` 后签发 JWT
    -- 将签发的 JWT 存入 Redis（含 TTL）作为 session
  -- [45.4] [x] 实现 `POST /auth/logout` 路由 — 删除 Redis 中对应的 session key

-- [46] [x] 添加api 文档工具swagger
-- [47] [x] 添加api dev 为 http://localhost:8000/oauth/google/callback, route 为/oauth/{oauthProvider}/callback，为了google oauth回调

-- [48] [x] `topicService` — CRUD 操作（创建/列表/删除话题）
-- [49] [x] `translationService` — 保存翻译记录、按 topicId 分页查询历史

### 基础设施

-- [50] [x] 配置 `.env` — `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET` 等环境变量
-- [51] [x] 在 Fastify 注册插件时注入 DB 连接（使用 `fastify.decorate`）

## 前端网页登录页（/login）

-- [52] [x] 创建登录页路由 `/login`，整体布局为左右两栏全屏高度
-- [53] [x] 实现左侧渐变色背景 Container（纯装饰，无交互元素）
-- [54] [x] 实现右侧内容区垂直水平居中布局
-- [55] [x] 添加 App Title 标题，位于按钮上方
-- [56] [x] 实现 Gmail 登录按钮（左侧 Google SVG logo + 右侧文字 "Sign in with Gmail"）
-- [57] [x] 实现 Hotmail 登录按钮（左侧 Microsoft SVG logo + 右侧文字 "Sign in with Hotmail"）
-- [58] [x] 两个按钮样式统一（相同宽度，垂直排列，间距适中）
-- [59] [x] Gmail 按钮点击后触发 Google OAuth 登录流程
-- [60] [x] Hotmail 按钮点击后触发 Microsoft OAuth 登录流程
-- [61] [x] OAuth 登录成功后跳转至主页（/）
-- [62] [x] Login 页面承接 OAuth callback 跳转：当后端 OAuth callback 成功后重定向到 /login?token=xxx，前端解析 queryString 中的 token 并存储登录态
-- [63] [x] 实现 authGuard：已登录用户访问任意页面自动跳转 /dashboard；未登录用户访问受保护页面自动跳转 /login
-- [64] [x] 后端 OAuth callback 路由（`/oauth/:provider/callback`）完整实现：收到 code → 换取用户 email/name → 查找或创建 User → 同时签发 access token 和 refresh token → redirect 到前台 `/login?token=xxx&refreshToken=yyy`
-- [65] [x] Redis session 扩展：同时存储 refresh token（独立 key，TTL 更长，如 30 天）
-- [66] [x] 前端 Login 页面解析 queryString 中的 token 和 refreshToken，存储到cookie,同时做好防护。
  -- [66.1] [x] 防 XSS：refreshToken cookie 设置 HttpOnly（通过 Next.js API route 服务端写入），JS 无法读取
  -- [66.2] [x] 防 CSRF：两个 cookie 均设置 SameSite=Strict，第三方站点请求不带 cookie
-- [67] [x] API 端。token session storage同时要记录refresh token用来验证。
-- [68] [x] APi添加路由，允许使用refresh token生成新token。
-- [69] [x] 前端实现 token 自动续期：在每次 API 请求前检测 access token 是否即将过期，若是则先用 refresh token 调用后端换取新 token，再发起原请求
-- [70] [x] Api cros将前端添加入允许的origin。同时cros允许在env加入list。
-- [71] [x] 前端：在 setting button 左边显示当前登录用户名。取 email @ 符号前半部分作为显示名；若名字过长则用省略号（...）截断。
-- [72] [x] 前端：点击 setting button 弹出 button group，以 setting button 为锚点向右上方展开。
-- [73] [x] 前端：setting button group 中添加 Logout 选项，点击后清除 token cookie、调用后端 POST /auth/logout、跳转到 /login。
-- [74] [x] 前端：GUI 用户名显示文字向左对齐。
-- [75] [x] 前端：左侧 nav bar 默认状态为展开，且 nav bar 的展开/收起状态存入 Redux 并持久化到本地（localStorage）。


## User Profile

-- [76] [x] 前端：setting button group 中添加 User Profile 选项。
-- [77] [x] 前端：点击 User Profile 按钮后，中间 Panel 区域替换为 User Profile 页面（不跳转路由，仅替换内容区域）。
-- [78] [x] 前端：User Profile 页面显示当前登录用户名，并提供编辑输入框，用户可修改后保存。
-- [79] [x] 前端：User Profile 页面提供关闭/返回操作，回到原 Main Panel 视图。
-- [80] [x] 后端：提供用户名更新接口（如 `PATCH /users/me`），更新 MongoDB 中 User 文档的 `name` 字段。

## 响应式布局

-- [81] [x] 前端：当屏幕宽度小于 768px 时，左侧 nav bar 展开状态宽度为全屏（100vw），覆盖 main panel。
-- [82] [x] 前端：当屏幕宽度小于 768px 时，setting button group 向**左上方**展开（anchorOrigin / transformOrigin 调整）。

## Topic 功能

-- [83] [x] 前端 apiClient：添加 `getTopics()` 函数，调用 `GET /topics` 获取当前用户的 topic 列表。
-- [84] [x] 前端 apiClient：添加 `createTopic(title)` 函数，调用 `POST /topics` 创建新 topic（sourceLang 默认 'en'，targetLang 默认 'zh'）。
-- [85] [x] 前端 Sidebar：移除 MOCK_TOPICS，改为通过 `getTopics()` 从后端加载真实数据。组件挂载时自动请求，创建成功后刷新。
-- [86] [x] 前端 Sidebar：实现「新增 Topic」内联输入交互：点击按钮后变形为 input + Submit/Cancel 按钮；点击 Cancel 或 input blur 时恢复按钮状态；防止 blur 先于 click 触发导致误取消。
-- [87] [x] 修复前端 Sidebar：topic 选中高亮逻辑改用 `_id` 而非 `title` 作为唯一标识，避免同名 topic 同时高亮。
-- [88] [x] 前端 apiClient：添加 `deleteTopic(id)` 函数，调用 `DELETE /topics/:id`。
-- [89] [x] 前端 Sidebar：每个 topic 条目右侧添加 delete icon button，点击后弹出确认 dialog；确认后调用 `deleteTopic(id)` 并刷新 topic 列表。

## 品牌与网站标识

-- [90] [x] 更新网站名字：修改 `frontend/app/layout.tsx` 中的 `metadata.title`，同时更新登录页 App Title 显示文字。
-- [91] [x] 替换网站 favicon：将新图标文件放入 `frontend/app/` 或 `frontend/public/`，替换默认 `favicon.ico`。


## Token 后台保活

-- [92] [x] 前端：实现定时器驱动的 token 主动续期——页面加载后启动定期检查（每分钟），当 access token 距过期时间低于阈值（如5分钟）时，自动用 refresh token 换取新 token，解决页面长时间打开但无操作时 token 静默过期的问题
-- [113] [x] Bug 修复：access token 过期时前端直接 logout 而不尝试 refresh——应在 token 过期触发 logout 前，先检查 refresh token 是否有效并尝试换取新 access token；只有 refresh token 也过期（或 refresh 请求失败）时才执行 logout

## Fastify 配置

-- [93] [x] 后端：在 Fastify CORS 配置中添加 PUT、PATCH、DELETE 到 `methods` 允许列表，确保前端可以调用完整的 CRUD 接口

## Topic 排序

-- [94] [x] 后端：Topic model 添加 `order` 字段（Number），`POST /topics` 新建时自动赋值为当前用户最小 order 减 1（使新 topic 排最前）
-- [95] [x] 后端：`GET /topics` 路由改为按 `order` 升序返回 topic 列表
-- [96] [x] 前端 Sidebar：将「新增 Topic」按钮移至 topic list 顶端（搜索框正下方），topic 列表展示顺序与后端返回顺序一致

## Topic 内联编辑与拖拽排序

-- [97] [x] 后端：添加 `PATCH /topics/:topicId` 路由，支持更新 topic `title` 字段（需鉴权，仅允许操作自己的 topic）
-- [98] [x] 后端：添加 `PUT /topics/reorder` 路由，接受 `[{ id, order }]` 数组，批量更新当前用户 topic 的 `order` 字段
-- [99] [x] 前端 apiClient：添加 `updateTopicTitle(id, title)` 和 `reorderTopics(items)` 函数
-- [100] [x] 前端 Sidebar：每个 topic 条目在 delete button 左边添加 edit icon button；点击后条目变为 inline input + submit/cancel button；提交时调用 `updateTopicTitle` 并刷新列表
-- [101] [x] 前端 Sidebar：引入 `@dnd-kit/core` + `@dnd-kit/sortable`，实现 topic list 拖拽排序；松手后调用 `reorderTopics` 更新后端 order
-- [102] [x] 前端 Sidebar：修复 inline 编辑 topic title 后 main panel title 不同步的 bug——编辑成功后若该 topic 是当前选中项，同步调用 `onSelectTopic` 更新 `selectedTopic` 状态

## 实时翻译 WebSocket

-- [103] [x] 后端：安装 `@fastify/websocket` 插件，在 `index.ts` 中注册
-- [104] [x] 后端：创建 `routes/liveTranslation.ts`，实现 WebSocket 路由 `GET /topics/:topicId/translation/live`（鉴权、连接管理、消息收发框架）

## 实时翻译 WebSocket 前端接入

-- [105] [x] 前端：点击 record 按钮时，建立 WebSocket 连接至 `/topics/:topicId/translation/live`（携带 token），停止录音时关闭连接
-- [106] [x] 前端：录音进行中，通过 MediaRecorder 每 250ms 触发 `ondataavailable`，将 binary chunk 通过 WebSocket 以 binary frame 发送
-- [107] [x] 前端：main panel 文字输入框点击提交时，将文本以 text frame（字符串）通过同一 WebSocket 发送
-- [108] [x] 后端：WebSocket 收到 binary frame 时，拼接 buffer；每 5 秒将累积的 buffer 写入 `backend/public/recorder/` 目录下的一个新音频文件（mp4/webm，文件名含时间戳），写入后清空 buffer
-- [109] [x] 后端：WebSocket 收到 text frame（字符串）时，将文本追加至 `backend/public/message.txt`（目录不存在则自动创建）

## 静音检测断句

-- [110] [x] 前端：在录音过程中，利用 AnalyserNode 实时监测音量，使用相对阈值检测静音（当前音量 < 近 2 秒滑动峰值 × 20%），持续静音超过 1 秒时通过 WebSocket 发送 `{ type: "end_utterance" }` 消息，然后重置计时器
-- [111] [x] 后端：移除 5 秒定时 flush interval；改为收到 `end_utterance` 消息时，将累积的 binary buffer 保存为一个新音频文件并清空 buffer（保留 headerChunk）

-- [112] [x] Bug 修复：VAD 静音检测阈值过严
-- [114] [x] 后端：将音频文件格式从 mp4 改为 wav——修改 `routes/liveTranslation.ts` 中的文件扩展名（`.mp4` → `.webm`）导致 end_utterance 从未触发——所有音频保存为一个文件。修复方案：在相对阈值基础上叠加绝对阈值下限（如 avg < 8 才判定为静音），同时适当提高 VAD_SILENCE_RATIO（如从 0.20 调至 0.35），并在前端添加 console.log 输出 end_utterance 触发日志以便验证

## pending things Start



## pending things End

## AI API 集成

-- [115] [x] 后端：集成 Kimi / Gemini 标准文本 API——在 `backend/.env` 添加 `GEMINI_API_KEY` 和 `KIMI_API_KEY`，安装对应 SDK（`@google/generative-ai`），实现 `aiService.translate(text)` 调用 AI API 进行文本翻译
-- [116] [x] 后端：集成 Gemini Live 实时流式 API——实现流式调用能力，支持逐段返回翻译结果并通过 WebSocket 实时推送至前端

## still think，do not do any item after this line
-- 读取流
我们需要一个预prompt，只输出翻译之后的句子。

当api得到ai api返回的译文，我们需要第一，保存这个结果，同时也发送这个结果给前台。
前台要渲染这个结果

本地向量化FastEmbed



