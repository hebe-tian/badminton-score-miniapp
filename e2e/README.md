# E2E 测试文档

## 📋 概述

本项目使用 Python3 + Playwright 进行端到端（E2E）自动化测试，主要测试羽毛球计分器小程序的 H5 版本。

## 🏗️ 项目结构

```
e2e/
├── tests/                    # 测试用例
│   ├── test_singles_mode.py  # 单打模式测试
│   ├── test_doubles_mode.py  # 双打模式测试
│   ├── test_wylb_mode.py     # 五羽伦比测试
│   └── test_edge_cases.py    # 边界情况测试
├── pages/                    # Page Object 页面对象
│   ├── base_page.py          # 基础页面对象
│   ├── home_page.py          # 首页页面对象
│   ├── config_page.py        # 配置页页面对象
│   └── match_page.py         # 比赛页页面对象
├── fixtures/                 # 测试数据
├── utils/                    # 工具函数
├── reports/                  # 测试报告（自动生成）
├── screenshots/              # 失败截图（自动生成）
├── conftest.py              # pytest 配置
└── pytest.ini               # pytest 配置文件
```

## 🚀 快速开始

### 环境要求

- Python 3.7+
- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium
```

### 运行测试

#### 方式一：使用脚本（推荐）

```bash
./run_e2e_tests.sh
```

该脚本会自动：
1. 安装 Python 依赖
2. 安装 Playwright 浏览器
3. 启动 H5 开发服务器
4. 运行所有 E2E 测试
5. 生成测试报告
6. 关闭服务器

#### 方式二：手动运行

```bash
# 终端 1: 启动 H5 开发服务器
npm run dev:h5

# 等待服务器启动后，在终端 2 运行测试
cd e2e
python3 -m pytest tests/ -v
```

### 运行特定测试

```bash
# 只运行单打模式测试
python3 -m pytest tests/test_singles_mode.py -v

# 只运行冒烟测试
python3 -m pytest -m smoke -v

# 只运行回归测试
python3 -m pytest -m regression -v

# 运行指定标记的测试
python3 -m pytest -m singles -v
```

## 📊 测试报告

测试完成后，会在 `e2e/reports/` 目录下生成 HTML 格式的测试报告：

```bash
open e2e/reports/report.html
```

报告包含：
- 测试通过/失败统计
- 每个测试的执行时间
- 失败用例的截图
- 详细的错误信息

## 🎯 测试覆盖

### 单打模式 (test_singles_mode.py)
- ✅ 选择单打模式
- ✅ 基本计分流程
- ✅ 不加分模式比赛结束
- ✅ 加分模式比赛结束
- ✅ 重新开始比赛

### 双打模式 (test_doubles_mode.py)
- ✅ 选择双打模式
- ✅ 双打计分流程
- ✅ 双打比赛结束
- ⏳ 发球轮换逻辑（待完善）

### 五羽伦比 (test_wylb_mode.py)
- ✅ 选择五羽伦比模式
- ✅ 10 分换人提示
- ✅ 多次换人流程
- ✅ 比赛结束

### 边界情况 (test_edge_cases.py)
- ✅ 自定义分数
- ✅ 不加分模式
- ✅ 返回主页
- ✅ 空球员姓名
- ✅ 快速计分

## 🔧 配置说明

### 环境变量 (.env.test)

```env
BASE_URL=http://localhost:10086    # H5 测试服务器地址
BROWSER=chromium                    # 浏览器类型
HEADLESS=true                       # 是否无头模式
TIMEOUT=30000                       # 超时时间（毫秒）
TAKE_SCREENSHOTS=on_failure         # 截图策略
```

### pytest 配置 (pytest.ini)

```ini
[pytest]
addopts = 
    --headed                        # 显示浏览器窗口
    --browser chromium              # 使用 Chromium 浏览器
    --screenshot only-on-failure    # 仅在失败时截图
    --video retain-on-failure       # 仅在失败时保留视频
    --html=reports/report.html      # 生成 HTML 报告
    --reruns 2                      # 失败重试 2 次
    --reruns-delay 3                # 重试间隔 3 秒
```

## 📝 编写新测试

### Page Object 模式

所有页面对象都继承自 `BasePage`，位于 `e2e/pages/` 目录：

```python
from pages.base_page import BasePage

class MyPage(BasePage):
    # 定义选择器
    MY_BUTTON = ".my-button"
    
    def click_my_button(self):
        self.click(self.MY_BUTTON)
```

### 编写测试用例

```python
import pytest
from pages.home_page import HomePage
from pages.config_page import ConfigPage
from pages.match_page import MatchPage

@pytest.mark.smoke
class TestMyFeature:
    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        self.home = HomePage(page)
        self.config = ConfigPage(page)
        self.match = MatchPage(page)
        self.base_url = base_url
        self.home.goto(base_url)
    
    def test_my_feature(self):
        # 测试逻辑
        pass
```

### 常用断言

```python
# 验证元素可见
assert self.match.is_visible(selector)

# 验证文本内容
assert "期望文本" in self.match.get_text(selector)

# 验证数值
assert self.match.get_score_a() == 5

# 验证状态
assert self.match.is_game_over()
```

## 🐛 调试技巧

### 有头模式运行

修改 `pytest.ini` 或使用命令行参数：

```bash
python3 -m pytest tests/ --headed -v
```

### 添加断点

在测试代码中添加：

```python
import time
time.sleep(5)  # 暂停 5 秒观察页面
```

### 查看截图和 видео

失败测试的截图和视频保存在：
- 截图: `e2e/screenshots/`
- 视频: `e2e/test-results/`

### 详细日志

```bash
python3 -m pytest tests/ -v -s --tb=long
```

## ⚠️ 常见问题

### 1. 服务器启动失败

```bash
# 检查端口是否被占用
lsof -i :10086

# 杀死占用端口的进程
kill -9 <PID>
```

### 2. 元素找不到

- 检查选择器是否正确
- 增加等待时间
- 使用 `wait_for_selector` 确保元素加载

### 3. 测试不稳定

- 增加重试次数：修改 `pytest.ini` 中的 `--reruns`
- 增加超时时间：修改 `.env.test` 中的 `TIMEOUT`
- 使用显式等待代替固定等待

### 4. Picker 选择器问题

微信小程序的 Picker 组件在 H5 中可能表现不同，需要根据实际情况调整选择器。

## 🔄 CI/CD 集成

### GitHub Actions 示例

创建 `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: |
        npm install
        pip install -r requirements.txt
        playwright install chromium
    
    - name: Build H5
      run: npm run build:h5
    
    - name: Run E2E tests
      run: |
        npm run dev:h5 &
        sleep 10
        cd e2e
        python3 -m pytest tests/ -v
```

## 📚 参考资料

- [Playwright Python 文档](https://playwright.dev/python/)
- [pytest 文档](https://docs.pytest.org/)
- [Page Object 模式](https://martinfowler.com/bliki/PageObject.html)

## 🤝 贡献指南

1. 新增功能时同步添加测试用例
2. 保持测试代码简洁清晰
3. 使用有意义的测试名称
4. 添加适当的注释和文档
5. 确保测试独立且可重复执行

## 📞 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
