import { connect } from "cloudflare:sockets";
const X27CN_KEY='x27cn2026';
const X27_KAOMOJI=['(◕‿◕)','(｡◕‿◕｡)','(◠‿◠)','(✿◠‿◠)','(◡‿◡)','(◕ᴗ◕)','(◔‿◔)','(✧ω✧)','(◕◡◕)','(◠ᴗ◠)','♪(´▽｀)','(◕‿◕✿)','(✿╹◡╹)','(◕ˇ∀ˇ◕)','(◔◡◔)'];
const X27_CHAOS=['龖','龘','靐','齉','齾','爨','灪','麤','鱻','驫','骉','羴','猋','蟲','贔','矗','飝','厵','靇','雥'];
function x27cnEnc(t,k=X27CN_KEY){
    if(!t)return'';
    const kb=new TextEncoder().encode(k),tb=new TextEncoder().encode(t),r=new Uint8Array(tb.length);
    for(let i=0;i<tb.length;i++){
        let b=tb[i]^kb[i%kb.length];
        b=((b<<3)|(b>>5))&0xFF;
        b=(b+i)&0xFF;
        r[i]=b;
    }
    const hex=Array.from(r).map(b=>b.toString(16).padStart(2,'0')).join('');
    let result='';
    const seed=tb.length;
    for(let i=0;i<hex.length;i+=8){
        const chunk=hex.slice(i,i+8);
        result+=chunk;
        if(i%24===0&&i>0){
            const ki=(seed+i)%X27_KAOMOJI.length;
            result+=X27_KAOMOJI[ki];
        }
        if(i%16===0){
            const ci=(seed*2+i)%X27_CHAOS.length;
            result+=X27_CHAOS[ci];
        }
    }
    const prefix=X27_KAOMOJI[seed%X27_KAOMOJI.length]+X27_CHAOS[seed%X27_CHAOS.length];
    const suffix=X27_CHAOS[(seed*3)%X27_CHAOS.length]+X27_KAOMOJI[(seed*2)%X27_KAOMOJI.length];
    return prefix+result+suffix;
}

let config_JSON, proxyIP = '', enableSOCKS5Proxy = null, enableGlobalSOCKS5 = false, mySOCKS5Account = '', parsedSocks5Address = {};
let cachedProxyIP, cachedProxyArray, cachedProxyIndex = 0, enableProxyFallback = true, ECH_DOH = 'https://doh.cmliussss.net/CMLiussss';
let socks5Whitelist = ['*tapecontent.net', '*cloudatacdn.com', '*loadshare.org', '*cdn-centaurus.com', 'scholar.google.com'];
const pagesStaticUrl = 'https://edt-pages.github.io';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const UA = request.headers.get('User-Agent') || 'null';
        const upgradeHeader = request.headers.get('Upgrade');

        const PUBLIC_UUID = 'pub-node-00000000-0000';  // public UUID prefix
        const adminPassword = env.ADMIN || env.admin || env.PASSWORD || env.password || env.pswd || env.TOKEN || env.KEY || env.UUID || env.uuid || 'cfspider-public';
        const encryptKey = env.KEY || 'cfspider-default-key';
        const userIDMD5 = await MD5MD5(adminPassword + encryptKey);
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
        const envUUID = env.UUID || env.uuid;
        const userID = (envUUID && uuidRegex.test(envUUID)) ? envUUID.toLowerCase() : [userIDMD5.slice(0, 8), userIDMD5.slice(8, 12), '4' + userIDMD5.slice(13, 16), '8' + userIDMD5.slice(17, 20), userIDMD5.slice(20)].join('-');
        const hosts = env.HOST ? (await parseToArray(env.HOST)).map(h => h.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0]) : [url.hostname];
        const host = hosts[0];
        if (env.PROXYIP) {
            const proxyIPs = await parseToArray(env.PROXYIP);
            proxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
            enableProxyFallback = false;
        } else proxyIP = (request.cf.colo + '.PrOxYIp.CmLiUsSsS.nEt').toLowerCase();
        const clientIP = request.headers.get('X-Real-IP') || request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('True-Client-IP') || request.headers.get('Fly-Client-IP') || request.headers.get('X-Appengine-Remote-Addr') || request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || request.headers.get('X-Cluster-Client-IP') || request.cf?.clientTcpRtt || 'unknownIP';
        if (env.GO2SOCKS5) socks5Whitelist = await parseToArray(env.GO2SOCKS5);
        ECH_DOH = env.ECH_DOH || env.DOH || ECH_DOH;
        if (!upgradeHeader || upgradeHeader !== 'websocket') {
            if (url.protocol === 'http:') return Response.redirect(url.href.replace(`http://${url.hostname}`, `https://${url.hostname}`), 301);
            

            const apiPath = url.pathname.slice(1).toLowerCase();
            const newIpEnabled = env.NEW_IP !== 'false' && env.NEW_IP !== '0';

            const isDefaultUUID = !envUUID || !uuidRegex.test(envUUID);

            const twoProxy = env.TWO_PROXY || env.two_proxy || '';
            if (apiPath === '' || apiPath === '/') {
                const colo = request.cf?.colo || 'UNKNOWN';
                const vlessPath = '/' + userID + (twoProxy ? '?two_proxy=' + encodeURIComponent(twoProxy) : '');
                const vlessLink = 'vless://' + userID + '@' + url.hostname + ':443?security=tls&type=ws&host=' + url.hostname + '&sni=' + url.hostname + '&path=' + encodeURIComponent(vlessPath) + '&encryption=none#Node-' + colo;
                const fullData = {status: 'online', version: '1.8.7', colo: colo, host: url.hostname, uuid: userID, vless: vlessLink, two_proxy: twoProxy || null};
                return new Response(x27cnEnc(JSON.stringify(fullData)), {
                    headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'X-Enc': 'x27cn' }
                });
            }

            if (apiPath === 'api/proxyip') {
                const colo = request.cf?.colo || 'UNKNOWN';
                const defaultProxyIp = (colo + '.proxyip.cmliussss.net').toLowerCase();
                const envProxyIp = env.PROXYIP || '';
                const proxyData = {
                    colo: colo,
                    default: defaultProxyIp,
                    hk: 'proxyip.cfspider.com',
                    env: envProxyIp || null,
                    current: envProxyIp || defaultProxyIp,
                    options: {
                        default: { name: 'nlNode', address: defaultProxyIp },
                        hk: { name: 'hkNode', address: 'proxyip.cfspider.com' }
                    }
                };
                return new Response(x27cnEnc(JSON.stringify(proxyData)), { 
                    headers: { 
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*',
                        'X-Enc': 'x27cn'
                    } 
                });
            }

            if (apiPath === 'api/uuid' || apiPath === 'api/config') {
                const newIpEnabled = env.NEW_IP !== 'false' && env.NEW_IP !== '0';
                const twoProxyConfig = env.TWO_PROXY || env.two_proxy || '';
                const configResponse = {
                    host: url.hostname,
                    new_ip: newIpEnabled,
                    version: '1.8.7',
                    is_default_uuid: isDefaultUUID,
                    two_proxy_enabled: !!twoProxyConfig
                };
                if (isDefaultUUID) {
                    configResponse.uuid = userID;
                    configResponse.vless_path = twoProxyConfig 
                        ? '/' + userID + '?two_proxy=' + encodeURIComponent(twoProxyConfig)
                        : '/' + userID;
                } else if (twoProxyConfig) {
                    configResponse.two_proxy = twoProxyConfig;
                }
                if (twoProxyConfig) {
                    const parts = twoProxyConfig.split(':');
                    configResponse.two_proxy_host = parts[0] || '';
                    configResponse.two_proxy_port = parts[1] || '';
                }
                return new Response(x27cnEnc(JSON.stringify(configResponse)), { 
                headers: { 
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*',
                        'X-Enc': 'x27cn'
                }
            });
        }

            if (apiPath === 'proxy' || apiPath.startsWith('proxy?')) {
                const targetUrl = url.searchParams.get('url');
                const method = url.searchParams.get('method') || 'GET';
                const twoProxyParam = url.searchParams.get('two_proxy');
                
                if (!targetUrl) {
                    return new Response(JSON.stringify({error: 'Missing url parameter'}), {
                        status: 400,
                        headers: {'Content-Type': 'application/json'}
                    });
                }
                
                try {

                    const proxyHeaders = {};
                    for (const [key, value] of request.headers) {
                        if (key.toLowerCase().startsWith('x-custom-header-')) {
                            const originalKey = key.substring(18); // remove 'x-custom-header-' prefix
                            proxyHeaders[originalKey] = value;
                        }
                    }
                    
                    let response;
                    

                    const twoProxy = twoProxyParam || env.TWO_PROXY || env.two_proxy || '';
                    
                    if (twoProxy) {

                        const proxyParts = twoProxy.split(':');
                        const proxyHost = proxyParts[0];
                        const proxyPort = parseInt(proxyParts[1]) || 3128;
                        const proxyUser = proxyParts[2] || '';
                        const proxyPass = proxyParts[3] || '';
                        

                        const targetParsed = new URL(targetUrl);
                        const targetHost = targetParsed.hostname;
                        const targetPort = targetParsed.port || (targetParsed.protocol === 'https:' ? 443 : 80);
                        const isHttps = targetParsed.protocol === 'https:';
                        

                        const { connect } = await import('cloudflare:sockets');
                        
                        if (isHttps) {

                            return new Response(JSON.stringify({
                                error: 'HTTPS + two_proxy notSupportedViaProxyAPI。useCfspiderGetWithTwoProxy。',
                                hint: 'client.get(url, cf_proxies=..., uuid=..., two_proxy=...)',
                                reason: 'Workers /proxy API onlyHTTPTwoProxySupported'
                            }), {
                                status: 501,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                }
                            });
                        } else {

                            const socket = connect({
                                hostname: proxyHost,
                                port: proxyPort
                            });
                            
                            const writer = socket.writable.getWriter();
                            const reader = socket.readable.getReader();
                            

                            let httpReq = `${method} ${targetUrl} HTTP/1.1\r\nHost: ${targetHost}\r\n`;
                            if (proxyUser && proxyPass) {
                                const auth = btoa(`${proxyUser}:${proxyPass}`);
                                httpReq += `Proxy-Authorization: Basic ${auth}\r\n`;
                            }
                            for (const [key, value] of Object.entries(proxyHeaders)) {
                                httpReq += `${key}: ${value}\r\n`;
                            }
                            httpReq += 'Connection: close\r\n\r\n';
                            
                            await writer.write(new TextEncoder().encode(httpReq));
                            

                            let responseData = new Uint8Array(0);
                            while (true) {
                                const { value, done } = await reader.read();
                                if (done) break;
                                const newData = new Uint8Array(responseData.length + value.length);
                                newData.set(responseData);
                                newData.set(value, responseData.length);
                                responseData = newData;
                            }
                            

                            const responseText = new TextDecoder().decode(responseData);
                            const headerEnd = responseText.indexOf('\r\n\r\n');
                            const headers = responseText.substring(0, headerEnd);
                            const body = responseData.slice(new TextEncoder().encode(responseText.substring(0, headerEnd + 4)).length);
                            
                            const statusLine = headers.split('\r\n')[0];
                            const statusCode = parseInt(statusLine.split(' ')[1]) || 200;
                            
                            const responseHeaders = new Headers();
                            headers.split('\r\n').slice(1).forEach(line => {
                                const [key, ...valueParts] = line.split(':');
                                if (key && valueParts.length) {
                                    responseHeaders.set(key.trim(), valueParts.join(':').trim());
                                }
                            });
                            responseHeaders.set('Access-Control-Allow-Origin', '*');
                            responseHeaders.set('X-CF-Colo', request.cf?.colo || 'unknown');
                            responseHeaders.set('X-Worker-Version', '1.8.6');
                            responseHeaders.set('X-Two-Proxy', 'enabled');
                            
                            return new Response(body, {
                                status: statusCode,
                                headers: responseHeaders
                            });
                        }
                    } else {

                        const proxyRequest = new Request(targetUrl, {
                            method: method,
                            headers: proxyHeaders,
                            body: method !== 'GET' && method !== 'HEAD' ? request.body : null
                        });
                        
                        response = await fetch(proxyRequest);
                        

                        const responseHeaders = new Headers(response.headers);
                        responseHeaders.set('Access-Control-Allow-Origin', '*');
                        responseHeaders.set('X-CF-Colo', request.cf?.colo || 'unknown');
                        responseHeaders.set('X-Worker-Version', '1.8.6');
                        
                        return new Response(response.body, {
                            status: response.status,
                            headers: responseHeaders
                        });
                    }
                } catch (error) {
                    return new Response(JSON.stringify({error: error.message}), {
                        status: 500,
                        headers: {'Content-Type': 'application/json'}
                    });
                }
            }
            

            if (apiPath === 'api/config/new_ip' && request.method === 'POST') {

                const newIpEnabled = env.NEW_IP !== 'false' && env.NEW_IP !== '0';
            return new Response(JSON.stringify({
                    new_ip: newIpEnabled,
                    message: 'setNEWIPViaDashboard'
                }), { 
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    } 
                });
            }
            
            if (!adminPassword) return fetch(pagesStaticUrl + '/noADMIN').then(r => { const headers = new Headers(r.headers); headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); headers.set('Pragma', 'no-cache'); headers.set('Expires', '0'); return new Response(r.body, { status: 404, statusText: r.statusText, headers }); });
            if (env.KV && typeof env.KV.get === 'function') {
                const visitpath = url.pathname.slice(1).toLowerCase();
                const caseSensitivePathpath = url.pathname.slice(1);
                if (caseSensitivePathpath === encryptKey && encryptKey !== 'doNotModifyDefaultKey') {//fastsub
                    const params = new URLSearchParams(url.search);
                    params.set('token', await MD5MD5(host + userID));
                    return new Response('redirecting...', { status: 302, headers: { 'Location': `/sub?${params.toString()}` } });
                } else if (visitpath === 'login') {//handleloginPageAndrequest
                    const cookies = request.headers.get('Cookie') || '';
                    const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth='))?.split('=')[1];
                    if (authCookie == await MD5MD5(UA + encryptKey + adminPassword)) return new Response('redirecting...', { status: 302, headers: { 'Location': '/admin' } });
                    if (request.method === 'POST') {
                        const formData = await request.text();
                        const params = new URLSearchParams(formData);
                        const inputPassword = params.get('password');
                        if (inputPassword === adminPassword) {

                            const resp = new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            resp.headers.set('Set-Cookie', `auth=${await MD5MD5(UA + encryptKey + adminPassword)}; Path=/; Max-Age=86400; HttpOnly`);
                            return resp;
                        }
                    }
                    return fetch(pagesStaticUrl + '/login');
                } else if (visitpath === 'admin' || visitpath.startsWith('admin/')) {//verifycookieafterrespadminPage
                    const cookies = request.headers.get('Cookie') || '';
                    const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth='))?.split('=')[1];

                    if (!authCookie || authCookie !== await MD5MD5(UA + encryptKey + adminPassword)) return new Response('redirecting...', { status: 302, headers: { 'Location': '/login' } });
                    if (visitpath === 'admin/log.json') {// readlogContent
                        const readlogContent = await env.KV.get('log.json') || '[]';
                        return new Response(readlogContent, { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    } else if (caseSensitivePathpath === 'admin/getCloudflareUsage') {// queryrequestamt
                        try {
                            const Usage_JSON = await getCloudflareUsage(url.searchParams.get('Email'), url.searchParams.get('GlobalAPIKey'), url.searchParams.get('AccountID'), url.searchParams.get('APIToken'));
                            return new Response(JSON.stringify(Usage_JSON, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
                        } catch (err) {
                            const errorResponse = { msg: 'queryRequestFailed，reason：' + err.message, error: err.message };
                            return new Response(JSON.stringify(errorResponse, null, 2), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        }
                    } else if (caseSensitivePathpath === 'admin/getADDAPI') {// verifyoptimalAPI
                        if (url.searchParams.get('url')) {
                            const pendingOptimalURL = url.searchParams.get('url');
                            try {
                                new URL(pendingOptimalURL);
                                const requestOptimalAPIcontent = await requestOptimalAPI([pendingOptimalURL], url.searchParams.get('port') || '443');
                                const optimalAPIIP = requestOptimalAPIcontent[0].length > 0 ? requestOptimalAPIcontent[0] : requestOptimalAPIcontent[1];
                                return new Response(JSON.stringify({ success: true, data: optimalAPIIP }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            } catch (err) {
                                const errorResponse = { msg: 'verifyAPIFailed，reason：' + err.message, error: err.message };
                                return new Response(JSON.stringify(errorResponse, null, 2), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            }
                        }
                        return new Response(JSON.stringify({ success: false, data: [] }, null, 2), { status: 403, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    } else if (visitpath === 'admin/check') {// SOCKS5proxycheck
                        let checkProxyResponse;
                        if (url.searchParams.has('socks5')) {
                            checkProxyResponse = await SOCKS5availabilityCheck('socks5', url.searchParams.get('socks5'));
                        } else if (url.searchParams.has('http')) {
                            checkProxyResponse = await SOCKS5availabilityCheck('http', url.searchParams.get('http'));
        } else {
                            return new Response(JSON.stringify({ error: 'missingProxyParam' }), { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        }
                        return new Response(JSON.stringify(checkProxyResponse, null, 2), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    }

                    config_JSON = await readconfig_JSON(env, host, userID, env.PATH);

                    if (visitpath === 'admin/init') {// resetCfgtoDefault
                        try {
                            config_JSON = await readconfig_JSON(env, host, userID, env.PATH, true);
                            ctx.waitUntil(requestLogRecord(env, request, clientIP, 'Init_Config', config_JSON));
                            config_JSON.init = 'configResetToDefault';
                            return new Response(JSON.stringify(config_JSON, null, 2), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        } catch (err) {
                            const errorResponse = { msg: 'configResetFailed，reason：' + err.message, error: err.message };
                            return new Response(JSON.stringify(errorResponse, null, 2), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                        }
                    } else if (request.method === 'POST') {// handle KV op（POST request）
                        if (visitpath === 'admin/config.json') { // saveconfig.jsonconfig
                            try {
                                const newConfig = await request.json();

                                if (!newConfig.UUID || !newConfig.HOST) return new Response(JSON.stringify({ error: 'incompleteConfig' }), { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } });


                                await env.KV.put('config.json', JSON.stringify(newConfig, null, 2));
                                ctx.waitUntil(requestLogRecord(env, request, clientIP, 'Save_Config', config_JSON));
                                return new Response(JSON.stringify({ success: true, message: 'configSaved' }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            } catch (error) {
                                console.error('saveConfigFailed:', error);
                                return new Response(JSON.stringify({ error: 'saveConfigFailed: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            }
                        } else if (visitpath === 'admin/cf.json') { // savecf.jsonconfig
                            try {
                                const newConfig = await request.json();
                                const CF_JSON = { Email: null, GlobalAPIKey: null, AccountID: null, APIToken: null, UsageAPI: null };
                                if (!newConfig.init || newConfig.init !== true) {
                                    if (newConfig.Email && newConfig.GlobalAPIKey) {
                                        CF_JSON.Email = newConfig.Email;
                                        CF_JSON.GlobalAPIKey = newConfig.GlobalAPIKey;
                                    } else if (newConfig.AccountID && newConfig.APIToken) {
                                        CF_JSON.AccountID = newConfig.AccountID;
                                        CF_JSON.APIToken = newConfig.APIToken;
                                    } else if (newConfig.UsageAPI) {
                                        CF_JSON.UsageAPI = newConfig.UsageAPI;
                                    } else {
                                        return new Response(JSON.stringify({ error: 'incompleteConfig' }), { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                                    }
                                }


                                await env.KV.put('cf.json', JSON.stringify(CF_JSON, null, 2));
                                ctx.waitUntil(requestLogRecord(env, request, clientIP, 'Save_Config', config_JSON));
                                return new Response(JSON.stringify({ success: true, message: 'configSaved' }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
            } catch (error) {
                                console.error('saveConfigFailed:', error);
                                return new Response(JSON.stringify({ error: 'saveConfigFailed: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            }
                        } else if (visitpath === 'admin/tg.json') { // savetg.jsonconfig
                            try {
                                const newConfig = await request.json();
                                if (newConfig.init && newConfig.init === true) {
                                    const TG_JSON = { BotToken: null, ChatID: null };
                                    await env.KV.put('tg.json', JSON.stringify(TG_JSON, null, 2));
                                } else {
                                    if (!newConfig.BotToken || !newConfig.ChatID) return new Response(JSON.stringify({ error: 'incompleteConfig' }), { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                                    await env.KV.put('tg.json', JSON.stringify(newConfig, null, 2));
                                }
                                ctx.waitUntil(requestLogRecord(env, request, clientIP, 'Save_Config', config_JSON));
                                return new Response(JSON.stringify({ success: true, message: 'configSaved' }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            } catch (error) {
                                console.error('saveConfigFailed:', error);
                                return new Response(JSON.stringify({ error: 'saveConfigFailed: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            }
                        } else if (caseSensitivePathpath === 'admin/ADD.txt') { // saveCustomoptimalIP
                            try {
                                const customIPs = await request.text();
                                await env.KV.put('ADD.txt', customIPs);// saveTo KV
                                ctx.waitUntil(requestLogRecord(env, request, clientIP, 'Save_Custom_IPs', config_JSON));
                                return new Response(JSON.stringify({ success: true, message: 'customIPSaved' }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            } catch (error) {
                                console.error('saveCustomIPfailed:', error);
                                return new Response(JSON.stringify({ error: 'saveCustomIPfailed: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                            }
                        } else return new Response(JSON.stringify({ error: 'unsupportedPOSTPath' }), { status: 404, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    } else if (visitpath === 'admin/config.json') {// handle admin/config.json request，returnJSON
                        return new Response(JSON.stringify(config_JSON, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    } else if (caseSensitivePathpath === 'admin/ADD.txt') {// handle admin/ADD.txt request，returnlocaloptimalIP
                        let localoptimalIP = await env.KV.get('ADD.txt') || 'null';
                        if (localoptimalIP == 'null') localoptimalIP = (await genrandomIP(request, config_JSON.subGenerator.localIPPool.randomCount, config_JSON.subGenerator.localIPPool.specifiedPort))[1];
                        return new Response(localoptimalIP, { status: 200, headers: { 'Content-Type': 'text/plain;charset=utf-8', 'asn': request.cf.asn } });
                    } else if (visitpath === 'admin/cf.json') {// CFcfgFile
                        return new Response(JSON.stringify(request.cf, null, 2), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    }

                    ctx.waitUntil(requestLogRecord(env, request, clientIP, 'Admin_Login', config_JSON));
                    return fetch(pagesStaticUrl + '/admin');
                } else if (visitpath === 'logout' || uuidRegex.test(visitpath)) {//clearcookieredirectToLogin
                    const resp = new Response('redirecting...', { status: 302, headers: { 'Location': '/login' } });
                    resp.headers.set('Set-Cookie', 'auth=; Path=/; Max-Age=0; HttpOnly');
                    return resp;
                } else if (visitpath === 'sub') {//handlesubrequest
                    const subTOKEN = await MD5MD5(host + userID);
                    if (url.searchParams.get('token') === subTOKEN) {
                        config_JSON = await readconfig_JSON(env, host, userID, env.PATH);
                        ctx.waitUntil(requestLogRecord(env, request, clientIP, 'Get_SUB', config_JSON));
                        const ua = UA.toLowerCase();
                        const expire = 4102329600;//2099-12-31 expiretime
                        const now = Date.now();
                        const today = new Date(now);
                        today.setHours(0, 0, 0, 0);
                        const UD = Math.floor(((now - today.getTime()) / 86400000) * 24 * 1099511627776 / 2);
                        let pagesSum = UD, workersSum = UD, total = 24 * 1099511627776;
                        if (config_JSON.CF.Usage.success) {
                            pagesSum = config_JSON.CF.Usage.pages;
                            workersSum = config_JSON.CF.Usage.workers;
                            total = Number.isFinite(config_JSON.CF.Usage.max) ? (config_JSON.CF.Usage.max / 1000) * 1024 : 1024 * 100;
                        }
                        const responseHeaders = {
                            "content-type": "text/plain; charset=utf-8",
                            "Profile-Update-Interval": config_JSON.subGenerator.SUBUpdateTime,
                            "Profile-web-page-url": url.protocol + '//' + url.host + '/admin',
                            "Subscription-Userinfo": `upload=${pagesSum}; download=${workersSum}; total=${total}; expire=${expire}`,
                            "Cache-Control": "no-store",
                        };
                        const isSubConverterRequest = url.searchParams.has('b64') || url.searchParams.has('base64') || request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || ua.includes('subconverter') || ua.includes(('CF-Workers-SUB').toLowerCase());
                        const subtype = isSubConverterRequest
                            ? 'mixed'
                            : url.searchParams.has('target')
                                ? url.searchParams.get('target')
                                : url.searchParams.has('clash') || ua.includes('clash') || ua.includes('meta') || ua.includes('mihomo')
                                    ? 'clash'
                                    : url.searchParams.has('sb') || url.searchParams.has('singbox') || ua.includes('singbox') || ua.includes('sing-box')
                                        ? 'singbox'
                                        : url.searchParams.has('surge') || ua.includes('surge')
                                            ? 'surge&ver=4'
                                            : url.searchParams.has('quanx') || ua.includes('quantumult')
                                                ? 'quanx'
                                                : url.searchParams.has('loon') || ua.includes('loon')
                                                    ? 'loon'
                                                    : 'mixed';

                        if (!ua.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(config_JSON.subGenerator.SUBNAME)}`;
                        const protocolType = (url.searchParams.has('surge') || ua.includes('surge')) ? 'tro' + 'jan' : config_JSON.protocolType;
                        let subContent = '';
                        if (subtype === 'mixed') {
                            const nodepath = config_JSON.enable0RTT ? config_JSON.PATH + '?ed=2560' : config_JSON.PATH;
                            const tlsFragmentparam = config_JSON.tlsFragment == 'Shadowrocket' ? `&fragment=${encodeURIComponent('1,40-60,30-50,tlshello')}` : config_JSON.tlsFragment == 'Happ' ? `&fragment=${encodeURIComponent('3,1,tlshello')}` : '';
                            let fullOptimalIP = [], otherNodesLINK = '';

                            if (!url.searchParams.has('sub') && config_JSON.subGenerator.local) { // localgensub
                                const fullOptimalList = config_JSON.subGenerator.localIPPool.randomIP ? (await genrandomIP(request, config_JSON.subGenerator.localIPPool.randomCount, config_JSON.subGenerator.localIPPool.specifiedPort))[0] : await env.KV.get('ADD.txt') ? await parseToArray(await env.KV.get('ADD.txt')) : (await genrandomIP(request, config_JSON.subGenerator.localIPPool.randomCount, config_JSON.subGenerator.localIPPool.specifiedPort))[0];
                                const optimalAPI = [], optimalIP = [], otherNodes = [];
                                for (const element of fullOptimalList) {
                                    if (element.toLowerCase().startsWith('https://')) optimalAPI.push(element);
                                    else if (element.toLowerCase().includes('://')) {
                                        if (element.includes('#')) {
                                            const addrRemarkSplit = element.split('#');
                                            otherNodes.push(addrRemarkSplit[0] + '#' + encodeURIComponent(decodeURIComponent(addrRemarkSplit[1])));
                                        } else otherNodes.push(element);
                                    } else optimalIP.push(element);
                                }
                                const requestOptimalAPIcontent = await requestOptimalAPI(optimalAPI);
                                const mergeOtherNodes = [...new Set(otherNodes.concat(requestOptimalAPIcontent[1]))];
                                otherNodesLINK = mergeOtherNodes.length > 0 ? mergeOtherNodes.join('\n') + '\n' : '';
                                const optimalAPIIP = requestOptimalAPIcontent[0];
                                fullOptimalIP = [...new Set(optimalIP.concat(optimalAPIIP))];
                            } else { // subGeneratorer
                                let subGeneratorerHOST = url.searchParams.get('sub') || config_JSON.subGenerator.SUB;
                                subGeneratorerHOST = subGeneratorerHOST && !/^https?:\/\//i.test(subGeneratorerHOST) ? `https://${subGeneratorerHOST}` : subGeneratorerHOST;
                                const subGeneratorerURL = `${subGeneratorerHOST}/sub?host=example.com&uuid=00000000-0000-4000-8000-000000000000`;
                                try {
                                    const response = await fetch(subGeneratorerURL, { headers: { 'User-Agent': 'v2rayN/edge' + 'tunnel (https://github.com/cmliu/edge' + 'tunnel)' } });
                                    if (!response.ok) return new Response('subGenError：' + response.statusText, { status: response.status });
                                    const subGeneratorerReturnsubContent = atob(await response.text());
                                    const subLineList = subGeneratorerReturnsubContent.includes('\r\n') ? subGeneratorerReturnsubContent.split('\r\n') : subGeneratorerReturnsubContent.split('\n');
                                    for (const lineContent of subLineList) {
                                        if (!lineContent.trim()) continue; // skipEmpty
                                        if (lineContent.includes('00000000-0000-4000-8000-000000000000') && lineContent.includes('example.com')) { // thisIsoptimalIPline，extract domain:port#remark
                                            const addrMatch = lineContent.match(/:\/\/[^@]+@([^?]+)/);
                                            if (addrMatch) {
                                                let addrPort = addrMatch[1], remark = ''; // domain:port or IP:port
                                                const remarkMatch = lineContent.match(/#(.+)$/);
                                                if (remarkMatch) remark = '#' + decodeURIComponent(remarkMatch[1]);
                                                fullOptimalIP.push(addrPort + remark);
                                            }
                                        } else otherNodesLINK += lineContent + '\n';
                                    }
            } catch (error) {
                                    return new Response('subGenError：' + error.message, { status: 403 });
                                }
                            }
                            const ECHLINKparam = config_JSON.ECH ? `&ech=${encodeURIComponent('cloudflare-ech.com+' + ECH_DOH)}` : '';
                            subContent = otherNodesLINK + fullOptimalIP.map(origAddr => {

                                const regex = /^(\[[\da-fA-F:]+\]|[\d.]+|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*)(?::(\d+))?(?:#(.+))?$/;
                                const match = origAddr.match(regex);

                                let nodeAddr, nodePort = "443", nodeRemark;

                                if (match) {
                                    nodeAddr = match[1];  // IPaddrordomain(mayHaveBrackets)
                                    nodePort = match[2] || "443";  // port,def443
                                    nodeRemark = match[3] || nodeAddr;  // remark,defToaddritself
                                } else {

                                    console.warn(`[subContent] invalidIPIgnored: ${origAddr}`);
                                    return null;
                                }

                                return `${protocolType}://00000000-0000-4000-8000-000000000000@${nodeAddr}:${nodePort}?security=tls&type=${config_JSON.transport + ECHLINKparam}&host=example.com&fp=${config_JSON.Fingerprint}&sni=example.com&path=${encodeURIComponent(config_JSON.randomPath ? randomPath() + nodepath : nodepath) + tlsFragmentparam}&encryption=none${config_JSON.skipCertVerify ? '&insecure=1&allowInsecure=1' : ''}#${encodeURIComponent(nodeRemark)}`;
                            }).filter(item => item !== null).join('\n');
                        } else { // subConvert
                            const subConvertURL = `${config_JSON.subConverterConfig.SUBAPI}/sub?target=${subtype}&url=${encodeURIComponent(url.protocol + '//' + url.host + '/sub?target=mixed&token=' + subTOKEN + (url.searchParams.has('sub') && url.searchParams.get('sub') != '' ? `&sub=${url.searchParams.get('sub')}` : ''))}&config=${encodeURIComponent(config_JSON.subConverterConfig.SUBCONFIG)}&emoji=${config_JSON.subConverterConfig.SUBEMOJI}&scv=${config_JSON.skipCertVerify}`;
                            try {
                                const response = await fetch(subConvertURL, { headers: { 'User-Agent': 'Subconverter for ' + subtype + ' edge' + 'tunnel(https://github.com/cmliu/edge' + 'tunnel)' } });
                                if (response.ok) {
                                    subContent = await response.text();
                                    if (url.searchParams.has('surge') || ua.includes('surge')) subContent = SurgesubConfigHotfix(subContent, url.protocol + '//' + url.host + '/sub?token=' + subTOKEN + '&surge', config_JSON);
                                } else return new Response('subConverterError：' + response.statusText, { status: response.status });
                            } catch (error) {
                                return new Response('subConverterError：' + error.message, { status: 403 });
                            }
                        }

                        if (!ua.includes('subconverter')) subContent = await batchReplacedomain(subContent.replace(/00000000-0000-4000-8000-000000000000/g, config_JSON.UUID), config_JSON.HOSTS)

                        if (subtype === 'mixed' && (!ua.includes('mozilla') || url.searchParams.has('b64') || url.searchParams.has('base64'))) subContent = btoa(subContent);

                        if (subtype === 'singbox') {
                            subContent = SingboxsubConfigHotfix(subContent, config_JSON.UUID, config_JSON.Fingerprint, config_JSON.ECH ? await getECH(host) : null);
                            responseHeaders["content-type"] = 'application/json; charset=utf-8';
                        } else if (subtype === 'clash') {
                            subContent = ClashsubConfigHotfix(subContent, config_JSON.UUID, config_JSON.ECH, config_JSON.HOSTS);
                            responseHeaders["content-type"] = 'application/x-yaml; charset=utf-8';
                        }
                        return new Response(subContent, { status: 200, headers: responseHeaders });
                    }
                } else if (visitpath === 'locations') {//reverseProxylocationslist
                    const cookies = request.headers.get('Cookie') || '';
                    const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth='))?.split('=')[1];
                    if (authCookie && authCookie == await MD5MD5(UA + encryptKey + adminPassword)) return fetch(new Request('https://speed.cloudflare.com/locations', { headers: { 'Referer': 'https://speed.cloudflare.com/' } }));
                } else if (visitpath === 'robots.txt') return new Response('User-agent: *\nDisallow: /', { status: 200, headers: { 'Content-Type': 'text/plain; charset=UTF-8' } });
            } else if (!envUUID) return fetch(pagesStaticUrl + '/noKV').then(r => { const headers = new Headers(r.headers); headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); headers.set('Pragma', 'no-cache'); headers.set('Expires', '0'); return new Response(r.body, { status: 404, statusText: r.statusText, headers }); });
        } else if (adminPassword) {// wsproxy
            await reverseProxyparamget(request);

            const urlPath = new URL(request.url).pathname;
            let twoProxyFromPath = '';
            if (urlPath.includes('two_proxy=')) {
                const match = urlPath.match(/two_proxy=([^&]+)/);
                if (match) {
                    twoProxyFromPath = decodeURIComponent(decodeURIComponent(match[1]));
                }
            }

            const twoProxyConfig = twoProxyFromPath || env.TWO_PROXY || env.two_proxy || '';
            return await handleWSrequest(request, userID, twoProxyConfig);
        }

        let fakePageURL = env.URL || 'nginx';
        if (fakePageURL && fakePageURL !== 'nginx' && fakePageURL !== '1101') {
            fakePageURL = fakePageURL.trim().replace(/\/$/, '');
            if (!fakePageURL.match(/^https?:\/\//i)) fakePageURL = 'https://' + fakePageURL;
            if (fakePageURL.toLowerCase().startsWith('http://')) fakePageURL = 'https://' + fakePageURL.substring(7);
            try { const u = new URL(fakePageURL); fakePageURL = u.protocol + '//' + u.host; } catch (e) { fakePageURL = 'nginx'; }
        }
        if (fakePageURL === '1101') return new Response(await html1101(url.host, clientIP), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
        try {
            const reverseProxyURL = new URL(fakePageURL), newHeaders = new Headers(request.headers);
            newHeaders.set('Host', reverseProxyURL.host);
            newHeaders.set('Referer', reverseProxyURL.origin);
            newHeaders.set('Origin', reverseProxyURL.origin);
            if (!newHeaders.has('User-Agent') && UA && UA !== 'null') newHeaders.set('User-Agent', UA);
            const reverseProxyresp = await fetch(reverseProxyURL.origin + url.pathname + url.search, { method: request.method, headers: newHeaders, body: request.body, cf: request.cf });
            const contenttype = reverseProxyresp.headers.get('content-type') || '';

            if (/text|javascript|json|xml/.test(contenttype)) {
                const respContent = (await reverseProxyresp.text()).replaceAll(reverseProxyURL.host, url.host);
                return new Response(respContent, { status: reverseProxyresp.status, headers: { ...Object.fromEntries(reverseProxyresp.headers), 'Cache-Control': 'no-store' } });
            }
            return reverseProxyresp;
        } catch (error) { }
        return new Response(await nginx(), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }
};

async function handleWSrequest(request, yourUUID, twoProxy = '') {
    const wssPair = new WebSocketPair();
    const [clientSock, serverSock] = Object.values(wssPair);
    serverSock.accept();
    let remoteConnWrapper = { socket: null };
    let isDnsQuery = false;
    const earlyData = request.headers.get('sec-websocket-protocol') || '';
    const readable = makeReadableStr(serverSock, earlyData);
    let checkIfTrojan = null;
    

    let twoProxyParsed = null;
    if (twoProxy) {
        const parts = twoProxy.split(':');
        if (parts.length >= 2) {
            twoProxyParsed = {
                hostname: parts[0],
                port: parseInt(parts[1], 10),
                username: parts[2] || '',
                password: parts[3] || ''
            };
            console.log(`[twoProxy] enabled: ${twoProxyParsed.hostname}:${twoProxyParsed.port}`);
        }
    }
    
    readable.pipeTo(new WritableStream({
        async write(chunk) {
            if (isDnsQuery) return await forwardataudp(chunk, serverSock, null);
            if (remoteConnWrapper.socket) {
                const writer = remoteConnWrapper.socket.writable.getWriter();
                await writer.write(chunk);
                writer.releaseLock();
                return;
            }

            if (checkIfTrojan === null) {
                const bytes = new Uint8Array(chunk);
                checkIfTrojan = bytes.byteLength >= 58 && bytes[56] === 0x0d && bytes[57] === 0x0a;
            }

            if (remoteConnWrapper.socket) {
                const writer = remoteConnWrapper.socket.writable.getWriter();
                await writer.write(chunk);
                writer.releaseLock();
                return;
            }

            if (checkIfTrojan) {
                const { port, hostname, rawClientData } = parseTrojanReq(chunk, yourUUID);
                if (isSpeedTestSite(hostname)) throw new Error('Speedtest site is blocked');
                await forwardataTCP(hostname, port, rawClientData, serverSock, null, remoteConnWrapper, yourUUID, twoProxyParsed);
            } else {
                const { port, hostname, rawIndex, version, isUDP } = parseVlessReq(chunk, yourUUID);
                if (isSpeedTestSite(hostname)) throw new Error('Speedtest site is blocked');
                if (isUDP) {
                    if (port === 53) isDnsQuery = true;
                    else throw new Error('UDP is not supported');
                }
                const respHeader = new Uint8Array([version[0], 0]);
                const rawData = chunk.slice(rawIndex);
                if (isDnsQuery) return forwardataudp(rawData, serverSock, respHeader);
                await forwardataTCP(hostname, port, rawData, serverSock, respHeader, remoteConnWrapper, yourUUID, twoProxyParsed);
            }
        },
    })).catch((err) => {
        // console.error('Readable pipe error:', err);
    });

    return new Response(null, { status: 101, webSocket: clientSock });
}

function parseTrojanReq(buffer, passwordPlainText) {
    const sha224Password = sha224(passwordPlainText);
    if (buffer.byteLength < 56) return { hasError: true, message: "invalid data" };
    let crLfIndex = 56;
    if (new Uint8Array(buffer.slice(56, 57))[0] !== 0x0d || new Uint8Array(buffer.slice(57, 58))[0] !== 0x0a) return { hasError: true, message: "invalid header format" };
    const password = new TextDecoder().decode(buffer.slice(0, crLfIndex));
    if (password !== sha224Password) return { hasError: true, message: "invalid password" };

    const socks5DataBuffer = buffer.slice(crLfIndex + 2);
    if (socks5DataBuffer.byteLength < 6) return { hasError: true, message: "invalid S5 request data" };

    const view = new DataView(socks5DataBuffer);
    const cmd = view.getUint8(0);
    if (cmd !== 1) return { hasError: true, message: "unsupported command, only TCP is allowed" };

    const atype = view.getUint8(1);
    let addressLength = 0;
    let addressIndex = 2;
    let address = "";
    switch (atype) {
        case 1: // IPv4
            addressLength = 4;
            address = new Uint8Array(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength)).join(".");
            break;
        case 3: // Domain
            addressLength = new Uint8Array(socks5DataBuffer.slice(addressIndex, addressIndex + 1))[0];
            addressIndex += 1;
            address = new TextDecoder().decode(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength));
            break;
        case 4: // IPv6
            addressLength = 16;
            const dataView = new DataView(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength));
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(dataView.getUint16(i * 2).toString(16));
            }
            address = ipv6.join(":");
            break;
        default:
            return { hasError: true, message: `invalid addressType is ${atype}` };
    }

    if (!address) {
        return { hasError: true, message: `address is empty, addressType is ${atype}` };
    }

    const portIndex = addressIndex + addressLength;
    const portBuffer = socks5DataBuffer.slice(portIndex, portIndex + 2);
    const portRemote = new DataView(portBuffer).getUint16(0);

    return {
        hasError: false,
        addressType: atype,
        port: portRemote,
        hostname: address,
        rawClientData: socks5DataBuffer.slice(portIndex + 4)
    };
}

function parseVlessReq(chunk, token) {
    if (chunk.byteLength < 24) return { hasError: true, message: 'Invalid data' };
    const version = new Uint8Array(chunk.slice(0, 1));
    if (formatIdentifier(new Uint8Array(chunk.slice(1, 17))) !== token) return { hasError: true, message: 'Invalid uuid' };
    const optLen = new Uint8Array(chunk.slice(17, 18))[0];
    const cmd = new Uint8Array(chunk.slice(18 + optLen, 19 + optLen))[0];
    let isUDP = false;
    if (cmd === 1) { } else if (cmd === 2) { isUDP = true; } else { return { hasError: true, message: 'Invalid command' }; }
    const portIdx = 19 + optLen;
    const port = new DataView(chunk.slice(portIdx, portIdx + 2)).getUint16(0);
    let addrIdx = portIdx + 2, addrLen = 0, addrValIdx = addrIdx + 1, hostname = '';
    const addressType = new Uint8Array(chunk.slice(addrIdx, addrValIdx))[0];
    switch (addressType) {
        case 1:
            addrLen = 4;
            hostname = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + addrLen)).join('.');
            break;
        case 2:
            addrLen = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + 1))[0];
            addrValIdx += 1;
            hostname = new TextDecoder().decode(chunk.slice(addrValIdx, addrValIdx + addrLen));
            break;
        case 3:
            addrLen = 16;
            const ipv6 = [];
            const ipv6View = new DataView(chunk.slice(addrValIdx, addrValIdx + addrLen));
            for (let i = 0; i < 8; i++) ipv6.push(ipv6View.getUint16(i * 2).toString(16));
            hostname = ipv6.join(':');
            break;
        default:
            return { hasError: true, message: `Invalid address type: ${addressType}` };
    }
    if (!hostname) return { hasError: true, message: `Invalid address: ${addressType}` };
    return { hasError: false, addressType, port, hostname, isUDP, rawIndex: addrValIdx + addrLen, version };
}
async function forwardataTCP(host, portNum, rawData, ws, respHeader, remoteConnWrapper, yourUUID, twoProxy = null) {
    console.log(`[TCPforward] target: ${host}:${portNum} | proxyIP: ${proxyIP} | twoProxy: ${twoProxy ? twoProxy.hostname + ':' + twoProxy.port : 'no'} | proxyType: ${enableSOCKS5Proxy || 'proxyip'}`);

    async function connectDirect(address, port, data, allreverseProxyarr = null, reverseProxyfallback = true) {
        let remoteSock;
        if (allreverseProxyarr && allreverseProxyarr.length > 0) {
            for (let i = 0; i < allreverseProxyarr.length; i++) {
                const reverseProxyarrIndex = (cachedProxyIndex + i) % allreverseProxyarr.length;
                const [reverseProxyaddr, reverseProxyport] = allreverseProxyarr[reverseProxyarrIndex];
                try {
                    console.log(`[proxyConn] connectingTo: ${reverseProxyaddr}:${reverseProxyport} (idx: ${reverseProxyarrIndex})`);
                    remoteSock = connect({ hostname: reverseProxyaddr, port: reverseProxyport });

                    await Promise.race([
                        remoteSock.opened,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('connTimeout')), 1000))
                    ]);
                    const testWriter = remoteSock.writable.getWriter();
                    await testWriter.write(data);
                    testWriter.releaseLock();
                    console.log(`[proxyConn] connectedTo: ${reverseProxyaddr}:${reverseProxyport}`);
                    cachedProxyIndex = reverseProxyarrIndex;
                    return remoteSock;
                } catch (err) {
                    console.log(`[proxyConn] connFailed: ${reverseProxyaddr}:${reverseProxyport}, err: ${err.message}`);
                    try { remoteSock?.close?.(); } catch (e) { }
                    continue;
                }
            }
        }

        if (reverseProxyfallback) {
            remoteSock = connect({ hostname: address, port: port });
            const writer = remoteSock.writable.getWriter();
            await writer.write(data);
            writer.releaseLock();
            return remoteSock;
        } else {
            closeSocketQuietly(ws);
            throw new Error('[proxyConn] allProxyFailed，andNotenableProxyFallback，connTerminated。');
        }
    }

    async function connecttoPry() {
        let newSocket;
        if (enableSOCKS5Proxy === 'socks5') {
            console.log(`[SOCKS5proxy] proxyTo: ${host}:${portNum}`);
            newSocket = await socks5Connect(host, portNum, rawData);
        } else if (enableSOCKS5Proxy === 'http' || enableSOCKS5Proxy === 'https') {
            console.log(`[HTTPproxy] proxyTo: ${host}:${portNum}`);
            newSocket = await httpConnect(host, portNum, rawData);
        } else {
            console.log(`[proxyConn] proxyTo: ${host}:${portNum}`);
            const allreverseProxyarr = await parseAddrPort(proxyIP, host, yourUUID);
            newSocket = await connectDirect(atob('UFJPWFlJUC50cDEuMDkwMjI3Lnh5eg=='), 1, rawData, allreverseProxyarr, enableProxyFallback);
        }
        remoteConnWrapper.socket = newSocket;
        newSocket.closed.catch(() => { }).finally(() => closeSocketQuietly(ws));
        connectStreams(newSocket, ws, respHeader, null);
    }


    async function connectViaTwoProxy() {
        if (!twoProxy) throw new Error('twoProxyNotConfigured');
        console.log(`[twoProxy] via ${twoProxy.hostname}:${twoProxy.port} connTo ${host}:${portNum}`);
        
        const socket = connect({ hostname: twoProxy.hostname, port: twoProxy.port });
        const writer = socket.writable.getWriter();
        const reader = socket.readable.getReader();
        
        try {

            const auth = twoProxy.username && twoProxy.password 
                ? `Proxy-Authorization: Basic ${btoa(`${twoProxy.username}:${twoProxy.password}`)}\r\n` 
                : '';
            const connectRequest = `CONNECT ${host}:${portNum} HTTP/1.1\r\nHost: ${host}:${portNum}\r\n${auth}User-Agent: Mozilla/5.0\r\nConnection: keep-alive\r\n\r\n`;
            
            await writer.write(new TextEncoder().encode(connectRequest));
            

            let responseBuffer = new Uint8Array(0);
            let headerEndIndex = -1;
            let bytesRead = 0;
            
            while (headerEndIndex === -1 && bytesRead < 8192) {
                const { done, value } = await reader.read();
                if (done) throw new Error('proxyClosed');
                responseBuffer = new Uint8Array([...responseBuffer, ...value]);
                bytesRead = responseBuffer.length;
                

                for (let i = 0; i < responseBuffer.length - 3; i++) {
                    if (responseBuffer[i] === 0x0d && responseBuffer[i + 1] === 0x0a && 
                        responseBuffer[i + 2] === 0x0d && responseBuffer[i + 3] === 0x0a) {
                        headerEndIndex = i + 4;
                        break;
                    }
                }
            }
            
            if (headerEndIndex === -1) throw new Error('invalidProxyResp');
            
            const responseText = new TextDecoder().decode(responseBuffer.slice(0, headerEndIndex));
            const statusMatch = responseText.match(/HTTP\/\d\.\d\s+(\d+)/);
            const statusCode = statusMatch ? parseInt(statusMatch[1]) : 0;
            
            if (statusCode < 200 || statusCode >= 300) {
                throw new Error(`proxyConnFailed: HTTP ${statusCode}`);
            }
            
            console.log(`[twoProxy] tunnelEstablished: ${host}:${portNum}`);
            

            await writer.write(rawData);
            writer.releaseLock();
            reader.releaseLock();
            
            return socket;
        } catch (error) {
            try { writer.releaseLock(); } catch (e) { }
            try { reader.releaseLock(); } catch (e) { }
            try { socket.close(); } catch (e) { }
            throw error;
        }
    }

    const verifysocks5Whitelist = (addr) => socks5Whitelist.some(p => new RegExp(`^${p.replace(/\*/g, '.*')}$`, 'i').test(addr));
    

    if (twoProxy) {
        console.log(`[TCPforward] usingTwoProxy`);
        try {
            const proxySocket = await connectViaTwoProxy();
            remoteConnWrapper.socket = proxySocket;
            proxySocket.closed.catch(() => { }).finally(() => closeSocketQuietly(ws));
            connectStreams(proxySocket, ws, respHeader, null);
        } catch (err) {
            console.log(`[twoProxy] connFailed: ${err.message}, fallbackToDefault`);

            try {
                await connecttoPry();
            } catch (err2) {
                throw err2;
            }
        }
    } else if (enableSOCKS5Proxy && (enableGlobalSOCKS5 || verifysocks5Whitelist(host))) {
        console.log(`[TCPforward] enableGlobalProxy`);
        try {
            await connecttoPry();
        } catch (err) {
            throw err;
        }
    } else {
        try {
            console.log(`[TCPforward] directConnTo: ${host}:${portNum}`);
            const initialSocket = await connectDirect(host, portNum, rawData);
            remoteConnWrapper.socket = initialSocket;
            connectStreams(initialSocket, ws, respHeader, connecttoPry);
        } catch (err) {
            await connecttoPry();
        }
    }
}

async function forwardataudp(udpChunk, webSocket, respHeader) {
    try {
        const tcpSocket = connect({ hostname: '8.8.4.4', port: 53 });
        let vlessHeader = respHeader;
        const writer = tcpSocket.writable.getWriter();
        await writer.write(udpChunk);
        writer.releaseLock();
        await tcpSocket.readable.pipeTo(new WritableStream({
            async write(chunk) {
                if (webSocket.readyState === WebSocket.OPEN) {
                    if (vlessHeader) {
                        const response = new Uint8Array(vlessHeader.length + chunk.byteLength);
                        response.set(vlessHeader, 0);
                        response.set(chunk, vlessHeader.length);
                        webSocket.send(response.buffer);
                        vlessHeader = null;
                    } else {
                        webSocket.send(chunk);
                    }
                }
            },
        }));
    } catch (error) {
        // console.error('UDP forward error:', error);
    }
}

function closeSocketQuietly(socket) {
    try {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSING) {
            socket.close();
        }
    } catch (error) { }
}

function formatIdentifier(arr, offset = 0) {
    const hex = [...arr.slice(offset, offset + 16)].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
}
async function connectStreams(remoteSocket, webSocket, headerData, retryFunc) {
    let header = headerData, hasData = false;
    await remoteSocket.readable.pipeTo(
        new WritableStream({
            async write(chunk, controller) {
                hasData = true;
                if (webSocket.readyState !== WebSocket.OPEN) controller.error('ws.readyState is not open');
                if (header) {
                    const response = new Uint8Array(header.length + chunk.byteLength);
                    response.set(header, 0);
                    response.set(chunk, header.length);
                    webSocket.send(response.buffer);
                    header = null;
                } else {
                    webSocket.send(chunk);
                }
            },
            abort() { },
        })
    ).catch((err) => {
        closeSocketQuietly(webSocket);
    });
    if (!hasData && retryFunc) {
        await retryFunc();
    }
}

function makeReadableStr(socket, earlyDataHeader) {
    let cancelled = false;
    return new ReadableStream({
        start(controller) {
            socket.addEventListener('message', (event) => {
                if (!cancelled) controller.enqueue(event.data);
            });
            socket.addEventListener('close', () => {
                if (!cancelled) {
                    closeSocketQuietly(socket);
                    controller.close();
                }
            });
            socket.addEventListener('error', (err) => controller.error(err));
            const { earlyData, error } = base64ToArray(earlyDataHeader);
            if (error) controller.error(error);
            else if (earlyData) controller.enqueue(earlyData);
        },
        cancel() {
            cancelled = true;
            closeSocketQuietly(socket);
        }
    });
}

function isSpeedTestSite(hostname) {
    const speedTestDomains = [atob('c3BlZWQuY2xvdWRmbGFyZS5jb20=')];
    if (speedTestDomains.includes(hostname)) {
        return true;
    }

    for (const domain of speedTestDomains) {
        if (hostname.endsWith('.' + domain) || hostname === domain) {
            return true;
        }
    }
    return false;
}

function base64ToArray(b64Str) {
    if (!b64Str) return { error: null };
    try {
        const binaryString = atob(b64Str.replace(/-/g, '+').replace(/_/g, '/'));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return { earlyData: bytes.buffer, error: null };
            } catch (error) {
        return { error };
    }
}

async function socks5Connect(targetHost, targetPort, initialData) {
    const { username, password, hostname, port } = parsedSocks5Address;
    const socket = connect({ hostname, port }), writer = socket.writable.getWriter(), reader = socket.readable.getReader();
    try {
        const authMethods = username && password ? new Uint8Array([0x05, 0x02, 0x00, 0x02]) : new Uint8Array([0x05, 0x01, 0x00]);
        await writer.write(authMethods);
        let response = await reader.read();
        if (response.done || response.value.byteLength < 2) throw new Error('S5 method selection failed');

        const selectedMethod = new Uint8Array(response.value)[1];
        if (selectedMethod === 0x02) {
            if (!username || !password) throw new Error('S5 requires authentication');
            const userBytes = new TextEncoder().encode(username), passBytes = new TextEncoder().encode(password);
            const authPacket = new Uint8Array([0x01, userBytes.length, ...userBytes, passBytes.length, ...passBytes]);
            await writer.write(authPacket);
            response = await reader.read();
            if (response.done || new Uint8Array(response.value)[1] !== 0x00) throw new Error('S5 authentication failed');
        } else if (selectedMethod !== 0x00) throw new Error(`S5 unsupported auth method: ${selectedMethod}`);

        const hostBytes = new TextEncoder().encode(targetHost);
        const connectPacket = new Uint8Array([0x05, 0x01, 0x00, 0x03, hostBytes.length, ...hostBytes, targetPort >> 8, targetPort & 0xff]);
        await writer.write(connectPacket);
        response = await reader.read();
        if (response.done || new Uint8Array(response.value)[1] !== 0x00) throw new Error('S5 connection failed');

        await writer.write(initialData);
        writer.releaseLock(); reader.releaseLock();
        return socket;
    } catch (error) {
        try { writer.releaseLock(); } catch (e) { }
        try { reader.releaseLock(); } catch (e) { }
        try { socket.close(); } catch (e) { }
        throw error;
    }
}

async function httpConnect(targetHost, targetPort, initialData) {
    const { username, password, hostname, port } = parsedSocks5Address;
    const socket = connect({ hostname, port }), writer = socket.writable.getWriter(), reader = socket.readable.getReader();
    try {
        const auth = username && password ? `Proxy-Authorization: Basic ${btoa(`${username}:${password}`)}\r\n` : '';
        const request = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\nHost: ${targetHost}:${targetPort}\r\n${auth}User-Agent: Mozilla/5.0\r\nConnection: keep-alive\r\n\r\n`;
        await writer.write(new TextEncoder().encode(request));

        let responseBuffer = new Uint8Array(0), headerEndIndex = -1, bytesRead = 0;
        while (headerEndIndex === -1 && bytesRead < 8192) {
            const { done, value } = await reader.read();
            if (done) throw new Error('Connection closed before receiving HTTP response');
            responseBuffer = new Uint8Array([...responseBuffer, ...value]);
            bytesRead = responseBuffer.length;
            const crlfcrlf = responseBuffer.findIndex((_, i) => i < responseBuffer.length - 3 && responseBuffer[i] === 0x0d && responseBuffer[i + 1] === 0x0a && responseBuffer[i + 2] === 0x0d && responseBuffer[i + 3] === 0x0a);
            if (crlfcrlf !== -1) headerEndIndex = crlfcrlf + 4;
        }

        if (headerEndIndex === -1) throw new Error('Invalid HTTP response');
        const statusCode = parseInt(new TextDecoder().decode(responseBuffer.slice(0, headerEndIndex)).split('\r\n')[0].match(/HTTP\/\d\.\d\s+(\d+)/)[1]);
        if (statusCode < 200 || statusCode >= 300) throw new Error(`Connection failed: HTTP ${statusCode}`);

        await writer.write(initialData);
        writer.releaseLock(); reader.releaseLock();
        return socket;
    } catch (error) {
        try { writer.releaseLock(); } catch (e) { }
        try { reader.releaseLock(); } catch (e) { }
        try { socket.close(); } catch (e) { }
        throw error;
    }
}

function ClashsubConfigHotfix(Clash_rawsubContent, uuid = null, ECHenable = false, HOSTS = []) {
    let clash_yaml = Clash_rawsubContent.replace(/mode:\s*Rule\b/g, 'mode: rule');


    const baseDnsBlock = `dns:
  enable: true
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
    - 114.114.114.114
  use-hosts: true
  nameserver:
    - https://sm2.doh.pub/dns-query
    - https://dns.alidns.com/dns-query
  fallback:
    - 8.8.4.4
    - 101.101.101.101
    - 208.67.220.220
  fallback-filter:
    geoip: true
    domain: [+.google.com, +.facebook.com, +.youtube.com]
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32
    geoip-code: CN
`;


    const hasDns = /^dns:\s*(?:\n|$)/m.test(clash_yaml);


    if (!hasDns) {
        clash_yaml = baseDnsBlock + clash_yaml;
    }


    if (ECHenable && HOSTS.length > 0) {

        const hostsEntries = HOSTS.map(host => `    "${host}":\n      - tls://8.8.8.8\n      - https://doh.cmliussss.com/CMLiussss\n      - ${ECH_DOH}`).join('\n');


        const hasNameserverPolicy = /^\s{2}nameserver-policy:\s*(?:\n|$)/m.test(clash_yaml);

        if (hasNameserverPolicy) {

            clash_yaml = clash_yaml.replace(
                /^(\s{2}nameserver-policy:\s*\n)/m,
                `$1${hostsEntries}\n`
            );
        } else {

            const lines = clash_yaml.split('\n');
            let dnsBlockEndIndex = -1;
            let inDnsBlock = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (/^dns:\s*$/.test(line)) {
                    inDnsBlock = true;
                    continue;
                }
                if (inDnsBlock) {

                    if (/^[a-zA-Z]/.test(line)) {
                        dnsBlockEndIndex = i;
                        break;
                    }
                }
            }


            const nameserverPolicyBlock = `  nameserver-policy:\n${hostsEntries}`;
            if (dnsBlockEndIndex !== -1) {
                lines.splice(dnsBlockEndIndex, 0, nameserverPolicyBlock);
            } else {

                lines.push(nameserverPolicyBlock);
            }
            clash_yaml = lines.join('\n');
        }
    }


    if (!uuid || !ECHenable) return clash_yaml;


    const lines = clash_yaml.split('\n');
    const processedLines = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();


        if (trimmedLine.startsWith('- {') && (trimmedLine.includes('uuid:') || trimmedLine.includes('password:'))) {
            let fullNode = line;
            let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;


            while (braceCount > 0 && i + 1 < lines.length) {
                i++;
                fullNode += '\n' + lines[i];
                braceCount += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
            }


            const typeMatch = fullNode.match(/type:\s*(\w+)/);
            const proxyType = typeMatch ? typeMatch[1] : 'vless';


            let credentialField = 'uuid';
            if (proxyType === 'trojan') {
                credentialField = 'password';
            }


            const credentialPattern = new RegExp(`${credentialField}:\\s*([^,}\\n]+)`);
            const credentialMatch = fullNode.match(credentialPattern);

            if (credentialMatch && credentialMatch[1].trim() === uuid.trim()) {

                fullNode = fullNode.replace(/\}(\s*)$/, `, ech-opts: {enable: true}}$1`);
            }

            processedLines.push(fullNode);
            i++;
        }

        else if (trimmedLine.startsWith('- name:')) {

            let nodeLines = [line];
            let baseIndent = line.search(/\S/);
            let topLevelIndent = baseIndent + 2; // topLevelIndent
            i++;


            while (i < lines.length) {
                const nextLine = lines[i];
                const nextTrimmed = nextLine.trim();


                if (!nextTrimmed) {
                    nodeLines.push(nextLine);
                    i++;
                    break;
                }

                const nextIndent = nextLine.search(/\S/);


                if (nextIndent <= baseIndent && nextTrimmed.startsWith('- ')) {
                    break;
                }


                if (nextIndent < baseIndent && nextTrimmed) {
                    break;
                }

                nodeLines.push(nextLine);
                i++;
            }


            const nodeText = nodeLines.join('\n');
            const typeMatch = nodeText.match(/type:\s*(\w+)/);
            const proxyType = typeMatch ? typeMatch[1] : 'vless';


            let credentialField = 'uuid';
            if (proxyType === 'trojan') {
                credentialField = 'password';
            }


            const credentialPattern = new RegExp(`${credentialField}:\\s*([^\\n]+)`);
            const credentialMatch = nodeText.match(credentialPattern);

            if (credentialMatch && credentialMatch[1].trim() === uuid.trim()) {

                let insertIndex = -1;

                for (let j = nodeLines.length - 1; j >= 0; j--) {

                    if (nodeLines[j].trim()) {
                        insertIndex = j;
                        break;
                    }
                }

                if (insertIndex >= 0) {
                    const indent = ' '.repeat(topLevelIndent);

                    nodeLines.splice(insertIndex + 1, 0,
                        `${indent}ech-opts:`,
                        `${indent}  enable: true`
                    );
                }
            }

            processedLines.push(...nodeLines);
        } else {
            processedLines.push(line);
            i++;
        }
    }

    return processedLines.join('\n');
}

function SingboxsubConfigHotfix(sb_json_text, uuid = null, fingerprint = "chrome", ech_config = null) {
    try {
        let config = JSON.parse(sb_json_text);


        if (Array.isArray(config.inbounds)) {
            config.inbounds.forEach(inbound => {
                if (inbound.type === 'tun') {
                    const addresses = [];
                    if (inbound.inet4_address) addresses.push(inbound.inet4_address);
                    if (inbound.inet6_address) addresses.push(inbound.inet6_address);
                    if (addresses.length > 0) {
                        inbound.address = addresses;
                        delete inbound.inet4_address;
                        delete inbound.inet6_address;
                    }

                    const route_addresses = [];
                    if (Array.isArray(inbound.inet4_route_address)) route_addresses.push(...inbound.inet4_route_address);
                    if (Array.isArray(inbound.inet6_route_address)) route_addresses.push(...inbound.inet6_route_address);
                    if (route_addresses.length > 0) {
                        inbound.route_address = route_addresses;
                        delete inbound.inet4_route_address;
                        delete inbound.inet6_route_address;
                    }

                    const route_exclude_addresses = [];
                    if (Array.isArray(inbound.inet4_route_exclude_address)) route_exclude_addresses.push(...inbound.inet4_route_exclude_address);
                    if (Array.isArray(inbound.inet6_route_exclude_address)) route_exclude_addresses.push(...inbound.inet6_route_exclude_address);
                    if (route_exclude_addresses.length > 0) {
                        inbound.route_exclude_address = route_exclude_addresses;
                        delete inbound.inet4_route_exclude_address;
                        delete inbound.inet6_route_exclude_address;
                    }
                }
            });
        }


        const ruleSetsDefinitions = new Map();
        const processRules = (rules, isDns = false) => {
            if (!Array.isArray(rules)) return;
            rules.forEach(rule => {
                if (rule.geosite) {
                    const geositeList = Array.isArray(rule.geosite) ? rule.geosite : [rule.geosite];
                    rule.rule_set = geositeList.map(name => {
                        const tag = `geosite-${name}`;
                        if (!ruleSetsDefinitions.has(tag)) {
                            ruleSetsDefinitions.set(tag, {
                                tag: tag,
                                type: "remote",
                                format: "binary",
                                url: `https://gh.090227.xyz/https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-${name}.srs`,
                                download_detour: "DIRECT"
                            });
                        }
                        return tag;
                    });
                    delete rule.geosite;
                }
                if (rule.geoip) {
                    const geoipList = Array.isArray(rule.geoip) ? rule.geoip : [rule.geoip];
                    rule.rule_set = rule.rule_set || [];
                    geoipList.forEach(name => {
                        const tag = `geoip-${name}`;
                        if (!ruleSetsDefinitions.has(tag)) {
                            ruleSetsDefinitions.set(tag, {
                                tag: tag,
                                type: "remote",
                                format: "binary",
                                url: `https://gh.090227.xyz/https://raw.githubusercontent.com/SagerNet/sing-geoip/rule-set/geoip-${name}.srs`,
                                download_detour: "DIRECT"
                            });
                        }
                        rule.rule_set.push(tag);
                    });
                    delete rule.geoip;
                }
                const targetField = isDns ? 'server' : 'outbound';
                const actionValue = String(rule[targetField]).toUpperCase();
                if (actionValue === 'REJECT' || actionValue === 'BLOCK') {
                    rule.action = 'reject';
                    rule.method = 'drop'; // forceModern
                    delete rule[targetField];
                }
            });
        };

        if (config.dns && config.dns.rules) processRules(config.dns.rules, true);
        if (config.route && config.route.rules) processRules(config.route.rules, false);

        if (ruleSetsDefinitions.size > 0) {
            if (!config.route) config.route = {};
            config.route.rule_set = Array.from(ruleSetsDefinitions.values());
        }


        if (!config.outbounds) config.outbounds = [];


        config.outbounds = config.outbounds.filter(o => {
            if (o.tag === 'REJECT' || o.tag === 'block') {
                return false; // remove，becauseChanged action: reject 
            }
            return true;
        });

        const existingOutboundTags = new Set(config.outbounds.map(o => o.tag));

        if (!existingOutboundTags.has('DIRECT')) {
            config.outbounds.push({ "type": "direct", "tag": "DIRECT" });
            existingOutboundTags.add('DIRECT');
        }

        if (config.dns && config.dns.servers) {
            const dnsServerTags = new Set(config.dns.servers.map(s => s.tag));
            if (config.dns.rules) {
                config.dns.rules.forEach(rule => {
                    if (rule.server && !dnsServerTags.has(rule.server)) {
                        if (rule.server === 'dns_block' && dnsServerTags.has('block')) {
                            rule.server = 'block';
                        } else if (rule.server.toLowerCase().includes('block') && !dnsServerTags.has(rule.server)) {
                            config.dns.servers.push({ "tag": rule.server, "address": "rcode://success" });
                            dnsServerTags.add(rule.server);
                        }
                    }
                });
            }
        }

        config.outbounds.forEach(outbound => {
            if (outbound.type === 'selector' || outbound.type === 'urltest') {
                if (Array.isArray(outbound.outbounds)) {

                    outbound.outbounds = outbound.outbounds.filter(tag => {
                        const upperTag = tag.toUpperCase();
                        return existingOutboundTags.has(tag) && upperTag !== 'REJECT' && upperTag !== 'BLOCK';
                    });
                    if (outbound.outbounds.length === 0) outbound.outbounds.push("DIRECT");
                }
            }
        });


        if (uuid) {
            config.outbounds.forEach(outbound => {

                if ((outbound.uuid && outbound.uuid === uuid) || (outbound.password && outbound.password === uuid)) {

                    if (!outbound.tls) {
                        outbound.tls = { enabled: true };
                    }


                    if (fingerprint) {
                        outbound.tls.utls = {
                            enabled: true,
                            fingerprint: fingerprint
                        };
                    }


                    if (ech_config) {
                        outbound.tls.ech = {
                            enabled: true,
                            config: `-----BEGIN ECH CONFIGS-----\n${ech_config}\n-----END ECH CONFIGS-----`
                        };
                    }
                }
            });
        }

        return JSON.stringify(config, null, 2);
    } catch (e) {
        console.error("singboxPatchFailed:", e);
        return JSON.stringify(JSON.parse(sb_json_text), null, 2);
    }
}

function SurgesubConfigHotfix(content, url, config_JSON) {
    const eachLine = content.includes('\r\n') ? content.split('\r\n') : content.split('\n');

    let output = "";
    const realSurgePath = config_JSON.enable0RTT ? config_JSON.PATH + '?ed=2560' : config_JSON.PATH;
    for (let x of eachLine) {
        if (x.includes('= tro' + 'jan,') && !x.includes('ws=true') && !x.includes('ws-path=')) {
            const host = x.split("sni=")[1].split(",")[0];
            const backup = `sni=${host}, skip-cert-verify=${config_JSON.skipCertVerify}`;
            const correct = `sni=${host}, skip-cert-verify=${config_JSON.skipCertVerify}, ws=true, ws-path=${realSurgePath}, ws-headers=Host:"${host}"`;
            output += x.replace(new RegExp(backup, 'g'), correct).replace("[", "").replace("]", "") + '\n';
        } else {
            output += x + '\n';
        }
    }

    output = `#!MANAGED-CONFIG ${url} interval=${config_JSON.subGenerator.SUBUpdateTime * 60 * 60} strict=false` + output.substring(output.indexOf('\n'));
    return output;
}

async function requestLogRecord(env, request, clientIP, requesttype = "Get_SUB", config_JSON) {
    const KVcapLimit = 4;//MB
    try {
        const currtime = new Date();
        const logContent = { TYPE: requesttype, IP: clientIP, ASN: `AS${request.cf.asn || '0'} ${request.cf.asOrganization || 'Unknown'}`, CC: `${request.cf.country || 'N/A'} ${request.cf.city || 'N/A'}`, URL: request.url, UA: request.headers.get('User-Agent') || 'Unknown', TIME: currtime.getTime() };
        let logArr = [];
        const existLog = await env.KV.get('log.json');
        if (existLog) {
            try {
                logArr = JSON.parse(existLog);
                if (!Array.isArray(logArr)) { logArr = [logContent]; }
                else if (requesttype !== "Get_SUB") {
                    const thirtyMinAgotimestamp = currtime.getTime() - 30 * 60 * 1000;
                    if (logArr.some(log => log.TYPE !== "Get_SUB" && log.IP === clientIP && log.URL === request.url && log.UA === (request.headers.get('User-Agent') || 'Unknown') && log.TIME >= thirtyMinAgotimestamp)) return;
                    logArr.push(logContent);
                    while (JSON.stringify(logArr, null, 2).length > KVcapLimit * 1024 * 1024 && logArr.length > 0) logArr.shift();
                } else {
                    logArr.push(logContent);
                    while (JSON.stringify(logArr, null, 2).length > KVcapLimit * 1024 * 1024 && logArr.length > 0) logArr.shift();
                }
                if (config_JSON.TG.enable) {
                    try {
                        const TG_TXT = await env.KV.get('tg.json');
                        const TG_JSON = JSON.parse(TG_TXT);
                        await sendMessage(TG_JSON.BotToken, TG_JSON.ChatID, logContent, config_JSON);
                    } catch (error) { console.error(`readtg.jsonerror: ${error.message}`) }
                }
            } catch (e) { logArr = [logContent]; }
        } else { logArr = [logContent]; }
        await env.KV.put('log.json', JSON.stringify(logArr, null, 2));
    } catch (error) { console.error(`logFailed: ${error.message}`); }
}

async function sendMessage(BotToken, ChatID, logContent, config_JSON) {
    if (!BotToken || !ChatID) return;

    try {
        const requesttime = new Date(logContent.TIME).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const requestURL = new URL(logContent.URL);
        const msg = `<b>#${config_JSON.subGenerator.SUBNAME} logNotify</b>\n\n` +
            `📌 <b>type：</b>#${logContent.TYPE}\n` +
            `🌐 <b>IP：</b><code>${logContent.IP}</code>\n` +
            `📍 <b>location：</b>${logContent.CC}\n` +
            `🏢 <b>ASN：</b>${logContent.ASN}\n` +
            `🔗 <b>domain：</b><code>${requestURL.host}</code>\n` +
            `🔍 <b>path：</b><code>${requestURL.pathname + requestURL.search}</code>\n` +
            `🤖 <b>UA：</b><code>${logContent.UA}</code>\n` +
            `📅 <b>time：</b>${requesttime}\n` +
            `${config_JSON.CF.Usage.success ? `📊 <b>requestUsage：</b>${config_JSON.CF.Usage.total}/100000 <b>${((config_JSON.CF.Usage.total / 100000) * 100).toFixed(2)}%</b>\n` : ''}`;

        const url = `https://api.telegram.org/bot${BotToken}/sendMessage?chat_id=${ChatID}&parse_mode=HTML&text=${encodeURIComponent(msg)}`;
        return fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;',
                'Accept-Encoding': 'gzip, deflate, br',
                'User-Agent': logContent.UA || 'Unknown',
            }
        });
    } catch (error) { console.error('Error sending message:', error) }
}

function maskSensitive(txt, prefixLen = 3, suffixLen = 2) {
    if (!txt || typeof txt !== 'string') return txt;
    if (txt.length <= prefixLen + suffixLen) return txt; // likeifTooShort，directReturn

    const prefix = txt.slice(0, prefixLen);
    const suffix = txt.slice(-suffixLen);
    const starCount = txt.length - prefixLen - suffixLen;

    return `${prefix}${'*'.repeat(starCount)}${suffix}`;
}

async function MD5MD5(txt) {
    const encoder = new TextEncoder();

    const hash1 = await crypto.subtle.digest('MD5', encoder.encode(txt));
    const hash1Arr = Array.from(new Uint8Array(hash1));
    const hex1 = hash1Arr.map(byte => byte.toString(16).padStart(2, '0')).join('');

    const hash2 = await crypto.subtle.digest('MD5', encoder.encode(hex1.slice(7, 27)));
    const hash2Arr = Array.from(new Uint8Array(hash2));
    const hex2 = hash2Arr.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hex2.toLowerCase();
}

function randomPath() {
    const commonpathdir = ["about", "account", "acg", "act", "activity", "ad", "ads", "ajax", "album", "albums", "anime", "api", "app", "apps", "archive", "archives", "article", "articles", "ask", "auth", "avatar", "bbs", "bd", "blog", "blogs", "book", "books", "bt", "buy", "cart", "category", "categories", "cb", "channel", "channels", "chat", "china", "city", "class", "classify", "clip", "clips", "club", "cn", "code", "collect", "collection", "comic", "comics", "community", "company", "config", "contact", "content", "course", "courses", "cp", "data", "detail", "details", "dh", "directory", "discount", "discuss", "dl", "dload", "doc", "docs", "document", "documents", "doujin", "download", "downloads", "drama", "edu", "en", "ep", "episode", "episodes", "event", "events", "f", "faq", "favorite", "favourites", "favs", "feedback", "file", "files", "film", "films", "forum", "forums", "friend", "friends", "game", "games", "gif", "go", "go.html", "go.php", "group", "groups", "help", "home", "hot", "htm", "html", "image", "images", "img", "index", "info", "intro", "item", "items", "ja", "jp", "jump", "jump.html", "jump.php", "jumping", "knowledge", "lang", "lesson", "lessons", "lib", "library", "link", "links", "list", "live", "lives", "m", "mag", "magnet", "mall", "manhua", "map", "member", "members", "message", "messages", "mobile", "movie", "movies", "music", "my", "new", "news", "note", "novel", "novels", "online", "order", "out", "out.html", "out.php", "outbound", "p", "page", "pages", "pay", "payment", "pdf", "photo", "photos", "pic", "pics", "picture", "pictures", "play", "player", "playlist", "post", "posts", "product", "products", "program", "programs", "project", "qa", "question", "rank", "ranking", "read", "readme", "redirect", "redirect.html", "redirect.php", "reg", "register", "res", "resource", "retrieve", "sale", "search", "season", "seasons", "section", "seller", "series", "service", "services", "setting", "settings", "share", "shop", "show", "shows", "site", "soft", "sort", "source", "special", "star", "stars", "static", "stock", "store", "stream", "streaming", "streams", "student", "study", "tag", "tags", "task", "teacher", "team", "tech", "temp", "test", "thread", "tool", "tools", "topic", "topics", "torrent", "trade", "travel", "tv", "txt", "type", "u", "upload", "uploads", "url", "urls", "user", "users", "v", "version", "video", "videos", "view", "vip", "vod", "watch", "web", "wenku", "wiki", "work", "www", "zh", "zh-cn", "zh-tw", "zip"];
    const randNum = Math.floor(Math.random() * 3 + 1);
    const randomPath = commonpathdir.sort(() => 0.5 - Math.random()).slice(0, randNum).join('/');
    return `/${randomPath}`;
}

function randReplaceWildcard(h) {
    if (!h?.includes('*')) return h;
    const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return h.replace(/\*/g, () => {
        let s = '';
        for (let i = 0; i < Math.floor(Math.random() * 14) + 3; i++)
            s += charset[Math.floor(Math.random() * 36)];
        return s;
    });
}

function batchReplacedomain(content, hosts, groupCnt = 2) {
    const shuffledArr = [...hosts].sort(() => Math.random() - 0.5);
    let count = 0, currentRandomHost = null;
    return content.replace(/example\.com/g, () => {
        if (count % groupCnt === 0) currentRandomHost = randReplaceWildcard(shuffledArr[Math.floor(count / groupCnt) % shuffledArr.length]);
        count++;
        return currentRandomHost;
    });
}

async function getECH(host) {
    try {
        const res = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(host)}&type=65`, { headers: { 'accept': 'application/dns-json' } });
        const data = await res.json();
        if (!data.Answer?.length) return '';
        for (let ans of data.Answer) {
            if (ans.type !== 65 || !ans.data) continue;
            const match = ans.data.match(/ech=([^\s]+)/);
            if (match) return match[1].replace(/"/g, '');
            if (ans.data.startsWith('\\#')) {
                const hex = ans.data.split(' ').slice(2).join('');
                const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
                let offset = 2;
                while (offset < bytes.length && bytes[offset++] !== 0)
                    offset += bytes[offset - 1];

                while (offset + 4 <= bytes.length) {
                    const key = (bytes[offset] << 8) | bytes[offset + 1];
                    const len = (bytes[offset + 2] << 8) | bytes[offset + 3];
                    offset += 4;

                    if (key === 5) return btoa(String.fromCharCode(...bytes.slice(offset, offset + len)));
                    offset += len;
                }
            }
        }
        return '';
    } catch {
        return '';
    }
}

async function readconfig_JSON(env, hostname, userID, path, resetCfg = false) {

    const host = hostname;
    const initStarttime = performance.now();
    const defCfgJSON = {
        TIME: new Date().toISOString(),
        HOST: host,
        HOSTS: [hostname],
        UUID: userID,
        protocolType: "v" + "le" + "ss",
        transport: "ws",
        skipCertVerify: true,
        enable0RTT: false,
        tlsFragment: null,
        randomPath: false,
        ECH: false,
        Fingerprint: "chrome",
        subGenerator: {
            local: true, // true: basedOnlocaloptimaladdr  false: subGeneratorer
            localIPPool: {
                randomIP: true, // when randomIP istrueeffective，enablerandomIPcnt，nothenUseKVinADD.txt
                randomCount: 16,
                specifiedPort: -1,
            },
            SUB: null,
            SUBNAME: "edge" + "tunnel",
            SUBUpdateTime: 3, // subupdatetime（hour）
            TOKEN: await MD5MD5(hostname + userID),
        },
        subConverterConfig: {
            SUBAPI: "https://SUBAPI.cmliussss.net",
            SUBCONFIG: "https://raw.githubusercontent.com/cmliu/ACL4SSR/refs/heads/main/Clash/config/ACL4SSR_Online_Mini_MultiMode_CF.ini",
            SUBEMOJI: false,
        },
        reverseProxy: {
            PROXYIP: "auto",
            SOCKS5: {
                enable: enableSOCKS5Proxy,
                globalMode: enableGlobalSOCKS5,
                account: mySOCKS5Account,
                whitelist: socks5Whitelist,
            },
        },
        TG: {
            enable: false,
            BotToken: null,
            ChatID: null,
        },
        CF: {
            Email: null,
            GlobalAPIKey: null,
            AccountID: null,
            APIToken: null,
            UsageAPI: null,
            Usage: {
                success: false,
                pages: 0,
                workers: 0,
                total: 0,
                max: 100000,
            },
        }
    };

    try {
        let configJSON = await env.KV.get('config.json');
        if (!configJSON || resetCfg == true) {
            await env.KV.put('config.json', JSON.stringify(defCfgJSON, null, 2));
            config_JSON = defCfgJSON;
        } else {
            config_JSON = JSON.parse(configJSON);
        }
    } catch (error) {
        console.error(`readconfig_JSONerror: ${error.message}`);
        config_JSON = defCfgJSON;
    }

    config_JSON.HOST = host;
    if (!config_JSON.HOSTS) config_JSON.HOSTS = [hostname];
    if (env.HOST) config_JSON.HOSTS = (await parseToArray(env.HOST)).map(h => h.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0]);
    config_JSON.UUID = userID;
    config_JSON.PATH = path ? (path.startsWith('/') ? path : '/' + path) : (config_JSON.reverseProxy.SOCKS5.enable ? ('/' + config_JSON.reverseProxy.SOCKS5.enable + (config_JSON.reverseProxy.SOCKS5.globalMode ? '://' : '=') + config_JSON.reverseProxy.SOCKS5.account) : (config_JSON.reverseProxy.PROXYIP === 'auto' ? '/' : `/proxyip=${config_JSON.reverseProxy.PROXYIP}`));
    const tlsFragmentparam = config_JSON.tlsFragment == 'Shadowrocket' ? `&fragment=${encodeURIComponent('1,40-60,30-50,tlshello')}` : config_JSON.tlsFragment == 'Happ' ? `&fragment=${encodeURIComponent('3,1,tlshello')}` : '';
    if (!config_JSON.Fingerprint) config_JSON.Fingerprint = "chrome";
    if (!config_JSON.ECH) config_JSON.ECH = false;
    else config_JSON.subGenerator.SUBUpdateTime = 1; // enable ECH forceChangesubupdatetimechangeTo 1 hour
    const ECHLINKparam = config_JSON.ECH ? `&ech=${encodeURIComponent('cloudflare-ech.com+' + ECH_DOH)}` : '';
    config_JSON.LINK = x27cnEnc(`${config_JSON.protocolType}://${userID}@${host}:443?security=tls&type=${config_JSON.transport + ECHLINKparam}&host=${host}&fp=${config_JSON.Fingerprint}&sni=${host}&path=${encodeURIComponent(config_JSON.enable0RTT ? config_JSON.PATH + '?ed=2560' : config_JSON.PATH) + tlsFragmentparam}&encryption=none${config_JSON.skipCertVerify ? '&insecure=1&allowInsecure=1' : ''}#${encodeURIComponent(config_JSON.subGenerator.SUBNAME)}`);
    config_JSON.subGenerator.TOKEN = await MD5MD5(hostname + userID);

    const initTG_JSON = { BotToken: null, ChatID: null };
    config_JSON.TG = { enable: config_JSON.TG.enable ? config_JSON.TG.enable : false, ...initTG_JSON };
    try {
        const TG_TXT = await env.KV.get('tg.json');
        if (!TG_TXT) {
            await env.KV.put('tg.json', JSON.stringify(initTG_JSON, null, 2));
        } else {
            const TG_JSON = JSON.parse(TG_TXT);
            config_JSON.TG.ChatID = TG_JSON.ChatID ? TG_JSON.ChatID : null;
            config_JSON.TG.BotToken = TG_JSON.BotToken ? maskSensitive(TG_JSON.BotToken) : null;
        }
    } catch (error) {
        console.error(`readtg.jsonerror: ${error.message}`);
    }

    const initCF_JSON = { Email: null, GlobalAPIKey: null, AccountID: null, APIToken: null, UsageAPI: null };
    config_JSON.CF = { ...initCF_JSON, Usage: { success: false, pages: 0, workers: 0, total: 0, max: 100000 } };
    try {
        const CF_TXT = await env.KV.get('cf.json');
        if (!CF_TXT) {
            await env.KV.put('cf.json', JSON.stringify(initCF_JSON, null, 2));
        } else {
            const CF_JSON = JSON.parse(CF_TXT);
            if (CF_JSON.UsageAPI) {
                try {
                    const response = await fetch(CF_JSON.UsageAPI);
                    const Usage = await response.json();
                    config_JSON.CF.Usage = Usage;
                } catch (err) {
                    console.error(`request CF_JSON.UsageAPI failed: ${err.message}`);
                }
            } else {
                config_JSON.CF.Email = CF_JSON.Email ? CF_JSON.Email : null;
                config_JSON.CF.GlobalAPIKey = CF_JSON.GlobalAPIKey ? maskSensitive(CF_JSON.GlobalAPIKey) : null;
                config_JSON.CF.AccountID = CF_JSON.AccountID ? maskSensitive(CF_JSON.AccountID) : null;
                config_JSON.CF.APIToken = CF_JSON.APIToken ? maskSensitive(CF_JSON.APIToken) : null;
                config_JSON.CF.UsageAPI = null;
                const Usage = await getCloudflareUsage(CF_JSON.Email, CF_JSON.GlobalAPIKey, CF_JSON.AccountID, CF_JSON.APIToken);
                config_JSON.CF.Usage = Usage;
            }
        }
    } catch (error) {
        console.error(`readcf.jsonerror: ${error.message}`);
    }

    config_JSON.loadtime = (performance.now() - initStarttime).toFixed(2) + 'ms';
    return config_JSON;
}

async function genrandomIP(request, count = 16, specifiedPort = -1) {
    const asnMap = { '9808': 'cmcc', '4837': 'cu', '4134': 'ct' }, asn = request.cf.asn;
    const cidr_url = asnMap[asn] ? `https://raw.githubusercontent.com/cmliu/cmliu/main/CF-CIDR/${asnMap[asn]}.txt` : 'https://raw.githubusercontent.com/cmliu/cmliu/main/CF-CIDR.txt';
    const cfname = { '9808': 'CFCMCCOptimal', '4837': 'CFCUOptimal', '4134': 'CFCTOptimal' }[asn] || 'CFofficialOptimal';
    const cfport = [443, 2053, 2083, 2087, 2096, 8443];
    let cidrList = [];
    try { const res = await fetch(cidr_url); cidrList = res.ok ? await parseToArray(await res.text()) : ['104.16.0.0/13']; } catch { cidrList = ['104.16.0.0/13']; }

    const generateRandomIPFromCIDR = (cidr) => {
        const [baseIP, prefixLength] = cidr.split('/'), prefix = parseInt(prefixLength), hostBits = 32 - prefix;
        const ipInt = baseIP.split('.').reduce((a, p, i) => a | (parseInt(p) << (24 - i * 8)), 0);
        const randomOffset = Math.floor(Math.random() * Math.pow(2, hostBits));
        const mask = (0xFFFFFFFF << hostBits) >>> 0, randomIP = (((ipInt & mask) >>> 0) + randomOffset) >>> 0;
        return [(randomIP >>> 24) & 0xFF, (randomIP >>> 16) & 0xFF, (randomIP >>> 8) & 0xFF, randomIP & 0xFF].join('.');
    };

    const randomIPs = Array.from({ length: count }, () => {
        const ip = generateRandomIPFromCIDR(cidrList[Math.floor(Math.random() * cidrList.length)]);
        return `${ip}:${specifiedPort === -1 ? cfport[Math.floor(Math.random() * cfport.length)] : specifiedPort}#${cfname}`;
    });
    return [randomIPs, randomIPs.join('\n')];
}

async function parseToArray(content) {
    var replaced = content.replace(/[	"'\r\n]+/g, ',').replace(/,+/g, ',');
    if (replaced.charAt(0) == ',') replaced = replaced.slice(1);
    if (replaced.charAt(replaced.length - 1) == ',') replaced = replaced.slice(0, replaced.length - 1);
    const addrArr = replaced.split(',');
    return addrArr;
}

function isValidBase64(str) {
    if (typeof str !== 'string') return false;
    const cleanStr = str.replace(/\s/g, '');
    if (cleanStr.length === 0 || cleanStr.length % 4 !== 0) return false;
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(cleanStr)) return false;
    try {
        atob(cleanStr);
        return true;
    } catch {
        return false;
    }
}

function base64Decode(str) {
    const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
}

async function requestOptimalAPI(urls, defPort = '443', timeouttime = 3000) {
    if (!urls?.length) return [[], [], []];
    const results = new Set();
    let subLinkPlainLINKcontent = '', needSubConvertURLs = [];
    await Promise.allSettled(urls.map(async (url) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeouttime);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            let text = '';
            try {
                const buffer = await response.arrayBuffer();
                const contentType = (response.headers.get('content-type') || '').toLowerCase();
                const charset = contentType.match(/charset=([^\s;]+)/i)?.[1]?.toLowerCase() || '';


                let decoders = ['utf-8', 'gb2312']; // defFirst UTF-8
                if (charset.includes('gb') || charset.includes('gbk') || charset.includes('gb2312')) {
                    decoders = ['gb2312', 'utf-8']; // likeifSpecified GB encoding，tryFirst GB2312
                }


                let decodeSuccess = false;
                for (const decoder of decoders) {
                    try {
                        const decoded = new TextDecoder(decoder).decode(buffer);

                        if (decoded && decoded.length > 0 && !decoded.includes('\ufffd')) {
                            text = decoded;
                            decodeSuccess = true;
                            break;
                        } else if (decoded && decoded.length > 0) {

                            continue;
                        }
                    } catch (e) {

                        continue;
                    }
                }


                if (!decodeSuccess) {
                    text = await response.text();
                }


                if (!text || text.trim().length === 0) {
                    return;
                }
            } catch (e) {
                console.error('Failed to decode response:', e);
                return;
            }


            

            const preSubPlain = isValidBase64(text) ? base64Decode(text) : text;
            if (preSubPlain.split('#')[0].includes('://')) {
                subLinkPlainLINKcontent += preSubPlain + '\n'; // appendLINKplaincontent
                return;
            }

            const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
            const isCSV = lines.length > 1 && lines[0].includes(',');
            const IPV6_PATTERN = /^[^\[\]]*:[^\[\]]*:[^\[\]]/;
            if (!isCSV) {
                lines.forEach(line => {
                    const hashIndex = line.indexOf('#');
                    const [hostPart, remark] = hashIndex > -1 ? [line.substring(0, hashIndex), line.substring(hashIndex)] : [line, ''];
                    let hasPort = false;
                    if (hostPart.startsWith('[')) {
                        hasPort = /\]:(\d+)$/.test(hostPart);
                    } else {
                        const colonIndex = hostPart.lastIndexOf(':');
                        hasPort = colonIndex > -1 && /^\d+$/.test(hostPart.substring(colonIndex + 1));
                    }
                    const port = new URL(url).searchParams.get('port') || defPort;
                    results.add(hasPort ? line : `${hostPart}:${port}${remark}`);
                });
            } else {
                const headers = lines[0].split(',').map(h => h.trim());
                const dataLines = lines.slice(1);
                if (headers.includes('IPaddr') && headers.includes('port') && headers.includes('dataCenter')) {
                    const ipIdx = headers.indexOf('IPaddr'), portIdx = headers.indexOf('port');
                    const remarkIdx = headers.indexOf('country') > -1 ? headers.indexOf('country') :
                        headers.indexOf('city') > -1 ? headers.indexOf('city') : headers.indexOf('dataCenter');
                    const tlsIdx = headers.indexOf('TLS');
                    dataLines.forEach(line => {
                        const cols = line.split(',').map(c => c.trim());
                        if (tlsIdx !== -1 && cols[tlsIdx]?.toLowerCase() !== 'true') return;
                        const wrappedIP = IPV6_PATTERN.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
                        results.add(`${wrappedIP}:${cols[portIdx]}#${cols[remarkIdx]}`);
                    });
                } else if (headers.some(h => h.includes('IP')) && headers.some(h => h.includes('latency')) && headers.some(h => h.includes('dlSpeed'))) {
                    const ipIdx = headers.findIndex(h => h.includes('IP'));
                    const delayIdx = headers.findIndex(h => h.includes('latency'));
                    const speedIdx = headers.findIndex(h => h.includes('dlSpeed'));
                    const port = new URL(url).searchParams.get('port') || defPort;
                    dataLines.forEach(line => {
                        const cols = line.split(',').map(c => c.trim());
                        const wrappedIP = IPV6_PATTERN.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
                        results.add(`${wrappedIP}:${port}#CFOptimal ${cols[delayIdx]}ms ${cols[speedIdx]}MB/s`);
                    });
                }
            }
        } catch (e) { }
    }));

    const LINKarr = subLinkPlainLINKcontent.trim() ? [...new Set(subLinkPlainLINKcontent.split(/\r?\n/).filter(line => line.trim() !== ''))] : [];
    return [Array.from(results), LINKarr, needSubConvertURLs];
}

async function reverseProxyparamget(request) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const pathLower = pathname.toLowerCase();


    mySOCKS5Account = searchParams.get('socks5') || searchParams.get('http') || null;
    enableGlobalSOCKS5 = searchParams.has('globalproxy') || false;


    const proxyMatch = pathLower.match(/\/(proxyip[.=]|pyip=|ip=)(.+)/);
    if (searchParams.has('proxyip')) {
        const pathParamIP = searchParams.get('proxyip');
        proxyIP = pathParamIP.includes(',') ? pathParamIP.split(',')[Math.floor(Math.random() * pathParamIP.split(',').length)] : pathParamIP;
        enableProxyFallback = false;
        return;
    } else if (proxyMatch) {
        const pathParamIP = proxyMatch[1] === 'proxyip.' ? `proxyip.${proxyMatch[2]}` : proxyMatch[2];
        proxyIP = pathParamIP.includes(',') ? pathParamIP.split(',')[Math.floor(Math.random() * pathParamIP.split(',').length)] : pathParamIP;
        enableProxyFallback = false;
        return;
    }


    let socksMatch;
    if ((socksMatch = pathname.match(/\/(socks5?|http):\/?\/?(.+)/i))) {

        enableSOCKS5Proxy = socksMatch[1].toLowerCase() === 'http' ? 'http' : 'socks5';
        mySOCKS5Account = socksMatch[2].split('#')[0];
        enableGlobalSOCKS5 = true;


        if (mySOCKS5Account.includes('@')) {
            const atIndex = mySOCKS5Account.lastIndexOf('@');
            let userPassword = mySOCKS5Account.substring(0, atIndex).replaceAll('%3D', '=');
            if (/^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i.test(userPassword) && !userPassword.includes(':')) {
                userPassword = atob(userPassword);
            }
            mySOCKS5Account = `${userPassword}@${mySOCKS5Account.substring(atIndex + 1)}`;
        }
    } else if ((socksMatch = pathname.match(/\/(g?s5|socks5|g?http)=(.+)/i))) {

        const type = socksMatch[1].toLowerCase();
        mySOCKS5Account = socksMatch[2];
        enableSOCKS5Proxy = type.includes('http') ? 'http' : 'socks5';
        enableGlobalSOCKS5 = type.startsWith('g') || enableGlobalSOCKS5; // gs5 or ghttp startenableglobalMode
    }


    if (mySOCKS5Account) {
        try {
            parsedSocks5Address = await getSOCKS5account(mySOCKS5Account);
            enableSOCKS5Proxy = searchParams.get('http') ? 'http' : enableSOCKS5Proxy;
        } catch (err) {
            console.error('parseSOCKS5addrFailed:', err.message);
            enableSOCKS5Proxy = null;
        }
    } else enableSOCKS5Proxy = null;
}

async function getSOCKS5account(address) {
    if (address.includes('@')) {
        const lastAtIndex = address.lastIndexOf('@');
        let userPassword = address.substring(0, lastAtIndex).replaceAll('%3D', '=');
        const base64Regex = /^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i;
        if (base64Regex.test(userPassword) && !userPassword.includes(':')) userPassword = atob(userPassword);
        address = `${userPassword}@${address.substring(lastAtIndex + 1)}`;
    }
    const atIndex = address.lastIndexOf("@");
    const [hostPart, authPart] = atIndex === -1 ? [address, undefined] : [address.substring(atIndex + 1), address.substring(0, atIndex)];


    let username, password;
    if (authPart) {
        [username, password] = authPart.split(":");
        if (!password) throw new Error('invalid SOCKS addrFormat：authMustBe "username:password" format');
    }


    let hostname, port;
    if (hostPart.includes("]:")) { // IPv6withport
        [hostname, port] = [hostPart.split("]:")[0] + "]", Number(hostPart.split("]:")[1].replace(/[^\d]/g, ''))];
    } else if (hostPart.startsWith("[")) { // IPv6noneport
        [hostname, port] = [hostPart, 80];
    } else { // IPv4/domain
        const parts = hostPart.split(":");
        [hostname, port] = parts.length === 2 ? [parts[0], Number(parts[1].replace(/[^\d]/g, ''))] : [hostPart, 80];
    }

    if (isNaN(port)) throw new Error('invalid SOCKS addrFormat：portMustBeNumber');
    if (hostname.includes(":") && !/^\[.*\]$/.test(hostname)) throw new Error('invalid SOCKS addrFormat：IPv6 addrMustBeBracketed，like [2001:db8::1]');

    return { username, password, hostname, port };
}

async function getCloudflareUsage(Email, GlobalAPIKey, AccountID, APIToken) {
    const API = "https://api.cloudflare.com/client/v4";
    const sum = (a) => a?.reduce((t, i) => t + (i?.sum?.requests || 0), 0) || 0;
    const cfg = { "Content-Type": "application/json" };

    try {
        if (!AccountID && (!Email || !GlobalAPIKey)) return { success: false, pages: 0, workers: 0, total: 0, max: 100000 };

        if (!AccountID) {
            const r = await fetch(`${API}/accounts`, {
                method: "GET",
                headers: { ...cfg, "X-AUTH-EMAIL": Email, "X-AUTH-KEY": GlobalAPIKey }
            });
            if (!r.ok) throw new Error(`accountGetFailed: ${r.status}`);
            const d = await r.json();
            if (!d?.result?.length) throw new Error("accountNotFound");
            const idx = d.result.findIndex(a => a.name?.toLowerCase().startsWith(Email.toLowerCase()));
            AccountID = d.result[idx >= 0 ? idx : 0]?.id;
        }

        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        const hdr = APIToken ? { ...cfg, "Authorization": `Bearer ${APIToken}` } : { ...cfg, "X-AUTH-EMAIL": Email, "X-AUTH-KEY": GlobalAPIKey };

        const res = await fetch(`${API}/graphql`, {
            method: "POST",
            headers: hdr,
            body: JSON.stringify({
                query: `query getBillingMetrics($AccountID: String!, $filter: AccountWorkersInvocationsAdaptiveFilter_InputObject) {
                    viewer { accounts(filter: {accountTag: $AccountID}) {
                        pagesFunctionsInvocationsAdaptiveGroups(limit: 1000, filter: $filter) { sum { requests } }
                        workersInvocationsAdaptive(limit: 10000, filter: $filter) { sum { requests } }
                    } }
                }`,
                variables: { AccountID, filter: { datetime_geq: now.toISOString(), datetime_leq: new Date().toISOString() } }
            })
        });

        if (!res.ok) throw new Error(`queryFailed: ${res.status}`);
        const result = await res.json();
        if (result.errors?.length) throw new Error(result.errors[0].message);

        const acc = result?.data?.viewer?.accounts?.[0];
        if (!acc) throw new Error("accountDataNotFound");

        const pages = sum(acc.pagesFunctionsInvocationsAdaptiveGroups);
        const workers = sum(acc.workersInvocationsAdaptive);
        const total = pages + workers;
        const max = 100000;
        console.log(`statResult - Pages: ${pages}, Workers: ${workers}, totalCnt: ${total}, limit: 100000`);
        return { success: true, pages, workers, total, max };

    } catch (error) {
        console.error('getUsageError:', error.message);
        return { success: false, pages: 0, workers: 0, total: 0, max: 100000 };
    }
}

function sha224(s) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const r = (n, b) => ((n >>> b) | (n << (32 - b))) >>> 0;
    s = unescape(encodeURIComponent(s));
    const l = s.length * 8; s += String.fromCharCode(0x80);
    while ((s.length * 8) % 512 !== 448) s += String.fromCharCode(0);
    const h = [0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4];
    const hi = Math.floor(l / 0x100000000), lo = l & 0xFFFFFFFF;
    s += String.fromCharCode((hi >>> 24) & 0xFF, (hi >>> 16) & 0xFF, (hi >>> 8) & 0xFF, hi & 0xFF, (lo >>> 24) & 0xFF, (lo >>> 16) & 0xFF, (lo >>> 8) & 0xFF, lo & 0xFF);
    const w = []; for (let i = 0; i < s.length; i += 4)w.push((s.charCodeAt(i) << 24) | (s.charCodeAt(i + 1) << 16) | (s.charCodeAt(i + 2) << 8) | s.charCodeAt(i + 3));
    for (let i = 0; i < w.length; i += 16) {
        const x = new Array(64).fill(0);
        for (let j = 0; j < 16; j++)x[j] = w[i + j];
        for (let j = 16; j < 64; j++) {
            const s0 = r(x[j - 15], 7) ^ r(x[j - 15], 18) ^ (x[j - 15] >>> 3);
            const s1 = r(x[j - 2], 17) ^ r(x[j - 2], 19) ^ (x[j - 2] >>> 10);
            x[j] = (x[j - 16] + s0 + x[j - 7] + s1) >>> 0;
        }
        let [a, b, c, d, e, f, g, h0] = h;
        for (let j = 0; j < 64; j++) {
            const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25), ch = (e & f) ^ (~e & g), t1 = (h0 + S1 + ch + K[j] + x[j]) >>> 0;
            const S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22), maj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + maj) >>> 0;
            h0 = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        for (let j = 0; j < 8; j++)h[j] = (h[j] + (j === 0 ? a : j === 1 ? b : j === 2 ? c : j === 3 ? d : j === 4 ? e : j === 5 ? f : j === 6 ? g : h0)) >>> 0;
    }
    let hex = '';
    for (let i = 0; i < 7; i++) {
        for (let j = 24; j >= 0; j -= 8)hex += ((h[i] >>> j) & 0xFF).toString(16).padStart(2, '0');
    }
    return hex;
}

async function parseAddrPort(proxyIP, targetdomain = 'dash.cloudflare.com', UUID = '00000000-0000-4000-8000-000000000000') {
    if (!cachedProxyIP || !cachedProxyArray || cachedProxyIP !== proxyIP) {
        proxyIP = proxyIP.toLowerCase();
        async function DoHquery(domain, recordtype) {
            try {
                const response = await fetch(`https://1.1.1.1/dns-query?name=${domain}&type=${recordtype}`, {
                    headers: { 'Accept': 'application/dns-json' }
                });
                if (!response.ok) return [];
                const data = await response.json();
                return data.Answer || [];
            } catch (error) {
                console.error(`dohQueryFailed (${recordtype}):`, error);
                return [];
            }
        }

        function parseAddrPortStr(str) {
            let addr = str, port = 443;
            if (str.includes(']:')) {
                const parts = str.split(']:');
                addr = parts[0] + ']';
                port = parseInt(parts[1], 10) || port;
            } else if (str.includes(':') && !str.startsWith('[')) {
                const colonIndex = str.lastIndexOf(':');
                addr = str.slice(0, colonIndex);
                port = parseInt(str.slice(colonIndex + 1), 10) || port;
            }
            return [addr, port];
        }

        let allreverseProxyarr = [];

        if (proxyIP.includes('.william')) {
            try {
                const txtRecords = await DoHquery(proxyIP, 'TXT');
                const txtData = txtRecords.filter(r => r.type === 16).map(r => r.data);
                if (txtData.length > 0) {
                    let data = txtData[0];
                    if (data.startsWith('"') && data.endsWith('"')) data = data.slice(1, -1);
                    const prefixes = data.replace(/\\010/g, ',').replace(/\n/g, ',').split(',').map(s => s.trim()).filter(Boolean);
                    allreverseProxyarr = prefixes.map(prefix => parseAddrPortStr(prefix));
                }
            } catch (error) {
                console.error('parseWilliamFailed:', error);
            }
        } else {
            let [addr, port] = parseAddrPortStr(proxyIP);

            if (proxyIP.includes('.tp')) {
                const tpMatch = proxyIP.match(/\.tp(\d+)/);
                if (tpMatch) port = parseInt(tpMatch[1], 10);
            }


            const ipv4Regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
            const ipv6Regex = /^\[?([a-fA-F0-9:]+)\]?$/;

            if (!ipv4Regex.test(addr) && !ipv6Regex.test(addr)) {

                const [aRecords, aaaaRecords] = await Promise.all([
                    DoHquery(addr, 'A'),
                    DoHquery(addr, 'AAAA')
                ]);

                const ipv4List = aRecords.filter(r => r.type === 1).map(r => r.data);
                const ipv6List = aaaaRecords.filter(r => r.type === 28).map(r => `[${r.data}]`);
                const ipAddresses = [...ipv4List, ...ipv6List];

                allreverseProxyarr = ipAddresses.length > 0
                    ? ipAddresses.map(ip => [ip, port])
                    : [[addr, port]];
            } else {
                allreverseProxyarr = [[addr, port]];
            }
        }
        const sortedArr = allreverseProxyarr.sort((a, b) => a[0].localeCompare(b[0]));
        const targetRootdomain = targetdomain.includes('.') ? targetdomain.split('.').slice(-2).join('.') : targetdomain;
        let randSeed = [...(targetRootdomain + UUID)].reduce((a, c) => a + c.charCodeAt(0), 0);
        console.log(`[proxyParse] randSeed: ${randSeed}\ntargetSite: ${targetRootdomain}`)
        const shuffled = [...sortedArr].sort(() => (randSeed = (randSeed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5);
        cachedProxyArray = shuffled.slice(0, 8);
        console.log(`[proxyParse] parseComplete total: ${cachedProxyArray.length}\n${cachedProxyArray.map(([ip, port], index) => `${index + 1}. ${ip}:${port}`).join('\n')}`);
        cachedProxyIP = proxyIP;
    } else console.log(`[proxyParse] readCache total: ${cachedProxyArray.length}\n${cachedProxyArray.map(([ip, port], index) => `${index + 1}. ${ip}:${port}`).join('\n')}`);
    return cachedProxyArray;
}

async function SOCKS5availabilityCheck(proxyProto = 'socks5', proxyparam) {
    const startTime = Date.now();
    try { parsedSocks5Address = await getSOCKS5account(proxyparam); } catch (err) { return { success: false, error: err.message, proxy: proxyProto + "://" + proxyparam, responseTime: Date.now() - startTime }; }
    const { username, password, hostname, port } = parsedSocks5Address;
    const fullProxyparam = username && password ? `${username}:${password}@${hostname}:${port}` : `${hostname}:${port}`;
    try {
        const initialData = new Uint8Array(0);
        const tcpSocket = proxyProto == 'socks5' ? await socks5Connect('check.socks5.090227.xyz', 80, initialData) : await httpConnect('check.socks5.090227.xyz', 80, initialData);
        if (!tcpSocket) return { success: false, error: 'cannotConnectToProxy', proxy: proxyProto + "://" + fullProxyparam, responseTime: Date.now() - startTime };
        try {
            const writer = tcpSocket.writable.getWriter(), encoder = new TextEncoder();
            await writer.write(encoder.encode(`GET /cdn-cgi/trace HTTP/1.1\r\nHost: check.socks5.090227.xyz\r\nConnection: close\r\n\r\n`));
            writer.releaseLock();
            const reader = tcpSocket.readable.getReader(), decoder = new TextDecoder();
            let response = '';
            try { while (true) { const { done, value } = await reader.read(); if (done) break; response += decoder.decode(value, { stream: true }); } } finally { reader.releaseLock(); }
            await tcpSocket.close();
            return { success: true, proxy: proxyProto + "://" + fullProxyparam, ip: response.match(/ip=(.*)/)[1], loc: response.match(/loc=(.*)/)[1], responseTime: Date.now() - startTime };
        } catch (error) {
            try { await tcpSocket.close(); } catch (e) { console.log('errorClosingConn:', e); }
            return { success: false, error: error.message, proxy: proxyProto + "://" + fullProxyparam, responseTime: Date.now() - startTime };
        }
    } catch (error) { return { success: false, error: error.message, proxy: proxyProto + "://" + fullProxyparam, responseTime: Date.now() - startTime }; }
}

async function nginx() {
    return `
	<!DOCTYPE html>
	<html>
	<head>
	<title>Welcome to nginx!</title>
	<style>
		body {
			width: 35em;
			margin: 0 auto;
			font-family: Tahoma, Verdana, Arial, sans-serif;
        }
    </style>
</head>
<body>
	<h1>Welcome to nginx!</h1>
	<p>If you see this page, the nginx web server is successfully installed and
	working. Further configuration is required.</p>
	
	<p>For online documentation and support please refer to
	<a href="http://nginx.org/">nginx.org</a>.<br/>
	Commercial support is available at
	<a href="http://nginx.com/">nginx.com</a>.</p>
	
	<p><em>Thank you for using nginx.</em></p>
	</body>
	</html>
	`
}

async function html1101(host, clientIP) {
    const now = new Date();
    const formattimestamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    const randStr = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');

    return `<!DOCTYPE html>
<!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US"> <![endif]-->
<!--[if IE 7]>    <html class="no-js ie7 oldie" lang="en-US"> <![endif]-->
<!--[if IE 8]>    <html class="no-js ie8 oldie" lang="en-US"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js" lang="en-US"> <!--<![endif]-->
<head>
<title>Worker threw exception | ${host} | Cloudflare</title>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta http-equiv="X-UA-Compatible" content="IE=Edge" />
<meta name="robots" content="noindex, nofollow" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="stylesheet" id="cf_styles-css" href="/cdn-cgi/styles/cf.errors.css" />
<!--[if lt IE 9]><link rel="stylesheet" id='cf_styles-ie-css' href="/cdn-cgi/styles/cf.errors.ie.css" /><![endif]-->
<style>body{margin:0;padding:0}</style>


<!--[if gte IE 10]><!-->
<script>
  if (!navigator.cookieEnabled) {
    window.addEventListener('DOMContentLoaded', function () {
      var cookieEl = document.getElementById('cookie-alert');
      cookieEl.style.display = 'block';
    })
  }
</script>
<!--<![endif]-->

</head>
<body>
    <div id="cf-wrapper">
        <div class="cf-alert cf-alert-error cf-cookie-error" id="cookie-alert" data-translate="enable_cookies">Please enable cookies.</div>
        <div id="cf-error-details" class="cf-error-details-wrapper">
            <div class="cf-wrapper cf-header cf-error-overview">
                <h1>
                    <span class="cf-error-type" data-translate="error">Error</span>
                    <span class="cf-error-code">1101</span>
                    <small class="heading-ray-id">Ray ID: ${randStr} &bull; ${formattimestamp} UTC</small>
                </h1>
                <h2 class="cf-subheadline" data-translate="error_desc">Worker threw exception</h2>
            </div><!-- /.header -->
    
            <section></section><!-- spacer -->
    
            <div class="cf-section cf-wrapper">
                <div class="cf-columns two">
                    <div class="cf-column">
                        <h2 data-translate="what_happened">What happened?</h2>
                            <p>You've requested a page on a website (${host}) that is on the <a href="https://www.cloudflare.com/5xx-error-landing?utm_source=error_100x" target="_blank">Cloudflare</a> network. An unknown error occurred while rendering the page.</p>
    </div>
    
                    <div class="cf-column">
                        <h2 data-translate="what_can_i_do">What can I do?</h2>
                            <p><strong>If you are the owner of this website:</strong><br />refer to <a href="https://developers.cloudflare.com/workers/observability/errors/" target="_blank">Workers - Errors and Exceptions</a> and check Workers Logs for ${host}.</p>
                    </div>
                    
                </div>
            </div><!-- /.section -->
    
            <div class="cf-error-footer cf-wrapper w-240 lg:w-full py-10 sm:py-4 sm:px-8 mx-auto text-center sm:text-left border-solid border-0 border-t border-gray-300">
    <p class="text-13">
      <span class="cf-footer-item sm:block sm:mb-1">Cloudflare Ray ID: <strong class="font-semibold"> ${randStr}</strong></span>
      <span class="cf-footer-separator sm:hidden">&bull;</span>
      <span id="cf-footer-item-ip" class="cf-footer-item hidden sm:block sm:mb-1">
        Your IP:
        <button type="button" id="cf-footer-ip-reveal" class="cf-footer-ip-reveal-btn">Click to reveal</button>
        <span class="hidden" id="cf-footer-ip">${clientIP}</span>
        <span class="cf-footer-separator sm:hidden">&bull;</span>
      </span>
      <span class="cf-footer-item sm:block sm:mb-1"><span>Performance &amp; security by</span> <a rel="noopener noreferrer" href="https://www.cloudflare.com/5xx-error-landing" id="brand_link" target="_blank">Cloudflare</a></span>
      
    </p>
    <script>(function(){function d(){var b=a.getElementById("cf-footer-item-ip"),c=a.getElementById("cf-footer-ip-reveal");b&&"classList"in b&&(b.classList.remove("hidden"),c.addEventListener("click",function(){c.classList.add("hidden");a.getElementById("cf-footer-ip").classList.remove("hidden")}))}var a=document;document.addEventListener&&a.addEventListener("DOMContentLoaded",d)})();</script>
  </div><!-- /.error-footer -->

        </div><!-- /#cf-error-details -->
    </div><!-- /#cf-wrapper -->

     <script>
    window._cf_translation = {};
    
    
  </script> 
</body>
</html>`;
}

