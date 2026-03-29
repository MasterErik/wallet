<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useWalletStore } from '../../store/wallet.store';

const router = useRouter();
const walletStore = useWalletStore();
const searchQuery = ref('');

const filteredTransactions = computed(() => {
  if (!searchQuery.value) return walletStore.transactions;
  return walletStore.transactions.filter(tx => 
    tx.address.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(walletStore.address);
    // You could show a small toast notification here
  } catch (err) {
    console.error('Failed to copy', err);
  }
};
</script>

<template>
  <div class="flex flex-col h-full p-4 max-w-md mx-auto relative pt-8">
    
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div class="flex flex-col">
        <span class="text-[10px] font-bold text-hint uppercase tracking-widest">Total Balance</span>
        <div class="font-mono text-5xl sm:text-6xl font-black text-text mt-1">
          {{ walletStore.balance }} <span class="text-2xl text-hint">TON</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-4 mb-8">
      <button @click="router.push('/send')" class="flex-1 flex justify-center items-center gap-2 bg-button text-white font-bold rounded-xl py-4 hover:bg-button/90 transition-colors shadow-lg shadow-button/30">
        <i class="pi pi-arrow-up-right"></i> Send
      </button>
      <button @click="router.push('/receive')" class="flex-1 flex justify-center items-center gap-2 bg-secondary text-text font-bold rounded-xl hover:bg-white/10 transition-colors py-4">
        <i class="pi pi-arrow-down-left"></i> Receive
      </button>
    </div>

    <!-- Transactions List -->
    <div class="flex flex-col flex-1 gap-4">
      <div class="flex justify-between items-center">
        <h3 class="text-sm font-bold text-hint uppercase tracking-widest">Recent Activity</h3>
        <input v-model="searchQuery" placeholder="Search..." class="bg-secondary rounded-full px-4 py-2 text-[10px] outline-none w-32 focus:border focus:border-button text-text transition-all" />
      </div>

      <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
        <div v-if="filteredTransactions.length === 0" class="bg-secondary rounded-2xl p-6 text-center">
          <span class="text-hint text-xs">No transactions found</span>
        </div>
        
        <div v-for="tx in filteredTransactions" :key="tx.id" 
             class="bg-secondary rounded-2xl p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full flex items-center justify-center"
                 :class="tx.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-text'">
              <i class="pi" :class="tx.type === 'in' ? 'pi-arrow-down-left' : 'pi-arrow-up-right'"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-text">{{ tx.type === 'in' ? 'Received' : 'Sent' }}</span>
              <span class="text-[10px] text-hint font-mono">{{ tx.address.slice(0, 4) }}...{{ tx.address.slice(-4) }}</span>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <div class="text-sm font-black" :class="tx.type === 'in' ? 'text-green-500' : 'text-text'">
              {{ tx.type === 'in' ? '+' : '-' }}{{ tx.amount }} TON
            </div>
            <span class="text-[10px] text-hint">{{ new Date(tx.date).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Settings -->
    <div class="flex justify-between items-center mt-6 pt-6 border-t border-white/5">
      <button @click="copyAddress" class="text-[10px] font-bold text-hint flex items-center gap-2 hover:text-text transition-colors">
        <i class="pi pi-copy"></i> Copy Address
      </button>
      <button @click="walletStore.logout(); router.push('/')" class="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-400">
        Log out
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