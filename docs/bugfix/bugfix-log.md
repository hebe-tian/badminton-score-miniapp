# Bugfix 日志

## Bug-1：多人转人数选择器只显示6-8人

- **日期**：2026-06-24
- **表现**：选择搭档模式后，人数选择器只有6/7/8三个选项，缺少4/5人选项
- **根因**：配置页人数数组硬编码为 `[6, 7, 8]`，之前的编辑未生效
- **方案**：将数组改为 `[4, 5, 6, 7, 8]`
- **修改文件**：`src/pages/tools/multi-turn/config/index.tsx`
- **状态**：已修复

---

## Bug-2：Step 2 返回键回到工具页而非模式选择页

- **日期**：2026-06-24
- **表现**：选择搭档模式后按手机返回键，直接回到工具列表页，无法回到模式选择页
- **根因**：Step 1 和 Step 2 在同一页面通过条件渲染切换，手机返回键触发的是 Taro 页面导航回退，无法回到同一页面的上一步
- **方案**：在 Step 2 顶部添加"返回选择模式"按钮，点击后重置 partnerMode 为 null 回到 Step 1
- **修改文件**：`src/pages/tools/multi-turn/config/index.tsx`、`src/pages/tools/multi-turn/config/index.css`
- **状态**：已修复

---

## Bug-3：开始记分后比赛结束，返回对阵表分数未录入

- **日期**：2026-07-10
- **表现**：使用"开始记分"完成比赛后点击"返回对阵表"，分数仍显示 `? : ?`，需手动点"直接输入分数"才能录入
- **根因**：记分器页面比赛结束时只通过 `Taro.setStorageSync('multiTurnScoreBack')` 写入 Storage，但从未调用 `Taro.eventCenter.emit('multiTurnScoreBack')`，事件监听机制完全失效。同时对阵表页面的 Storage 读取使用 `useEffect`（无依赖数组），闭包中的 `event` 可能过期导致 `setEvent` 用旧数据覆盖，且 `navigateBack()` 回来时 `useEffect` 触发时机不可靠
- **方案**：用 `useDidShow` 生命周期（页面显示时必定触发）替代 `useEffect`，用 `useRef` 保存最新 `event` 避免闭包过期，移除无效的 `Taro.eventCenter` 监听
- **修改文件**：`src/pages/tools/multi-turn/schedule/index.tsx`
- **状态**：已修复

---

## Bug-4：轮次已调整弹窗时机不对（第四次修复）

- **日期**：2026-07-10
- **表现**：修改人数后行内提示始终不出现
- **根因**：前三次修复都试图通过 React 生命周期（useEffect / 渲染期间 ref 对比）检测 `minRounds` 变化来触发提示，但 React/Taro 的批量更新和闭包时序导致条件判断永远失败。核心错误是：把"人数变化→轮次调整→提示"这个同步逻辑放在了异步渲染流程中
- **方案**：放弃所有生命周期方案，直接在 `handlePlayerCountChange` 事件处理函数中完成全部逻辑——计算新的 minRounds、判断是否需要提示、设置状态。这是同步执行的，不依赖任何渲染时序。同时添加 console.log 日志方便排查
- **修改文件**：`src/pages/tools/multi-turn/config/index.tsx`
- **状态**：已修复

---
