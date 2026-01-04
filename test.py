import cfspider

# 基本用法
result = cfspider.mirror("https://www.baidu.com", open_browser=True)
print(f"保存位置: {result.index_file}")

# 指定保存目录
result = cfspider.mirror(
    "https://www.baidu.com",
    save_dir="./my_mirror",
    open_browser=False
)

print(f"保存位置: {result.index_file}")
print(f"资源目录: {result.assets_dir}")
print(f"总文件数: {result.total_files}")
print(f"总大小: {result.total_size / 1024:.2f} KB")