"""
CFspider AI Browser V2 - 基于 Playwright 的 AI 智能浏览器

更稳定的实现，使用 Playwright 替代原生 CDP。
支持爬虫模式和操作模式，由 AI 驱动完成任务。
"""

import asyncio
import json
import re
import random
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass

try:
    from playwright.async_api import async_playwright, Page, Browser
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

try:
    import aiohttp
except ImportError:
    aiohttp = None


# 预设 API
PRESET_APIS = {
    "nvidia": {
        "base_url": "https://integrate.api.nvidia.com/v1",
        "model": "nvidia/llama-3.1-nemotron-70b-instruct",
        "description": "NVIDIA NIM"
    },
    "nvidia-glm": {
        "base_url": "https://integrate.api.nvidia.com/v1",
        "model": "z-ai/glm4.7",
        "description": "NVIDIA GLM4.7"
    },
    "nvidia-minimax": {
        "base_url": "https://integrate.api.nvidia.com/v1",
        "model": "minimaxai/minimax-m2.1",
        "description": "NVIDIA Minimax"
    },
    "modelscope": {
        "base_url": "https://api-inference.modelscope.cn/v1",
        "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
        "description": "ModelScope Qwen"
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
        "description": "DeepSeek"
    },
    "glm": {
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "model": "glm-4-flash",
        "description": "智谱 GLM-4-Flash"
    },
}


@dataclass
class TaskResult:
    """任务结果"""
    success: bool
    result: str
    steps: List[str]
    error: Optional[str] = None


class AIBrowserV2:
    """
    AI 驱动的智能浏览器 V2
    
    基于 Playwright，更稳定可靠。
    """
    
    def __init__(
        self,
        base_url: str = None,
        api_key: str = None,
        model: str = None,
        preset: str = None,
        headless: bool = False,
        slow_mo: int = 100,  # 操作延迟（毫秒）
        verbose: bool = True
    ):
        if not PLAYWRIGHT_AVAILABLE:
            raise ImportError("请安装 playwright: pip install playwright && playwright install")
        
        # 处理预设
        if preset and preset in PRESET_APIS:
            config = PRESET_APIS[preset]
            self.base_url = base_url or config["base_url"]
            self.model = model or config["model"]
        else:
            self.base_url = base_url
            self.model = model
        
        self.api_key = api_key
        self.headless = headless
        self.slow_mo = slow_mo
        self.verbose = verbose
        
        self._playwright = None
        self._browser: Browser = None
        self._page: Page = None
    
    def _log(self, msg: str):
        if self.verbose:
            print(f"[AI浏览器] {msg}")
    
    async def _call_llm(self, messages: List[Dict]) -> str:
        """调用 LLM"""
        if not aiohttp:
            raise ImportError("请安装 aiohttp: pip install aiohttp")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 2000
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url.rstrip('/')}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as resp:
                if resp.status != 200:
                    error = await resp.text()
                    raise Exception(f"API 错误: {error}")
                data = await resp.json()
                return data["choices"][0]["message"]["content"]
    
    async def start(self):
        """启动浏览器"""
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo
        )
        self._page = await self._browser.new_page()
        
        # 设置视口
        await self._page.set_viewport_size({"width": 1280, "height": 800})
        
        self._log("浏览器已启动")
    
    async def goto(self, url: str):
        """导航到 URL"""
        await self._page.goto(url, wait_until="domcontentloaded")
        self._log(f"打开页面: {url}")
        await asyncio.sleep(1)
    
    async def _get_page_elements(self) -> str:
        """获取页面可交互元素"""
        elements = await self._page.evaluate("""
            () => {
                const results = [];
                const selectors = 'a, button, input, select, textarea, [onclick], [role="button"], [role="search"], [type="search"], [aria-label*="search" i], [placeholder*="search" i], [placeholder*="搜索" i]';
                const seen = new Set();
                document.querySelectorAll(selectors).forEach((el) => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && results.length < 40) {
                        // 避免重复
                        const key = el.tagName + el.id + el.className;
                        if (seen.has(key)) return;
                        seen.add(key);
                        
                        let text = (el.innerText || el.value || el.placeholder || el.title || el.getAttribute('aria-label') || '').slice(0, 50).trim();
                        let selector = '';
                        if (el.id) selector = '#' + el.id;
                        else if (el.name) selector = '[name="' + el.name + '"]';
                        else if (el.placeholder) selector = '[placeholder*="' + el.placeholder.slice(0,10) + '"]';
                        else if (el.className) selector = '.' + el.className.split(' ')[0];
                        else selector = el.tagName.toLowerCase();
                        
                        results.push({
                            idx: results.length,
                            tag: el.tagName.toLowerCase(),
                            text: text,
                            selector: selector,
                            type: el.type || '',
                            placeholder: el.placeholder || ''
                        });
                    }
                });
                return results;
            }
        """)
        
        # 格式化为文本
        lines = []
        for el in elements:
            desc = f"[{el['idx']}] <{el['tag']}> {el['selector']}"
            if el.get('text'):
                desc += f" \"{el['text']}\""
            if el.get('placeholder'):
                desc += f" placeholder=\"{el['placeholder']}\""
            if el.get('type'):
                desc += f" (type={el['type']})"
            lines.append(desc)
        
        return "\n".join(lines)
    
    async def execute(self, task: str, max_steps: int = 10) -> TaskResult:
        """
        执行任务
        
        Args:
            task: 任务描述
            max_steps: 最大步骤数
        
        Returns:
            TaskResult
        """
        steps = []
        
        system_prompt = """你是一个浏览器自动化助手。根据页面元素和任务，返回下一步操作。

操作格式（每次只返回一个操作）：
- CLICK [idx] - 点击元素
- TYPE [idx] "文本" - 在输入框输入
- SCROLL down/up - 滚动页面
- WAIT - 等待页面加载
- DONE "结果" - 任务完成

只返回操作命令，不要解释。"""

        for step in range(max_steps):
            # 获取页面信息
            title = await self._page.title()
            url = self._page.url
            elements = await self._get_page_elements()
            
            user_msg = f"""当前页面: {title}
URL: {url}

可交互元素:
{elements}

任务: {task}
已完成步骤: {steps}

下一步操作:"""

            self._log(f"步骤 {step + 1}: 分析页面...")
            
            try:
                response = await self._call_llm([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg}
                ])
                
                # 清理响应（移除思考标签）
                response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()
                
                self._log(f"AI 决定: {response}")
                
                # 解析并执行操作
                action = response.strip().split('\n')[0]
                steps.append(action)
                
                if action.startswith("CLICK"):
                    match = re.search(r'CLICK\s*\[?(\d+)\]?', action)
                    if match:
                        idx = int(match.group(1))
                        await self._click_by_index(idx)
                        await asyncio.sleep(1)
                
                elif action.startswith("TYPE"):
                    match = re.search(r'TYPE\s*\[?(\d+)\]?\s*["\'](.+?)["\']', action)
                    if match:
                        idx = int(match.group(1))
                        text = match.group(2)
                        await self._type_by_index(idx, text)
                        await asyncio.sleep(0.5)
                
                elif action.startswith("SCROLL"):
                    direction = "down" if "down" in action.lower() else "up"
                    await self._page.evaluate(f"window.scrollBy(0, {'300' if direction == 'down' else '-300'})")
                    await asyncio.sleep(0.5)
                
                elif action.startswith("WAIT"):
                    await asyncio.sleep(2)
                
                elif action.startswith("DONE"):
                    match = re.search(r'DONE\s*["\'](.+?)["\']', action)
                    result = match.group(1) if match else "任务完成"
                    return TaskResult(success=True, result=result, steps=steps)
                
            except Exception as e:
                self._log(f"步骤错误: {e}")
                steps.append(f"错误: {e}")
                # 如果页面已关闭，停止执行
                if "closed" in str(e).lower():
                    break
        
        return TaskResult(
            success=True,
            result="达到最大步骤数",
            steps=steps
        )
    
    async def _click_by_index(self, idx: int):
        """通过索引点击元素"""
        await self._page.evaluate(f"""
            () => {{
                const selectors = 'a, button, input, select, textarea, [onclick], [role="button"]';
                const elements = document.querySelectorAll(selectors);
                if (elements[{idx}]) {{
                    elements[{idx}].click();
                }}
            }}
        """)
    
    async def _type_by_index(self, idx: int, text: str):
        """通过索引输入文本"""
        # 先点击获取焦点
        await self._click_by_index(idx)
        await asyncio.sleep(0.3)
        
        # 输入文本（模拟人类打字）
        for char in text:
            await self._page.keyboard.type(char, delay=random.randint(50, 150))
    
    async def crawl(self, goal: str) -> Dict:
        """
        爬虫模式：让 AI 分析页面并提取数据
        
        Args:
            goal: 提取目标
        
        Returns:
            提取的数据
        """
        html = await self._page.content()
        
        prompt = f"""分析这个 HTML 页面，{goal}

HTML（前5000字符）：
{html[:5000]}

返回 JSON 格式数据，只返回 JSON，不要解释。"""

        self._log("AI 分析页面中...")
        
        response = await self._call_llm([
            {"role": "user", "content": prompt}
        ])
        
        # 提取 JSON
        response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()
        
        # 尝试解析 JSON
        try:
            # 尝试找到 JSON 块
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response)
            if json_match:
                return json.loads(json_match.group(1))
            return json.loads(response)
        except:
            return {"raw": response}
    
    async def screenshot(self, path: str = "screenshot.png"):
        """截图"""
        await self._page.screenshot(path=path)
        self._log(f"截图保存: {path}")
    
    async def close(self):
        """关闭浏览器"""
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        self._log("浏览器已关闭")
    
    async def __aenter__(self):
        await self.start()
        return self
    
    async def __aexit__(self, *args):
        await self.close()

