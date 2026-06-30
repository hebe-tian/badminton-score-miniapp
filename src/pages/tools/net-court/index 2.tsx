import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import './index.css'

interface DrawPoint {
  x: number
  y: number
}

export default function NetCourtSimulator() {
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
          
          drawNetCourtBackground(ctx, width, height)
        }
      })
  }, [])

  // 绘制网前场景背景 - Canvas 2D API
  const drawNetCourtBackground = (ctx: any, width: number, height: number) => {
    const svgWidth = 800
    const svgHeight = 600
    // 保持宽高比，放大20.75%
    const scale = Math.min(width / svgWidth, height / svgHeight) * 1.2075
    
    // 计算居中偏移
    const offsetX = (width - svgWidth * scale) / 2
    // 球场下移5%
    const offsetY = height * 0.05
    
    const transformX = (x: number) => offsetX + x * scale
    const transformY = (y: number) => offsetY + y * scale
    
    // 填充浅绿色渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#e8f5e9')
    gradient.addColorStop(1, '#c8e6c9')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    // 地面线（深绿色）
    ctx.strokeStyle = '#66bb6a'
    ctx.lineWidth = 3 * scale
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(520))
    ctx.lineTo(transformX(740), transformY(520))
    ctx.stroke()
    
    // 网柱（银灰色金属质感）
    const postGradient = ctx.createLinearGradient(transformX(80), 0, transformX(95), 0)
    postGradient.addColorStop(0, '#90a4ae')
    postGradient.addColorStop(0.5, '#cfd8dc')
    postGradient.addColorStop(1, '#90a4ae')
    ctx.fillStyle = postGradient
    ctx.fillRect(transformX(80), transformY(80), 15 * scale, 440 * scale)
    ctx.fillRect(transformX(705), transformY(80), 15 * scale, 440 * scale)
    
    // 网柱阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(transformX(95), transformY(80), 3 * scale, 440 * scale)
    ctx.fillRect(transformX(720), transformY(80), 3 * scale, 440 * scale)
    
    // 球网背景（半透明白色）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillRect(transformX(95), transformY(80), 610 * scale, 200 * scale)
    
    // 球网边框
    ctx.strokeStyle = '#78909c'
    ctx.lineWidth = 2 * scale
    ctx.strokeRect(transformX(95), transformY(80), 610 * scale, 200 * scale)
    
    // 球网网格线（细线）
    ctx.strokeStyle = '#b0bec5'
    ctx.lineWidth = 1 * scale
    // 横线
    for (let y = 110; y <= 260; y += 30) {
      ctx.beginPath()
      ctx.moveTo(transformX(95), transformY(y))
      ctx.lineTo(transformX(705), transformY(y))
      ctx.stroke()
    }
    // 竖线
    for (let x = 125; x <= 675; x += 30) {
      ctx.beginPath()
      ctx.moveTo(transformX(x), transformY(80))
      ctx.lineTo(transformX(x), transformY(280))
      ctx.stroke()
    }
    
    // 网顶白带（加厚）
    ctx.fillStyle = '#eceff1'
    ctx.fillRect(transformX(95), transformY(76), 610 * scale, 6 * scale)
    ctx.strokeStyle = '#546e7a'
    ctx.lineWidth = 1 * scale
    ctx.strokeRect(transformX(95), transformY(76), 610 * scale, 6 * scale)
    
    // 双打线（蓝色实线，加粗）
    ctx.strokeStyle = '#1976d2'
    ctx.lineWidth = 5 * scale
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(transformX(95), transformY(280))
    ctx.lineTo(transformX(95), transformY(520))
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(transformX(705), transformY(280))
    ctx.lineTo(transformX(705), transformY(520))
    ctx.stroke()
    
    // 单打线（橙色虚线）
    ctx.strokeStyle = '#f57c00'
    ctx.lineWidth = 4 * scale
    ctx.setLineDash([12 * scale, 8 * scale])
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
    ctx.strokeStyle = '#388e3c'
    ctx.lineWidth = 4 * scale
    ctx.setLineDash([15 * scale, 8 * scale, 3 * scale, 8 * scale])
    ctx.beginPath()
    ctx.moveTo(transformX(400), transformY(280))
    ctx.lineTo(transformX(400), transformY(520))
    ctx.stroke()
    ctx.setLineDash([])
    
    // 添加地面纹理（浅色横线）
    ctx.strokeStyle = 'rgba(102, 187, 106, 0.3)'
    ctx.lineWidth = 1 * scale
    for (let y = 300; y <= 500; y += 40) {
      ctx.beginPath()
      ctx.moveTo(transformX(100), transformY(y))
      ctx.lineTo(transformX(700), transformY(y))
      ctx.stroke()
    }
  }

  // 重绘所有路径 - Canvas 2D API
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
          drawNetCourtBackground(ctx, width, height)
          
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
    const x = e.touches[0].clientX - canvasRect.left
    const y = e.touches[0].clientY - canvasRect.top
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
              drawNetCourtBackground(ctx, res[0].width, res[0].height)
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
      <View className='court-header'>
        <Text className='court-title'>网前模拟器</Text>
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
