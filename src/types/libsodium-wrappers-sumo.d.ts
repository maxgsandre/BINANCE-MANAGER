declare module 'libsodium-wrappers-sumo' {
  interface ISodium {
    ready: Promise<void>;
    randombytes_buf(length: number): Uint8Array;
    crypto_secretbox_NONCEBYTES: number;
    crypto_secretbox_easy(message: string | Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
    crypto_secretbox_open_easy(ciphertext: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
    crypto_pwhash(
      outlen: number,
      passwd: string,
      salt: Uint8Array,
      opslimit: number,
      memlimit: number,
      alg: number
    ): Uint8Array;
    crypto_pwhash_OPSLIMIT_INTERACTIVE: number;
    crypto_pwhash_MEMLIMIT_INTERACTIVE: number;
    crypto_pwhash_ALG_DEFAULT: number;
  }

  const sodium: ISodium;
  export default sodium;
}

