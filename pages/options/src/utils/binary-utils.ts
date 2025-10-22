export const convertForChromeStorage = (data: {
  encryptedMnemonic: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  DEK_KEK_P: ArrayBuffer;
}): {
  encryptedMnemonic: string;
  iv: string;
  salt: string;
  DEK_KEK_P: string;
} => {
  const encryptedMnemonic = new Uint8Array(data.encryptedMnemonic).toBase64();
  const iv = data.iv.toBase64();
  const salt = data.salt.toBase64();
  const DEK_KEK_P = new Uint8Array(data.DEK_KEK_P).toBase64();
  return { encryptedMnemonic, iv, salt, DEK_KEK_P };
};

// Convert Chrome storage data back to binary format
export const convertFromChromeStorage = (data: {
  encryptedMnemonic: string;
  iv: string;
  salt: string;
  DEK_KEK_P: string;
}): {
  encryptedMnemonic: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  DEK_KEK_P: ArrayBuffer;
} => {
  const encryptedMnemonic = Uint8Array.fromBase64(data.encryptedMnemonic).buffer;
  const iv = Uint8Array.fromBase64(data.iv);
  const salt = Uint8Array.fromBase64(data.salt);
  const DEK_KEK_P = Uint8Array.fromBase64(data.DEK_KEK_P).buffer;
  return { encryptedMnemonic, iv, salt, DEK_KEK_P };
};
