// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodiumLib = require('libsodium-wrappers-sumo');

// Chave de criptografia - em produção deve ser um secret seguro
// TODO: Mover para variável de ambiente
const MASTER_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32chars!!!!';

let sodium: any = null;

async function getSodium() {
  if (sodium) return sodium;
  await sodiumLib.default.ready;
  sodium = sodiumLib.default;
  return sodium;
}

export async function encrypt(data: string): Promise<string> {
  const s = await getSodium();
  
  // Derive key from master key
  const key = s.crypto_pwhash(
    32, // key length
    MASTER_KEY,
    Buffer.from('fixed-salt-for-binary'), // salt
    s.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    s.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    s.crypto_pwhash_ALG_DEFAULT
  );
  
  // Generate nonce
  const nonce = s.randombytes_buf(s.crypto_secretbox_NONCEBYTES);
  
  // Encrypt
  const ciphertext = s.crypto_secretbox_easy(data, nonce, key);
  
  // Combine nonce + ciphertext and encode to base64
  const combined = Buffer.concat([Buffer.from(nonce), Buffer.from(ciphertext)]);
  return combined.toString('base64');
}

export async function decrypt(encryptedData: string): Promise<string> {
  const s = await getSodium();
  
  const combined = Buffer.from(encryptedData, 'base64');
  
  // Extract nonce (first 24 bytes)
  const nonce = combined.slice(0, s.crypto_secretbox_NONCEBYTES);
  
  // Extract ciphertext (rest)
  const ciphertext = combined.slice(s.crypto_secretbox_NONCEBYTES);
  
  // Derive same key
  const key = s.crypto_pwhash(
    32,
    MASTER_KEY,
    Buffer.from('fixed-salt-for-binary'),
    s.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    s.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    s.crypto_pwhash_ALG_DEFAULT
  );
  
  // Decrypt
  const decrypted = s.crypto_secretbox_open_easy(ciphertext, nonce, key);
  
  return Buffer.from(decrypted).toString('utf8');
}

