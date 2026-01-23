# -*- coding: utf-8 -*-
"""
x27cn JavaScript 混淆器

主混淆逻辑：
1. 解析 JavaScript 代码
2. 识别变量名和函数名
3. 应用名称混淆和字符串加密
4. 保护 JavaScript 关键字和 API
"""

import re
import argparse
from typing import Dict, List, Set, Optional, Tuple
from .name_gen import NameGenerator
from .string_crypt import StringCryptor


class X27cnObfuscator:
    """x27cn JavaScript 混淆器"""
    
    # JavaScript 保留关键字
    JS_KEYWORDS = {
        'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete',
        'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof',
        'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
        'void', 'while', 'with', 'class', 'const', 'enum', 'export', 'extends',
        'import', 'super', 'implements', 'interface', 'let', 'package', 'private',
        'protected', 'public', 'static', 'yield', 'await', 'async', 'of', 'from',
        'as', 'get', 'set', 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity'
    }
    
    # JavaScript 内置对象和 API
    JS_BUILTINS = {
        # 全局对象
        'console', 'window', 'document', 'global', 'globalThis', 'self',
        # 构造函数和类
        'Object', 'Array', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt',
        'Function', 'Date', 'RegExp', 'Error', 'TypeError', 'RangeError',
        'SyntaxError', 'ReferenceError', 'URIError', 'EvalError', 'AggregateError',
        'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy', 'Reflect',
        'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Int8Array', 'Uint8Array',
        'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array',
        'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
        # 常用方法和属性
        'JSON', 'Math', 'Intl', 'Atomics', 'WebAssembly',
        # 函数
        'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI',
        'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape', 'unescape',
        'atob', 'btoa', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
        'setImmediate', 'clearImmediate', 'queueMicrotask',
        # 常用属性/方法名
        'length', 'name', 'prototype', 'constructor', 'toString', 'valueOf',
        'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString',
        'apply', 'call', 'bind', 'arguments', 'caller', 'callee',
        'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat',
        'join', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes',
        'find', 'findIndex', 'filter', 'map', 'reduce', 'reduceRight',
        'forEach', 'every', 'some', 'flat', 'flatMap', 'fill', 'copyWithin',
        'entries', 'keys', 'values', 'at', 'from', 'isArray', 'of',
        'split', 'substring', 'substr', 'trim', 'trimStart', 'trimEnd',
        'toLowerCase', 'toUpperCase', 'charAt', 'charCodeAt', 'codePointAt',
        'startsWith', 'endsWith', 'repeat', 'padStart', 'padEnd', 'match',
        'matchAll', 'replace', 'replaceAll', 'search', 'normalize', 'localeCompare',
        'then', 'catch', 'finally', 'resolve', 'reject', 'all', 'allSettled',
        'any', 'race', 'log', 'warn', 'error', 'info', 'debug', 'trace',
        'dir', 'table', 'time', 'timeEnd', 'timeLog', 'count', 'countReset',
        'group', 'groupEnd', 'groupCollapsed', 'clear', 'assert',
        'parse', 'stringify', 'assign', 'create', 'defineProperty', 'defineProperties',
        'freeze', 'seal', 'preventExtensions', 'isFrozen', 'isSealed', 'isExtensible',
        'getOwnPropertyDescriptor', 'getOwnPropertyDescriptors', 'getOwnPropertyNames',
        'getOwnPropertySymbols', 'getPrototypeOf', 'setPrototypeOf',
    }
    
    # Cloudflare Workers 专用 API
    CF_WORKERS_API = {
        'fetch', 'Request', 'Response', 'Headers', 'URL', 'URLSearchParams',
        'FormData', 'Blob', 'File', 'ReadableStream', 'WritableStream',
        'TransformStream', 'TextEncoder', 'TextDecoder', 'crypto', 'SubtleCrypto',
        'CryptoKey', 'WebSocket', 'CloseEvent', 'MessageEvent', 'Event',
        'EventTarget', 'AbortController', 'AbortSignal', 'navigator', 'performance',
        'caches', 'Cache', 'CacheStorage', 'KVNamespace', 'DurableObject',
        'DurableObjectId', 'DurableObjectNamespace', 'DurableObjectState',
        'DurableObjectStorage', 'DurableObjectTransaction', 'R2Bucket', 'R2Object',
        'R2ObjectBody', 'D1Database', 'D1PreparedStatement', 'D1Result',
        'ExecutionContext', 'ScheduledController', 'FetchEvent', 'ScheduledEvent',
        'env', 'ctx', 'waitUntil', 'passThroughOnException', 'scheduled',
        'connect', 'Socket', 'SocketOptions', 'SocketInfo',
        'status', 'statusText', 'ok', 'headers', 'body', 'bodyUsed',
        'arrayBuffer', 'blob', 'formData', 'json', 'text', 'clone',
        'redirect', 'type', 'url', 'method', 'cf', 'signal',
        'readable', 'writable', 'getReader', 'getWriter', 'pipeTo', 'pipeThrough',
        'tee', 'cancel', 'close', 'abort', 'locked', 'read', 'write', 'releaseLock',
        'append', 'delete', 'get', 'getAll', 'has', 'set', 'forEach',
        'host', 'hostname', 'href', 'origin', 'pathname', 'port', 'protocol',
        'search', 'searchParams', 'hash', 'username', 'password',
        'colo', 'continent', 'country', 'city', 'region', 'regionCode',
        'timezone', 'latitude', 'longitude', 'postalCode', 'metroCode',
        'httpProtocol', 'requestPriority', 'tlsCipher', 'tlsVersion',
        'clientTrustScore', 'botManagement', 'asn', 'asOrganization',
    }
    
    # HTML/DOM 相关（Workers 中可能用到的字符串）
    HTML_RELATED = {
        'innerHTML', 'outerHTML', 'textContent', 'innerText', 'outerText',
        'className', 'classList', 'id', 'style', 'setAttribute', 'getAttribute',
        'removeAttribute', 'hasAttribute', 'querySelector', 'querySelectorAll',
        'getElementById', 'getElementsByClassName', 'getElementsByTagName',
        'createElement', 'createTextNode', 'appendChild', 'removeChild',
        'insertBefore', 'replaceChild', 'cloneNode', 'parentNode', 'childNodes',
        'firstChild', 'lastChild', 'nextSibling', 'previousSibling',
        'addEventListener', 'removeEventListener', 'dispatchEvent',
        'preventDefault', 'stopPropagation', 'stopImmediatePropagation',
        'target', 'currentTarget', 'eventPhase', 'bubbles', 'cancelable',
        'defaultPrevented', 'composed', 'isTrusted', 'timeStamp',
        'Content-Type', 'Accept', 'Authorization', 'User-Agent', 'Cookie',
        'Set-Cookie', 'Cache-Control', 'Content-Length', 'Content-Encoding',
        'Transfer-Encoding', 'Connection', 'Host', 'Origin', 'Referer',
        'Access-Control-Allow-Origin', 'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers', 'Access-Control-Max-Age',
    }
    
    def __init__(self, encryption_key: str = 'x27cn-CFspider', seed: int = None):
        """
        初始化混淆器
        
        Args:
            encryption_key: 字符串加密密钥
            seed: 随机种子
        """
        self.name_gen = NameGenerator(seed)
        self.string_cryptor = StringCryptor(encryption_key)
        self.encryption_key = encryption_key
        
        # 合并所有保护列表
        self.protected_names: Set[str] = set()
        self.protected_names.update(self.JS_KEYWORDS)
        self.protected_names.update(self.JS_BUILTINS)
        self.protected_names.update(self.CF_WORKERS_API)
        self.protected_names.update(self.HTML_RELATED)
        
        # 名称映射表
        self.var_map: Dict[str, str] = {}
        self.func_map: Dict[str, str] = {}
        
        # 解密函数名
        self.decrypt_func_name = '_$27$_'
    
    def should_protect(self, name: str) -> bool:
        """检查名称是否应该被保护（不混淆）"""
        # 保护列表中的名称
        if name in self.protected_names:
            return True
        # 短名称（1-2字符）
        if len(name) <= 2:
            return True
        # 以 _ 开头的内部变量
        if name.startswith('__'):
            return True
        return False
    
    def get_obfuscated_name(self, original: str, is_function: bool = False) -> str:
        """获取混淆后的名称"""
        if self.should_protect(original):
            return original
        
        if is_function:
            if original not in self.func_map:
                self.func_map[original] = self.name_gen.gen_func_name()
            return self.func_map[original]
        else:
            if original not in self.var_map:
                self.var_map[original] = self.name_gen.gen_var_name()
            return self.var_map[original]
    
    def obfuscate_identifiers(self, code: str, obfuscate_vars: bool = True) -> str:
        """混淆变量名和函数名"""
        result = code
        
        # 1. 先识别函数声明和函数表达式
        # function funcName(...) 或 async function funcName(...)
        func_pattern = r'\b(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\('
        
        def replace_func_decl(match):
            async_prefix = match.group(1) or ''
            func_name = match.group(2)
            if not self.should_protect(func_name):
                new_name = self.get_obfuscated_name(func_name, is_function=True)
                return f'{async_prefix}function {new_name}('
            return match.group(0)
        
        result = re.sub(func_pattern, replace_func_decl, result)
        
        # 2. 识别 const/let/var 声明（可选）
        if obfuscate_vars:
            var_decl_pattern = r'\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b'
            
            def replace_var_decl(match):
                keyword = match.group(1)
                var_name = match.group(2)
                if not self.should_protect(var_name):
                    new_name = self.get_obfuscated_name(var_name, is_function=False)
                    return f'{keyword} {new_name}'
                return match.group(0)
            
            result = re.sub(var_decl_pattern, replace_var_decl, result)
        
        # 3. 替换所有已识别的标识符引用
        for original, obfuscated in {**self.var_map, **self.func_map}.items():
            # 使用单词边界匹配，避免替换部分匹配
            # 排除：1) 点号后面（对象属性）2) 字符串内
            pattern = r'(?<![.\'\"])\b' + re.escape(original) + r'\b(?![\'\"])'
            result = re.sub(pattern, obfuscated, result)
        
        return result
    
    def obfuscate_strings(self, code: str) -> Tuple[str, bool]:
        """
        加密代码中的字符串
        
        Returns:
            Tuple[混淆后的代码, 是否有字符串被加密]
        """
        result = code
        has_encrypted = False
        
        # 匹配字符串（单引号和双引号）
        string_pattern = r'''(['"])((?:(?!\1)[^\\]|\\.)*)(\1)'''
        
        def replace_string(match):
            nonlocal has_encrypted
            quote = match.group(1)
            content = match.group(2)
            full_match = match.group(0)
            
            # 跳过短字符串（少于 8 个字符）
            if len(content) < 8:
                return full_match
            
            # 跳过看起来像路径/URL的字符串
            if content.startswith('cloudflare:') or content.startswith('http') or content.startswith('/'):
                return full_match
            
            # 跳过 HTML 标签和模板
            if content.startswith('<') or '${' in content or '`' in content:
                return full_match
            
            # 跳过包含特殊语法字符的字符串（可能是代码片段）
            if any(c in content for c in ['[', ']', '{', '}', '(', ')', ';', ':', '=', '+', '-', '*', '/', '%', '&', '|', '^', '~', '!', '?', '@', '#']):
                return full_match
            
            # 跳过包含换行符的字符串
            if '\n' in content or '\r' in content:
                return full_match
            
            # 跳过看起来像正则表达式的字符串
            if content.startswith('^') or content.endswith('$'):
                return full_match
            
            # 跳过只包含特殊字符的字符串
            if re.match(r'^[\s\W]*$', content):
                return full_match
            
            # 跳过 CSS/HTML 相关字符串
            if any(kw in content.lower() for kw in ['style', 'class', 'color', 'font', 'margin', 'padding', 'display', 'width', 'height']):
                return full_match
            
            # 加密字符串
            try:
                encrypted = self.string_cryptor.encrypt(content)
                has_encrypted = True
                return f"{self.decrypt_func_name}('{encrypted}')"
            except Exception:
                return full_match
        
        result = re.sub(string_pattern, replace_string, result)
        
        return result, has_encrypted
    
    def protect_imports(self, code: str) -> Tuple[str, List[Tuple[str, str]]]:
        """
        保护 import/export 语句
        
        Returns:
            Tuple[处理后的代码, 占位符列表]
        """
        placeholders = []
        result = code
        
        # 匹配 import 语句
        import_pattern = r'^(import\s+.*?[\'"].*?[\'"];?)$'
        
        def replace_import(match):
            placeholder = f'__X27CN_IMPORT_{len(placeholders)}__'
            placeholders.append((placeholder, match.group(0)))
            return placeholder
        
        result = re.sub(import_pattern, replace_import, result, flags=re.MULTILINE)
        
        # 匹配 export 语句（保留 export default）
        export_pattern = r'^(export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+)'
        
        # 不替换 export 关键字，只保护后面的声明
        
        return result, placeholders
    
    def restore_imports(self, code: str, placeholders: List[Tuple[str, str]]) -> str:
        """恢复 import/export 语句"""
        result = code
        for placeholder, original in placeholders:
            result = result.replace(placeholder, original)
        return result
    
    def add_anti_debug(self) -> str:
        """生成反调试代码"""
        return '''
(function(){
    const _d = function(){
        const s = Date.now();
        debugger;
        if(Date.now() - s > 100){
            while(true){} 
        }
    };
    setInterval(_d, 3000);
})();
'''
    
    def obfuscate(self, code: str, 
                  encrypt_strings: bool = True,
                  obfuscate_names: bool = True,
                  obfuscate_vars: bool = True,
                  add_anti_debug: bool = False) -> str:
        """
        执行完整的混淆
        
        Args:
            code: 原始 JavaScript 代码
            encrypt_strings: 是否加密字符串
            obfuscate_names: 是否混淆标识符名称
            obfuscate_vars: 是否混淆变量名（仅当 obfuscate_names=True 时有效）
            add_anti_debug: 是否添加反调试代码
            
        Returns:
            混淆后的代码
        """
        result = code
        
        # 1. 保护 import 语句
        result, placeholders = self.protect_imports(result)
        
        # 2. 混淆标识符
        if obfuscate_names:
            result = self.obfuscate_identifiers(result, obfuscate_vars=obfuscate_vars)
        
        # 3. 加密字符串
        has_encrypted = False
        if encrypt_strings:
            result, has_encrypted = self.obfuscate_strings(result)
        
        # 4. 恢复 import 语句
        result = self.restore_imports(result, placeholders)
        
        # 5. 添加解密函数（如果有字符串被加密）
        if has_encrypted:
            decrypt_func = self.string_cryptor.generate_decrypt_function(self.decrypt_func_name)
            result = decrypt_func + '\n' + result
        
        # 6. 添加反调试代码（可选）
        if add_anti_debug:
            result = self.add_anti_debug() + result
        
        return result
    
    def get_mapping(self) -> Dict[str, str]:
        """获取名称映射表（用于调试）"""
        return {**self.var_map, **self.func_map}


def obfuscate(input_file: str, 
              output_file: str = None, 
              encryption_key: str = 'x27cn-CFspider',
              encrypt_strings: bool = True,
              obfuscate_names: bool = True,
              obfuscate_vars: bool = True,
              add_anti_debug: bool = False,
              seed: int = None) -> str:
    """
    混淆 JavaScript 文件
    
    Args:
        input_file: 输入文件路径
        output_file: 输出文件路径（可选，不指定则返回结果）
        encryption_key: 字符串加密密钥
        encrypt_strings: 是否加密字符串
        obfuscate_names: 是否混淆标识符
        obfuscate_vars: 是否混淆变量名
        add_anti_debug: 是否添加反调试代码
        seed: 随机种子
        
    Returns:
        混淆后的代码
    """
    # 读取输入文件
    with open(input_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # 创建混淆器并执行混淆
    obfuscator = X27cnObfuscator(encryption_key, seed)
    result = obfuscator.obfuscate(
        code, 
        encrypt_strings=encrypt_strings,
        obfuscate_names=obfuscate_names,
        obfuscate_vars=obfuscate_vars,
        add_anti_debug=add_anti_debug
    )
    
    # 写入输出文件
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result)
        print(f'x27cn: 混淆完成 -> {output_file}')
        print(f'x27cn: 变量映射数: {len(obfuscator.var_map)}')
        print(f'x27cn: 函数映射数: {len(obfuscator.func_map)}')
    
    return result


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(description='x27cn JavaScript 混淆器')
    parser.add_argument('input', help='输入 JavaScript 文件')
    parser.add_argument('-o', '--output', help='输出文件路径')
    parser.add_argument('-k', '--key', default='x27cn-CFspider', help='加密密钥')
    parser.add_argument('--no-strings', action='store_true', help='不加密字符串')
    parser.add_argument('--no-names', action='store_true', help='不混淆名称')
    parser.add_argument('--anti-debug', action='store_true', help='添加反调试代码')
    parser.add_argument('--seed', type=int, help='随机种子')
    
    args = parser.parse_args()
    
    output = args.output or args.input.replace('.js', '_x27cn.js')
    
    obfuscate(
        args.input,
        output,
        encryption_key=args.key,
        encrypt_strings=not args.no_strings,
        obfuscate_names=not args.no_names,
        add_anti_debug=args.anti_debug,
        seed=args.seed
    )


if __name__ == '__main__':
    main()

