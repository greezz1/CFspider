import { useRef, useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import MessageList from './MessageList'
import InputBox from './InputBox'
import { useStore } from '../../store'
import { sendAIMessage, manualSafetyCheck } from '../../services/ai'

export default function AIChat() {
  const { messages, isAILoading } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (content: string) => {
    await sendAIMessage(content)
  }

  const handleSafetyCheck = async () => {
    setCheckingStatus('checking')
    const result = await manualSafetyCheck()
    setCheckingStatus(result.includes('WARNING') ? 'warning' : 'safe')
    setTimeout(() => setCheckingStatus(null), 3000)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 快捷操作栏 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <button
          onClick={handleSafetyCheck}
          disabled={checkingStatus === 'checking'}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            checkingStatus === 'checking' 
              ? 'bg-gray-200 text-gray-500 cursor-wait'
              : checkingStatus === 'safe'
              ? 'bg-green-100 text-green-700'
              : checkingStatus === 'warning'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
          title="Check current website safety"
        >
          <Shield size={14} />
          {checkingStatus === 'checking' ? 'Checking...' : 
           checkingStatus === 'safe' ? 'Safe ✓' :
           checkingStatus === 'warning' ? 'Warning!' :
           'Safety Check'}
        </button>
        <span className="text-xs text-gray-400">Click to check current page</span>
      </div>

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm px-6">
            <p>告诉我你想做什么</p>
            <p className="text-xs mt-2 text-gray-300">例如: 搜索京东、点击登录按钮</p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      {/* 输入框 */}
      <InputBox onSend={handleSend} disabled={isAILoading} />
    </div>
  )
}
