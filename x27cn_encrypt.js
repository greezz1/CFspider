// x27cn 加密/解密函数
// 在 workers.js 开头添加这些函数

const X27CN_KEY = 'x27cn2026'; // 可以通过环境变量覆盖

// x27cn 加密函数
function x27cnEncrypt(text, key = X27CN_KEY) {
    if (!text) return '';
    const keyBytes = new TextEncoder().encode(key);
    const textBytes = new TextEncoder().encode(text);
    const result = new Uint8Array(textBytes.length);
    
    for (let i = 0; i < textBytes.length; i++) {
        // XOR with key byte
        let b = textBytes[i] ^ keyBytes[i % keyBytes.length];
        // Rotate bits
        b = ((b << 3) | (b >> 5)) & 0xFF;
        // Add position offset
        b = (b + i) & 0xFF;
        result[i] = b;
    }
    
    // Convert to hex string
    return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
}

// x27cn 解密函数
function x27cnDecrypt(hex, key = X27CN_KEY) {
    if (!hex || hex.length % 2 !== 0) return '';
    const keyBytes = new TextEncoder().encode(key);
    const bytes = new Uint8Array(hex.length / 2);
    
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    
    const result = new Uint8Array(bytes.length);
    
    for (let i = 0; i < bytes.length; i++) {
        let b = bytes[i];
        // Reverse: subtract position offset
        b = (b - i + 256) & 0xFF;
        // Reverse: rotate bits back
        b = ((b >> 3) | (b << 5)) & 0xFF;
        // Reverse: XOR with key byte
        b = b ^ keyBytes[i % keyBytes.length];
        result[i] = b;
    }
    
    return new TextDecoder().decode(result);
}

module.exports = { x27cnEncrypt, x27cnDecrypt };

