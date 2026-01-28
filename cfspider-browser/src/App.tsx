import { useState, useEffect } from 'react'
import { MessageCircle, X, History, Trash2, Plus, ChevronDown } from 'lucide-react'
import Browser from './components/Browser/Browser'
import AIChat from './components/AIChat/AIChat'
import SettingsModal from './components/Settings/SettingsModal'
import { useStore } from './store'

// 从模型名称获取 AI 助手名称
function getAIName(model: string): string {
  if (!model) return 'AI 助手'
  const lowerModel = model.toLowerCase()
  if (lowerModel.includes('gpt-4')) return 'GPT-4'
  if (lowerModel.includes('gpt-3')) return 'GPT-3.5'
  if (lowerModel.includes('claude')) return 'Claude'
  if (lowerModel.includes('gemini')) return 'Gemini'
  if (lowerModel.includes('deepseek')) return 'DeepSeek'
  if (lowerModel.includes('qwen')) return '通义千问'
  if (lowerModel.includes('glm')) return 'ChatGLM'
  if (lowerModel.includes('llama')) return 'LLaMA'
  if (lowerModel.includes('mistral')) return 'Mistral'
  // 显示模型名称的前部分
  return model.split('/').pop()?.split('-')[0] || 'AI 助手'
}

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const { 
    loadConfig, loadSavedConfigs, loadBrowserSettings, loadChatSessions,
    aiConfig, chatSessions, clearMessages, newChatSession, 
    switchChatSession, deleteChatSession 
  } = useStore()
  
  const aiName = getAIName(aiConfig.model)

  useEffect(() => {
    // 并行加载所有配置
    Promise.all([
      loadConfig(),
      loadSavedConfigs(),
      loadBrowserSettings(),
      loadChatSessions()
    ]).then(() => setIsReady(true))
  }, [])

  // 等待设置加载完成（简化加载界面）
  if (!isReady) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white">
      {/* 浏览器 - 占满整个窗口 */}
      <Browser onSettingsClick={() => setShowSettings(true)} />

      {/* AI 悬浮按钮 */}
      {!showAI && (
        <button
          onClick={() => setShowAI(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500/90 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-[99999]"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* AI 对话悬浮窗 - 半透明以便观察操作过程 */}
      {showAI && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-white/85 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 flex flex-col overflow-hidden z-[99999]">
          {/* 悬浮窗头部 */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-500/90 text-white">
            <div className="flex items-center gap-2">
              <span className="font-medium">{aiName}</span>
              {/* 历史记录下拉 */}
              <div className="relative">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1 hover:bg-white/20 rounded flex items-center gap-1 text-sm"
                  title="历史记录"
                >
                  <History size={16} />
                  <ChevronDown size={14} />
                </button>
                {showHistory && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 max-h-80 overflow-auto">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">历史记录</span>
                      <button
                        onClick={() => { newChatSession(); setShowHistory(false); }}
                        className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        <Plus size={12} />
                        新对话
                      </button>
                    </div>
                    {chatSessions.length === 0 ? (
                      <div className="px-3 py-4 text-center text-gray-400 text-xs">暂无历史记录</div>
                    ) : (
                      chatSessions.map(session => (
                        <div
                          key={session.id}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                          onClick={() => { switchChatSession(session.id); setShowHistory(false); }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-700 truncate">{session.title}</div>
                            <div className="text-xs text-gray-400">{new Date(session.updatedAt).toLocaleDateString()}</div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteChatSession(session.id); }}
                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* 清空对话按钮 */}
              <button
                onClick={clearMessages}
                className="p-1 hover:bg-white/20 rounded"
                title="清空对话"
              >
                <Trash2 size={16} />
              </button>
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowAI(false)}
                className="p-1 hover:bg-white/20 rounded"
                title="关闭"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          {/* 对话内容 */}
          <div className="flex-1 overflow-hidden">
            <AIChat />
          </div>
        </div>
      )}

      {/* 设置 */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
