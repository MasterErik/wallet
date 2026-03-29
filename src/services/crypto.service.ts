import CryptoJS from 'crypto-js';

export const cryptoService = {
    encrypt(data: string, key: string): string {
        return CryptoJS.AES.encrypt(data, key).toString();
    },
    decrypt(ciphertext: string, key: string): string {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
};
