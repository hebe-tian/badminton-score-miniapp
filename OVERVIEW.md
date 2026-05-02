# 项目概览

## 📊 项目信息

- **项目名称**：羽毛球计分器小程序
- **版本**：1.0.0
- **技术栈**：Taro 4.2.0 + React 18 + TypeScript
- **支持平台**：微信小程序、H5
- **许可证**：MIT

## 🎯 核心功能

### 1. 三种比赛模式

| 模式 | 说明 | 特点 |
|------|------|------|
| 单打 | 1对1单挑 | 简单直接，支持15/21分制 |
| 双打 | 2对2对抗 | 完整的发球轮换逻辑，单双数区站位 |
| 五羽伦比 | 5人接力赛 | 每10分自动换人，支持50/100分制 |

### 2. 智能计分系统

- ✅ 自动处理发球权轮换
- ✅ 双打模式单双数区站位管理
- ✅ 五羽伦比换人提示和自动轮换
- ✅ 加分规则（需要领先2分获胜）
- ✅ 完整的得分历史记录

### 3. 用户体验

- 🎨 清晰的可视化界面
- 📱 响应式设计，适配各种屏幕
- ⚡ 流畅的交互动画
- 🔔 关键时刻提示（换人、比赛结束）

## 🏗️ 架构设计

### 页面结构

```
Home (首页)
  ├─ 选择比赛模式
  └─ 跳转到 Config
  
Config (配置页)
  ├─ 设置比赛参数
  ├─ 输入球员姓名
  ├─ 选择发球员
  └─ 跳转到 Match
  
Match (比赛页)
  ├─ 显示比分和球员
  ├─ 计分操作
  ├─ 自动处理轮换
  └─ 比赛结束显示结果
```

### 数据流

```typescript
// 1. 用户配置
MatchConfig = {
  mode: 'singles' | 'doubles' | 'wylb',
  targetScore: number,
  deuce: boolean,
  teamA: string[],
  teamB: string[],
  serverTeam: 'A' | 'B',
  serverIndex: number,
  receiverIndex: number
}

// 2. 比赛状态
State = {
  scoreA: number,
  scoreB: number,
  serverTeam: 'A' | 'B',
  serverIndex: number,
  receiverIndex: number,
  positions: { A: {}, B: {} },  // 站位信息
  history: MatchHistoryEntry[]
}

// 3. 历史记录
MatchHistoryEntry = {
  scoreA: number,
  scoreB: number,
  scorer: 'A' | 'B',
  scorers?: string[],  // 得分时的场上球员
  note?: string
}
```

## 📁 关键文件说明

### 核心业务逻辑

| 文件 | 说明 | 行数 |
|------|------|------|
| `src/pages/match/index.tsx` | 比赛页面主逻辑 | ~500行 |
| `src/pages/config/index.tsx` | 配置页面逻辑 | ~200行 |
| `src/pages/home/index.tsx` | 首页逻辑 | ~80行 |
| `src/utils/types.ts` | 类型定义和工具函数 | ~60行 |

### 样式文件

| 文件 | 说明 | 行数 |
|------|------|------|
| `src/pages/match/index.css` | 比赛页面样式 | ~570行 |
| `src/pages/config/index.css` | 配置页面样式 | ~180行 |
| `src/pages/home/index.css` | 首页样式 | ~90行 |
| `src/app.css` | 全局样式 | ~30行 |

### 配置文件

| 文件 | 说明 |
|------|------|
| `src/app.config.ts` | 全局配置（路由、窗口设置） |
| `config/index.ts` | Taro 基础配置 |
| `config/dev.ts` | 开发环境配置 |
| `config/prod.ts` | 生产环境配置 |
| `project.config.json` | 微信小程序配置 |

## 🔑 核心算法

### 1. 双打发球轮换

```typescript
// 发球方得分
if (scoringTeam === serverTeam) {
  // 发球方交换位置（单双数区互换）
  // 接发球员根据发球方当前位置匹配
}

// 接发球方得分
else {
  // 双方位置不变
  // 根据新分数奇偶性决定发球员
  // 接发球员根据发球方位置匹配
}
```

### 2. 五羽伦比换人

```typescript
// 每10分触发换人
if (leadingScore > 0 && leadingScore % 10 === 0) {
  const period = leadingScore / 10
  const outIdx = (period - 1) % 5  // 下场球员
  const inIdx = (period + 1) % 5   // 上场球员
  
  // 领先队伍的新上场选手到双数区发球
  // 落后队伍的新上场选手到双数区接发球
}
```

### 3. 站位系统

```
A队（上方）                    B队（下方）
┌──────┬──────┐              ┌──────┬──────┐
│ 双数 │ 单数 │              │ 单数 │ 双数 │
│  区  │  区  │              │  区  │  区  │
└──────┴──────┘              └──────┴──────┘
     虚线分隔                      虚线分隔
```

## 📈 性能指标

- **首屏加载时间**：< 1s（小程序）
- **包体积**：~230KB（压缩后）
- **页面切换**：流畅无卡顿
- **内存占用**：< 50MB

## 🧪 测试覆盖

### 单元测试（计划中）

- [ ] 计分逻辑测试
- [ ] 发球轮换测试
- [ ] 换人逻辑测试
- [ ] 比赛结束判定测试

### E2E 测试（计划中）

- [ ] 完整比赛流程测试
- [ ] 边界情况测试
- [ ] 跨端兼容性测试

## 🚀 部署方式

### 微信小程序

1. 运行 `npm run build:weapp`
2. 使用微信开发者工具打开 `dist` 目录
3. 上传代码并提交审核

### H5

1. 运行 `npm run build:h5`
2. 部署 `dist` 目录到任意静态服务器
3. 通过浏览器访问

## 📚 相关文档

- [README.md](./README.md) - 项目介绍和快速开始
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 开发指南和贡献规范
- [DEPLOY.md](./DEPLOY.md) - 详细部署步骤
- [MIGRATION.md](./MIGRATION.md) - 从 Web 到小程序的迁移总结
- [QUICKSTART.md](./QUICKSTART.md) - 5分钟快速上手

## 🔄 更新日志

### v1.0.0 (2026-05-02)

- ✅ 初始版本发布
- ✅ 支持单打、双打、五羽伦比三种模式
- ✅ 完整的计分和轮换逻辑
- ✅ 单双数区站位系统
- ✅ 得分明细展示
- ✅ 跨端支持（微信小程序 + H5）

## 💡 未来规划

- [ ] 添加更多比赛模式（如混合双打）
- [ ] 支持自定义规则
- [ ] 添加比赛统计和分析
- [ ] 支持多语言
- [ ] 云端同步比赛记录
- [ ] 添加音效和震动反馈
