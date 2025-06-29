class SecurityService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;

  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptApiKey(apiKey: string, key?: CryptoKey): Promise<string> {
    const encryptionKey = key || await this.generateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      encryptionKey,
      encoder.encode(apiKey)
    );

    // Combine key, iv, and encrypted data
    const keyData = await crypto.subtle.exportKey('raw', encryptionKey);
    const combined = new Uint8Array(keyData.byteLength + iv.length + encrypted.byteLength);
    combined.set(new Uint8Array(keyData), 0);
    combined.set(iv, keyData.byteLength);
    combined.set(new Uint8Array(encrypted), keyData.byteLength + iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decryptApiKey(encryptedData: string): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    const keyData = combined.slice(0, 32); // 256 bits = 32 bytes
    const iv = combined.slice(32, 44); // 12 bytes IV
    const encrypted = combined.slice(44);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: this.ALGORITHM },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  sanitizeCode(code: string): string {
    // Remove potential API keys and sensitive information
    const sensitivePatterns = [
      /api[_-]?key\s*[:=]\s*['""]([^'""\s]+)['""]?/gi,
      /secret[_-]?key\s*[:=]\s*['""]([^'""\s]+)['""]?/gi,
      /password\s*[:=]\s*['""]([^'""\s]+)['""]?/gi,
      /token\s*[:=]\s*['""]([^'""\s]+)['""]?/gi,
      /credentials?\s*[:=]\s*['""]([^'""\s]+)['""]?/gi,
      /bearer\s+([a-zA-Z0-9\-._~+/]+=*)/gi,
      /sk-[a-zA-Z0-9]{48}/gi, // OpenAI API keys
      /xoxb-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/gi, // Slack bot tokens
    ];

    let sanitized = code;
    
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match, capture) => {
        if (capture) {
          return match.replace(capture, '*'.repeat(capture.length));
        }
        return match.replace(/[a-zA-Z0-9\-._~+/=]/g, '*');
      });
    });

    // Remove commented credentials
    sanitized = sanitized.replace(/\/\/.*?(api[_-]?key|secret|password|token).*/gi, '// [REDACTED]');
    sanitized = sanitized.replace(/#.*?(api[_-]?key|secret|password|token).*/gi, '# [REDACTED]');

    return sanitized;
  }

  validateDownloadPackage(packageData: Uint8Array): boolean {
    // Basic validation - check if it's a valid ZIP file
    const signature = packageData.slice(0, 4);
    const zipSignatures = [
      [0x50, 0x4B, 0x03, 0x04], // Standard ZIP
      [0x50, 0x4B, 0x05, 0x06], // Empty ZIP
      [0x50, 0x4B, 0x07, 0x08], // Spanned ZIP
    ];

    return zipSignatures.some(sig => 
      sig.every((byte, index) => signature[index] === byte)
    );
  }

  generateSecureId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    return crypto.subtle.digest('SHA-256', encoder.encode(data))
      .then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      });
  }
}

export const securityService = new SecurityService();