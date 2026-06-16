#!/usr/bin/env python3
"""
手动更新网前模拟器为Canvas 2D API
由于正则替换复杂，这里提供详细的修改说明
"""

print("""
=== Canvas 2D API 更新清单 ===

需要修改的文件:
1. src/pages/tools/net-court/index.tsx

主要改动点:
1. 添加 canvasRef = useRef<any>(null)
2. initCanvas 改用 .fields({ node: true, size: true })
3. 所有 ctx.setXxx() 改为 ctx.xxx (属性赋值)
4. 移除所有 ctx.draw() 调用
5. Canvas 组件添加 type='2d'，移除 canvasId
6. exportCanvasToImage 使用 canvas 参数而非 canvasId
7. boundingClientRect 改为 fields({ size: true })
8. res 引用改为 res[0]

请参考 court/index.tsx 的完整实现进行手动更新。
""")
