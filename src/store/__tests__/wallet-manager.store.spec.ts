/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWalletManagerStore } from '../wallet-manager.store';

// Мокаем зависимости
vi.mock('../../services/crypto.service', () => ({
  cryptoService: {
    generateMnemonic: vi.fn().mockResolvedValue(['word1', 'word2']),
    validateMnemonic: vi.fn().mockResolvedValue(true),
    encryptMnemonic: vi.fn().mockReturnValue('encrypted_data'),
    decryptMnemonic: vi.fn().mockReturnValue(['word1', 'word2']),
    getKeyPair: vi.fn().mockResolvedValue({ publicKey: Buffer.from(''), secretKey: Buffer.from('') })
  }
}));

vi.mock('../../services/ton.service', () => ({
  tonService: {
    getWalletAddress: vi.fn().mockReturnValue('EQ_TEST_ADDRESS'),
    getBalance: vi.fn().mockResolvedValue(0),
    getTransactions: vi.fn().mockResolvedValue([])
  }
}));

describe('Wallet Manager Store (Multi-wallet logic)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('должен быть пустым при инициализации', () => {
    const store = useWalletManagerStore();
    expect(store.savedWallets.length).toBe(0);
    expect(store.hasWallet).toBe(false);
  });

  it('должен корректно добавлять новый кошелек', async () => {
    const store = useWalletManagerStore();
    await store.createNewWallet('password123', 'My Wallet');
    
    expect(store.savedWallets.length).toBe(1);
    expect(store.savedWallets[0].name).toBe('My Wallet');
    expect(store.hasWallet).toBe(true);
  });

  it('должен позволять переключаться между кошельками', async () => {
    const store = useWalletManagerStore();
    // Создаем два кошелька
    await store.createNewWallet('password', 'W1');
    await store.createNewWallet('password', 'W2');
    
    expect(store.savedWallets.length).toBe(2);
    expect(store.currentWalletIndex).toBe(1); // Последний созданный активен
    
    // Переключаемся на первый
    store.selectWallet(0);
    expect(store.currentWalletIndex).toBe(0);
  });

  it('должен корректно обрабатывать удаление активного кошелька', async () => {
    const store = useWalletManagerStore();
    await store.createNewWallet('password', 'W1');
    await store.createNewWallet('password', 'W2');
    
    // Текущий индекс 1 (W2). Удаляем его.
    store.deleteWallet(1);
    
    expect(store.savedWallets.length).toBe(1);
    expect(store.currentWalletIndex).toBe(0);
    expect(store.savedWallets[0].name).toBe('W1');
  });

  it('должен полностью очищаться при удалении последнего кошелька', async () => {
    const store = useWalletManagerStore();
    await store.createNewWallet('password', 'W1');
    store.deleteWallet(0);
    
    expect(store.savedWallets.length).toBe(0);
    expect(store.hasWallet).toBe(false);
    expect(store.currentWalletIndex).toBe(-1);
  });
});