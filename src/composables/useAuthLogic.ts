import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWalletManagerStore } from '@/store/wallet-manager.store';
import { useActiveWalletStore } from '@/store/active-wallet.store';
import { cryptoService } from '@/services/crypto.service';

function useAuthLogic() {
  const router = useRouter();
  const walletManager = useWalletManagerStore();
  const activeWallet = useActiveWalletStore();

  const mode = ref<'select' | 'create' | 'import' | 'unlock' | 'manage'>('select');
  const password = ref('');
  const confirmPassword = ref('');
  const mnemonic = ref<string[]>([]);
  const importMnemonicStr = ref('');
  const error = ref('');
  const isLoading = ref(false);
  const walletName = ref('');
  const selectedWalletIndex = ref(walletManager.currentWalletIndex);

  onMounted(() => {
    if (walletManager.hasWallet) {
      mode.value = 'manage';
      selectedWalletIndex.value = walletManager.currentWalletIndex !== -1 ? walletManager.currentWalletIndex : 0;
    } else {
      mode.value = 'select';
    }
  });

  const isPasswordValid = computed(() => password.value.length >= 8);

  const resetForm = () => {
    password.value = '';
    confirmPassword.value = '';
    error.value = '';
    walletName.value = '';
    importMnemonicStr.value = '';
    mnemonic.value = [];
  };

  const startCreating = async () => {
    isLoading.value = true;
    error.value = '';
    try {
      mnemonic.value = await cryptoService.generateMnemonic();
      mode.value = 'create';
    } catch (err) {
      error.value = 'Failed to generate mnemonic.';
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  };

  const createOrImportWallet = async () => {
    isLoading.value = true;
    error.value = '';

    if (!isPasswordValid.value) {
      error.value = 'Password must be at least 8 characters';
      isLoading.value = false;
      return;
    }
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match';
      isLoading.value = false;
      return;
    }

    const finalMnemonic = mode.value === 'create' ? mnemonic.value : importMnemonicStr.value.trim().split(/\s+/);

    if (finalMnemonic.length !== 24) {
      error.value = 'Mnemonic phrase must contain 24 words.';
      isLoading.value = false;
      return;
    }

    try {
      const isValidMnemonic = await cryptoService.validateMnemonic(finalMnemonic);
      if (!isValidMnemonic) {
        error.value = 'Invalid mnemonic phrase.';
        isLoading.value = false;
        return;
      }

      await walletManager.registerWallet(finalMnemonic, password.value, walletName.value || undefined);
      resetForm();
      await activeWallet.unlockWallet(walletManager.currentWalletIndex, password.value);
      router.push('/home');
    } catch (err: any) {
      error.value = err.message || 'Failed to create or import wallet.';
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  };

  const confirmDeleteWallet = (index: number) => {
    if (confirm('Are you sure you want to delete this wallet? This action cannot be undone.')) {
      walletManager.deleteWallet(index);
      if (!walletManager.hasWallet) {
        mode.value = 'select';
      }
    }
  };

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message) {
      return err.message;
    }

    return 'An unknown error occurred.';
  }

  const unlockSelectedWallet = async () => {
    if (selectedWalletIndex.value === -1) {
      error.value = 'No wallet selected for unlock.';
      return;
    }

    isLoading.value = true;

    try {
      await activeWallet.unlockWallet(selectedWalletIndex.value, password.value);
      error.value = '';
      resetForm();
      await router.push('/home');
    } catch (err: unknown) {
      error.value = getErrorMessage(err) || 'Failed to unlock wallet. Incorrect password?';
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  };

  const selectWallet = (index: number) => {
    walletManager.selectWallet(index);
    mode.value = 'unlock';
    resetForm();
  };

  return {
    mode,
    password,
    confirmPassword,
    mnemonic,
    importMnemonicStr,
    error,
    isLoading,
    walletName,
    selectedWalletIndex,
    isPasswordValid,
    startCreating,
    createOrImportWallet,
    confirmDeleteWallet,
    unlockSelectedWallet,
    selectWallet,
    walletManager, // Expose walletManager for template access
    activeWallet, // Expose activeWallet for template access
  };
}

export default useAuthLogic
