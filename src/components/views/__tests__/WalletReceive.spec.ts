/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WalletReceive from '../WalletReceive.vue';
import { useActiveWalletStore } from '../../../store/active-wallet.store';

// Мокаем зависимости роутера
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: vi.fn()
    })
}));

// Мокаем qrcode.vue, так как он может быть сложен для jsdom
vi.mock('qrcode.vue', () => ({
    default: { template: '<div>QR</div>' }
}));

describe('WalletReceive.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('должен отображать адрес кошелька из стора', () => {
        const activeWallet = useActiveWalletStore();
        const testAddress = 'EQ_TEST_ADDRESS_123';
        activeWallet.address = testAddress;

        const wrapper = mount(WalletReceive);
        expect(wrapper.text()).toContain(testAddress);
    });

    it('должен копировать адрес в буфер обмена при нажатии кнопки', async () => {
        const activeWallet = useActiveWalletStore();
        activeWallet.address = 'EQ_TEST_ADDRESS';
        
        // Мокаем clipboard API
        const clipboardMock = {
            writeText: vi.fn().mockResolvedValue(undefined)
        };
        Object.defineProperty(navigator, 'clipboard', {
            value: clipboardMock,
            configurable: true
        });

        const wrapper = mount(WalletReceive);
        const copyButton = wrapper.find('button[title="Copy Address"]');
        await copyButton.trigger('click');

        expect(clipboardMock.writeText).toHaveBeenCalledWith('EQ_TEST_ADDRESS');
    });
});