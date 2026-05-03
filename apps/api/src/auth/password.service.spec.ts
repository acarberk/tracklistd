import * as bcrypt from 'bcrypt';

import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();
  const password = 'correct-horse-battery-staple';

  describe('hash', () => {
    it('produces a bcrypt hash with cost 12', async () => {
      const hash = await service.hash(password);
      expect(hash).toMatch(/^\$2[aby]\$12\$/);
    });

    it('produces a different hash for the same input each time', async () => {
      const a = await service.hash(password);
      const b = await service.hash(password);
      expect(a).not.toEqual(b);
    });
  });

  describe('verify', () => {
    it('returns ok=true for the correct password', async () => {
      const hash = await service.hash(password);
      const result = await service.verify(password, hash);
      expect(result.ok).toBe(true);
      expect(result.needsRehash).toBe(false);
    });

    it('returns ok=false for a wrong password', async () => {
      const hash = await service.hash(password);
      const result = await service.verify('wrong-password', hash);
      expect(result.ok).toBe(false);
      expect(result.needsRehash).toBe(false);
    });

    it('flags needsRehash when stored hash uses a lower cost than current target', async () => {
      const lowerCostHash = await bcrypt.hash(password, 10);
      const result = await service.verify(password, lowerCostHash);
      expect(result.ok).toBe(true);
      expect(result.needsRehash).toBe(true);
    });

    it('does not flag needsRehash for a wrong password (no rehash leak)', async () => {
      const lowerCostHash = await bcrypt.hash(password, 10);
      const result = await service.verify('wrong', lowerCostHash);
      expect(result.ok).toBe(false);
      expect(result.needsRehash).toBe(false);
    });
  });
});
