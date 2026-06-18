# 🏸 羽毛球计分器小程序

<div align="center">

![Taro](https://img.shields.io/badge/Taro-4.2.0-blue)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

一个基于 Taro + React 开发的跨端羽毛球计分应用，支持微信小程序和 H5。

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [使用文档](#-使用文档)

</div>

---

## 📱 功能特性

- **单打模式**：1对1单挑，支持15分或21分制
- **双打模式**：2对2对抗，完整的发球轮换逻辑
- **五羽伦比**：5人接力赛，每10分自动轮换，支持50或100分制
- **多人转**：6-8人轮转双打，自动编排搭档，保证公平性，最终个人总分排名
- **智能计分**：自动处理发球权、接发球员轮换
- **换人提示**：五羽伦比模式下，到达10分倍数时自动提示换人
- **比赛记录**：完整记录得分历史，赛后可查看明细

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm 或 yarn
- 微信开发者工具（用于小程序调试）

### 安装与运行

```bash
# 1. 克隆仓库
git clone <repository-url>
cd badminton-score-miniapp

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev:weapp    # 微信小程序
npm run dev:h5       # H5 版本

# 4. 构建生产版本
npm run build:weapp  # 微信小程序
npm run build:h5     # H5 版本
```

### 使用微信开发者工具

1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目目录：`badminton-score-miniapp/dist`
4. AppID：填写你的小程序 AppID（或使用测试号）
5. 点击"导入"

---

## 📖 使用文档

## 📂 项目结构

```
badminton-score-miniapp/
├── src/
│   ├── pages/
│   │   ├── home/          # 首页 - 模式选择
│   │   ├── config/        # 配置页 - 比赛设置
│   │   ├── match/         # 比赛页 - 计分界面
│   │   └── tools/         # 工具页
│   │       ├── index/     # 工具列表
│   │       └── multi-turn/  # 多人转
│   │           ├── config/   # 多人转配置
│   │           ├── schedule/ # 多人转对阵表
│   │           └── ranking/  # 多人转排名
│   ├── utils/
│   │   ├── types.ts       # 类型定义和工具函数
│   │   ├── multi-turn-types.ts      # 多人转类型定义
│   │   └── multi-turn-algorithm.ts  # 多人转编排算法
│   ├── app.ts             # 应用入口
│   ├── app.config.ts      # 全局配置
│   └── app.css            # 全局样式
├── package.json
└── project.config.json    # 小程序项目配置
```

## 🎯 使用说明

### 1. 选择比赛模式

打开小程序后，在首页选择比赛模式：
- 单打模式
- 双打模式
- 五羽伦比
- 多人转（在工具列表中进入）

### 2. 配置比赛参数

- **比赛分数**：选择目标分数（15分、21分、50分、100分或自定义）
- **赛制选项**：选择是否加分（需要领先2分获胜）
- **球员姓名**：输入双方球员姓名（可选，不填则使用默认名称）
- **发球设置**：选择首发球员和接发球员

### 3. 开始比赛

点击"开始比赛"按钮进入计分界面：
- 点击"A队 +1分"或"B队 +1分"进行计分
- 系统自动处理发球权轮换
- 五羽伦比模式会在每10分时提示换人

### 4. 比赛结束

当一方达到目标分数时：
- 显示获胜方和最终比分
- 展示参赛选手列表
- 展示完整得分历史
- 可选择重新开始或返回主页

## 🛠️ 技术栈

- **框架**：Taro 4.2.0 - 跨端开发框架
- **UI库**：React 18 - 声明式 UI 库
- **语言**：TypeScript 5.0 - 类型安全
- **样式**：CSS (rpx单位) - 响应式设计
- **构建工具**：Vite - 快速的前端构建工具
- **测试框架**：Python3 + Playwright - E2E 自动化测试

---

## 🧪 E2E 测试

本项目包含完整的端到端自动化测试，使用 Python3 + Playwright 测试 H5 版本。

### 快速运行测试

```bash
# 方式一：使用脚本（推荐）
./run_e2e_tests.sh

# 方式二：手动运行
npm run dev:h5          # 终端1: 启动 H5 服务器
cd e2e                  # 终端2: 运行测试
python3 -m pytest tests/ -v
```

### 测试覆盖

- ✅ 单打模式完整流程
- ✅ 双打模式完整流程
- ✅ 五羽伦比模式完整流程
- ✅ 边界情况和异常场景
- ✅ 共 17+ 个自动化测试用例

详细文档请参考：[E2E 测试文档](./e2e/README.md)

---

## 📝 注意事项

1. 本项目使用 Taro 框架，可以编译为微信小程序、H5、支付宝小程序等多端应用
2. 样式使用 rpx 单位，自动适配不同屏幕尺寸（基于750设计稿）
3. 所有页面都经过小程序兼容性优化
4. 数据传递通过 URL 参数实现，避免使用复杂的跨页面状态管理

---


## 📄 License

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件
