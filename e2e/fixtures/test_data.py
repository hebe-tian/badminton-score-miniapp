"""
测试数据 fixtures
"""

# 默认球员姓名
DEFAULT_PLAYERS = {
    'singles': {
        'A': ['A'],
        'B': ['B']
    },
    'doubles': {
        'A': ['A1', 'A2'],
        'B': ['B1', 'B2']
    },
    'wylb': {
        'A': ['A1', 'A2', 'A3', 'A4', 'A5'],
        'B': ['B1', 'B2', 'B3', 'B4', 'B5']
    }
}

# 常用比赛配置
MATCH_CONFIGS = {
    'quick_singles': {
        'mode': 'singles',
        'score': 5,
        'deuce': False
    },
    'standard_singles': {
        'mode': 'singles',
        'score': 21,
        'deuce': True
    },
    'quick_doubles': {
        'mode': 'doubles',
        'score': 5,
        'deuce': False
    },
    'standard_doubles': {
        'mode': 'doubles',
        'score': 21,
        'deuce': True
    },
    'quick_wylb': {
        'mode': 'wylb',
        'score': 50,
        'deuce': False
    },
    'standard_wylb': {
        'mode': 'wylb',
        'score': 100,
        'deuce': True
    }
}
