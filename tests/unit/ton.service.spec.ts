/**
 * @vitest-environment node
 */
import { TonService } from '@/services/ton.service';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { Address } from '@ton/core';
import { describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('@ton/ton');

describe('TonService (TONCENTER Integration)', () => {

    vi.setConfig({ testTimeout: 30000 });

    const base64Address = 'kQATCjGpJRgV5om4c_p-xIeLo5zSupGwiTqAZU64NjgNL3eU';
    const testMnemonic = 'mix pull wagon pave believe venture mirror baby mom brave fuel wool upgrade spirit give syrup swallow feed swap suspect hidden social resist easy'
        .split(' ');

    let service: TonService;
    let mockContract: any;

    beforeEach(() => {
        vi.useFakeTimers();
        service = new TonService();

        // Создаем мок для "открытого" контракта
        mockContract = {
            getSeqno: vi.fn(),
            address: Address.parse(base64Address), // любой валидный адрес
        };

        // Заставляем client.open возвращать наш мок
        (service as any).client.open = vi.fn().mockReturnValue(mockContract);
        (service as any).client.getTransactions = vi.fn();
    });


    it('должна вернуть true, если транзакция успешна', async () => {
        const initialSeqno = 10;

        // 1. Сначала seqno не меняется, на второй итерации увеличивается
        mockContract.getSeqno
            .mockResolvedValueOnce(10) // первая итерация
            .mockResolvedValueOnce(11); // вторая итерация

        // 2. Имитируем успешную транзакцию в истории
        (service as any).client.getTransactions.mockResolvedValue([{
            description: {
                type: 'generic',
                aborted: false,
                computePhase: {
                    type: 'vm',
                    exitCode: 0
                }
            }
        }]);

        // Запускаем функцию
        const promise = service.waitForTransaction({} as any, initialSeqno);

        // Проматываем время, чтобы сработали циклы
        await vi.runAllTimersAsync();

        const result = await promise;
        expect(result).toBe(true);
        expect(mockContract.getSeqno).toHaveBeenCalledTimes(2);
    });

    it('должна вернуть false, если транзакция завершилась с ошибкой (aborted)', async () => {
        const initialSeqno = 10;
        mockContract.getSeqno.mockResolvedValue(11);

        (service as any).client.getTransactions.mockResolvedValue([{
            description: {
                type: 'generic',
                aborted: true, // Ошибка!
                computePhase: { type: 'vm', exitCode: 11 }
            }
        }]);

        const promise = service.waitForTransaction({} as any, initialSeqno);
        await vi.runAllTimersAsync();

        expect(await promise).toBe(false);
    });

    it('должна вернуть false по тайм-ауту (maxRetries)', async () => {
        mockContract.getSeqno.mockResolvedValue(10); // seqno не растет

        const promise = service.waitForTransaction({} as any, 10);

        // Прокручиваем все 20 попыток
        await vi.runAllTimersAsync();

        expect(await promise).toBe(false);
        expect(mockContract.getSeqno).toHaveBeenCalledTimes(20);
    });

    it('должен корректно обрабатывать ситуацию, когда transactions.length === 0', async () => {
        const keyPair = await mnemonicToPrivateKey(testMnemonic);

        // Используем ваш глобальный mockContract, но задаем ему сценарий:
        mockContract.getSeqno
            .mockResolvedValueOnce(10) // 1-я итерация: seqno еще старый
            .mockResolvedValueOnce(11) // 2-я итерация: seqno вырос, заходим в проверку транзакций
            .mockResolvedValue(11);    // Последующие вызовы

        // Мокаем клиент, чтобы он вернул ваш глобальный контракт
        vi.spyOn(service['client'], 'open').mockReturnValue(mockContract as any);

        // Мокаем транзакции: сначала пусто (баг индексации), потом успех
        const getTxsSpy = vi.spyOn(service['client'], 'getTransactions')
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ description: { type: 'generic', aborted: false, computePhase: { type: 'vm', exitCode: 0 } } }] as any);

        const waitPromise = service.waitForTransaction(keyPair, 10);

        // Проматываем виртуальное время (sleep)
        await vi.runAllTimersAsync();

        expect(await waitPromise).toBe(true);
        expect(getTxsSpy).toHaveBeenCalledTimes(2); // Подтверждаем, что из-за [] был совершен повторный запрос
    });
});
