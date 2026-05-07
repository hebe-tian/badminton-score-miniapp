import os
import pytest
from dotenv import load_dotenv
from playwright.sync_api import Page

# 加载环境变量
load_dotenv('.env.test')

BASE_URL = os.getenv('BASE_URL', 'http://localhost:10086')
TIMEOUT = int(os.getenv('TIMEOUT', '30000'))


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """配置浏览器上下文"""
    return {
        **browser_context_args,
        "viewport": {"width": 375, "height": 667},  # iPhone 尺寸
        "ignore_https_errors": True,
    }


@pytest.fixture(autouse=True)
def setup_page(page: Page):
    """自动设置页面超时和基础 URL"""
    page.set_default_timeout(TIMEOUT)
    page.set_default_navigation_timeout(TIMEOUT)
    yield page


@pytest.fixture(scope="session")
def base_url():
    """提供基础 URL"""
    return BASE_URL
