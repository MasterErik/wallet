<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useWalletStore } from '../../store/wallet.store';
import Button from '../common/Button.vue';
import { DocumentDuplicateIcon } from '@heroicons/vue/24/outline';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import QrcodeVue from 'qrcode.vue';

const router = useRouter();
const walletStore = useWalletStore();

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(walletStore.address);
  } catch (err) {
    console.error('Failed to copy', err);
  }
};
</script>

<template>
  <div class="flex flex-col h-full p-4 w-full max-w-md mx-auto pt-8">
    
    <div class="flex items-center gap-4 mb-8">
      <button @click="router.push('/home')" class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-white/10 transition-colors">
        <ArrowLeftIcon class="w-5 h-5 text-hint" />
      </button>
      <h2 class="text-2xl font-bold tracking-tight">Receive TON</h2>
    </div>

    <div class="flex flex-col flex-1 mt-4 w-full">
      <div class="w-64 h-64 mx-auto bg-white rounded-3xl p-4 flex items-center justify-center mb-8 shadow-2xl transition-transform hover:scale-[1.02]">
        <qrcode-vue 
          :value="'ton://transfer/' + walletStore.address" 
          :size="224" 
          level="M" 
          background="#ffffff" 
          foreground="#000000" 
          render-as="svg" 
        />
      </div>

      <!-- Применяем класс .card -->
      <div class="card">
        <!-- Применяем класс .field-label -->
        <span class="field-label">Your Wallet Address</span>
        
        <div class="flex items-center gap-2 w-full">
          <!-- Применяем класс .address-field (однострочный) -->
          <div class="address-field hide-scrollbar flex-1">
            {{ walletStore.address }}
          </div>
          
          <button @click="copyAddress" 
                  class="shrink-0 w-14 h-[56px] rounded-xl bg-bg border border-white/10 flex items-center justify-center hover:bg-button hover:border-button hover:text-white transition-all text-hint"
                  title="Copy Address">
            <DocumentDuplicateIcon class="w-5 h-5" />
          </button>
        </div>
        
        <p class="text-[10px] text-hint text-center mt-2 px-4 leading-relaxed">
          Only send <span class="text-button font-bold">TON</span> and other tokens on the TON network to this address.
        </p>
      </div>
    </div>

    <div class="mt-8">
      <Button @click="router.push('/home')" class="w-full bg-secondary !shadow-none !text-text hover:!bg-white/10">
        Back to Home
      </Button>
    </div>
  </div>
</template>