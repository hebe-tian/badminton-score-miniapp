import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import './index.css'

interface DrawPoint {
  x: number
  y: number
}

export default function HalfCourtSimulator() {
  const ctxRef = useRef<any>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<DrawPoint[]>([])
  const [allPaths, setAllPaths] = useState<DrawPoint[][]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [halfCourt, setHalfCourt] = useState<'top' | 'bottom'>('top')
  
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
          drawHalfCourtBackground(ctx, res.width, res.height)
          ctx.draw()
        }
      })
      .exec()
  }, [halfCourt])

  // 绘制半场背景
  const drawHalfCourtBackground = (ctx: any, width: number, height: number) => {
    const svgWidth = 800
    const startY = halfCourt === 'top' ? 150 : 897
    const endY = halfCourt === 'top' ? 897 : 1644
    const courtHeight = endY - startY
    
    const scale = Math.min(width / svgWidth, height / courtHeight)
    
    const offsetX = (width - svgWidth * scale) / 2
    const offsetY = (height - courtHeight * scale) / 2
    
    ctx.setFillStyle('#c0e0ff')
    ctx.fillRect(0, 0, width, height)
    
    ctx.setStrokeStyle('#ffffff')
    ctx.setLineWidth(4 * scale)
    ctx.setLineCap('square')
    
    const transformX = (x: number) => offsetX + x * scale
    const transformY = (y: number) => offsetY + (y - startY) * scale
    
    // 双打边线
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(startY))
    ctx.lineTo(transformX(60), transformY(endY))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(740), transformY(startY))
    ctx.lineTo(transformX(740), transformY(endY))
    ctx.stroke()
    
    // 端线
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(startY))
    ctx.lineTo(transformX(740), transformY(startY))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(endY))
    ctx.lineTo(transformX(740), transformY(endY))
    ctx.stroke()

    // 单打边线
    ctx.beginPath()
    ctx.moveTo(transformX(111), transformY(startY))
    ctx.lineTo(transformX(111), transformY(endY))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(689), transformY(startY))
    ctx.lineTo(transformX(689), transformY(endY))
    ctx.stroke()

    // 前发球线或后发球线
    if (halfCourt === 'top') {
      // 上半场：显示前发球线和后发球线
      ctx.beginPath()
      ctx.moveTo(transformX(60), transformY(230))
      ctx.lineTo(transformX(740), transformY(230))
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(transformX(60), transformY(676))
      ctx.lineTo(transformX(740), transformY(676))
      ctx.stroke()
      
      // 中线
      ctx.beginPath()
      ctx.moveTo(transformX(400), transformY(startY))
      ctx.lineTo(transformX(400), transformY(676))
      ctx.stroke()
    } else {
      // 下半场：显示前发球线和后发球线
      ctx.beginPath()
      ctx.moveTo(transformX(60), transformY(1118))
      ctx.lineTo(transformX(740), transformY(1118))
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(transformX(60), transformY(1564))
      ctx.lineTo(transformX(740), transformY(1564))
      ctx.stroke()
      
      // 中线
      ctx.beginPath()
      ctx.moveTo(transformX(400), transformY(1118))
      ctx.lineTo(transformX(400), transformY(endY))
      ctx.stroke()
    }

    // 球网（虚线）
    if (halfCourt === 'top') {
      ctx.setStrokeStyle('#ffffff')
      ctx.setLineWidth(6 * scale)
      ctx.setLineDash([16 * scale, 12 * scale])
      ctx.beginPath()
      ctx.moveTo(transformX(60), transformY(897))
      ctx.lineTo(transformX(740), transformY(897))
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // 重绘所有路径
  const redrawAllPaths = () => {
    if (!ctxRef.current) return
    
    const ctx = ctxRef.current
    
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .boundingClientRect((res: any) => {
        if (res) {
          drawHalfCourtBackground(ctx, res.width, res.height)
          
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
              drawHalfCourtBackground(ctx, res.width, res.height)
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

  // 半场切换时重绘
  useEffect(() => {
    if (isWeapp) {
      setTimeout(() => {
        initCanvas()
        if (allPaths.length > 0) {
          setTimeout(() => redrawAllPaths(), 100)
        }
      }, 150)
    }
  }, [halfCourt])

  // 配置分享功能
  useShareAppMessage(() => {
    const shareImagePath = (window as any).__shareImagePath || ''
    
    return {
      title: '羽毛球半场模拟器 - 战术绘制工具',
      path: '/pages/tools/half-court/index',
      imageUrl: shareImagePath
    }
  })

  // H5环境提示
  if (!isWeapp) {
    return (
      <View className='court-container'>
        <View className='court-header'>
          <Text className='court-title'>半场模拟器</Text>
          <Text className='court-subtitle'>绘制战术路线和站位</Text>
        </View>

        <View className='platform-notice'>
          <View className='notice-icon'>⚠️</View>
          <Text className='notice-title'>功能暂不支持</Text>
          <Text className='notice-desc'>
            半场模拟器功能目前仅在微信小程序中可用{'\n'}
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
            <Text className='court-title'>半场模拟器</Text>
            <Text className='court-subtitle'>绘制战术路线和站位</Text>
          </View>

          <View className='half-court-toggle'>
            <View 
              className={`toggle-button ${halfCourt === 'top' ? 'active' : ''}`}
              onClick={() => setHalfCourt('top')}
            >
              <Text>上半场</Text>
            </View>
            <View 
              className={`toggle-button ${halfCourt === 'bottom' ? 'active' : ''}`}
              onClick={() => setHalfCourt('bottom')}
            >
              <Text>下半场</Text>
            </View>
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
              • 选择上半场或下半场进行绘图{'\n'}
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
