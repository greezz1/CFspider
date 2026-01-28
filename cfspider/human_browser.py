"""
CFspider Human Browser - 真实人类行为模拟浏览器

通过 Chrome DevTools Protocol (CDP) 控制真实 Chrome 浏览器，
模拟人类操作行为，绕过自动化检测。

核心功能：
- 贝塞尔曲线鼠标移动（真实的鼠标轨迹）
- 随机打字延迟（模拟人类打字速度）
- 自然滚动行为（随机停顿和速度变化）
- 随机点击偏移（不会每次精确点击中心）
- 页面停留时间（模拟阅读行为）

使用方法：
    >>> import cfspider
    >>> 
    >>> # 基本用法
    >>> browser = cfspider.HumanBrowser()
    >>> await browser.goto("https://example.com")
    >>> await browser.human_click("#button")
    >>> await browser.human_type("#input", "hello")
    >>> await browser.close()
    >>> 
    >>> # 结合 CF Workers 代理
    >>> workers = cfspider.make_workers(api_token="...", account_id="...")
    >>> browser = cfspider.HumanBrowser(cf_proxies=workers)

依赖：
    pip install pychrome bezier
    
Chrome DevTools MCP 配置：
    {
      "mcpServers": {
        "chrome-devtools": {
          "command": "npx",
          "args": ["chrome-devtools-mcp@latest", "--headless=false"]
        }
      }
    }
"""

import asyncio
import random
import math
import time
import json
import subprocess
import platform
import os
from typing import Optional, List, Tuple, Dict, Any, Union
from pathlib import Path


# 贝塞尔曲线计算
def _bezier_curve(points: List[Tuple[float, float]], t: float) -> Tuple[float, float]:
    """计算贝塞尔曲线上的点"""
    n = len(points) - 1
    x, y = 0.0, 0.0
    for i, (px, py) in enumerate(points):
        # 二项式系数
        coef = math.comb(n, i) * (t ** i) * ((1 - t) ** (n - i))
        x += coef * px
        y += coef * py
    return x, y


def _generate_bezier_path(
    start: Tuple[float, float],
    end: Tuple[float, float],
    num_points: int = 50,
    randomness: float = 0.3
) -> List[Tuple[float, float]]:
    """
    生成从 start 到 end 的贝塞尔曲线路径
    
    Args:
        start: 起始坐标 (x, y)
        end: 结束坐标 (x, y)
        num_points: 路径点数量
        randomness: 随机性程度 (0-1)
    
    Returns:
        路径点列表
    """
    sx, sy = start
    ex, ey = end
    
    # 计算距离
    distance = math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2)
    
    # 生成 2-4 个控制点
    num_controls = random.randint(2, 4)
    control_points = [start]
    
    for i in range(num_controls):
        # 在起点和终点之间插入控制点
        t = (i + 1) / (num_controls + 1)
        base_x = sx + t * (ex - sx)
        base_y = sy + t * (ey - sy)
        
        # 添加随机偏移
        offset = distance * randomness * random.uniform(-1, 1)
        angle = random.uniform(0, 2 * math.pi)
        ctrl_x = base_x + offset * math.cos(angle)
        ctrl_y = base_y + offset * math.sin(angle)
        control_points.append((ctrl_x, ctrl_y))
    
    control_points.append(end)
    
    # 生成路径点
    path = []
    for i in range(num_points):
        t = i / (num_points - 1)
        # 添加速度变化（开始和结束慢，中间快）
        t_adjusted = 0.5 - 0.5 * math.cos(t * math.pi)
        point = _bezier_curve(control_points, t_adjusted)
        path.append(point)
    
    return path


def _random_delay(min_ms: int = 50, max_ms: int = 200) -> float:
    """生成随机延迟时间（秒）"""
    # 使用对数正态分布，更接近人类行为
    mean = (min_ms + max_ms) / 2
    std = (max_ms - min_ms) / 4
    delay = random.gauss(mean, std)
    delay = max(min_ms, min(max_ms, delay))
    return delay / 1000


def _typing_delay() -> float:
    """模拟人类打字延迟"""
    # 大多数按键 50-150ms，偶尔有较长停顿
    if random.random() < 0.1:  # 10% 概率长停顿
        return random.uniform(0.2, 0.5)
    elif random.random() < 0.2:  # 20% 概率短停顿
        return random.uniform(0.1, 0.2)
    else:
        return random.uniform(0.05, 0.15)


class HumanBrowser:
    """
    人类行为模拟浏览器
    
    通过 CDP 控制 Chrome，模拟真实人类操作。
    """
    
    def __init__(
        self,
        cf_proxies: Optional[str] = None,
        uuid: Optional[str] = None,
        headless: bool = False,
        chrome_path: Optional[str] = None,
        remote_debugging_port: int = 9222,
        user_data_dir: Optional[str] = None,
        auto_start_chrome: bool = True,
        human_like: bool = True,
        viewport: Tuple[int, int] = (1920, 1080)
    ):
        """
        初始化人类行为模拟浏览器
        
        Args:
            cf_proxies: CFspider Workers 地址或 WorkersManager 对象
            uuid: VLESS UUID（使用 VLESS 代理时需要）
            headless: 是否无头模式（建议 False 以获得更真实的行为）
            chrome_path: Chrome 可执行文件路径（不填则自动检测）
            remote_debugging_port: CDP 远程调试端口
            user_data_dir: 用户数据目录（不填则使用临时目录）
            auto_start_chrome: 是否自动启动 Chrome
            human_like: 是否启用人类行为模拟
            viewport: 视口大小
        """
        self.cf_proxies = cf_proxies
        self.uuid = uuid
        self.headless = headless
        self.chrome_path = chrome_path or self._find_chrome()
        self.remote_debugging_port = remote_debugging_port
        self.user_data_dir = user_data_dir
        self.auto_start_chrome = auto_start_chrome
        self.human_like = human_like
        self.viewport = viewport
        
        self._chrome_process = None
        self._ws_url = None
        self._session = None
        self._page_id = None
        self._mouse_position = (0, 0)
        self._connected = False
        
        # 尝试导入 websockets
        try:
            import websockets
            self._websockets = websockets
        except ImportError:
            self._websockets = None
    
    def _find_chrome(self) -> str:
        """查找 Chrome 可执行文件路径"""
        system = platform.system()
        
        if system == "Windows":
            paths = [
                os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
                os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
                os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
            ]
        elif system == "Darwin":  # macOS
            paths = [
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
            ]
        else:  # Linux
            paths = [
                "/usr/bin/google-chrome",
                "/usr/bin/google-chrome-stable",
                "/usr/bin/chromium-browser",
                "/usr/bin/chromium",
            ]
        
        for path in paths:
            if os.path.exists(path):
                return path
        
        # 尝试从 PATH 中查找
        import shutil
        for name in ["google-chrome", "google-chrome-stable", "chromium", "chrome"]:
            path = shutil.which(name)
            if path:
                return path
        
        raise FileNotFoundError("无法找到 Chrome 浏览器，请手动指定 chrome_path")
    
    async def start(self):
        """启动浏览器并连接"""
        if self.auto_start_chrome:
            await self._start_chrome()
        
        await self._connect()
        await self._setup_page()
    
    async def _start_chrome(self):
        """启动 Chrome 浏览器"""
        args = [
            self.chrome_path,
            f"--remote-debugging-port={self.remote_debugging_port}",
        ]
        
        if self.headless:
            args.append("--headless=new")
        
        if self.user_data_dir:
            args.append(f"--user-data-dir={self.user_data_dir}")
        else:
            # 使用临时目录
            import tempfile
            temp_dir = tempfile.mkdtemp(prefix="cfspider_chrome_")
            args.append(f"--user-data-dir={temp_dir}")
        
        # 禁用自动化检测特征
        args.extend([
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--no-first-run",
            "--no-default-browser-check",
            f"--window-size={self.viewport[0]},{self.viewport[1]}",
        ])
        
        # 如果使用代理
        if self.cf_proxies:
            proxy_url = await self._setup_proxy()
            if proxy_url:
                args.append(f"--proxy-server={proxy_url}")
        
        self._chrome_process = subprocess.Popen(
            args,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # 等待 Chrome 启动
        await asyncio.sleep(2)
    
    async def _setup_proxy(self) -> Optional[str]:
        """设置代理"""
        if not self.cf_proxies:
            return None
        
        # 如果是 WorkersManager 对象
        if hasattr(self.cf_proxies, 'url'):
            workers_url = self.cf_proxies.url
            if not self.uuid and hasattr(self.cf_proxies, 'uuid'):
                self.uuid = self.cf_proxies.uuid
        else:
            workers_url = self.cf_proxies
        
        # 启动本地 VLESS 代理
        try:
            from .vless_client import LocalVlessProxy
            
            proxy = LocalVlessProxy(
                workers_url=workers_url,
                uuid=self.uuid
            )
            await proxy.start()
            return f"socks5://127.0.0.1:{proxy.local_port}"
        except Exception as e:
            print(f"[HumanBrowser] 代理设置失败: {e}")
            return None
    
    async def _connect(self):
        """连接到 Chrome DevTools"""
        import aiohttp
        
        # 确保 websockets 已安装
        if not self._websockets:
            try:
                import websockets
                self._websockets = websockets
            except ImportError:
                raise ImportError("请安装 websockets: pip install websockets")
        
        # 获取 WebSocket URL
        url = f"http://127.0.0.1:{self.remote_debugging_port}/json/version"
        
        for _ in range(10):  # 重试 10 次
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            self._ws_url = data.get("webSocketDebuggerUrl")
                            break
            except:
                await asyncio.sleep(0.5)
        
        if not self._ws_url:
            raise ConnectionError(f"无法连接到 Chrome DevTools (端口 {self.remote_debugging_port})")
        
        # 连接 WebSocket
        self._session = await self._websockets.connect(self._ws_url)
        self._connected = True
    
    async def _send_command(self, method: str, params: Dict = None) -> Dict:
        """发送 CDP 命令"""
        if not self._connected:
            raise ConnectionError("未连接到浏览器")
        
        import json
        
        msg_id = random.randint(1, 1000000)
        message = {
            "id": msg_id,
            "method": method,
            "params": params or {}
        }
        
        await self._session.send(json.dumps(message))
        
        # 等待响应
        while True:
            response = await self._session.recv()
            data = json.loads(response)
            if data.get("id") == msg_id:
                if "error" in data:
                    raise Exception(f"CDP 错误: {data['error']}")
                return data.get("result", {})
    
    async def _setup_page(self):
        """设置页面"""
        # 获取页面列表
        import aiohttp
        
        url = f"http://127.0.0.1:{self.remote_debugging_port}/json"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                pages = await resp.json()
        
        if pages:
            self._page_id = pages[0].get("id")
            page_ws_url = pages[0].get("webSocketDebuggerUrl")
            
            # 重新连接到页面
            if self._session:
                await self._session.close()
            if page_ws_url and self._websockets:
                self._session = await self._websockets.connect(page_ws_url)
                self._connected = True
        
        # 设置视口
        await self._send_command("Emulation.setDeviceMetricsOverride", {
            "width": self.viewport[0],
            "height": self.viewport[1],
            "deviceScaleFactor": 1,
            "mobile": False
        })
        
        # 隐藏自动化特征
        await self._send_command("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                // 隐藏 webdriver 标志
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                
                // 隐藏 Chrome 自动化
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                
                // 隐藏 languages
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['zh-CN', 'zh', 'en-US', 'en']
                });
                
                // 修复 Chrome 检测
                window.chrome = {
                    runtime: {}
                };
                
                // 修复权限检测
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
            """
        })
    
    async def goto(self, url: str, wait_until: str = "load") -> str:
        """
        导航到 URL
        
        Args:
            url: 目标 URL
            wait_until: 等待条件 ("load", "domcontentloaded", "networkidle")
        
        Returns:
            页面 HTML
        """
        await self._send_command("Page.enable")
        await self._send_command("Page.navigate", {"url": url})
        
        # 等待页面加载
        await asyncio.sleep(2)
        
        # 如果启用人类行为，模拟阅读
        if self.human_like:
            await self._simulate_reading()
        
        return await self.html()
    
    async def html(self) -> str:
        """获取页面 HTML"""
        result = await self._send_command("Runtime.evaluate", {
            "expression": "document.documentElement.outerHTML"
        })
        return result.get("result", {}).get("value", "")
    
    async def _get_element_center(self, selector: str) -> Tuple[float, float]:
        """获取元素中心坐标"""
        result = await self._send_command("Runtime.evaluate", {
            "expression": f"""
                (function() {{
                    const el = document.querySelector('{selector}');
                    if (!el) return null;
                    const rect = el.getBoundingClientRect();
                    return {{
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        width: rect.width,
                        height: rect.height
                    }};
                }})()
            """,
            "returnByValue": True
        })
        
        value = result.get("result", {}).get("value")
        if not value:
            raise ValueError(f"找不到元素: {selector}")
        
        return value["x"], value["y"]
    
    async def human_move_to(self, x: float, y: float):
        """
        人类式鼠标移动（贝塞尔曲线）
        
        Args:
            x: 目标 x 坐标
            y: 目标 y 坐标
        """
        if not self.human_like:
            self._mouse_position = (x, y)
            await self._send_command("Input.dispatchMouseEvent", {
                "type": "mouseMoved",
                "x": x,
                "y": y
            })
            return
        
        # 生成贝塞尔曲线路径
        path = _generate_bezier_path(
            self._mouse_position,
            (x, y),
            num_points=random.randint(30, 60),
            randomness=random.uniform(0.2, 0.4)
        )
        
        # 沿路径移动
        for px, py in path:
            await self._send_command("Input.dispatchMouseEvent", {
                "type": "mouseMoved",
                "x": int(px),
                "y": int(py)
            })
            # 随机延迟
            await asyncio.sleep(random.uniform(0.005, 0.02))
        
        self._mouse_position = (x, y)
    
    async def human_click(self, selector: str, button: str = "left"):
        """
        人类式点击
        
        Args:
            selector: CSS 选择器
            button: 鼠标按钮 ("left", "right", "middle")
        """
        # 获取元素位置
        center_x, center_y = await self._get_element_center(selector)
        
        # 添加随机偏移（不会每次精确点击中心）
        if self.human_like:
            offset_x = random.uniform(-10, 10)
            offset_y = random.uniform(-5, 5)
            target_x = center_x + offset_x
            target_y = center_y + offset_y
        else:
            target_x, target_y = center_x, center_y
        
        # 移动鼠标
        await self.human_move_to(target_x, target_y)
        
        # 点击前短暂停顿
        if self.human_like:
            await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 鼠标按下
        await self._send_command("Input.dispatchMouseEvent", {
            "type": "mousePressed",
            "x": int(target_x),
            "y": int(target_y),
            "button": button,
            "clickCount": 1
        })
        
        # 按下持续时间
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 鼠标释放
        await self._send_command("Input.dispatchMouseEvent", {
            "type": "mouseReleased",
            "x": int(target_x),
            "y": int(target_y),
            "button": button,
            "clickCount": 1
        })
        
        # 点击后短暂等待
        if self.human_like:
            await asyncio.sleep(random.uniform(0.1, 0.3))
    
    async def human_type(self, selector: str, text: str, clear: bool = True):
        """
        人类式打字
        
        Args:
            selector: CSS 选择器
            text: 要输入的文本
            clear: 是否先清空输入框
        """
        # 先点击输入框
        await self.human_click(selector)
        
        # 清空现有内容
        if clear:
            await self._send_command("Input.dispatchKeyEvent", {
                "type": "keyDown",
                "key": "a",
                "modifiers": 2  # Ctrl
            })
            await self._send_command("Input.dispatchKeyEvent", {
                "type": "keyUp",
                "key": "a",
                "modifiers": 2
            })
            await asyncio.sleep(0.1)
            await self._send_command("Input.dispatchKeyEvent", {
                "type": "keyDown",
                "key": "Backspace"
            })
            await self._send_command("Input.dispatchKeyEvent", {
                "type": "keyUp",
                "key": "Backspace"
            })
            await asyncio.sleep(0.1)
        
        # 逐字输入
        for char in text:
            # 偶尔打错字再删除（更真实）
            if self.human_like and random.random() < 0.03:
                wrong_char = random.choice('abcdefghijklmnopqrstuvwxyz')
                await self._send_command("Input.insertText", {"text": wrong_char})
                await asyncio.sleep(_typing_delay())
                await self._send_command("Input.dispatchKeyEvent", {
                    "type": "keyDown",
                    "key": "Backspace"
                })
                await self._send_command("Input.dispatchKeyEvent", {
                    "type": "keyUp",
                    "key": "Backspace"
                })
                await asyncio.sleep(_typing_delay())
            
            # 输入正确字符
            await self._send_command("Input.insertText", {"text": char})
            
            # 打字延迟
            if self.human_like:
                await asyncio.sleep(_typing_delay())
    
    async def human_scroll(self, direction: str = "down", distance: int = None):
        """
        人类式滚动
        
        Args:
            direction: 滚动方向 ("up", "down")
            distance: 滚动距离（像素），None 则随机
        """
        if distance is None:
            distance = random.randint(200, 600)
        
        if direction == "up":
            distance = -distance
        
        # 分段滚动
        num_steps = random.randint(5, 15)
        step_distance = distance / num_steps
        
        for _ in range(num_steps):
            await self._send_command("Input.dispatchMouseEvent", {
                "type": "mouseWheel",
                "x": self._mouse_position[0],
                "y": self._mouse_position[1],
                "deltaX": 0,
                "deltaY": step_distance
            })
            
            # 随机延迟
            if self.human_like:
                await asyncio.sleep(random.uniform(0.02, 0.08))
        
        # 滚动后停顿
        if self.human_like:
            await asyncio.sleep(random.uniform(0.3, 1.0))
    
    async def _simulate_reading(self):
        """模拟阅读行为"""
        # 随机移动鼠标
        for _ in range(random.randint(2, 5)):
            x = random.randint(100, self.viewport[0] - 100)
            y = random.randint(100, self.viewport[1] - 100)
            await self.human_move_to(x, y)
            await asyncio.sleep(random.uniform(0.5, 2.0))
        
        # 随机滚动
        if random.random() < 0.7:
            await self.human_scroll("down")
    
    async def wait_for_selector(self, selector: str, timeout: int = 30):
        """等待元素出现"""
        start = time.time()
        while time.time() - start < timeout:
            result = await self._send_command("Runtime.evaluate", {
                "expression": f"document.querySelector('{selector}') !== null"
            })
            if result.get("result", {}).get("value"):
                return True
            await asyncio.sleep(0.5)
        raise TimeoutError(f"等待元素超时: {selector}")
    
    async def screenshot(self, path: str = None) -> bytes:
        """截图"""
        result = await self._send_command("Page.captureScreenshot", {
            "format": "png"
        })
        
        import base64
        data = base64.b64decode(result.get("data", ""))
        
        if path:
            with open(path, "wb") as f:
                f.write(data)
        
        return data
    
    async def evaluate(self, expression: str) -> Any:
        """执行 JavaScript"""
        result = await self._send_command("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True
        })
        return result.get("result", {}).get("value")
    
    async def close(self):
        """关闭浏览器"""
        if self._session:
            await self._session.close()
        
        if self._chrome_process:
            self._chrome_process.terminate()
            self._chrome_process.wait()
    
    async def __aenter__(self):
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# 同步包装器
class HumanBrowserSync:
    """
    同步版人类行为模拟浏览器
    
    使用方法：
        >>> browser = cfspider.HumanBrowserSync()
        >>> browser.goto("https://example.com")
        >>> browser.human_click("#button")
        >>> browser.close()
    """
    
    def __init__(self, *args, **kwargs):
        self._browser = HumanBrowser(*args, **kwargs)
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
    
    def start(self):
        return self._run(self._browser.start())
    
    def goto(self, url: str, wait_until: str = "load") -> str:
        return self._run(self._browser.goto(url, wait_until))
    
    def html(self) -> str:
        return self._run(self._browser.html())
    
    def human_click(self, selector: str, button: str = "left"):
        return self._run(self._browser.human_click(selector, button))
    
    def human_type(self, selector: str, text: str, clear: bool = True):
        return self._run(self._browser.human_type(selector, text, clear))
    
    def human_scroll(self, direction: str = "down", distance: int = None):
        return self._run(self._browser.human_scroll(direction, distance))
    
    def human_move_to(self, x: float, y: float):
        return self._run(self._browser.human_move_to(x, y))
    
    def wait_for_selector(self, selector: str, timeout: int = 30):
        return self._run(self._browser.wait_for_selector(selector, timeout))
    
    def screenshot(self, path: str = None) -> bytes:
        return self._run(self._browser.screenshot(path))
    
    def evaluate(self, expression: str) -> Any:
        return self._run(self._browser.evaluate(expression))
    
    def close(self):
        return self._run(self._browser.close())
    
    def __enter__(self):
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

