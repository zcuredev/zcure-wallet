import { Keypair, PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import type { DepositAddressResult } from './types';

/**
 * Experimental one-time deposit address helper.
 *
 * This is not a full privacy protocol. It generates isolated Solana keypairs
 * and sweep transactions for callers that want per-receive addresses.
 */
export class DepositAddressManager {
  /**
   * Generate a new one-time deposit address.
   *
   * @returns A new deposit address and its spend key
   */
  generateAddress(): DepositAddressResult {
    const spendKeypair = Keypair.generate();

    return {
      address: spendKeypair.publicKey.toBase58(),
      spendKey: bs58.encode(spendKeypair.secretKey),
    };
  }

  /**
   * Create a transaction to sweep funds from a one-time deposit address
   *
   * @param connection Solana connection
   * @param spendKey The spend key of the one-time deposit address
   * @param destination The destination address to sweep funds to
   * @returns Transaction ready to be signed and sent
   */
  async createSweepTransaction(
    connection: Connection,
    spendKey: string,
    destination: PublicKey
  ): Promise<Transaction> {
    const spendKeypair = this.getKeypairFromSpendKey(spendKey);

    const balance = await connection.getBalance(spendKeypair.publicKey);
    if (balance === 0) {
      throw new Error('No funds to sweep');
    }

    const { blockhash } = await connection.getLatestBlockhash();
    const feeProbe = this.createUnsignedSweepTransaction(
      spendKeypair.publicKey,
      destination,
      balance,
      blockhash
    );
    const feeResult = await connection.getFeeForMessage(feeProbe.compileMessage());
    const fee = feeResult.value;

    if (fee === null) {
      throw new Error('Unable to estimate sweep transaction fee');
    }

    const transferAmount = balance - fee;

    if (transferAmount <= 0) {
      throw new Error('Balance too low to cover transaction fee');
    }

    const transaction = this.createUnsignedSweepTransaction(
      spendKeypair.publicKey,
      destination,
      transferAmount,
      blockhash
    );

    transaction.sign(spendKeypair);

    return transaction;
  }

  /**
   * Recover a keypair from a spend key string
   */
  getKeypairFromSpendKey(spendKey: string): Keypair {
    try {
      return Keypair.fromSecretKey(bs58.decode(spendKey));
    } catch {
      throw new Error('Invalid spend key');
    }
  }

  private createUnsignedSweepTransaction(
    source: PublicKey,
    destination: PublicKey,
    lamports: number,
    blockhash: string
  ): Transaction {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: source,
        toPubkey: destination,
        lamports,
      })
    );

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = source;

    return transaction;
  }
}
