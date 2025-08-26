# @reforgelab/auth-bridge

A TypeScript SDK for interacting with the Auth Bridge smart contract on Sui blockchain. This SDK handles centralized personal message signature verification and secure capability borrowing.

## Installation

```bash
npm install @reforgelab/auth-bridge
```

## Features

- **🔐 Centralized Authentication**: Secure signature-based authentication system
- **🔑 Capability Management**: Safe borrowing and returning of sensitive capabilities
- **📝 Message Signing**: Ed25519 signature construction and verification
- **⚡ Transaction Building**: Easy integration with Sui transaction blocks
- **🛠️ TypeScript Support**: Full type safety and IntelliSense support

## Quick Start

```typescript
import { AuthBridgeSdk } from '@reforgelab/auth-bridge';
import { Transaction } from '@mysten/sui/transactions';

// Initialize SDK with private key (for backend use)
const sdk = new AuthBridgeSdk(privateKeyBytes);

// Or initialize without key (for frontend, using signature service)
const sdk = new AuthBridgeSdk();
```

## Core Workflows

### 1. Initialize Authentication Protocol

```typescript
const tx = new Transaction();

await sdk.initialize({
  key: mintCapId,
  input_keys: ['amount', 'recipient'],
  output_keys: ['recipient'],
  protocol: collectionId,
  centralizedAddress: '0x...',
  capType: 'MintCap',
  protocolType: 'Collection',
  tx
});
```

### 2. Sign In with Authentication

```typescript
// Construct signature
const signature = await sdk.constructSignature({
  sendersAddress: '0x...',
  capType: 'MintCap', 
  protocolType: 'Collection',
  options: {
    message: ['1000', '0x...'], // amount, recipient
    salt: 'unique-nonce'
  }
});

// Sign in to get authentication
const { transaction, authentication } = await sdk.signin({
  protocolWrapper: protocolId,
  holderCap: holderCapId,
  fullSignature: signature,
  data: new Map([
    ['amount', '1000'],
    ['recipient', '0x...']
  ]),
  capType: 'MintCap',
  protocolType: 'Collection',
  tx: new Transaction()
});
```

### 3. Borrow and Use Capability

```typescript
// Borrow capability
const { transaction, cap, borrowPotatao } = await sdk.borrowCap({
  holderCap: holderCapId,
  authentication,
  capType: 'MintCap',
  tx: transaction
});

// Use capability for secure operations
transaction.moveCall({
  target: `${packageId}::nft::mint`,
  arguments: [cap, /* other args */]
});

// Return capability
await sdk.returnCap({
  tx: transaction,
  cap,
  capType: 'MintCap', 
  holderCap: holderCapId,
  borrowPotatao
});
```

## API Reference

### Class: AuthBridgeSdk

#### Constructor
- `new AuthBridgeSdk(privateKey?: Uint8Array | string)`

#### Methods
- `initialize(params: InitializeParams): Promise<Transaction>`
- `signin(params: SigninParams): Promise<{transaction: Transaction, authentication: any}>`
- `constructSignature(params: ConstructSignatureParams): Promise<Uint8Array | null>`
- `borrowCap(params: BorrowCapParams): Promise<{transaction: Transaction, cap: any, borrowPotatao: any}>`
- `returnCap(params: ReturnCapParams): Promise<Transaction>`
- `withdrawCap(params: WithdrawCapParams): Promise<Transaction>`

## Dependencies

- `@mysten/sui`: Sui TypeScript SDK
- `@mysten/bcs`: Binary Canonical Serialization
- `@mysten/kiosk`: Sui Kiosk framework
- `axios`: HTTP client for signature services

## Development

```bash
# Install dependencies
bun install

# Format code
bun run format

# Type check
tsc --noEmit
```

## License

MIT License

## Keywords

sui, framework, auth, sdk