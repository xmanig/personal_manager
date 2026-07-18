import { describe, it, expect } from 'vitest';

process.env.ENCRYPTION_KEY = '71b88f1b2f4bda08d2262918e825f9b04ad68b820bc8a54c34abcf864d0dec86';

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
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('x')).toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = '71b88f1b2f4bda08d2262918e825f9b04ad68b820bc8a54c34abcf864d0dec86';
  });
});
