export enum RiskLevel {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Critical = 'critical'
}

export interface Evaluation {
    level: RiskLevel;
    reasons: string[];
}

export const addressGuard = {
    /**
     * Оценивает введенный адрес на наличие риска подмены (Spoofing)
     * Сравнивает начало и конец адреса с историей транзакций пользователя.
     */
    evaluateAddress(targetAddress: string, history: any[], whitelist: string[]): Evaluation {
        const cleanAddress = targetAddress.trim();

        // 1. Белый список (безопасно)
        if (whitelist.includes(cleanAddress)) {
            return {
                level: RiskLevel.Low,
                reasons: ['Адрес находится в вашем белом списке доверенных адресов.']
            };
        }

        if (cleanAddress.length < 16) {
            return { level: RiskLevel.Low, reasons: [] };
        }

        const targetStart = cleanAddress.substring(0, 6).toLowerCase();
        const targetEnd = cleanAddress.slice(-4).toLowerCase();

        // Фильтруем историю: только УСПЕШНЫЕ ИСХОДЯЩИЕ транзакции
        // Именно эти адреса мы считаем "своими" и безопасными
        const trustedAddresses = Array.from(new Set(
            history
                .filter(tx => tx.type === 'out' && tx.status === 'success')
                .map(tx => tx.address)
                .filter(Boolean)
        ));

        // Проверяем на полное совпадение с доверенными адресами
        if (trustedAddresses.includes(cleanAddress)) {
            return {
                level: RiskLevel.Low,
                reasons: ['Вы уже успешно отправляли средства на этот адрес ранее.']
            };
        }

        // 2. Поиск потенциальной подмены (Spoofing Attack) относительно доверенных адресов
        for (const trustedAddress of trustedAddresses) {
            if (trustedAddress.length >= 16) {
                const historyStart = trustedAddress.substring(0, 6).toLowerCase();
                const historyEnd = trustedAddress.slice(-4).toLowerCase();

                // Если похож на доверенный, но не он сам — это КРИТИЧЕСКАЯ УГРОЗА
                if (targetStart === historyStart && targetEnd === historyEnd) {
                    return {
                        level: RiskLevel.Critical,
                        reasons: [
                            'ВНИМАНИЕ! Этот адрес очень похож на адрес, которому вы доверяете, но отличается в середине.',
                            'Это может быть атака подмены адреса (Spoofing). Проверьте каждый символ!'
                        ]
                    };
                }
            }
        }

        // 3. Совершенно новый адрес ИЛИ адрес, с которого вам только ПРИХОДИЛИ деньги
        // (По ТЗ: если на него не было исходящих, предупреждение остается)
        return {
            level: RiskLevel.Medium,
            reasons: ['Вы еще не отправляли средства на этот адрес. Пожалуйста, проверьте его внимательно.']
        };
    }
};
