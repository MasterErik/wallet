<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useActiveWalletStore } from '../../store/active-wallet.store';
import { 
  ArrowUpRightIcon, 
  ArrowDownLeftIcon, 
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  LockClosedIcon
} from '@heroicons/vue/24/solid';

const router = useRouter();
const activeWallet = useActiveWalletStore();
const searchQuery = ref('');

const filteredTransactions = computed(() => {
  if (!searchQuery.value) return activeWallet.transactions;
  const q = searchQuery.value.toLowerCase();
  return activeWallet.transactions.filter(tx =>
    tx.address.toLowerCase().includes(q) || 
    tx.amount.toString().includes(q)
  );
});

const copyAddress = async (addressToCopy?: string | MouseEvent) => {
  try {
    const target = typeof addressToCopy === 'string' ? addressToCopy : activeWallet.address;
    await navigator.clipboard.writeText(target);
    // В будущем можно добавить Toast уведомление
  } catch (err) {
    console.error('Failed to copy', err);
  }
};

const handleLogout = () => {
  activeWallet.lockWallet();
  router.push('/');
};

onMounted(() => {
  if (!activeWallet.isUnlocked) {
    router.push('/');
    return;
  }
  activeWallet.refreshWalletData();
});
</script>

<template>
  <div class="flex flex-col h-full p-4 w-full max-w-md mx-auto relative pt-8">

    <!-- Header -->
    <div class="flex justify-between items-start mb-8">
      <div class="flex flex-col flex-1">
        <span class="text-[10px] font-bold text-hint uppercase tracking-widest flex items-center gap-2">
          Total Balance
          <ArrowPathIcon 
            v-if="activeWallet.isLoadingData" 
            class="w-3 h-3 animate-spin text-button" 
          />
        </span>
        <div class="font-mono text-5xl sm:text-6xl font-black text-text mt-1 truncate">
          {{ activeWallet.balance.toFixed(2) }} <span class="text-2xl text-hint">TON</span>
        </div>
      </div>
      
      <button @click="activeWallet.refreshWalletData()" 
              class="p-2 rounded-full bg-secondary text-hint hover:text-text transition-colors"
              :disabled="activeWallet.isLoadingData">
        <ArrowPathIcon class="w-5 h-5" :class="{'animate-spin': activeWallet.isLoadingData}" />
      </button>
    </div>

    <!-- Actions -->
    <div class="flex gap-4 mb-8">
      <button @click="router.push('/send')" class="flex-1 flex justify-center items-center gap-2 bg-button text-white font-bold rounded-xl py-4 hover:bg-button/90 transition-colors shadow-lg shadow-button/30">
        <ArrowUpRightIcon class="w-5 h-5" /> Send
      </button>
      <button @click="router.push('/receive')" class="flex-1 flex justify-center items-center gap-2 bg-secondary text-text font-bold rounded-xl hover:bg-white/10 transition-colors py-4">
        <ArrowDownLeftIcon class="w-5 h-5" /> Receive
      </button>
    </div>

    <!-- Transactions List -->
    <div class="flex flex-col flex-1 gap-4 overflow-hidden">
      <!-- Error Message -->
      <div v-if="activeWallet.dataError" class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center mb-2 animate-fade-in">
        <p class="text-[11px] text-red-200 font-bold">Network Error</p>
        <p class="text-[10px] text-red-300 mt-1">{{ activeWallet.dataError }}</p>
      </div>

      <div class="flex justify-between items-center">
        <h3 class="text-sm font-bold text-hint uppercase tracking-widest">Recent Activity</h3>
        <div class="relative">
          <MagnifyingGlassIcon class="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-hint" />
          <input v-model="searchQuery" placeholder="Search..." class="bg-secondary rounded-full pl-8 pr-4 py-2 text-[10px] outline-none w-32 focus:ring-1 focus:ring-button text-text transition-all" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
        <!-- Loading State -->
        <template v-if="activeWallet.isLoadingData && activeWallet.transactions.length === 0">
           <div v-for="i in 3" :key="i" class="bg-secondary/50 animate-pulse rounded-2xl h-20 w-full"></div>
        </template>

        <template v-else>
          <div v-if="filteredTransactions.length === 0" class="bg-secondary rounded-2xl p-8 text-center border border-white/5">
            <span class="text-hint text-xs">No transactions found</span>
          </div>

          <div v-for="tx in filteredTransactions" :key="tx.id"
               class="bg-secondary rounded-2xl p-4 flex justify-between items-center hover:bg-white/5 transition-all cursor-pointer border border-white/5 group">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                   :class="tx.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-text'">
                <ArrowDownLeftIcon v-if="tx.type === 'in'" class="w-5 h-5" />
                <ArrowUpRightIcon v-else class="w-5 h-5" />
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-text">{{ tx.type === 'in' ? 'Received' : 'Sent' }}</span>     
                <button @click.stop="copyAddress(tx.address)" class="text-[10px] text-hint font-mono hover:text-text flex items-center gap-1 transition-colors text-left mt-0.5" title="Copy Address">
                  {{ tx.address.slice(0, 8) }}...{{ tx.address.slice(-8) }}
                  <DocumentDuplicateIcon class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
            <div class="flex flex-col items-end">
              <div class="text-sm font-black" :class="tx.type === 'in' ? 'text-green-500' : 'text-text'">
                {{ tx.type === 'in' ? '+' : '-' }}{{ tx.amount.toFixed(6) }}
              </div>
              <span class="text-[10px] text-hint mt-0.5">{{ new Date(tx.date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Footer Settings -->
    <div class="flex justify-between items-center mt-6 pt-6 border-t border-white/5">
      <button @click="copyAddress" class="text-[10px] font-bold text-hint flex items-center gap-2 hover:text-text transition-colors">
        <DocumentDuplicateIcon class="w-4 h-4" /> 
        <span>{{ activeWallet.address ? activeWallet.address.slice(0, 4) + '...' + activeWallet.address.slice(-4) : 'Copy Address' }}</span>
      </button>
      <button @click="handleLogout" class="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-400 flex items-center gap-2">
        <LockClosedIcon class="w-4 h-4" /> Lock Wallet
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
}
</style>