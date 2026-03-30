import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { cryptoService } from '../services/crypto.service';
import { tonService } from '../services/ton.service';

export interface StoredWallet {
  name: string;
  address: string;
  encryptedMnemonic: string;
}

const LOCAL_STORAGE_KEY_WALLETS = 'saved_wallets';
const LOCAL_STORAGE_KEY_CURRENT_INDEX = 'current_wallet_index';

export const useWalletManagerStore = defineStore('walletManager', () => {
  // Инициализация состояния из localStorage
  const savedWalletsRaw = localStorage.getItem(LOCAL_STORAGE_KEY_WALLETS);
  const initialSavedWallets: StoredWallet[] = savedWalletsRaw ? JSON.parse(savedWalletsRaw) : [];
  const initialCurrentIndex = Number(localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_INDEX) || 0);
  const validIndex = initialSavedWallets.length > 0 ? Math.min(initialCurrentIndex, initialSavedWallets.length - 1) : -1;

  // Реактивное состояние
  const savedWallets = ref<StoredWallet[]>(initialSavedWallets);
  const currentWalletIndex = ref<number>(validIndex);

  // Геттеры
  const hasWallet = computed(() => savedWallets.value.length > 0);
  const currentWallet = computed(() => currentWalletIndex.value !== -1 ? savedWallets.value[currentWalletIndex.value] : null);

  // Автоматическая синхронизация с localStorage при любом изменении состояния
  watch(
    [savedWallets, currentWalletIndex],
    ([newWallets, newIndex]) => {
      localStorage.setItem(LOCAL_STORAGE_KEY_WALLETS, JSON.stringify(newWallets));
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_INDEX, newIndex.toString());
    },
    { deep: true } // deep нужен для отслеживания изменений внутри массива savedWallets
  );

  // Экшены
  const createNewWallet = async (password: string, name?: string): Promise<string[]> => {
    const mnemonic = await cryptoService.generateMnemonic();
    const walletName = name || `Wallet ${savedWallets.value.length + 1}`;
    
    const encrypted = cryptoService.encryptMnemonic(mnemonic, password);
    const keyPair = await cryptoService.getKeyPair(mnemonic);
    const address = tonService.getWalletAddress(keyPair); 

    const newWallet: StoredWallet = { name: walletName, address, encryptedMnemonic: encrypted };
    savedWallets.value.push(newWallet);
    currentWalletIndex.value = savedWallets.value.length - 1;
    
    return mnemonic;
  };

  const importExistingWallet = async (mnemonic: string[], password: string, name?: string): Promise<void> => {
    const isValid = await cryptoService.validateMnemonic(mnemonic);
    if (!isValid) throw new Error('Invalid mnemonic phrase');
    
    const walletName = name || `Wallet ${savedWallets.value.length + 1}`;
    const encrypted = cryptoService.encryptMnemonic(mnemonic, password);
    const keyPair = await cryptoService.getKeyPair(mnemonic);
    const address = tonService.getWalletAddress(keyPair); 

    const newWallet: StoredWallet = { name: walletName, address, encryptedMnemonic: encrypted };
    savedWallets.value.push(newWallet);
    currentWalletIndex.value = savedWallets.value.length - 1;
  };

  const selectWallet = (index: number) => {
    if (index < 0 || index >= savedWallets.value.length) throw new Error('Wallet not found');
    currentWalletIndex.value = index;
  };

  const deleteWallet = (index: number) => {
    if (index < 0 || index >= savedWallets.value.length) throw new Error('Wallet not found');
    
    savedWallets.value.splice(index, 1);
    
    if (savedWallets.value.length === 0) {
      currentWalletIndex.value = -1;
    } else {
      if (currentWalletIndex.value >= savedWallets.value.length) {
        currentWalletIndex.value = savedWallets.value.length - 1;
      }
    }
  };

  return {
    savedWallets,
    currentWalletIndex,
    hasWallet,
    currentWallet,
    createNewWallet,
    importExistingWallet,
    selectWallet,
    deleteWallet
  };
});
