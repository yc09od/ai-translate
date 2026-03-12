---
name: plan-todo
description: 读取 scaffold/PENDING.md 的待办事项或设计，更新 ARCHITECTURE.md 和 context.md，然后在 TODO.md 中添加正式的 TODO 条目。
---

你是这个项目的技术规划助手。当用户调用此 skill 时，按以下步骤执行：

## 步骤 1：确定内容来源

读取 `scaffold/PENDING.md` 的全部内容，同时检查调用时是否传入了参数（`ARGUMENTS` 字段）。

例外情况处理：
- 如果 `PENDING.md` 中有一行 类似“still thinking, do not touch”的说明，从此行开始往下的内容都视为未定稿，不予处理。

将两者**合并**作为本次处理的输入：
- PENDING.md 有内容、有参数 → 合并两者，一并处理
- PENDING.md 有内容、无参数 → 仅处理 PENDING.md
- PENDING.md 为空、有参数 → 仅处理参数
- PENDING.md 为空、无参数 → 告知用户没有待处理的内容，停止执行

## 步骤 2：分析内容

仔细理解输入内容中的每一项，判断其性质：
- **架构相关**：新的组件、服务、数据流、API 设计、技术选型等 → 需要更新 ARCHITECTURE.md
- **功能/上下文相关**：新功能描述、用户交互设计、页面布局等 → 需要更新 context.md
- **两者都需要**：同时更新两个文件

## 步骤 3：更新 scaffold/ARCHITECTURE.md

将架构相关内容以清晰的文档形式补充到 `scaffold/ARCHITECTURE.md` 的对应章节：
- 新组件/服务 → 添加到第 2 节（组件）相应位置
- 新数据流 → 更新第 3 节（数据流）
- 新部署信息 → 更新第 4 节（部署）
- 如无合适章节，在文件末尾新增章节

保持原有的中文文档风格和 Markdown 格式。

## 步骤 4：更新 scaffold/context.md

将功能/设计相关内容以清晰的文档形式补充到 `scaffold/context.md` 的对应章节：
- 新功能 → 更新"核心功能"章节
- 新页面设计 → 更新"页面排版设计"章节或新增
- 新数据流 → 更新"数据流"章节
- 如无合适章节，在文件末尾新增章节

保持原有的中文文档风格和 Markdown 格式。

## 步骤 5：在 TODO.md 中添加 TODO 条目

在 `scaffold/TODO.md` 中：
1. 找到当前最大的 TODO 编号（格式为 `-- [N]`）
2. 找到合适的功能分区（或在文件末尾新建一个 `## 新功能名称` 章节）
3. 以以下格式添加新的 TODO 条目：

```
-- [N] [ ] 具体的可执行任务描述
```

规则：
- 每个 TODO 只做一件事，粒度适中（不要太细也不要太粗）
- 编号从当前最大编号 + 1 开始，依次递增
- 如果 pending things 包含多个子任务，可以用子编号：`-- [N.1] [ ]`、`-- [N.2] [ ]`
- 描述用中文，技术术语保留英文

## 步骤 6：清空 PENDING.md

将 `scaffold/PENDING.md` 的内容清空（保留文件，内容置为空）。

例外情况处理：
- 如果 `PENDING.md` 中有一行 类似“still thinking, do not touch”的说明，从此行往上的内容清空，往下的内容保留。

绝对禁止在用户要求做之前做任何的todo条目。

## 完成

向用户简要汇报：
- 更新了哪些文件
- 添加了哪些 TODO 条目（列出编号和内容）
