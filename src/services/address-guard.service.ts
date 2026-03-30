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
        // Очистка пробелов
        const cleanAddress = targetAddress.trim();

        // 1. Белый список (безопасно)
        if (whitelist.includes(cleanAddress)) {
            return { 
                level: RiskLevel.Low, 
                reasons: ['Адрес находится в вашем белом списке доверенных адресов.'] 
            };
        }

        // Если адрес короткий, мы пока не можем его оценить
        if (cleanAddress.length < 16) {
            return {
                level: RiskLevel.Low,
                reasons: []
            };
        }

        // 2. Поиск потенциальной подмены (Spoofing Attack)
        // Сравниваем первые 6 и последние 4 символа
        const targetStart = cleanAddress.substring(0, 6).toLowerCase();
        const targetEnd = cleanAddress.slice(-4).toLowerCase();

        // Извлекаем уникальные адреса из истории транзакций
        const historyAddresses = Array.from(new Set(history.map(tx => tx.address).filter(Boolean)));

        for (const historyAddress of historyAddresses) {
            // Если мы уже переводили на этот же самый адрес, то это не подмена
            if (historyAddress === cleanAddress) {
                return {
                    level: RiskLevel.Low,
                    reasons: ['Вы уже взаимодействовали с этим адресом ранее.']
                };
            }

            if (historyAddress.length >= 16) {
                const historyStart = historyAddress.substring(0, 6).toLowerCase();
                const historyEnd = historyAddress.slice(-4).toLowerCase();

                // Если начало и конец совпадают, но середина отличается — это КРИТИЧЕСКАЯ УГРОЗА (Spoofing)
                if (targetStart === historyStart && targetEnd === historyEnd) {
                    return {
                        level: RiskLevel.Critical,
                        reasons: [
                            'ВНИМАНИЕ! Этот адрес очень похож на адрес из вашей истории, но отличается в середине.',
                            'Это классическая атака нулевыми переводами (Spoofing). Будьте предельно осторожны!'
                        ]
                    };
                }
            }
        }

        // 3. Совершенно новый адрес (не в белом списке и не похож на историю)
        return { 
            level: RiskLevel.Medium, 
            reasons: ['Это новый адрес. Пожалуйста, внимательно проверьте его перед отправкой средств.'] 
        };
    }
};