# Project Progress

## Completed Milestones
- [Milestone 1] - [Date]
- [Milestone 2] - [Date]

## Pending Milestones
- [Milestone 3] - [Expected date]
- [Milestone 4] - [Expected date]

## Update History

### [Mar 30, 2026, 12:00 PM] ♻️ Refactor: Архитектурный рефакторинг: разделение store, динамические комиссии, обработка ошибок
<!-- ID: p_2026-03-30_mncyjl8w -->

- Разделил `wallet.store.ts` на `wallet-manager.store.ts` и `active-wallet.store.ts` (Composition API, автосохранение `localStorage`).\n- Внедрил динамический расчет комиссии `estimateExternalMessageFee` в `ton.service.ts` и `WalletSend.vue`.\n- Добавил обработку и отображение сетевых ошибок `dataError` в `Home.vue`.\n- Удалил неиспользуемый файл `telegram.ts` и исправил ошибки TypeScript.\n- Обновил архитектурный документ `architecture.md` (пункт 7.1).

**Tags:** `architecture`, `refactoring`, `pinia`, `ton`

---

- [Date] - [Update]
- [Date] - [Update]
