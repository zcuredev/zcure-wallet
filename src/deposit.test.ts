import { describe, expect, it, vi } from 'vitest';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { DepositAddressManager } from './deposit';

describe('DepositAddressManager', () => {
  it('generates one-time deposit addresses without view keys', () => {
    const manager = new DepositAddressManager();

    const deposit = manager.generateAddress();

    expect(deposit.address).toEqual(expect.any(String));
    expect(deposit.spendKey).toEqual(expect.any(String));
    expect(Object.keys(deposit).sort()).toEqual(['address', 'spendKey']);
  });

  it('throws a clear SDK error for malformed spend keys', () => {
    const manager = new DepositAddressManager();

    expect(() => manager.getKeypairFromSpendKey('not-a-base58-secret')).toThrow(
      'Invalid spend key'
    );
  });

  it('estimates the sweep fee from the transaction message', async () => {
    const manager = new DepositAddressManager();
    const source = Keypair.generate();
    const destination = Keypair.generate().publicKey;
    const spendKey = bs58.encode(source.secretKey);
    const blockhash = '11111111111111111111111111111111';
    const estimatedFee = 12_345;

    const connection = {
      getBalance: vi.fn(async (_publicKey: PublicKey) => 1_000_000),
      getLatestBlockhash: vi.fn(async () => ({ blockhash })),
      getFeeForMessage: vi.fn(async () => ({ value: estimatedFee })),
    };

    const transaction = await manager.createSweepTransaction(
      connection as unknown as Connection,
      spendKey,
      destination
    );

    expect(connection.getFeeForMessage).toHaveBeenCalledOnce();
    expect(transaction.instructions[0].keys[0].pubkey.equals(source.publicKey)).toBe(
      true
    );
    expect(transaction.instructions[0].keys[1].pubkey.equals(destination)).toBe(true);
    expect(transaction.instructions[0].data.readBigUInt64LE(4)).toBe(
      BigInt(1_000_000 - estimatedFee)
    );
  });
});
