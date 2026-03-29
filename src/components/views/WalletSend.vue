<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWalletStore } from '../../store/wallet.store';
import { addressGuard, RiskLevel } from '../../services/address-guard.service';
import Button from '../common/Button.vue';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { DocumentDuplicateIcon } from '@heroicons/vue/24/outline';

const walletStore = useWalletStore();
const router = useRouter();
const recipient = ref('');
const amount = ref<number | null>(null);
const isLoading = ref(false);
const showConfirm = ref(false);
const confirmPassword = ref('');
const error = ref('');

const evaluation = computed(() => {
    if (recipient.value.length < 10) return null;
    return addressGuard.evaluateAddress(
        recipient.value, 
        walletStore.transactions, 
        walletStore.whitelist
    );
});

const isInvalid = computed(() => {
    return !recipient.value || !amount.value || amount.value <= 0;
});

const handleSendClick = () => {
    error.value = '';
    showConfirm.value = true;
};

const confirmTransaction = async () => {
    error.value = '';
    if (!walletStore.isUnlocked || walletStore.password !== confirmPassword.value) {
        error.value = 'Incorrect password';
        return;
    }

    isLoading.value = true;
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        walletStore.addToWhitelist(recipient.value);
        showConfirm.value = false;
        recipient.value = '';
        amount.value = null;
        confirmPassword.value = '';
        router.push('/home');
    } catch (e: any) {
        error.value = 'Transaction failed: ' + e.message;
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    if (!walletStore.isUnlocked) router.push('/');
});
</script>

<template>
    <div class="flex flex-col h-full p-4 w-full max-w-md mx-auto pt-8">
        <div class="flex items-center gap-4 mb-8">
            <button @click="router.push('/home')" class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-white/10 transition-colors">
                <ArrowLeftIcon class="w-5 h-5 text-hint" />
            </button>
            <h2 class="text-2xl font-bold tracking-tight">Send TON</h2>
        </div>
        
        <div class="flex-1 flex flex-col gap-5 w-full">
            <!-- Применяем класс .card -->
            <div class="card">
                <label class="field-label">Recipient Address</label>
                
                <div class="flex items-center gap-2 w-full">
                    <input type="text" v-model="recipient" placeholder="EQ..." class="address-field hide-scrollbar flex-1" style="width: 100%; min-width: 0;" spellcheck="false" />
                    
                    <button @click="recipient = 'EQA_dummy_address_for_testing_123456789012345678'" 
                            class="shrink-0 w-14 h-[56px] rounded-xl bg-bg border border-white/10 flex items-center justify-center hover:bg-button hover:border-button hover:text-white transition-all text-hint"
                            title="Paste Address">
                        <DocumentDuplicateIcon class="w-5 h-5 rotate-180" />
                    </button>
                </div>
                
                <div v-if="evaluation" class="mt-2">
                    <div v-if="evaluation.level === RiskLevel.Critical" 
                         class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div class="flex items-center gap-2 font-black text-red-400 text-[10px] uppercase mb-1">
                            <ExclamationTriangleIcon class="w-4 h-4" />
                            Critical Risk
                        </div>
                        <p class="text-[10px] text-red-200 leading-relaxed">{{ evaluation.reasons[0] }}</p>
                    </div>
                </div>
            </div>

            <!-- Применяем класс .card -->
            <div class="card">
                <label class="field-label">Amount to Send</label>
                
                <div class="relative">
                    <input type="number" v-model="amount" placeholder="0.00" class="input-field pr-16 text-[16px]" />
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-hint">TON</span>
                </div>
            </div>

            <div class="flex flex-col gap-3 mt-4">
                <Button :disabled="isInvalid || isLoading" @click="handleSendClick" class="w-full">
                    Continue
                </Button>
            </div>
        </div>

        <div class="mt-8">
            <Button @click="router.push('/home')" class="w-full bg-secondary !shadow-none !text-text hover:!bg-white/10">
                Back to Home
            </Button>
        </div>

        <!-- Confirm Modal -->
        <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div class="bg-secondary border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-6 shadow-2xl">
                <h2 class="text-lg font-bold text-center">Confirm Transfer</h2>
                <input type="password" v-model="confirmPassword" placeholder="Enter password" class="input-field" />
                <div class="flex gap-3">
                    <Button @click="showConfirm = false" class="flex-1 bg-white/5 !shadow-none !text-hint hover:!text-text hover:!bg-white/10">
                        Cancel
                    </Button>
                    <Button :disabled="isLoading" @click="confirmTransaction" class="flex-1">
                       Confirm
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>