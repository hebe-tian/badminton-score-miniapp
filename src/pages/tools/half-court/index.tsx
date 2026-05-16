import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import './index.css'

interface DrawPoint {
  x: number
  y: number
}

export default function HalfCourtSimulator() {
  const canvasRef = useRef<any>(null)
  const ctxRef = useRef<any>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<DrawPoint[]>([])
  const [allPaths, setAllPaths] = useState<DrawPoint[][]>([])
  
  // 检测是否为微信小程序环境
  const isWeapp = process.env.TARO_ENV === 'weapp'

  // 初始化Canvas
  const initCanvas = useCallback(() => {
    const query = Taro.createSelectorQuery()
    query.select('#courtCanvas')
      .fields({ node: true, size: true })
      .exec((res: any) => {
        if (res && res[0]) {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const { width, height } = res[0]
          
          const dpr = Taro.getWindowInfo().pixelRatio
          canvas.width = width * dpr
          canvas.height = height * dpr
          ctx.scale(dpr, dpr)
          
          canvasRef.current = canvas
          ctxRef.current = ctx
          
          drawHalfCourtBackground(ctx, width, height)
        }
      })
  }, [])

  // 绘制半场背景(基于全场模拟器的下半场区域 Y=897至Y=1644)
  const drawHalfCourtBackground = (ctx: any, width: number, height: number) => {
    const svgWidth = 800
    const startY = 897  // 下半场起始Y坐标(球网位置)
    const endY = 1644   // 下半场结束Y坐标
    const courtHeight = endY - startY  // 747
    
    // 保持宽高比，放大10%
    const scale = Math.min(width / svgWidth, height / courtHeight) * 1.10
    
    // 计算居中偏移
    const offsetX = (width - svgWidth * scale) / 2
    // 球场下移5%
    const offsetY = height * 0.05
    
    // 填充浅蓝色背景
    ctx.fillStyle = '#c0e0ff'
    ctx.fillRect(0, 0, width, height)
    
    // 设置白色线条样式
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4 * scale
    ctx.lineCap = 'square'
    
    // 辅助函数:转换SVG坐标到Canvas坐标(使用相对坐标)
    const transformX = (x: number) => offsetX + x * scale
    const transformY = (y: number) => offsetY + (y - startY) * scale
    
    // === 双打边线(左右边界) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(startY))
    ctx.lineTo(transformX(60), transformY(endY))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(740), transformY(startY))
    ctx.lineTo(transformX(740), transformY(endY))
    ctx.stroke()
      
    // === 端线(上下边界) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(startY))
    ctx.lineTo(transformX(740), transformY(startY))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(endY))
    ctx.lineTo(transformX(740), transformY(endY))
    ctx.stroke()
  
    // === 单打边线 ===
    ctx.beginPath()
    ctx.moveTo(transformX(111), transformY(startY))
    ctx.lineTo(transformX(111), transformY(endY))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(689), transformY(startY))
    ctx.lineTo(transformX(689), transformY(endY))
    ctx.stroke()
  
    // === 双打后发球线(距离端线0.72米) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(1564))
    ctx.lineTo(transformX(740), transformY(1564))
    ctx.stroke()
  
    // === 前发球线(距离球网1.98米) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(1118))
    ctx.lineTo(transformX(740), transformY(1118))
    ctx.stroke()
  
    // === 中线(下半区:前发球线到底线) ===
    ctx.beginPath()
    ctx.moveTo(transformX(400), transformY(1118))
    ctx.lineTo(transformX(400), transformY(endY))
    ctx.stroke()
  
    // === 端线处的发球区短标记(双打边线与单打边线之间) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(endY))
    ctx.lineTo(transformX(111), transformY(endY))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(689), transformY(endY))
    ctx.lineTo(transformX(740), transformY(endY))
    ctx.stroke()
  
    // === 球网位置:虚线(顶部) ===
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 6 * scale
    ctx.setLineDash([16 * scale, 12 * scale])
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(startY))
    ctx.lineTo(transformX(740), transformY(startY))
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 重绘所有路径
  const redrawAllPaths = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    
    const query = Taro.createSelectorQuery()
    query.select('#courtCanvas')
      .fields({ size: true })
      .exec((res: any) => {
        if (res && res[0]) {
          const { width, height } = res[0]
          const dpr = Taro.getWindowInfo().pixelRatio
          
          // 清除并重绘背景
          ctx.clearRect(0, 0, width * dpr, height * dpr)
          drawHalfCourtBackground(ctx, width, height)
          
          // 设置绘制样式
          ctx.strokeStyle = '#FF0000'
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.setLineDash([])
          
          // 重绘所有路径
          allPaths.forEach((path) => {
            if (path.length < 2) return
            ctx.beginPath()
            ctx.moveTo(path[0].x * width, path[0].y * height)
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x * width, path[i].y * height)
            }
            ctx.stroke()
          })
        }
      })
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
          const point = getTouchPos(e, res)
          setIsDrawing(true)
          setCurrentPath([point])
          
          const ctx = ctxRef.current
          if (ctx) {
            ctx.setLineDash([])
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
          ctx.strokeStyle = '#FF0000'
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.setLineDash([])
          
          if (newPath.length >= 2) {
            const lastPoint = newPath[newPath.length - 2]
            const currentPoint = newPath[newPath.length - 1]
            ctx.beginPath()
            ctx.moveTo(lastPoint.x * res.width, lastPoint.y * res.height)
            ctx.lineTo(currentPoint.x * res.width, currentPoint.y * res.height)
            ctx.stroke()
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
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (canvas && ctx) {
        const query = Taro.createSelectorQuery()
        query.select('#courtCanvas')
          .fields({ size: true })
          .exec((res: any) => {
            if (res && res[0]) {
              const dpr = Taro.getWindowInfo().pixelRatio
              ctx.clearRect(0, 0, res[0].width * dpr, res[0].height * dpr)
              drawHalfCourtBackground(ctx, res[0].width, res[0].height)
            }
          })
      }
    }, 50)
  }



  // 将Canvas导出为图片
  const exportCanvasToImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      Taro.canvasToTempFilePath({
        canvas: canvasRef.current,
        success: (res) => {
          resolve(res.tempFilePath)
        },
        fail: (err) => {
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
    }
  }

  // 页面加载时初始化Canvas
  useEffect(() => {
    if (isWeapp) {
      const timer = setTimeout(() => initCanvas(), 300)
      return () => clearTimeout(timer)
    }
  }, [isWeapp, initCanvas])

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
      <View className='court-header'>
        <Text className='court-title'>半场模拟器</Text>
      </View>

      <View className='canvas-wrapper'>
        <Canvas
          type='2d'
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
    </View>
  )
}
