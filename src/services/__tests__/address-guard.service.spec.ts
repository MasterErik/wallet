import { describe, it, expect } from 'vitest';
import { addressGuard, RiskLevel } from '../address-guard.service';

describe('Address Guard Service', () => {
    it('should identify whitelisted addresses as Low risk', () => {
        const address = 'EQD...';
        const result = addressGuard.evaluateAddress(address, [], [address]);
        expect(result.level).toBe(RiskLevel.Low);
        expect(result.reasons[0]).toContain('Whitelisted');
    });

    it('should identify unknown addresses with no history as Critical risk', () => {
        const address = 'EQ-NEW-ADDRESS';
        const result = addressGuard.evaluateAddress(address, [], []);
        expect(result.level).toBe(RiskLevel.Critical);
        expect(result.reasons[0]).toContain('No transaction history');
    });
});
