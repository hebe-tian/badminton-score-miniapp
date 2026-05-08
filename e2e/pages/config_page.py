from playwright.sync_api import Page
from .base_page import BasePage


class ConfigPage(BasePage):
    """配置页页面对象"""
    
    # 选择器
    PAGE_TITLE = ".config-title"
    SCORE_OPTIONS = ".score-option"
    CUSTOM_SCORE_INPUT = ".custom-score-input"
    DEUCE_OPTION_YES = ".deuce-option >> nth=0"
    DEUCE_OPTION_NO = ".deuce-option >> nth=1"
    PLAYER_INPUTS = ".player-input"
    SERVER_PICKER = ".picker-value >> nth=0"
    RECEIVER_PICKER = ".picker-value >> nth=1"
    START_BUTTON = ".start-button.valid"
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    def set_score_option(self, score: int):
        """设置比赛分数"""
        if score in [15, 21]:
            # 标准选项：15分(nth=0), 21分(nth=1), 自定义(nth=2)
            if score == 15:
                self.click(f"{self.SCORE_OPTIONS} >> nth=0")
            elif score == 21:
                self.click(f"{self.SCORE_OPTIONS} >> nth=1")
        else:
            # 非标准分数（如 5, 50, 100 等），使用自定义输入
            print(f"  [Config] 点击自定义分数选项...")
            self.click(f"{self.SCORE_OPTIONS} >> nth=2")  # 点击“自定义”选项
            # 自动输入自定义分数
            self.set_custom_score(str(score))
    
    def set_custom_score(self, score: str):
        """设置自定义分数 - 使用 JavaScript 直接操作 DOM（兼容 H5）"""
        # 等待输入框出现
        print(f"  [Config] 等待自定义输入框出现...")
        self.wait_for_selector(self.CUSTOM_SCORE_INPUT, timeout=3000)
        
        # 使用 JavaScript 设置值并触发 input 事件（兼容 Taro H5 的 taro-input-core）
        print(f"  [Config] 设置自定义分数为: {score}")
        self.page.evaluate(f"""
            () => {{
                const input = document.querySelector('.custom-score-input');
                if (input) {{
                    // 对于 taro-input-core，需要设置 value 属性
                    input.value = '{score}';
                    // 同时尝试设置内部 input 元素
                    const innerInput = input.querySelector('input') || input;
                    innerInput.value = '{score}';
                    // 触发 input 事件，模拟用户输入
                    const event = new Event('input', {{ bubbles: true }});
                    innerInput.dispatchEvent(event);
                    // 也触发 change 事件
                    const changeEvent = new Event('change', {{ bubbles: true }});
                    innerInput.dispatchEvent(changeEvent);
                }}
            }}
        """)
        
        # 等待一下让 React 状态更新
        self.page.wait_for_timeout(500)
        print(f"  [Config] 自定义分数设置完成")
    
    def set_deuce(self, enabled: bool):
        """设置是否加分"""
        if enabled:
            self.click(self.DEUCE_OPTION_YES)
        else:
            self.click(self.DEUCE_OPTION_NO)
    
    def set_player_name(self, index: int, name: str):
        """设置球员姓名 - 使用 fill 方法输入到内部 input 元素"""
        # Taro 的 Input 组件渲染为 <taro-input-core>，内部包含真实的 <input>
        # 需要选择内部的 input 元素才能使用 fill
        input_selector = f"{self.PLAYER_INPUTS} >> nth={index} >> input"
        
        try:
            # 先滚动到输入框位置，确保可见
            self.page.evaluate(f"""
                () => {{
                    const inputs = document.querySelectorAll('.player-input');
                    if (inputs && inputs[{index}]) {{
                        inputs[{index}].scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                    }}
                }}
            """)
            self.page.wait_for_timeout(300)
            
            # 使用 fill 方法直接填充到内部的 input 元素
            self.fill(input_selector, name)
            
        except Exception as e:
            print(f"  [Config] fill 方法失败: {e}")
            raise
        
        # 等待 React 状态更新
        self.page.wait_for_timeout(500)
    
    def select_server(self, server_text: str):
        """选择发球球员 - 根据文本选择对应选项"""
        self.click(self.SERVER_PICKER)
        # 等待 picker 弹出
        self.page.wait_for_timeout(1000)
        
        # 查找包含指定文本的选项
        items = self.page.query_selector_all('.weui-picker__item')
        clicked = False
        
        # 如果提供了文本，查找匹配的选项
        if server_text:
            for item in items:
                text = item.text_content().strip()
                if server_text in text:
                    box = item.bounding_box()
                    if box:
                        center_x = box['x'] + box['width'] / 2
                        center_y = box['y'] + box['height'] / 2
                        self.page.mouse.click(center_x, center_y)
                        clicked = True
                        break
        
        # 如果没有找到匹配的或文本为空，点击第一个
        if not clicked and items:
            first_item = items[0]
            box = first_item.bounding_box()
            if box:
                center_x = box['x'] + box['width'] / 2
                center_y = box['y'] + box['height'] / 2
                self.page.mouse.click(center_x, center_y)
        
        # 等待一下让选择生效
        self.page.wait_for_timeout(300)
        
        # 点击确定按钮 - 使用更精确的选择器，找到可见的Picker中的确定按钮
        # Taro Picker 的确定按钮在 .weui-picker 内部
        visible_picker = None
        all_pickers = self.page.query_selector_all('.weui-picker')
        for picker in all_pickers:
            if picker.is_visible():
                visible_picker = picker
                break
        
        if visible_picker:
            # 在这个可见的Picker中查找确定按钮
            confirm_btn = visible_picker.query_selector('text=确定')
            if confirm_btn:
                confirm_btn.click()
            else:
                # 如果找不到，尝试全局查找可见的确定按钮
                all_confirms = self.page.query_selector_all('text=确定')
                for btn in all_confirms:
                    if btn.is_visible():
                        btn.click()
                        break
        else:
            # 如果没有找到可见的Picker，使用原来的方法
            confirm_btn = self.page.locator('text=确定').first
            if confirm_btn.is_visible():
                confirm_btn.click()
        
        # 等待 picker 关闭
        self.page.wait_for_timeout(500)
    
    def select_receiver(self, receiver_text: str):
        """选择接发球员 - 根据文本选择对应选项"""
        self.click(self.RECEIVER_PICKER)
        # 等待 picker 弹出
        self.page.wait_for_timeout(1000)
        
        # 查找包含指定文本的选项
        items = self.page.query_selector_all('.weui-picker__item')
        clicked = False
        
        # 如果提供了文本，查找匹配的选项
        if receiver_text:
            for item in items:
                text = item.text_content().strip()
                if receiver_text in text:
                    box = item.bounding_box()
                    if box:
                        center_x = box['x'] + box['width'] / 2
                        center_y = box['y'] + box['height'] / 2
                        self.page.mouse.click(center_x, center_y)
                        clicked = True
                        break
        
        # 如果没有找到匹配的或文本为空，点击第一个
        if not clicked and items:
            first_item = items[0]
            box = first_item.bounding_box()
            if box:
                center_x = box['x'] + box['width'] / 2
                center_y = box['y'] + box['height'] / 2
                self.page.mouse.click(center_x, center_y)
        
        # 等待一下让选择生效
        self.page.wait_for_timeout(300)
        
        # 点击确定按钮 - 使用更精确的选择器，找到可见的Picker中的确定按钮
        # Taro Picker 的确定按钮在 .weui-picker 内部
        visible_picker = None
        all_pickers = self.page.query_selector_all('.weui-picker')
        for picker in all_pickers:
            if picker.is_visible():
                visible_picker = picker
                break
        
        if visible_picker:
            # 在这个可见的Picker中查找确定按钮
            confirm_btn = visible_picker.query_selector('text=确定')
            if confirm_btn:
                confirm_btn.click()
            else:
                # 如果找不到，尝试全局查找可见的确定按钮
                all_confirms = self.page.query_selector_all('text=确定')
                for btn in all_confirms:
                    if btn.is_visible():
                        btn.click()
                        break
        else:
            # 如果没有找到可见的Picker，使用原来的方法
            confirm_btn = self.page.locator('text=确定').first
            if confirm_btn.is_visible():
                confirm_btn.click()
        
        # 等待 picker 关闭
        self.page.wait_for_timeout(500)
    
    def start_match(self):
        """开始比赛"""
        self.click(self.START_BUTTON)
    
    def configure_singles_match(self, score=21, deuce=True, player_a="Atest", player_b="Btest", server="Atest"):
        """快速配置单打比赛（使用标准测试名称）"""
        self.set_score_option(score)
        self.set_deuce(deuce)
        self.set_player_name(0, player_a)
        self.set_player_name(1, player_b)
        # 选择发球方
        self.select_server(server)
        self.start_match()
