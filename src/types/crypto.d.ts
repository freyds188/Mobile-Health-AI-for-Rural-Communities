declare module 'react-native-crypto-js' {
  export interface CipherStatic {
    encrypt(message: string, key: string): any;
    decrypt(ciphertext: any, key: string): any;
  }

  export interface PBKDF2Static {
    (password: string, salt: string, options: { keySize: number; iterations: number }): any;
  }

  export interface EncStatic {
    Utf8: any;
  }

  export const AES: CipherStatic;
  export const PBKDF2: PBKDF2Static;
  export const enc: EncStatic;

  const CryptoJS: {
    AES: CipherStatic;
    PBKDF2: PBKDF2Static;
    enc: EncStatic;
  };

  export default CryptoJS;
}