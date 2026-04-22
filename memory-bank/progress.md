## Прогресс инициализации проекта

- Проверены и созданы файлы памяти (active-context.md, product-context.md, system-patterns.md, progress.md, decision-log.md).
- Обновлен `system-patterns.md` с подробным описанием технологического стека проекта.
- Зафиксирована проблема с расхождением мнемоник при создании кошелька в `Auth.vue` и ее решение в `decision-log.md`.
- Произведен рефакторинг тестовой стратегии из-за несовместимости `@ton/crypto` с `jsdom`:
    - Все тестовые файлы перемещены из `src/**/__tests__` в `tests/unit`.
    - Тесты сервисов (`crypto.service.spec.ts`, `ton.service.spec.ts`) и хранилища (`wallet-manager.store.spec.ts`) теперь используют среду `node`.
    - `Auth.ui.spec.ts` создан для UI-тестов `Auth.vue` в среде `jsdom`.
    - `wallet-manager.store.spec.ts` был рефакторингован для использования реальных сервисов и включил в себя тесты из `verify-creation-mnemonic.spec.ts`.
    - Файл `verify-creation-mnemonic.spec.ts` был удален как дубликат.
    - В `Auth.ui.spec.ts` реализован полный мок `useWalletManagerStore` для изоляции UI-теста от криптографических зависимостей.
- Все тестовые файлы скорректированы с учетом глобальных моков `localStorage` и `Buffer` из `tests/setup.ts` и обновлены пути импорта.
