# -*- coding: utf-8 -*-
"""
x27cn 名称生成器

变量名格式：_2$7_2#7_（基于递增计数器，数字2和7中间夹杂随机符号）
函数名格式：随机字母组合（5-8个字符）
"""

import random
import string
from typing import Set


class NameGenerator:
    """名称生成器"""
    
    # 可用于变量名的符号（JavaScript 合法标识符字符）
    SYMBOLS = ['_', '$']
    
    # 用于函数名的字符集
    LETTERS = string.ascii_letters  # a-z, A-Z
    
    def __init__(self, seed: int = None):
        """
        初始化名称生成器
        
        Args:
            seed: 随机种子，用于可重复的混淆结果
        """
        self.var_counter = 0
        self.func_counter = 0
        self.used_names: Set[str] = set()
        
        if seed is not None:
            random.seed(seed)
    
    def gen_var_name(self) -> str:
        """
        生成变量名
        
        格式：_2$7_2#7_ 风格
        - 以 _ 或 $ 开头和结尾
        - 中间是 2 和 7 交替，用随机符号分隔
        - 基于计数器确保唯一性
        
        Returns:
            混淆后的变量名
        """
        self.var_counter += 1
        index = self.var_counter
        
        # 将计数器转换为数字序列
        digits = str(index)
        
        # 构建变量名
        result = random.choice(self.SYMBOLS)  # 开头符号
        
        for i, digit in enumerate(digits):
            # 每个数字用 2 和 7 表示，中间加随机符号
            result += '2'
            result += random.choice(self.SYMBOLS)
            result += '7'
            if i < len(digits) - 1:
                result += random.choice(self.SYMBOLS)
        
        result += random.choice(self.SYMBOLS)  # 结尾符号
        
        # 确保唯一性
        while result in self.used_names:
            result += random.choice(self.SYMBOLS)
        
        self.used_names.add(result)
        return result
    
    def gen_func_name(self) -> str:
        """
        生成函数名
        
        格式：随机字母组合，5-8个字符
        
        Returns:
            混淆后的函数名
        """
        self.func_counter += 1
        
        # 生成随机长度的字母组合
        length = random.randint(5, 8)
        
        # 确保唯一性
        while True:
            # 首字符必须是字母
            name = random.choice(self.LETTERS)
            # 后续字符可以是字母或数字
            name += ''.join(random.choices(self.LETTERS + string.digits, k=length - 1))
            
            if name not in self.used_names:
                break
        
        self.used_names.add(name)
        return name
    
    def gen_string_var(self) -> str:
        """
        生成用于存储加密字符串的变量名
        
        格式：_s + 数字序列
        
        Returns:
            字符串变量名
        """
        name = f'_s{self.var_counter}'
        self.var_counter += 1
        
        while name in self.used_names:
            name = f'_s{self.var_counter}'
            self.var_counter += 1
        
        self.used_names.add(name)
        return name
    
    def reset(self):
        """重置生成器状态"""
        self.var_counter = 0
        self.func_counter = 0
        self.used_names.clear()


# 全局实例
_default_generator = None


def get_generator(seed: int = None) -> NameGenerator:
    """获取名称生成器实例"""
    global _default_generator
    if _default_generator is None or seed is not None:
        _default_generator = NameGenerator(seed)
    return _default_generator


def gen_var_name() -> str:
    """生成变量名（使用默认生成器）"""
    return get_generator().gen_var_name()


def gen_func_name() -> str:
    """生成函数名（使用默认生成器）"""
    return get_generator().gen_func_name()

