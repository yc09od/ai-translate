

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
-- [47] [x] 添加api dev 为 http://localhost:60000/oauth/google/callback, route 为/oauth/{oauthProvider}/callback，为了google oauth回调

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
-- [113] [x] Bug 修复：access token 过期时前端直接 logout 而不尝试 refresh——应在 token 过期触发 logout 前，先检查 refresh token 是否有效并尝试换取新 access token；只有 refresh token 也过期（或 refresh 请求失败）时才执行 logout
-- [114] [x] 后端：将音频文件格式从 mp4 改为 wav——修改 `routes/liveTranslation.ts` 中的文件扩展名（`.mp4` → `.webm`）导致 end_utterance 从未触发——所有音频保存为一个文件。修复方案：在相对阈值基础上叠加绝对阈值下限（如 avg < 8 才判定为静音），同时适当提高 VAD_SILENCE_RATIO（如从 0.20 调至 0.35），并在前端添加 console.log 输出 end_utterance 触发日志以便验证

## AI API 集成

-- [115] [x] 后端：集成 Kimi / Gemini 标准文本 API——在 `backend/.env` 添加 `GEMINI_API_KEY` 和 `KIMI_API_KEY`，安装对应 SDK（`@google/generative-ai`），实现 `aiService.translate(text)` 调用 AI API 进行文本翻译
-- [116] [x] 后端：集成 Gemini Live 实时流式 API——实现流式调用能力，支持逐段返回翻译结果并通过 WebSocket 实时推送至前端

## Live 翻譯 AI 集成

-- [117] [x] 後端：創建 `backend/src/config/prompts.ts`，導出音頻翻譯的 pre-prompt（system instruction），要求 AI API 基於語言返回 JSON 格式 `{"o": "<原文>", "t": "<譯文>"}` 且不輸出其他任何內容.
-- [118] [x] 後端：在 `routes/liveTranslation.ts` 的 `end_utterance` 處理中，並發執行文件保存 + 調用 AI API（使用 prompts.ts 的 instructionForLiveAudio）；解析返回的 `{o, t}` JSON，通過 WebSocket 推送翻譯結果至前端；兩個操作互不等待

## 翻譯歷史

-- [119] [x] 後端：`liveTranslation.ts` AI 翻譯成功後，將 `{originalText, translatedText, topicId, userId}` 保存為 TranslationRecord 寫入 MongoDB. 這個保存過程不能阻礙 AI翻譯的進程。意思就是，如果保存的時候，websocket有新的chunk進來。ai 翻譯要同時進行。
-- [120] [x] 前端：Dashboard WebSocket 監聽 `{ type: "translation" }` 消息，實時將 `{original, translated}` 追加到 main panel 展示區域
-- [121] [x] 前端：點擊 sidebar topic 時，調用 `GET /topics/:topicId/translations` 加載歷史翻譯記錄，在 main panel 中渲染歷史列表（之後實時新增的條目繼續追加）

## OT Loading Card 有序揭示

-- [122] [x] 後端：WebSocket 協議擴展——接收 `{ type: "segment_start", segmentId }` 消息，記錄 segmentId 與當前 buffer 的對應關係；翻譯完成後，在 `{ type: "translation" }` 消息中附帶對應的 `segmentId`
-- [123] [x] 前端：每段音頻（VAD end_utterance 觸發前）開始時生成唯一 segmentId，先通過 WebSocket 發送 `{ type: "segment_start", segmentId }`，同時在 main panel 展示區按順序創建 OT loading card（帶馬賽克/skeleton 效果）
-- [124] [x] 前端：實現 OT loading card 有序揭示——後端 translation 消息含 segmentId，前端據此定位 card；即使結果亂序返回，也必須按音頻錄入順序依次揭示（前一段未顯示則排隊等待）
-- [125] [x] Bug 修復：多次說話時只有第一個 OT loading card 的馬賽克效果被正常揭示，後續 card 即使收到翻譯結果也維持馬賽克狀態——排查有序揭示隊列的清空/重置邏輯（pendingQueue、revealedCount 等狀態是否在每次 end_utterance 後正確推進）
-- [126] [x] 前端：展示區自動滾動至底部——每當有新對話 card 追加（實時翻譯或歷史記錄加載完畢）時，自動 scroll to bottom，確保最新內容始終可見

## 翻譯歷史分頁

-- [127] [x] 後端：`GET /topics/:topicId/translations` 支持分頁參數 `limit`（默認 10）和 `before`（timestamp/id，返回此時間點之前的記錄），實現向前翻頁查詢
-- [128] [x] 前端：切換 topic 時默認只加載最近 10 條歷史記錄；若後端返回有更多記錄，在展示區頂部顯示「查看之前十條」和「查看之前所有記錄」兩個按鈕
-- [129] [x] 前端：「查看之前十條」點擊後帶 before 參數請求前一頁並追加到展示區頂部；「查看之前所有記錄」點擊後一次加載全部剩餘記錄並追加到頂部；全部加載完成後隱藏兩個按鈕

## 导出历史为 PDF

-- [130] [x] 前端：安装 `jspdf`，实现 `exportToPdf(topicTitle, records)` 函数，生成含 topic 标题、每条原文/译文及时间戳的 PDF 并触发下载
-- [131] [x] 前端：在 main panel Topic Header 区域添加「导出 PDF」图标按钮；点击后调用 `GET /topics/:topicId/translations?limit=<total>` 加载全部历史，再调用 exportToPdf 下载

## Bug 修復：停止錄音後 Loading Card 未清除

-- [132] [x] 前端：停止錄音時，將 items 中所有仍處於 loading=true 狀態的 OT loading card 強制設為已完成（顯示「翻譯中斷」提示或直接移除），避免永久 skeleton 狀態

## 界面双语化

-- [133] [x] 前端：建立語言字典（`lib/i18n.ts`），定義中文/英文兩套靜態文案，提供 `useLanguage()` hook，將偏好持久化到 localStorage.
-- [134] [x] 前端：將 Sidebar、MainPanel、TopicHeader、BottomInputBar 等組件的靜態文案替換為語言字典引用，實現中英文切換
-- [135] [x] 前端：在 setting button group 中添加「語言/Language」切換選項，點擊後在中文/英文之間切換。初始语言为英文

## Docker 容器化

-- [136] [x] 前端：添加 `frontend/Dockerfile`，multi-stage build（builder 阶段 `next build` 启用 standalone output，runner 阶段基于 `node:alpine` 仅运行 `.next/standalone`）
-- [137] [x] 后端：添加 `backend/Dockerfile`，multi-stage build（builder 阶段 `tsc` 编译，runner 阶段基于 `node:alpine` 仅安装生产依赖 + 运行编译产物）
-- [138] [x] 根目录：添加 `docker-compose.dev.yml`，包含 frontend、backend、mongodb、redis 四个服务，前后端挂载源码支持热更新
-- [139] [x] 根目录：添加 `docker-compose.yml`（Coolify 生产用），仅包含 frontend 和 backend 服务，配置 restart 策略和 healthcheck，环境变量由 Coolify 平台注入

## 隐私政策与服务条款页面

-- [140] [x] 前端：创建 `/policy` 页面，使用 react-markdown（或类似库）渲染 `scaffold/privacy-policy.md` 内容，全页仅显示 Markdown 内容区和左上角 Return 按钮（`router.back()`），无导航栏和侧边栏
-- [141] [x] 前端：创建 `/terms-of-service` 页面，使用 react-markdown（或类似库）渲染 `scaffold/terms-of-service.md` 内容，全页仅显示 Markdown 内容区和左上角 Return 按钮（`router.back()`），无导航栏和侧边栏

## 邀请码与账户激活

-- [142] [x] 后端：创建 `InvitationCode` model（字段：`code` String 唯一索引、`used` Boolean 默认 false），实现 `POST /invitation-codes` 创建邀请码和 `GET /invitation-codes` 查询列表两个路由
-- [143] [x] 后端：`User` model 新增 `active` 字段（Boolean，默认 false）；OAuth 回调逻辑更新：新建用户时 `active` 初始为 false；回调时检查用户 `active` 状态——已激活则正常签发 JWT redirect；未激活则签发短期 tempToken redirect 到 `/login?needActivation=true&tempToken=xxx`
-- [144] [x] 后端：实现 `POST /auth/activate` 路由，接收 `{ code, tempToken }`；验证 tempToken 有效性，再核查邀请码存在且 `used=false`；通过则将用户 `active` 置 true、邀请码 `used` 置 true，签发正式 JWT 返回；失败返回 400 错误
-- [145] [x] 前端：登录页检测 URL 参数 `needActivation=true` 时，右侧区域切换为激活码输入界面（title 改为「激活账户」、展示 input 和提交按钮）；调用 `POST /auth/activate`，失败时 input 变红并显示错误提示，成功时显示提示后 1 秒跳转 `/dashboard`

## 用户角色与权限控制（RBAC）

-- [146] [x] 后端：`User` model 新增 `role` 字段（枚举：`customer | agent | admin`，默认 `customer`）
-- [147] [x] 后端：实现 `requireRole(...roles)` 钩子工厂函数——读取 JWT userId，查询用户 role，不满足则返回 403；供路由 `onRequest` 使用
-- [148] [x] 后端：为 `POST /invitation-codes` 和 `GET /invitation-codes` 两个路由添加 `requireRole('agent', 'admin')` 鉴权

## Admin 管理页

-- [149] [x] 后端：创建 `routes/admin.ts`，实现 `GET /admin/users` 路由，支持 query 参数 `filter`（name/email 模糊搜索，默认 null）、`order`（asc/desc，默认 desc 按 createdAt）、`page`（默认 1）、`pageSize`（默认且最大 15），返回 `{ users, total, page, pageSize }`，添加 `requireRole('admin')` 守卫
-- [150] [x] 后端：在 `routes/admin.ts` 中实现 `PATCH /admin/users/:userId` 路由，仅允许更新 `active` 字段，添加 `requireRole('admin')` 守卫
-- [151] [x] 后端：在 `routes/admin.ts` 中实现 `GET /admin/invitation-codes`（支持 query 参数 `filter`（unused/used/null，默认 unused）、`order`（asc/desc，默认 desc 按 createdAt）、`page`（默认 1）、`pageSize`（默认且最大 15），返回 `{ codes, total, page, pageSize }`）、`POST /admin/invitation-codes`、`PATCH /admin/invitation-codes/:codeId`（切换 `used` 状态）路由，均添加 `requireRole('admin')` 守卫
-- [152] [x] 前端：创建 `/admin` 页面路由，添加 admin 角色鉴权（非 admin 用户重定向至 `/dashboard`）；页面包含顶部 Tab 切换「用户管理」/「激活码管理」
-- [153] [x] 前端：实现用户管理子界面——表格展示 id、name、email、role、active；每行带 Edit 按钮，点击后仅允许切换 active 状态，提交调用 `PATCH /admin/users/:userId`；表格上方提供 filter 输入框（防抖模糊搜索）和 order 排序切换（默认 desc），表格下方提供分页控件（默认 page=1，pageSize=15），filter/order 变化时重置为第 1 页
-- [154] [x] 前端：实现激活码管理子界面——表格展示 code、used 状态及切换按钮；页面顶部添加邀请码输入框 + 提交按钮，调用 `POST /admin/invitation-codes`；每行切换按钮调用 `PATCH /admin/invitation-codes/:codeId`；表格上方提供 filter 下拉（未使用/已使用/全部，默认未使用）和 order 切换（默认 desc），表格下方提供分页控件（默认 page=1，pageSize=15），filter/order 变化时重置为第 1 页

## Admin 页面权限调整与 Filter 功能

-- [155] [x] 后端：更新 admin 路由权限守卫——`GET /admin/users` 和 `PATCH /admin/users/:userId` 改为 `requireRole('agent', 'admin')`；`GET /admin/invitation-codes` 改为 `requireRole('agent', 'admin')`；`POST /admin/invitation-codes` 和 `PATCH /admin/invitation-codes/:codeId` 保持 `requireRole('admin')`
-- [156] [x] 前端：admin 页面（`/admin`）鉴权更新——将 authGuard 改为 `agent` 和 `admin` 均可访问，非这两种角色才重定向至 `/dashboard`
-- [157] [x] 前端：admin 用户管理页面实现 filter 功能——filter 输入框（防抖模糊搜索 name/email）实际连接到 `GET /admin/users?filter=...` API，filter/order 变化时重置分页至第 1 页
-- [158] [x] 前端：admin 激活码管理页面实现 filter 功能——filter 下拉（未使用/已使用/全部，默认未使用）实际连接到 `GET /admin/invitation-codes?filter=...` API，filter/order 变化时重置分页至第 1 页
-- [159] [x] 前端：admin 激活码管理页面按角色控制操作权限——`agent` 用户隐藏「添加邀请码」输入框和每行切换 used 状态按钮；仅 `admin` 显示这些操作入口
