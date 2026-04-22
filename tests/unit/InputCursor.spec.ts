// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import WalletSend from '@/components/views/WalletSend.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/store/active-wallet.store', () => ({
  useActiveWalletStore: () => ({
    transactions: [],
    whitelist: [],
    isUnlocked: true,
    password: 'test',
    balance: 0,
    addToWhitelist: vi.fn(),
  })
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div></div>' } }],
});

describe('Input Cursor Visibility Test', () => {
  it('should ensure input fields have proper text and caret classes to be visible', async () => {
    setActivePinia(createPinia());
    
    const wrapper = mount(WalletSend, {
      global: {
        plugins: [router],
        stubs: { Button: true }
      }
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBeGreaterThan(0);

    inputs.forEach(input => {
      const classes = input.classes();
      
      // В новых компонентах используются общие классы .address-field и .input-field,
      // которые под капотом (в style.css) имеют @apply text-text и caret-white.
      // Поэтому мы просто проверяем, что у инпута есть один из этих легальных классов,
      // и нет ломающего select-none.
      expect(classes).not.toContain('select-none');
      expect(
        classes.includes('address-field') || classes.includes('input-field')
      ).toBe(true);
    });
  });
});
