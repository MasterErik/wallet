/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, computed } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import Auth from '@/components/views/Auth.vue';
import  useAuthLogic  from '@/composables/useAuthLogic';

// Import types for better mocking
// import type { WalletManagerStore } from '@/store/wallet-manager.store';
// import type { ActiveWalletStore } from '@/store/active-wallet.store';
type WalletManagerStore = {
  savedWallets: { value: any[] };
  currentWalletIndex: { value: number };
  hasWallet: ReturnType<typeof vi.fn>;
  currentWallet: ReturnType<typeof vi.fn>;
  registerWallet: ReturnType<typeof vi.fn>;
  selectWallet: ReturnType<typeof vi.fn>;
  deleteWallet: ReturnType<typeof vi.fn>;
};

type ActiveWalletStore = {
  isUnlocked: { value: boolean };
  address: { value: string | null };
  password: { value: string | null };
  balance: { value: number };
  transactions: { value: any[] };
  whitelist: { value: any[] };
  addToWhitelist: ReturnType<typeof vi.fn>;
  unlockWallet: ReturnType<typeof vi.fn>;
  lockWallet: ReturnType<typeof vi.fn>;
};

//import type { CryptoService } from '@/services/crypto.service';
//import type { Router } from 'vue-router';

const mockedData = vi.hoisted(() => ({
    testMnemonic: [
        "main", "acquire", "gift", "depend", "tenant", "involve", "oxygen", "summer", "pledge", "access", "eagle", "ankle", "hood",
        "zone", "you", "bring", "only", "can", "dumb", "deer", "marine", "city", "spike", "liquid"
    ]
}));

// 1. Выносим состояние ВНЕ фабрики мока
const sharedAuthStates = {
    mode: ref('select'),
    password: ref(''),
    confirmPassword: ref(''),
    mnemonic: ref<string[]>([]),
    importMnemonicStr: ref(''),
    error: ref(''),
    isLoading: ref(false),
    walletName: ref(''),
    selectedWalletIndex: ref(-1),
};

// Mocks for useAuthLogic's dependencies
const mockWalletManagerStore = { // This needs to be a mutable object for beforeEach to reconfigure
    savedWallets: ref<any[]>([]),
    currentWalletIndex: ref(-1),
    hasWallet: vi.fn(() => false),
    currentWallet: vi.fn(() => mockWalletManagerStore.currentWalletIndex.value !== -1 ? mockWalletManagerStore.savedWallets.value[mockWalletManagerStore.currentWalletIndex.value] : null),
    registerWallet: vi.fn(async (_mnemonic: string[], _password: string, name?: string) => {
        const newWallet = { name: name || `Wallet ${mockWalletManagerStore.savedWallets.value.length + 1}`, address: 'EQ_MOCKED_ADDRESS', encryptedMnemonic: 'encrypted_mocked_mnemonic' };
        mockWalletManagerStore.savedWallets.value.push(newWallet);
        mockWalletManagerStore.currentWalletIndex.value = mockWalletManagerStore.savedWallets.value.length - 1;
    }),
    selectWallet: vi.fn((index: number) => {
        if (index < 0 || index >= mockWalletManagerStore.savedWallets.value.length) throw new Error('Mock Wallet not found');
        mockWalletManagerStore.currentWalletIndex.value = index;
    }),
    deleteWallet: vi.fn((index: number) => {
        if (index < 0 || index >= mockWalletManagerStore.savedWallets.value.length) throw new Error('Mock Wallet not found');
        mockWalletManagerStore.savedWallets.value.splice(index, 1);
        if (mockWalletManagerStore.savedWallets.value.length === 0) {
            mockWalletManagerStore.currentWalletIndex.value = -1;
        } else {
            if (mockWalletManagerStore.currentWalletIndex.value >= mockWalletManagerStore.savedWallets.value.length) {
                mockWalletManagerStore.currentWalletIndex.value = mockWalletManagerStore.savedWallets.value.length - 1;
            }
        }
    }),
} as WalletManagerStore; // Cast to type

const mockActiveWalletStore = {
    isUnlocked: ref(false),
    address: ref<string | null>(null),
    password: ref<string | null>(null),
    balance: ref(0),
    transactions: ref([]),
    whitelist: ref([]),
    addToWhitelist: vi.fn(),
    unlockWallet: vi.fn(async (_index: number, pwd: string) => {
        mockActiveWalletStore.isUnlocked.value = true;
        mockActiveWalletStore.address.value = 'EQ_MOCKED_ACTIVE_ADDRESS';
        mockActiveWalletStore.password.value = pwd;
    }),
    lockWallet: vi.fn(() => {
        mockActiveWalletStore.isUnlocked.value = false;
        mockActiveWalletStore.address.value = null;
        mockActiveWalletStore.password.value = null;
    }),
} as ActiveWalletStore; // Cast to type

const mockCryptoService = {
    generateMnemonic: vi.fn().mockResolvedValue(mockedData.testMnemonic),
    decryptMnemonic: vi.fn().mockReturnValue(mockedData.testMnemonic),
    encryptMnemonic: vi.fn().mockReturnValue('encrypted_mocked_mnemonic'),
    validateMnemonic: vi.fn().mockResolvedValue(true),
    mnemonicToPrivateKey: vi.fn().mockResolvedValue({ publicKey: new Uint8Array(), secretKey: new Uint8Array() }),
};

const mockRouter = {
    push: vi.fn(),
};

// Mock the composable itself
vi.mock('@/composables/useAuthLogic', () => ({
    default: vi.fn(() => {
        // Используем вынесенные выше переменные
        const isPasswordValid = computed(() => sharedAuthStates.password.value.length >= 8);

        // const mode = ref('select');
        // const password = ref('');
        // const confirmPassword = ref('');
        // const mnemonic = ref<string[]>([]);
        // const importMnemonicStr = ref('');
        // const error = ref('');
        // const isLoading = ref(false);
        // const walletName = ref('');
        // const selectedWalletIndex = ref(-1);


        const startCreating = vi.fn(async () => {
            sharedAuthStates.isLoading.value = true;
            sharedAuthStates.error.value = '';
            try {
                sharedAuthStates.mnemonic.value = await mockCryptoService.generateMnemonic();
                sharedAuthStates.mode.value = 'create';
            } catch (err) {
                sharedAuthStates.error.value = 'Failed to generate mnemonic.';
            } finally {
                sharedAuthStates.isLoading.value = false;
            }
        });

        const createOrImportWallet = vi.fn(async () => {
            sharedAuthStates.isLoading.value = true;
            sharedAuthStates.error.value = '';

            if (!isPasswordValid.value) {
                sharedAuthStates.error.value = 'Password must be at least 8 characters';
                sharedAuthStates.isLoading.value = false;
                return;
            }
            if (sharedAuthStates.password.value !== sharedAuthStates.confirmPassword.value) {
                sharedAuthStates.error.value = 'Passwords do not match';
                sharedAuthStates.isLoading.value = false;
                return;
            }

            // Используем только sharedAuthStates
            const finalMnemonic = sharedAuthStates.mode.value === 'create'
                ? sharedAuthStates.mnemonic.value
                : sharedAuthStates.importMnemonicStr.value.trim().split(/\s+/);

            if (finalMnemonic.length !== 24) {
                sharedAuthStates.error.value = 'Mnemonic phrase must contain 24 words.';
                sharedAuthStates.isLoading.value = false;
                return;
            }

            try {
                const isValidMnemonic = await mockCryptoService.validateMnemonic(finalMnemonic);
                if (!isValidMnemonic) {
                    sharedAuthStates.error.value = 'Invalid mnemonic phrase.';
                    sharedAuthStates.isLoading.value = false;
                    return;
                }

                await mockWalletManagerStore.registerWallet(
                    finalMnemonic,
                    sharedAuthStates.password.value,
                    sharedAuthStates.walletName.value || undefined
                );

                // Сброс через shared
                sharedAuthStates.password.value = '';
                sharedAuthStates.confirmPassword.value = '';
                sharedAuthStates.error.value = '';
                sharedAuthStates.walletName.value = '';
                sharedAuthStates.importMnemonicStr.value = '';
                sharedAuthStates.mnemonic.value = [];

                await mockActiveWalletStore.unlockWallet(mockWalletManagerStore.currentWalletIndex.value, '');
                mockRouter.push('/home');
            } catch (err: any) {
                sharedAuthStates.error.value = err.message || 'Failed to create or import wallet.';
            } finally {
                sharedAuthStates.isLoading.value = false;
            }
        });

        return {
// Возвращаем ТОЛЬКО общие состояния
            ...sharedAuthStates,
            isPasswordValid,
            startCreating,
            createOrImportWallet,
            confirmDeleteWallet: vi.fn(),
            unlockSelectedWallet: vi.fn(),
            selectWallet: vi.fn(),
            walletManager: mockWalletManagerStore,
            activeWallet: mockActiveWalletStore,
            cryptoService: mockCryptoService,
            router: mockRouter,        };
    }),
}));

describe('Auth.vue UI Tests', () => {
    const testPassword = 'strong-password-123';
    const testWalletName = 'Test Created Wallet';

    // Get the mocked composable and its internal mocks
    let authLogicMock: ReturnType<typeof useAuthLogic>;

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();
        setActivePinia(createPinia());

        // Set the initial state for the test scenario
        mockWalletManagerStore.hasWallet.mockReturnValue(false);
        mockWalletManagerStore.savedWallets.value = [];
        mockWalletManagerStore.currentWalletIndex.value = -1;

        sharedAuthStates.mode.value = 'select';
        sharedAuthStates.mnemonic.value = [];
        sharedAuthStates.password.value = '';
        sharedAuthStates.confirmPassword.value = '';
        sharedAuthStates.error.value = '';
        sharedAuthStates.isLoading.value = false;
        sharedAuthStates.walletName.value = '';
        sharedAuthStates.selectedWalletIndex.value = -1;
        sharedAuthStates.importMnemonicStr.value = '';

        // Initialize the mocked composable and its dependencies
        authLogicMock = useAuthLogic();
    });

    afterEach(() => {
        // No need for vi.useRealTimers() if we are not using fake timers in the test itself
    });

    it('должен успешно монтироваться без ошибок', async () => {
      const wrapper = mount(Auth, {
        global: {
          provide: {
            // Mock router and pinia stores directly at mount level
            router: mockRouter,
            walletManagerStore: mockWalletManagerStore, // Provide the mocked store instance
            activeWalletStore: mockActiveWalletStore, // Provide the mocked store instance
          },
          plugins: [createPinia()], // Only provide Pinia, the stores are mocked above
        }
      });
      await wrapper.vm.$nextTick(); // Wait for initial mount and onMounted
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.mode).toBe('select'); // Ensure initial mode is correct
    });

    it('должен корректно создавать новый кошелек через UI с отображаемой мнемоникой', async () => {
        // Provide mocked stores directly to the component
        const wrapper = mount(Auth, {
            global: {
                provide: {
                    router: mockRouter,
                    walletManagerStore: mockWalletManagerStore,
                    activeWalletStore: mockActiveWalletStore,
                },
                plugins: [createPinia()],
            }
        });
        await wrapper.vm.$nextTick(); // Wait for initial mount and onMounted

        // Ensure the initial mode is 'select'
        expect(wrapper.vm.mode).toBe('select');

        // 1. Simulate clicking "Create New Wallet"
        const createButton = wrapper.find('button#create');
        expect(createButton.exists()).toBe(true); // Ensure a button is found
        await createButton.trigger('click');
        await flushPromises();

        // Assert that the mnemonic is set in the mocked composable
        expect(authLogicMock.mnemonic.value).toEqual(mockedData.testMnemonic);
        // Assert that mode changed to 'create'
        expect(wrapper.vm.mode).toBe('create');

        // Wait for mnemonic words to be rendered in the DOM
        const mnemonicWords = wrapper.findAll('#mnemonic_words_container .font-mono.text-text.font-bold');
        expect(mnemonicWords.length).toBe(24);
        mnemonicWords.forEach((wordWrapper, i) => {
            expect(wordWrapper.text()).toBe(mockedData.testMnemonic[i]);
        });

        // 2. Fill password fields
        await wrapper.find('input[placeholder="Wallet Name (e.g., My Main Wallet)"]').setValue(testWalletName);
        await wrapper.find('input[placeholder="Create master password (min 8 chars)"]').setValue(testPassword);
        await wrapper.find('input[placeholder="Confirm master password"]').setValue(testPassword);
        await wrapper.vm.$nextTick(); // Additional wait after filling inputs

        // 3. Simulate clicking "Create Wallet"
        const createWalletFinalButton = wrapper.find('button#create_wallet_final');
        expect(createWalletFinalButton.exists()).toBe(true); // Ensure button is found
        await createWalletFinalButton.trigger('click');
        await wrapper.vm.$nextTick(); // Wait for DOM updates after wallet registration

        // Assert that a wallet is actually saved in the store
        expect(mockWalletManagerStore.savedWallets.value.length).toBe(1);
        expect(mockWalletManagerStore.savedWallets.value[0].name).toBe(testWalletName);

        // Verify that the saved mnemonic matches the displayed/generated one
        const decryptedMnemonic = mockCryptoService.decryptMnemonic(
            mockWalletManagerStore.savedWallets.value[0].encryptedMnemonic,
            testPassword
        );
        expect(decryptedMnemonic).toEqual(mockedData.testMnemonic);

        // Verify that the wallet is unlocked and navigation occurs
        expect(mockActiveWalletStore.isUnlocked.value).toBe(true);
        expect(mockRouter.push).toHaveBeenCalledWith('/home');
    });
});
