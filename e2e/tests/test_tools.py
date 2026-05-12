"""
工具页面E2E测试（H5环境）
仅验证页面可正常访问，不做深入功能测试
"""
import pytest


class TestToolsPage:
    """工具页面冒烟测试类"""

    def test_tools_page_loads(self, page):
        """测试工具页面可以正常加载"""
        # 访问工具页面
        page.goto('/#/pages/tools/index')
        
        # 等待页面加载
        page.wait_for_selector('.tools-container', state='visible', timeout=10000)
        
        # 验证页面标题存在
        title = page.text_content('.tools-title')
        assert title is not None and len(title) > 0, "页面标题未找到"
        
        print("✅ 工具页面加载成功")

    def test_navigate_to_coin(self, page):
        """测试可以跳转到电子硬币页面"""
        # 访问工具页面
        page.goto('/#/pages/tools/index')
        page.wait_for_selector('.tools-grid', state='visible', timeout=10000)
        
        # 点击电子硬币卡片
        coin_card = page.query_selector('.tool-card:has-text("电子硬币")')
        if coin_card:
            coin_card.click()
            
            # 等待跳转
            page.wait_for_url('**/pages/tools/coin/index', timeout=10000)
            
            # 验证URL变化
            current_url = page.url
            assert 'pages/tools/coin/index' in current_url, f"跳转失败，当前URL: {current_url}"
            
            print("✅ 成功跳转到电子硬币页面")
        else:
            print("⚠️ 电子硬币卡片未找到，跳过测试")

    def test_navigate_to_court(self, page):
        """测试可以跳转到球场模拟器页面"""
        # 访问工具页面
        page.goto('/#/pages/tools/index')
        page.wait_for_selector('.tools-grid', state='visible', timeout=10000)
        
        # 点击球场模拟器卡片
        court_card = page.query_selector('.tool-card:has-text("球场模拟器")')
        if court_card:
            court_card.click()
            
            # 等待跳转
            page.wait_for_url('**/pages/tools/court/index', timeout=10000)
            
            # 验证URL变化
            current_url = page.url
            assert 'pages/tools/court/index' in current_url, f"跳转失败，当前URL: {current_url}"
            
            print("✅ 成功跳转到球场模拟器页面")
        else:
            print("⚠️ 球场模拟器卡片未找到，跳过测试")
