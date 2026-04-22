/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWalletManagerStore } from '@/store/wallet-manager.store';
import { cryptoService } from '@/services/crypto.service';
import { useActiveWalletStore } from '@/store/active-wallet.store';

describe('Wallet Manager Store (Multi-wallet logic)', () => {
  let testMnemonic: string[];
  let testPassword: string;
  let testMnemonic2: string[];
  let testPassword2: string;

  beforeEach(async () => { // beforeEach теперь асинхронный
    setActivePinia(createPinia());
    localStorage.clear(); // Очистка localStorage выполняется в setup.ts
    vi.restoreAllMocks();

    // Генерируем реальные мнемоники для тестов
    testMnemonic = await cryptoService.generateMnemonic();
    testPassword = 'strong-password-123';

    testMnemonic2 = await cryptoService.generateMnemonic();
    testPassword2 = 'another-strong-password-456';
  });

  it('должен быть пустым при инициализации, если нет сохраненных кошельков', () => {
    const managerStore = useWalletManagerStore();
    expect(managerStore.savedWallets.length).toBe(0);
    expect(managerStore.hasWallet).toBe(false);
    expect(managerStore.currentWalletIndex).toBe(-1);
  });

  it('должен зарегистрировать кошелек, зашифровать его и сделать активным', async () => {
        const managerStore = useWalletManagerStore();

        await managerStore.registerWallet(testMnemonic, testPassword, 'Test Wallet');

        expect(managerStore.savedWallets.length).toBe(1);
        expect(managerStore.savedWallets[0].name).toBe('Test Wallet');
        expect(managerStore.savedWallets[0].address).toMatch(/^(EQ|Ef|kQ|kf)/);
        expect(managerStore.currentWalletIndex).toBe(0);
    });

    it('не должен создавать дубликат, если адрес уже существует', async () => {
        const managerStore = useWalletManagerStore();

        // Используем одну и ту же мнемонику для проверки дедупликации
        await managerStore.registerWallet(testMnemonic, testPassword);
        await managerStore.registerWallet(testMnemonic, testPassword);

        expect(managerStore.savedWallets.length).toBe(1);
    });

    it('должен позволять переключаться между кошельками', async () => {
        const managerStore = useWalletManagerStore();

        await managerStore.registerWallet(testMnemonic, testPassword, 'Wallet 1');
        await managerStore.registerWallet(testMnemonic2, testPassword2, 'Wallet 2');

        expect(managerStore.savedWallets.length).toBe(2);
        expect(managerStore.currentWalletIndex).toBe(1); // Последний созданный активен

        managerStore.selectWallet(0);
        expect(managerStore.currentWalletIndex).toBe(0);
        expect(managerStore.currentWallet?.name).toBe('Wallet 1');

        managerStore.selectWallet(1);
        expect(managerStore.currentWalletIndex).toBe(1);
        expect(managerStore.currentWallet?.name).toBe('Wallet 2');
    });

    it('должен корректно обрабатывать удаление активного кошелька', async () => {
        const managerStore = useWalletManagerStore();

        await managerStore.registerWallet(testMnemonic, testPassword, 'Wallet A');
        await managerStore.registerWallet(testMnemonic2, testPassword2, 'Wallet B');

        // Wallet B активен (индекс 1). Удаляем его.
        managerStore.deleteWallet(1);

        expect(managerStore.savedWallets.length).toBe(1);
        expect(managerStore.savedWallets[0].name).toBe('Wallet A');
        expect(managerStore.currentWalletIndex).toBe(0); // Активным должен стать первый оставшийся
    });

    it('должен устанавливать currentWalletIndex в -1 при удалении последнего кошелька', async () => {
        const managerStore = useWalletManagerStore();

        await managerStore.registerWallet(testMnemonic, testPassword, 'Single Wallet');
        expect(managerStore.savedWallets.length).toBe(1);
        expect(managerStore.currentWalletIndex).toBe(0);

        managerStore.deleteWallet(0);

        expect(managerStore.savedWallets.length).toBe(0);
        expect(managerStore.hasWallet).toBe(false);
        expect(managerStore.currentWalletIndex).toBe(-1);
    });

    it('должен корректно обрабатывать удаление неактивного кошелька', async () => {
        const managerStore = useWalletManagerStore();

        await managerStore.registerWallet(testMnemonic, testPassword, 'Wallet Alpha'); // index 0
        await managerStore.registerWallet(testMnemonic2, testPassword2, 'Wallet Beta');  // index 1, активен

        expect(managerStore.currentWalletIndex).toBe(1);

        // Удаляем неактивный кошелек (индекс 0)
        managerStore.deleteWallet(0);

        expect(managerStore.savedWallets.length).toBe(1);
        expect(managerStore.savedWallets[0].name).toBe('Wallet Beta'); // Wallet Beta теперь по индексу 0
        expect(managerStore.currentWalletIndex).toBe(0); // Активный индекс должен был обновиться, если удален более ранний кошелек
    });

    // Тест на разблокировку/блокировку
    it('должен корректно разблокировать и блокировать кошелек', async () => {
        const managerStore = useWalletManagerStore();
        const activeStore = useActiveWalletStore();

        await managerStore.registerWallet(testMnemonic, testPassword, 'Main Wallet');
        expect(activeStore.isUnlocked).toBe(false);

        await activeStore.unlockWallet(managerStore.currentWalletIndex, testPassword);
        expect(activeStore.isUnlocked).toBe(true);
        expect(activeStore.address).toBe(managerStore.currentWallet?.address);
        // Удалено: expect(activeStore.password).toBe(testPassword); // active-wallet.store не хранит пароль

        activeStore.lockWallet();
        expect(activeStore.isUnlocked).toBe(false);
        expect(activeStore.address).toBe('');
    });

});
