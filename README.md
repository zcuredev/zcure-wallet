# @zcure/sdk

Solana SDK helpers for Light Protocol compressed SOL transactions and experimental
one-time deposit addresses.

This package is intentionally small. It constructs transactions for shielding,
unshielding, transferring compressed SOL, querying compressed balances, and
sweeping funds from generated one-time deposit addresses.

## Current Status

This SDK is not a complete privacy protocol by itself.

- Compressed SOL support is provided by Light Protocol.
- One-time deposit addresses are ordinary Solana keypairs generated for isolated
  receives.
- The SDK does not currently implement stealth-output announcements, recipient
  scanning, encrypted memos, or a Monero/Zcash-style stealth-address protocol.
- Applications must still review transaction metadata and Light Protocol
  behavior for their own threat model.

## Installation

```bash
npm install @zcure/sdk @solana/web3.js
```

## Quick Start

```typescript
import { ZcureClient } from "@zcure/sdk";
import { PublicKey } from "@solana/web3.js";

const client = ZcureClient.init({
  rpcUrl: "https://api.mainnet-beta.solana.com",
  lightRpcUrl: "https://your-light-rpc.example",
  network: "mainnet-beta",
});

const wallet = new PublicKey("YourWalletAddress...");

const shieldTx = await client.shield({
  amount: 1,
  wallet,
});
```

The returned transaction must be reviewed, signed, and sent by the caller.

## API

### `ZcureClient.init(config)`

Creates a client.

```typescript
type Network = "mainnet-beta" | "devnet" | "testnet";

interface ZcureConfig {
  rpcUrl: string;
  lightRpcUrl?: string;
  network?: Network;
  outputStateTreeInfo?: TreeInfo;
}
```

If `outputStateTreeInfo` is omitted, the SDK fetches active Light Protocol state
tree info from the configured Light RPC and selects one with
`selectStateTreeInfo`.

### `shield(options)`

Creates a transaction that compresses public SOL into compressed SOL owned by the
wallet.

```typescript
const tx = await client.shield({
  amount: 1,
  wallet,
});
```

### `unshield(options)`

Creates a transaction that decompresses compressed SOL into a public recipient.

```typescript
const tx = await client.unshield({
  amount: 0.5,
  wallet,
  recipient: wallet,
});
```

### `transfer(options)`

Creates a compressed SOL transfer transaction.

```typescript
const tx = await client.transfer({
  amount: 0.1,
  wallet,
  recipient: new PublicKey("RecipientAddress..."),
});
```

### `getPrivateBalance(wallet)`

Returns the wallet's compressed SOL balance in SOL.

```typescript
const balance = await client.getPrivateBalance(wallet);
```

### `StealthManager`

`StealthManager` is retained for API compatibility, but the current
implementation should be treated as an experimental one-time deposit address
helper.

```typescript
const deposit = client.stealth.generateAddress();

const sweepTx = await client.stealth.createSweepTransaction(
  client.connection,
  deposit.spendKey,
  wallet
);
```

The generated `spendKey` controls the deposit address. Store it encrypted and do
not expose it to logs, analytics, support tooling, or remote services.

## Security Notes

- This SDK does not provide audited end-to-end transaction privacy.
- Spend keys are bearer secrets.
- View keys in the current implementation are compatibility metadata, not a full
  scanning mechanism.
- Sweep transactions estimate fees with `getFeeForMessage` instead of relying on
  a fixed lamport reserve.
- Production apps should pin trusted RPC providers, show transaction previews,
  and add their own key-storage controls.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting and the current
threat-model boundaries.

## Development

```bash
npm ci
npm test
npm run build
npm audit --omit=dev
```

CI runs build and tests on pushes and pull requests.

## License

MIT
