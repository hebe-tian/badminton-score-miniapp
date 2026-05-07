from playwright.sync_api import Page


class BasePage:
    """页面对象基类，封装通用操作"""
    
    def __init__(self, page: Page):
        self.page = page
    
    def click(self, selector: str):
        """点击元素"""
        self.page.click(selector)
    
    def fill(self, selector: str, text: str):
        """填充输入框"""
        self.page.fill(selector, text)
    
    def get_text(self, selector: str) -> str:
        """获取元素文本"""
        return self.page.text_content(selector)
    
    def is_visible(self, selector: str) -> bool:
        """检查元素是否可见"""
        return self.page.is_visible(selector)
    
    def wait_for_selector(self, selector: str, timeout: int = 10000):
        """等待元素出现"""
        self.page.wait_for_selector(selector, timeout=timeout)
    
    def take_screenshot(self, name: str):
        """截图"""
        self.page.screenshot(path=f"screenshots/{name}.png")
    
    def navigate_to(self, url: str):
        """导航到指定 URL"""
        self.page.goto(url)
