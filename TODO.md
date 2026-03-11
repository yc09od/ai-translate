

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

## still think，do not do any item after this line


-- 读取流
我们需要api连续的读取音频流
我们需要api来给音频流做断句。
我们需要一个预prompt，只输出翻译之后的句子。
当api断句之后，应该把这一段buffer送给ai api翻译。
当api得到ai api返回的译文，我们需要第一，保存这个结果，同时也发送这个结果给前台。
前台要渲染这个结果

