import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import './index.css'

interface DrawPoint {
  x: number
  y: number
}

export default function NetCourtSimulator() {
  const ctxRef = useRef<any>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<DrawPoint[]>([])
  const [allPaths, setAllPaths] = useState<DrawPoint[][]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // 检测是否为微信小程序环境
  const isWeapp = process.env.TARO_ENV === 'weapp'

  // 初始化Canvas
  const initCanvas = useCallback(() => {
    console.log('初始化 Canvas...')
    
    const ctx = Taro.createCanvasContext('courtCanvas')
    
    if (!ctx) {
      console.error('无法创建 Canvas Context')
      return
    }
    
    ctxRef.current = ctx
    
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .boundingClientRect((res: any) => {
        if (res) {
          console.log('Canvas 尺寸:', res.width, res.height)
          drawNetCourtBackground(ctx, res.width, res.height)
          ctx.draw()
        }
      })
      .exec()
  }, [])

  // 绘制网前场景背景
  const drawNetCourtBackground = (ctx: any, width: number, height: number) => {
    const svgWidth = 800
    const svgHeight = 600
    const scale = Math.min(width / svgWidth, height / svgHeight)
    
    const offsetX = (width - svgWidth * scale) / 2
    const offsetY = (height - svgHeight * scale) / 2
    
    const transformX = (x: number) => offsetX + x * scale
    const transformY = (y: number) => offsetY + y * scale
    
    // 填充浅绿色背景
    ctx.setFillStyle('#e0f0e0')
    ctx.fillRect(0, 0, width, height)
    
    // 地面线
    ctx.setStrokeStyle('#a0b0a0')
    ctx.setLineWidth(3 * scale)
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(520))
    ctx.lineTo(transformX(740), transformY(520))
    ctx.stroke()
    
    // 网柱
    ctx.setFillStyle('#88968a')
    ctx.fillRect(transformX(80), transformY(80), 15 * scale, 440 * scale)
    ctx.fillRect(transformX(705), transformY(80), 15 * scale, 440 * scale)
    
    // 球网背景
    ctx.setFillStyle('rgba(255, 255, 255, 0.8)')
    ctx.setStrokeStyle('#b0bec5')
    ctx.setLineWidth(2 * scale)
    ctx.fillRect(transformX(95), transformY(80), 610 * scale, 200 * scale)
    ctx.strokeRect(transformX(95), transformY(80), 610 * scale, 200 * scale)
    
    // 球网网格线
    ctx.setLineWidth(1 * scale)
    for (let y = 110; y <= 260; y += 30) {
      ctx.beginPath()
      ctx.moveTo(transformX(95), transformY(y))
      ctx.lineTo(transformX(705), transformY(y))
      ctx.stroke()
    }
    
    // 网顶白带
    ctx.setFillStyle('#34495e')
    ctx.fillRect(transformX(95), transformY(78), 610 * scale, 4 * scale)
    
    // 双打线（蓝色实线）
    ctx.setStrokeStyle('#1e88e5')
    ctx.setLineWidth(4 * scale)
    ctx.beginPath()
    ctx.moveTo(transformX(95), transformY(280))
    ctx.lineTo(transformX(95), transformY(520))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(705), transformY(280))
    ctx.lineTo(transformX(705), transformY(520))
    ctx.stroke()
    
    // 单打线（橙色虚线）
    ctx.setStrokeStyle('#fb8c00')
    ctx.setLineDash([10 * scale, 8 * scale])
    ctx.beginPath()
    ctx.moveTo(transformX(145), transformY(280))
    ctx.lineTo(transformX(145), transformY(520))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(655), transformY(280))
    ctx.lineTo(transformX(655), transformY(520))
    ctx.stroke()
    ctx.setLineDash([])
    
    // 中线（绿色点划线）
    ctx.setStrokeStyle('#43a047')
    ctx.setLineDash([15 * scale, 8 * scale, 3 * scale, 8 * scale])
    ctx.beginPath()
    ctx.moveTo(transformX(400), transformY(280))
    ctx.lineTo(transformX(400), transformY(520))
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 重绘所有路径
  const redrawAllPaths = () => {
    if (!ctxRef.current) return
    
    const ctx = ctxRef.current
    
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .boundingClientRect((res: any) => {
        if (res) {
          drawNetCourtBackground(ctx, res.width, res.height)
          
          ctx.setStrokeStyle('#FF0000')
          ctx.setLineWidth(2)
          ctx.setLineCap('round')
          ctx.setLineJoin('round')
          ctx.setLineDash([])
          
          allPaths.forEach((path) => {
            if (path.length < 2) return
            
            ctx.beginPath()
            ctx.moveTo(path[0].x * res.width, path[0].y * res.height)
            
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x * res.width, path[i].y * res.height)
            }
            
            ctx.stroke()
          })
          
          ctx.draw()
        }
      })
      .exec()
  }

  // 获取触摸点在Canvas中的归一化坐标
  const getTouchPos = (e: any, canvasRect: any) => {
    const touch = e.touches[0]
    const x = touch.clientX - canvasRect.left
    const y = touch.clientY - canvasRect.top
    return { 
      x: x / canvasRect.width,
      y: y / canvasRect.height
    }
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
          
          if (ctxRef.current) {
            ctxRef.current.setLineDash([])
          }
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
          
          const ctx = ctxRef.current
          ctx.setStrokeStyle('#FF0000')
          ctx.setLineWidth(2)
          ctx.setLineCap('round')
          ctx.setLineJoin('round')
          ctx.setLineDash([])
          
          if (newPath.length >= 2) {
            const lastPoint = newPath[newPath.length - 2]
            const currentPoint = newPath[newPath.length - 1]
            ctx.beginPath()
            ctx.moveTo(lastPoint.x * res.width, lastPoint.y * res.height)
            ctx.lineTo(currentPoint.x * res.width, currentPoint.y * res.height)
            ctx.stroke()
            ctx.draw(true)
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
              drawNetCourtBackground(ctx, res.width, res.height)
              ctx.draw()
            }
          })
          .exec()
      }
    }, 50)
  }

  // 切换全屏
  const handleToggleFullscreen = () => {
    console.log('切换全屏, 当前状态:', isFullscreen)
    const newFullscreenState = !isFullscreen
    setIsFullscreen(newFullscreenState)
    
    setTimeout(() => {
      if (isWeapp) {
        initCanvas()
      }
    }, 100)
  }

  // 退出全屏按钮点击
  const handleExitFullscreen = (e: any) => {
    e.stopPropagation()
    console.log('点击退出全屏按钮')
    setIsFullscreen(false)
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
      
      await redrawAllPaths()
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const imagePath = await exportCanvasToImage()
      
      Taro.hideLoading()
      
      // 提示用户使用右上角分享
      Taro.showToast({
        title: '请点击右上角分享',
        icon: 'none',
        duration: 2000
      })
      
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

  // 页面加载时初始化Canvas
  useEffect(() => {
    if (isWeapp) {
      const timer = setTimeout(() => initCanvas(), 300)
      return () => clearTimeout(timer)
    }
  }, [isWeapp, initCanvas])
  
  // 全屏切换时重绘
  useEffect(() => {
    if (isWeapp) {
      setTimeout(() => {
        initCanvas()
        if (allPaths.length > 0) {
          setTimeout(() => redrawAllPaths(), 100)
        }
      }, 150)
    }
  }, [isFullscreen])

  // 配置分享功能
  useShareAppMessage(() => {
    const shareImagePath = (window as any).__shareImagePath || ''
    
    return {
      title: '羽毛球网前模拟器 - 战术绘制工具',
      path: '/pages/tools/net-court/index',
      imageUrl: shareImagePath
    }
  })

  // H5环境提示
  if (!isWeapp) {
    return (
      <View className='court-container'>
        <View className='court-header'>
          <Text className='court-title'>网前模拟器</Text>
          <Text className='court-subtitle'>练习网前技术和站位</Text>
        </View>

        <View className='platform-notice'>
          <View className='notice-icon'>⚠️</View>
          <Text className='notice-title'>功能暂不支持</Text>
          <Text className='notice-desc'>
            网前模拟器功能目前仅在微信小程序中可用{'\n'}
            请使用微信扫码或在微信中打开小程序体验完整功能
          </Text>
        </View>
      </View>
    )
  }

  // 小程序环境 - 完整功能
  return (
    <View className='court-container'>
      {!isFullscreen && (
        <>
          <View className='court-header'>
            <Text className='court-title'>网前模拟器</Text>
            <Text className='court-subtitle'>练习网前技术和站位</Text>
          </View>
        </>
      )}

      <View className={`canvas-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
        <Canvas
          canvasId='courtCanvas'
          id='courtCanvas'
          className='court-canvas'
          disableScroll
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        
        {!isFullscreen && (
          <View className='fullscreen-toggle-btn' onClick={handleToggleFullscreen}>
            <Text>⛶ 全屏</Text>
          </View>
        )}
        
        {isFullscreen && (
          <View className='exit-fullscreen-hint' onClick={handleExitFullscreen}>
            <Text>✕ 退出全屏</Text>
          </View>
        )}
        
        {isFullscreen && (
          <View className='fullscreen-controls'>
            <View className='action-button undo-button' onClick={handleUndo}>
              <Text>撤销</Text>
            </View>
            <View className='action-button clear-button' onClick={handleClear}>
              <Text>清空</Text>
            </View>
          </View>
        )}
      </View>

      {!isFullscreen && (
        <>
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
              • 网前区域包含球网、网柱和场地线{'\n'}
              • 点击球场可进入/退出全屏模式{'\n'}
              • 在全屏模式下手指滑动绘制战术路线{'\n'}
              • 红色线条标记战术路线和站位{'\n'}
              • 点击撤销可删除最后一步{'\n'}
              • 点击右上角分享给好友
            </Text>
          </View>
        </>
      )}
    </View>
  )
}
