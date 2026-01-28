import { useStore } from '../store'

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined

// Website risk checking
const riskyPatterns = [
  // Phishing patterns
  { pattern: /login.*\.(?!com|org|net|gov|edu)/i, risk: 'phishing', message: 'Suspicious login page' },
  { pattern: /paypal.*(?!paypal\.com)/i, risk: 'phishing', message: 'Possible PayPal phishing' },
  { pattern: /bank.*(?!\.com|\.org)/i, risk: 'phishing', message: 'Suspicious banking site' },
  // Suspicious TLDs
  { pattern: /\.(tk|ml|ga|cf|gq|xyz|top|loan|work|click)$/i, risk: 'suspicious', message: 'Suspicious domain extension' },
  // Too many subdomains
  { pattern: /(\.[^.]+){5,}/i, risk: 'suspicious', message: 'Unusual URL structure' },
  // IP address URLs
  { pattern: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i, risk: 'suspicious', message: 'IP address URL' },
  // Common scam keywords
  { pattern: /(free-?iphone|win-?prize|lottery|bitcoin-?double)/i, risk: 'scam', message: 'Possible scam site' },
]

const trustedDomains = [
  'google.com', 'bing.com', 'baidu.com', 'github.com', 'microsoft.com',
  'apple.com', 'amazon.com', 'jd.com', 'taobao.com', 'tmall.com',
  'bilibili.com', 'zhihu.com', 'weibo.com', 'qq.com', 'alipay.com',
  'youtube.com', 'twitter.com', 'facebook.com', 'instagram.com',
  'linkedin.com', 'stackoverflow.com', 'reddit.com', 'wikipedia.org'
]

function checkWebsiteRisk(url: string): { isRisky: boolean; riskLevel: string; message: string } {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Check if it's a trusted domain
    for (const trusted of trustedDomains) {
      if (hostname === trusted || hostname.endsWith('.' + trusted)) {
        return { isRisky: false, riskLevel: 'safe', message: '' }
      }
    }
    
    // Check against risky patterns
    for (const { pattern, risk, message } of riskyPatterns) {
      if (pattern.test(url)) {
        return { isRisky: true, riskLevel: risk, message }
      }
    }
    
    // Check for HTTPS
    if (urlObj.protocol !== 'https:' && !hostname.includes('localhost')) {
      return { isRisky: true, riskLevel: 'warning', message: 'Non-HTTPS connection' }
    }
    
    return { isRisky: false, riskLevel: 'unknown', message: '' }
  } catch {
    return { isRisky: false, riskLevel: 'unknown', message: '' }
  }
}

async function showRiskWarning(webview: any, riskLevel: string, message: string) {
  const colors = {
    phishing: { bg: '#dc2626', border: '#b91c1c', icon: '??' },
    scam: { bg: '#dc2626', border: '#b91c1c', icon: '??' },
    suspicious: { bg: '#f59e0b', border: '#d97706', icon: '??' },
    warning: { bg: '#eab308', border: '#ca8a04', icon: '?' }
  }
  
  const color = colors[riskLevel as keyof typeof colors] || colors.warning
  
  await webview.executeJavaScript(`
    (function() {
      // Remove existing warning
      var existing = document.getElementById('cfspider-risk-warning');
      if (existing) existing.remove();
      
      // Create overlay
      var overlay = document.createElement('div');
      overlay.id = 'cfspider-risk-warning';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:2147483647;display:flex;align-items:center;justify-content:center;animation:cfspider-fade-in 0.3s ease;';
      
      // Create modal
      var modal = document.createElement('div');
      modal.style.cssText = 'background:white;border-radius:16px;padding:32px 48px;text-align:center;max-width:500px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border:4px solid ${color.border};animation:cfspider-scale-in 0.3s ease;';
      
      modal.innerHTML = \`
        <div style="font-size:64px;margin-bottom:16px;">${color.icon}</div>
        <h2 style="margin:0 0 12px 0;font-size:28px;color:#1f2937;font-weight:bold;">Security Warning</h2>
        <p style="margin:0 0 8px 0;font-size:18px;color:${color.bg};font-weight:600;">${message}</p>
        <p style="margin:0;font-size:14px;color:#6b7280;">Risk Level: ${riskLevel.toUpperCase()}</p>
        <p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;">This warning will disappear in 3 seconds</p>
      \`;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Add animation styles
      var style = document.createElement('style');
      style.textContent = \`
        @keyframes cfspider-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cfspider-scale-in { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes cfspider-fade-out { from { opacity: 1; } to { opacity: 0; } }
      \`;
      document.head.appendChild(style);
      
      // Auto-dismiss after 3 seconds
      setTimeout(function() {
        overlay.style.animation = 'cfspider-fade-out 0.3s ease forwards';
        setTimeout(function() {
          overlay.remove();
          style.remove();
        }, 300);
      }, 3000);
    })()
  `)
}

export const aiTools = [
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'ONLY for search engine homepage (bing.com, baidu.com, google.com). NEVER use for other websites like jd.com, taobao.com, etc.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'ONLY search engine URL like https://www.bing.com' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'click_element',
      description: 'Click an element using CSS selector',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector' }
        },
        required: ['selector']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'click_text',
      description: 'Click element containing specific text (for clicking search results)',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text content to find and click' }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'input_text',
      description: 'Type text into an input field',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for input field' },
          text: { type: 'string', description: 'Text to type' }
        },
        required: ['selector', 'text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'scroll_page',
      description: 'Scroll the page',
      parameters: {
        type: 'object',
        properties: {
          direction: { type: 'string', enum: ['up', 'down', 'top', 'bottom'], description: 'Scroll direction' }
        },
        required: ['direction']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'wait',
      description: 'Wait for page to load',
      parameters: {
        type: 'object',
        properties: {
          ms: { type: 'number', description: 'Milliseconds to wait, default 1000' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_page_info',
      description: 'Get current page title and URL',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'go_back',
      description: 'Go back to previous page',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'go_forward',
      description: 'Go forward to next page',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'press_enter',
      description: 'Press Enter key to submit search form (use after input_text)',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the input field to press Enter on' }
        },
        required: ['selector']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'click_search_button',
      description: 'Click the search button on the page. Use this after input_text to submit search.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_website_safety',
      description: 'Check if the current website is safe. ALWAYS call this after entering a new website (after click_text to enter a site). Shows warning if risky.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'verify_action',
      description: 'Verify if the previous action was successful. Call this after important actions to check results. Returns details about current page state.',
      parameters: {
        type: 'object',
        properties: {
          expected_result: { 
            type: 'string', 
            description: 'What you expected to happen (e.g., "page should show search results", "input should contain text", "should be on github.com")' 
          }
        },
        required: ['expected_result']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'retry_with_alternative',
      description: 'Try an alternative method when the previous action failed. Use different selectors or approaches.',
      parameters: {
        type: 'object',
        properties: {
          action_type: { 
            type: 'string', 
            enum: ['input', 'click', 'search'],
            description: 'Type of action to retry' 
          },
          target_description: { 
            type: 'string', 
            description: 'Description of what you are trying to do (e.g., "input search text", "click search button")' 
          }
        },
        required: ['action_type', 'target_description']
      }
    }
  },
  // Page analysis tool
  {
    type: 'function',
    function: {
      name: 'analyze_page',
      description: 'Analyze the current page structure, find key elements, understand page purpose. Call this when unsure what to do.',
      parameters: { type: 'object', properties: {} }
    }
  },
  // Information gathering tools
  {
    type: 'function',
    function: {
      name: 'scan_interactive_elements',
      description: 'Scan and list all interactive elements on the page (buttons, links, inputs). Use to discover available actions.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_page_content',
      description: 'Get the main text content of the page. Use to understand what the page is about.',
      parameters: {
        type: 'object',
        properties: {
          max_length: { type: 'number', description: 'Maximum characters to return (default 500)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'find_element',
      description: 'Find an element by description. Use when you dont know the exact selector.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Description of element to find (e.g., "search button", "login link", "submit form")' }
        },
        required: ['description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_element_exists',
      description: 'Check if a specific element exists and is visible on the page.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector to check' }
        },
        required: ['selector']
      }
    }
  }
]

async function executeToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  const webview = document.querySelector('webview') as any
  const store = useStore.getState()

  switch (name) {
    case 'navigate_to': {
      if (!webview) return 'Browser not loaded'
      try {
        let url = args.url as string
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url
        }
        store.setUrl(url)
        webview.src = url
        await new Promise(resolve => setTimeout(resolve, 2000))
        return 'Navigated to: ' + url
      } catch (error) {
        return 'Navigation failed: ' + error
      }
    }

    case 'click_element': {
      if (!webview) return 'Clicked'
      try {
        const selector = (args.selector as string).replace(/'/g, "\\'")
        await webview.executeJavaScript(`
          (function() {
            var oldH = document.getElementById('cfspider-agent-highlight');
            if (oldH) oldH.remove();
            
            var el = document.querySelector('${selector}');
            if (!el) return { success: false };
            
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            var rect = el.getBoundingClientRect();
            var h = document.createElement('div');
            h.id = 'cfspider-agent-highlight';
            h.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:4px solid #3b82f6;background:rgba(59,130,246,0.15);border-radius:6px;box-shadow:0 0 20px rgba(59,130,246,0.5);transition:all 0.3s;';
            h.style.left = (rect.left - 4) + 'px';
            h.style.top = (rect.top - 4) + 'px';
            h.style.width = (rect.width + 8) + 'px';
            h.style.height = (rect.height + 8) + 'px';
            var lbl = document.createElement('div');
            lbl.style.cssText = 'position:absolute;top:-24px;left:0;background:#3b82f6;color:white;padding:2px 8px;border-radius:4px;font-size:12px;white-space:nowrap;';
            lbl.textContent = 'AI clicking';
            h.appendChild(lbl);
            document.body.appendChild(h);
            
            setTimeout(function() {
              el.click();
              setTimeout(function() {
                var hh = document.getElementById('cfspider-agent-highlight');
                if (hh) hh.remove();
              }, 500);
            }, 500);
            
            return { success: true };
          })()
        `)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return 'Clicked'
      } catch (e) {
        return 'Clicked'
      }
    }

    case 'click_text': {
      if (!webview) return 'Error: Cannot access page'
      try {
        const targetText = (args.text as string).replace(/'/g, "\\'")
        
        const result = await webview.executeJavaScript(`
          (function() {
            var targetText = '${targetText}'.toLowerCase();
            console.log('CFSpider: Looking for text:', targetText);
            
            // Build domain patterns from target text
            var domainPatterns = [];
            var textLower = targetText.toLowerCase();
            
            // Common website domain mappings
            var domainMap = {
              'jd': ['jd.com'],
              'taobao': ['taobao.com', 'tmall.com'],
              'tmall': ['tmall.com'],
              'github': ['github.com'],
              'amazon': ['amazon.com', 'amazon.cn'],
              'google': ['google.com'],
              'baidu': ['baidu.com'],
              'bing': ['bing.com'],
              'microsoft': ['microsoft.com'],
              'apple': ['apple.com'],
              'facebook': ['facebook.com'],
              'twitter': ['twitter.com', 'x.com'],
              'youtube': ['youtube.com'],
              'bilibili': ['bilibili.com']
            };
            
            // Find matching domain patterns
            for (var key in domainMap) {
              if (textLower.indexOf(key) !== -1) {
                domainPatterns = domainPatterns.concat(domainMap[key]);
              }
            }
            
            // If no predefined mapping, try to generate domain from text
            if (domainPatterns.length === 0) {
              var cleaned = textLower.replace(/[^a-z0-9]/g, '');
              if (cleaned.length > 0) {
                domainPatterns.push(cleaned + '.com');
                domainPatterns.push(cleaned);
              }
            }
            
            console.log('CFSpider: Domain patterns:', domainPatterns);
            
            // Helper function to score based on displayed URL text (for Bing/Google cite elements)
            function scoreCiteText(citeText, domain) {
              var urlScore = 0;
              citeText = citeText.toLowerCase().trim();
              
              console.log('CFSpider: Scoring cite text:', citeText, 'for domain:', domain);
              
              // Check for user-related subdomains FIRST - heavy penalty
              if (citeText.indexOf('home.' + domain) !== -1 || 
                  citeText.indexOf('home.') !== -1 ||
                  citeText.indexOf('my.' + domain) !== -1 ||
                  citeText.indexOf('my.') !== -1 ||
                  citeText.indexOf('user.') !== -1 ||
                  citeText.indexOf('account.') !== -1 ||
                  citeText.indexOf('login.') !== -1 ||
                  citeText.indexOf('passport.') !== -1 ||
                  citeText.indexOf('member.') !== -1) {
                urlScore -= 1000;  // Very heavy penalty for user pages
                console.log('CFSpider: User subdomain penalty for cite:', citeText);
              }
              // Check for www. or direct domain - highest priority  
              else if (citeText.indexOf('www.' + domain) !== -1 || 
                       citeText.indexOf('https://' + domain) !== -1 ||
                       citeText.indexOf('http://' + domain) !== -1 ||
                       (citeText.indexOf(domain) !== -1 && citeText.indexOf('.') === citeText.indexOf(domain) - 1 === false)) {
                // Check if it's the main domain (www.jd.com or just jd.com, not subdomain.jd.com)
                var domainIndex = citeText.indexOf(domain);
                var beforeDomain = domainIndex > 0 ? citeText.charAt(domainIndex - 1) : '';
                // If character before domain is . and before that is www or nothing special
                if (beforeDomain === '' || beforeDomain === '/' || 
                    citeText.indexOf('www.' + domain) !== -1 ||
                    citeText.indexOf('://' + domain) !== -1) {
                  urlScore += 500;  // Big bonus for main domain
                  console.log('CFSpider: Main domain bonus for cite:', citeText);
                }
              }
              // Mobile versions
              else if (citeText.indexOf('m.' + domain) !== -1 || 
                       citeText.indexOf('mobile.' + domain) !== -1) {
                urlScore += 100;
              }
              
              return urlScore;
            }
            
            // Helper function to score a URL based on subdomain preference (for direct hrefs)
            function scoreUrl(href, domain) {
              var urlScore = 0;
              try {
                var urlObj = new URL(href);
                var hostname = urlObj.hostname.toLowerCase();
                
                // Highest priority: www.domain.com or just domain.com
                if (hostname === 'www.' + domain || hostname === domain) {
                  urlScore += 500;  // Big bonus for main domain
                  console.log('CFSpider: Main domain bonus for:', hostname);
                }
                // Medium priority: mobile versions
                else if (hostname === 'm.' + domain || hostname === 'mobile.' + domain) {
                  urlScore += 100;
                }
                // HEAVILY penalize user-related subdomains
                else if (hostname.indexOf('home.') === 0 || 
                         hostname.indexOf('my.') === 0 || 
                         hostname.indexOf('user.') === 0 ||
                         hostname.indexOf('account.') === 0 ||
                         hostname.indexOf('login.') === 0 ||
                         hostname.indexOf('passport.') === 0 ||
                         hostname.indexOf('member.') === 0) {
                  urlScore -= 1000;  // Very heavy penalty for user pages
                  console.log('CFSpider: User subdomain penalty for:', hostname);
                }
                
                // Bonus for homepage path (/ or empty)
                if (urlObj.pathname === '/' || urlObj.pathname === '') {
                  urlScore += 50;
                }
              } catch(e) {}
              return urlScore;
            }
            
            var candidates = [];
            
            // Strategy 1: Find cite elements showing the real URL (Bing/Google show URL in cite)
            var citeElements = document.querySelectorAll('cite, .b_attribution, .tF2Cxc cite, [class*="url"], [class*="cite"]');
            console.log('CFSpider: Found', citeElements.length, 'cite elements');
            
            for (var i = 0; i < citeElements.length; i++) {
              var cite = citeElements[i];
              var citeText = (cite.textContent || '').toLowerCase();
              
              // Check if this cite shows our target domain
              for (var j = 0; j < domainPatterns.length; j++) {
                if (citeText.indexOf(domainPatterns[j]) !== -1) {
                  console.log('CFSpider: Found matching cite:', citeText);
                  
                  // Find the parent link or nearby link
                  var parentResult = cite.closest('li, .b_algo, .g, [class*="result"]');
                  if (parentResult) {
                    var link = parentResult.querySelector('a[href]');
                    if (link) {
                      var rect = link.getBoundingClientRect();
                      if (rect.width > 0 && rect.height > 0 && rect.top > 50 && rect.top < window.innerHeight) {
                        // Calculate score based on the CITE TEXT (displayed URL), not href
                        // This is critical because Bing uses redirect URLs in href
                        var citeScore = 200 + scoreCiteText(citeText, domainPatterns[j]);
                        // Position bonus - first result gets more
                        if (rect.top < 300) citeScore += 50;
                        else if (rect.top < 400) citeScore += 30;
                        
                        candidates.push({
                          el: link,
                          rect: rect,
                          score: citeScore,
                          href: link.href,
                          text: citeText.slice(0, 50),
                          matchedDomain: true,
                          source: 'cite'
                        });
                        console.log('CFSpider: Cite candidate:', citeText, 'Score:', citeScore);
                      }
                    }
                  }
                }
              }
            }
            
            // Strategy 2: Find links where the visible URL text contains target domain
            var allLinks = document.querySelectorAll('a[href]');
            
            for (var i = 0; i < allLinks.length; i++) {
              var el = allLinks[i];
              var href = (el.href || '').toLowerCase();
              var text = (el.textContent || '').toLowerCase().trim();
              var rect = el.getBoundingClientRect();
              
              // Skip invisible elements
              if (rect.width === 0 || rect.height === 0) continue;
              if (rect.top < 100 || rect.top > window.innerHeight - 50) continue;
              
              var score = 0;
              var matchedDomain = false;
              var matchedDomainPattern = null;
              
              // Check if link text or nearby text shows our target domain
              for (var j = 0; j < domainPatterns.length; j++) {
                var domain = domainPatterns[j];
                
                // Check displayed text for domain
                if (text.indexOf(domain) !== -1) {
                  score += 150;
                  matchedDomain = true;
                  matchedDomainPattern = domain;
                  break;
                }
                // Check href (for direct links)
                if (href.indexOf(domain) !== -1) {
                  score += 100;
                  matchedDomain = true;
                  matchedDomainPattern = domain;
                  break;
                }
              }
              
              // Apply subdomain scoring using helper function
              if (matchedDomain && matchedDomainPattern) {
                score += scoreUrl(el.href, matchedDomainPattern);
              }
              
              // Text contains target keyword
              if (text.indexOf(targetText) !== -1) {
                score += 30;
                if (text.length < 50) score += 15;
                if (text.length < 20) score += 10;
              }
              
              // Is this a search result title (h2/h3)?
              var isTitle = el.querySelector('h2, h3') || el.closest('h2, h3');
              if (isTitle && matchedDomain) {
                score += 50;
              }
              
              // In main search area - first results get bonus
              if (rect.top > 150 && rect.top < 400) {
                score += 20;  // Higher position bonus
              } else if (rect.top >= 400 && rect.top < 600) {
                score += 5;
              }
              
              // HEAVILY penalize non-matching domains (ads, other sites)
              if (!matchedDomain && score > 0) {
                // Check if this is likely an ad or unrelated result
                var allClasses = '';
                var parent = el;
                for (var k = 0; k < 5 && parent; k++) {
                  allClasses += ' ' + (parent.className || '') + ' ' + (parent.id || '');
                  parent = parent.parentElement;
                }
                allClasses = allClasses.toLowerCase();
                
                if (allClasses.indexOf('ad') !== -1 || 
                    allClasses.indexOf('sponsor') !== -1 ||
                    allClasses.indexOf('promo') !== -1 ||
                    href.indexOf('ad') !== -1) {
                  score = 0;  // Completely exclude ads
                }
              }
              
              if (score > 0) {
                candidates.push({ 
                  el: el, 
                  rect: rect, 
                  score: score, 
                  href: el.href,
                  text: text.slice(0, 50),
                  matchedDomain: matchedDomain
                });
              }
            }
            
            // Sort by score, prioritize domain matches
            candidates.sort(function(a, b) {
              if (a.matchedDomain && !b.matchedDomain) return -1;
              if (!a.matchedDomain && b.matchedDomain) return 1;
              return b.score - a.score;
            });
            
            console.log('CFSpider: Found', candidates.length, 'candidates');
            candidates.slice(0, 5).forEach(function(c) {
              console.log('  Score:', c.score, 'Domain:', c.matchedDomain, 'Text:', c.text);
            });
            
            if (candidates.length > 0) {
              var best = candidates[0];
              console.log('CFSpider: Best match:', best.href, 'Score:', best.score);
              return { found: true, x: best.rect.left + best.rect.width / 2, y: best.rect.top + best.rect.height / 2, href: best.href };
            }
            
            return { found: false };
          })()
        `)
        
        if (!result.found) {
          return 'Element not found: ' + args.text
        }
        
        console.log('click_text found:', result.href)
        
        await webview.executeJavaScript(`
          (function() {
            var oldH = document.getElementById('cfspider-agent-highlight');
            if (oldH) oldH.remove();
            
            var el = document.elementFromPoint(${result.x}, ${result.y});
            var originalEl = el;
            // Find parent link element
            while (el && el.tagName !== 'A' && el.parentElement && el.parentElement.tagName !== 'BODY') {
              el = el.parentElement;
            }
            if (!el || el.tagName === 'BODY' || !el.href) el = originalEl;
            
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              var rect = el.getBoundingClientRect();
              var h = document.createElement('div');
              h.id = 'cfspider-agent-highlight';
              h.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:4px solid #3b82f6;background:rgba(59,130,246,0.15);border-radius:6px;box-shadow:0 0 20px rgba(59,130,246,0.5);';
              h.style.left = (rect.left - 4) + 'px';
              h.style.top = (rect.top - 4) + 'px';
              h.style.width = (rect.width + 8) + 'px';
              h.style.height = (rect.height + 8) + 'px';
              document.body.appendChild(h);
              
              var targetHref = '${result.href.replace(/'/g, "\\'")}';
              
              setTimeout(function() {
                // Use the found href
                if (targetHref) {
                  console.log('CFSpider: Navigating to', targetHref);
                  window.location.href = targetHref;
                } else if (el.href) {
                  window.location.href = el.href;
                } else {
                  el.click();
                }
                setTimeout(function() {
                  var hh = document.getElementById('cfspider-agent-highlight');
                  if (hh) hh.remove();
                }, 500);
              }, 800);
            }
          })()
        `)
        
        await new Promise(resolve => setTimeout(resolve, 2500))
        
        // Auto-verify: check if URL or page changed
        try {
          const newState = await webview.executeJavaScript(`
            ({ url: window.location.href, title: document.title })
          `)
          
          const targetText = (args.text as string).toLowerCase()
          const urlChanged = newState.url !== result.href
          const titleContainsTarget = newState.title.toLowerCase().includes(targetText)
          
          if (urlChanged || titleContainsTarget) {
            return `SUCCESS: Clicked "${args.text}" - Now on: ${newState.title} (${newState.url}). Use check_website_safety() to verify site.`
          } else {
            return `CLICKED: "${args.text}" - Page may still be loading. Use verify_action() to confirm navigation.`
          }
        } catch {
          return 'Clicked: ' + args.text
        }
      } catch (e) {
        return `Click failed: ${e}. Try find_element("${args.text}") to discover alternative selectors.`
      }
    }

    case 'input_text': {
      if (!webview) return 'Typed: ' + args.text
      try {
        const selector = args.selector as string
        const text = args.text as string
        
        // Special handling for GitHub - need to click the search button first to open search
        await webview.executeJavaScript(`
          (function() {
            // Check if we're on GitHub
            if (window.location.hostname.includes('github.com')) {
              console.log('CFSpider: GitHub detected, looking for search trigger...');
              // Try to find and click the search button/input to open the search modal
              var searchTriggers = [
                'button[data-target="qbsearch-input.inputButton"]',
                '.header-search-button',
                '.header-search-input',
                '[data-hotkey="s,/"]',
                'button.header-search-button'
              ];
              for (var i = 0; i < searchTriggers.length; i++) {
                var trigger = document.querySelector(searchTriggers[i]);
                if (trigger && trigger.offsetWidth > 0) {
                  console.log('CFSpider: Clicking GitHub search trigger:', trigger);
                  trigger.click();
                  break;
                }
              }
            }
          })()
        `)
        
        // Wait for search modal to open
        await new Promise(resolve => setTimeout(resolve, 500))
        
        await webview.executeJavaScript(`
          (function() {
            // Find the input element with extensive selectors
            var el = document.querySelector('${selector.replace(/'/g, "\\'")}');
            if (!el || el.offsetWidth === 0) {
              var selectors = [
                // GitHub - priority for GitHub search
                '#query-builder-test', 
                'input[data-target="query-builder.input"]',
                'input[name="query-builder-test"]',
                '.QueryBuilder-Input',
                'input.form-control.input-sm.header-search-input',
                
                // Bing
                '#sb_form_q', 'textarea#sb_form_q',
                
                // Baidu
                '#kw',
                
                // JD
                '#key', '#keyword', '.search-text', 'input.search-text',
                'input[name="keyword"]', 'input.input',
                
                // Taobao/Google
                '#q', 'input[name="q"]', 'textarea[name="q"]',
                
                // Generic
                'input[type="search"]',
                '.searchInput', '#searchInput',
                'input[placeholder*="Search"]', 'input[placeholder*="search"]',
                'input[aria-label*="Search"]', 'input[aria-label*="search"]'
              ];
              for (var i = 0; i < selectors.length; i++) {
                var found = document.querySelector(selectors[i]);
                if (found && found.offsetWidth > 0 && (found.tagName === 'INPUT' || found.tagName === 'TEXTAREA')) {
                  el = found;
                  console.log('CFSpider: Found input via selector:', selectors[i]);
                  break;
                }
              }
            }
            if (!el) {
              console.log('CFSpider: No input found');
              return { success: false };
            }
            
            console.log('CFSpider: Found input', el.id, el.className, el.name);
            
            // Remove old highlight
            var oldH = document.getElementById('cfspider-agent-highlight');
            if (oldH) oldH.remove();
            
            // Scroll into view
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add highlight
            var rect = el.getBoundingClientRect();
            var h = document.createElement('div');
            h.id = 'cfspider-agent-highlight';
            h.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:4px solid #10b981;background:rgba(16,185,129,0.15);border-radius:6px;box-shadow:0 0 20px rgba(16,185,129,0.5);';
            h.style.left = (rect.left - 4) + 'px';
            h.style.top = (rect.top - 4) + 'px';
            h.style.width = (rect.width + 8) + 'px';
            h.style.height = (rect.height + 8) + 'px';
            document.body.appendChild(h);
            
            // Click and focus
            el.click();
            el.focus();
            
            // Clear existing value
            el.select();
            el.value = '';
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            
            return { success: true, id: el.id };
          })()
        `)
        
        // Wait a bit after clearing
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Now set the value in a separate call
        await webview.executeJavaScript(`
          (function() {
            var el = document.activeElement;
            if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) {
              var selectors = [
                // GitHub
                '#query-builder-test', 
                'input[data-target="query-builder.input"]',
                '.QueryBuilder-Input',
                
                // Others
                '#sb_form_q', 'textarea#sb_form_q', '#kw',
                '#key', '#keyword', '.search-text', 'input.search-text',
                'input[name="keyword"]', '#q', 'input[name="q"]', 'textarea[name="q"]',
                'input[type="search"]',
                'input[placeholder*="Search"]', 'input[aria-label*="Search"]'
              ];
              for (var i = 0; i < selectors.length; i++) {
                var found = document.querySelector(selectors[i]);
                if (found && found.offsetWidth > 0) { el = found; break; }
              }
            }
            if (!el) return;
            
            el.focus();
            var text = '${text.replace(/'/g, "\\'")}';
            
            // Use native setter for React/Vue compatibility
            try {
              var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
              var nativeSetter = Object.getOwnPropertyDescriptor(proto.prototype, 'value').set;
              nativeSetter.call(el, text);
            } catch(e) {
              el.value = text;
            }
            
            // Fire all necessary events
            el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
            
            console.log('CFSpider: Set value to', el.value);
            
            // Remove highlight after delay
            setTimeout(function() {
              var hh = document.getElementById('cfspider-agent-highlight');
              if (hh) hh.remove();
            }, 1000);
            
            // Return verification data
            return { actualValue: el.value, expectedValue: text };
          })()
        `)
        
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Auto-verify the input
        const inputResult = await webview.executeJavaScript(`
          (function() {
            var inputs = document.querySelectorAll('input, textarea');
            for (var i = 0; i < inputs.length; i++) {
              if (inputs[i].value && inputs[i].value.includes('${text.replace(/'/g, "\\'")}')) {
                return { verified: true, value: inputs[i].value };
              }
            }
            return { verified: false };
          })()
        `)
        
        if (inputResult.verified) {
          return `SUCCESS: Typed "${text}" - Input verified with value "${inputResult.value}"`
        } else {
          return `ATTENTION: Typed "${text}" - Could not verify. Consider using verify_action() or trying a different selector.`
        }
      } catch (e) {
        console.error('input_text error:', e)
        return `WARNING: Attempted to type "${args.text}" but encountered error. Use verify_action() to check.`
      }
    }

    case 'scroll_page': {
      if (!webview) return 'Error: Cannot access page'
      try {
        const direction = args.direction as string
        let script = ''
        switch (direction) {
          case 'up': script = 'window.scrollBy(0, -500)'; break
          case 'down': script = 'window.scrollBy(0, 500)'; break
          case 'top': script = 'window.scrollTo(0, 0)'; break
          case 'bottom': script = 'window.scrollTo(0, document.body.scrollHeight)'; break
        }
        await webview.executeJavaScript(script)
        return 'Scrolled ' + direction
      } catch (e) {
        return 'Scroll failed: ' + e
      }
    }

    case 'wait': {
      const ms = (args.ms as number) || 1000
      await new Promise(resolve => setTimeout(resolve, ms))
      return 'Waited ' + ms + 'ms'
    }

    case 'get_page_info': {
      if (!webview) return 'Error: Cannot access page'
      try {
        const result = await webview.executeJavaScript(`
          ({ title: document.title, url: location.href })
        `)
        return 'Title: ' + result.title + '\nURL: ' + result.url
      } catch (e) {
        return 'Failed: ' + e
      }
    }

    case 'go_back': {
      if (!webview) return 'Error: Cannot access page'
      try {
        if (webview.canGoBack()) {
          webview.goBack()
          await new Promise(resolve => setTimeout(resolve, 300))
          return 'Went back'
        } else {
          return 'Cannot go back'
        }
      } catch (e) {
        return 'Failed: ' + e
      }
    }

    case 'go_forward': {
      if (!webview) return 'Error: Cannot access page'
      try {
        if (webview.canGoForward()) {
          webview.goForward()
          await new Promise(resolve => setTimeout(resolve, 300))
          return 'Went forward'
        } else {
          return 'Cannot go forward'
        }
      } catch (e) {
        return 'Failed: ' + e
      }
    }

    case 'press_enter': {
      if (!webview) return 'Pressed Enter'
      try {
        const selector = (args.selector as string || '').replace(/'/g, "\\'")
        await webview.executeJavaScript(`
          (function() {
            console.log('CFSpider: press_enter called');
            
            // Find input element
            var el = document.querySelector('${selector}');
            if (!el || el.offsetWidth === 0) {
              var selectors = [
                '#sb_form_q', 'textarea#sb_form_q',  // Bing
                '#kw',  // Baidu
                '#key', '#keyword', '.search-text', 'input.search-text',  // JD
                'input[name="keyword"]',
                '#q', 'input[name="q"]', 'textarea[name="q"]',
                'input[type="search"]'
              ];
              for (var i = 0; i < selectors.length; i++) {
                var found = document.querySelector(selectors[i]);
                if (found && found.offsetWidth > 0) { el = found; break; }
              }
            }
            
            if (el) {
              console.log('CFSpider: Found element for Enter', el.id, el.className);
              el.focus();
              
              // Dispatch Enter key events
              var opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
              el.dispatchEvent(new KeyboardEvent('keydown', opts));
              el.dispatchEvent(new KeyboardEvent('keypress', opts));
              el.dispatchEvent(new KeyboardEvent('keyup', opts));
            }
            
            // Try to find and click search button directly
            var btnSelectors = [
              // Bing
              '#search_icon', '#sb_search', 'input[type="submit"]',
              // Baidu
              '#su', 'input#su',
              // JD - many possible selectors
              '.button', 'button.button', 'a.button',
              '.btn-search', '.search-btn',
              '.form-search-btn', '.search-button',
              '[class*="search"][class*="btn"]',
              '[class*="??"]',
              // Generic
              'button[type="submit"]', 'input[type="submit"]'
            ];
            
            var clicked = false;
            for (var i = 0; i < btnSelectors.length && !clicked; i++) {
              var btns = document.querySelectorAll(btnSelectors[i]);
              for (var j = 0; j < btns.length; j++) {
                var btn = btns[j];
                if (btn && btn.offsetWidth > 0 && btn.offsetHeight > 0) {
                  console.log('CFSpider: Clicking button', btn.className, btn.id);
                  btn.click();
                  clicked = true;
                  break;
                }
              }
            }
            
            // Fallback: try form submit
            if (!clicked && el) {
              var form = el.closest('form');
              if (form) {
                console.log('CFSpider: Submitting form');
                try { form.submit(); } catch(e) {}
              }
            }
          })()
        `)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return 'Pressed Enter'
      } catch (e) {
        console.error('press_enter error:', e)
        return 'Pressed Enter'
      }
    }

    case 'click_search_button': {
      if (!webview) return 'Clicked search button'
      try {
        const result = await webview.executeJavaScript(`
          (function() {
            console.log('CFSpider: Looking for search button...');
            
            // Special handling for GitHub - press Enter in search box
            if (window.location.hostname.includes('github.com')) {
              console.log('CFSpider: GitHub detected, pressing Enter...');
              var searchInput = document.querySelector('#query-builder-test') || 
                               document.querySelector('input[data-target="query-builder.input"]') ||
                               document.querySelector('.QueryBuilder-Input') ||
                               document.activeElement;
              
              if (searchInput && (searchInput.tagName === 'INPUT' || searchInput.tagName === 'TEXTAREA')) {
                searchInput.focus();
                
                // Dispatch Enter key events
                var enterEvent = new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  cancelable: true
                });
                searchInput.dispatchEvent(enterEvent);
                
                // Also try submitting the form
                var form = searchInput.closest('form');
                if (form) {
                  console.log('CFSpider: Submitting GitHub form');
                  form.submit();
                }
                
                return { clicked: true, method: 'github-enter' };
              }
            }
            
            // Comprehensive list of search button selectors
            var btnSelectors = [
              // Bing
              '#search_icon', '#sb_form_go', 'input[type="submit"]#sb_form_go',
              'svg.search', 'button[aria-label*="Search"]', 'button[aria-label*="search"]',
              
              // Baidu
              '#su', 'input#su',
              
              // JD.com - comprehensive
              '.button', 'button.button', 'a.button',
              '.form button', '.search button',
              '[class*="search-btn"]', '[class*="search_btn"]',
              '.search-btn', '.btn-search', 
              '.form-search-btn', '.search-button',
              'button[clstag*="search"]',
              
              // Taobao
              '.btn-search', '.search-button',
              
              // Google
              'input[name="btnK"]', 'button[type="submit"]',
              
              // Generic fallbacks
              'button[type="submit"]', 'input[type="submit"]',
              '.submit', '.search-submit',
              'form button:not([type="reset"])',
              'form input[type="button"]'
            ];
            
            for (var i = 0; i < btnSelectors.length; i++) {
              var btns = document.querySelectorAll(btnSelectors[i]);
              for (var j = 0; j < btns.length; j++) {
                var btn = btns[j];
                if (btn && btn.offsetWidth > 0 && btn.offsetHeight > 0) {
                  console.log('CFSpider: Found and clicking button:', btn.tagName, btn.className, btn.id);
                  
                  // Add highlight
                  var rect = btn.getBoundingClientRect();
                  var h = document.createElement('div');
                  h.id = 'cfspider-agent-highlight';
                  h.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:4px solid #f59e0b;background:rgba(245,158,11,0.2);border-radius:6px;';
                  h.style.left = (rect.left - 4) + 'px';
                  h.style.top = (rect.top - 4) + 'px';
                  h.style.width = (rect.width + 8) + 'px';
                  h.style.height = (rect.height + 8) + 'px';
                  document.body.appendChild(h);
                  
                  // Click it
                  btn.click();
                  
                  setTimeout(function() {
                    var hh = document.getElementById('cfspider-agent-highlight');
                    if (hh) hh.remove();
                  }, 1000);
                  
                  return { clicked: true, selector: btnSelectors[i] };
                }
              }
            }
            
            // Fallback: try pressing Enter on the focused element
            var activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
              console.log('CFSpider: Fallback - pressing Enter on active element');
              var enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
              });
              activeEl.dispatchEvent(enterEvent);
              
              var form = activeEl.closest('form');
              if (form) form.submit();
              
              return { clicked: true, method: 'fallback-enter' };
            }
            
            console.log('CFSpider: No search button found');
            return { clicked: false };
          })()
        `)
        console.log('click_search_button result:', result)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Auto-verify: check if search results appeared
        try {
          const verification = await webview.executeJavaScript(`
            (function() {
              var url = window.location.href;
              var hasResults = document.querySelectorAll('.search-result, .b_algo, .g, [class*="result"], .repo-list, .codesearch-results, #J_goodsList').length > 0;
              var urlChanged = url.includes('search') || url.includes('query') || url.includes('?q=') || url.includes('?s=');
              return { url: url, hasResults: hasResults, urlChanged: urlChanged };
            })()
          `)
          
          if (verification.hasResults || verification.urlChanged) {
            return `SUCCESS: Search submitted - Results appear to be loading. URL: ${verification.url}`
          } else {
            return `CLICKED: Search button clicked. Use verify_action("should show search results") to confirm.`
          }
        } catch {
          return 'Clicked search button'
        }
      } catch (e) {
        console.error('click_search_button error:', e)
        return `Search button click may have failed. Try: 1) press_enter(), 2) find_element("search button"), 3) analyze_page()`
      }
    }

    case 'check_website_safety': {
      if (!webview) return 'Safety check: Unable to check'
      try {
        // Get current URL
        const urlResult = await webview.executeJavaScript('window.location.href')
        const url = urlResult as string
        
        console.log('CFSpider: Checking safety of', url)
        
        // Check for risks
        const riskResult = checkWebsiteRisk(url)
        
        if (riskResult.isRisky) {
          // Show warning modal in the webview
          await showRiskWarning(webview, riskResult.riskLevel, riskResult.message)
          return `WARNING: ${riskResult.message} (Risk: ${riskResult.riskLevel}). URL: ${url}`
        } else {
          // Show safe indicator briefly
          await webview.executeJavaScript(`
            (function() {
              var existing = document.getElementById('cfspider-safe-badge');
              if (existing) existing.remove();
              
              var badge = document.createElement('div');
              badge.id = 'cfspider-safe-badge';
              badge.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;z-index:2147483647;box-shadow:0 4px 12px rgba(16,185,129,0.4);display:flex;align-items:center;gap:8px;animation:cfspider-slide-in 0.3s ease;';
              badge.innerHTML = '<span style="font-size:18px;">?</span> Website appears safe';
              document.body.appendChild(badge);
              
              var style = document.createElement('style');
              style.id = 'cfspider-safe-style';
              style.textContent = '@keyframes cfspider-slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
              document.head.appendChild(style);
              
              setTimeout(function() {
                badge.style.animation = 'cfspider-slide-in 0.3s ease reverse forwards';
                setTimeout(function() {
                  badge.remove();
                  style.remove();
                }, 300);
              }, 2000);
            })()
          `)
          return `Safe: Website ${url} appears to be safe.`
        }
      } catch (e) {
        console.error('check_website_safety error:', e)
        return 'Safety check completed'
      }
    }

    case 'verify_action': {
      if (!webview) return 'Verification failed: No webview'
      try {
        const expected = args.expected_result as string
        
        const state = await webview.executeJavaScript(`
          (function() {
            var result = {
              url: window.location.href,
              title: document.title,
              hostname: window.location.hostname,
              pathname: window.location.pathname,
              hasSearchResults: false,
              inputValues: {},
              visibleText: '',
              errorMessages: []
            };
            
            // Check for search results
            var resultIndicators = [
              '.search-results', '.results', '[class*="result"]',
              '.repo-list', '.codesearch-results',  // GitHub
              '#J_goodsList', '.gl-item',  // JD
              '.s-result-list',  // Amazon
              '#b_results', '.b_algo'  // Bing
            ];
            for (var i = 0; i < resultIndicators.length; i++) {
              if (document.querySelector(resultIndicators[i])) {
                result.hasSearchResults = true;
                break;
              }
            }
            
            // Get input values
            var inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
            inputs.forEach(function(input, idx) {
              if (input.value && input.offsetWidth > 0) {
                result.inputValues[input.id || input.name || 'input_' + idx] = input.value;
              }
            });
            
            // Get visible text (first 500 chars of body)
            result.visibleText = (document.body.innerText || '').slice(0, 500);
            
            // Check for error messages
            var errorSelectors = ['.error', '.alert-danger', '.warning', '[class*="error"]', '[class*="404"]'];
            errorSelectors.forEach(function(sel) {
              var errEl = document.querySelector(sel);
              if (errEl && errEl.offsetWidth > 0) {
                result.errorMessages.push(errEl.textContent.slice(0, 100));
              }
            });
            
            return result;
          })()
        `)
        
        // Build verification report
        let report = `VERIFICATION REPORT:\n`
        report += `- Current URL: ${state.url}\n`
        report += `- Page Title: ${state.title}\n`
        report += `- Expected: ${expected}\n`
        report += `- Has Search Results: ${state.hasSearchResults}\n`
        
        if (Object.keys(state.inputValues).length > 0) {
          report += `- Input Values: ${JSON.stringify(state.inputValues)}\n`
        }
        
        if (state.errorMessages.length > 0) {
          report += `- ERRORS FOUND: ${state.errorMessages.join('; ')}\n`
        }
        
        // Determine if action was successful
        const expectedLower = expected.toLowerCase()
        let success = false
        
        if (expectedLower.includes('search result')) {
          success = state.hasSearchResults
        } else if (expectedLower.includes('github')) {
          success = state.hostname.includes('github.com')
        } else if (expectedLower.includes('jd') || expectedLower.includes('jingdong')) {
          success = state.hostname.includes('jd.com')
        } else if (expectedLower.includes('input') || expectedLower.includes('text')) {
          success = Object.values(state.inputValues).some(v => v && (v as string).length > 0)
        } else {
          // Generic check - page loaded without errors
          success = state.errorMessages.length === 0 && state.title.length > 0
        }
        
        report += success ? `\nSTATUS: SUCCESS - Action appears to have worked.` : 
                          `\nSTATUS: FAILED - Action did not achieve expected result. Try alternative method.`
        
        return report
      } catch (e) {
        return `Verification error: ${e}. Try alternative method.`
      }
    }

    case 'retry_with_alternative': {
      if (!webview) return 'Retry failed: No webview'
      try {
        const actionType = args.action_type as string
        const targetDesc = args.target_description as string
        
        let result = ''
        
        if (actionType === 'input') {
          // Try multiple input methods
          result = await webview.executeJavaScript(`
            (function() {
              console.log('CFSpider: Trying alternative input methods...');
              
              // Method 1: Find any visible text input
              var allInputs = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type]), textarea');
              var targetInput = null;
              
              for (var i = 0; i < allInputs.length; i++) {
                var inp = allInputs[i];
                if (inp.offsetWidth > 0 && inp.offsetHeight > 0) {
                  var rect = inp.getBoundingClientRect();
                  if (rect.top > 0 && rect.top < window.innerHeight) {
                    targetInput = inp;
                    console.log('CFSpider: Found alternative input:', inp.id, inp.className);
                    break;
                  }
                }
              }
              
              if (targetInput) {
                // Method 2: Try clicking first
                targetInput.click();
                targetInput.focus();
                
                // Method 3: Try using keyboard simulation
                return { found: true, element: targetInput.id || targetInput.className || targetInput.tagName };
              }
              
              return { found: false };
            })()
          `)
          
          return `Alternative input method: ${JSON.stringify(result)}. ` +
                 `Try using input_text with selector "input[type='text']:visible" or "input[type='search']", ` +
                 `or try clicking on the search area first with click_element.`
        }
        
        if (actionType === 'click') {
          result = await webview.executeJavaScript(`
            (function() {
              console.log('CFSpider: Trying alternative click methods...');
              
              // Find clickable elements
              var clickables = document.querySelectorAll('button, a, [role="button"], [onclick]');
              var visible = [];
              
              clickables.forEach(function(el) {
                if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                  var rect = el.getBoundingClientRect();
                  if (rect.top > 50 && rect.top < window.innerHeight) {
                    visible.push({
                      tag: el.tagName,
                      text: (el.textContent || '').slice(0, 30),
                      className: el.className
                    });
                  }
                }
              });
              
              return { visibleButtons: visible.slice(0, 10) };
            })()
          `)
          
          return `Found clickable elements: ${JSON.stringify(result)}. ` +
                 `Try using click_text with the visible text, or click_element with a specific selector.`
        }
        
        if (actionType === 'search') {
          result = await webview.executeJavaScript(`
            (function() {
              // Try to find search form
              var forms = document.querySelectorAll('form');
              var searchForm = null;
              
              forms.forEach(function(form) {
                if (form.action && form.action.includes('search') || 
                    form.querySelector('input[type="search"]') ||
                    form.id && form.id.includes('search')) {
                  searchForm = form;
                }
              });
              
              if (searchForm) {
                var inputs = searchForm.querySelectorAll('input');
                var buttons = searchForm.querySelectorAll('button, input[type="submit"]');
                return {
                  found: true,
                  formId: searchForm.id,
                  inputCount: inputs.length,
                  buttonCount: buttons.length
                };
              }
              
              return { found: false };
            })()
          `)
          
          return `Search form analysis: ${JSON.stringify(result)}. ` +
                 `Try: 1) Click on search icon first, 2) Use different input selector, 3) Press Enter after typing.`
        }
        
        return `Alternative method suggestion for "${targetDesc}": Try different selectors or approach the element differently.`
      } catch (e) {
        return `Retry error: ${e}`
      }
    }

    // Page analysis tool
    case 'analyze_page': {
      if (!webview) return 'Error: Cannot access page'
      try {
        const analysis = await webview.executeJavaScript(`
          (function() {
            var result = {
              url: window.location.href,
              title: document.title,
              pageType: 'unknown',
              mainElements: {
                searchInputs: [],
                buttons: [],
                links: [],
                forms: []
              },
              pageState: {
                hasSearchResults: false,
                hasLoginForm: false,
                hasError: false,
                isLoading: false
              },
              suggestions: []
            };
            
            // Detect page type
            var url = window.location.href.toLowerCase();
            var title = document.title.toLowerCase();
            
            if (url.includes('search') || url.includes('query') || url.includes('?q=')) {
              result.pageType = 'search_results';
            } else if (url.includes('login') || url.includes('signin') || title.includes('login')) {
              result.pageType = 'login';
            } else if (url.includes('cart') || url.includes('checkout')) {
              result.pageType = 'shopping';
            } else if (document.querySelectorAll('article, .post, .content').length > 0) {
              result.pageType = 'content';
            } else if (url === 'about:blank' || url.includes('bing.com') || url.includes('google.com') || url.includes('baidu.com')) {
              result.pageType = 'search_engine';
            } else {
              result.pageType = 'general';
            }
            
            // Find search inputs
            var inputs = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type]), textarea');
            inputs.forEach(function(inp) {
              if (inp.offsetWidth > 0) {
                result.mainElements.searchInputs.push({
                  selector: inp.id ? '#' + inp.id : (inp.name ? '[name="' + inp.name + '"]' : inp.className),
                  placeholder: inp.placeholder || '',
                  value: inp.value || ''
                });
              }
            });
            
            // Find buttons
            var buttons = document.querySelectorAll('button, input[type="submit"], [role="button"]');
            buttons.forEach(function(btn) {
              if (btn.offsetWidth > 0 && btn.offsetHeight > 0) {
                var rect = btn.getBoundingClientRect();
                if (rect.top > 0 && rect.top < window.innerHeight) {
                  result.mainElements.buttons.push({
                    text: (btn.textContent || btn.value || '').slice(0, 30).trim(),
                    type: btn.type || 'button'
                  });
                }
              }
            });
            
            // Find main links
            var links = document.querySelectorAll('a[href]');
            var linkCount = 0;
            links.forEach(function(link) {
              if (linkCount < 10 && link.offsetWidth > 0 && link.offsetHeight > 0) {
                var rect = link.getBoundingClientRect();
                if (rect.top > 50 && rect.top < window.innerHeight) {
                  var text = (link.textContent || '').slice(0, 40).trim();
                  if (text.length > 2) {
                    result.mainElements.links.push({ text: text, href: link.href.slice(0, 50) });
                    linkCount++;
                  }
                }
              }
            });
            
            // Check page state
            result.pageState.hasSearchResults = document.querySelectorAll('.search-result, .b_algo, .g, [class*="result"]').length > 0;
            result.pageState.hasLoginForm = document.querySelectorAll('input[type="password"]').length > 0;
            result.pageState.hasError = document.querySelectorAll('.error, .alert-danger, [class*="error"]').length > 0;
            result.pageState.isLoading = document.querySelectorAll('.loading, .spinner, [class*="loading"]').length > 0;
            
            // Generate suggestions
            if (result.mainElements.searchInputs.length > 0) {
              result.suggestions.push('Use input_text with selector: ' + result.mainElements.searchInputs[0].selector);
            }
            if (result.pageState.hasSearchResults) {
              result.suggestions.push('Search results are visible. Use click_text to select a result.');
            }
            if (result.pageType === 'search_engine') {
              result.suggestions.push('This is a search engine. Type search query and submit.');
            }
            
            return result;
          })()
        `)
        
        let report = `PAGE ANALYSIS:\n`
        report += `- URL: ${analysis.url}\n`
        report += `- Title: ${analysis.title}\n`
        report += `- Page Type: ${analysis.pageType}\n`
        report += `- Search Inputs: ${analysis.mainElements.searchInputs.length} found\n`
        report += `- Buttons: ${analysis.mainElements.buttons.map((b: any) => b.text).join(', ') || 'none visible'}\n`
        report += `- Top Links: ${analysis.mainElements.links.slice(0, 5).map((l: any) => l.text).join(', ') || 'none'}\n`
        report += `- Has Search Results: ${analysis.pageState.hasSearchResults}\n`
        report += `- Has Login Form: ${analysis.pageState.hasLoginForm}\n`
        
        if (analysis.suggestions.length > 0) {
          report += `\nSUGGESTIONS:\n${analysis.suggestions.map((s: string) => '- ' + s).join('\n')}`
        }
        
        return report
      } catch (e) {
        return `Analysis failed: ${e}`
      }
    }

    // Information gathering tools
    case 'scan_interactive_elements': {
      if (!webview) return 'Error: Cannot access page'
      try {
        const elements = await webview.executeJavaScript(`
          (function() {
            var result = {
              inputs: [],
              buttons: [],
              links: [],
              selects: []
            };
            
            // Inputs
            document.querySelectorAll('input, textarea').forEach(function(el) {
              if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                result.inputs.push({
                  type: el.type || 'text',
                  id: el.id,
                  name: el.name,
                  placeholder: el.placeholder,
                  value: el.value ? 'has value' : 'empty'
                });
              }
            });
            
            // Buttons
            document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]').forEach(function(el) {
              if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                result.buttons.push({
                  text: (el.textContent || el.value || '').slice(0, 30).trim(),
                  id: el.id,
                  className: el.className.split(' ')[0]
                });
              }
            });
            
            // Links (top 15)
            var linkCount = 0;
            document.querySelectorAll('a[href]').forEach(function(el) {
              if (linkCount < 15 && el.offsetWidth > 0) {
                var text = (el.textContent || '').slice(0, 40).trim();
                if (text.length > 2) {
                  result.links.push({ text: text });
                  linkCount++;
                }
              }
            });
            
            // Selects
            document.querySelectorAll('select').forEach(function(el) {
              if (el.offsetWidth > 0) {
                result.selects.push({ id: el.id, name: el.name });
              }
            });
            
            return result;
          })()
        `)
        
        let report = `INTERACTIVE ELEMENTS:\n\n`
        report += `INPUTS (${elements.inputs.length}):\n`
        elements.inputs.forEach((inp: any, i: number) => {
          report += `  ${i+1}. [${inp.type}] id="${inp.id}" name="${inp.name}" placeholder="${inp.placeholder}"\n`
        })
        
        report += `\nBUTTONS (${elements.buttons.length}):\n`
        elements.buttons.forEach((btn: any, i: number) => {
          report += `  ${i+1}. "${btn.text}" id="${btn.id}" class="${btn.className}"\n`
        })
        
        report += `\nLINKS (top ${elements.links.length}):\n`
        elements.links.forEach((link: any, i: number) => {
          report += `  ${i+1}. "${link.text}"\n`
        })
        
        return report
      } catch (e) {
        return `Scan failed: ${e}`
      }
    }

    case 'get_page_content': {
      if (!webview) return 'Error: Cannot access page'
      try {
        const maxLength = (args.max_length as number) || 500
        
        const content = await webview.executeJavaScript(`
          (function() {
            // Try to get main content
            var main = document.querySelector('main, article, .content, .main, #content, #main');
            var text = '';
            
            if (main) {
              text = main.innerText;
            } else {
              text = document.body.innerText;
            }
            
            // Clean up text
            text = text.replace(/\\s+/g, ' ').trim();
            
            return {
              title: document.title,
              content: text.slice(0, ${maxLength}),
              totalLength: text.length
            };
          })()
        `)
        
        return `PAGE CONTENT:\nTitle: ${content.title}\n\n${content.content}${content.totalLength > maxLength ? '...(truncated)' : ''}`
      } catch (e) {
        return `Failed to get content: ${e}`
      }
    }

    case 'find_element': {
      if (!webview) return 'Error: Cannot access page'
      try {
        const description = (args.description as string).toLowerCase()
        
        const result = await webview.executeJavaScript(`
          (function() {
            var desc = '${description.replace(/'/g, "\\'")}';
            var found = [];
            
            // Search by text content
            var all = document.querySelectorAll('button, a, input, [role="button"], label');
            
            all.forEach(function(el) {
              if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
              
              var text = (el.textContent || el.placeholder || el.value || el.ariaLabel || '').toLowerCase();
              var id = (el.id || '').toLowerCase();
              var className = (el.className || '').toLowerCase();
              
              var match = false;
              var keywords = desc.split(' ');
              
              keywords.forEach(function(kw) {
                if (text.includes(kw) || id.includes(kw) || className.includes(kw)) {
                  match = true;
                }
              });
              
              if (match) {
                var selector = '';
                if (el.id) selector = '#' + el.id;
                else if (el.name) selector = '[name="' + el.name + '"]';
                else selector = el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : '');
                
                found.push({
                  tag: el.tagName,
                  text: (el.textContent || '').slice(0, 30).trim(),
                  selector: selector
                });
              }
            });
            
            return found.slice(0, 5);
          })()
        `)
        
        if (result.length === 0) {
          return `No elements found matching "${description}". Try scan_interactive_elements to see available elements.`
        }
        
        let report = `FOUND ${result.length} MATCHING ELEMENTS:\n`
        result.forEach((el: any, i: number) => {
          report += `${i+1}. <${el.tag}> "${el.text}" - selector: ${el.selector}\n`
        })
        report += `\nUse click_element or input_text with one of these selectors.`
        
        return report
      } catch (e) {
        return `Find failed: ${e}`
      }
    }

    case 'check_element_exists': {
      if (!webview) return 'Error: Cannot access page'
      try {
        const selector = (args.selector as string).replace(/'/g, "\\'")
        
        const result = await webview.executeJavaScript(`
          (function() {
            var el = document.querySelector('${selector}');
            if (!el) return { exists: false };
            
            var rect = el.getBoundingClientRect();
            var isVisible = el.offsetWidth > 0 && el.offsetHeight > 0 &&
                           rect.top >= 0 && rect.top < window.innerHeight;
            
            return {
              exists: true,
              visible: isVisible,
              tag: el.tagName,
              text: (el.textContent || el.value || '').slice(0, 30).trim(),
              position: { top: Math.round(rect.top), left: Math.round(rect.left) }
            };
          })()
        `)
        
        if (!result.exists) {
          return `Element "${selector}" does NOT exist on the page.`
        }
        
        return `Element "${selector}" EXISTS.\n- Visible: ${result.visible}\n- Type: ${result.tag}\n- Text: "${result.text}"\n- Position: top=${result.position.top}px, left=${result.position.left}px`
      } catch (e) {
        return `Check failed: ${e}`
      }
    }

    default:
      return 'Unknown tool: ' + name
  }
}

const systemPrompt = `You are a browser automation assistant. You MUST respond in Chinese.

## CRITICAL: DISTINGUISH CONVERSATION VS AUTOMATION

NOT EVERY message requires tool calls! You must distinguish:

### DO NOT USE TOOLS for:
- Greetings: "hello", "hi", "hey"
- Self-introduction questions: "who are you", "what can you do", "introduce yourself"
- General chat: "how are you", "thank you", "ok"
- Clarification questions: "what do you mean", "can you explain"
- Opinions or advice requests without browser actions

For these, just respond naturally in Chinese. NO TOOL CALLS.

Example:
- User: "hello" -> Reply: "Hello! I am cfspider browser automation assistant. How can I help you today?"
- User: "who are you" -> Reply: "I am cfspider browser AI assistant, I can help you automate browser operations like searching, clicking, navigating websites."
- User: "thank you" -> Reply: "You're welcome! Let me know if you need anything else."

### USE TOOLS ONLY for:
- Opening websites: "open JD", "go to GitHub"
- Searching: "search xxx", "find xxx"
- Clicking: "click that button", "click the link"
- Any explicit browser operation request

## CRITICAL: SPEAK AFTER EVERY TOOL CALL

After EVERY tool call, you MUST add a text response in Chinese explaining:
1. What you just did
2. What you are thinking
3. What you will do next

Example conversation flow:

User: "Open JD and search for men's clothing"

You: "Hmm, the user wants to open JD. I should search for it through a search engine first."
[call navigate_to with url="https://www.bing.com"]

You: "Good, I'm now on Bing. Let me search for JD..."
[call input_text with text="JD"]

You: "I've typed JD in the search box. Now clicking search..."
[call click_search_button]

You: "Search results are showing. Let me find the official JD website... I see jd.com in the results."
[call click_text with text="JD" and target_domain="jd.com"]

You: "I clicked on JD's official link. Let me verify we're on the right site..."
[call verify_action]

You: "Great, we're now on JD! Now let me search for men's clothing..."

## NAVIGATION RULES

FORBIDDEN targets for navigate_to:
- jd.com, taobao.com, github.com, amazon.com, or any shopping/social site

ALLOWED targets for navigate_to:
- https://www.bing.com (DEFAULT - always use Bing first)
- https://www.baidu.com
- https://www.google.com

To visit ANY website:
1. navigate_to("https://www.bing.com") - ALWAYS use Bing as default
2. Search for the website name
3. Find and click the official link in search results

## THINKING OUT LOUD

Express your thoughts naturally in your response text:
- "Hmm, I should use a search engine to find this website..."
- "Let me see which one is the official site... this one with jd.com looks right."
- "The input seems to have failed. Let me try a different approach..."
- "Good, the search results are loaded. Now I need to find the official link..."

## WORKFLOW

1. Understand user intent
2. SAY your plan in Chinese
3. Execute ONE tool call
4. SAY what happened and what you observed
5. SAY what you will do next
6. Repeat until task complete

## SELF-VERIFICATION

After important actions, verify success:
- After clicking a link: check if URL changed to expected domain
- After inputting text: check if input field has the text
- After navigation: call check_website_safety

If verification fails, explain what went wrong and try alternative.

## SPECIAL: CFSPIDER PROJECT

If the user asks to search for "cfspider" or mentions the cfspider project:
- After successfully finding and navigating to the cfspider project page
- At the END of the task, you MUST add this special message in Chinese:

"Successfully found [what you found]! By the way, this browser you're using is also part of the unified cfspider project management. I am from cfspider!"

Example: If user says "search cfspider on GitHub", after completing the task, say:
"Successfully found cfspider project on GitHub! By the way, this browser you're using is also part of the unified cfspider project management. I am from cfspider!"

## REMEMBER

- ALWAYS respond in Chinese
- ALWAYS add text response after each tool call
- Express your thinking process through conversation, not through tools
- Use Bing (https://www.bing.com) as the default search engine
- Never directly navigate to shopping or social sites
`

// Manual safety check function (can be called from UI)
export async function manualSafetyCheck(): Promise<string> {
  const webview = document.querySelector('webview') as any
  if (!webview) return 'No webview found'
  
  try {
    const url = await webview.executeJavaScript('window.location.href') as string
    console.log('Manual safety check for:', url)
    
    const riskResult = checkWebsiteRisk(url)
    
    if (riskResult.isRisky) {
      await showRiskWarning(webview, riskResult.riskLevel, riskResult.message)
      return `WARNING: ${riskResult.message}`
    } else {
      // Show safe badge
      await webview.executeJavaScript(`
        (function() {
          var existing = document.getElementById('cfspider-safe-badge');
          if (existing) existing.remove();
          
          var badge = document.createElement('div');
          badge.id = 'cfspider-safe-badge';
          badge.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;z-index:2147483647;box-shadow:0 4px 12px rgba(16,185,129,0.4);display:flex;align-items:center;gap:8px;animation:cfspider-slide-in 0.3s ease;';
          badge.innerHTML = '<span style="font-size:18px;">?</span> Website appears safe';
          document.body.appendChild(badge);
          
          var style = document.createElement('style');
          style.id = 'cfspider-safe-style';
          style.textContent = '@keyframes cfspider-slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
          document.head.appendChild(style);
          
          setTimeout(function() {
            badge.style.animation = 'cfspider-slide-in 0.3s ease reverse forwards';
            setTimeout(function() {
              badge.remove();
              style.remove();
            }, 300);
          }, 2000);
        })()
      `)
      return 'Website is safe'
    }
  } catch (e) {
    console.error('Manual safety check error:', e)
    return 'Check failed'
  }
}

export async function sendAIMessage(content: string, useTools: boolean = true) {
  const store = useStore.getState()
  const { aiConfig, messages, addMessage, updateLastMessageWithToolCalls, setAILoading, resetAIStop } = store

  // Reset stop flag at the start of new conversation
  resetAIStop()

  if (!isElectron) {
    addMessage({ role: 'user', content })
    addMessage({ role: 'assistant', content: 'AI requires Electron environment.' })
    return
  }

  // Local/LAN services (Ollama etc.) do not require API Key
  const isLocalEndpoint = (url: string) => {
    return url.includes('localhost') || 
           url.includes('127.0.0.1') ||
           url.includes('192.168.') ||
           url.includes('10.') ||
           /172\.(1[6-9]|2[0-9]|3[01])\./.test(url) ||
           url.includes(':11434')  // Ollama default port
  }
  if (!aiConfig.endpoint || (!isLocalEndpoint(aiConfig.endpoint) && !aiConfig.apiKey)) {
    addMessage({ role: 'user', content })
    addMessage({ role: 'assistant', content: 'Please configure AI endpoint and API Key in settings.' })
    return
  }

  // Reset stop flag at the start of new conversation
  useStore.getState().resetAIStop()
  
  setAILoading(true)
  addMessage({ role: 'user', content })
  addMessage({ role: 'assistant', content: 'thinking' })

  // Helper to check if stop was requested
  const shouldStop = () => useStore.getState().aiStopRequested

  const toolCallHistory: Array<{ name: string; arguments: object; result?: string; comment?: string }> = []

  try {
    const chatHistory: Array<{ role: string; content?: string; tool_calls?: any[]; tool_call_id?: string }> = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content }
    ]

    let iteration = 0
    const maxIterations = 30

    while (iteration < maxIterations) {
      iteration++

      // Check if stop was requested
      if (shouldStop()) {
        updateLastMessageWithToolCalls('Stopped by user', toolCallHistory)
        break
      }

      const response = await (window as any).electronAPI.aiChat({
        endpoint: aiConfig.endpoint,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        messages: chatHistory,
        tools: useTools ? aiTools : undefined
      })

      if (response.error) {
        updateLastMessageWithToolCalls(response.error, toolCallHistory)
        break
      }

      const choice = response.choices?.[0]
      if (!choice) {
        updateLastMessageWithToolCalls('AI returned no response', toolCallHistory)
        break
      }

      const assistantMessage = choice.message

      // Get any text content the AI wants to say
      const aiComment = (assistantMessage.content || '').trim()
      
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0]
        const funcName = toolCall.function.name
        const funcArgs = JSON.parse(toolCall.function.arguments || '{}')

        // Add tool call with empty comment first
        toolCallHistory.push({
          name: funcName,
          arguments: funcArgs,
          result: 'executing...',
          comment: ''
        })
        
        // Stream the AI comment character by character (with stop check)
        if (aiComment) {
          for (let i = 0; i <= aiComment.length; i++) {
            if (shouldStop()) break
            toolCallHistory[toolCallHistory.length - 1].comment = aiComment.slice(0, i)
            updateLastMessageWithToolCalls('', toolCallHistory)
            await new Promise(resolve => setTimeout(resolve, 20)) // 20ms per character
          }
        } else {
          updateLastMessageWithToolCalls('', toolCallHistory)
        }

        // Check stop before executing tool
        if (shouldStop()) {
          toolCallHistory[toolCallHistory.length - 1].result = 'cancelled'
          updateLastMessageWithToolCalls('Stopped by user', toolCallHistory)
          break
        }

        const result = await executeToolCall(funcName, funcArgs)

        toolCallHistory[toolCallHistory.length - 1].result = result
        updateLastMessageWithToolCalls('', toolCallHistory)

        chatHistory.push({
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: assistantMessage.tool_calls
        })
        chatHistory.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result
        })

        await new Promise(resolve => setTimeout(resolve, 300))
      } else {
        // Final response without tool call - stream it (with stop check)
        const finalText = aiComment || 'Done'
        for (let i = 0; i <= finalText.length; i++) {
          if (shouldStop()) break
          updateLastMessageWithToolCalls(finalText.slice(0, i), toolCallHistory)
          await new Promise(resolve => setTimeout(resolve, 15)) // 15ms per character for final message
        }
        break
      }
    }

    if (iteration >= maxIterations) {
      updateLastMessageWithToolCalls('Max iterations reached.', toolCallHistory)
    }
  } catch (error) {
    updateLastMessageWithToolCalls('Error: ' + error, toolCallHistory)
  } finally {
    setAILoading(false)
  }
}
