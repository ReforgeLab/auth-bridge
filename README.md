# MintCap - Auth Bridge

A comprehensive authentication bridge system for the Sui blockchain that enables secure, centralized signature verification for sensitive capability management.

## 🏗️ Project Structure

```
mintcap/
├── contract/          # Move smart contract
│   ├── sources/       # Contract source code
│   └── tests/         # Contract tests
├── sdk/              # TypeScript SDK
│   └── src/          # SDK source code
└── README.md         # This file
```

## 🚀 What is Auth Bridge?

Auth Bridge is a security framework that allows you to:

- **🔒 Secure Sensitive Capabilities**: Store mint caps, admin caps, and other sensitive objects behind authentication
- **✍️ Centralized Signing**: Use Ed25519 signatures from trusted centralized services  
- **🔄 Safe Borrowing**: Borrow capabilities for operations and safely return them
- **⚙️ Flexible Configuration**: Define custom authentication parameters per protocol

## 🛠️ Components

### Smart Contract (`/contract`)
Move smart contract built for Sui blockchain that provides:
- Protocol registration and configuration
- Ed25519 signature verification
- Secure capability storage using borrow checker pattern
- Authentication object management

**Tech Stack**: Move language, Sui blockchain

### TypeScript SDK (`/sdk`)
Complete SDK for interacting with the smart contract:
- Transaction building helpers
- Signature construction and verification
- Type-safe API with full IntelliSense support
- Support for both backend (with private keys) and frontend usage

**Tech Stack**: TypeScript, Bun runtime, Sui TypeScript SDK

## 🚀 Quick Start


### 1. Install SDK

```bash
npm install @reforgelab/auth-bridge
# or
bun add @reforgelab/auth-bridge
```

### 2. Use in Your Application

```typescript
import { AuthBridgeSdk } from '@reforgelab/auth-bridge';

// Initialize authentication system
const sdk = new AuthBridgeSdk(privateKey);

// Set up authentication for your capability
await sdk.initialize({
  key: yourMintCap,
  input_keys: ['amount'],
  output_keys: ['amount'],
  // ... other params
});

// Authenticate and borrow capability
const signature = await sdk.constructSignature({/* params */});
const { authentication } = await sdk.signin({/* params */});
const { cap } = await sdk.borrowCap({ authentication, /* params */ });

// Use capability safely
// ... your secure operations

// Return capability
await sdk.returnCap({/* params */});
```

## 🏃 Development

### Prerequisites
- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install)
- [Bun](https://bun.sh/) (for SDK development)
- Node.js 18+ (alternative to Bun)

### Smart Contract Development

```bash
cd contract
sui move build        # Build contract
sui move test          # Run tests
```

### SDK Development  

```bash
cd sdk
bun install           # Install dependencies
bun run format        # Format code
```

## 📝 Use Cases

- **NFT Collections**: Secure mint capabilities behind authentication
- **Gaming**: Protect admin capabilities for in-game assets
- **DeFi**: Secure treasury and admin functions
- **DAOs**: Authenticate proposal execution capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 👤 Author

Carl Klöfverskjöld
- GitHub: [@Reblixt](https://github.com/Reblixt)

## 🔗 Links

- [Sui Documentation](https://docs.sui.io/)
- [Move Language Reference](https://move-language.github.io/move/)
- [SDK on NPM](https://www.npmjs.com/package/@reforgelab/auth-bridge)
