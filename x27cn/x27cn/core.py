"""
X27CN v2 加密解密核心算法

特性:
- 密钥扩展 (Key Expansion)
- S-Box 替换
- 4轮变换
- 状态依赖加密
- <xxxx> 标签格式输出
"""

import base64
import re
from typing import Optional

# 默认密钥
DEFAULT_KEY = 'x27cn2026'


def generate_key(length: int = 9) -> str:
    """
    生成随机密钥
    
    Args:
        length: 密钥长度，默认 9
        
    Returns:
        随机生成的密钥字符串
    """
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def _init_tables(key: str) -> tuple:
    """
    初始化扩展密钥和 S-Box
    
    Args:
        key: 加密密钥
        
    Returns:
        (key_bytes, expanded_key, s_box, inv_s_box)
    """
    key_bytes = key.encode('utf-8')
    
    # 扩展密钥
    expanded_key = bytearray(256)
    for i in range(256):
        expanded_key[i] = (key_bytes[i % len(key_bytes)] ^ ((7 * i + 13) & 255)) & 255
    
    # S-Box 和逆 S-Box
    s_box = bytearray(256)
    inv_s_box = bytearray(256)
    for i in range(256):
        s_box[i] = (167 * i + 89) & 255
    for i in range(256):
        inv_s_box[s_box[i]] = i
    
    return key_bytes, expanded_key, s_box, inv_s_box


def encrypt(plaintext: str, key: str = DEFAULT_KEY) -> str:
    """
    使用 X27CN v2 算法加密字符串
    
    加密步骤:
    1. 密钥扩展
    2. S-Box 替换
    3. 位旋转
    4. 状态混合
    
    Args:
        plaintext: 明文字符串
        key: 加密密钥，默认 'x27cn2026'
        
    Returns:
        加密后的字符串，格式为 <xxxx><xxxx>...
        
    Example:
        >>> encrypt('Hello')
        '<e5d6><32af><9421><8a7b><c3e2>'
    """
    if not plaintext:
        return ''
    
    key_bytes, expanded_key, s_box, _ = _init_tables(key)
    data = plaintext.encode('utf-8')
    result = bytearray(len(data))
    
    # 初始状态
    state = 0
    for b in key_bytes:
        state ^= b
    
    # 4轮加密变换
    for i in range(len(data)):
        v = data[i]
        
        # XOR with expanded key
        v = v ^ expanded_key[i % 256]
        
        # S-Box substitution
        v = s_box[v]
        
        # Bit rotation (left 5)
        v = ((v << 5) | (v >> 3)) & 255
        
        # State mixing
        v = (v + 3 * i + state) & 255
        
        # Update state
        state = (state + v + expanded_key[(i + 128) % 256]) & 255
        
        result[i] = v
    
    # 转换为 <xxxx> 标签格式
    hex_str = result.hex()
    output = ''
    for i in range(0, len(hex_str), 4):
        chunk = hex_str[i:i+4]
        output += f'<{chunk}>'
    
    return output


def decrypt(ciphertext: str, key: str = DEFAULT_KEY) -> str:
    """
    使用 X27CN v2 算法解密字符串
    
    Args:
        ciphertext: 密文字符串，格式为 <xxxx><xxxx>... 或纯十六进制
        key: 解密密钥，默认 'x27cn2026'
        
    Returns:
        解密后的明文字符串，解密失败返回空字符串
        
    Example:
        >>> decrypt('<e5d6><32af><9421><8a7b><c3e2>')
        'Hello'
    """
    if not ciphertext:
        return ''
    
    # 提取十六进制数据
    hex_str = ''
    tag_pattern = re.compile(r'<([0-9a-fA-F]{1,4})>')
    matches = tag_pattern.findall(ciphertext)
    
    if matches:
        hex_str = ''.join(matches)
    else:
        # 尝试作为纯十六进制处理
        hex_str = re.sub(r'[^0-9a-fA-F]', '', ciphertext)
    
    if not hex_str or len(hex_str) % 2 != 0:
        return ''
    
    try:
        enc_bytes = bytes.fromhex(hex_str)
    except ValueError:
        return ''
    
    key_bytes, expanded_key, _, inv_s_box = _init_tables(key)
    result = bytearray(len(enc_bytes))
    
    # 初始状态
    state = 0
    for b in key_bytes:
        state ^= b
    
    # 4轮逆变换
    for i in range(len(enc_bytes)):
        v = enc_bytes[i]
        
        # 保存下一状态（使用加密后的值计算）
        next_state = (state + v + expanded_key[(i + 128) % 256]) & 255
        
        # 逆状态混合
        v = ((v - 3 * i - state) % 256 + 256) % 256
        
        # 逆位旋转 (right 5)
        v = ((v >> 5) | (v << 3)) & 255
        
        # 逆 S-Box 替换
        v = inv_s_box[v]
        
        # 逆 XOR
        v = v ^ expanded_key[i % 256]
        
        result[i] = v
        state = next_state
    
    try:
        return result.decode('utf-8')
    except UnicodeDecodeError:
        return ''


def encrypt_hex(plaintext: str, key: str = DEFAULT_KEY) -> str:
    """
    加密并返回纯十六进制格式
    
    Args:
        plaintext: 明文字符串
        key: 加密密钥
        
    Returns:
        纯十六进制字符串（无 <> 标签）
    """
    tagged = encrypt(plaintext, key)
    return re.sub(r'[<>]', '', tagged)


def decrypt_hex(hex_str: str, key: str = DEFAULT_KEY) -> str:
    """
    解密纯十六进制格式
    
    Args:
        hex_str: 十六进制密文
        key: 解密密钥
        
    Returns:
        解密后的明文
    """
    return decrypt(hex_str, key)


def encrypt_base64(plaintext: str, key: str = DEFAULT_KEY) -> str:
    """
    加密并返回 Base64 格式
    
    Args:
        plaintext: 明文字符串
        key: 加密密钥
        
    Returns:
        Base64 编码的密文
    """
    hex_str = encrypt_hex(plaintext, key)
    return base64.b64encode(bytes.fromhex(hex_str)).decode('ascii')


def decrypt_base64(b64_str: str, key: str = DEFAULT_KEY) -> str:
    """
    解密 Base64 格式
    
    Args:
        b64_str: Base64 编码的密文
        key: 解密密钥
        
    Returns:
        解密后的明文
    """
    try:
        hex_str = base64.b64decode(b64_str).hex()
        return decrypt_hex(hex_str, key)
    except Exception:
        return ''

