# cfspider-智能浏览器

AI 驱动的智能浏览器 - 通过自然语言对话控制浏览器，像真人一样操作网页

## 功能特性

### 核心功能
- **AI 智能助手**: 通过自然语言对话控制浏览器，支持多种 AI 模型
- **真人模拟操作**: AI 像真人一样点击、输入、滚动，完整展示操作过程
- **虚拟鼠标**: 可视化鼠标移动和点击动画，直观展示 AI 操作

### 浏览器功能
- **多标签页**: 支持新建、关闭、切换标签页（Ctrl+T/Ctrl+W）
- **历史记录**: 自动记录访问历史，支持查看和清空
- **搜索引擎切换**: 支持 Bing、Google、百度、DuckDuckGo
- **自动点击验证**: 自动点击年龄验证、Cookie 同意等弹窗

### 快捷键
- `Ctrl+T` - 新建标签页
- `Ctrl+W` - 关闭当前标签页
- `Ctrl+R` / `F5` - 刷新页面
- `Alt+←` / `Alt+→` - 后退/前进
- `Ctrl+L` - 聚焦地址栏
- `F12` - 开发者工具

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run electron:dev
```

### 构建应用

```bash
# Windows
npm run electron:build-win

# macOS
npm run electron:build-mac
```

## 使用方法

### 1. 配置 AI

1. 点击右上角设置按钮
2. 选择 AI 服务商或自定义 API 地址
3. 输入 API 密钥
4. 选择模型

支持的 AI 服务商：
- **Ollama** - 本地运行，无需 API Key（推荐）
- OpenAI (GPT-4, GPT-3.5)
- DeepSeek
- Groq
- Moonshot (Kimi)
- 智谱 AI
- 通义千问
- SiliconFlow
- 其他 OpenAI 兼容 API

**支持自定义模型名称**：在模型下拉框中可直接输入任意模型名称

### 2. 与 AI 对话

点击右下角蓝色按钮打开 AI 对话框，输入自然语言指令：

- "打开 GitHub" - AI 会通过搜索引擎搜索并点击打开
- "搜索 Python 教程" - 在当前搜索引擎搜索
- "把搜索引擎改成谷歌" - 切换默认搜索引擎
- "在 GitHub 搜索 vue" - 先打开 GitHub 再搜索
- "返回上一页" - 点击后退

### 3. 搜索引擎设置

1. 打开设置 → 搜索引擎
2. 选择默认搜索引擎
3. 设置会自动保存

## 技术栈

- **Electron** - 桌面应用框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **Zustand** - 状态管理
- **Vite** - 构建工具

## 项目结构

```
cfspider-browser/
├── electron/           # Electron 主进程
│   ├── main.ts        # 主进程入口
│   └── preload.ts     # 预加载脚本
├── src/
│   ├── components/    # React 组件
│   │   ├── Browser/   # 浏览器面板
│   │   │   ├── Browser.tsx
│   │   │   ├── TabBar.tsx      # 标签栏
│   │   │   ├── Toolbar.tsx     # 工具栏
│   │   │   ├── AddressBar.tsx  # 地址栏
│   │   │   └── VirtualMouse.tsx # 虚拟鼠标
│   │   ├── AIChat/    # AI 对话
│   │   └── Settings/  # 设置
│   ├── services/      # 服务层
│   │   └── ai.ts      # AI API 和工具
│   └── store/         # Zustand 状态管理
└── package.json
```

## 数据存储

应用数据保存在用户目录下：
- `ai-config.json` - AI 配置
- `saved-configs.json` - 已保存的 AI 配置
- `browser-settings.json` - 浏览器设置（搜索引擎等）
- `history.json` - 历史记录

## 许可证

MIT
