import { mnemonicNew, mnemonicValidate, mnemonicToPrivateKey } from '@ton/crypto';
import CryptoJS from 'crypto-js';

const ENCRYPTION_SALT = 'ton-wallet-salt-v1';

export class CryptoService {
    /**
     * Генерирует новую 24-словную мнемонику (seed-фразу)
     */
    async generateMnemonic(): Promise<string[]> {
        return await mnemonicNew(24);
    }

    /**
     * Валидирует введенную мнемонику
     */
    async validateMnemonic(mnemonic: string[]): Promise<boolean> {
        return await mnemonicValidate(mnemonic);
    }

    /**
     * Получает пару ключей (публичный/приватный) из мнемоники
     */
    async getKeyPair(mnemonic: string[]) {
        return await mnemonicToPrivateKey(mnemonic);
    }

    /**
     * Шифрует мнемонику с использованием пароля (PIN-кода) для безопасного хранения
     */
    encryptMnemonic(mnemonic: string[], password: string): string {
        const mnemonicString = mnemonic.join(' ');
        // Используем PBKDF2 для усиления пароля перед шифрованием (защита от перебора)
        const key = CryptoJS.PBKDF2(password, ENCRYPTION_SALT, { keySize: 256 / 32, iterations: 1000 });
        
        // Шифруем алгоритмом AES
        const encrypted = CryptoJS.AES.encrypt(mnemonicString, key.toString());
        return encrypted.toString();
    }

    /**
     * Расшифровывает мнемонику с использованием пароля
     */
    decryptMnemonic(encryptedMnemonic: string, password: string): string[] {
        try {
            const key = CryptoJS.PBKDF2(password, ENCRYPTION_SALT, { keySize: 256 / 32, iterations: 1000 });
            const decrypted = CryptoJS.AES.decrypt(encryptedMnemonic, key.toString());
            const originalText = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!originalText) {
                throw new Error('Invalid password or corrupted data');
            }
            
            return originalText.split(' ');
        } catch (e) {
            throw new Error('Decryption failed. Invalid password.');
        }
    }
}

export const cryptoService = new CryptoService();