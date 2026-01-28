"""
CFspider AI Browser - AI 驱动的智能浏览器

通过大模型 API 驱动浏览器自动完成任务，支持：
- 爬虫模式：自动分析页面结构，智能提取数据
- 操作模式：理解用户指令，自动完成网页操作

支持任意 OpenAI 兼容 API：
- DeepSeek (免费额度)
- 通义千问 (免费额度)
- Moonshot (免费额度)
- OpenAI
- 本地模型 (Ollama)

使用方法：
    >>> import cfspider
    >>> 
    >>> # 配置 AI
    >>> browser = cfspider.AIBrowser(
    ...     base_url="https://api.deepseek.com/v1",
    ...     api_key="your-api-key",
    ...     model="deepseek-chat"
    ... )
    >>> 
    >>> # 爬虫模式：自动提取数据
    >>> data = await browser.crawl(
    ...     "https://news.ycombinator.com",
    ...     goal="提取首页所有新闻标题和链接"
    ... )
    >>> 
    >>> # 操作模式：完成复杂任务
    >>> await browser.execute(
    ...     "https://github.com",
    ...     task="搜索 cfspider 项目，点击第一个结果，获取 star 数量"
    ... )
"""

import asyncio
import json
import re
from typing import Optional, List, Dict, Any, Union, Callable
from dataclasses import dataclass

try:
    import aiohttp
except ImportError:
    aiohttp = None

from .human_browser import HumanBrowser


# 免费/低价大模型 API 配置
PRESET_APIS = {
    "nvidia": {
        "base_url": "https://integrate.api.nvidia.com/v1",
        "model": "nvidia/llama-3.1-nemotron-70b-instruct",
        "description": "NVIDIA NIM（免费额度 1000 请求/天）"
    },
    "nvidia-glm": {
        "base_url": "https://integrate.api.nvidia.com/v1",
        "model": "z-ai/glm4.7",
        "description": "NVIDIA GLM4.7（免费）"
    },
    "nvidia-minimax": {
        "base_url": "https://integrate.api.nvidia.com/v1",
        "model": "minimaxai/minimax-m2.1",
        "description": "NVIDIA Minimax M2.1（免费）"
    },
    "modelscope": {
        "base_url": "https://api-inference.modelscope.cn/v1",
        "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
        "description": "ModelScope 魔搭（免费 Qwen2.5-Coder-32B）"
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
        "description": "DeepSeek（免费额度 500万 tokens）"
    },
    "qwen": {
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-turbo",
        "description": "通义千问（免费额度 100万 tokens）"
    },
    "moonshot": {
        "base_url": "https://api.moonshot.cn/v1",
        "model": "moonshot-v1-8k",
        "description": "Moonshot（免费额度 15元）"
    },
    "glm": {
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "model": "glm-4-flash",
        "description": "智谱 GLM-4-Flash（完全免费）"
    },
    "ollama": {
        "base_url": "http://localhost:11434/v1",
        "model": "llama3.2",
        "description": "本地 Ollama（完全免费）"
    },
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
        "description": "OpenAI GPT-4o-mini"
    }
}


@dataclass
class CrawlResult:
    """爬虫结果"""
    success: bool
    data: Any
    steps: List[str]
    html: str
    error: Optional[str] = None


@dataclass
class ExecuteResult:
    """操作结果"""
    success: bool
    result: str
    steps: List[str]
    screenshots: List[bytes]
    error: Optional[str] = None


class AIBrowser:
    """
    AI 驱动的智能浏览器
    
    通过大模型理解网页结构和用户意图，自动完成爬取和操作任务。
    """
    
    def __init__(
        self,
        # AI 配置
        base_url: str = None,
        api_key: str = None,
        model: str = None,
        preset: str = None,  # 使用预设 API
        
        # 浏览器配置
        cf_proxies: Optional[str] = None,
        uuid: Optional[str] = None,
        headless: bool = False,
        human_like: bool = True,
        
        # AI 行为配置
        max_steps: int = 20,
        screenshot_each_step: bool = False,
        verbose: bool = True
    ):
        """
        初始化 AI 浏览器
        
        Args:
            base_url: API 基础 URL（如 https://api.deepseek.com/v1）
            api_key: API 密钥
            model: 模型名称（如 deepseek-chat）
            preset: 使用预设 API（deepseek/qwen/moonshot/glm/ollama/openai）
            
            cf_proxies: CFspider Workers 代理
            uuid: VLESS UUID
            headless: 是否无头模式
            human_like: 是否启用人类行为模拟
            
            max_steps: 最大操作步数
            screenshot_each_step: 是否每步截图
            verbose: 是否输出详细日志
        """
        # 处理预设
        if preset and preset in PRESET_APIS:
            config = PRESET_APIS[preset]
            self.base_url = base_url or config["base_url"]
            self.model = model or config["model"]
        else:
            self.base_url = base_url
            self.model = model
        
        self.api_key = api_key
        self.cf_proxies = cf_proxies
        self.uuid = uuid
        self.headless = headless
        self.human_like = human_like
        self.max_steps = max_steps
        self.screenshot_each_step = screenshot_each_step
        self.verbose = verbose
        
        self._browser: Optional[HumanBrowser] = None
        self._conversation: List[Dict] = []
        
        if not self.base_url or not self.api_key:
            raise ValueError(
                "请配置 API：\n"
                "  AIBrowser(base_url='...', api_key='...', model='...')\n"
                "或使用预设：\n"
                "  AIBrowser(preset='deepseek', api_key='...')\n\n"
                "支持的预设：" + ", ".join(PRESET_APIS.keys())
            )
    
    def _log(self, msg: str):
        """输出日志"""
        if self.verbose:
            print(f"[AIBrowser] {msg}")
    
    async def _call_llm(self, messages: List[Dict], tools: List[Dict] = None) -> Dict:
        """调用大模型 API"""
        if not aiohttp:
            raise ImportError("请安装 aiohttp: pip install aiohttp")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 4096
        }
        
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url.rstrip('/')}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status != 200:
                    error = await resp.text()
                    raise Exception(f"API 错误 {resp.status}: {error}")
                return await resp.json()
    
    async def _get_page_context(self) -> str:
        """获取当前页面上下文（用于 AI 分析）"""
        # 获取简化的页面结构
        script = """
        (function() {
            const elements = [];
            const interactable = document.querySelectorAll(
                'a, button, input, select, textarea, [onclick], [role="button"]'
            );
            
            interactable.forEach((el, idx) => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    let text = el.innerText || el.value || el.placeholder || '';
                    text = text.slice(0, 100).replace(/\\s+/g, ' ').trim();
                    
                    const attrs = [];
                    if (el.id) attrs.push(`id="${el.id}"`);
                    if (el.className) attrs.push(`class="${el.className.toString().slice(0, 50)}"`);
                    if (el.name) attrs.push(`name="${el.name}"`);
                    if (el.type) attrs.push(`type="${el.type}"`);
                    if (el.href) attrs.push(`href="${el.href.slice(0, 100)}"`);
                    
                    elements.push({
                        index: idx,
                        tag: el.tagName.toLowerCase(),
                        attrs: attrs.join(' '),
                        text: text,
                        selector: el.id ? `#${el.id}` : 
                                  el.className ? `.${el.className.toString().split(' ')[0]}` :
                                  `${el.tagName.toLowerCase()}:nth-of-type(${idx + 1})`
                    });
                }
            });
            
            return {
                title: document.title,
                url: window.location.href,
                elements: elements.slice(0, 50)  // 限制数量
            };
        })()
        """
        
        result = await self._browser.evaluate(script)
        return json.dumps(result, ensure_ascii=False, indent=2)
    
    async def _start_browser(self):
        """启动浏览器"""
        if self._browser is None:
            self._browser = HumanBrowser(
                cf_proxies=self.cf_proxies,
                uuid=self.uuid,
                headless=self.headless,
                human_like=self.human_like
            )
            await self._browser.start()
    
    async def crawl(
        self,
        url: str,
        goal: str,
        output_format: str = "json"
    ) -> CrawlResult:
        """
        爬虫模式：自动分析页面并提取数据
        
        Args:
            url: 目标 URL
            goal: 爬取目标描述（如 "提取所有商品名称和价格"）
            output_format: 输出格式 (json/text/list)
        
        Returns:
            CrawlResult: 爬取结果
        
        Example:
            >>> result = await browser.crawl(
            ...     "https://news.ycombinator.com",
            ...     goal="提取首页前10条新闻的标题和链接"
            ... )
            >>> print(result.data)
        """
        await self._start_browser()
        
        steps = []
        screenshots = []
        
        try:
            # 打开页面
            self._log(f"打开页面: {url}")
            await self._browser.goto(url)
            steps.append(f"打开页面: {url}")
            
            # 获取页面上下文
            context = await self._get_page_context()
            html = await self._browser.html()
            
            # 构建提示词
            system_prompt = """你是一个智能网页数据提取助手。
用户会给你一个网页的结构信息和提取目标。
请分析页面结构，编写 JavaScript 代码来提取数据。

返回格式：
```javascript
// 你的提取代码
```

代码应该返回提取的数据（JSON 格式）。
只返回代码，不要解释。"""
            
            user_prompt = f"""页面信息：
{context}

提取目标：{goal}
输出格式：{output_format}

请编写 JavaScript 代码提取数据。"""
            
            # 调用 AI
            self._log("AI 分析页面结构...")
            response = await self._call_llm([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
            
            content = response["choices"][0]["message"]["content"]
            steps.append("AI 分析完成")
            
            # 提取 JavaScript 代码
            code_match = re.search(r'```(?:javascript|js)?\n(.*?)\n```', content, re.DOTALL)
            if code_match:
                js_code = code_match.group(1)
            else:
                js_code = content
            
            # 执行提取代码
            self._log("执行数据提取...")
            data = await self._browser.evaluate(js_code)
            steps.append("数据提取完成")
            
            return CrawlResult(
                success=True,
                data=data,
                steps=steps,
                html=html
            )
            
        except Exception as e:
            self._log(f"爬取错误: {e}")
            return CrawlResult(
                success=False,
                data=None,
                steps=steps,
                html="",
                error=str(e)
            )
    
    async def execute(
        self,
        url: str,
        task: str,
        on_step: Callable[[str], None] = None
    ) -> ExecuteResult:
        """
        操作模式：让 AI 理解并完成复杂任务
        
        Args:
            url: 起始 URL
            task: 任务描述（如 "登录账号，搜索商品，加入购物车"）
            on_step: 每步回调函数
        
        Returns:
            ExecuteResult: 操作结果
        
        Example:
            >>> result = await browser.execute(
            ...     "https://github.com",
            ...     task="搜索 cfspider，点击第一个结果，告诉我 star 数量"
            ... )
            >>> print(result.result)
        """
        await self._start_browser()
        
        steps = []
        screenshots = []
        
        # 定义可用工具
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "click",
                    "description": "点击页面元素",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "selector": {
                                "type": "string",
                                "description": "CSS 选择器"
                            }
                        },
                        "required": ["selector"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "type_text",
                    "description": "在输入框中输入文本",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "selector": {
                                "type": "string",
                                "description": "CSS 选择器"
                            },
                            "text": {
                                "type": "string",
                                "description": "要输入的文本"
                            }
                        },
                        "required": ["selector", "text"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "scroll",
                    "description": "滚动页面",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "direction": {
                                "type": "string",
                                "enum": ["up", "down"],
                                "description": "滚动方向"
                            }
                        },
                        "required": ["direction"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "wait",
                    "description": "等待一段时间",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "seconds": {
                                "type": "number",
                                "description": "等待秒数"
                            }
                        },
                        "required": ["seconds"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_text",
                    "description": "获取元素的文本内容",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "selector": {
                                "type": "string",
                                "description": "CSS 选择器"
                            }
                        },
                        "required": ["selector"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "done",
                    "description": "任务完成，返回结果",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "result": {
                                "type": "string",
                                "description": "任务结果"
                            }
                        },
                        "required": ["result"]
                    }
                }
            }
        ]
        
        try:
            # 打开页面
            self._log(f"打开页面: {url}")
            await self._browser.goto(url)
            steps.append(f"打开页面: {url}")
            
            if self.screenshot_each_step:
                screenshots.append(await self._browser.screenshot())
            
            # 初始化对话
            system_prompt = """你是一个网页自动化助手，通过工具来完成用户的任务。

可用工具：
- click(selector): 点击元素
- type_text(selector, text): 输入文本
- scroll(direction): 滚动页面 (up/down)
- wait(seconds): 等待
- get_text(selector): 获取文本
- done(result): 完成任务并返回结果

每次我会给你当前页面的结构信息，你决定下一步操作。
一步一步完成任务，完成后调用 done() 返回结果。"""
            
            messages = [{"role": "system", "content": system_prompt}]
            
            # 开始执行循环
            for step in range(self.max_steps):
                # 获取页面上下文
                context = await self._get_page_context()
                
                user_msg = f"""当前页面：
{context}

任务：{task}

已完成的步骤：
{chr(10).join(steps)}

请决定下一步操作。"""
                
                messages.append({"role": "user", "content": user_msg})
                
                # 调用 AI
                self._log(f"步骤 {step + 1}: 分析中...")
                response = await self._call_llm(messages, tools)
                
                choice = response["choices"][0]
                message = choice["message"]
                messages.append(message)
                
                # 检查是否有工具调用
                if "tool_calls" not in message or not message["tool_calls"]:
                    # 没有工具调用，可能是对话回复
                    content = message.get("content", "")
                    if content:
                        self._log(f"AI: {content}")
                    break
                
                # 执行工具调用
                for tool_call in message["tool_calls"]:
                    func_name = tool_call["function"]["name"]
                    func_args = json.loads(tool_call["function"]["arguments"])
                    
                    self._log(f"执行: {func_name}({func_args})")
                    
                    if on_step:
                        on_step(f"{func_name}({func_args})")
                    
                    # 执行操作
                    result = await self._execute_tool(func_name, func_args)
                    step_desc = f"{func_name}({func_args}) -> {result}"
                    steps.append(step_desc)
                    
                    # 检查是否完成
                    if func_name == "done":
                        return ExecuteResult(
                            success=True,
                            result=func_args.get("result", ""),
                            steps=steps,
                            screenshots=screenshots
                        )
                    
                    # 添加工具结果
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": str(result)
                    })
                    
                    if self.screenshot_each_step:
                        screenshots.append(await self._browser.screenshot())
                
                await asyncio.sleep(1)
            
            return ExecuteResult(
                success=True,
                result="达到最大步数限制",
                steps=steps,
                screenshots=screenshots
            )
            
        except Exception as e:
            self._log(f"执行错误: {e}")
            return ExecuteResult(
                success=False,
                result="",
                steps=steps,
                screenshots=screenshots,
                error=str(e)
            )
    
    async def _execute_tool(self, name: str, args: Dict) -> str:
        """执行工具"""
        try:
            if name == "click":
                await self._browser.human_click(args["selector"])
                await asyncio.sleep(1)
                return "点击成功"
            
            elif name == "type_text":
                await self._browser.human_type(args["selector"], args["text"])
                return "输入成功"
            
            elif name == "scroll":
                await self._browser.human_scroll(args["direction"])
                return "滚动成功"
            
            elif name == "wait":
                await asyncio.sleep(args["seconds"])
                return f"等待 {args['seconds']} 秒"
            
            elif name == "get_text":
                text = await self._browser.evaluate(
                    f"document.querySelector('{args['selector']}')?.innerText || ''"
                )
                return text[:500] if text else "未找到元素"
            
            elif name == "done":
                return args.get("result", "完成")
            
            else:
                return f"未知工具: {name}"
                
        except Exception as e:
            return f"错误: {e}"
    
    async def chat(self, message: str) -> str:
        """
        对话模式：与 AI 对话，让它帮你操作浏览器
        
        Args:
            message: 用户消息
        
        Returns:
            AI 回复
        
        Example:
            >>> await browser.goto("https://github.com")
            >>> response = await browser.chat("帮我搜索 cfspider")
            >>> print(response)
        """
        await self._start_browser()
        
        # 获取页面上下文
        context = await self._get_page_context()
        
        # 添加用户消息
        self._conversation.append({
            "role": "user",
            "content": f"当前页面：\n{context}\n\n用户：{message}"
        })
        
        # 调用 AI
        system = """你是一个浏览器助手。用户会问你关于当前页面的问题，
或者让你帮忙操作页面。请简洁回答，如果需要操作，告诉用户你会做什么。"""
        
        messages = [{"role": "system", "content": system}] + self._conversation
        
        response = await self._call_llm(messages)
        content = response["choices"][0]["message"]["content"]
        
        self._conversation.append({"role": "assistant", "content": content})
        
        return content
    
    async def goto(self, url: str) -> str:
        """导航到 URL"""
        await self._start_browser()
        return await self._browser.goto(url)
    
    async def screenshot(self, path: str = None) -> bytes:
        """截图"""
        await self._start_browser()
        return await self._browser.screenshot(path)
    
    async def close(self):
        """关闭浏览器"""
        if self._browser:
            await self._browser.close()
    
    async def __aenter__(self):
        await self._start_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
    
    @staticmethod
    def list_presets() -> Dict[str, Dict]:
        """列出所有预设 API"""
        return PRESET_APIS


# 同步版本
class AIBrowserSync:
    """
    同步版 AI 浏览器
    
    Example:
        >>> browser = cfspider.AIBrowserSync(preset="deepseek", api_key="...")
        >>> result = browser.crawl("https://example.com", goal="提取所有链接")
    """
    
    def __init__(self, *args, **kwargs):
        self._browser = AIBrowser(*args, **kwargs)
        self._loop = None
    
    def _get_loop(self):
        if self._loop is None:
            try:
                self._loop = asyncio.get_event_loop()
            except RuntimeError:
                self._loop = asyncio.new_event_loop()
                asyncio.set_event_loop(self._loop)
        return self._loop
    
    def _run(self, coro):
        return self._get_loop().run_until_complete(coro)
    
    def crawl(self, url: str, goal: str, output_format: str = "json") -> CrawlResult:
        return self._run(self._browser.crawl(url, goal, output_format))
    
    def execute(self, url: str, task: str, on_step=None) -> ExecuteResult:
        return self._run(self._browser.execute(url, task, on_step))
    
    def chat(self, message: str) -> str:
        return self._run(self._browser.chat(message))
    
    def goto(self, url: str) -> str:
        return self._run(self._browser.goto(url))
    
    def screenshot(self, path: str = None) -> bytes:
        return self._run(self._browser.screenshot(path))
    
    def close(self):
        return self._run(self._browser.close())
    
    def __enter__(self):
        self._run(self._browser._start_browser())
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    @staticmethod
    def list_presets() -> Dict[str, Dict]:
        return PRESET_APIS

