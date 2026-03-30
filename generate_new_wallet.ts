import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient, WalletContractV4, internal, SendMode } from '@ton/ton';
import { Address } from '@ton/core';
import CryptoJS from 'crypto-js';

// Конфигурация TonCenter API
const ENCRYPTION_SALT = 'ton-wallet-salt-v1';
const TONCENTER_API_KEY_VALUE = '92b3646a80fc2ac97a4f0186e460ee3b0de0abb6ce4a03fc207ba0799f7faacb'; // Ваш ключ
const TONCENTER_ENDPOINT_VALUE = 'https://testnet.toncenter.com/api/v2/jsonRPC';

// Вспомогательный класс для расшифровки мнемоники (аналогично CryptoService в приложении)
class CryptoServiceNode {
    decryptMnemonic(encryptedMnemonic: string, password: string): string[] {
        try {
            const key = CryptoJS.PBKDF2(password, ENCRYPTION_SALT, { keySize: 256 / 32, iterations: 1000 });
            const decrypted = CryptoJS.AES.decrypt(encryptedMnemonic, key.toString());
            const originalText = decrypted.toString(CryptoJS.enc.Utf8);
            if (!originalText) { throw new Error('Invalid password or corrupted data'); }
            return originalText.split(' ');
        } catch (e) { throw new Error('Decryption failed. Invalid password.'); }
    }
}
const cryptoServiceNode = new CryptoServiceNode();

// Вспомогательный класс для работы с TON (аналогично TonService в приложении)
class TonServiceNode {
    private client: TonClient;

    constructor() {
        this.client = new TonClient({
            endpoint: TONCENTER_ENDPOINT_VALUE,
            apiKey: TONCENTER_API_KEY_VALUE,
        });
    }

    getWalletContract(keyPair: any) {
        return WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    }

    getWalletAddress(keyPair: any, bounceable = true): string {
        const wallet = this.getWalletContract(keyPair);
        return wallet.address.toString({ testOnly: true, bounceable });
    }
}
const tonServiceNode = new TonServiceNode();

async function generateNewWallet() {
    console.log('--- Generating New Wallet ---');

    // Создаем новый кошелек
    const receiverMnemonic = await mnemonicNew(24);
    const receiverKeyPair = await mnemonicToPrivateKey(receiverMnemonic);
    const receiverAddress = tonServiceNode.getWalletAddress(receiverKeyPair);

    console.log(`Новый кошелек (мнемоника): ${receiverMnemonic.join(' ')}`);
    console.log(`Новый кошелек (адрес): ${receiverAddress}`);

    console.log('--- New Wallet Generated ---');
}

generateNewWallet();