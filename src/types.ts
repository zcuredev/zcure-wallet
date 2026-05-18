import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export type Network = 'mainnet-beta' | 'devnet' | 'testnet';

export interface ZcureConfig {
  /**
   * The RPC URL to use for Solana connection
   */
  rpcUrl: string;
  
  /**
   * The RPC URL for Light Protocol (zk compression)
   * If not provided, will try to use rpcUrl or default endpoints
   */
  lightRpcUrl?: string;
  
  /**
   * The network cluster
   * @default 'mainnet-beta'
   */
  network?: Network;
}

export interface ShieldOptions {
  /**
   * Amount of SOL to shield
   */
  amount: number;
  
  /**
   * The wallet to shield funds from (fee payer)
   */
  wallet: PublicKey;
}

export interface UnshieldOptions {
  /**
   * Amount of SOL to unshield
   */
  amount: number;
  
  /**
   * The wallet that owns the shielded funds (fee payer)
   */
  wallet: PublicKey;
  
  /**
   * The recipient address for the unshielded SOL
   * If not provided, defaults to the wallet address
   */
  recipient?: PublicKey;
}

export interface PrivateTransferOptions {
  /**
   * Amount of SOL to transfer
   */
  amount: number;
  
  /**
   * The sender's wallet (fee payer)
   */
  wallet: PublicKey;
  
  /**
   * The recipient's address (can be a public address or stealth address)
   */
  recipient: PublicKey;
}

export interface StealthAddressResult {
  /**
   * The public address that can receive funds
   */
  address: string;
  
  /**
   * The key used to view incoming transactions
   */
  viewKey: string;
  
  /**
   * The key used to spend funds (KEEP SECRET)
   */
  spendKey: string;
}
