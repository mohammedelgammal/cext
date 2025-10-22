import * as bip39 from 'bip39';
import { argon2id } from 'hash-wasm';

export class CryptoKeyManager {
  #AES_KEY_LEN = 32;
  #ENCRYPTION_ALGO = 'AES-GCM';
  #WRAPPING_ALGO = 'AES-KW';
  #HASH_ITER = 3;
  #HASH_PARAL = 2;
  #HASH_MEM = 65536;
  #HASH_LEN = 32;

  createMnemonics: (length?: number) => string = (length = 128) => bip39.generateMnemonic(length);
  #genRandom: (length: number) => Uint8Array<ArrayBuffer> = length => crypto.getRandomValues(new Uint8Array(length));
  #genDEK: () => Promise<CryptoKey> = () => {
    const randomValue = this.#genRandom(this.#AES_KEY_LEN);
    const DEK = crypto.subtle.importKey('raw', randomValue, { name: this.#ENCRYPTION_ALGO }, true, [
      'encrypt',
      'decrypt',
    ]);
    return DEK;
  };
  #encryptAES: (plain: string, iv: Uint8Array<ArrayBuffer>, DEK: CryptoKey) => Promise<ArrayBuffer> = (
    plain,
    iv,
    DEK,
  ) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(plain);
    const cipher = crypto.subtle.encrypt({ name: this.#ENCRYPTION_ALGO, iv }, DEK, encoded);
    return cipher;
  };
  #hash: (password: string, salt: Uint8Array<ArrayBuffer>) => Promise<Uint8Array<ArrayBufferLike>> = async (
    password,
    salt,
  ) => {
    const hash = await argon2id({
      password,
      salt,
      iterations: this.#HASH_ITER,
      parallelism: this.#HASH_PARAL,
      memorySize: this.#HASH_MEM,
      hashLength: this.#HASH_LEN,
      outputType: 'binary',
    });
    return hash;
  };
  #genDEK_KEK_P: (hash: Uint8Array<ArrayBuffer>, DEK: CryptoKey) => Promise<ArrayBuffer> = async (hash, DEK) => {
    const KEK_P = await crypto.subtle.importKey('raw', hash, { name: this.#WRAPPING_ALGO }, false, [
      'wrapKey',
      'unwrapKey',
    ]);
    const DEK_KEK_P = crypto.subtle.wrapKey('raw', DEK, KEK_P, { name: this.#WRAPPING_ALGO });
    return DEK_KEK_P;
  };

  // Public Methods
  initialize: (
    mnemonic: string,
    password: string,
  ) => Promise<{
    encryptedMnemonic: ArrayBuffer;
    iv: Uint8Array<ArrayBuffer>;
    salt: Uint8Array<ArrayBuffer>;
    DEK_KEK_P: ArrayBuffer;
  }> = async (mnemonic, password) => {
    const DEK = await this.#genDEK();
    const iv = this.#genRandom(12);
    const encryptedMnemonic = await this.#encryptAES(mnemonic, iv, DEK);
    const salt = this.#genRandom(16);
    const hashedPassword = await this.#hash(password, salt);
    const hashedPassBuffer = new Uint8Array(hashedPassword);
    const DEK_KEK_P = await this.#genDEK_KEK_P(hashedPassBuffer, DEK);
    return { encryptedMnemonic, iv, salt, DEK_KEK_P };
  };
  reveal: (
    password: string,
    salt: Uint8Array<ArrayBuffer>,
    encryptedMnemonic: ArrayBuffer,
    iv: Uint8Array<ArrayBuffer>,
    DEK_KEK_P: ArrayBuffer,
  ) => Promise<ArrayBuffer> = async (password, salt, encryptedMnemonic, iv, DEK_KEK_P) => {
    const hashedPassword = await this.#hash(password, salt);
    const hashedPassBuffer = new Uint8Array(hashedPassword);
    const KEK_P = await crypto.subtle.importKey('raw', hashedPassBuffer, { name: this.#WRAPPING_ALGO }, false, [
      'wrapKey',
      'unwrapKey',
    ]);
    const DEK = await crypto.subtle.unwrapKey(
      'raw',
      DEK_KEK_P,
      KEK_P,
      { name: this.#WRAPPING_ALGO },
      { name: this.#ENCRYPTION_ALGO },
      false,
      ['encrypt', 'decrypt'],
    );
    const mnemonic = crypto.subtle.decrypt({ name: this.#ENCRYPTION_ALGO, iv }, DEK, encryptedMnemonic);
    return mnemonic;
  };
  rotate: (
    password: string,
    oldsalt: Uint8Array<ArrayBuffer>,
    oldEncryptedMnemonic: ArrayBuffer,
    oldiv: Uint8Array<ArrayBuffer>,
    oldDEK_KEK_P: ArrayBuffer,
  ) => Promise<{
    encryptedMnemonic: ArrayBuffer;
    iv: Uint8Array<ArrayBuffer>;
    salt: Uint8Array<ArrayBuffer>;
    DEK_KEK_P: ArrayBuffer;
  }> = async (password, oldSalt, oldEncryptedMnemonic, oldIv, oldDEK_KEK_P) => {
    const encodedMnemonics = await this.reveal(password, oldSalt, oldEncryptedMnemonic, oldIv, oldDEK_KEK_P);
    const decoder = new TextDecoder();
    const mnemonics = decoder.decode(encodedMnemonics);
    return this.initialize(mnemonics, password);
  };
  changePassword: (
    oldPassword: string,
    newPassword: string,
    oldsalt: Uint8Array<ArrayBuffer>,
    oldEncryptedMnemonic: ArrayBuffer,
    oldiv: Uint8Array<ArrayBuffer>,
    oldDEK_KEK_P: ArrayBuffer,
  ) => Promise<{
    encryptedMnemonic: ArrayBuffer;
    iv: Uint8Array<ArrayBuffer>;
    salt: Uint8Array<ArrayBuffer>;
    DEK_KEK_P: ArrayBuffer;
  }> = async (oldPassword, newPassword, oldSalt, oldEncryptedMnemonic, oldIv, oldDEK_KEK_P) => {
    const encodedMnemonics = await this.reveal(oldPassword, oldSalt, oldEncryptedMnemonic, oldIv, oldDEK_KEK_P);
    const decoder = new TextDecoder();
    const mnemonics = decoder.decode(encodedMnemonics);
    return this.initialize(mnemonics, newPassword);
  };
}
