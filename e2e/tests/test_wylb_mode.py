import pytest
from pages.home_page import HomePage
from pages.config_page import ConfigPage
from pages.match_page import MatchPage


@pytest.mark.wylb
class TestWYLBMode:
    """五羽伦比模式测试"""
    
    # 标准测试球员名称
    TEAM_A_PLAYERS = [f"Atest{i+1}" for i in range(5)]  # [Atest1, Atest2, Atest3, Atest4, Atest5]
    TEAM_B_PLAYERS = [f"Btest{i+1}" for i in range(5)]  # [Btest1, Btest2, Btest3, Btest4, Btest5]
    
    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        """测试前置设置"""
        self.home = HomePage(page)
        self.config = ConfigPage(page)
        self.match = MatchPage(page)
        self.base_url = base_url
        self.home.goto(base_url)
    
    def set_wylb_players(self, team_a=None, team_b=None):
        """设置五羽伦比球员名称（默认使用标准测试名称）"""
        if team_a is None:
            team_a = self.TEAM_A_PLAYERS
        if team_b is None:
            team_b = self.TEAM_B_PLAYERS
        
        # 设置A队5个球员
        for i in range(5):
            self.config.set_player_name(i, team_a[i])
        # 设置B队5个球员
        for i in range(5):
            self.config.set_player_name(5 + i, team_b[i])
    
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
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        # 设置球员姓名（使用标准测试名称）
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
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
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        # 设置球员姓名（使用标准测试名称）
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
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
        
        # 打到 30 分 - 第三次换人
        for _ in range(10):
            self.match.add_point_a()
        
        assert self.match.is_substitution_modal_visible()
        self.match.close_substitution_modal()
        
        # 打到 40 分 - 第四次换人
        for _ in range(10):
            self.match.add_point_a()
        
        assert self.match.is_substitution_modal_visible()
        self.match.close_substitution_modal()
        
        # 打到 50 分 - 第五次换人，比赛应该结束
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
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(False)
        # 设置球员姓名（使用标准测试名称）
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # A 队得 50 分赢得比赛（不加分模式）
        for _ in range(50):
            self.match.add_point_a()
            
            # 如果比赛已经结束，退出循环
            if self.match.is_game_over():
                break
            
            # 处理换人提示（每 10 分出现一次）
            if self.match.is_substitution_modal_visible():
                self.match.close_substitution_modal()
        
        # 验证比赛结束
        self.match.wait_for_game_over(timeout=10000)
        assert self.match.is_game_over()
        assert "A队" in self.match.get_winner()
    
    def test_wylb_default_player_names(self):
        """测试使用默认球员名称"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛 - 不设置球员姓名，使用默认值
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        # 不设置球员姓名，直接使用默认值 A1-A5, B1-B5
        
        # 选择 A1 发球，B1 接发（默认名称）
        self.config.select_server("A1")
        self.config.select_receiver("B1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证初始比分
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
        
        # 验证发球标记在 A1 上
        assert self.match.is_server_badge_on_player("A1"), "发球标记应该在 A1 上"
        
        # 验证接发标记在 B1 上
        assert self.match.is_receiver_badge_on_player("B1"), "接发标记应该在 B1 上"
        
        # 验证A队位置：左边=A1（双数区），右边=A2（单数区）
        a_left = self.match.get_player_at_position('A', 'left')
        a_right = self.match.get_player_at_position('A', 'right')
        print(f"A队初始位置: 左边={a_left}, 右边={a_right}")
        assert a_left == "A1", f"A队左边应该是 A1（双数区），实际是: {a_left}"
        assert a_right == "A2", f"A队右边应该是 A2（单数区），实际是: {a_right}"
        
        # 验证B队位置：左边=B2（单数区），右边=B1（双数区）
        b_left = self.match.get_player_at_position('B', 'left')
        b_right = self.match.get_player_at_position('B', 'right')
        print(f"B队初始位置: 左边={b_left}, 右边={b_right}")
        assert b_left == "B2", f"B队左边应该是 B2（单数区），实际是: {b_left}"
        assert b_right == "B1", f"B队右边应该是 B1（双数区），实际是: {b_right}"
        
        print("默认球员名称验证通过！")
    
    def test_wylb_server_is_b(self):
        """测试B队发球场景"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        # 设置球员姓名（使用标准测试名称）
        self.set_wylb_players()
        
        # 选择 Btest1 发球，Atest1 接发
        self.config.select_server("Btest1")
        self.config.select_receiver("Atest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证初始比分
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
        
        # 验证发球标记在 Btest1 上
        assert self.match.is_server_badge_on_player("Btest1"), "发球标记应该在 Btest1 上"
        
        # 验证接发标记在 Atest1 上
        assert self.match.is_receiver_badge_on_player("Atest1"), "接发标记应该在 Atest1 上"
        
        # 验证A队位置：左边=Atest1（双数区），右边=Atest2（单数区）
        a_left = self.match.get_player_at_position('A', 'left')
        a_right = self.match.get_player_at_position('A', 'right')
        print(f"A队初始位置: 左边={a_left}, 右边={a_right}")
        assert a_left == "Atest1", f"A队左边应该是 Atest1（双数区），实际是: {a_left}"
        assert a_right == "Atest2", f"A队右边应该是 Atest2（单数区），实际是: {a_right}"
        
        # 验证B队位置：左边=Btest2（单数区），右边=Btest1（双数区）
        b_left = self.match.get_player_at_position('B', 'left')
        b_right = self.match.get_player_at_position('B', 'right')
        print(f"B队初始位置: 左边={b_left}, 右边={b_right}")
        assert b_left == "Btest2", f"B队左边应该是 Btest2（单数区），实际是: {b_left}"
        assert b_right == "Btest1", f"B队右边应该是 Btest1（双数区），实际是: {b_right}"
        
        # B队得分到10分，触发换人
        for _ in range(10):
            self.match.add_point_b()
            if self.match.is_substitution_modal_visible():
                sub_info = self.match.get_substitution_info()
                print(f"10分换人提示: A队下场={sub_info['teamA_out']}, 上场={sub_info['teamA_in']}")
                print(f"10分换人提示: B队下场={sub_info['teamB_out']}, 上场={sub_info['teamB_in']}")
                self.match.close_substitution_modal()
        
        # 验证换人后Btest3发球（领先方新上场球员）
        new_server = self.match.get_server_player_name()
        print(f"换人后发球方: {new_server}")
        assert new_server == "Btest3", f"换人后应该是 Btest3 发球，实际是: {new_server}"
        
        print("B队发球场景验证通过！")
    
    def test_wylb_server_scores_position_change(self):
        """测试发球方得分后位置变化"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证初始状态
        assert self.match.get_server_player_name() == "Atest1"
        assert self.match.get_receiver_player_name() == "Btest1"
        
        # A队得1分（发球方得分）
        self.match.add_point_a()
        
        # 验证比分
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 0
        
        # 验证发球标记仍在 Atest1 上
        assert self.match.is_server_badge_on_player("Atest1"), "发球方得分后，发球标记应仍在 Atest1 上"
        
        # 验证A队位置交换
        a_left_after = self.match.get_player_at_position('A', 'left')
        a_right_after = self.match.get_player_at_position('A', 'right')
        print(f"A队得分后位置: 左边={a_left_after}, 右边={a_right_after}")
        # A队得分后，位置交换：Atest1从左边（双数区）换到右边（单数区）
        assert a_left_after == "Atest2", f"A队得分后左边应该是 Atest2，实际是: {a_left_after}"
        assert a_right_after == "Atest1", f"A队得分后右边应该是 Atest1，实际是: {a_right_after}"
        
        # 验证接发标记转移到对应位置的B队球员
        new_receiver = self.match.get_receiver_player_name()
        print(f"A队得分后，接发方变为: {new_receiver}")
        assert new_receiver in ["Btest1", "Btest2"], f"接发方应该是B队成员，实际是: {new_receiver}"
        
        print("发球方得分位置变化验证通过！")
    
    def test_wylb_receiver_scores_server_transfer(self):
        """测试接发球方得分后发球权转移"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证初始状态
        current_server = self.match.get_server_player_name()
        current_receiver = self.match.get_receiver_player_name()
        print(f"初始状态: {current_server} 发球, {current_receiver} 接发, 比分 0:0")
        
        # B队得1分（接发球方得分）
        self.match.add_point_b()
        
        # 验证比分
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 1
        
        # 验证发球权转移到 B队
        new_server = self.match.get_server_player_name()
        new_receiver = self.match.get_receiver_player_name()
        print(f"接发球方得分后: {new_server} 发球, {new_receiver} 接发, 比分 0:1")
        
        # 发球方应该是 B队成员（根据分数奇偶性决定）
        assert new_server in ["Btest1", "Btest2"], f"发球权应转移到B队，实际是: {new_server}"
        
        # 接发方应该是 A队成员
        assert new_receiver in ["Atest1", "Atest2"], f"接发方应该是A队成员，实际是: {new_receiver}"
        
        # 验证发球方和接发方来自不同队伍
        assert new_server.startswith("B"), f"发球方应该是B队，实际是: {new_server}"
        assert new_receiver.startswith("A"), f"接发方应该是A队，实际是: {new_receiver}"
        
        print("接发球方得分发球权转移验证通过！")
    
    def test_wylb_substitution_details(self):
        """测试换人详情验证"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # A队连续得分到10分
        for _ in range(10):
            self.match.add_point_a()
        
        # 验证出现换人提示
        assert self.match.is_substitution_modal_visible(), "10分时应该出现换人提示"
        
        # 获取换人详情
        sub_info = self.match.get_substitution_info()
        print(f"换人详情:")
        print(f"  A队: 下场={sub_info['teamA_out']}, 上场={sub_info['teamA_in']}")
        print(f"  B队: 下场={sub_info['teamB_out']}, 上场={sub_info['teamB_in']}")
        
        # 验证A队换人信息
        # 五羽伦比换人规则：第10分(period=1)时，outIdx=(1-1)%5=0, inIdx=(1+1)%5=2
        assert sub_info['teamA_out'] == "Atest1", f"A队下场球员应该是 Atest1（索引0），实际是: {sub_info['teamA_out']}"
        assert sub_info['teamA_in'] == "Atest3", f"A队上场球员应该是 Atest3（索引2），实际是: {sub_info['teamA_in']}"
        
        # 验证B队换人信息
        assert sub_info['teamB_out'] == "Btest1", f"B队下场球员应该是 Btest1（索引0），实际是: {sub_info['teamB_out']}"
        assert sub_info['teamB_in'] == "Btest3", f"B队上场球员应该是 Btest3（索引2），实际是: {sub_info['teamB_in']}"
        
        # 关闭换人提示
        self.match.close_substitution_modal()
        
        print("换人详情验证通过！")
    
    def test_wylb_substitution_leading_team_server(self):
        """测试换人后领先队伍的发球球员"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # A队得分到10分（A队领先）
        for _ in range(10):
            self.match.add_point_a()
        
        # 验证出现换人提示
        assert self.match.is_substitution_modal_visible()
        
        # 关闭换人提示
        self.match.close_substitution_modal()
        
        # 验证换人后A队新上场球员（Atest3）发球
        new_server = self.match.get_server_player_name()
        print(f"换人后发球方: {new_server}")
        assert new_server == "Atest3", f"换人后应该是 Atest3 发球（领先方新上场球员），实际是: {new_server}"
        
        # 验证发球标记在 Atest3 上
        assert self.match.is_server_badge_on_player("Atest3"), "发球标记应该在 Atest3 上"
        
        # 验证Atest3在双数区（左边）
        a_left = self.match.get_player_at_position('A', 'left')
        print(f"换人后A队位置: 左边={a_left}")
        assert a_left == "Atest3", f"换人后A队左边应该是 Atest3（双数区），实际是: {a_left}"
        
        print("换人后领先队伍发球球员验证通过！")
    
    def test_wylb_substitution_trailing_team_receiver(self):
        """测试换人后落后队伍的接发球球员"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        # 五羽伦比只有两个选项：50分(nth=0), 100分(nth=1)
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # A队得分到10分（A队领先，B队落后）
        for _ in range(10):
            self.match.add_point_a()
        
        # 验证出现换人提示
        assert self.match.is_substitution_modal_visible()
        
        # 关闭换人提示
        self.match.close_substitution_modal()
        
        # 验证换人后B队新上场球员（Btest3）接发
        new_receiver = self.match.get_receiver_player_name()
        print(f"换人后接发方: {new_receiver}")
        assert new_receiver == "Btest3", f"换人后应该是 Btest3 接发（落后方新上场球员），实际是: {new_receiver}"
        
        # 验证接发标记在 Btest3 上
        assert self.match.is_receiver_badge_on_player("Btest3"), "接发标记应该在 Btest3 上"
        
        # 验证Btest3在双数区（B队右边，因为B队左边是单数区，右边是双数区）
        b_left = self.match.get_player_at_position('B', 'left')
        b_right = self.match.get_player_at_position('B', 'right')
        print(f"换人后B队位置: 左边={b_left}, 右边={b_right}")
        # B队布局：左边=单数区(odd)，右边=双数区(even)
        # Btest3在双数区，所以在右边；Btest2在单数区，所以在左边
        assert b_left == "Btest2", f"换人后B队左边应该是 Btest2（单数区），实际是: {b_left}"
        assert b_right == "Btest3", f"换人后B队右边应该是 Btest3（双数区），实际是: {b_right}"
        
        print("换人后落后队伍接发球球员验证通过！")
    
    def test_wylb_substitution_player_sequence(self):
        """测试50分模式下换人球员序列的正确性"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 定义预期的换人序列（只验证前4次，第5次换人时比赛结束）
        # period=1 (10分): outIdx=0, inIdx=2
        # period=2 (20分): outIdx=1, inIdx=3
        # period=3 (30分): outIdx=2, inIdx=4
        # period=4 (40分): outIdx=3, inIdx=0
        expected_substitutions = [
            {"period": 1, "score": 10, "out_a": "Atest1", "in_a": "Atest3", "out_b": "Btest1", "in_b": "Btest3"},
            {"period": 2, "score": 20, "out_a": "Atest2", "in_a": "Atest4", "out_b": "Btest2", "in_b": "Btest4"},
            {"period": 3, "score": 30, "out_a": "Atest3", "in_a": "Atest5", "out_b": "Btest3", "in_b": "Btest5"},
            {"period": 4, "score": 40, "out_a": "Atest4", "in_a": "Atest1", "out_b": "Btest4", "in_b": "Btest1"},
        ]
        
        for sub in expected_substitutions:
            # 打到指定分数
            current_score = self.match.get_score_a()
            points_needed = sub["score"] - current_score
            for _ in range(points_needed):
                self.match.add_point_a()
            
            # 验证出现换人提示
            assert self.match.is_substitution_modal_visible(), f"{sub['score']}分时应该出现换人提示"
            
            # 获取换人详情
            sub_info = self.match.get_substitution_info()
            print(f"\n{sub['score']}分换人 (period={sub['period']}):")
            print(f"  A队: 下场={sub_info['teamA_out']}, 上场={sub_info['teamA_in']}")
            print(f"  B队: 下场={sub_info['teamB_out']}, 上场={sub_info['teamB_in']}")
            
            # 验证换人信息
            assert sub_info['teamA_out'] == sub["out_a"], f"{sub['score']}分时A队下场球员应该是 {sub['out_a']}，实际是: {sub_info['teamA_out']}"
            assert sub_info['teamA_in'] == sub["in_a"], f"{sub['score']}分时A队上场球员应该是 {sub['in_a']}，实际是: {sub_info['teamA_in']}"
            assert sub_info['teamB_out'] == sub["out_b"], f"{sub['score']}分时B队下场球员应该是 {sub['out_b']}，实际是: {sub_info['teamB_out']}"
            assert sub_info['teamB_in'] == sub["in_b"], f"{sub['score']}分时B队上场球员应该是 {sub['in_b']}，实际是: {sub_info['teamB_in']}"
            
            # 关闭换人提示
            self.match.close_substitution_modal()
        
        # 打到50分，比赛应该结束
        for _ in range(10):
            self.match.add_point_a()
        
        self.match.wait_for_game_over()
        assert self.match.is_game_over(), "50分时比赛应该结束"
        print(f"\n最终比分: {self.match.get_score_a()}:{self.match.get_score_b()}")
        
        print("\n50分模式换人球员序列验证通过！")
    
    def test_wylb_100_score_substitution_sequence(self):
        """测试100分模式下换人球员序列的正确性"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛 - 选择100分选项
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=1")  # 选择100分
        self.config.set_deuce(True)
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 定义预期的换人序列（只验证前9次，第10次换人时比赛结束）
        # period=1-5: outIdx=0-4, inIdx=2,3,4,0,1
        # period=6-9: outIdx=0-3, inIdx=2,3,4,0
        expected_substitutions = [
            {"period": 1, "score": 10, "out_a": "Atest1", "in_a": "Atest3", "out_b": "Btest1", "in_b": "Btest3"},
            {"period": 2, "score": 20, "out_a": "Atest2", "in_a": "Atest4", "out_b": "Btest2", "in_b": "Btest4"},
            {"period": 3, "score": 30, "out_a": "Atest3", "in_a": "Atest5", "out_b": "Btest3", "in_b": "Btest5"},
            {"period": 4, "score": 40, "out_a": "Atest4", "in_a": "Atest1", "out_b": "Btest4", "in_b": "Btest1"},
            {"period": 5, "score": 50, "out_a": "Atest5", "in_a": "Atest2", "out_b": "Btest5", "in_b": "Btest2"},
            {"period": 6, "score": 60, "out_a": "Atest1", "in_a": "Atest3", "out_b": "Btest1", "in_b": "Btest3"},
            {"period": 7, "score": 70, "out_a": "Atest2", "in_a": "Atest4", "out_b": "Btest2", "in_b": "Btest4"},
            {"period": 8, "score": 80, "out_a": "Atest3", "in_a": "Atest5", "out_b": "Btest3", "in_b": "Btest5"},
            {"period": 9, "score": 90, "out_a": "Atest4", "in_a": "Atest1", "out_b": "Btest4", "in_b": "Btest1"},
        ]
        
        for sub in expected_substitutions:
            # 打到指定分数
            current_score = self.match.get_score_a()
            points_needed = sub["score"] - current_score
            for _ in range(points_needed):
                self.match.add_point_a()
            
            # 验证出现换人提示
            assert self.match.is_substitution_modal_visible(), f"{sub['score']}分时应该出现换人提示"
            
            # 获取换人详情
            sub_info = self.match.get_substitution_info()
            print(f"\n{sub['score']}分换人 (period={sub['period']}):")
            print(f"  A队: 下场={sub_info['teamA_out']}, 上场={sub_info['teamA_in']}")
            print(f"  B队: 下场={sub_info['teamB_out']}, 上场={sub_info['teamB_in']}")
            
            # 验证换人信息
            assert sub_info['teamA_out'] == sub["out_a"], f"{sub['score']}分时A队下场球员应该是 {sub['out_a']}，实际是: {sub_info['teamA_out']}"
            assert sub_info['teamA_in'] == sub["in_a"], f"{sub['score']}分时A队上场球员应该是 {sub['in_a']}，实际是: {sub_info['teamA_in']}"
            assert sub_info['teamB_out'] == sub["out_b"], f"{sub['score']}分时B队下场球员应该是 {sub['out_b']}，实际是: {sub_info['teamB_out']}"
            assert sub_info['teamB_in'] == sub["in_b"], f"{sub['score']}分时B队上场球员应该是 {sub['in_b']}，实际是: {sub_info['teamB_in']}"
            
            # 关闭换人提示
            self.match.close_substitution_modal()
        
        # 打到100分，比赛应该结束
        for _ in range(10):
            self.match.add_point_a()
        
        self.match.wait_for_game_over()
        assert self.match.is_game_over(), "100分时比赛应该结束"
        print(f"\n最终比分: {self.match.get_score_a()}:{self.match.get_score_b()}")
        
        print("\n100分模式换人球员序列验证通过！")
    
    def test_wylb_alternating_scores_substitution(self):
        """测试交替得分后的换人逻辑"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(True)
        self.set_wylb_players()
        
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # A队和B队交替得分到10分（A:5, B:5）
        for i in range(5):
            self.match.add_point_a()
            self.match.add_point_b()
        
        # 验证比分
        assert self.match.get_score_a() == 5
        assert self.match.get_score_b() == 5
        
        # 继续交替得分，让B队领先到10分（A:5, B:10）
        for _ in range(5):
            self.match.add_point_b()
        
        # 验证比分
        assert self.match.get_score_a() == 5
        assert self.match.get_score_b() == 10
        
        # 验证出现换人提示
        assert self.match.is_substitution_modal_visible(), "10分时应该出现换人提示"
        
        # 获取换人详情
        sub_info = self.match.get_substitution_info()
        print(f"\n10分换人（B队领先）:")
        print(f"  A队: 下场={sub_info['teamA_out']}, 上场={sub_info['teamA_in']}")
        print(f"  B队: 下场={sub_info['teamB_out']}, 上场={sub_info['teamB_in']}")
        
        # 验证换人信息（period=1: outIdx=0, inIdx=2）
        assert sub_info['teamA_out'] == "Atest1", f"A队下场球员应该是 Atest1，实际是: {sub_info['teamA_out']}"
        assert sub_info['teamA_in'] == "Atest3", f"A队上场球员应该是 Atest3，实际是: {sub_info['teamA_in']}"
        assert sub_info['teamB_out'] == "Btest1", f"B队下场球员应该是 Btest1，实际是: {sub_info['teamB_out']}"
        assert sub_info['teamB_in'] == "Btest3", f"B队上场球员应该是 Btest3，实际是: {sub_info['teamB_in']}"
        
        # 关闭换人提示
        self.match.close_substitution_modal()
        
        # 验证换人后B队新上场球员（Btest3）发球（因为B队领先）
        new_server = self.match.get_server_player_name()
        new_receiver = self.match.get_receiver_player_name()
        print(f"换人后: {new_server} 发球, {new_receiver} 接发")
        
        # B队领先，所以B队新上场球员发球
        assert new_server == "Btest3", f"换人后应该是 Btest3 发球（B队领先），实际是: {new_server}"
        assert new_receiver == "Atest3", f"换人后应该是 Atest3 接发，实际是: {new_receiver}"
        
        print("\n交替得分后换人逻辑验证通过！")
    
    def test_wylb_game_over_history_list(self):
        """测试五羽伦比比赛结束后查看得分列表"""
        # 选择五羽伦比模式
        self.home.select_wylb_mode()
        
        # 配置比赛（50分制，不加分）
        self.config.click(f"{self.config.SCORE_OPTIONS} >> nth=0")  # 选择50分
        self.config.set_deuce(False)
        self.set_wylb_players()
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # A队连续得分直到50分，比赛结束
        for i in range(50):
            self.match.add_point_a()
            
            # 如果比赛已经结束，退出循环
            if self.match.is_game_over():
                break
            
            # 处理换人提示（每10分出现一次）
            if self.match.is_substitution_modal_visible():
                self.match.close_substitution_modal()
        
        # 等待比赛结束
        self.match.wait_for_game_over()
        assert self.match.is_game_over()
        
        # 验证最终比分
        final_score_a = self.match.get_score_a()
        final_score_b = self.match.get_score_b()
        print(f"最终比分: {final_score_a}:{final_score_b}")
        assert final_score_a == 50, f"A队应该得到50分，实际是: {final_score_a}"
        assert final_score_b == 0, f"B队应该是0分，实际是: {final_score_b}"
        
        # 验证得分列表
        history_count = self.match.get_history_list_count()
        print(f"得分列表记录数: {history_count}")
        
        # 应该有50条记录（50分）
        assert history_count == 50, f"应该有50条得分记录，实际有: {history_count}"
        
        # 验证第一条记录
        first_entry = self.match.get_history_entry(0)
        print(f"第1条记录: {first_entry}")
        assert first_entry['index'] == "#1"
        assert first_entry['score'] == "1 - 0"
        # 五羽伦比应该显示具体球员名称
        assert "Atest" in first_entry['scorer'], f"五羽伦比应显示球员名称，实际是: {first_entry['scorer']}"
        
        # 验证最后一条记录
        last_entry = self.match.get_history_entry(49)
        print(f"第50条记录: {last_entry}")
        assert last_entry['index'] == "#50"
        assert last_entry['score'] == "50 - 0"
        assert "Atest" in last_entry['scorer'], f"五羽伦比应显示球员名称，实际是: {last_entry['scorer']}"
        
        # 获取所有记录并验证
        all_entries = self.match.get_all_history_entries()
        print(f"\n所有得分记录（前5条和后5条）:")
        for entry in all_entries[:5]:
            print(f"  {entry['index']}: {entry['score']} - {entry['scorer']}")
        print("  ...")
        for entry in all_entries[-5:]:
            print(f"  {entry['index']}: {entry['score']} - {entry['scorer']}")
        
        assert len(all_entries) == 50
        
        # 验证五羽伦比得分记录包含具体球员名称
        for entry in all_entries:
            scorer = entry['scorer']
            # 五羽伦比模式下，应该显示球员名称
            assert "Atest" in scorer or "Btest" in scorer, f"五羽伦比得分记录应包含球员名称，实际是: {scorer}"
        
        print("\n五羽伦比比赛得分列表验证通过！")
