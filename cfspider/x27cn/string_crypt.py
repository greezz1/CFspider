# -*- coding: utf-8 -*-
"""
x27cn 字符串加密模块

使用 XOR 加密 + 自定义 Base64 变体编码
运行时注入解密函数到 JavaScript 代码
"""

import base64
from typing import Tuple


class StringCryptor:
    """字符串加密器"""
    
    # 自定义 Base64 字符表（打乱顺序增加混淆度）
    CUSTOM_CHARS = 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm0123456789+/'
    STANDARD_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    
    def __init__(self, encryption_key: str = 'x27cn-CFspider'):
        """
        初始化加密器
        
        Args:
            encryption_key: 加密密钥
        """
        self.key = encryption_key
    
    def xor_encrypt(self, text: str) -> str:
        """
        XOR 加密字符串
        
        Args:
            text: 要加密的文本
            
        Returns:
            XOR 加密后的字符串
        """
        result = []
        for i, char in enumerate(text):
            key_char = self.key[i % len(self.key)]
            encrypted_char = chr(ord(char) ^ ord(key_char))
            result.append(encrypted_char)
        return ''.join(result)
    
    def custom_base64_encode(self, text: str) -> str:
        """
        使用自定义 Base64 字符表编码
        
        Args:
            text: 要编码的文本
            
        Returns:
            自定义 Base64 编码后的字符串
        """
        # 先进行标准 Base64 编码
        standard_b64 = base64.b64encode(text.encode('utf-8')).decode('utf-8')
        
        # 替换为自定义字符表
        result = []
        for char in standard_b64:
            if char == '=':
                result.append('=')
            else:
                idx = self.STANDARD_CHARS.find(char)
                if idx >= 0:
                    result.append(self.CUSTOM_CHARS[idx])
                else:
                    result.append(char)
        
        return ''.join(result)
    
    def encrypt(self, text: str) -> str:
        """
        加密字符串（XOR + 自定义 Base64）
        
        Args:
            text: 要加密的文本
            
        Returns:
            加密后的字符串
        """
        xored = self.xor_encrypt(text)
        return self.custom_base64_encode(xored)
    
    def generate_decrypt_function(self, decrypt_func_name: str = '_$27$_',
                                   key_var_name: str = '_$2$7$_',
                                   custom_chars_var: str = '_$27_$_',
                                   standard_chars_var: str = '_27$_$_') -> str:
        """
        生成 JavaScript 解密函数代码
        
        Args:
            decrypt_func_name: 解密函数名
            key_var_name: 密钥变量名
            custom_chars_var: 自定义字符表变量名
            standard_chars_var: 标准字符表变量名
            
        Returns:
            JavaScript 解密函数代码
        """
        return f'''
const {key_var_name} = '{self.key}';
const {custom_chars_var} = '{self.CUSTOM_CHARS}';
const {standard_chars_var} = '{self.STANDARD_CHARS}';

function {decrypt_func_name}(_e) {{
    let _r = '';
    for (let _c of _e) {{
        if (_c === '=') _r += '=';
        else {{
            const _i = {custom_chars_var}.indexOf(_c);
            _r += _i >= 0 ? {standard_chars_var}[_i] : _c;
        }}
    }}
    const _d = atob(_r);
    let _o = '';
    for (let _i = 0; _i < _d.length; _i++) {{
        _o += String.fromCharCode(_d.charCodeAt(_i) ^ {key_var_name}.charCodeAt(_i % {key_var_name}.length));
    }}
    return _o;
}}
'''
    
    def generate_decrypt_call(self, encrypted_string: str, decrypt_func_name: str = '_$27$_') -> str:
        """
        生成解密函数调用代码
        
        Args:
            encrypted_string: 加密后的字符串
            decrypt_func_name: 解密函数名
            
        Returns:
            JavaScript 解密调用代码
        """
        return f"{decrypt_func_name}('{encrypted_string}')"


# 便捷函数
def encrypt_string(text: str, key: str = 'x27cn-CFspider') -> str:
    """加密字符串"""
    return StringCryptor(key).encrypt(text)


def generate_js_decryptor(key: str = 'x27cn-CFspider', 
                          decrypt_func_name: str = '_$27$_') -> str:
    """生成 JavaScript 解密函数"""
    return StringCryptor(key).generate_decrypt_function(decrypt_func_name)

