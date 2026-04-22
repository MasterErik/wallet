import { webcrypto } from 'node:crypto';
import { vi } from 'vitest';

// Устанавливаем всё ДО загрузки любых других модулей
// --- Эмуляция LocalStorage ---
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() {
            return Object.keys(store).length;
        },
    };
})();

// Внедряем в глобальный объект Node
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: localStorageMock });

// --- Дополнительно: Buffer в Uint8Array ---
// В Node.js Buffer — это подкласс Uint8Array.
// Иногда библиотеки сходят с ума, если видят именно Buffer.
// Этот хак заставляет Buffer вести себя максимально "массивно"
global.Buffer = global.Buffer || require('buffer').Buffer;

if (!global.crypto) {
    Object.defineProperty(global, 'crypto', {
        value: webcrypto,
        configurable: true,
    });
}

