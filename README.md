<p align="center">
  <img src="https://www.zcureit.xyz/images/ZCure_X.jpg" alt="Zcure" width="180" height="50"/>
</p>

<h1 align="center">@zcure/sdk</h1>

<p align="center">
  <strong>Official Solana SDK for the Zcure Ghost Protocol</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@zcure/sdk"><img src="https://img.shields.io/npm/v/@zcure/sdk.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@zcure/sdk"><img src="https://img.shields.io/npm/dm/@zcure/sdk.svg?style=flat-square" alt="npm downloads" /></a>
  <a href="https://github.com/zcure/zcure/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="license" /></a>
  <a href="https://solana.com"><img src="https://img.shields.io/badge/Solana-Mainnet-9945FF?style=flat-square&logo=solana" alt="Solana" /></a>
</p>

<p align="center">
  Enable ZK-powered privacy in your Solana applications with just a few lines of code.<br/>
  Built on <a href="https://lightprotocol.com">Light Protocol</a> for state compression and validity proofs.
</p>

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [ZcureClient](#zcureclient)
  - [StealthManager](#stealthmanager)
- [Types](#types)
- [Architecture](#architecture)
- [Security](#security)
- [License](#license)

---

## Features

| Feature                   | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| **Shield (Compress)**     | Convert public SOL into private, ZK-compressed balances |
| **Unshield (Decompress)** | Convert private balances back to public SOL             |
| **Private Transfers**     | Send SOL privately without revealing amounts on-chain   |
| **Stealth Addresses**     | Generate one-time addresses for unlinkable receives     |
| **Balance Queries**       | Check private (compressed) balances                     |
| **Non-Custodial**         | Full control of keys and funds at all times             |

---

## Installation

```bash
# npm
npm install @zcure/sdk @solana/web3.js

# pnpm (recommended)
pnpm add @zcure/sdk @solana/web3.js

# yarn
yarn add @zcure/sdk @solana/web3.js
```

### Peer Dependencies

- `@solana/web3.js` >= 1.95.0

---

## Quick Start

### 1. Initialize the Client

```typescript
import { ZcureClient } from "@zcure/sdk";

const client = ZcureClient.init({
  rpcUrl: "https://api.mainnet-beta.solana.com",
  lightRpcUrl: "https://zk-testnet.helius.dev:8899", // Optional: dedicated Light RPC
  network: "mainnet-beta", // 'mainnet-beta' | 'devnet' | 'testnet'
});
```

### 2. Shield SOL (Go Private)

```typescript
import { PublicKey } from "@solana/web3.js";

const wallet = new PublicKey("YourWalletAddress...");

// Create a transaction to shield 1 SOL
const transaction = await client.shield({
  amount: 1.0,
  wallet: wallet,
});

// Sign and send with your wallet adapter
await sendTransaction(transaction, connection);
```

### 3. Check Private Balance

```typescript
const privateBalance = await client.getPrivateBalance(wallet);
console.log(`Private Balance: ${privateBalance} SOL`);
```

### 4. Unshield SOL (Go Public)

```typescript
// Unshield 0.5 SOL back to public balance
const transaction = await client.unshield({
  amount: 0.5,
  wallet: wallet,
  recipient: wallet, // Optional: defaults to wallet
});
```

### 5. Private Transfer

```typescript
const recipient = new PublicKey("RecipientAddress...");

// Transfer 0.1 SOL privately (compressed -> compressed)
const transaction = await client.transfer({
  amount: 0.1,
  wallet: wallet,
  recipient: recipient,
});
```

### 6. Stealth Addresses

```typescript
// Generate a new stealth address for receiving
const stealth = client.stealth.generateAddress();

console.log("Address:", stealth.address); // Share publicly
console.log("View Key:", stealth.viewKey); // For scanning incoming txs
console.log("Spend Key:", stealth.spendKey); // ⚠️ KEEP SECRET

// Sweep funds from stealth address to your main wallet
const sweepTx = await client.stealth.createSweepTransaction(
  client.connection,
  stealth.spendKey,
  wallet,
);
```

---

## API Reference

### ZcureClient

The main entry point for interacting with the Zcure Privacy Protocol.

#### Constructor

```typescript
const client = ZcureClient.init(config: ZcureConfig): ZcureClient
```

#### Properties

| Property     | Type             | Description                |
| ------------ | ---------------- | -------------------------- |
| `connection` | `Connection`     | Solana connection instance |
| `stealth`    | `StealthManager` | Stealth address manager    |

#### Methods

##### `shield(options: ShieldOptions): Promise<Transaction>`

Creates a transaction to compress (shield) public SOL into private balance.

```typescript
interface ShieldOptions {
  amount: number; // Amount in SOL
  wallet: PublicKey; // Fee payer and source
}
```

##### `unshield(options: UnshieldOptions): Promise<Transaction>`

Creates a transaction to decompress (unshield) private SOL back to public.

```typescript
interface UnshieldOptions {
  amount: number; // Amount in SOL
  wallet: PublicKey; // Fee payer and owner of private balance
  recipient?: PublicKey; // Destination (defaults to wallet)
}
```

##### `transfer(options: PrivateTransferOptions): Promise<Transaction>`

Creates a private transfer transaction (compressed → compressed).

```typescript
interface PrivateTransferOptions {
  amount: number; // Amount in SOL
  wallet: PublicKey; // Sender (fee payer)
  recipient: PublicKey; // Recipient address
}
```

##### `getPrivateBalance(wallet: PublicKey): Promise<number>`

Returns the private (compressed) SOL balance for a wallet.

---

### StealthManager

Manages stealth address generation and fund sweeping.

#### Methods

##### `generateAddress(): StealthAddressResult`

Generates a new stealth address with associated keys.

```typescript
interface StealthAddressResult {
  address: string; // Public address to share
  viewKey: string; // For scanning incoming transactions
  spendKey: string; // For spending funds (KEEP SECRET)
}
```

##### `createSweepTransaction(connection, spendKey, destination): Promise<Transaction>`

Creates a signed transaction to sweep all funds from a stealth address.

##### `getKeypairFromSpendKey(spendKey: string): Keypair`

Recovers a Keypair from a spend key string.

---

## Types

```typescript
type Network = "mainnet-beta" | "devnet" | "testnet";

interface ZcureConfig {
  rpcUrl: string; // Solana RPC endpoint
  lightRpcUrl?: string; // Light Protocol RPC (optional)
  network?: Network; // Default: 'mainnet-beta'
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    @zcure/sdk                           │
├─────────────────────────────────────────────────────────┤
│  ZcureClient                                            │
│  ├── shield()      → Compress SOL (public → private)    │
│  ├── unshield()    → Decompress SOL (private → public)  │
│  ├── transfer()    → Private transfer (private → private)│
│  └── getPrivateBalance()                                │
├─────────────────────────────────────────────────────────┤
│  StealthManager                                         │
│  ├── generateAddress()                                  │
│  ├── createSweepTransaction()                           │
│  └── getKeypairFromSpendKey()                           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Light Protocol (ZK Layer)                  │
│  • State compression via Merkle trees                   │
│  • Validity proofs for private state transitions        │
│  • LightSystemProgram for compress/decompress/transfer  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Solana Blockchain                     │
└─────────────────────────────────────────────────────────┘
```

### Dependencies

| Package                           | Purpose                        |
| --------------------------------- | ------------------------------ |
| `@lightprotocol/stateless.js`     | ZK state compression & proofs  |
| `@lightprotocol/compressed-token` | Compressed token support       |
| `@solana/web3.js`                 | Solana blockchain interactions |
| `bs58`                            | Base58 encoding for keys       |

---

## Security

> ⚠️ **Important Security Considerations**

- **Spend Keys**: Never share or expose spend keys. They grant full control over funds.
- **View Keys**: Can be shared for read-only access (e.g., compliance, auditing).
- **Client-Side**: All cryptographic operations happen client-side. Your keys never leave your device.
- **Non-Custodial**: Zcure never has access to your funds or keys.

### Best Practices

1. Store spend keys securely (encrypted storage, hardware wallets)
2. Use unique stealth addresses for each receive
3. Verify transaction details before signing
4. Use dedicated RPC endpoints for production

---

## Examples

### Full Integration Example

```typescript
import { ZcureClient } from "@zcure/sdk";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";

async function main() {
  // Initialize client
  const client = ZcureClient.init({
    rpcUrl: process.env.SOLANA_RPC_URL!,
    network: "devnet",
  });

  const wallet = new PublicKey("...");

  // 1. Shield 1 SOL
  const shieldTx = await client.shield({ amount: 1.0, wallet });
  // ... sign and send shieldTx

  // 2. Check private balance
  const balance = await client.getPrivateBalance(wallet);
  console.log(`Private balance: ${balance} SOL`);

  // 3. Generate stealth address for receiving
  const stealth = client.stealth.generateAddress();
  console.log(`Send funds to: ${stealth.address}`);

  // 4. Transfer privately
  const recipient = new PublicKey("...");
  const transferTx = await client.transfer({
    amount: 0.5,
    wallet,
    recipient,
  });
  // ... sign and send transferTx
}
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/zcure/zcure/blob/main/CONTRIBUTING.md) for details.

---

## License

MIT © [Zcure](https://zcureit.xyz)

---

<p align="center">
  <strong>Privacy is a right, not a crime.</strong><br/>
  <a href="https://zcureit.xyz">Website</a> •
  <a href="https://x.com/ZcureGates">Twitter</a>
</p>
