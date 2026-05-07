import pytest
from pages.home_page import HomePage
from pages.config_page import ConfigPage
from pages.match_page import MatchPage


@pytest.mark.singles
@pytest.mark.smoke
class TestSinglesMode:
    """单打模式测试"""
    
    # 标准测试球员名称
    PLAYER_A = "Atest"
    PLAYER_B = "Btest"
    
    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        """测试前置设置"""
        self.home = HomePage(page)
        self.config = ConfigPage(page)
        self.match = MatchPage(page)
        self.base_url = base_url
        self.home.goto(base_url)
    
    def set_singles_players(self, player_a=None, player_b=None):
        """设置单打球员名称（默认使用标准测试名称）"""
        if player_a is None:
            player_a = self.PLAYER_A
        if player_b is None:
            player_b = self.PLAYER_B
        self.config.set_player_name(0, player_a)
        self.config.set_player_name(1, player_b)
    
    def test_select_singles_mode(self):
        """测试选择单打模式"""
        self.home.verify_home_page_loaded()
        assert self.home.get_title() == "羽毛球计分器"
        
        self.home.select_singles_mode()
        # 验证跳转到配置页
        self.config.wait_for_selector(self.config.PAGE_TITLE)
        assert "单打配置" in self.config.get_text(self.config.PAGE_TITLE)
    
    def test_play_singles_match_basic(self):
        """测试基本单打计分流程"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 配置比赛（使用默认值）
        self.config.configure_singles_match(score=15, deuce=False)
        
        # 验证进入比赛页
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证初始比分
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
        
        # A 队得 3 分
        for _ in range(3):
            self.match.add_point_a()
        
        assert self.match.get_score_a() == 3
        assert self.match.get_score_b() == 0
        
        # B 队得 2 分
        for _ in range(2):
            self.match.add_point_b()
        
        assert self.match.get_score_a() == 3
        assert self.match.get_score_b() == 2
    
    def test_singles_match_end_no_deuce(self):
        """测试不加分模式下比赛结束"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 配置 5 分制，不加分
        self.config.configure_singles_match(score=5, deuce=False)
        
        # A 队得 5 分赢得比赛
        for _ in range(5):
            self.match.add_point_a()
        
        # 验证比赛结束
        self.match.wait_for_game_over()
        assert self.match.is_game_over()
        assert "A队" in self.match.get_winner()
        assert "5 : 0" in self.match.get_final_score()
    
    def test_singles_match_end_with_deuce(self):
        """测试加分模式下比赛结束"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 配置 5 分制，加分
        self.config.configure_singles_match(score=5, deuce=True)
        
        # 交替得分，打到 5:4（避免提前结束）
        for _ in range(4):
            self.match.add_point_a()
            self.match.add_point_b()
        # 现在比分是 4:4
        self.match.add_point_a()  # 5:4
        
        # 此时应该还没结束（需要领先 2 分）
        assert not self.match.is_game_over()
        
        # A 队再得 1 分，6:4，应该结束
        self.match.add_point_a()
        self.match.wait_for_game_over()
        assert self.match.is_game_over()
        assert "6 : 4" in self.match.get_final_score()
    
    def test_restart_match(self):
        """测试重新开始比赛"""
        # 选择单打模式并配置
        self.home.select_singles_mode()
        self.config.configure_singles_match(score=5, deuce=False)
        
        # 进行一些计分
        self.match.add_point_a()
        self.match.add_point_a()
        assert self.match.get_score_a() == 2
        
        # 结束比赛
        for _ in range(3):
            self.match.add_point_a()
        self.match.wait_for_game_over()
        
        # 重新开始
        self.match.restart_match()
        
        # 验证比分重置
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
    
    def test_server_picker_shows_both_players(self):
        """测试发球球员列表能正确展示两位球员"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 设置球员姓名
        self.set_singles_players()
        
        # set_player_name 已经包含了 500ms 的等待，不需要额外等待
        
        # 点击发球选择器
        self.config.click(self.config.SERVER_PICKER)
        self.config.page.wait_for_timeout(1000)
        
        # 获取所有 picker 选项
        items = self.config.page.query_selector_all('.weui-picker__item')
        texts = [item.text_content().strip() for item in items]
        
        print(f"Picker 选项: {texts}")
        
        # 验证包含两位球员（应该是自定义名称）
        assert "Atest" in texts, f"发球列表中未找到 Atest，实际列表: {texts}"
        assert "Btest" in texts, f"发球列表中未找到 Btest，实际列表: {texts}"
        
        # 关闭 picker（点击取消或确定）
        self.config.page.click('text=确定')
        self.config.page.wait_for_timeout(500)
    
    def test_score_and_server_status_update(self):
        """测试比分变更后正确展示两边比分和发球接发球状态"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 配置比赛
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        self.set_singles_players()
        self.config.select_server("Atest")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证初始状态
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
        
        # 验证发球标识存在（Atest 发球）
        assert self.match.is_server_badge_visible(), "发球标识应该可见"
        
        # A 队得 1 分
        self.match.add_point_a()
        
        # 验证比分更新
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 0
        
        # B 队得 1 分
        self.match.add_point_b()
        
        # 验证比分更新
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 1
        
        # 再让 A 队得 2 分
        self.match.add_point_a()
        self.match.add_point_a()
        
        # 验证最终比分
        assert self.match.get_score_a() == 3
        assert self.match.get_score_b() == 1
    
    def test_singles_with_default_names(self):
        """测试不输入信息，使用默认名称的比赛"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 只配置分数和加分规则，不设置球员姓名（使用默认值）
        self.config.set_score_option(5)
        self.config.set_deuce(False)
        
        # 直接选择发球方（使用默认名称的第一个选项）
        self.config.select_server("")  # 空字符串会选择第一个选项
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证可以正常计分
        self.match.add_point_a()
        self.match.add_point_a()
        assert self.match.get_score_a() == 2
        assert self.match.get_score_b() == 0
        
        # 继续完成比赛
        for _ in range(3):
            self.match.add_point_a()
        
        # 验证比赛结束
        self.match.wait_for_game_over()
        assert self.match.is_game_over()
    
    def test_singles_server_is_b(self):
        """测试单打发球方为B的情况"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 配置比赛
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        self.set_singles_players()
        
        # 选择 Btest 作为发球方
        self.config.select_server("Btest")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证初始比分
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
        
        # 验证发球标识存在（Btest 发球）
        assert self.match.is_server_badge_visible(), "发球标识应该可见"
        
        # B 队得 2 分
        self.match.add_point_b()
        self.match.add_point_b()
        
        # 验证比分更新
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 2
        
        # A 队得 1 分
        self.match.add_point_a()
        
        # 验证最终比分
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 2
    
    def test_singles_game_over_history_list(self):
        """测试单打比赛结束后查看得分列表"""
        # 选择单打模式
        self.home.select_singles_mode()
        
        # 配置比赛（5分制，不加分）
        self.config.configure_singles_match(score=5, deuce=False)
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # A队得3分
        for _ in range(3):
            self.match.add_point_a()
        
        # B队得2分
        for _ in range(2):
            self.match.add_point_b()
        
        # A队再得2分，达到5分，比赛结束
        for _ in range(2):
            self.match.add_point_a()
        
        # 等待比赛结束
        self.match.wait_for_game_over()
        assert self.match.is_game_over()
        
        # 验证得分列表
        history_count = self.match.get_history_list_count()
        print(f"得分列表记录数: {history_count}")
        
        # 应该有7条记录（3+2+2=7分）
        assert history_count == 7, f"应该有7条得分记录，实际有: {history_count}"
        
        # 验证第一条记录
        first_entry = self.match.get_history_entry(0)
        print(f"第1条记录: {first_entry}")
        assert first_entry['index'] == "#1"
        assert first_entry['score'] == "1 - 0"
        # 单打模式显示 "A" 或 "B"
        assert first_entry['scorer'] in ["A", "B", "A队", "B队", "Atest", "Btest"], f"单打得分方应该是 A 或 B，实际是: {first_entry['scorer']}"
        
        # 验证最后一条记录
        last_entry = self.match.get_history_entry(6)
        print(f"第7条记录: {last_entry}")
        assert last_entry['index'] == "#7"
        assert last_entry['score'] == "5 - 2"
        assert last_entry['scorer'] in ["A", "B", "A队", "B队", "Atest", "Btest"], f"单打得分方应该是 A 或 B，实际是: {last_entry['scorer']}"
        
        # 获取所有记录并验证
        all_entries = self.match.get_all_history_entries()
        print(f"\n所有得分记录:")
        for entry in all_entries:
            print(f"  {entry['index']}: {entry['score']} - {entry['scorer']}")
        
        assert len(all_entries) == 7
        
        print("\n单打比赛得分列表验证通过！")
