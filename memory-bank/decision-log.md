## Mnemonic Discrepancy During Wallet Creation

**Context:** During wallet creation, the mnemonic displayed to the user (`mnemonic.value`) was different from the one actually saved (`importMnemonicStr.value` was being used incorrectly in `createOrImportWallet` function for 'create' mode). This prevented recovery using the displayed phrase.

**Decision:** Modified the `createOrImportWallet` function in `src/components/views/Auth.vue` to use the `mnemonic.value` (generated and displayed) when in 'create' mode, and `importMnemonicStr.value` when in 'import' mode.

**Alternatives Considered:** None, as this was a bug fix to ensure correct functionality.

**Consequences:** Ensures that the mnemonic displayed to the user is the one that is actually saved, enabling correct wallet recovery.
