"""
X27CN 高级混淆加密模块

提供一键式代码混淆和保护：
- 字符串加密
- 变量名混淆
- 控制流扁平化
- 死代码注入
- 反调试保护
"""

import re
import random
import string
from typing import Optional
from .core import encrypt, DEFAULT_KEY
from .minify import minify_js, obfuscate_identifiers, add_dead_code
from .anti_crawl import generate_full_protection, inject_protection


def encrypt_strings(js_code: str, key: str = DEFAULT_KEY) -> str:
    """
    加密 JavaScript 代码中的字符串
    
    将所有字符串字面量替换为运行时解密调用。
    
    Args:
        js_code: JavaScript 代码
        key: 加密密钥
        
    Returns:
        字符串加密后的代码
    """
    # 收集所有字符串
    strings = []
    
    def collect_string(match):
        quote = match.group(1)
        content = match.group(2)
        if content and len(content) > 2:  # 只加密较长的字符串
            idx = len(strings)
            strings.append(content)
            return f'_$s({idx})'
        return match.group(0)
    
    # 匹配字符串（简化版，可能有边缘情况）
    pattern = r'(["\'])([^"\'\\]*(?:\\.[^"\'\\]*)*)\1'
    processed = re.sub(pattern, collect_string, js_code)
    
    if not strings:
        return js_code
    
    # 生成解密器和字符串数组
    key_bytes = key.encode('utf-8')
    key_array = ','.join(str(b) for b in key_bytes)
    
    # 简单的 XOR 加密
    encrypted_strings = []
    for s in strings:
        encrypted = []
        for i, c in enumerate(s):
            encrypted.append(ord(c) ^ key_bytes[i % len(key_bytes)])
        encrypted_strings.append(','.join(str(b) for b in encrypted))
    
    strings_array = ';'.join(f'[{s}]' for s in encrypted_strings)
    
    decoder = f'''
var _$k=[{key_array}];
var _$a=[{strings_array}];
var _$s=function(i){{var a=_$a[i],r='';for(var j=0;j<a.length;j++)r+=String.fromCharCode(a[j]^_$k[j%_$k.length]);return r}};
'''
    
    return decoder + processed


def advanced_obfuscate(
    js_code: str,
    key: str = DEFAULT_KEY,
    encrypt_strings_: bool = True,
    rename_vars: bool = True,
    dead_code: bool = True,
    anti_debug: bool = False,
    disable_shortcuts: bool = False,
    domain_lock: list = None,
    expire_date: str = None
) -> str:
    """
    高级代码混淆
    
    应用多层混淆保护。
    
    Args:
        js_code: JavaScript 代码
        key: 加密密钥
        encrypt_strings_: 加密字符串
        rename_vars: 重命名变量
        dead_code: 添加死代码
        anti_debug: 添加反调试
        disable_shortcuts: 禁用快捷键
        domain_lock: 域名锁定
        expire_date: 过期日期
        
    Returns:
        混淆后的代码
    """
    result = js_code
    
    # 1. 变量重命名
    if rename_vars:
        result = obfuscate_identifiers(result)
    
    # 2. 添加死代码
    if dead_code:
        result = add_dead_code(result)
    
    # 3. 字符串加密
    if encrypt_strings_:
        result = encrypt_strings(result, key)
    
    # 4. 添加保护代码
    if anti_debug or disable_shortcuts or domain_lock or expire_date:
        result = inject_protection(
            result,
            anti_debug=anti_debug,
            disable_shortcuts=disable_shortcuts,
            console_clear=anti_debug,
            domain_lock=domain_lock,
            expire_date=expire_date
        )
    
    return result


def full_obfuscate(
    code: str,
    file_type: str = 'js',
    key: str = DEFAULT_KEY,
    level: int = 2,
    anti_crawl: bool = True
) -> str:
    """
    一键完整混淆
    
    根据保护级别应用不同程度的混淆。
    
    Args:
        code: 源代码
        file_type: 文件类型 ('js', 'html', 'css')
        key: 加密密钥
        level: 混淆级别 (1-3)
            1: 基础 - 压缩 + 变量重命名
            2: 中等 - 基础 + 字符串加密 + 死代码
            3: 高级 - 中等 + 反调试 + 禁用快捷键
        anti_crawl: 添加反爬保护
        
    Returns:
        混淆后的代码
    """
    if file_type == 'html':
        return _obfuscate_html_full(code, key, level, anti_crawl)
    elif file_type == 'css':
        return _obfuscate_css_full(code, key)
    else:
        return _obfuscate_js_full(code, key, level, anti_crawl)


def _obfuscate_js_full(code: str, key: str, level: int, anti_crawl: bool) -> str:
    """完整混淆 JavaScript"""
    # Level 1: 基础
    result = minify_js(code)
    result = obfuscate_identifiers(result)
    
    if level >= 2:
        # Level 2: 中等
        result = encrypt_strings(result, key)
        result = add_dead_code(result)
    
    if level >= 3:
        # Level 3: 高级
        result = inject_protection(
            result,
            anti_debug=True,
            disable_shortcuts=True,
            console_clear=True
        )
    elif anti_crawl:
        # 仅反爬（无反调试）
        result = inject_protection(
            result,
            anti_debug=False,
            disable_shortcuts=True,
            console_clear=False
        )
    
    return result


def _obfuscate_html_full(code: str, key: str, level: int, anti_crawl: bool) -> str:
    """完整混淆 HTML"""
    from .obfuscate import obfuscate_html, obfuscate_inline_js
    
    # 先混淆内联 JS
    result = obfuscate_inline_js(code, key)
    
    if level >= 2:
        # 加密整个 HTML
        result = obfuscate_html(result, key)
    
    return result


def _obfuscate_css_full(code: str, key: str) -> str:
    """完整混淆 CSS"""
    from .obfuscate import obfuscate_css
    from .minify import minify_css
    
    # 压缩并加密
    result = minify_css(code)
    result = obfuscate_css(result, key)
    
    return result


def obfuscate_file_full(
    input_path: str,
    output_path: Optional[str] = None,
    key: str = DEFAULT_KEY,
    level: int = 2,
    anti_crawl: bool = True
) -> str:
    """
    一键混淆文件
    
    Args:
        input_path: 输入文件路径
        output_path: 输出文件路径（可选）
        key: 加密密钥
        level: 混淆级别 (1-3)
        anti_crawl: 添加反爬保护
        
    Returns:
        输出文件路径
    """
    import os
    
    # 读取文件
    with open(input_path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # 确定文件类型
    ext = os.path.splitext(input_path)[1].lower()
    if ext in ('.html', '.htm'):
        file_type = 'html'
    elif ext == '.css':
        file_type = 'css'
    else:
        file_type = 'js'
    
    # 混淆
    result = full_obfuscate(code, file_type, key, level, anti_crawl)
    
    # 确定输出路径
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}.protected{ext}"
    
    # 写入
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(result)
    
    return output_path


def quick_protect(js_code: str) -> str:
    """
    快速保护 JavaScript 代码
    
    一行代码完成混淆 + 反爬保护。
    
    Args:
        js_code: JavaScript 代码
        
    Returns:
        保护后的代码
        
    Example:
        >>> protected = x27cn.quick_protect('alert("Hello")')
    """
    return full_obfuscate(js_code, 'js', DEFAULT_KEY, level=2, anti_crawl=True)

