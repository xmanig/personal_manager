import { describe, it, expect } from 'vitest';


import { encrypt, decrypt } from '../lib/encryption';

describe('encryption', () => {
  it('should encrypt and decrypt a string', () => {
    const original = 'my-secret-token';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted.split(':')).toHaveLength(3);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertexts for the same input', () => {
    const input = 'same-value';
    const a = encrypt(input);
    const b = encrypt(input);
    expect(a).not.toBe(b);
  });

  it('should throw on invalid ciphertext', () => {
    expect(() => decrypt('invalid')).toThrow('Invalid encrypted format');
  });

  it('should throw when ENCRYPTION_KEY is missing', () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('x')).toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = saved;
  });

  it('should throw in production when using the test key', () => {
    const savedNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(() => encrypt('x')).toThrow('Generate a unique key');
    process.env.NODE_ENV = savedNodeEnv;
  });
});
