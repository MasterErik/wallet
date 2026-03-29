<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWalletStore } from './store/wallet.store';

const router = useRouter();
const walletStore = useWalletStore();

onMounted(() => {
  if (!walletStore.isUnlocked) {
    router.push('/');
  }
});
</script>

<template>
  <div class="relative z-10 bg-bg text-text min-h-[100vh] font-sans antialiased">
    <div id="content" class="h-full flex flex-col overflow-auto">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
