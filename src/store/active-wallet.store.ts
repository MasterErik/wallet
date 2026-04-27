import {defineStore} from 'pinia';
import {ref, watch} from 'vue';
import {cryptoService} from '../services/crypto.service';
import {ParsedTransaction, tonService} from '../services/ton.service';
import {KeyPair, mnemonicToPrivateKey} from '@ton/crypto';
import {useWalletManagerStore} from './wallet-manager.store';

const LOCAL_STORAGE_KEY_WHITELIST = 'wallet_whitelist_';

export const useActiveWalletStore = defineStore('activeWallet', () => {
  // Состояние
  const isUnlocked = ref(false);
  const address = ref('');
  const balance = ref(0);
  const transactions = ref<ParsedTransaction[]>([]);
  const whitelist = ref<string[]>([]);
  const isLoadingData = ref(false);
  const dataError = ref<string | null>(null);
  const keyPair = ref<KeyPair | null>(null);

  // Автоматическая синхронизация whitelist с localStorage
  watch(
    [whitelist, address],
    ([newWhitelist, currentAddress]) => {
      if (currentAddress) {
        localStorage.setItem(LOCAL_STORAGE_KEY_WHITELIST + currentAddress, JSON.stringify(newWhitelist));
      }
    },
    { deep: true }
  );

  // Экшены
  const loadWhitelist = () => {
    if (address.value) {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY_WHITELIST + address.value);
        whitelist.value = saved ? JSON.parse(saved) : [];
    } else {
        whitelist.value = [];
    }
  };

  const unlockWallet = async (index: number, password: string) => {
    const manager = useWalletManagerStore();
    if (index < 0 || index >= manager.savedWallets.length) throw new Error('Wallet not found');

    const wallet = manager.savedWallets[index];
    try {
      const mnemonic = cryptoService.decryptMnemonic(wallet.encryptedMnemonic, password);
      keyPair.value = await mnemonicToPrivateKey(mnemonic);
      isUnlocked.value = true;
      address.value = wallet.address;
      dataError.value = null;

      manager.selectWallet(index);
      loadWhitelist();
      return true;
    } catch (e) {
      throw new Error('Invalid password');
    }
  };

  const lockWallet = () => {
    isUnlocked.value = false;
    keyPair.value = null;
    address.value = ''; // Очищаем адрес при блокировке
    balance.value = 0;
    transactions.value = [];
    whitelist.value = [];
    dataError.value = null;
  };

  const refreshWalletData = async () => {
    if (!address.value) return;

    isLoadingData.value = true;
    dataError.value = null; // Сбрасываем предыдущую ошибку

    try {
      // Если любой из запросов упадет, мы попадем в блок catch
      const [newBalance, newTransactions] = await Promise.all([
        tonService.getBalance(address.value),
        tonService.getTransactions(address.value, 50)
      ]);

      // Данные обновляются только при успешном ответе сети
      balance.value = newBalance;
      transactions.value = newTransactions;
    } catch (error: any) {
      console.error('Failed to refresh wallet data', error);
      // Теперь здесь будет реальное сообщение об ошибке (например, "Network Error")
      // Это установит баннер в UI через переменную dataError
      dataError.value = error?.message || 'Failed to fetch network data';
    } finally {
      isLoadingData.value = false;
    }
  };

  const addToWhitelist = (addr: string) => {
    if (!whitelist.value.includes(addr)) {
      whitelist.value.push(addr);
    }
  };

  return {
    isUnlocked,
    address,
    balance,
    transactions,
    whitelist,
    isLoadingData,
    dataError,
    keyPair,
    unlockWallet,
    lockWallet,
    refreshWalletData,
    addToWhitelist,
    loadWhitelist
  };
});
