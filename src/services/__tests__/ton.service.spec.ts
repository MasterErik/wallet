import { describe, it, expect, vi } from 'vitest';
import { tonService } from '../ton.service';
import { mnemonicToPrivateKey } from '@ton/crypto';

describe('TonService (TONCENTER Integration)', () => {

    // Устанавливаем таймаут для всех тестов в этом блоке
    vi.setConfig({ testTimeout: 30000 });

    // Возьмем гарантированно валидный Base64 адрес (Bounceable Testnet)
    const base64Address = 'kQBZsCriNthf8iXSYs3733LuDcR5pKkwcmIuahoi5exKdbJw';

    const testMnemonic = [
        'notice', 'rookie', 'clutch', 'poverty', 'pink', 'justice',
        'dune', 'pave', 'identity', 'motto', 'civil', 'found',
        'inner', 'heart', 'rely', 'humor', 'diet', 'lumber',
        'pioneer', 'unfold', 'fringe', 'album', 'rely', 'abandon'
    ];

    it('должен правильно вычислять адрес кошелька WalletV4R2', async () => {
        const keyPair = await mnemonicToPrivateKey(testMnemonic);
        const address = tonService.getWalletAddress(keyPair);

        expect(address).toBe(base64Address);
    });

    it('должен возвращать баланс (число) для валидного адреса', async () => {
        // Мы используем наш сгенерированный адрес
        const balance = await tonService.getBalance(base64Address);

        expect(typeof balance).toBe('number');
        expect(balance).toBeGreaterThanOrEqual(0);
        console.log(`Balance for ${base64Address}: ${balance} TON`);
    });

    it('должен корректно парсить список транзакций (даже если он пустой)', async () => {
        const txs = await tonService.getTransactions(base64Address, 5);

        expect(Array.isArray(txs)).toBe(true);
        console.log(`Found ${txs.length} transactions for ${base64Address}`);
    }, 20000);

    it('должен проверять валидность TON адреса', () => {
        expect(tonService.isValidAddress(base64Address)).toBe(true);
        expect(tonService.isValidAddress('invalid_address')).toBe(false);
        expect(tonService.isValidAddress('')).toBe(false);
    });

});
