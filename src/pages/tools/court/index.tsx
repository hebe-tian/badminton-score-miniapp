import { useState, useRef, useEffect } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import './index.css'

interface DrawPoint {
  x: number
  y: number
}

export default function CourtSimulator() {
  const ctxRef = useRef<any>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<DrawPoint[]>([])
  const [allPaths, setAllPaths] = useState<DrawPoint[][]>([])
  
  // 检测是否为微信小程序环境
  const isWeapp = process.env.TARO_ENV === 'weapp'

  // 初始化Canvas
  const initCanvas = () => {
    console.log('初始化 Canvas...')
    
    // 使用传统的 Canvas API（兼容性更好）
    const ctx = Taro.createCanvasContext('courtCanvas')
    
    if (!ctx) {
      console.error('无法创建 Canvas Context')
      return
    }
    
    ctxRef.current = ctx
    
    // 获取Canvas尺寸
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .boundingClientRect((res: any) => {
        if (res) {
          console.log('Canvas 尺寸:', res.width, res.height)
          drawCourtBackground(ctx, res.width, res.height)
          ctx.draw()
        }
      })
      .exec()
  }

  // 绘制羽毛球场地背景（基于标准SVG）
  const drawCourtBackground = (ctx: any, width: number, height: number) => {
    // SVG原始尺寸: 800 x 1500
    // 计算缩放比例，保持宽高比
    const svgWidth = 800
    const svgHeight = 1500
    const scale = Math.min(width / svgWidth, height / svgHeight)
    
    // 计算居中偏移
    const offsetX = (width - svgWidth * scale) / 2
    const offsetY = (height - svgHeight * scale) / 2
    
    // 填充绿色背景
    ctx.setFillStyle('#2d5a27')
    ctx.fillRect(0, 0, width, height)
    
    // 设置白色线条样式
    ctx.setStrokeStyle('#ffffff')
    ctx.setLineWidth(4 * scale)
    ctx.setLineCap('square')
    
    // 辅助函数：转换SVG坐标到Canvas坐标
    const transformX = (x: number) => offsetX + x * scale
    const transformY = (y: number) => offsetY + y * scale
    
    // === 双打线 ===
    // 上端线
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(100))
    ctx.lineTo(transformX(700), transformY(100))
    ctx.stroke()
    
    // 下端线
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(1420))
    ctx.lineTo(transformX(700), transformY(1420))
    ctx.stroke()
    
    // 双打左边线
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(100))
    ctx.lineTo(transformX(100), transformY(1420))
    ctx.stroke()
    
    // 双打右边线
    ctx.beginPath()
    ctx.moveTo(transformX(700), transformY(100))
    ctx.lineTo(transformX(700), transformY(1420))
    ctx.stroke()
    
    // === 双打发球线（后发球线）===
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(170))
    ctx.lineTo(transformX(700), transformY(170))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(1350))
    ctx.lineTo(transformX(700), transformY(1350))
    ctx.stroke()
    
    // === 单打边线 ===
    ctx.beginPath()
    ctx.moveTo(transformX(145), transformY(100))
    ctx.lineTo(transformX(145), transformY(1420))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(655), transformY(100))
    ctx.lineTo(transformX(655), transformY(1420))
    ctx.stroke()
    
    // === 前发球线 ===
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(565))
    ctx.lineTo(transformX(700), transformY(565))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(955))
    ctx.lineTo(transformX(700), transformY(955))
    ctx.stroke()
    
    // === 中线 ===
    ctx.beginPath()
    ctx.moveTo(transformX(400), transformY(565))
    ctx.lineTo(transformX(400), transformY(760))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(400), transformY(760))
    ctx.lineTo(transformX(400), transformY(955))
    ctx.stroke()
    
    // === 端线处的发球区短线标记 ===
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(100))
    ctx.lineTo(transformX(145), transformY(100))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(1420))
    ctx.lineTo(transformX(145), transformY(1420))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(655), transformY(100))
    ctx.lineTo(transformX(700), transformY(100))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(655), transformY(1420))
    ctx.lineTo(transformX(700), transformY(1420))
    ctx.stroke()
    
    // === 球网位置（虚线）===
    ctx.setStrokeStyle('#ffffff')
    ctx.setLineWidth(6 * scale)
    ctx.setLineDash([15 * scale, 10 * scale])
    ctx.beginPath()
    ctx.moveTo(transformX(100), transformY(760))
    ctx.lineTo(transformX(700), transformY(760))
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 重绘所有路径
  const redrawAllPaths = () => {
    if (!ctxRef.current) return
    
    const ctx = ctxRef.current
    
    // 获取Canvas尺寸
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .boundingClientRect((res: any) => {
        if (res) {
          // 重新绘制背景
          drawCourtBackground(ctx, res.width, res.height)
          
          // 绘制所有已保存的路径
          ctx.setStrokeStyle('#FF0000')
          ctx.setLineWidth(4)
          ctx.setLineCap('round')
          ctx.setLineJoin('round')
          
          allPaths.forEach((path) => {
            if (path.length < 2) return
            
            ctx.beginPath()
            ctx.moveTo(path[0].x, path[0].y)
            
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x, path[i].y)
            }
            
            ctx.stroke()
          })
          
          ctx.draw()
        }
      })
      .exec()
  }

  // 获取触摸点在Canvas中的坐标
  const getTouchPos = (e: any, canvasRect: any) => {
    const touch = e.touches[0]
    // 使用 clientX/clientY 获取相对于视口的坐标
    const x = touch.clientX - canvasRect.left
    const y = touch.clientY - canvasRect.top
    return { x, y }
  }

  // 触摸开始
  const handleTouchStart = (e: any) => {
    e.preventDefault()
    
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .boundingClientRect((res: any) => {
        if (res) {
          const pos = getTouchPos(e, res)
          setIsDrawing(true)
          setCurrentPath([pos])
        }
      })
      .exec()
  }

  // 触摸移动
  const handleTouchMove = (e: any) => {
    e.preventDefault()
    if (!isDrawing || !ctxRef.current) return
    
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .boundingClientRect((res: any) => {
        if (res) {
          const pos = getTouchPos(e, res)
          const newPath = [...currentPath, pos]
          setCurrentPath(newPath)
          
          // 实时绘制
          const ctx = ctxRef.current
          ctx.setStrokeStyle('#FF0000')
          ctx.setLineWidth(4)
          ctx.setLineCap('round')
          ctx.setLineJoin('round')
          
          if (newPath.length >= 2) {
            ctx.beginPath()
            ctx.moveTo(newPath[newPath.length - 2].x, newPath[newPath.length - 2].y)
            ctx.lineTo(newPath[newPath.length - 1].x, newPath[newPath.length - 1].y)
            ctx.stroke()
            ctx.draw(true) // true表示不重绘之前的内容
          }
        }
      })
      .exec()
  }

  // 触摸结束
  const handleTouchEnd = () => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    if (currentPath.length > 1) {
      setAllPaths([...allPaths, currentPath])
    }
    setCurrentPath([])
  }

  // 撤销操作
  const handleUndo = () => {
    if (allPaths.length === 0) return
    setAllPaths(allPaths.slice(0, -1))
    setTimeout(() => redrawAllPaths(), 50)
  }

  // 清空画布
  const handleClear = () => {
    setAllPaths([])
    setCurrentPath([])
    setTimeout(() => {
      if (ctxRef.current) {
        const ctx = ctxRef.current
        Taro.createSelectorQuery()
          .select('#courtCanvas')
          .boundingClientRect((res: any) => {
            if (res) {
              drawCourtBackground(ctx, res.width, res.height)
              ctx.draw()
            }
          })
          .exec()
      }
    }, 50)
  }

  // 将Canvas导出为图片
  const exportCanvasToImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      Taro.canvasToTempFilePath({
        canvasId: 'courtCanvas',
        success: (res) => {
          console.log('Canvas导出成功:', res.tempFilePath)
          resolve(res.tempFilePath)
        },
        fail: (err) => {
          console.error('Canvas导出失败:', err)
          reject(err)
        }
      })
    })
  }

  // 分享功能
  const handleShare = async () => {
    try {
      Taro.showLoading({ title: '生成图片中...' })
      
      // 先重绘所有内容（确保最新状态）
      await redrawAllPaths()
      
      // 等待绘制完成
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 导出Canvas为图片
      const imagePath = await exportCanvasToImage()
      
      Taro.hideLoading()
      
      // 显示分享菜单
      Taro.showShareMenu({
        withShareTicket: true,
        showShareItems: ['wechatFriends', 'wechatMoment']
      })
      
      Taro.showToast({
        title: '点击右上角分享',
        icon: 'none',
        duration: 2000
      })
      
      // 保存图片路径，供分享时使用
      ;(window as any).__shareImagePath = imagePath
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '生成图片失败',
        icon: 'none'
      })
      console.error('分享失败:', error)
    }
  }

  // 页面加载时初始化Canvas（仅微信小程序环境）
  useEffect(() => {
    if (isWeapp) {
      const timer = setTimeout(() => initCanvas(), 300)
      return () => clearTimeout(timer)
    }
  }, [isWeapp])

  // 配置分享功能
  useShareAppMessage(() => {
    // 尝试获取之前生成的图片路径
    const shareImagePath = (window as any).__shareImagePath || ''
    
    return {
      title: '羽毛球球场模拟器 - 战术绘制工具',
      path: '/pages/tools/court/index',
      imageUrl: shareImagePath // 如果有图片则使用，否则使用默认封面
    }
  })

  // H5环境提示
  if (!isWeapp) {
    return (
      <View className='court-container'>
        <View className='court-header'>
          <Text className='court-title'>球场模拟器</Text>
          <Text className='court-subtitle'>绘制战术路线和站位</Text>
        </View>

        <View className='platform-notice'>
          <View className='notice-icon'>⚠️</View>
          <Text className='notice-title'>功能暂不支持</Text>
          <Text className='notice-desc'>
            球场模拟器功能目前仅在微信小程序中可用{'\n'}
            请使用微信扫码或在微信中打开小程序体验完整功能
          </Text>
        </View>

        <View className='instruction'>
          <Text className='instruction-text'>
            即将支持的功能:{'\n'}
            • 在球场图上自由绘制战术路线{'\n'}
            • 撤销和清空操作{'\n'}
            • 分享绘制结果给好友
          </Text>
        </View>
      </View>
    )
  }

  // 小程序环境 - 完整功能
  return (
    <View className='court-container'>
      <View className='court-header'>
        <Text className='court-title'>球场模拟器</Text>
        <Text className='court-subtitle'>绘制战术路线和站位</Text>
      </View>

      <View className='canvas-wrapper'>
        <Canvas
          canvasId='courtCanvas'
          id='courtCanvas'
          className='court-canvas'
          disableScroll
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </View>

      <View className='action-buttons'>
        <View className='action-button undo-button' onClick={handleUndo}>
          <Text>撤销</Text>
        </View>
        <View className='action-button clear-button' onClick={handleClear}>
          <Text>清空</Text>
        </View>
        <View className='action-button share-button' onClick={handleShare}>
          <Text>分享</Text>
        </View>
      </View>

      <View className='instruction'>
        <Text className='instruction-text'>
          使用说明:{'\n'}
          • 在球场上手指滑动即可绘制{'\n'}
          • 红色线条标记战术路线和站位{'\n'}
          • 点击撤销可删除最后一步{'\n'}
          • 点击右上角分享给好友
        </Text>
      </View>
    </View>
  )
}
