# -*- coding: utf-8 -*-
"""
x27cn 命令行入口

使用方法:
    python -m cfspider.x27cn workers.js -o workers_x27cn.js -k CFspider2026
"""

from .obfuscator import main

if __name__ == '__main__':
    main()

