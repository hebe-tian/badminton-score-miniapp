import pytest
from pages.home_page import HomePage
from pages.config_page import ConfigPage
from pages.match_page import MatchPage


@pytest.mark.regression
class TestEdgeCases:
    """边界情况和异常场景测试"""
    
    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        """测试前置设置"""
        self.home = HomePage(page)
        self.config = ConfigPage(page)
        self.match = MatchPage(page)
        self.base_url = base_url
        self.home.goto(base_url)
    
    def test_custom_score(self):
        """测试自定义分数功能"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 选择自定义分数
        self.config.set_score_option(-1)
        self.config.set_custom_score("30")
        self.config.set_deuce(False)
        self.config.set_player_name(0, "A")
        self.config.set_player_name(1, "B")
        self.config.select_server("A")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证可以正常计分
        self.match.add_point_a()
        assert self.match.get_score_a() == 1
    
    def test_no_deuce_mode(self):
        """测试不加分模式"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 配置不加分模式
        self.config.configure_singles_match(score=5, deuce=False)
        
        # 打到 5:4
        for _ in range(5):
            self.match.add_point_a()
        for _ in range(4):
            self.match.add_point_b()
        
        # 不加分模式下，5:4 应该结束比赛
        self.match.wait_for_game_over()
        assert self.match.is_game_over()
        assert "5 : 4" in self.match.get_final_score()
    
    def test_navigate_back_to_home(self):
        """测试从比赛页返回主页"""
        # 选择单打模式并配置
        self.home.select_singles_mode()
        self.config.configure_singles_match(score=5, deuce=False)
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 进行一些计分
        self.match.add_point_a()
        
        # 结束比赛
        for _ in range(4):
            self.match.add_point_a()
        self.match.wait_for_game_over()
        
        # 返回主页
        self.match.go_to_home()
        
        # 验证回到首页
        self.home.wait_for_selector(self.home.TITLE)
        assert self.home.get_title() == "羽毛球计分器"
    
    def test_empty_player_names(self):
        """测试不输入球员姓名时使用默认名称"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 不输入球员姓名，直接配置其他选项
        self.config.set_score_option(5)
        self.config.set_deuce(False)
        self.config.select_server("A")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证可以正常开始比赛
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
    
    def test_quick_scoring(self):
        """测试快速计分功能"""
        # 选择单打模式
        self.home.select_singles_mode()
        self.config.configure_singles_match(score=10, deuce=False)
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 使用 play_until_score 方法快速计分
        self.match.play_until_score(7, 3)
        
        assert self.match.get_score_a() == 7
        assert self.match.get_score_b() == 3
