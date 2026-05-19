import { 
  Rpc, 
  createRpc, 
  LightSystemProgram, 
  bn, 
  selectStateTreeInfo,
  selectMinCompressedSolAccountsForTransfer
} from '@lightprotocol/stateless.js';
import type { CompressedAccountWithMerkleContext, TreeInfo } from '@lightprotocol/stateless.js';
import { ComputeBudgetProgram, Connection, Transaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { StealthManager } from './stealth';
import type { 
  ZcureConfig, 
  ShieldOptions, 
  UnshieldOptions, 
  PrivateTransferOptions,
  Network
} from './types';

export * from './types';
export * from './stealth';

/**
 * Zcure Client SDK
 * 
 * The main entry point for interacting with the Zcure Privacy Protocol on Solana.
 */
export class ZcureClient {
  public readonly connection: Connection;
  public readonly stealth: StealthManager;
  
  private rpc: Rpc;
  private network: Network;
  private outputStateTreeInfo?: TreeInfo;
  
  constructor(config: ZcureConfig) {
    this.connection = new Connection(config.rpcUrl);
    this.network = config.network || 'mainnet-beta';
    this.outputStateTreeInfo = config.outputStateTreeInfo;
    this.stealth = new StealthManager();
    
    const lightRpcUrl = config.lightRpcUrl || config.rpcUrl;
    this.rpc = createRpc(lightRpcUrl, lightRpcUrl);
  }

  /**
   * Initialize the client
   * @param config Client configuration
   */
  static init(config: ZcureConfig): ZcureClient {
    return new ZcureClient(config);
  }

  /**
   * Return the configured Light Protocol output state tree, if one was provided.
   */
  getOutputStateTreeInfo(): TreeInfo | undefined {
    return this.outputStateTreeInfo;
  }

  /**
   * Get private (compressed) balance for a wallet
   * 
   * @param wallet The wallet public key to check
   * @returns Balance in SOL
   */
  async getPrivateBalance(wallet: PublicKey): Promise<number> {
    try {
      const compressedAccounts = await this.rpc.getCompressedAccountsByOwner(wallet);
      
      if (!compressedAccounts.items || compressedAccounts.items.length === 0) {
        return 0;
      }

      const totalLamports = compressedAccounts.items.reduce((sum: number, acc: CompressedAccountWithMerkleContext) => {
        return sum + (acc.lamports?.toNumber() || 0);
      }, 0);

      return totalLamports / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get private balance:', error);
      throw error;
    }
  }

  /**
   * Create a shield transaction (Public SOL -> Private/Compressed SOL)
   */
  async shield(options: ShieldOptions): Promise<Transaction> {
    const { amount, wallet } = options;
    
    if (amount <= 0) throw new Error('Amount must be positive');

    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    const outputStateTreeInfo = await this.resolveOutputStateTreeInfo();

    // Create compress (shield) instruction
    const compressIx = await LightSystemProgram.compress({
      payer: wallet,
      toAddress: wallet,
      lamports,
      outputStateTreeInfo,
    });

    const { blockhash } = await this.connection.getLatestBlockhash();
    
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet;
    
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })
    );
    transaction.add(compressIx);

    return transaction;
  }

  /**
   * Create an unshield transaction (Private/Compressed SOL -> Public SOL)
   */
  async unshield(options: UnshieldOptions): Promise<Transaction> {
    const { amount, wallet, recipient } = options;
    const targetRecipient = recipient || wallet;
    
    if (amount <= 0) throw new Error('Amount must be positive');

    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    // Get compressed accounts
    const compressedAccounts = await this.rpc.getCompressedAccountsByOwner(wallet);
    
    if (!compressedAccounts.items || compressedAccounts.items.length === 0) {
      throw new Error('No private balance found');
    }

    // Select accounts to spend
    const [selectedAccounts] = selectMinCompressedSolAccountsForTransfer(
      compressedAccounts.items,
      bn(lamports)
    );

    if (!selectedAccounts || selectedAccounts.length === 0) {
      throw new Error('Insufficient private balance');
    }

    // Get validity proof
    const proof = await this.rpc.getValidityProof(
      selectedAccounts.map((acc: CompressedAccountWithMerkleContext) => bn(acc.hash))
    );

    // Create decompress (unshield) instruction
    const decompressIx = await LightSystemProgram.decompress({
      payer: wallet,
      toAddress: targetRecipient,
      lamports,
      inputCompressedAccounts: selectedAccounts,
      recentValidityProof: proof.compressedProof,
      recentInputStateRootIndices: proof.rootIndices,
    });

    const { blockhash } = await this.connection.getLatestBlockhash();
    
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet;
    
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
    );
    transaction.add(decompressIx);

    return transaction;
  }

  /**
   * Transfer private SOL to another address (Private -> Private)
   * The recipient will receive compressed SOL.
   */
  async transfer(options: PrivateTransferOptions): Promise<Transaction> {
    const { amount, wallet, recipient } = options;
    
    if (amount <= 0) throw new Error('Amount must be positive');

    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    // Get compressed accounts
    const compressedAccounts = await this.rpc.getCompressedAccountsByOwner(wallet);
    
    if (!compressedAccounts.items || compressedAccounts.items.length === 0) {
      throw new Error('No private balance found');
    }

    // Select accounts
    const [selectedAccounts] = selectMinCompressedSolAccountsForTransfer(
      compressedAccounts.items,
      bn(lamports)
    );

    if (!selectedAccounts || selectedAccounts.length === 0) {
      throw new Error('Insufficient private balance');
    }

    // Get proof
    const proof = await this.rpc.getValidityProof(
      selectedAccounts.map((acc: CompressedAccountWithMerkleContext) => bn(acc.hash))
    );

    // Create transfer instruction
    const transferIx = await LightSystemProgram.transfer({
      payer: wallet,
      toAddress: recipient,
      lamports,
      inputCompressedAccounts: selectedAccounts,
      recentValidityProof: proof.compressedProof,
      recentInputStateRootIndices: proof.rootIndices,
    });

    const { blockhash } = await this.connection.getLatestBlockhash();
    
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet;
    
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
    );
    transaction.add(transferIx);

    return transaction;
  }

  private async resolveOutputStateTreeInfo(): Promise<TreeInfo> {
    if (this.outputStateTreeInfo) {
      return this.outputStateTreeInfo;
    }

    const stateTreeInfos = await this.rpc.getStateTreeInfos();
    const outputStateTreeInfo = selectStateTreeInfo(stateTreeInfos);
    this.outputStateTreeInfo = outputStateTreeInfo;

    return outputStateTreeInfo;
  }
}
