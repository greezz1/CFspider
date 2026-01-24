# X27CN

X27CN 代码混淆加密库 - Code obfuscation and encryption library

## 安装

```bash
pip install x27cn
```

## 快速开始

```python
import x27cn

# 加密
encrypted = x27cn.encrypt('Hello World')
print(encrypted)  # <e5d6><32af>...

# 解密
decrypted = x27cn.decrypt(encrypted)
print(decrypted)  # Hello World

# 使用自定义密钥
encrypted = x27cn.encrypt('敏感数据', key='mySecretKey')
decrypted = x27cn.decrypt(encrypted, key='mySecretKey')
```

## API

### 基础加密/解密

```python
# 标准格式（<xxxx> 标签）
encrypted = x27cn.encrypt('text')
decrypted = x27cn.decrypt(encrypted)

# 纯十六进制格式
hex_encrypted = x27cn.encrypt_hex('text')
decrypted = x27cn.decrypt_hex(hex_encrypted)

# Base64 格式
b64_encrypted = x27cn.encrypt_base64('text')
decrypted = x27cn.decrypt_base64(b64_encrypted)
```

### 密钥管理

```python
# 使用默认密钥
x27cn.encrypt('data')  # 使用 'x27cn2026'

# 自定义密钥
x27cn.encrypt('data', key='myKey')

# 生成随机密钥
random_key = x27cn.generate_key(16)  # 16 字符随机密钥
```

## 算法说明

X27CN v2 使用以下加密步骤:

1. **密钥扩展** - 将密钥扩展为 256 字节
2. **S-Box 替换** - 非线性字节替换
3. **位旋转** - 循环左移 5 位
4. **状态混合** - 使用累积状态值混淆

## 安全说明

X27CN 设计用于**代码混淆**，不是密码学安全的加密算法。

适用场景:
- 前端代码混淆
- API 响应混淆
- 配置文件保护

不适用场景:
- 密码存储（请使用 bcrypt/argon2）
- 敏感数据加密（请使用 AES-256）
- 通信加密（请使用 TLS）

## License

MIT

