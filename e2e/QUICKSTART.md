# E2E 测试快速入门指南

## 🚀 5分钟快速开始

### 第一步：安装依赖

```bash
# 安装 Python 依赖
pip3 install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium
```

### 第二步：启动 H5 服务器

在一个终端窗口中运行：

```bash
npm run dev:h5
```

等待服务器启动完成（通常需要 10-20 秒）。

### 第三步：运行测试

在另一个终端窗口中运行：

```bash
cd e2e
python3 -m pytest tests/ -v
```

或者使用自动化脚本（推荐）：

```bash
./run_e2e_tests.sh
```

## 📊 查看测试结果

测试完成后，会在终端显示结果摘要：

```
======================== 17 passed in 45.23s =========================
```

HTML 报告位于：`e2e/reports/report.html`

在浏览器中打开报告：

```bash
open e2e/reports/report.html
```

## 🎯 运行特定测试

### 按测试文件

```bash
# 只运行单打测试
python3 -m pytest tests/test_singles_mode.py -v

# 只运行双打测试
python3 -m pytest tests/test_doubles_mode.py -v
```

### 按标记

```bash
# 冒烟测试（核心功能）
python3 -m pytest -m smoke -v

# 回归测试（边界情况）
python3 -m pytest -m regression -v

# 单打模式
python3 -m pytest -m singles -v

# 双打模式
python3 -m pytest -m doubles -v

# 五羽伦比
python3 -m pytest -m wylb -v
```

### 按单个测试

```bash
# 运行指定的测试函数
python3 -m pytest tests/test_singles_mode.py::TestSinglesMode::test_select_singles_mode -v
```

## 🔍 调试技巧

### 有头模式（显示浏览器）

默认就是有头模式。如果想隐藏浏览器窗口，修改 `pytest.ini`：

```ini
addopts = 
    --headed  # 删除这行或改为 --headless
```

### 减慢执行速度

在测试代码中添加延迟：

```python
import time
time.sleep(2)  # 暂停 2 秒
```

### 查看失败截图

失败的测试会自动截图，保存在：

```bash
ls -la e2e/screenshots/
```

### 详细输出

```bash
python3 -m pytest tests/ -v -s --tb=long
```

## ⚙️ 常用配置

### 修改超时时间

编辑 `.env.test`：

```env
TIMEOUT=60000  # 改为 60 秒
```

### 修改浏览器

编辑 `pytest.ini`：

```ini
addopts = 
    --browser firefox  # 或 webkit
```

### 禁用重试

编辑 `pytest.ini`，删除或注释：

```ini
# --reruns 2
# --reruns-delay 3
```

## 🐛 常见问题

### Q: 找不到元素？

A: 检查以下几点：
1. H5 服务器是否正常运行
2. 选择器是否正确
3. 增加等待时间
4. 使用有头模式观察页面

### Q: 测试失败？

A: 
1. 查看错误信息
2. 检查截图：`e2e/screenshots/`
3. 查看 HTML 报告
4. 尝试重新运行

### Q: 服务器启动失败？

A:
```bash
# 检查端口占用
lsof -i :10086

# 杀死进程
kill -9 <PID>

# 重新启动
npm run dev:h5
```

### Q: Python 依赖安装失败？

A:
```bash
# 升级 pip
pip3 install --upgrade pip

# 重新安装
pip3 install -r requirements.txt
```

## 📚 下一步

1. 阅读完整文档：`e2e/README.md`
2. 了解 Page Object 模式
3. 学习编写新测试
4. 查看实施总结：`e2e/IMPLEMENTATION_SUMMARY.md`

## 💡 提示

- 首次运行建议先运行冒烟测试：`python3 -m pytest -m smoke -v`
- 开发新功能时，同步添加对应的测试用例
- 定期运行完整测试套件，确保没有回归问题
- 使用 CI/CD 自动化运行测试

---

**需要帮助？** 查看 `e2e/README.md` 获取详细文档。
