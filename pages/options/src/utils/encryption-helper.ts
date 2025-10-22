import { argon2id } from 'hash-wasm';

const hexStringToUint8Array = (hexString: string): Uint8Array => {
  const cleanHex = hexString.replace(/[^0-9a-f]/gi, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }

  const array = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < array.length; i++) {
    const byteValue = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
    array[i] = byteValue;
  }
  return array;
};

export class AESEncryption {
  #DEFAULT_ALGORITHM = 'AES-GCM';
  #IV: Uint8Array<ArrayBuffer> = new Uint8Array();
  #IV_LENGTH = 16;
  #SALT_LENGTH = 128;
  #SALT: Uint8Array<ArrayBuffer> = new Uint8Array();

  #genSalt: () => Promise<Uint8Array<ArrayBuffer>> = async () =>
    crypto.getRandomValues(new Uint8Array(this.#SALT_LENGTH));
  #genKey: (password: string) => Promise<{ passHash: CryptoKey }> = async (password: string) => {
    const pepper = await this.#genSalt();
    this.#SALT = await this.#genSalt();
    const passHash = await argon2id({
      password,
      salt: this.#SALT,
      secret: pepper,
      parallelism: 1,
      iterations: 256,
      memorySize: 512,
      hashLength: 32,
      outputType: 'hex',
    });

    const keyBytes = new Uint8Array(hexStringToUint8Array(passHash));

    // Import as AES-GCM key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      {
        name: 'AES-GCM',
      },
      false, // NOT extractable (more secure)
      ['encrypt', 'decrypt'],
    );
    return { passHash: aesKey };
  };
  #genIV: () => Uint8Array<ArrayBuffer> = () => crypto.getRandomValues(new Uint8Array(this.#IV_LENGTH));
  #encode: (plainText: string) => Uint8Array<ArrayBuffer> = plainText => new TextEncoder().encode(plainText);

  encryptAES: (
    password: string,
    plainMnemonic: string,
  ) => Promise<{ seed: ArrayBuffer; iv: Uint8Array<ArrayBuffer>; salt: Uint8Array<ArrayBuffer> }> = async (
    password,
    plainMnemonic,
  ) => {
    this.#IV = this.#genIV();
    const encodedMnemonic = this.#encode(plainMnemonic);
    const { passHash } = await this.#genKey(password);
    const cipherSeed = await crypto.subtle.encrypt(
      { name: this.#DEFAULT_ALGORITHM, iv: this.#IV },
      passHash,
      encodedMnemonic,
    );
    return { seed: cipherSeed, iv: this.#IV, salt: this.#SALT };
  };

  decryptAES: (password: string, encryptedMnemonic: ArrayBuffer) => Promise<string> = async (
    password,
    encryptedMnemonic: ArrayBuffer,
  ) => {
    const { passHash } = await this.#genKey(password);
    const decrypted = await crypto.subtle.decrypt(
      { name: this.#DEFAULT_ALGORITHM, iv: this.#IV },
      passHash,
      encryptedMnemonic,
    );
    const decoded = new TextDecoder().decode(decrypted);
    return decoded;
  };
}
