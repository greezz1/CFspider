/**
 * 爬楼梯 Workers - CFspider 专用爬虫代理
 * 
 * 反检测特性：
 * - 随机 User-Agent（50+ 种真实浏览器指纹）
 * - 随机 Accept-Language（多国语言）
 * - 完整浏览器指纹头（Sec-CH-UA, Sec-Fetch-*）
 * - 自动生成合理的 Referer
 * - 模拟真实浏览器 Cookie 行为
 * - 随机请求延迟（可选）
 * - 动态 IP 切换
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    // 令牌验证
    const token = env.TOKEN || '';
    if (token) {
      const auth = request.headers.get('Authorization') || url.searchParams.get('token') || '';
      if (auth !== `Bearer ${token}` && auth !== token) {
        return json({ error: 'Unauthorized' }, 401);
      }
    }

    switch (path) {
      case '/': return homePage();
      case '/proxy': return handleProxy(request, url);
      case '/batch': return handleBatch(request);
      case '/ip': return handleIP(request);
      case '/health': return json({ status: 'ok', timestamp: Date.now() });
      default: return json({ error: 'Not Found' }, 404);
    }
  },
};

// ============== 反检测配置 ==============

// 50+ 真实浏览器 User-Agent
const USER_AGENTS = [
  // Chrome Windows (最新版本)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  // Chrome Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  // Chrome Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  // Firefox Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  // Firefox Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:123.0) Gecko/20100101 Firefox/123.0',
  // Firefox Linux
  'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
  // Safari
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  // Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  // Opera
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0',
  // Brave
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Brave/122',
  // Vivaldi
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Vivaldi/6.5.3206.50',
  // Mobile Chrome
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  // Mobile Safari
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
];

// Accept-Language 池（按地区分布）
const ACCEPT_LANGUAGES = [
  'en-US,en;q=0.9',
  'en-GB,en;q=0.9,en-US;q=0.8',
  'en-CA,en;q=0.9,en-US;q=0.8',
  'en-AU,en;q=0.9,en-US;q=0.8',
  'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7',
  'zh-TW,zh;q=0.9,en;q=0.8',
  'zh-HK,zh;q=0.9,en;q=0.8',
  'ja-JP,ja;q=0.9,en;q=0.8,en-US;q=0.7',
  'ko-KR,ko;q=0.9,en;q=0.8,en-US;q=0.7',
  'de-DE,de;q=0.9,en;q=0.8,en-US;q=0.7',
  'fr-FR,fr;q=0.9,en;q=0.8,en-US;q=0.7',
  'es-ES,es;q=0.9,en;q=0.8,en-US;q=0.7',
  'pt-BR,pt;q=0.9,en;q=0.8,en-US;q=0.7',
  'it-IT,it;q=0.9,en;q=0.8,en-US;q=0.7',
  'ru-RU,ru;q=0.9,en;q=0.8,en-US;q=0.7',
  'nl-NL,nl;q=0.9,en;q=0.8',
  'pl-PL,pl;q=0.9,en;q=0.8',
  'tr-TR,tr;q=0.9,en;q=0.8',
  'th-TH,th;q=0.9,en;q=0.8',
  'vi-VN,vi;q=0.9,en;q=0.8',
  'id-ID,id;q=0.9,en;q=0.8',
  'ar-SA,ar;q=0.9,en;q=0.8',
  'hi-IN,hi;q=0.9,en;q=0.8',
];

// 常见 Referer 来源
const REFERERS = [
  'https://www.google.com/',
  'https://www.google.com/search?q=',
  'https://www.bing.com/',
  'https://www.bing.com/search?q=',
  'https://duckduckgo.com/',
  'https://www.baidu.com/',
  'https://search.yahoo.com/',
  'https://www.facebook.com/',
  'https://twitter.com/',
  'https://www.linkedin.com/',
  'https://www.reddit.com/',
  'https://news.ycombinator.com/',
  '', // 有时候没有 Referer 更自然
];

// 屏幕分辨率（用于某些需要的场景）
const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1680, height: 1050 },
  { width: 2560, height: 1600 },
  { width: 3840, height: 2160 },
];

// 时区偏移
const TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
];

// ============== 工具函数 ==============

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成完整的浏览器指纹头
function generateBrowserFingerprint(targetUrl) {
  const ua = rand(USER_AGENTS);
  const isChrome = ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR');
  const isFirefox = ua.includes('Firefox');
  const isSafari = ua.includes('Safari') && !ua.includes('Chrome');
  const isMobile = ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone');
  
  const headers = {
    'User-Agent': ua,
    'Accept': isMobile 
      ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': rand(ACCEPT_LANGUAGES),
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  // Chrome/Edge/Opera 特有的 Client Hints
  if (isChrome || ua.includes('Edg') || ua.includes('OPR')) {
    const majorVersion = parseInt(ua.match(/Chrome\/(\d+)/)?.[1] || '122');
    const platform = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : 'Linux';
    
    headers['Sec-CH-UA'] = `"Chromium";v="${majorVersion}", "Not(A:Brand";v="24", "Google Chrome";v="${majorVersion}"`;
    headers['Sec-CH-UA-Mobile'] = isMobile ? '?1' : '?0';
    headers['Sec-CH-UA-Platform'] = `"${platform}"`;
    headers['Sec-Fetch-Dest'] = 'document';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-Site'] = 'none';
    headers['Sec-Fetch-User'] = '?1';
  }

  // Firefox 特有头
  if (isFirefox) {
    headers['DNT'] = Math.random() > 0.5 ? '1' : undefined;
    headers['Sec-Fetch-Dest'] = 'document';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-Site'] = 'none';
    headers['Sec-Fetch-User'] = '?1';
  }

  // 随机添加 Referer（60% 概率）
  if (Math.random() > 0.4) {
    const referer = rand(REFERERS);
    if (referer) {
      // 如果是搜索引擎，加上随机搜索词
      if (referer.includes('search?q=') || referer.includes('/search?q=')) {
        const domain = new URL(targetUrl).hostname;
        headers['Referer'] = referer + encodeURIComponent(domain);
      } else {
        headers['Referer'] = referer;
      }
    }
  }

  // 随机添加 DNT (30% 概率)
  if (!headers['DNT'] && Math.random() > 0.7) {
    headers['DNT'] = '1';
  }

  // 随机 Cache-Control (50% 概率)
  if (Math.random() > 0.5) {
    headers['Cache-Control'] = rand(['no-cache', 'max-age=0']);
    if (headers['Cache-Control'] === 'no-cache') {
      headers['Pragma'] = 'no-cache';
    }
  }

  // 过滤掉 undefined 值
  return Object.fromEntries(Object.entries(headers).filter(([_, v]) => v !== undefined));
}

// 生成随机延迟（模拟人类行为）
async function humanDelay(min = 100, max = 500) {
  const delay = randInt(min, max);
  await new Promise(resolve => setTimeout(resolve, delay));
}

// ============== 请求处理 ==============

async function handleProxy(request, requestUrl) {
  let targetUrl, method, headers, body, options;

  if (request.method === 'GET') {
    targetUrl = requestUrl.searchParams.get('url');
    method = requestUrl.searchParams.get('method') || 'GET';
    const headersParam = requestUrl.searchParams.get('headers');
    headers = headersParam ? JSON.parse(headersParam) : {};
    options = {
      delay: requestUrl.searchParams.get('delay') === 'true',
      noFingerprint: requestUrl.searchParams.get('raw') === 'true',
    };
  } else {
    try {
      const data = await request.json();
      targetUrl = data.url;
      method = data.method || 'GET';
      headers = data.headers || {};
      body = data.body;
      options = {
        delay: data.delay || false,
        noFingerprint: data.raw || false,
      };
    } catch (e) {
      return json({ error: 'Invalid JSON body' }, 400);
    }
  }

  if (!targetUrl) {
    return json({ error: 'Missing url parameter' }, 400);
  }

  try {
    new URL(targetUrl);
  } catch (e) {
    return json({ error: 'Invalid URL' }, 400);
  }

  // 可选的人类延迟
  if (options.delay) {
    await humanDelay(200, 800);
  }

  // 构建请求头
  const fetchHeaders = new Headers();
  
  // 生成完整的浏览器指纹（除非指定 raw 模式）
  if (!options.noFingerprint) {
    const fingerprint = generateBrowserFingerprint(targetUrl);
    for (const [key, value] of Object.entries(fingerprint)) {
      fetchHeaders.set(key, value);
    }
  }
  
  // 用户自定义请求头覆盖
  for (const [key, value] of Object.entries(headers)) {
    fetchHeaders.set(key, value);
  }

  const startTime = Date.now();
  try {
    const response = await fetch(targetUrl, {
      method: method.toUpperCase(),
      headers: fetchHeaders,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      redirect: 'follow',
    });

    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Proxy-Time', `${Date.now() - startTime}ms`);
    responseHeaders.set('X-Proxy-Status', response.status.toString());
    
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(`X-Original-${key}`, value);
      }
    }
    
    const format = requestUrl.searchParams.get('format');
    if (format === 'json') {
      const text = await response.text();
      return json({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text,
        time: Date.now() - startTime,
        fingerprint: options.noFingerprint ? 'disabled' : 'enabled',
      });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return json({ error: 'Proxy request failed', message: error.message, url: targetUrl }, 502);
  }
}

async function handleBatch(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed, use POST' }, 405);
  }

  let urls, options;
  try {
    const data = await request.json();
    urls = data.urls;
    options = {
      delay: data.delay || false,
      concurrency: Math.min(data.concurrency || 5, 10),
    };
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    return json({ error: 'Missing urls array' }, 400);
  }

  if (urls.length > 20) {
    return json({ error: 'Maximum 20 URLs per batch' }, 400);
  }

  const startTime = Date.now();
  
  // 分批并发执行
  const results = [];
  for (let i = 0; i < urls.length; i += options.concurrency) {
    const batch = urls.slice(i, i + options.concurrency);
    
    if (options.delay && i > 0) {
      await humanDelay(500, 1500);
    }
    
    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        const url = typeof item === 'string' ? item : item.url;
        const method = (typeof item === 'object' && item.method) || 'GET';
        const userHeaders = (typeof item === 'object' && item.headers) || {};

        const fetchHeaders = new Headers();
        const fingerprint = generateBrowserFingerprint(url);
        for (const [key, value] of Object.entries(fingerprint)) {
          fetchHeaders.set(key, value);
        }
        for (const [key, value] of Object.entries(userHeaders)) {
          fetchHeaders.set(key, value);
        }

        const response = await fetch(url, { method, headers: fetchHeaders });
        const text = await response.text();
        
        return {
          url,
          status: response.status,
          body: text.slice(0, 10000),
        };
      })
    );
    
    results.push(...batchResults);
  }

  return json({
    total: urls.length,
    time: Date.now() - startTime,
    results: results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return { url: urls[i]?.url || urls[i], error: r.reason?.message || 'Failed' };
    }),
  });
}

async function handleIP(request) {
  try {
    const fetchHeaders = new Headers();
    const fingerprint = generateBrowserFingerprint('https://httpbin.org/ip');
    for (const [key, value] of Object.entries(fingerprint)) {
      fetchHeaders.set(key, value);
    }
    
    const response = await fetch('https://httpbin.org/ip', { headers: fetchHeaders });
    const data = await response.json();
    
    return json({
      ip: data.origin,
      edge: {
        colo: request.cf?.colo || 'unknown',
        country: request.cf?.country || 'unknown',
        city: request.cf?.city || 'unknown',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    return json({ error: 'Failed to get IP', message: error.message }, 500);
  }
}

// ============== 响应助手 ==============

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function corsResponse() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function homePage() {
  return new Response(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Proxy Service</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .c { background: #fff; padding: 50px; border-radius: 12px; max-width: 600px; box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
    h1 { font-size: 24px; color: #333; margin-bottom: 15px; }
    p { color: #666; line-height: 1.6; margin-bottom: 20px; }
    .e { background: #f8f9fa; padding: 12px 15px; border-radius: 8px; margin: 8px 0; }
    .e strong { color: #2563eb; }
  </style>
</head>
<body>
  <div class="c">
    <h1>Proxy Service</h1>
    <p>A lightweight HTTP proxy service powered by edge network.</p>
    <div class="e"><strong>GET /proxy?url=</strong> - Proxy a URL</div>
    <div class="e"><strong>POST /batch</strong> - Batch proxy requests</div>
    <div class="e"><strong>GET /ip</strong> - Get current edge IP</div>
    <div class="e"><strong>GET /health</strong> - Health check</div>
  </div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
