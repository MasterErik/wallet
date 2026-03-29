<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useWalletStore } from '../../store/wallet.store';
import Button from '../common/Button.vue';

const router = useRouter();
const walletStore = useWalletStore();

const mode = ref<'select' | 'create' | 'import'>('select');
const password = ref('');
const confirmPassword = ref('');
const mnemonic = ref<string[]>([]);
const importMnemonicStr = ref('');
const error = ref('');

const generateMnemonic = () => {
  // Fake mnemonic for prototype
  const words = ['apple', 'berry', 'cherry', 'date', 'elder', 'fig', 'grape', 'honey', 'ice', 'juice', 'kiwi', 'lemon', 'mango', 'nut', 'orange', 'pear', 'quince', 'rose', 'seed', 'tree', 'urn', 'vine', 'wine', 'xray'];
  mnemonic.value = words;
  mode.value = 'create';
};

const proceedToHome = () => {
  error.value = '';
  if (password.value.length < 4) {
    error.value = 'Password must be at least 4 characters';
    return;
  }
  
  if (mode.value === 'create' && password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  const finalMnemonic = mode.value === 'import' 
    ? importMnemonicStr.value.trim().split(/\s+/) 
    : mnemonic.value;

  if (finalMnemonic.length !== 24) {
    error.value = 'Mnemonic must be exactly 24 words';
    return;
  }

  walletStore.login(password.value, finalMnemonic);
  router.push('/home');
};
</script>

<template>
  <div class="flex flex-col items-center justify-center p-6 h-full min-h-screen">
    
    <div v-if="mode === 'select'" class="flex flex-col items-center w-full max-w-sm gap-8 text-center">
      <div class="w-24 h-24 bg-button rounded-3xl flex items-center justify-center shadow-lg shadow-button/30 mb-4">
        <i class="pi pi-wallet text-4xl text-white"></i>
      </div>
      <div>
        <h1 class="text-3xl font-black mb-2">TON Wallet</h1>
        <p class="text-hint text-sm">Secure, fast, and seamlessly integrated into Telegram.</p>
      </div>
      
      <div class="flex flex-col gap-4 w-full mt-4">
        <Button @click="generateMnemonic" class="w-full">Create New Wallet</Button>
        <button @click="mode = 'import'" class="text-button font-bold py-4 hover:bg-white/5 rounded-xl transition-colors">Import Existing Wallet</button>
      </div>
    </div>

    <div v-if="mode === 'create'" class="flex flex-col w-full max-w-sm gap-6">
      <div class="flex items-center gap-4">
         <button @click="mode = 'select'" class="text-hint hover:text-text"><i class="pi pi-arrow-left"></i></button>
         <h2 class="text-2xl font-bold">Recovery Phrase</h2>
      </div>
      
      <p class="text-xs text-hint bg-button/10 text-button p-4 rounded-xl border border-button/20">Write down these 24 words in order. Never share them with anyone.</p>

      <div class="grid grid-cols-2 gap-2 h-48 overflow-y-auto pr-2 custom-scrollbar">
        <div v-for="(word, i) in mnemonic" :key="i" class="p-2 bg-secondary border border-white/5 rounded-lg flex items-center text-sm">
          <span class="text-hint w-6 text-xs">{{ i + 1 }}.</span>
          <span class="font-mono text-text font-bold">{{ word }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-3 mt-4">
        <input type="password" v-model="password" placeholder="Create master password" class="w-full bg-secondary border border-white/10 rounded-xl p-4 outline-none focus:border-button transition-all text-text" />
        <input type="password" v-model="confirmPassword" placeholder="Confirm master password" class="w-full bg-secondary border border-white/10 rounded-xl p-4 outline-none focus:border-button transition-all text-text" />
      </div>

      <div v-if="error" class="text-red-400 text-xs text-center">{{ error }}</div>
      <Button @click="proceedToHome" class="w-full">Continue</Button>
    </div>

    <div v-if="mode === 'import'" class="flex flex-col w-full max-w-sm gap-6">
      <div class="flex items-center gap-4">
         <button @click="mode = 'select'" class="text-hint hover:text-text"><i class="pi pi-arrow-left"></i></button>
         <h2 class="text-2xl font-bold">Import Wallet</h2>
      </div>

      <textarea v-model="importMnemonicStr" rows="4" placeholder="Enter 24 words separated by spaces..." class="w-full bg-secondary border border-white/10 rounded-xl p-4 outline-none focus:border-button transition-all leading-relaxed text-sm h-32 text-text resize-none"></textarea>

      <div class="flex flex-col gap-3">
        <input type="password" v-model="password" placeholder="Create master password" class="w-full bg-secondary border border-white/10 rounded-xl p-4 outline-none focus:border-button transition-all text-text" />
      </div>

      <div v-if="error" class="text-red-400 text-xs text-center">{{ error }}</div>
      <Button @click="proceedToHome" class="w-full mt-2">Import</Button>
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