const fs = require('fs');

// 读取翻译后的代码
let code = fs.readFileSync('workers_translated.js', 'utf8');

// ======================== 步骤1: 添加x27cn加密函数 ========================
const x27cnFunctions = `
const X27CN_KEY='x27cn2026';
function x27cnEnc(t,k=X27CN_KEY){if(!t)return'';const kb=new TextEncoder().encode(k),tb=new TextEncoder().encode(t),r=new Uint8Array(tb.length);for(let i=0;i<tb.length;i++){let b=tb[i]^kb[i%kb.length];b=((b<<3)|(b>>5))&0xFF;b=(b+i)&0xFF;r[i]=b}return Array.from(r).map(b=>b.toString(16).padStart(2,'0')).join('')}
`;

// 在import语句后添加加密函数
code = code.replace(
    `import { connect } from "cloudflare:sockets";`,
    `import { connect } from "cloudflare:sockets";${x27cnFunctions}`
);

// ======================== 步骤2: 修改根路径JSON响应 ========================
// 使用更精确的多行匹配
code = code.replace(
    /return new Response\(JSON\.stringify\(\{\s*status:\s*'online',\s*version:\s*'1\.8\.7',\s*colo:\s*colo,\s*host:\s*url\.hostname,\s*uuid:\s*userID,\s*vless:\s*vlessLink,\s*two_proxy:\s*twoProxy\s*\|\|\s*null\s*\},\s*null,\s*2\),\s*\{\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*'Access-Control-Allow-Origin':\s*'\*'\s*\}\s*\}\);/g,
    `return new Response(JSON.stringify({
                    s: 'ok',
                    v: '1.8.7',
                    c: colo,
                    h: url.hostname,
                    enc: true,
                    d: x27cnEnc(JSON.stringify({u: userID, l: vlessLink, t: twoProxy || null}))
                }, null, 2), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });`
);

// ======================== 步骤3: 检查是否成功 ========================
if (code.includes('enc: true')) {
    console.log('Root response encrypted successfully!');
} else {
    console.log('WARNING: Root response not encrypted, trying alternative method...');
    
    // 备用方法：按行替换
    const lines = code.split('\n');
    let inRootResponse = false;
    let braceCount = 0;
    let startLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("status: 'online'")) {
            // 往前找到 return new Response
            for (let j = i - 1; j >= 0 && j > i - 5; j--) {
                if (lines[j].includes('return new Response(JSON.stringify({')) {
                    startLine = j;
                    inRootResponse = true;
                    braceCount = 1;
                    break;
                }
            }
        }
        
        if (inRootResponse && startLine !== -1) {
            // 计算花括号
            for (const ch of lines[i]) {
                if (ch === '{') braceCount++;
                if (ch === '}') braceCount--;
            }
            
            if (braceCount === 0 && lines[i].includes('});')) {
                // 找到结束位置，替换整个响应块
                const newResponse = `                return new Response(JSON.stringify({
                    s: 'ok',
                    v: '1.8.7',
                    c: colo,
                    h: url.hostname,
                    enc: true,
                    d: x27cnEnc(JSON.stringify({u: userID, l: vlessLink, t: twoProxy || null}))
                }, null, 2), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });`;
                
                // 删除原有行
                lines.splice(startLine, i - startLine + 1, newResponse);
                console.log('Replaced using alternative method!');
                break;
            }
        }
    }
    
    code = lines.join('\n');
}

// ======================== 步骤4: 加密api/uuid和api/config中的uuid ========================
// 替换 configResponse.uuid = userID;
code = code.replace(
    /configResponse\.uuid\s*=\s*userID;/g,
    `configResponse.d = x27cnEnc(userID);`
);

// ======================== 步骤5: 修改LINK生成（config中的vless链接） ========================
code = code.replace(
    /config_JSON\.LINK\s*=\s*`\$\{config_JSON\.protocolType\}/g,
    `config_JSON.LINK = x27cnEnc(\`\${config_JSON.protocolType}`
);

// 添加结尾括号
code = code.replace(
    /\$\{config_JSON\.skipCertVerify\s*\?\s*"&insecure=1&allowInsecure=1"\s*:\s*""\}#\$\{encodeURIComponent\(config_JSON\.subGenerator\.SUBNAME\)\}`;/g,
    `\${config_JSON.skipCertVerify ? "&insecure=1&allowInsecure=1" : ""}#\${encodeURIComponent(config_JSON.subGenerator.SUBNAME)}\`);`
);

// ======================== 步骤6: 保存 ========================
fs.writeFileSync('workers_encrypted.js', code, 'utf8');
console.log('Saved to workers_encrypted.js');

// 验证
if (code.includes('x27cnEnc')) {
    console.log('✓ x27cnEnc function present');
}
if (code.includes('enc: true')) {
    console.log('✓ Root response encrypted');
} else {
    console.log('✗ Root response NOT encrypted - manual check needed');
}
