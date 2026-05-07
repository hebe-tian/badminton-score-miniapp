from playwright.sync_api import Page
from .base_page import BasePage


class HomePage(BasePage):
    """首页页面对象"""
    
    # 选择器
    TITLE = ".home-title"
    SUBTITLE = ".home-subtitle"
    SINGLES_BUTTON = ".mode-button >> nth=0"
    DOUBLES_BUTTON = ".mode-button >> nth=1"
    WYLB_BUTTON = ".mode-button >> nth=2"
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    def goto(self, base_url: str):
        """访问首页"""
        # Taro H5 使用 hash 路由
        self.navigate_to(f"{base_url}/#/pages/home/index")
        # 等待页面加载完成
        self.page.wait_for_load_state('networkidle')
        self.wait_for_selector(self.TITLE, timeout=15000)
    
    def get_title(self) -> str:
        """获取页面标题"""
        return self.get_text(self.TITLE)
    
    def select_singles_mode(self):
        """选择单打模式"""
        self.click(self.SINGLES_BUTTON)
    
    def select_doubles_mode(self):
        """选择双打模式"""
        self.click(self.DOUBLES_BUTTON)
    
    def select_wylb_mode(self):
        """选择五羽伦比模式"""
        self.click(self.WYLB_BUTTON)
    
    def verify_home_page_loaded(self):
        """验证首页已加载"""
        assert self.is_visible(self.TITLE), "首页标题未显示"
        assert self.is_visible(self.SUBTITLE), "首页副标题未显示"
        assert self.is_visible(self.SINGLES_BUTTON), "单打按钮未显示"
        assert self.is_visible(self.DOUBLES_BUTTON), "双打按钮未显示"
        assert self.is_visible(self.WYLB_BUTTON), "五羽伦比按钮未显示"
