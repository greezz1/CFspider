"""
X27CN - 代码混淆加密库
Code obfuscation and encryption library

使用方法:
    import x27cn
    
    # 加密
    encrypted = x27cn.encrypt('Hello World')
    
    # 解密
    decrypted = x27cn.decrypt(encrypted)
    
    # 自定义密钥
    encrypted = x27cn.encrypt('data', key='mySecretKey')
    decrypted = x27cn.decrypt(encrypted, key='mySecretKey')
"""

from .core import (
    encrypt,
    decrypt,
    encrypt_hex,
    decrypt_hex,
    encrypt_base64,
    decrypt_base64,
    generate_key,
    DEFAULT_KEY,
)

__version__ = '1.0.0'
__author__ = 'CFspider'
__all__ = [
    'encrypt',
    'decrypt',
    'encrypt_hex',
    'decrypt_hex',
    'encrypt_base64',
    'decrypt_base64',
    'generate_key',
    'DEFAULT_KEY',
]

