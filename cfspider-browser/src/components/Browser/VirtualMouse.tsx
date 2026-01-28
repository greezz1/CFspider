import { useEffect, useState, useRef } from 'react'
import { useStore } from '../../store'

export default function VirtualMouse() {
  const { mouseState } = useStore()
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [isClicking, setIsClicking] = useState(false)
  const animationRef = useRef<number>()

  // 平滑移动到目标位置
  useEffect(() => {
    if (!mouseState.visible) return

    const targetX = mouseState.x
    const targetY = mouseState.y
    const startX = position.x < 0 ? targetX : position.x
    const startY = position.y < 0 ? targetY : position.y
    const startTime = Date.now()
    const duration = mouseState.duration || 300

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // 使用 easeOutCubic 缓动函数，使移动更自然
      const eased = 1 - Math.pow(1 - progress, 3)
      
      const currentX = startX + (targetX - startX) * eased
      const currentY = startY + (targetY - startY) * eased
      
      setPosition({ x: currentX, y: currentY })
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mouseState.x, mouseState.y, mouseState.visible, mouseState.duration])

  // 点击动画
  useEffect(() => {
    if (mouseState.clicking) {
      setIsClicking(true)
      const timer = setTimeout(() => setIsClicking(false), 150)
      return () => clearTimeout(timer)
    }
  }, [mouseState.clicking, mouseState.clickId])

  if (!mouseState.visible) return null

  // 鼠标尖端在 SVG 中的偏移（path 从 5.5, 3.21 开始）
  const tipOffsetX = 5.5
  const tipOffsetY = 3.21

  return (
    <div
      className="pointer-events-none fixed z-[99999] transition-opacity duration-200"
      style={{
        left: position.x - tipOffsetX,
        top: position.y - tipOffsetY,
        opacity: mouseState.visible ? 1 : 0,
      }}
    >
      {/* 鼠标光标 SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className={`drop-shadow-lg transition-transform duration-100 ${
          isClicking ? 'scale-90' : 'scale-100'
        }`}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
      >
        {/* 鼠标主体 */}
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.76a.5.5 0 0 0-.85.45Z"
          fill={isClicking ? '#00cc66' : '#00ff88'}
          stroke="#000"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* 点击涟漪效果 */}
      {isClicking && (
        <div className="absolute left-0 top-0">
          <div className="w-6 h-6 rounded-full bg-primary/50 animate-ping" />
        </div>
      )}
    </div>
  )
}
