import { defineStore } from 'pinia';

export interface Transaction {
  id: string;
  type: 'in' | 'out';
  amount: number;
  date: string;
  address: string;
  status: 'completed' | 'pending' | 'failed';
}

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    balance: '0.00',
    address: 'EQA_dummy_address_for_testing_1234567890',
    mnemonic: [] as string[],
    isUnlocked: false,
    password: '',
    transactions: [] as Transaction[],
    whitelist: [] as string[]
  }),
  actions: {
    login(password: string, mnemonic: string[]) {
      this.password = password;
      this.mnemonic = mnemonic;
      this.isUnlocked = true;
      this.refreshBalance();
      this.fetchTransactions();
    },
    logout() {
      this.isUnlocked = false;
      this.password = '';
      this.mnemonic = [];
      this.balance = '0.00';
      this.transactions = [];
    },
    addToWhitelist(address: string) {
      if (!this.whitelist.includes(address)) {
        this.whitelist.push(address);
      }
    },
    refreshBalance() {
      // Mock logic
      this.balance = '145.50';
    },
    fetchTransactions() {
      // Mock transactions
      this.transactions = [
        { id: '1', type: 'in', amount: 50.5, date: '2026-03-27T10:00:00Z', address: 'EQC123...', status: 'completed' },
        { id: '2', type: 'out', amount: 10.0, date: '2026-03-26T15:30:00Z', address: 'EQA456...', status: 'completed' }
      ];
    }
  }
});