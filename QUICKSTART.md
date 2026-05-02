# 🚀 快速开始

## 立即使用

### 1️⃣ 确认开发服务器正在运行

如果还没有启动，运行：

```bash
cd /Users/linleil/Downloads/mini/badminton-score-miniapp
npm run dev:weapp
```

看到以下输出表示成功：
```
✓ 109 modules transformed.
built in 5854ms.
```

### 2️⃣ 打开微信开发者工具

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 安装并打开
3. 选择"小程序项目" → "+"

### 3️⃣ 导入项目

填写以下信息：

- **项目目录**: `/Users/linleil/Downloads/mini/badminton-score-miniapp/dist`
- **AppID**: 选择"测试号"（或填入你的 AppID）
- **项目名称**: 羽毛球计分器
- **开发模式**: 小程序
- **后端服务**: 不使用云服务

点击"确定"

### 4️⃣ 开始调试

- 在左侧模拟器中查看效果
- 点击顶部"预览"生成二维码
- 用手机微信扫码真机测试

## 📱 功能演示

### 首页
- 显示三种比赛模式
- 点击任意模式进入配置页

### 配置页
- 设置比赛分数（15/21/50/100或自定义）
- 选择是否加分
- 输入球员姓名（可选）
- 选择发球和接发球员

### 比赛页
- 显示双方球员和比分
- 点击按钮计分
- 自动处理发球轮换
- 五羽伦比自动提示换人
- 比赛结束显示统计

## 🔧 常用命令

```bash
# 开发模式（带热更新）
npm run dev:weapp

# 生产构建（压缩优化）
NODE_ENV=production npm run build:weapp

# H5 版本
npm run dev:h5

# 其他平台
npm run dev:alipay    # 支付宝小程序
npm run dev:tt        # 字节小程序
npm run dev:swan      # 百度小程序
```

## 📂 重要文件

- `src/pages/home/index.tsx` - 首页代码
- `src/pages/config/index.tsx` - 配置页代码
- `src/pages/match/index.tsx` - 比赛页代码
- `src/utils/types.ts` - 类型定义
- `src/app.config.ts` - 全局配置

## ⚠️ 注意事项

1. **每次修改代码后**，Taro 会自动重新编译
2. **微信开发者工具**需要手动点击"编译"刷新
3. **dist 目录**是编译输出，不要直接修改
4. **源码在 src 目录**，所有修改都在 src 进行

## 🐛 遇到问题？

### 编译失败
```bash
# 清理缓存
rm -rf dist node_modules/.cache
npm install
npm run dev:weapp
```

### 页面空白
- 检查微信开发者工具控制台
- 确认 dist 目录有文件
- 重新编译项目

### 样式不对
- 确认使用 rpx 单位
- 检查 CSS 文件是否正确引入
- 清除微信开发者工具缓存

## 📚 更多文档

- [README.md](./README.md) - 项目介绍
- [DEPLOY.md](./DEPLOY.md) - 部署指南
- [MIGRATION.md](./MIGRATION.md) - 迁移总结

## 🎉 开始吧！

现在你可以在微信开发者工具中看到你的羽毛球计分器小程序了！

有任何问题随时查阅文档或重新运行上述命令。
