import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, Canvas } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import './index.css'

interface DrawPoint {
  x: number
  y: number
}

export default function CourtSimulator() {
  const canvasRef = useRef<any>(null)
  const ctxRef = useRef<any>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<DrawPoint[]>([])
  const [allPaths, setAllPaths] = useState<DrawPoint[][]>([])
  
  // 检测是否为微信小程序环境
  const isWeapp = process.env.TARO_ENV === 'weapp'

  // 初始化Canvas (使用 Canvas 2D API)
  const initCanvas = useCallback(() => {
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          return
        }
        
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        if (!canvas || !ctx) {
          return
        }
        
        canvasRef.current = canvas
        ctxRef.current = ctx
        
        // 设置 Canvas 尺寸（使用新API获取设备像素比）
        const windowInfo = Taro.getWindowInfo()
        const dpr = windowInfo.pixelRatio || 1
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)
        
        drawCourtBackground(ctx, res[0].width, res[0].height)
      })
  }, [])

  // 绘制羽毛球场地背景(基于标准SVG) - Canvas 2D API
  const drawCourtBackground = (ctx: any, width: number, height: number) => {
    // SVG原始尺寸: 800 x 1800
    // 保持宽高比，让球场在Canvas中水平居中，垂直上移
    const svgWidth = 800
    const svgHeight = 1800
    const scale = Math.min(width / svgWidth, height / svgHeight) * 1.15  // 放大15%
      
    // 计算居中偏移
    const offsetX = (width - svgWidth * scale) / 2
    // 球场上移：从-5%到-7%（再上移2%）
    const offsetY = height * (-0.07)
      
    // 填充浅蓝色背景
    ctx.fillStyle = '#c0e0ff'
    ctx.fillRect(0, 0, width, height)
      
    // 设置白色线条样式
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4 * scale
    ctx.lineCap = 'square'
      
    // 辅助函数:转换SVG坐标到Canvas坐标
    const transformX = (x: number) => offsetX + x * scale
    const transformY = (y: number) => offsetY + y * scale
      
    // === 双打边线(左右边界) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(150))
    ctx.lineTo(transformX(60), transformY(1644))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(740), transformY(150))
    ctx.lineTo(transformX(740), transformY(1644))
    ctx.stroke()
      
    // === 端线(上下边界) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(150))
    ctx.lineTo(transformX(740), transformY(150))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(1644))
    ctx.lineTo(transformX(740), transformY(1644))
    ctx.stroke()
  
    // === 单打边线 ===
    ctx.beginPath()
    ctx.moveTo(transformX(111), transformY(150))
    ctx.lineTo(transformX(111), transformY(1644))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(689), transformY(150))
    ctx.lineTo(transformX(689), transformY(1644))
    ctx.stroke()
  
    // === 双打后发球线(距离端线0.72米) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(230))
    ctx.lineTo(transformX(740), transformY(230))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(1564))
    ctx.lineTo(transformX(740), transformY(1564))
    ctx.stroke()
  
    // === 前发球线(距离球网1.98米) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(676))
    ctx.lineTo(transformX(740), transformY(676))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(1118))
    ctx.lineTo(transformX(740), transformY(1118))
    ctx.stroke()
  
    // === 中线(上半区:端线到前发球线) ===
    ctx.beginPath()
    ctx.moveTo(transformX(400), transformY(150))
    ctx.lineTo(transformX(400), transformY(676))
    ctx.stroke()
      
    // === 中线(下半区:端线到前发球线) ===
    ctx.beginPath()
    ctx.moveTo(transformX(400), transformY(1118))
    ctx.lineTo(transformX(400), transformY(1644))
    ctx.stroke()
  
    // === 端线处的发球区短标记(双打边线与单打边线之间) ===
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(150))
    ctx.lineTo(transformX(111), transformY(150))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(689), transformY(150))
    ctx.lineTo(transformX(740), transformY(150))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(1644))
    ctx.lineTo(transformX(111), transformY(1644))
    ctx.stroke()
      
    ctx.beginPath()
    ctx.moveTo(transformX(689), transformY(1644))
    ctx.lineTo(transformX(740), transformY(1644))
    ctx.stroke()
  
    // === 球网位置:虚线 ===
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 6 * scale
    ctx.setLineDash([16 * scale, 12 * scale])
    ctx.beginPath()
    ctx.moveTo(transformX(60), transformY(897))
    ctx.lineTo(transformX(740), transformY(897))
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 重绘所有路径 - Canvas 2D API
  const redrawAllPaths = () => {
    if (!ctxRef.current || !canvasRef.current) return
    
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    
    // 获取Canvas尺寸
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .fields({ size: true })
      .exec((res) => {
        if (res && res[0]) {
          const width = res[0].width
          const height = res[0].height
          
          // 清空画布
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // 重新绘制背景
          drawCourtBackground(ctx, width, height)
          
          // 绘制所有已保存的路径
          ctx.strokeStyle = '#FF0000'
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.setLineDash([])  // 使用实线
          
          allPaths.forEach((path) => {
            if (path.length < 2) return
            
            ctx.beginPath()
            // 将归一化坐标转换为实际坐标
            ctx.moveTo(path[0].x * width, path[0].y * height)
            
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x * width, path[i].y * height)
            }
            
            ctx.stroke()
          })
          
          // Canvas 2D API 不需要调用 draw()
        }
      })
  }

  // 获取触摸点在Canvas中的归一化坐标(0-1范围)
  const getTouchPos = (e: any, canvasRect: any) => {
    const touch = e.touches[0]
    // 使用 clientX/clientY 获取相对于视口的坐标
    // canvasRect 包含 left, top, width, height
    const x = touch.clientX - canvasRect.left
    const y = touch.clientY - canvasRect.top
    // 转换为归一化坐标
    return { 
      x: x / canvasRect.width,
      y: y / canvasRect.height
    }
  }

  // 触摸开始 - Canvas 2D API
  const handleTouchStart = (e: any) => {
    e.preventDefault()
    
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .boundingClientRect((res: any) => {
        if (res) {
          const pos = getTouchPos(e, res)
          setIsDrawing(true)
          setCurrentPath([pos])
          
          // 初始化线条样式为实线
          if (ctxRef.current) {
            ctxRef.current.setLineDash([])
          }
        }
      })
      .exec()
  }

  // 触摸移动 - Canvas 2D API
  const handleTouchMove = (e: any) => {
    e.preventDefault()
    if (!isDrawing || !ctxRef.current || !canvasRef.current) {
      return
    }
    
    Taro.createSelectorQuery()
      .select('#courtCanvas')
      .boundingClientRect((res: any) => {
        if (res) {
          const pos = getTouchPos(e, res)
          const newPath = [...currentPath, pos]
          setCurrentPath(newPath)
          
          const ctx = ctxRef.current
          const canvas = canvasRef.current
          
          // 清空画布
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // 重绘背景
          drawCourtBackground(ctx, res.width, res.height)
          
          // 重绘所有已保存的路径
          ctx.strokeStyle = '#FF0000'
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
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
          
          // 绘制当前路径
          if (newPath.length >= 2) {
            ctx.beginPath()
            ctx.moveTo(newPath[0].x * res.width, newPath[0].y * res.height)
            for (let i = 1; i < newPath.length; i++) {
              ctx.lineTo(newPath[i].x * res.width, newPath[i].y * res.height)
            }
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

  // 清空画布 - Canvas 2D API
  const handleClear = () => {
    setAllPaths([])
    setCurrentPath([])
    setTimeout(() => {
      if (ctxRef.current && canvasRef.current) {
        const ctx = ctxRef.current
        const canvas = canvasRef.current
        Taro.createSelectorQuery()
          .select('#courtCanvas')
          .fields({ size: true })
          .exec((res) => {
            if (res && res[0]) {
              // 清空画布
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              // 重新绘制背景
              drawCourtBackground(ctx, res[0].width, res[0].height)
            }
          })
      }
    }, 50)
  }

  // 将Canvas导出为图片 - Canvas 2D API
  const exportCanvasToImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!canvasRef.current) {
        reject(new Error('Canvas 未初始化'))
        return
      }
      
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
      
      // 先重绘所有内容（确保最新状态）
      await redrawAllPaths()
      
      // 等待绘制完成
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 导出Canvas为图片
      const imagePath = await exportCanvasToImage()
      
      Taro.hideLoading()
      
      // 提示用户使用右上角分享
      Taro.showToast({
        title: '请点击右上角分享',
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
    }
  }

  // 页面加载时初始化Canvas(仅微信小程序环境)
  useEffect(() => {
    if (isWeapp) {
      const timer = setTimeout(() => initCanvas(), 300)
      return () => clearTimeout(timer)
    }
  }, [isWeapp, initCanvas])

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
        <Text className='court-title'>全场模拟器</Text>
      </View>

      {/* Canvas组件 */}
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
      
      {/* 控制按钮 */}
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
