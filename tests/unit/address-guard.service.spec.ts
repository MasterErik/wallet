import { describe, it, expect } from 'vitest';
import { addressGuard, RiskLevel } from '@/services/address-guard.service';

describe('Address Guard Service (Spoofing Protection)', () => {
    
    const validHistoryAddress = 'EQA_dummy_address_for_testing_123456789012345678';
    
    // Создаем мошеннический (spoofed) адрес. Совпадают первые 6 символов и последние 4.
    // "EQA_du" и "5678"
    const spoofedAddress = 'EQA_dum_THIS_IS_A_SCAM_ADDRESS_DO_NOT_SEND_5678';
    
    // Совершенно другой, безопасный новый адрес
    const completelyNewAddress = 'EQC_completely_new_and_unseen_address_9876543210';

    const historyMock = [
        { address: validHistoryAddress },
        { address: 'EQB_some_other_address_abc' }
    ];

    it('должен возвращать низкий риск (Low) для коротких адресов, так как их невозможно оценить', () => {
        const result = addressGuard.evaluateAddress('EQA_short', [], []);
        expect(result.level).toBe(RiskLevel.Low);
        expect(result.reasons.length).toBe(0);
    });

    it('должен возвращать низкий риск (Low), если адрес есть в White-list', () => {
        const result = addressGuard.evaluateAddress(completelyNewAddress, historyMock, [completelyNewAddress]);
        expect(result.level).toBe(RiskLevel.Low);
        expect(result.reasons[0]).toContain('белом списке');
    });

    it('должен возвращать низкий риск (Low), если пользователь УЖЕ взаимодействовал с этим адресом ранее', () => {
        const result = addressGuard.evaluateAddress(validHistoryAddress, historyMock, []);
        expect(result.level).toBe(RiskLevel.Low);
        expect(result.reasons[0]).toContain('уже взаимодействовали');
    });

    it('должен возвращать средний риск (Medium) для абсолютно новых адресов', () => {
        const result = addressGuard.evaluateAddress(completelyNewAddress, historyMock, []);
        expect(result.level).toBe(RiskLevel.Medium);
        expect(result.reasons[0]).toContain('новый адрес');
    });

    it('КРИТИЧЕСКИЙ ТЕСТ: должен распознавать атаку подмены адреса (Spoofing) и возвращать Critical', () => {
        // Мы вводим поддельный адрес. Он не в вайт-листе, его нет в истории, 
        // НО его начало и конец полностью совпадают с адресом из истории (validHistoryAddress)
        const result = addressGuard.evaluateAddress(spoofedAddress, historyMock, []);
        
        expect(result.level).toBe(RiskLevel.Critical);
        expect(result.reasons[0]).toContain('похож на адрес из вашей истории, но отличается');
        expect(result.reasons[1]).toContain('Spoofing');
    });

});
