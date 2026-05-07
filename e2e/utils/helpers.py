"""
E2E 测试辅助工具函数
"""

import time
from playwright.sync_api import Page


def wait_for_page_load(page: Page, timeout: int = 5000):
    """等待页面加载完成"""
    page.wait_for_load_state('networkidle', timeout=timeout)


def take_screenshot(page: Page, name: str):
    """截图并保存到 screenshots 目录"""
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    filename = f"screenshots/{name}_{timestamp}.png"
    page.screenshot(path=filename)
    print(f"截图已保存: {filename}")


def slow_down(delay: float = 0.5):
    """减慢测试执行速度，便于观察"""
    time.sleep(delay)


def retry_action(action, max_retries: int = 3, delay: float = 1.0):
    """重试执行某个动作"""
    for attempt in range(max_retries):
        try:
            action()
            return True
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(delay)
    return False


def log_step(message: str):
    """记录测试步骤日志"""
    print(f"[STEP] {message}")


def verify_url_contains(page: Page, expected_text: str):
    """验证 URL 包含指定文本"""
    current_url = page.url
    assert expected_text in current_url, f"URL '{current_url}' 不包含 '{expected_text}'"


def count_elements(page: Page, selector: str) -> int:
    """计算页面上匹配选择器的元素数量"""
    elements = page.query_selector_all(selector)
    return len(elements)
