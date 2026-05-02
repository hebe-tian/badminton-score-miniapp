# 项目文件清单

## 📁 完整目录结构

```
badminton-score-miniapp/
│
├── 📄 配置文件
│   ├── package.json              # 项目配置和依赖管理
│   ├── tsconfig.json             # TypeScript 配置
│   ├── babel.config.js           # Babel 转译配置
│   ├── project.config.json       # 微信小程序项目配置
│   ├── .editorconfig             # 编辑器配置
│   ├── .eslintrc                 # ESLint 代码检查配置
│   ├── stylelint.config.mjs      # StyleLint 样式检查配置
│   ├── commitlint.config.mjs     # Commit 信息检查配置
│   └── .gitignore                # Git 忽略文件配置
│
├── 📄 环境配置
│   ├── .env.development          # 开发环境变量
│   ├── .env.production           # 生产环境变量
│   └── .env.test                 # 测试环境变量
│
├── 📄 文档
│   ├── README.md                 # 项目介绍和快速开始 ⭐
│   ├── OVERVIEW.md               # 项目概览和技术架构
│   ├── CONTRIBUTING.md           # 开发指南和贡献规范
│   ├── DEPLOY.md                 # 部署指南
│   ├── MIGRATION.md              # Web到小程序迁移总结
│   ├── QUICKSTART.md             # 5分钟快速上手
│   └── LICENSE                   # MIT 许可证
│
├── 📂 src/                       # 源代码目录
│   ├── pages/                    # 页面目录
│   │   ├── home/                 # 首页 - 模式选择
│   │   │   ├── index.tsx         # 页面组件
│   │   │   ├── index.css         # 页面样式
│   │   │   └── index.config.ts   # 页面配置
│   │   │
│   │   ├── config/               # 配置页 - 比赛设置
│   │   │   ├── index.tsx         # 页面组件
│   │   │   ├── index.css         # 页面样式
│   │   │   └── index.config.ts   # 页面配置
│   │   │
│   │   └── match/                # 比赛页 - 计分界面 ⭐核心
│   │       ├── index.tsx         # 页面组件（~500行）
│   │       ├── index.css         # 页面样式（~570行）
│   │       └── index.config.ts   # 页面配置
│   │
│   ├── utils/                    # 工具函数
│   │   └── types.ts              # 类型定义和工具函数
│   │
│   ├── app.ts                    # 应用入口
│   ├── app.config.ts             # 全局配置（路由、窗口设置）
│   └── app.css                   # 全局样式
│
├── 📂 config/                    # Taro 构建配置
│   ├── index.ts                  # 基础配置
│   ├── dev.ts                    # 开发环境配置
│   └── prod.ts                   # 生产环境配置
│
├── 📂 types/                     # TypeScript 类型定义
│   └── global.d.ts               # 全局类型声明
│
├── 📂 dist/                      # 编译输出目录（不提交到Git）
│   ├── app.js                    # 小程序入口
│   ├── app.json                  # 小程序配置
│   ├── app.wxss                  # 全局样式
│   ├── pages/                    # 编译后的页面
│   ├── taro.js                   # Taro 运行时
│   └── ...                       # 其他编译产物
│
├── 📂 node_modules/              # 依赖包（不提交到Git）
│
├── 📂 .husky/                    # Git Hooks
│   ├── _/                        # Husky 内部文件
│   └── pre-commit                # 提交前钩子
│
└── 📂 .swc/                      # SWC 缓存（不提交到Git）
    └── plugins/                  # SWC 插件
```

## 🎯 核心文件说明

### 1. 业务逻辑文件

| 文件路径 | 说明 | 行数 | 重要性 |
|---------|------|------|--------|
| `src/pages/match/index.tsx` | 比赛页面主逻辑，包含计分、轮换、换人等核心功能 | ~500 | ⭐⭐⭐⭐⭐ |
| `src/pages/config/index.tsx` | 配置页面，处理用户输入和表单验证 | ~200 | ⭐⭐⭐⭐ |
| `src/pages/home/index.tsx` | 首页，模式选择 | ~80 | ⭐⭐⭐ |
| `src/utils/types.ts` | 类型定义和工具函数 | ~60 | ⭐⭐⭐⭐ |

### 2. 样式文件

| 文件路径 | 说明 | 行数 |
|---------|------|------|
| `src/pages/match/index.css` | 比赛页面样式，包含球员头像、比分显示、按钮等 | ~570 |
| `src/pages/config/index.css` | 配置页面样式，表单布局 | ~180 |
| `src/pages/home/index.css` | 首页样式，模式卡片 | ~90 |
| `src/app.css` | 全局基础样式 | ~30 |

### 3. 配置文件

| 文件路径 | 说明 |
|---------|------|
| `src/app.config.ts` | 全局配置，定义页面路由、窗口样式等 |
| `config/index.ts` | Taro 基础构建配置 |
| `config/dev.ts` | 开发环境特定配置 |
| `config/prod.ts` | 生产环境特定配置 |
| `project.config.json` | 微信小程序项目配置（AppID、项目名称等） |

## 📊 代码统计

### TypeScript 文件

```
src/pages/match/index.tsx      ~500 行
src/pages/config/index.tsx     ~200 行
src/pages/home/index.tsx        ~80 行
src/utils/types.ts              ~60 行
src/app.ts                      ~20 行
src/app.config.ts               ~20 行
----------------------------------------
总计                           ~880 行
```

### CSS 文件

```
src/pages/match/index.css      ~570 行
src/pages/config/index.css     ~180 行
src/pages/home/index.css        ~90 行
src/app.css                     ~30 行
----------------------------------------
总计                           ~870 行
```

### 配置文件

```
package.json                    ~80 行
tsconfig.json                   ~30 行
config/*.ts                     ~100 行
其他配置文件                    ~50 行
----------------------------------------
总计                           ~260 行
```

### 文档

```
README.md                      ~130 行
OVERVIEW.md                    ~230 行
CONTRIBUTING.md                ~250 行
DEPLOY.md                      ~150 行
MIGRATION.md                   ~200 行
QUICKSTART.md                  ~120 行
LICENSE                         ~20 行
----------------------------------------
总计                          ~1100 行
```

## 🔍 关键功能分布

### 计分逻辑
- **位置**: `src/pages/match/index.tsx` (第 105-200 行)
- **函数**: `addPoint()`
- **功能**: 
  - 分数累加
  - 发球权轮换
  - 站位管理
  - 历史记录

### 双打站位系统
- **位置**: `src/pages/match/index.tsx` (第 120-185 行)
- **状态**: `positions`
- **功能**:
  - 单双数区管理
  - 位置交换逻辑
  - 接发球员匹配

### 五羽伦比换人
- **位置**: `src/pages/match/index.tsx` (第 195-290 行)
- **触发条件**: 每10分
- **功能**:
  - 自动检测换人节点
  - 新上场球员站位
  - 发球/接发关系调整

### 比赛结束判定
- **位置**: `src/pages/match/index.tsx` (第 310-340 行)
- **条件**: 
  - 达到目标分数
  - 加分规则（领先2分）

## 📦 依赖包分类

### 核心依赖

```json
{
  "@tarojs/components": "UI组件库",
  "@tarojs/react": "React渲染器",
  "@tarojs/runtime": "运行时",
  "@tarojs/taro": "Taro API",
  "react": "React核心",
  "react-dom": "React DOM"
}
```

### 开发依赖

```json
{
  "@tarojs/cli": "Taro命令行工具",
  "@types/react": "React类型定义",
  "typescript": "TypeScript编译器",
  "vite": "构建工具",
  "@playwright/test": "E2E测试框架"
}
```

### 工具依赖

```json
{
  "class-variance-authority": "样式变体管理",
  "clsx": "条件类名合并",
  "tailwind-merge": "Tailwind类名合并",
  "lucide-react": "图标库"
}
```

## 🚀 Git 提交建议

### 首次提交

```bash
git init
git add .
git commit -m "feat: initial commit - 羽毛球计分器小程序 v1.0.0"
```

### 后续提交规范

```bash
# 新功能
git commit -m "feat: 添加混合双打模式"

# Bug修复
git commit -m "fix: 修复五羽伦比换人逻辑错误"

# 文档更新
git commit -m "docs: 更新部署文档"

# 重构
git commit -m "refactor: 优化计分逻辑性能"

# 样式调整
git commit -m "style: 调整按钮样式和间距"

# 测试相关
git commit -m "test: 添加计分逻辑单元测试"
```

## 💡 维护建议

### 定期检查

1. **依赖更新**: 每月检查一次依赖包更新
2. **代码审查**: 每次 PR 前进行代码审查
3. **性能监控**: 关注首屏加载时间和包体积
4. **兼容性测试**: 在不同设备上测试

### 备份策略

1. **Git 远程仓库**: 推送到 GitHub/GitLab
2. **分支保护**: 保护 main/master 分支
3. **标签管理**: 每个版本打 tag
4. **定期备份**: 重要数据云端备份

### 文档维护

1. **及时更新**: 功能变更后同步更新文档
2. **示例代码**: 提供可运行的示例
3. **截图演示**: 添加 UI 截图或 GIF
4. **FAQ**: 收集常见问题并解答
