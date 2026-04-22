/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WalletSend from '@/components/views/WalletSend.vue';
import { useActiveWalletStore } from '@/store/active-wallet.store';

// Мокаем зависимости
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: vi.fn()
    })
}));

vi.mock('@/services/ton.service', () => ({
    tonService: {
        isValidAddress: vi.fn((addr) => addr.startsWith('EQ')),
        getBalance: vi.fn().mockResolvedValue(1.0)
    }
}));

describe('WalletSend.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useActiveWalletStore();
        store.balance = 1.0; // Даем немного денег для тестов
        store.isUnlocked = true;
    });

    it('кнопка отправки должна быть заблокирована при пустых полях', () => {
        const wrapper = mount(WalletSend);
        const sendButton = wrapper.find('button.w-full.py-4');
        expect(sendButton.attributes('disabled')).toBeDefined();
    });

    it('должен показывать предупреждение, если адрес похож на Спуфинг (из addressGuard)', async () => {
        const store = useActiveWalletStore();
        // Добавляем адрес в историю, чтобы создать базу для спуфинга
        store.transactions = [{ address: 'EQ_ORIGINAL_ADDRESS_12345' } as any];

        const wrapper = mount(WalletSend);
        const addressInput = wrapper.find('input[type="text"]');
        
        // Вводим похожий адрес (такое же начало и конец)
        await addressInput.setValue('EQ_ORIGINAL_SCAM_ADDRESS_12345');
        
        // Ждем обновления watcher
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(wrapper.text()).toContain('Критическая Угроза Подмены');
    });

    it('должен блокировать отправку, если сумма больше баланса', async () => {
        const wrapper = mount(WalletSend);
        const addressInput = wrapper.find('input[type="text"]');
        const amountInput = wrapper.find('input[type="number"]');

        await addressInput.setValue('EQ_VALID_ADDRESS');
        await amountInput.setValue(2.0); // Больше чем 1.0 баланса

        const sendButton = wrapper.find('button.w-full.py-4');
        expect(sendButton.attributes('disabled')).toBeDefined();
    });
});
