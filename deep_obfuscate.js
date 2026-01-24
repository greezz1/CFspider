const fs = require('fs');

// 读取翻译后但未混淆的代码
let code = fs.readFileSync('workers_translated.js', 'utf8');

// 创建一个函数来生成base64解码表达式
function b64(str) {
    return `atob("${Buffer.from(str).toString('base64')}")`;
}

// 敏感字符串替换映射 - 在代码混淆前替换
const sensitiveReplacements = {
    // 动态拼接的字符串
    "'.proxyip.cmliussss.net'": `(${b64('.proxyip.cmliussss.net')})`,
    '".proxyip.cmliussss.net"': `(${b64('.proxyip.cmliussss.net')})`,
    "'.proxyip.'": `(${b64('.proxyip.')})`,
    '".proxyip."': `(${b64('.proxyip.')})`,
    "'doh.cmliussss.com'": b64('doh.cmliussss.com'),
    '"doh.cmliussss.com"': b64('doh.cmliussss.com'),
    'https://doh.cmliussss.com/CMLiussss': '"+atob("aHR0cHM6Ly9kb2guY21saXVzc3NzLmNvbS9DTUxpdXNzc3M=")+"',
    'useCfspiderGetWithTwoProxy': 'useClientWithTwoProxy',
    'notSupportedViaProxyAPI': 'notSupportedViaAPI',
    
    // 协议相关
    "'vless://'": `(${b64('vless://')})`,
    '"vless://"': `(${b64('vless://')})`,
    "'trojan://'": `(${b64('trojan://')})`,
    '"trojan://"': `(${b64('trojan://')})`,
    "'vless'": b64('vless'),
    '"vless"': b64('vless'),
    "'trojan'": b64('trojan'),
    '"trojan"': b64('trojan'),
    
    // 域名相关
    "'proxyip.cmliussss.net'": b64('proxyip.cmliussss.net'),
    '"proxyip.cmliussss.net"': b64('proxyip.cmliussss.net'),
    "'proxyip.cfspider.com'": b64('proxyip.cfspider.com'),
    '"proxyip.cfspider.com"': b64('proxyip.cfspider.com'),
    "'.PrOxYIp.CmLiUsSsS.nEt'": b64('.PrOxYIp.CmLiUsSsS.nEt'),
    '".PrOxYIp.CmLiUsSsS.nEt"': b64('.PrOxYIp.CmLiUsSsS.nEt'),
    
    // 项目名称
    "'cfspider-public'": b64('cfspider-public'),
    '"cfspider-public"': b64('cfspider-public'),
    "'cfspider-default-key'": b64('cfspider-default-key'),
    '"cfspider-default-key"': b64('cfspider-default-key'),
    "'CFspider'": b64('CFspider'),
    '"CFspider"': b64('CFspider'),
    "'CFspider-'": `(${b64('CFspider-')})`,
    '"CFspider-"': `(${b64('CFspider-')})`,
    "'cfspider'": b64('cfspider'),
    '"cfspider"': b64('cfspider'),
    "'edgetunnel'": b64('edgetunnel'),
    '"edgetunnel"': b64('edgetunnel'),
    
    // URL相关
    "'https://doh.cmliussss.net/CMLiussss'": b64('https://doh.cmliussss.net/CMLiussss'),
    '"https://doh.cmliussss.net/CMLiussss"': b64('https://doh.cmliussss.net/CMLiussss'),
    "'https://edt-pages.github.io'": b64('https://edt-pages.github.io'),
    '"https://edt-pages.github.io"': b64('https://edt-pages.github.io'),
    "'https://SUBAPI.cmliussss.net'": b64('https://SUBAPI.cmliussss.net'),
    '"https://SUBAPI.cmliussss.net"': b64('https://SUBAPI.cmliussss.net'),
    "'https://raw.githubusercontent.com/cmliu/ACL4SSR/refs/heads/main/Clash/config/ACL4SSR_Online_Mini_MultiMode_CF.ini'": b64('https://raw.githubusercontent.com/cmliu/ACL4SSR/refs/heads/main/Clash/config/ACL4SSR_Online_Mini_MultiMode_CF.ini'),
    '"https://raw.githubusercontent.com/cmliu/ACL4SSR/refs/heads/main/Clash/config/ACL4SSR_Online_Mini_MultiMode_CF.ini"': b64('https://raw.githubusercontent.com/cmliu/ACL4SSR/refs/heads/main/Clash/config/ACL4SSR_Online_Mini_MultiMode_CF.ini'),
    
    // 其他敏感字符串
    "'cmliu'": b64('cmliu'),
    '"cmliu"': b64('cmliu'),
    "'/proxyip'": b64('/proxyip'),
    '"/proxyip"': b64('/proxyip'),
    "'proxyip='": `(${b64('proxyip=')})`,
    '"proxyip="': `(${b64('proxyip=')})`,
    "'/proxyip='": `(${b64('/proxyip=')})`,
    '"/proxyip="': `(${b64('/proxyip=')})`,
};

// 按长度排序（从长到短），避免部分替换
const sortedKeys = Object.keys(sensitiveReplacements).sort((a, b) => b.length - a.length);

// 执行替换
for (const key of sortedKeys) {
    code = code.split(key).join(sensitiveReplacements[key]);
}

// 保存预处理后的代码
fs.writeFileSync('workers_preprocessed.js', code, 'utf8');
console.log('Preprocessed! Now run terser...');

// 检查剩余敏感字符串
const patterns = ['vless://', 'trojan://', 'cfspider', 'cmliussss', 'edgetunnel', 'proxyip.c'];
const remaining = patterns.filter(p => code.toLowerCase().includes(p.toLowerCase()));
if (remaining.length > 0) {
    console.log('Remaining sensitive strings:', remaining.join(', '));
} else {
    console.log('All sensitive strings encoded!');
}

