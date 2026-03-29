import { reactive } from 'vue';

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
    evaluateAddress(address: string, history: any[], whitelist: string[]): Evaluation {
        if (whitelist.includes(address)) {
            return { level: RiskLevel.Low, reasons: ['Whitelisted address'] };
        }
        if (history.length === 0) {
            return { level: RiskLevel.Critical, reasons: ['No transaction history with this address'] };
        }
        return { level: RiskLevel.Medium, reasons: ['Unknown address'] };
    }
};
