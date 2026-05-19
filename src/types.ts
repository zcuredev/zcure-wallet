import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import type { TreeInfo } from '@lightprotocol/stateless.js';

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
   * Optional Light Protocol output state tree.
   * If omitted, the client fetches active state trees from the configured Light RPC.
   */
  outputStateTreeInfo?: TreeInfo;
  
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
   * The recipient's address
   */
  recipient: PublicKey;
}

export interface StealthAddressResult {
  /**
   * The public one-time deposit address that can receive funds
   */
  address: string;
  
  /**
   * Compatibility metadata; not a full transaction-scanning key
   */
  viewKey: string;
  
  /**
   * The key used to spend funds (KEEP SECRET)
   */
  spendKey: string;
}
