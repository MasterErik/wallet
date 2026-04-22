<script setup lang="ts">
import Button from '../common/Button.vue'; // Keep component imports
import {
  WalletIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/vue/24/outline';
import { CheckCircleIcon } from '@heroicons/vue/24/solid';

import useAuthLogic from '../../composables/useAuthLogic'; // Import the new composable

const {
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
  walletManager, // Keep walletManager for template access
  activeWallet, // Keep activeWallet for template access
} = useAuthLogic();

// Expose relevant state and methods for testing
defineExpose({
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
  // No need to expose walletManager or activeWallet directly here again,
  // as they are already exposed implicitly through the composable's return
  // and accessed in the template via the destructured variables.
});

</script>

<template>
  <div class="flex flex-col items-center justify-center p-6 h-full min-h-screen bg-bg">

    <!-- MODE: SELECT (Initial screen if no wallets) -->
    <div v-if="mode === 'select'" class="flex flex-col items-center w-full max-w-sm gap-8 text-center animate-fade-in">
      <div class="w-24 h-24 bg-button rounded-3xl flex items-center justify-center shadow-lg shadow-button/30 mb-4 animate-bounce-slow">
        <WalletIcon class="w-12 h-12 text-white" />
      </div>
      <div>
        <h1 class="text-3xl font-black mb-2 tracking-tight">TON Wallet</h1>
        <p class="text-hint text-sm leading-relaxed">Secure, fast, and seamlessly integrated into the TON ecosystem.</p>
      </div>

      <div class="flex flex-col gap-4 w-full mt-4">
        <Button id="create" @click="startCreating" :loading="isLoading" class="w-full">Create New Wallet</Button>
        <button id="import_existing_wallet" @click="mode = 'import'" class="text-button font-bold py-4 hover:bg-white/5 rounded-xl transition-all">
          Import Existing Wallet
        </button>
      </div>
    </div>

    <!-- MODE: MANAGE WALLETS (List of wallets) -->
    <div v-else-if="mode === 'manage'" class="flex flex-col w-full max-w-sm gap-6 animate-fade-in">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">My Wallets</h2>
        <Button id="add_new" @click="mode = 'select'" size="small">Add New</Button>
      </div>

      <div v-if="walletManager.savedWallets.length === 0" class="bg-secondary rounded-2xl p-8 text-center border border-white/5">
        <p class="text-hint text-sm">No wallets found. Create or import one to begin.</p>
        <Button id="create_first_wallet" @click="mode = 'select'" class="mt-4">Create First Wallet</Button>
      </div>
      <div v-else class="flex flex-col gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        <div v-for="(wallet, index) in walletManager.savedWallets" :key="wallet.address"
             class="bg-secondary rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:border-button transition-all cursor-pointer"
             :class="{'border-button': index === selectedWalletIndex}"
             @click="selectWallet(index)">
          <div class="flex flex-col" v-if="wallet">
            <span class="font-bold text-text">{{ wallet.name }}</span>
            <span class="text-[10px] text-hint font-mono">{{ wallet.address?.slice(0, 6) }}...{{ wallet.address?.slice(-6) }}</span>
          </div>
          <div class="flex items-center gap-2" v-if="wallet">
            <CheckCircleIcon v-if="index === selectedWalletIndex && activeWallet.isUnlocked" class="w-5 h-5 text-green-500" />
            <button :id="'delete_wallet_' + index" @click.stop="confirmDeleteWallet(index)" class="p-2 text-hint hover:text-red-400 transition-colors rounded-full hover:bg-white/5">
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="error" class="text-red-400 text-xs text-center">{{ error }}</div>
      <Button id="unlock_selected_wallet" @click="unlockSelectedWallet" :loading="isLoading" :disabled="!walletManager.hasWallet" class="w-full mt-4">Unlock Selected Wallet</Button>
    </div>

    <!-- MODE: UNLOCK (for selected wallet) -->
    <div v-else-if="mode === 'unlock'" class="flex flex-col w-full max-w-sm gap-8 text-center animate-fade-in">
      <button id="back_to_manage" @click="mode = 'manage'" class="text-hint hover:text-text self-start"><ArrowLeftIcon class="w-5 h-5" /></button>
      <div class="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-2">
        <LockClosedIcon class="w-10 h-10 text-button" />
      </div>
      <h2 class="text-2xl font-bold">Unlock {{ walletManager.savedWallets[selectedWalletIndex]?.name || 'Wallet' }}</h2>
      <div class="flex flex-col gap-4">
        <input type="password" v-model="password" @keyup.enter="unlockSelectedWallet" placeholder="Enter master password"
               class="input-field text-center" autoFocus />
        <div v-if="error" class="text-red-400 text-xs">{{ error }}</div>
        <Button id="unlock_wallet_button" @click="unlockSelectedWallet" :loading="isLoading" class="w-full">Unlock</Button>
      </div>
    </div>

    <!-- MODE: CREATE -->
    <div v-else-if="mode === 'create'" class="flex flex-col w-full max-w-sm gap-6 animate-fade-in">
      <div class="flex items-center gap-4">
         <button id="back_from_create" @click="mode = walletManager.hasWallet ? 'manage' : 'select'" class="p-2 hover:bg-white/5 rounded-full transition-colors"><ArrowLeftIcon class="w-5 h-5 text-hint" /></button>
         <h2 class="text-2xl font-bold">New Wallet</h2>
      </div>

      <input type="text" v-model="walletName" placeholder="Wallet Name (e.g., My Main Wallet)" class="input-field" />

      <div id="mnemonic_instructions" class="p-4 bg-button/10 rounded-xl border border-button/20 flex gap-3">
        <ShieldCheckIcon class="w-5 h-5 text-button shrink-0" />
        <p class="text-[11px] text-button leading-snug">Write down these 24 words in order. This is the ONLY way to recover your wallet.</p>
      </div>

      <div id="mnemonic_words_container" class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        <div v-for="(word, i) in mnemonic" :key="i" class="p-2.5 bg-secondary border border-white/5 rounded-xl flex items-center text-sm">
          <span class="text-hint w-6 text-[10px]">{{ i + 1 }}.</span>
          <span class="font-mono text-text font-bold">{{ word }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-3 mt-2">
        <input type="password" v-model="password" placeholder="Create master password (min 8 chars)" class="input-field" />
        <input type="password" v-model="confirmPassword" placeholder="Confirm master password" class="input-field" />
      </div>

      <div v-if="error" class="text-red-400 text-xs text-center">{{ error }}</div>
      <Button id="create_wallet_final" @click="createOrImportWallet" :loading="isLoading" :disabled="!isPasswordValid || password !== confirmPassword" class="w-full">Create Wallet</Button>
    </div>

    <!-- MODE: IMPORT -->
    <div v-else-if="mode === 'import'" class="flex flex-col w-full max-w-sm gap-6 animate-fade-in">
      <div class="flex items-center gap-4">
         <button id="back_from_import" @click="mode = walletManager.hasWallet ? 'manage' : 'select'" class="p-2 hover:bg-white/5 rounded-full transition-colors"><ArrowLeftIcon class="w-5 h-5 text-hint" /></button>
         <h2 class="text-2xl font-bold">Import Wallet</h2>
      </div>

      <input type="text" v-model="walletName" placeholder="Wallet Name (e.g., My Import)" class="input-field" />

      <textarea v-model="importMnemonicStr" rows="4" placeholder="Enter your 24 words separated by spaces..."
                class="w-full bg-secondary border border-white/10 rounded-2xl p-4 outline-none focus:border-button transition-all leading-relaxed text-sm h-32 text-text resize-none font-mono"></textarea>

      <div class="flex flex-col gap-3">
        <input type="password" v-model="password" placeholder="Set master password for this device (min 8 chars)" class="input-field" />
      </div>

      <div v-if="error" class="text-red-400 text-xs text-center">{{ error }}</div>
      <Button id="import_wallet_final" @click="createOrImportWallet" :loading="isLoading" :disabled="!isPasswordValid || importMnemonicStr.trim().split(/\s+/).length !== 24" class="w-full">Import Wallet</Button>
    </div>

  </div>
</template>

<style scoped>
.input-field {
  @apply w-full bg-secondary border border-white/10 rounded-2xl p-4 outline-none focus:border-button transition-all text-text placeholder:text-hint/50;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-bounce-slow {
  animation: bounceSlow 3s infinite ease-in-out;
}

@keyframes bounceSlow {
  0%, 100% { transform: translateY(-5%); }
  50% { transform: translateY(0); }
}

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
