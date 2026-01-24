const fs = require('fs');

// 读取原始文件
let code = fs.readFileSync('workers.js', 'utf8');

// ======================== 步骤1: 添加x27cn加密函数 ========================
const x27cnFunctions = `
// x27cn encryption
const X27CN_KEY = 'x27cn2026';
function x27cnEnc(t, k = X27CN_KEY) {
    if (!t) return '';
    const kb = new TextEncoder().encode(k);
    const tb = new TextEncoder().encode(t);
    const r = new Uint8Array(tb.length);
    for (let i = 0; i < tb.length; i++) {
        let b = tb[i] ^ kb[i % kb.length];
        b = ((b << 3) | (b >> 5)) & 0xFF;
        b = (b + i) & 0xFF;
        r[i] = b;
    }
    return Array.from(r).map(b => b.toString(16).padStart(2, '0')).join('');
}
`;

// 在import语句后添加加密函数
code = code.replace(
    `import { connect } from "cloudflare:sockets";`,
    `import { connect } from "cloudflare:sockets";${x27cnFunctions}`
);

// ======================== 步骤2: 修改根路径JSON响应 ========================
// 找到返回vless链接的地方，加密敏感信息
code = code.replace(
    /return new Response\(JSON\.stringify\(\{\s*status: 'online',\s*version: '1\.8\.7',\s*colo: colo,\s*host: url\.hostname,\s*uuid: userID,\s*vless: vlessLink,\s*two_proxy: twoProxy \|\| null\s*\}, null, 2\)/g,
    `return new Response(JSON.stringify({
                    status: 'online',
                    version: '1.8.7',
                    colo: colo,
                    host: url.hostname,
                    encrypted: true,
                    data: x27cnEnc(JSON.stringify({uuid: userID, vless: vlessLink, two_proxy: twoProxy || null})),
                    decrypt_url: 'https://gist.github.com/x27cn/decrypt'
                }, null, 2)`
);

// ======================== 步骤3: 修改api/config响应 ========================
// 加密uuid和vless_path
code = code.replace(
    /configResponse\.uuid = userID;/g,
    `configResponse.data = x27cnEnc(userID);`
);

code = code.replace(
    /configResponse\.vless_path = twoProxy/g,
    `configResponse.path_data = x27cnEnc(twoProxy`
);

// ======================== 步骤4: 删除中文注释 ========================
code = code.split('\n').map(line => {
    if (/^\s*\/\/.*[\u4e00-\u9fff]/.test(line)) return '';
    if (/\/\/.*[\u4e00-\u9fff]/.test(line)) {
        return line.replace(/\/\/.*[\u4e00-\u9fff].*$/, '');
    }
    return line;
}).join('\n');

// 删除多行注释
code = code.replace(/\/\*[\s\S]*?[\u4e00-\u9fff][\s\S]*?\*\//g, '');

// ======================== 步骤5: 翻译中文变量名 ========================
const translations = {
    // 敏感变量名和字符串替换
    'cfspiderPath': 'apiPath',
    'cfspider-public-00000000-0000': 'pub-node-00000000-0000',
    'x-cfspider-header-': 'x-custom-header-',
    'X-CFspider-Version': 'X-Worker-Version',
    'X-CFspider-TwoProxy': 'X-Two-Proxy',
    'CFspider/1.8.3': 'Mozilla/5.0',
    'cfspider.get': 'client.get',
    'CFspider-': 'Node-',
    '#CFspider': '#Node',
    
    // 变量名翻译
    '反代IP': 'proxyIP',
    '启用SOCKS5反代': 'enableSOCKS5Proxy',
    '启用SOCKS5全局反代': 'enableGlobalSOCKS5',
    '我的SOCKS5账号': 'mySOCKS5Account',
    '缓存反代IP': 'cachedProxyIP',
    '缓存反代解析数组': 'cachedProxyArray',
    '缓存反代数组索引': 'cachedProxyIndex',
    '启用反代兜底': 'enableProxyFallback',
    'SOCKS5白名单': 'socks5Whitelist',
    'Pages静态页面': 'pagesStaticUrl',
    '管理员密码': 'adminPassword',
    '加密秘钥': 'encryptKey',
    '访问IP': 'clientIP',
    '整理成数组': 'parseToArray',
    '优选订阅生成': 'subGenerator',
    '本地IP库': 'localIPPool',
    '随机数量': 'randomCount',
    '指定端口': 'specifiedPort',
    '随机IP': 'randomIP',
    '订阅转换配置': 'subConverterConfig',
    '反代': 'reverseProxy',
    '全局': 'globalMode',
    '账号': 'account',
    '白名单': 'whitelist',
    '传输协议': 'transport',
    '跳过证书验证': 'skipCertVerify',
    '启用0RTT': 'enable0RTT',
    'TLS分片': 'tlsFragment',
    '随机路径': 'randomPath',
    '本地': 'local',
    '协议类型': 'protocolType',
    '区分大小写访问': 'caseSensitivePath',
    '输入密码': 'inputPassword',
    '日志内容': 'logContent',
    '待验证优选': 'pendingOptimal',
    '请求优选': 'requestOptimal',
    '完整优选': 'fullOptimal',
    '其他节点': 'otherNodes',
    '节点': 'node',
    '内容': 'content',
    '优选': 'optimal',
    '保存自定义': 'saveCustom',
    '生成': 'gen',
    '订阅': 'sub',
    '地址备注分离': 'addrRemarkSplit',
    '订阅行列表': 'subLineList',
    '行内容': 'lineContent',
    '地址匹配': 'addrMatch',
    '地址端口': 'addrPort',
    '备注': 'remark',
    '原始地址': 'origAddr',
    '节点地址': 'nodeAddr',
    '节点端口': 'nodePort',
    '节点备注': 'nodeRemark',
    '订阅转换': 'subConvert',
    '订阅配置文件热补丁': 'subConfigHotfix',
    '批量替换': 'batchReplace',
    '获取': 'get',
    '处理': 'handle',
    '请求': 'request',
    '伪装页': 'fakePage',
    '新请求头': 'newHeaders',
    '响应内容': 'respContent',
    '响应': 'resp',
    '目标': 'target',
    '所有': 'all',
    '数组': 'arr',
    '兜底': 'fallback',
    '地址': 'addr',
    '端口': 'port',
    '索引': 'idx',
    '错误': 'err',
    '代理': 'proxy',
    '验证': 'verify',
    '原始': 'raw',
    '启用': 'enable',
    '当前': 'curr',
    '日志数组': 'logArr',
    '编码器': 'encoder',
    '第一次哈希': 'hash1',
    '第二次哈希': 'hash2',
    '常用': 'common',
    '目录': 'dir',
    '随机数': 'randNum',
    '字符集': 'charset',
    '重置配置': 'resetCfg',
    '初始化': 'init',
    '加载': 'load',
    '官方优选': 'officialOptimal',
    '默认端口': 'defPort',
    '超时': 'timeout',
    '国家': 'country',
    '城市': 'city',
    '解析': 'parse',
    '总计': 'totalCnt',
    '查询': 'query',
    '记录': 'record',
    '代理协议': 'proxyProto',
    '格式化': 'format',
    '随机字符串': 'randStr',
    '访问': 'visit',
    '失败': 'failed',
    '荷兰节点': 'nlNode',
    '香港节点': 'hkNode',
    '未知IP': 'unknownIP',
    '双层代理': 'twoProxy',
    '下载速度': 'dlSpeed',
    '数据中心': 'dataCenter',
    '延迟': 'latency',
    '移动优选': 'CMCCOptimal',
    '联通优选': 'CUOptimal',
    '电信优选': 'CTOptimal',
    'CF优选': 'CFOptimal',
    '的': '',
    '了': '',
    '个': ''
};

// 按长度排序
const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
for (const cn of sortedKeys) {
    code = code.split(cn).join(translations[cn]);
}

// 删除空行
code = code.replace(/\n{3,}/g, '\n\n');

// 保存翻译后的代码
fs.writeFileSync('workers_encrypted.js', code, 'utf8');
console.log('Step 1: Translation complete!');

// 检查剩余中文
const remaining = code.match(/[\u4e00-\u9fff]+/g);
if (remaining) {
    const unique = [...new Set(remaining)];
    console.log(`Remaining Chinese: ${unique.length}`);
    unique.slice(0, 10).forEach(c => console.log('  ' + c));
} else {
    console.log('No Chinese characters!');
}

