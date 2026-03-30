import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient, WalletContractV4, internal, SendMode } from '@ton/ton';
import { Address } from '@ton/core';
import CryptoJS from 'crypto-js';

// Конфигурация TonCenter API
const ENCRYPTION_SALT = 'ton-wallet-salt-v1';
const TONCENTER_API_KEY_VALUE = '92b3646a80fc2ac97a4f0186e460ee3b0de0abb6ce4a03fc207ba0799f7faacb'; // Ваш ключ
const TONCENTER_ENDPOINT_VALUE = 'https://testnet.toncenter.com/api/v2/jsonRPC';

// Данные исходного кошелька (отправителя)
const SENDER_ENCRYPTED_MNEMONIC = 'U2FsdGVkX18ncap8cqYaNGvL/xnwbU6/KBeQXMXLTJpWNVXAJlL3YF5HMF3Z+RcDF5iq95XydfTDoI9Kp6BNQuWDseRGpxiA0jfnbAWj+ANmAwPgqydjM5rVbS2+EPuYxbQ5bbPNBrRN8IA1/XdMh5hQ0QBjG3qEoFkJt2sjkJnMM2GJm7xVmkGc/qGMzruy/43W09RrAY4ya0s8FruBkPuCc1dgEs0qFA=';
const SENDER_PASSWORD = '12345678';

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

    async getBalance(address: string): Promise<number> {
        try {
            const parsedAddress = Address.parse(address);
            const balance = await this.client.getBalance(parsedAddress);
            return Number(balance) / 1e9;
        } catch (error) {
            console.error('Failed to get balance:', error);
            return 0;
        }
    }

    async sendTransaction(
        keyPair: any, 
        toAddress: string, 
        amountInTon: number, 
        message?: string
    ): Promise<boolean> {
        try {
            const wallet = this.getWalletContract(keyPair);
            const contract = this.client.open(wallet);
            const seqno = await contract.getSeqno();

            await contract.sendTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [
                    internal({
                        to: Address.parse(toAddress),
                        value: amountInTon.toString(),
                        body: message || undefined,
                        bounce: true
                    })
                ],
                sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            });

            console.log(`Transaction sent with seqno ${seqno}. Waiting for confirmation...`);
            return true;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    async waitForTransaction(keyPair: any, initialSeqno: number, maxAttempts = 15): Promise<boolean> {
        const wallet = this.getWalletContract(keyPair);
        const contract = this.client.open(wallet);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            try {
                const currentSeqno = await contract.getSeqno();
                if (currentSeqno > initialSeqno) { return true; }
            } catch (e) { /* ignore */ }
        }
        return false;
    }
}
const tonServiceNode = new TonServiceNode();

async function runTestTransactions() {
    console.log('--- Starting Self-Transfer Test (Attempting to fix seqno) ---');

    // 1. Расшифровываем мнемонику исходного кошелька
    const senderMnemonic = cryptoServiceNode.decryptMnemonic(SENDER_ENCRYPTED_MNEMONIC, SENDER_PASSWORD);
    const senderKeyPair = await mnemonicToPrivateKey(senderMnemonic);
    const senderAddress = tonServiceNode.getWalletAddress(senderKeyPair);

    console.log(`Отправитель: ${senderAddress}`);
    let senderBalance = await tonServiceNode.getBalance(senderAddress);
    console.log(`Баланс отправителя ДО: ${senderBalance} TON`);

    // 2. Отправляем 0.1 TON на свой же адрес
    const amountToSend = 0.1;
    const recipientAddress = senderAddress; // Отправляем на свой же адрес

    try {
        console.log(`
Отправляем ${amountToSend} TON с ${senderAddress} на ${recipientAddress}...`);
        const senderWalletContract = tonServiceNode.getWalletContract(senderKeyPair);
        const initialSeqno = await tonServiceNode['client'].open(senderWalletContract).getSeqno().catch(() => 0);

        console.log(`Текущий seqno перед отправкой: ${initialSeqno}`);

        await tonServiceNode.sendTransaction(
            senderKeyPair, 
            recipientAddress, 
            amountToSend, 
            'Self-transfer to fix seqno'
        );

        const isConfirmed = await tonServiceNode.waitForTransaction(senderKeyPair, initialSeqno);

        if (isConfirmed) {
            console.log('Транзакция УСПЕШНО подтверждена!');
        } else {
            console.warn('Транзакция отправлена, но не подтверждена за отведенное время.');
        }

        // Обновляем балансы после транзакции
        senderBalance = await tonServiceNode.getBalance(senderAddress);
        console.log(`Баланс отправителя ПОСЛЕ: ${senderBalance} TON`);

    } catch (e: any) {
        console.error('Ошибка при отправке транзакции:', e.message);
    }

    console.log('--- Self-Transfer Test Finished ---');
}

runTestTransactions();