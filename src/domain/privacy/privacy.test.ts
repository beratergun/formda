import { it,expect,vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { pinHash,verifyPin } from './index';
it('stores a salted slow hash, verifies PIN and rejects invalid inputs',async()=>{vi.stubGlobal('crypto',webcrypto);try{const hash=await pinHash('1234','test-salt');expect(hash).toMatch(/^[a-f0-9]{64}$/);expect(hash).not.toContain('1234');expect(await pinHash('1234','other-salt')).not.toBe(hash);expect(await verifyPin('1234','test-salt',hash)).toBe(true);expect(await verifyPin('9999','test-salt',hash)).toBe(false);expect(await verifyPin('bad','test-salt',hash)).toBe(false);await expect(pinHash('1','salt')).rejects.toThrow();}finally{vi.unstubAllGlobals();}});
