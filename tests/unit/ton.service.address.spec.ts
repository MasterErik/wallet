/**
 * @vitest-environment node
 */
import { describe, it, vi, expect } from 'vitest';
import { TonService } from '@/services/ton.service';
import { mnemonicToPrivateKey } from '@ton/crypto';

let service = new TonService();
const testMnemonic = 'mix pull wagon pave believe venture mirror baby mom brave fuel wool upgrade spirit give syrup swallow feed swap suspect hidden social resist easy'.split(' ');
const base64Address = 'kQATCjGpJRgV5om4c_p-xIeLo5zSupGwiTqAZU64NjgNL3eU';

describe('TonService - Address Calculation', () => {

    it('должен правильно вычислять адрес кошелька WalletV4R2', async () => {
        const keyPair = await mnemonicToPrivateKey(testMnemonic);
        const address = service.getWalletAddress(keyPair);
        expect(address).toBe(base64Address);
    });

    it('должен возвращать баланс (число) для валидного адреса', async () => {
        const balance = await service.getBalance(base64Address);
        expect(typeof balance).toBe('number');
        expect(balance).toBeGreaterThanOrEqual(0);
    });

    it('getBalance должен выбрасывать ошибку, если API недоступно', async () => {
        vi.spyOn(service['client'], 'getBalance').mockRejectedValue(new Error('Network Error'));

        // Теперь мы ожидаем ошибку, а не 0
        await expect(service.getBalance(base64Address)).rejects.toThrow('Network Error');
    });

    it('должен корректно парсить список транзакций (даже если он пустой)', async () => {
        const txs = await service.getTransactions(base64Address, 5);
        expect(Array.isArray(txs)).toBe(true);
    }, 20000);

    it('должен проверять валидность TON адреса', () => {
        expect(service.isValidAddress(base64Address)).toBe(true);
        expect(service.isValidAddress('invalid_address')).toBe(false);
        expect(service.isValidAddress('')).toBe(false);
    });

    it('должен возвращать false для флага bounce на неинициализированных кошельках', async () => {
        const emptyAddress = 'kQATCjGpJRgV5om4c_p-xIeLo5zSupGwiTqAZU64NjgNL3eU';
        const bounceFlag = await service.getBounceFlag(emptyAddress);
        expect(bounceFlag).toBe(false);
    });
});
