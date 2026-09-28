import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Returns the 32-byte encryption key for data-at-rest.
 * Enforces strong key in production.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_SECRET environment variable is required in production.');
    }
    // Deterministic dev fallback key
    return crypto.scryptSync('naw3iya-dev-encryption-secret-2026', 'salt-dev-2026', 32);
  }
  // Derive a 32-byte key from the secret
  return crypto.scryptSync(secret, 'naw3iya-gcm-salt-enterprise', 32);
}

export interface EncryptedPayload {
  ciphertext: string; // hex
  iv: string;         // hex
  tag: string;        // hex
}

export const CryptoService = {
  /**
   * Encrypts a string using AES-256-GCM.
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    const payload: EncryptedPayload = {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };

    return JSON.stringify(payload);
  },

  /**
   * Decrypts an AES-256-GCM encrypted payload.
   * If input is plaintext JSON (legacy data), returns it safely.
   */
  decrypt(ciphertextPayload: string): string {
    if (!ciphertextPayload) return '';
    try {
      const parsed = JSON.parse(ciphertextPayload);
      if (!parsed.ciphertext || !parsed.iv || !parsed.tag) {
        // Legacy plaintext JSON
        return ciphertextPayload;
      }

      const key = getEncryptionKey();
      const iv = Buffer.from(parsed.iv, 'hex');
      const tag = Buffer.from(parsed.tag, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(parsed.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // If decryption fails or it's unencrypted legacy text, return as-is or empty
      return ciphertextPayload;
    }
  },

  /**
   * Encrypts an object by JSON-stringifying it first.
   */
  encryptObject(obj: Record<string, any>): string {
    return CryptoService.encrypt(JSON.stringify(obj));
  },

  /**
   * Decrypts an encrypted payload back into an object.
   */
  decryptObject<T = Record<string, any>>(ciphertextPayload: any): T {
    if (!ciphertextPayload) return {} as T;
    if (typeof ciphertextPayload === 'object' && !ciphertextPayload.ciphertext) {
      return ciphertextPayload as T;
    }
    const decryptedStr = CryptoService.decrypt(typeof ciphertextPayload === 'string' ? ciphertextPayload : JSON.stringify(ciphertextPayload));
    try {
      return JSON.parse(decryptedStr) as T;
    } catch {
      return {} as T;
    }
  },

  /**
   * Masks sensitive credentials for safe API responses.
   */
  redactCredentials(credentials: Record<string, any>): Record<string, any> {
    if (!credentials || typeof credentials !== 'object') return {};
    const redacted: Record<string, any> = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value === 'string' && value.length > 0) {
        const isSecret = /token|key|secret|password|bearer/i.test(key);
        if (isSecret) {
          redacted[key] = value.length > 6 
            ? `${value.slice(0, 3)}••••••••${value.slice(-3)}`
            : '••••••';
        } else {
          redacted[key] = value;
        }
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }
};
