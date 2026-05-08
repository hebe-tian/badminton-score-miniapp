from playwright.sync_api import Page
from .base_page import BasePage


class MatchPage(BasePage):
    """比赛页页面对象"""
    
    # 选择器
    HEADER_TITLE = ".header-title"
    SCORE_A = ".score-team >> nth=0 >> .score-number"
    SCORE_B = ".score-team >> nth=1 >> .score-number"
    BUTTON_ADD_A = ".control-button.blue"
    BUTTON_ADD_B = ".control-button.rose"
    SERVER_BADGE = ".avatar-badge.server"
    RECEIVER_BADGE = ".avatar-badge.receiver"
    SUBSTITUTION_MODAL = ".modal-overlay"
    GAME_OVER_MODAL = "[class*='game']"  # 比赛结束弹窗
    WINNER_TEXT = "[class*='winner']"  # 获胜方文本
    FINAL_SCORE = ".final-score"
    BUTTON_RESTART = ".footer-button.restart"
    BUTTON_HOME = ".footer-button.home"
    HISTORY_LIST = ".history-list"
    HISTORY_ITEM = ".history-item"
    HISTORY_INDEX = ".history-index"
    HISTORY_SCORE = ".history-score"
    HISTORY_SCORER = ".history-scorer"
    MODAL_BUTTON = ".modal-button"
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    def get_score_a(self) -> int:
        """获取 A 队比分"""
        score_text = self.get_text(self.SCORE_A)
        return int(score_text.strip())
    
    def get_score_b(self) -> int:
        """获取 B 队比分"""
        score_text = self.get_text(self.SCORE_B)
        return int(score_text.strip())
    
    def add_point_a(self):
        """A 队得分"""
        # 先检查是否有弹窗遮挡，如果有则关闭
        if self.is_substitution_modal_visible():
            self.close_substitution_modal()
            self.page.wait_for_timeout(300)
        self.click(self.BUTTON_ADD_A)
    
    def add_point_b(self):
        """B 队得分"""
        # 先检查是否有弹窗遮挡，如果有则关闭
        if self.is_substitution_modal_visible():
            self.close_substitution_modal()
            self.page.wait_for_timeout(300)
        self.click(self.BUTTON_ADD_B)
    
    def get_scores(self) -> tuple:
        """获取双方比分"""
        return (self.get_score_a(), self.get_score_b())
    
    def is_server_badge_visible(self) -> bool:
        """检查发球标识是否可见"""
        return self.is_visible(self.SERVER_BADGE)
    
    def get_server_player_name(self) -> str:
        """获取当前发球球员姓名"""
        # 查找带有 server badge 的球员名称
        server_badge = self.page.query_selector('.avatar-badge.server')
        if server_badge:
            # 使用 JavaScript 直接获取父元素中的 .avatar-name
            name = self.page.evaluate('''
                () => {
                    const badge = document.querySelector('.avatar-badge.server');
                    if (badge) {
                        const playerAvatar = badge.closest('.player-avatar');
                        if (playerAvatar) {
                            const nameElem = playerAvatar.querySelector('.avatar-name');
                            if (nameElem) {
                                return nameElem.textContent.trim();
                            }
                        }
                    }
                    return '';
                }
            ''')
            return name
        return ""
    
    def get_receiver_player_name(self) -> str:
        """获取当前接发球员姓名"""
        # 查找带有 receiver badge 的球员名称
        receiver_badge = self.page.query_selector('.avatar-badge.receiver')
        if receiver_badge:
            # 使用 JavaScript 直接获取父元素中的 .avatar-name
            name = self.page.evaluate('''
                () => {
                    const badge = document.querySelector('.avatar-badge.receiver');
                    if (badge) {
                        const playerAvatar = badge.closest('.player-avatar');
                        if (playerAvatar) {
                            const nameElem = playerAvatar.querySelector('.avatar-name');
                            if (nameElem) {
                                return nameElem.textContent.trim();
                            }
                        }
                    }
                    return '';
                }
            ''')
            return name
        return ""
    
    def get_player_at_position(self, team: str, position: str) -> str:
        """获取指定队伍指定位置的球员姓名
        
        Args:
            team: 'A' 或 'B'
            position: 'left' 或 'right'（从左到右）
        
        Returns:
            球员姓名
        
        Note:
            A队布局：左边是双数区(even)，右边是单数区(odd)
            B队布局：左边是单数区(odd)，右边是双数区(even)
        """
        # 根据队伍选择对应的容器
        team_selector = f'.team-half.team-{team.lower()}'
        
        # 获取该队伍的所有球员头像
        avatars = self.page.query_selector_all(f'{team_selector} .player-avatar')
        
        if not avatars:
            return ""
        
        # 根据位置选择球员
        if position == 'left':
            target_avatar = avatars[0]
        elif position == 'right':
            target_avatar = avatars[1] if len(avatars) > 1 else avatars[0]
        else:
            return ""
        
        # 获取球员姓名
        name_elem = target_avatar.query_selector('.avatar-name')
        if name_elem:
            return name_elem.text_content().strip()
        return ""
    
    def is_server_badge_on_player(self, player_name: str) -> bool:
        """验证发球标记是否在指定球员上"""
        return self.page.evaluate('''
            (name) => {
                const avatars = document.querySelectorAll('.player-avatar');
                for (const avatar of avatars) {
                    const nameElem = avatar.querySelector('.avatar-name');
                    if (nameElem && nameElem.textContent.trim() === name) {
                        const serverBadge = avatar.querySelector('.avatar-badge.server');
                        return serverBadge !== null;
                    }
                }
                return false;
            }
        ''', player_name)
    
    def is_receiver_badge_on_player(self, player_name: str) -> bool:
        """验证接发标记是否在指定球员上"""
        return self.page.evaluate('''
            (name) => {
                const avatars = document.querySelectorAll('.player-avatar');
                for (const avatar of avatars) {
                    const nameElem = avatar.querySelector('.avatar-name');
                    if (nameElem && nameElem.textContent.trim() === name) {
                        const receiverBadge = avatar.querySelector('.avatar-badge.receiver');
                        return receiverBadge !== null;
                    }
                }
                return false;
            }
        ''', player_name)
    
    def is_substitution_modal_visible(self) -> bool:
        """检查换人提示是否显示"""
        return self.is_visible(self.SUBSTITUTION_MODAL)
    
    def close_substitution_modal(self):
        """关闭换人提示 - 兼容 H5 和小程序"""
        # 尝试多种选择器来关闭模态框
        selectors = [
            self.MODAL_BUTTON,
            ".modal-button",
            ".van-button",  # Vant UI 按钮
            "button",
            "[role=button]"
        ]
        
        for selector in selectors:
            try:
                if self.page.is_visible(selector, timeout=2000):
                    self.click(selector)
                    print(f"  [Match] 使用选择器 '{selector}' 关闭模态框成功")
                    return
            except:
                continue
        
        # 如果所有选择器都失败，尝试按 ESC 键
        self.page.keyboard.press("Escape")
        print(f"  [Match] 使用 ESC 键关闭模态框")
    
    def get_substitution_info(self) -> dict:
        """获取换人弹窗中的详细信息"""
        if not self.is_substitution_modal_visible():
            return {}
        
        info = {
            'teamA_out': '',
            'teamA_in': '',
            'teamB_out': '',
            'teamB_in': ''
        }
        
        try:
            # 获取A队下场球员
            teamA_out_elem = self.page.query_selector('.sub-team-a .out-name')
            if teamA_out_elem and teamA_out_elem.is_visible():
                info['teamA_out'] = teamA_out_elem.text_content().strip()
            
            # 获取A队上场球员
            teamA_in_elem = self.page.query_selector('.sub-team-a .in-name')
            if teamA_in_elem and teamA_in_elem.is_visible():
                info['teamA_in'] = teamA_in_elem.text_content().strip()
            
            # 获取B队下场球员
            teamB_out_elem = self.page.query_selector('.sub-team-b .out-name')
            if teamB_out_elem and teamB_out_elem.is_visible():
                info['teamB_out'] = teamB_out_elem.text_content().strip()
            
            # 获取B队上场球员
            teamB_in_elem = self.page.query_selector('.sub-team-b .in-name')
            if teamB_in_elem and teamB_in_elem.is_visible():
                info['teamB_in'] = teamB_in_elem.text_content().strip()
        except Exception as e:
            print(f"获取换人信息失败: {e}")
        
        return info
    
    def is_game_over(self) -> bool:
        """检查比赛是否结束"""
        return self.is_visible(self.GAME_OVER_MODAL)
    
    def get_winner(self) -> str:
        """获取获胜方"""
        # 查找所有匹配的元素，返回第一个可见的
        elements = self.page.query_selector_all(self.WINNER_TEXT)
        for elem in elements:
            if elem.is_visible():
                text = elem.text_content().strip()
                # 只返回包含“获胜方”的文本
                if '获胜方' in text or 'A队' in text or 'B队' in text:
                    return text
        # 如果没找到，返回第一个元素的文本
        return self.get_text(self.WINNER_TEXT)
    
    def get_final_score(self) -> str:
        """获取最终比分"""
        return self.get_text(self.FINAL_SCORE)
    
    def restart_match(self):
        """重新开始比赛"""
        self.click(self.BUTTON_RESTART)
    
    def go_to_home(self):
        """返回主页 - 兼容 H5 和小程序"""
        self.click(self.BUTTON_HOME)
        # 等待路由跳转完成
        self.page.wait_for_timeout(1000)
        # 等待网络空闲（H5 环境下需要）
        try:
            self.page.wait_for_load_state('networkidle', timeout=5000)
        except:
            pass  # 如果超时，继续执行
    
    def wait_for_game_over(self, timeout: int = 10000):
        """等待比赛结束弹窗出现"""
        # 等待 modal-overlay 出现且可见
        self.page.wait_for_selector('.modal-overlay', state='visible', timeout=timeout)
        # 额外等待一下确保内容加载完成
        self.page.wait_for_timeout(500)
    
    def play_until_score(self, target_a: int, target_b: int):
        """快速进行比赛直到指定比分"""
        current_a, current_b = self.get_scores()
        
        while current_a < target_a or current_b < target_b:
            if current_a < target_a:
                self.add_point_a()
                current_a += 1
            elif current_b < target_b:
                self.add_point_b()
                current_b += 1
            
            # 检查是否有换人提示
            if self.is_substitution_modal_visible():
                self.close_substitution_modal()
            
            # 检查比赛是否结束
            if self.is_game_over():
                break
    
    def get_history_list_count(self) -> int:
        """获取得分列表中的记录数量"""
        items = self.page.query_selector_all(self.HISTORY_ITEM)
        return len(items)
    
    def get_history_entry(self, index: int) -> dict:
        """获取得分列表中指定索引的记录（从0开始）
        
        Returns:
            dict: {'index': 序号, 'score': '比分', 'scorer': '得分方'}
        """
        items = self.page.query_selector_all(self.HISTORY_ITEM)
        if index < 0 or index >= len(items):
            return {}
        
        item = items[index]
        
        # 获取序号
        index_elem = item.query_selector(self.HISTORY_INDEX)
        index_text = index_elem.text_content().strip() if index_elem else ""
        
        # 获取比分
        score_elem = item.query_selector(self.HISTORY_SCORE)
        score_text = score_elem.text_content().strip() if score_elem else ""
        
        # 获取得分方
        scorer_elem = item.query_selector(self.HISTORY_SCORER)
        scorer_text = scorer_elem.text_content().strip() if scorer_elem else ""
        
        return {
            'index': index_text,
            'score': score_text,
            'scorer': scorer_text
        }
    
    def get_all_history_entries(self) -> list:
        """获取得分列表中的所有记录
        
        Returns:
            list: [{'index': 序号, 'score': '比分', 'scorer': '得分方'}, ...]
        """
        count = self.get_history_list_count()
        entries = []
        for i in range(count):
            entry = self.get_history_entry(i)
            if entry:
                entries.append(entry)
        return entries
