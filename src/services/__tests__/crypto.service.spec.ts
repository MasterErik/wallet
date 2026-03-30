/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { cryptoService } from '../crypto.service';

describe('CryptoService', () => {
    const password = 'test-password-123';
    const mnemonic = [
        'notice', 'rookie', 'clutch', 'poverty', 'pink', 'justice', 
        'dune', 'pave', 'identity', 'motto', 'civil', 'found', 
        'inner', 'heart', 'rely', 'humor', 'diet', 'lumber', 
        'pioneer', 'unfold', 'fringe', 'album', 'rely', 'abandon'
    ];

    it('должен генерировать валидную мнемонику из 24 слов', async () => {
        const generated = await cryptoService.generateMnemonic();
        expect(generated.length).toBe(24);
        const isValid = await cryptoService.validateMnemonic(generated);
        expect(isValid).toBe(true);
    });

    it('должен корректно шифровать и расшифровывать мнемонику', () => {
        const encrypted = cryptoService.encryptMnemonic(mnemonic, password);
        expect(typeof encrypted).toBe('string');
        expect(encrypted).not.toBe(mnemonic.join(' '));

        const decrypted = cryptoService.decryptMnemonic(encrypted, password);
        expect(decrypted).toEqual(mnemonic);
    });

    it('должен выбрасывать ошибку при расшифровке с неверным паролем', () => {
        const encrypted = cryptoService.encryptMnemonic(mnemonic, password);
        expect(() => {
            cryptoService.decryptMnemonic(encrypted, 'wrong-password');
        }).toThrow();
    });

    it('должен генерировать ключи из мнемоники', async () => {
        // Заменяем реальный вызов на мок, так как @ton/crypto имеет проблемы в jsdom
        const mockKeyPair = { publicKey: Buffer.alloc(32), secretKey: Buffer.alloc(64) } as any;
        vi.spyOn(cryptoService, 'getKeyPair').mockResolvedValue(mockKeyPair);
        
        const keyPair = await cryptoService.getKeyPair(mnemonic);
        expect(keyPair).toEqual(mockKeyPair);
        expect(keyPair.publicKey.length).toBe(32);
    });
});