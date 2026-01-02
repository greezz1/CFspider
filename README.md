# CFspider

Cloudflare Workers 代理 IP 池，使用 Cloudflare 全球边缘节点 IP 作为代理出口。

## 部署 Workers

1. 将 `workers.js` 代码复制到 Cloudflare Workers
2. 绑定 KV 命名空间（名称为 `KV`）
3. 设置环境变量 `ADMIN`（管理密码）
4. 配置自定义域名（可选）

## 安装

```bash
pip install cfspider
```

## 使用

```python
import cfspider

cf_proxies = "https://your-workers.dev"

response = cfspider.get(
    "https://httpbin.org/ip",
    cf_proxies=cf_proxies
)

print(response.text)
print(response.cf_colo)
```

## 使用 Session

```python
import cfspider

cf_proxies = "https://your-workers.dev"

session = cfspider.Session(cf_proxies=cf_proxies)

r1 = session.get("https://httpbin.org/ip")
r2 = session.get("https://example.com")

print(r1.text)
session.close()
```

## License

MIT
