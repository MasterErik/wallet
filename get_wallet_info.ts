import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient, WalletContractV4, internal, SendMode } from '@ton/ton';
import { Address } from '@ton/core';
import CryptoJS from 'crypto-js';

const ENCRYPTION_SALT = 'ton-wallet-salt-v1';
const TONCENTER_API_KEY_VALUE = '92b3646a80fc2ac97a4f0186e460ee3b0de0abb6ce4a03fc207ba0799f7faacb'; // Ваш ключ напрямую
const TONCENTER_ENDPOINT_VALUE = 'https://testnet.toncenter.com/api/v2/jsonRPC';

const encryptedMnemonic = 'U2FsdGVkX18ncap8cqYaNGvL/xnwbU6/KBeQXMXLTJpWNVXAJlL3YF5HMF3Z+RcDF5iq95XydfTDoI9Kp6BNQuWDseRGpxiA0jfnbAWj+ANmAwPgqydjM5rOI8ba5M9rVbS2+EPuYxbQ5bbPNBrRN8IA1/XdMh5hQ0QBjG3qEoFkJt2sjkJnMM2GJm7xVmkGc/qGMzruy/43W09RrAY4ya0s8FruBkPuCc1dgEs0qFA=';
const password = '12345678';

class CryptoServiceNode {
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
const cryptoServiceNode = new CryptoServiceNode();

class TonServiceNode {
    private client: TonClient;

    constructor() {
        this.client = new TonClient({
            endpoint: TONCENTER_ENDPOINT_VALUE,
            apiKey: TONCENTER_API_KEY_VALUE,
        });
    }

    getWalletContract(keyPair: any) {
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        return wallet;
    }

    getWalletAddress(keyPair: any, bounceable = true): string {
        const wallet = this.getWalletContract(keyPair);
        return wallet.address.toString({ testOnly: true, bounceable });
    }

    async getBalance(address: string): Promise<number> {
        try {
            const parsedAddress = Address.parse(address);
            const balance = await this.client.getBalance(parsedAddress);
            return Number(balance) / 1e9; // Конвертация из nanoTON в TON
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

            return true;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }
}
const tonServiceNode = new TonServiceNode();

async function getWalletInfo() {
    try {
        const mnemonic = cryptoServiceNode.decryptMnemonic(encryptedMnemonic, password);
        console.log('Decrypted Mnemonic:', mnemonic.join(' '));
        
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        const address = tonServiceNode.getWalletAddress(keyPair);
        console.log('Wallet Address:', address);

        const balance = await tonServiceNode.getBalance(address);
        console.log('Wallet Balance:', balance, 'TON');

        return { keyPair, address, balance };
    } catch (e: any) {
        console.error('Error during wallet info retrieval:', e.message);
        return null;
    }
}

getWalletInfo();