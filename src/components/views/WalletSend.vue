<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useActiveWalletStore } from '../../store/active-wallet.store';
import { tonService } from '../../services/ton.service';
import { addressGuard, RiskLevel, Evaluation } from '../../services/address-guard.service';
import Button from '../common/Button.vue';
import { 
    ArrowLeftIcon, 
    ExclamationTriangleIcon, 
    CheckCircleIcon,
    ShieldExclamationIcon,
    InformationCircleIcon,
    ArrowPathIcon
} from '@heroicons/vue/24/solid';
import { DocumentDuplicateIcon } from '@heroicons/vue/24/outline';

const activeWallet = useActiveWalletStore();
const router = useRouter();
const recipient = ref('');
const amount = ref<number | null>(null);
const isLoading = ref(false);
const showConfirm = ref(false);
const confirmPassword = ref('');
const error = ref('');
const evaluation = ref<Evaluation | null>(null);

// Динамически рассчитываемая комиссия сети
const estimatedFee = ref(0.01);
const isEstimatingFee = ref(false);

// Функция для пересчета комиссии
const updateFeeEstimate = async () => {
    if (!activeWallet.keyPair || !recipient.value || !tonService.isValidAddress(recipient.value)) {
        estimatedFee.value = 0.01; // Дефолтное значение
        return;
    }
    
    isEstimatingFee.value = true;
    try {
        const fee = await tonService.estimateFee(
            activeWallet.keyPair,
            recipient.value,
            amount.value || 0.001, // Минимум для валидной транзакции
            'Sent via Vue TON Wallet'
        );
        estimatedFee.value = Number(fee.toFixed(4));
    } catch (e) {
        console.error('Fee estimation failed, using fallback', e);
        estimatedFee.value = 0.01;
    } finally {
        isEstimatingFee.value = false;
    }
};

// Динамически проверяем адрес при вводе
watch(recipient, async (newAddr) => {
    if (!newAddr || newAddr.length < 16) {
        evaluation.value = null;
        return;
    }
    
    // Запускаем защиту от подмены (Spoofing)
    evaluation.value = addressGuard.evaluateAddress(
        newAddr, 
        activeWallet.transactions, 
        activeWallet.whitelist
    );

    // Обновляем оценку комиссии
    if (tonService.isValidAddress(newAddr)) {
        await updateFeeEstimate();
    }
});

// Если изменяется сумма, тоже обновляем (для больших сумм комиссия может незначительно меняться)
// Используем debounce или просто следим за потерей фокуса, но для MVP достаточно watch
watch(amount, async () => {
    if (recipient.value && tonService.isValidAddress(recipient.value)) {
         await updateFeeEstimate();
    }
});

// Валидация всей формы
const isInvalid = computed(() => {
    // 1. Проверяем валидность формата адреса через tonService
    if (!recipient.value || !tonService.isValidAddress(recipient.value)) return true;
    
    // 2. Проверяем сумму
    if (!amount.value || amount.value <= 0) return true;
    if (amount.value + estimatedFee.value > activeWallet.balance) return true;
    
    // 3. Блокируем отправку при критическом риске подмены, пока пользователь сам не разрешит (в модалке)
    // Но кнопку "Continue" мы оставляем активной, чтобы показать модалку подтверждения.
    return false;
});

const handleSendClick = () => {
    error.value = '';
    // Дополнительная проверка баланса
    if (amount.value && (amount.value + estimatedFee.value > activeWallet.balance)) {
        error.value = `Insufficient balance (including ~${estimatedFee.value} TON fee)`;
        return;
    }
    showConfirm.value = true;
};

const confirmTransaction = async () => {
    error.value = '';
    
    // 1. Проверяем пароль и разблокируем ключ
    try {
        // We shouldn't call activeWallet.unlockWallet here again if it's already unlocked. Wait, the original code called `await walletStore.unlockWallet(walletStore.currentWalletIndex, confirmPassword.value)`
        // activeWallet doesn't have currentWalletIndex, but it does have unlockWallet. Let's change this to use useWalletManagerStore to get the index.
        const { useWalletManagerStore } = await import('../../store/wallet-manager.store');
        const manager = useWalletManagerStore();
        await activeWallet.unlockWallet(manager.currentWalletIndex, confirmPassword.value);
    } catch (e) {
        error.value = 'Incorrect password';
        return;
    }

    if (!activeWallet.keyPair || !amount.value) {
        error.value = 'Wallet is not unlocked or amount is missing';
        return;
    }

    isLoading.value = true;
    try {
        const keyPair = activeWallet.keyPair;
        
        // 2. Получаем текущий seqno кошелька перед отправкой
        const walletContract = tonService.getWalletContract(keyPair);
        const contract = tonService['client'].open(walletContract); // используем публичный метод или обращаемся к client
        const initialSeqno = await contract.getSeqno().catch(() => 0); // Если кошелек пустой, seqno = 0

        // 3. Отправляем реальную транзакцию в Testnet
        await tonService.sendTransaction(
            keyPair,
            recipient.value,
            amount.value,
            'Sent via Vue TON Wallet' // Сообщение
        );

        // 4. Ожидаем подтверждения сетью (Поллинг)
        const isConfirmed = await tonService.waitForTransaction(keyPair, initialSeqno);
        
        if (isConfirmed) {
            // Успех! Добавляем в доверенные, если прошло успешно
            activeWallet.addToWhitelist(recipient.value);
            showConfirm.value = false;
            recipient.value = '';
            amount.value = null;
            confirmPassword.value = '';
            
            // Обновляем данные на главной
            await activeWallet.refreshWalletData();
            router.push('/home');
        } else {
            error.value = 'Transaction sent, but taking too long to confirm. Check your history later.';
            // Все равно возвращаем на главную, так как транзакция ушла в мемпул
            // Но сначала обновим данные, чтобы пользователь мог увидеть ее в ожидании
            await activeWallet.refreshWalletData();
            setTimeout(() => router.push('/home'), 3000);
        }
        
    } catch (e: any) {
        console.error(e);
        error.value = 'Transaction failed: ' + (e.message || 'Unknown error');
    } finally {
        isLoading.value = false;
    }
};

const setMaxAmount = () => {
    // Оставляем немного на комиссию, используя рассчитанную
    const max = activeWallet.balance - estimatedFee.value;
    amount.value = max > 0 ? parseFloat(max.toFixed(4)) : 0;
};

const pasteAddress = async () => {
    try {
        const text = await navigator.clipboard.readText();
        recipient.value = text;
    } catch (e) {
        console.error('Failed to read clipboard');
    }
};

onMounted(() => {
    if (!activeWallet.isUnlocked) router.push('/');
});
</script>

<template>
    <div class="flex flex-col h-full p-4 w-full max-w-md mx-auto pt-8">
        
        <div class="flex items-center gap-4 mb-6">
            <button @click="router.push('/home')" class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-white/10 transition-colors">
                <ArrowLeftIcon class="w-5 h-5 text-hint" />
            </button>
            <h2 class="text-2xl font-bold tracking-tight">Send TON</h2>
        </div>
        
        <div class="flex-1 flex flex-col gap-5 w-full">
            
            <!-- Recipient Input -->
            <div class="card relative">
                <label class="field-label">Recipient Address</label>
                
                <div class="flex items-center gap-2 w-full">
                    <input type="text" v-model="recipient" placeholder="EQ..." class="address-field hide-scrollbar flex-1" style="width: 100%; min-width: 0;" spellcheck="false" />
                    
                    <button @click="pasteAddress" 
                            class="shrink-0 w-14 h-[56px] rounded-xl bg-bg border border-white/10 flex items-center justify-center hover:bg-button hover:border-button hover:text-white transition-all text-hint"
                            title="Paste Address">
                        <DocumentDuplicateIcon class="w-5 h-5 rotate-180" />
                    </button>
                </div>
                
                <!-- Окно оценки риска (Spoofing Protection) -->
                <div v-if="evaluation" class="mt-3 animate-fade-in">
                    <!-- Безопасный (Whitelist / Уникальный) -->
                    <div v-if="evaluation.level === RiskLevel.Low" class="flex items-center gap-2 text-green-400 text-xs px-2">
                        <CheckCircleIcon class="w-4 h-4" />
                        <span>{{ evaluation.reasons[0] }}</span>
                    </div>

                    <!-- Средний риск (Совершенно новый) -->
                    <div v-else-if="evaluation.level === RiskLevel.Medium" class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-xs flex gap-3 items-start">
                        <InformationCircleIcon class="w-5 h-5 shrink-0 text-yellow-400" />
                        <p class="leading-relaxed">{{ evaluation.reasons[0] }}</p>
                    </div>

                    <!-- КРИТИЧЕСКИЙ РИСК (Спуфинг) -->
                    <div v-else-if="evaluation.level === RiskLevel.Critical" class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl shadow-lg shadow-red-500/5">
                        <div class="flex items-center gap-2 font-black text-red-400 text-[10px] uppercase mb-1">
                            <ShieldExclamationIcon class="w-4 h-4" />
                            Критическая Угроза Подмены!
                        </div>
                        <ul class="text-[11px] text-red-200 leading-relaxed list-disc pl-4 space-y-1">
                            <li v-for="(reason, idx) in evaluation.reasons" :key="idx">{{ reason }}</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Amount Input -->
            <div class="card">
                <div class="flex justify-between items-center mb-2">
                    <label class="field-label !mb-0">Amount to Send</label>
                    <span class="text-xs text-hint font-mono">Bal: {{ activeWallet.balance.toFixed(4) }} TON</span>
                </div>
                
                <div class="relative">
                    <input type="number" v-model="amount" placeholder="0.00" class="input-field pr-20 text-[16px] font-mono" />
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button @click="setMaxAmount" class="text-[10px] uppercase font-bold text-button hover:text-white bg-button/10 px-2 py-1 rounded-md transition-colors">Max</button>
                        <span class="text-xs font-bold text-hint pr-2">TON</span>
                    </div>
                </div>
                <div v-if="error" class="mt-3 text-red-400 text-xs text-center animate-fade-in">{{ error }}</div>
            </div>

            <div class="mt-auto pt-4 pb-8 flex flex-col gap-3">
                <Button :disabled="isInvalid || isLoading" @click="handleSendClick" class="w-full py-4 text-lg shadow-lg shadow-button/20">
                    Review & Send
                </Button>
                <button @click="router.push('/home')" class="w-full py-3 text-xs font-bold text-hint hover:text-text uppercase tracking-widest transition-colors">
                    Cancel
                </button>
            </div>
        </div>

        <!-- Confirm Modal (С проверкой Spoofing) -->
        <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div class="bg-secondary border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-6 shadow-2xl animate-fade-in">
                
                <div class="text-center">
                    <h2 class="text-xl font-black mb-1">Confirm Transfer</h2>
                    <p class="text-hint text-xs">You are about to send funds on Testnet</p>
                </div>

                <div class="bg-bg rounded-xl p-4 border border-white/5 space-y-3">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-hint">Amount:</span>
                        <span class="font-bold text-text font-mono">{{ amount }} TON</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-hint">Est. Fee:</span>
                        <div class="flex items-center gap-2">
                           <ArrowPathIcon v-if="isEstimatingFee" class="w-3 h-3 text-button animate-spin" />
                           <span class="font-bold text-hint font-mono">~{{ estimatedFee }} TON</span>
                        </div>
                    </div>
                    <div class="h-px bg-white/5 w-full my-1"></div>
                    <div class="flex flex-col gap-1">
                        <span class="text-hint text-sm">To Address:</span>
                        <span class="text-[10px] text-text font-mono break-all leading-relaxed">{{ recipient }}</span>
                    </div>
                </div>

                <div v-if="evaluation?.level === RiskLevel.Critical" class="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-center">
                    <ExclamationTriangleIcon class="w-6 h-6 text-red-500 mx-auto mb-2 animate-bounce" />
                    <p class="text-[11px] text-red-200 font-bold uppercase tracking-wide">Warning: Potential Spoofing Attack</p>
                    <p class="text-[10px] text-red-300 mt-1">Are you absolutely sure you want to send to this address?</p>
                </div>

                <div class="space-y-3">
                    <input type="password" v-model="confirmPassword" placeholder="Enter master password to sign" class="input-field text-center" />
                    <div v-if="error" class="text-red-400 text-xs text-center">{{ error }}</div>
                </div>

                <div class="flex gap-3 mt-2">
                    <Button @click="showConfirm = false" class="flex-1 bg-white/5 !shadow-none !text-hint hover:!text-text hover:!bg-white/10 py-3">
                        Cancel
                    </Button>
                    <Button :loading="isLoading" :disabled="isLoading" @click="confirmTransaction" 
                            class="flex-1 py-3" :class="{'bg-red-500 hover:bg-red-600 shadow-red-500/30': evaluation?.level === RiskLevel.Critical}">
                       {{ evaluation?.level === RiskLevel.Critical ? 'Send Anyway' : 'Confirm & Send' }}
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>