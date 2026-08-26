import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const envKey = process.env.FIELD_ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FIELD_ENCRYPTION_KEY is required in production');
    }
    // 开发环境兜底密钥，仅用于本地测试
    console.warn('[Encryption] FIELD_ENCRYPTION_KEY not set, using fallback key for development only');
    return scryptSync('house-pro-dev-key-please-change-in-production', 'salt', KEY_LENGTH);
  }
  if (Buffer.from(envKey, 'base64').length !== KEY_LENGTH) {
    throw new Error(`FIELD_ENCRYPTION_KEY must be a base64 encoded ${KEY_LENGTH}-byte key`);
  }
  return Buffer.from(envKey, 'base64');
}

const KEY = getKey();

export function encryptField(plain: string | null | undefined): string | null | undefined {
  if (plain === null || plain === undefined || plain === '') return plain as null | undefined;
  if (isEncrypted(plain)) return plain;

  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const buffer = Buffer.concat([salt, iv, authTag, encrypted]);
  return `enc:${buffer.toString('base64')}`;
}

export function decryptField(cipher: string | null | undefined): string | null | undefined {
  if (cipher === null || cipher === undefined || cipher === '') return cipher as null | undefined;
  if (!isEncrypted(cipher)) return cipher;

  const raw = Buffer.from((cipher as string).slice(4), 'base64');
  const salt = raw.subarray(0, SALT_LENGTH);
  const iv = raw.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = raw.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = raw.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('enc:');
}
