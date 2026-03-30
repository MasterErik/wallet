import { TonClient, WalletContractV4, internal, SendMode } from '@ton/ton';
import { KeyPair } from '@ton/crypto';
import { Address } from '@ton/core';

// Используем значения из .env
const TONCENTER_ENDPOINT = import.meta.env.VITE_TONCENTER_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC';
const TONCENTER_API_KEY = import.meta.env.VITE_TONCENTER_API_KEY || '';

export interface ParsedTransaction {
    id: string;
    type: 'in' | 'out' | 'bounced';
    amount: number;
    date: string;
    address: string;
    hash: string;
    status: 'success' | 'failed' | 'pending';
}

export class TonService {
    private client: TonClient;

    constructor() {
        this.client = new TonClient({
            endpoint: TONCENTER_ENDPOINT,
            apiKey: TONCENTER_API_KEY,
        });
    }

    /**
     * Возвращает флаг bounce для адреса. Если адрес не инициализирован в сети,
     * принудительно возвращает false, чтобы избежать потери средств на комиссиях.
     */
    async getBounceFlag(toAddress: string): Promise<boolean> {
        try {
            const parsed = Address.parseFriendly(toAddress);
            const state = await this.client.getContractState(parsed.address);
            
            // Если у контракта нет кода или данных, он считается неинициализированным
            if (!state.code || !state.data) {
                return false;
            }
            
            // Если аккаунт активен, доверяем флагу из адреса
            return parsed.isBounceable;
        } catch (error) {
            console.error('Failed to get contract state for bounce flag', error);
            return true; // По умолчанию безопасно
        }
    }

    /**
     * Создает объект контракта кошелька (Wallet V4 R2) из пары ключей
     */
    getWalletContract(keyPair: KeyPair) {
        // v4R2 - текущий стандартный кошелек TON
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        return wallet;
    }

    /**
     * Возвращает Base64 Bounceable/Non-bounceable адрес кошелька
     */
    getWalletAddress(keyPair: KeyPair, bounceable = true): string {
        const wallet = this.getWalletContract(keyPair);
        // toString(isBounceable, isTestOnly)
        return wallet.address.toString({ testOnly: true, bounceable });
    }

    /**
     * Запрашивает текущий баланс кошелька (в нано-тонах) и возвращает в TON
     */
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

    /**
     * Проверяет, валидна ли строка как TON адрес
     */
    isValidAddress(address: string): boolean {
        try {
            Address.parse(address);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Запрашивает и парсит последние транзакции кошелька
     */
    async getTransactions(address: string, limit = 20): Promise<ParsedTransaction[]> {
        try {
            const parsedAddress = Address.parse(address);
            const txs = await this.client.getTransactions(parsedAddress, { limit });

            return txs.map(tx => {
                const inMsg = tx.inMessage;
                let type: 'in' | 'out' | 'bounced' = 'in';
                let amount = 0n;
                let counterparty = '';

                if (inMsg && inMsg.info.type === 'internal') {
                    if (inMsg.info.bounced) {
                        type = 'bounced';
                        amount = inMsg.info.value.coins;
                        counterparty = inMsg.info.src.toString({ testOnly: true });
                    } else {
                        type = 'in';
                        amount = inMsg.info.value.coins;
                        counterparty = inMsg.info.src.toString({ testOnly: true });
                    }
                } else if (tx.outMessages.size > 0) {
                    type = 'out';
                    const outMsg = tx.outMessages.values()[0];
                    if (outMsg?.info.type === 'internal') {
                        amount = outMsg.info.value.coins;
                        counterparty = outMsg.info.dest.toString({ testOnly: true });
                    }
                }

                return {
                    id: tx.hash().toString('hex'), // Уникальный ID
                    hash: tx.hash().toString('hex'),
                    type: type,
                    amount: Number(amount) / 1e9,
                    date: new Date(tx.now * 1000).toISOString(),
                    address: counterparty,
                    status: (tx.description.type === 'generic' && tx.description.computePhase?.type === 'vm' && tx.description.computePhase.success ? 'success' : 'failed') as 'success' | 'failed'
                };
            }).filter(tx => tx.amount > 0); // Убираем технические транзакции с нулевой суммой

        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            return [];
        }
    }

    /**
     * Отправляет TON на указанный адрес
     */
    /**
     * Оценивает комиссию транзакции в TON
     */
    async estimateFee(
        keyPair: KeyPair,
        toAddress: string,
        amountInTon: number,
        message?: string
    ): Promise<number> {
        const DEFAULT_FEE = 0.01;
        try {
            const wallet = this.getWalletContract(keyPair);
            const contract = this.client.open(wallet);
            
            // Если баланс 0, симуляция на ноде часто падает с 500 ошибкой
            const balance = await contract.getBalance().catch(() => 0n);
            if (balance === 0n) {
                return DEFAULT_FEE;
            }

            const seqno = await contract.getSeqno().catch(() => 0);
            const bounce = await this.getBounceFlag(toAddress);

            const transfer = wallet.createTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [
                    internal({
                        to: Address.parse(toAddress),
                        value: amountInTon.toString(),
                        body: message || undefined,
                        bounce
                    })
                ],
                sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            });

            const result = await this.client.estimateExternalMessageFee(wallet.address, {
                body: transfer,
                initCode: seqno === 0 ? wallet.init.code ?? null : null,
                initData: seqno === 0 ? wallet.init.data ?? null : null,
                ignoreSignature: false
            });

            if (!result || !result.source_fees) {
                return DEFAULT_FEE;
            }

            const totalFee = (result.source_fees.inFwdFee || 0n) + 
                             (result.sourceFees.storageFee || 0n) + 
                             (result.sourceFees.gasFee || 0n) + 
                             (result.sourceFees.fwdFee || 0n);

            return Number(totalFee) / 1e9;
        } catch (error) {
            // Не логируем Axios 500 ошибки как критические, так как это ожидаемо для неинициализированных аккаунтов
            return DEFAULT_FEE;
        }
    }

    async sendTransaction(
        keyPair: KeyPair,
        toAddress: string,
        amountInTon: number,
        message?: string
    ): Promise<boolean> {
        try {
            const wallet = this.getWalletContract(keyPair);
            const contract = this.client.open(wallet);
            const seqno = await contract.getSeqno();
            const bounce = await this.getBounceFlag(toAddress);

            await contract.sendTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [
                    internal({
                        to: Address.parse(toAddress),
                        value: amountInTon.toString(), // amount in TON (string) is parsed correctly by internal()
                        body: message || undefined,
                        bounce
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

    /**
     * Ожидает изменения seqno (подтверждения транзакции)
     */
    async waitForTransaction(keyPair: KeyPair, initialSeqno: number, maxAttempts = 15): Promise<boolean> {
        const wallet = this.getWalletContract(keyPair);
        const contract = this.client.open(wallet);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Ждем 3 секунды
            try {
                const currentSeqno = await contract.getSeqno();
                if (currentSeqno > initialSeqno) {
                    return true; // Транзакция подтверждена
                }
            } catch (e) {
                // Игнорируем ошибки сети при поллинге
            }
        }
        return false; // Тайм-аут
    }
}

export const tonService = new TonService();
