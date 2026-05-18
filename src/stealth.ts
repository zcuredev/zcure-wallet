import { Keypair, PublicKey, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import type { StealthAddressResult } from './types';

/**
 * Manager for Zcure Stealth Addresses
 */
export class StealthManager {
  /**
   * Generate a new stealth address
   * 
   * @returns A new stealth address with view and spend keys
   */
  generateAddress(): StealthAddressResult {
    // Generate ephemeral keypair for this stealth address
    const spendKeypair = Keypair.generate();
    
    // View key is derived from first 32 bytes of secret key
    const viewKeySeed = spendKeypair.secretKey.slice(0, 32);
    const viewKeypair = Keypair.fromSeed(viewKeySeed);

    return {
      address: spendKeypair.publicKey.toBase58(),
      viewKey: bs58.encode(viewKeypair.secretKey),
      spendKey: bs58.encode(spendKeypair.secretKey),
    };
  }

  /**
   * Create a transaction to sweep funds from a stealth address
   * 
   * @param connection Solana connection
   * @param spendKey The spend key of the stealth address
   * @param destination The destination address to sweep funds to
   * @returns Transaction ready to be signed and sent
   */
  async createSweepTransaction(
    connection: Connection,
    spendKey: string,
    destination: PublicKey
  ): Promise<Transaction> {
    const spendKeypair = Keypair.fromSecretKey(bs58.decode(spendKey));
    
    const balance = await connection.getBalance(spendKeypair.publicKey);
    if (balance === 0) {
      throw new Error('No funds to sweep');
    }
    
    // Reserve for transaction fee (approx 0.000005 SOL)
    const fee = 5000; 
    const transferAmount = balance - fee;
    
    if (transferAmount <= 0) {
      throw new Error('Balance too low to cover transaction fee');
    }
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: spendKeypair.publicKey,
        toPubkey: destination,
        lamports: transferAmount,
      })
    );
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = spendKeypair.publicKey;
    
    // Sign with spend key immediately as we have it
    transaction.sign(spendKeypair);
    
    return transaction;
  }

  /**
   * Recover a keypair from a spend key string
   */
  getKeypairFromSpendKey(spendKey: string): Keypair {
    return Keypair.fromSecretKey(bs58.decode(spendKey));
  }
}
