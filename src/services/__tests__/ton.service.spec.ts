import { describe, it, expect, vi } from 'vitest';
import { tonService } from '../ton.service';
import { mnemonicToPrivateKey } from '@ton/crypto';

describe('TonService (TONCENTER Integration)', () => {

    vi.setConfig({ testTimeout: 30000 });

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
        const balance = await tonService.getBalance(base64Address);
        expect(typeof balance).toBe('number');
        expect(balance).toBeGreaterThanOrEqual(0);
    });

    it('должен корректно парсить список транзакций (даже если он пустой)', async () => {
        const txs = await tonService.getTransactions(base64Address, 5);
        expect(Array.isArray(txs)).toBe(true);
    }, 20000);

    it('должен проверять валидность TON адреса', () => {
        expect(tonService.isValidAddress(base64Address)).toBe(true);
        expect(tonService.isValidAddress('invalid_address')).toBe(false);
        expect(tonService.isValidAddress('')).toBe(false);
    });

    it('должен возвращать false для флага bounce на неинициализированных кошельках', async () => {
        const emptyAddress = 'kQATCjGpJRgV5om4c_p-xIeLo5zSupGwiTqAZU64NjgNL3eU';
        const bounceFlag = await tonService.getBounceFlag(emptyAddress);
        expect(bounceFlag).toBe(false);
    });

});
