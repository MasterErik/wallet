<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>();
</script>

<template>
  <button 
    :disabled="disabled"
    class="bg-button text-white font-bold rounded-xl py-4 px-6 hover:bg-button/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-button/30 flex items-center justify-center gap-2"
  >
    <slot></slot>
  </button>
</template>