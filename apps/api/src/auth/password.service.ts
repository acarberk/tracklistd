import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const BCRYPT_COST = 12;

export interface VerifyResult {
  ok: boolean;
  needsRehash: boolean;
}

@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_COST);
  }

  async verify(plain: string, hash: string): Promise<VerifyResult> {
    const ok = await bcrypt.compare(plain, hash);
    if (!ok) {
      return { ok: false, needsRehash: false };
    }

    const currentCost = bcrypt.getRounds(hash);
    return { ok: true, needsRehash: currentCost < BCRYPT_COST };
  }
}
