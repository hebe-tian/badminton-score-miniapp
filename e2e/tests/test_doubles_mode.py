import pytest
from pages.home_page import HomePage
from pages.config_page import ConfigPage
from pages.match_page import MatchPage


@pytest.mark.doubles
class TestDoublesMode:
    """双打模式测试"""
    
    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        """测试前置设置"""
        self.home = HomePage(page)
        self.config = ConfigPage(page)
        self.match = MatchPage(page)
        self.base_url = base_url
        self.home.goto(base_url)
    
    def test_select_doubles_mode(self):
        """测试选择双打模式"""
        self.home.select_doubles_mode()
        self.config.wait_for_selector(self.config.PAGE_TITLE)
        assert "双打配置" in self.config.get_text(self.config.PAGE_TITLE)
    
    def test_play_doubles_match(self):
        """测试双打计分流程"""
        # 选择双打模式
        self.home.select_doubles_mode()
        
        # 配置比赛
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        # 设置球员姓名
        self.config.set_player_name(0, "A1")
        self.config.set_player_name(1, "A2")
        self.config.set_player_name(2, "B1")
        self.config.set_player_name(3, "B2")
        # 选择发球和接发球员
        self.config.select_server("A1")
        self.config.select_receiver("B1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证初始状态
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
        
        # 验证发球标识存在
        assert self.match.is_server_badge_visible()
        
        # 进行计分
        self.match.add_point_a()
        self.match.add_point_b()
        
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 1
    
    def test_doubles_match_end(self):
        """测试双打比赛结束"""
        # 选择双打模式
        self.home.select_doubles_mode()
        
        # 配置小分数以便快速测试（使用自定义 5 分）
        self.config.set_score_option(5)  # 会自动使用自定义输入
        self.config.set_deuce(False)
        self.config.set_player_name(0, "A1")
        self.config.set_player_name(1, "A2")
        self.config.set_player_name(2, "B1")
        self.config.set_player_name(3, "B2")
        self.config.select_server("A1")
        self.config.select_receiver("B1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # A 队得 5 分赢得比赛（不加分模式，达到 5 分即结束）
        for _ in range(5):
            self.match.add_point_a()
        
        # 验证比赛结束
        self.match.wait_for_game_over()
        assert self.match.is_game_over()
        assert "A队" in self.match.get_winner()
    
    def test_doubles_initial_server_receiver_status(self):
        """测试初始发球/接发球状态"""
        # 选择双打模式
        self.home.select_doubles_mode()
        
        # 配置比赛
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        self.config.set_player_name(0, "Atest1")
        self.config.set_player_name(1, "Atest2")
        self.config.set_player_name(2, "Btest1")
        self.config.set_player_name(3, "Btest2")
        
        # 选择 Atest1 发球，Btest1 接发
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 验证初始比分
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
        
        # 验证发球标记在 Atest1 上
        assert self.match.is_server_badge_on_player("Atest1"), "发球标记应该在 Atest1 上"
        assert not self.match.is_server_badge_on_player("Atest2"), "发球标记不应该在 Atest2 上"
        
        # 验证接发标记在 Btest1 上
        assert self.match.is_receiver_badge_on_player("Btest1"), "接发标记应该在 Btest1 上"
        assert not self.match.is_receiver_badge_on_player("Btest2"), "接发标记不应该在 Btest2 上"
        
        # 验证位置：A队左边是双数区，右边是单数区
        left_player_a = self.match.get_player_at_position('A', 'left')
        right_player_a = self.match.get_player_at_position('A', 'right')
        print(f"A队位置: 左边={left_player_a}, 右边={right_player_a}")
        
        # Atest1 是发球员，应该在双数区（A队左边）
        assert left_player_a == "Atest1", f"Atest1 应该在 A队左边（双数区），实际在: {left_player_a}"
        
        # Btest1 是接发球员，应该在双数区（B队右边）
        left_player_b = self.match.get_player_at_position('B', 'left')
        right_player_b = self.match.get_player_at_position('B', 'right')
        print(f"B队位置: 左边={left_player_b}, 右边={right_player_b}")
        assert right_player_b == "Btest1", f"Btest1 应该在 B队右边（双数区），实际在: {right_player_b}"
    
    def test_doubles_server_scores_position_change(self):
        """测试发球方得分后位置变化"""
        # 选择双打模式
        self.home.select_doubles_mode()
        
        # 配置比赛
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        self.config.set_player_name(0, "Atest1")
        self.config.set_player_name(1, "Atest2")
        self.config.set_player_name(2, "Btest1")
        self.config.set_player_name(3, "Btest2")
        
        # 选择 Atest1 发球，Btest1 接发
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 初始状态验证
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 0
        assert self.match.is_server_badge_on_player("Atest1")
        assert self.match.is_receiver_badge_on_player("Btest1")
        
        # A队（发球方）得分
        self.match.add_point_a()
        
        # 验证比分更新
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 0
        
        # 验证发球标记仍在 Atest1 上（发球方不变）
        assert self.match.is_server_badge_on_player("Atest1"), "发球方得分后，发球标记应该仍在 Atest1 上"
        
        # 验证位置变化：A队球员交换位置
        left_player_a = self.match.get_player_at_position('A', 'left')
        right_player_a = self.match.get_player_at_position('A', 'right')
        print(f"A队得分后位置: 左边={left_player_a}, 右边={right_player_a}")
        
        # Atest1 从双数区（左）交换到单数区（右）
        assert right_player_a == "Atest1", f"Atest1 应该交换到 A队右边（单数区），实际在: {right_player_a}"
        assert left_player_a == "Atest2", f"Atest2 应该交换到 A队左边（双数区），实际在: {left_player_a}"
        
        # 验证接发标记转移到对应位置的 B队球员
        receiver_after = self.match.get_receiver_player_name()
        print(f"A队得分后，接发方变为: {receiver_after}")
        
        # 接发方应该是 B队成员
        assert receiver_after in ["Btest1", "Btest2"], f"接发方应该是 B队成员，实际是: {receiver_after}"
        
        # 验证接发标记在正确的球员上
        assert self.match.is_receiver_badge_on_player(receiver_after), f"接发标记应该在 {receiver_after} 上"
        
        # 验证 B队位置：接发方应该在单数区（B队左边）
        left_player_b = self.match.get_player_at_position('B', 'left')
        right_player_b = self.match.get_player_at_position('B', 'right')
        print(f"B队位置: 左边={left_player_b}({self.match.is_receiver_badge_on_player(left_player_b)}), 右边={right_player_b}({self.match.is_receiver_badge_on_player(right_player_b)})")
        
        # 接发方应该在 B队左边（单数区）
        assert self.match.is_receiver_badge_on_player(left_player_b), f"接发标记应该在 B队左边（单数区）的球员上"
    
    def test_doubles_receiver_scores_server_transfer(self):
        """测试接发球方得分后发球权转移"""
        # 选择双打模式
        self.home.select_doubles_mode()
        
        # 配置比赛
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        self.config.set_player_name(0, "Atest1")
        self.config.set_player_name(1, "Atest2")
        self.config.set_player_name(2, "Btest1")
        self.config.set_player_name(3, "Btest2")
        
        # 选择 Atest1 发球，Btest1 接发
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # 先让 A队得 1 分，使比分为 1:0
        self.match.add_point_a()
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 0
        
        # B队（接发球方）得分
        self.match.add_point_b()
        
        # 验证比分更新
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 1
        
        # 验证发球权转移到 B队
        new_server = self.match.get_server_player_name()
        new_receiver = self.match.get_receiver_player_name()
        print(f"接发球方得分后: {new_server} 发球, {new_receiver} 接发")
        
        # 发球方应该是 B队成员
        assert new_server in ["Btest1", "Btest2"], f"发球权应转移到 B队，实际是: {new_server}"
        assert new_server.startswith("B"), f"发球方应该是 B队，实际是: {new_server}"
        
        # 接发方应该是 A队成员
        assert new_receiver in ["Atest1", "Atest2"], f"接发方应该是 A队成员，实际是: {new_receiver}"
        assert new_receiver.startswith("A"), f"接发方应该是 A队，实际是: {new_receiver}"
        
        # 验证发球标记在新发球方上
        assert self.match.is_server_badge_on_player(new_server), f"发球标记应该在 {new_server} 上"
        
        # 验证接发标记在新接发方上
        assert self.match.is_receiver_badge_on_player(new_receiver), f"接发标记应该在 {new_receiver} 上"
        
        # 验证位置：分数为 1（单数），发球方应该在单数区
        # B队布局：左边是单数区，右边是双数区
        left_player_b = self.match.get_player_at_position('B', 'left')
        right_player_b = self.match.get_player_at_position('B', 'right')
        print(f"B队位置: 左边={left_player_b}, 右边={right_player_b}")
        
        # 发球方应该在 B队左边（单数区）
        assert self.match.is_server_badge_on_player(left_player_b), f"分数为单数时，发球标记应该在 B队左边（单数区）的球员上"
    
    def test_doubles_consecutive_scores_rotation(self):
        """测试连续得分的轮换逻辑"""
        # 选择双打模式
        self.home.select_doubles_mode()
        
        # 配置比赛
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        self.config.set_player_name(0, "Atest1")
        self.config.set_player_name(1, "Atest2")
        self.config.set_player_name(2, "Btest1")
        self.config.set_player_name(3, "Btest2")
        
        # 选择 Atest1 发球，Btest1 接发
        self.config.select_server("Atest1")
        self.config.select_receiver("Btest1")
        self.config.start_match()
        
        self.match.wait_for_selector(self.match.HEADER_TITLE)
        
        # === 阶段1: B队连续得分 ===
        # 先让 A队得 1 分
        self.match.add_point_a()
        assert self.match.get_score_a() == 1
        
        # B队得分（发球权转移到 B队）
        self.match.add_point_b()
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 1
        
        initial_server_b = self.match.get_server_player_name()
        print(f"\n阶段1开始: {initial_server_b} 发球, 比分 1:1")
        
        # B队再得 1 分（连续得分）
        self.match.add_point_b()
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 2
        
        server_after_b_score = self.match.get_server_player_name()
        print(f"B队得分后: {server_after_b_score} 发球, 比分 1:2")
        
        # 发球方得分后，发球方应该不变
        assert server_after_b_score == initial_server_b, f"B队连续得分，发球方应该不变，原来是 {initial_server_b}，现在是 {server_after_b_score}"
        
        # 验证位置交换
        left_player_b = self.match.get_player_at_position('B', 'left')
        right_player_b = self.match.get_player_at_position('B', 'right')
        print(f"B队位置: 左边={left_player_b}, 右边={right_player_b}")
        
        # 发球方应该在正确的位置
        assert self.match.is_server_badge_on_player(server_after_b_score), f"发球标记应该在 {server_after_b_score} 上"
        
        # === 阶段2: A队得分，发球权再次转移 ===
        self.match.add_point_a()
        assert self.match.get_score_a() == 2
        assert self.match.get_score_b() == 2
        
        server_after_a_score = self.match.get_server_player_name()
        receiver_after_a_score = self.match.get_receiver_player_name()
        print(f"\n阶段2: A队得分后: {server_after_a_score} 发球, {receiver_after_a_score} 接发, 比分 2:2")
        
        # 发球权应该转移到 A队
        assert server_after_a_score.startswith("A"), f"发球权应转移到 A队，实际是: {server_after_a_score}"
        assert receiver_after_a_score.startswith("B"), f"接发方应该是 B队，实际是: {receiver_after_a_score}"
        
        # 验证发球和接发标记
        assert self.match.is_server_badge_on_player(server_after_a_score), f"发球标记应该在 {server_after_a_score} 上"
        assert self.match.is_receiver_badge_on_player(receiver_after_a_score), f"接发标记应该在 {receiver_after_a_score} 上"
        
        # === 阶段3: 验证分数奇偶性影响 ===
        # 当前比分 2:2（双数），A队发球
        # A队再得 1 分（比分 3:2，单数）
        self.match.add_point_a()
        assert self.match.get_score_a() == 3
        assert self.match.get_score_b() == 2
        
        server_odd = self.match.get_server_player_name()
        print(f"\n阶段3: A队得分后（3:2，单数）: {server_odd} 发球")
        
        # 发球方得分，发球方不变
        assert server_odd == server_after_a_score, f"A队连续得分，发球方应该不变"
        
        # A队再得 1 分（比分 4:2，双数）
        self.match.add_point_a()
        assert self.match.get_score_a() == 4
        assert self.match.get_score_b() == 2
        
        server_even = self.match.get_server_player_name()
        print(f"A队得分后（4:2，双数）: {server_even} 发球")
        
        # 发球方得分，发球方不变
        assert server_even == server_odd, f"A队连续得分，发球方应该不变"
        
        print(f"\n✅ 所有阶段验证通过！")
    
    def test_doubles_default_player_names(self):
        """测试不输入信息时使用默认球员名称"""
        # 选择双打模式
        self.home.select_doubles_mode()
        
        # 配置比赛 - 不设置球员姓名，使用默认值
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        # 不设置球员姓名，直接使用默认值 A1, A2, B1, B2
        
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
        
        # 验证A队位置：左边是双数区（A1），右边是单数区（A2）
        a_left = self.match.get_player_at_position('A', 'left')
        a_right = self.match.get_player_at_position('A', 'right')
        print(f"A队位置: 左边={a_left}, 右边={a_right}")
        assert a_left == "A1", f"A队左边应该是 A1，实际是: {a_left}"
        assert a_right == "A2", f"A队右边应该是 A2，实际是: {a_right}"
        
        # 验证B队位置：左边是单数区（B2），右边是双数区（B1）
        b_left = self.match.get_player_at_position('B', 'left')
        b_right = self.match.get_player_at_position('B', 'right')
        print(f"B队位置: 左边={b_left}, 右边={b_right}")
        assert b_left == "B2", f"B队左边应该是 B2，实际是: {b_left}"
        assert b_right == "B1", f"B队右边应该是 B1，实际是: {b_right}"
        
        print("✅ 默认球员名称验证通过！")
    
    def test_doubles_server_is_b(self):
        """测试B队发球时的状态和得分逻辑"""
        # 选择双打模式
        self.home.select_doubles_mode()
        
        # 配置比赛
        self.config.set_score_option(15)
        self.config.set_deuce(False)
        self.config.set_player_name(0, "Atest1")
        self.config.set_player_name(1, "Atest2")
        self.config.set_player_name(2, "Btest1")
        self.config.set_player_name(3, "Btest2")
        
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
        
        # 验证初始位置
        b_left = self.match.get_player_at_position('B', 'left')
        b_right = self.match.get_player_at_position('B', 'right')
        print(f"B队初始位置: 左边={b_left}, 右边={b_right}")
        # B队布局：左边=单数区(odd)，右边=双数区(even)
        # Btest1发球（双数区），所以在右边；Btest2在左边（单数区）
        assert b_left == "Btest2", f"B队左边应该是 Btest2（单数区），实际是: {b_left}"
        assert b_right == "Btest1", f"B队右边应该是 Btest1（双数区），实际是: {b_right}"
        
        # B队得分
        self.match.add_point_b()
        
        # 验证比分更新
        assert self.match.get_score_a() == 0
        assert self.match.get_score_b() == 1
        
        # 验证发球方不变（发球方得分，发球员不变）
        assert self.match.is_server_badge_on_player("Btest1"), "B队得分后，发球标记应该仍在 Btest1 上"
        
        # 验证B队位置交换
        b_left_after = self.match.get_player_at_position('B', 'left')
        b_right_after = self.match.get_player_at_position('B', 'right')
        print(f"B队得分后位置: 左边={b_left_after}, 右边={b_right_after}")
        # B队得分后，位置交换：Btest1从右边（双数区）换到左边（单数区）
        assert b_left_after == "Btest1", f"B队得分后左边应该是 Btest1，实际是: {b_left_after}"
        assert b_right_after == "Btest2", f"B队得分后右边应该是 Btest2，实际是: {b_right_after}"
        
        # A队得分，发球权转移
        self.match.add_point_a()
        
        # 验证比分
        assert self.match.get_score_a() == 1
        assert self.match.get_score_b() == 1
        
        # 验证发球权转移到A队
        new_server = self.match.get_server_player_name()
        print(f"A队得分后: {new_server} 发球")
        assert new_server in ["Atest1", "Atest2"], f"发球权应转移到A队，实际是: {new_server}"
        
        print("✅ B队发球场景验证通过！")
