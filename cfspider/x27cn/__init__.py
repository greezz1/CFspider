# -*- coding: utf-8 -*-
"""
x27cn - CFspider 自定义 JavaScript 混淆库

特点:
- 变量名混淆为 _2$7_2#7_ 格式（数字2和7中间夹杂随机符号）
- 函数名混淆为随机字母组合
- 字符串 XOR 加密 + Base64 变体编码

使用方法:
    from cfspider.x27cn import obfuscate
    
    # 混淆 JavaScript 文件
    obfuscate('workers.js', 'workers_x27cn.js', encryption_key='CFspider2026')
"""

__version__ = '1.0.0'
__author__ = 'CFspider'

from .obfuscator import obfuscate, X27cnObfuscator
from .name_gen import NameGenerator
from .string_crypt import StringCryptor

__all__ = [
    'obfuscate',
    'X27cnObfuscator',
    'NameGenerator',
    'StringCryptor',
]

