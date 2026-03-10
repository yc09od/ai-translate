

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
-- [25] [ ] 重新设计原文译文。所有的原文译文放在一个容器里。垂直方向紧凑一些。
-- [26] [ ] 添加record按钮效果，当录音时，icon变为文字recording
-- [27] [ ] 原文（语音识别结果）展示区域 + 译文展示区域 添加5px margin-top
