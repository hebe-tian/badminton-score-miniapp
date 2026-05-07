import pytest
from pages.home_page import HomePage
from pages.config_page import ConfigPage
from pages.match_page import MatchPage


@pytest.mark.wylb
class TestWYLBMode:
    """五羽伦比模式测试"""
    
    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        """测试前置设置"""
        self.home = HomePage(page)
        self.config = ConfigPage(page)
        self.match = MatchPage(page)
        self.base_url = base_url
        self.home.goto(base_url)
    
    def test_select_wylb_mode(self):
        """测试选择五羽伦比模式"""
        self.home.select_wylb_mode()
        self.config.wait_for_selector(self.config.PAGE_TITLE)
        assert "五羽伦比配置" in self.config.get_text(self.config.PAGE_TITLE)
    
    def test_wylb_substitution_at_10(self):
        """测试到达 10 分时出现换人提示"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        self.config.set_score_option(50)
        self.config.set_deuce(True)
        # 设置球员姓名（5个）
        for i in range(5):
            self.config.set_player_name(i, f"A{i+1}")
        for i in range(5):
            self.config.set_player_name(5 + i, f"B{i+1}")
        
        self.config.select_server("A1")
        self.config.select_receiver("B1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 快速打到 10 分
        for _ in range(10):
            self.match.add_point_a()
        
        # 验证出现换人提示
        assert self.match.is_substitution_modal_visible()
        
        # 关闭提示继续比赛
        self.match.close_substitution_modal()
        
        # 验证可以继续计分
        self.match.add_point_a()
        assert self.match.get_score_a() == 11
    
    def test_wylb_multiple_substitutions(self):
        """测试多次换人流程"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        self.config.set_score_option(50)
        self.config.set_deuce(True)
        # 设置球员姓名
        for i in range(5):
            self.config.set_player_name(i, f"A{i+1}")
        for i in range(5):
            self.config.set_player_name(5 + i, f"B{i+1}")
        
        self.config.select_server("A1")
        self.config.select_receiver("B1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 打到 10 分 - 第一次换人
        for _ in range(10):
            self.match.add_point_a()
        
        assert self.match.is_substitution_modal_visible()
        self.match.close_substitution_modal()
        
        # 打到 20 分 - 第二次换人
        for _ in range(10):
            self.match.add_point_a()
        
        assert self.match.is_substitution_modal_visible()
        self.match.close_substitution_modal()
        
        # 打到 50 分 - 第三次换人，比赛应该结束
        for _ in range(10):
            self.match.add_point_a()
        
        # 验证比赛结束（50:0，达到目标分数且领先2分以上）
        self.match.wait_for_game_over()
        assert self.match.is_game_over()
    
    def test_wylb_match_end(self):
        """测试五羽伦比比赛结束"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置小分数以便快速测试（不加分模式）
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        # 设置球员姓名
        for i in range(5):
            self.config.set_player_name(i, f"A{i+1}")
        for i in range(5):
            self.config.set_player_name(5 + i, f"B{i+1}")
        
        self.config.select_server("A1")
        self.config.select_receiver("B1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # A 队得 15 分赢得比赛（不加分模式）
        for _ in range(15):
            self.match.add_point_a()
            
            # 处理换人提示（每 10 分出现一次）
            if self.match.is_substitution_modal_visible():
                self.match.close_substitution_modal()
        
        # 验证比赛结束
        self.match.wait_for_game_over(timeout=10000)
        assert self.match.is_game_over()
        assert "A队" in self.match.get_winner()
