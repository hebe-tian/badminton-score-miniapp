#!/bin/bash

# E2E 测试运行脚本

set -e

echo "========================================="
echo "羽毛球计分器 E2E 测试"
echo "========================================="

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python3，请先安装 Python3"
    exit 1
fi

# 检查 pip 是否安装
if ! command -v pip3 &> /dev/null; then
    echo "错误: 未找到 pip3，请先安装 pip3"
    exit 1
fi

echo ""
echo "步骤 1: 安装 Python 依赖..."
pip3 install -r requirements.txt

echo ""
echo "步骤 2: 安装 Playwright 浏览器..."
playwright install chromium

echo ""
echo "步骤 3: 启动 H5 开发服务器..."
# 在后台启动 H5 服务器
npm run dev:h5 &
SERVER_PID=$!

# 等待服务器启动
echo "等待 H5 服务器启动..."
sleep 10

# 检查服务器是否正常运行
if curl -s http://localhost:10086 > /dev/null; then
    echo "✓ H5 服务器已启动"
else
    echo "✗ H5 服务器启动失败"
    kill $SERVER_PID
    exit 1
fi

echo ""
echo "步骤 4: 运行 E2E 测试..."
cd e2e

# 运行 pytest
python3 -m pytest tests/ -v --tb=short

TEST_EXIT_CODE=$?

cd ..

echo ""
echo "步骤 5: 关闭 H5 服务器..."
kill $SERVER_PID

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "========================================="
    echo "✓ 所有测试通过！"
    echo "========================================="
    echo ""
    echo "测试报告位于: e2e/reports/report.html"
    echo "失败截图位于: e2e/screenshots/"
else
    echo "========================================="
    echo "✗ 部分测试失败"
    echo "========================================="
    echo ""
    echo "测试报告位于: e2e/reports/report.html"
    echo "失败截图位于: e2e/screenshots/"
fi

exit $TEST_EXIT_CODE
