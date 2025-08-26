# Auth Bridge Smart Contract

A Move smart contract for the Sui blockchain that provides centralized authentication for secure capability management. This contract allows users to store sensitive capabilities (like mint caps) behind an authentication layer that requires centralized signature verification.

## Overview

The Auth Bridge contract enables:
- **Secure Capability Storage**: Store sensitive objects (mint caps, admin caps, etc.) behind authentication
- **Centralized Verification**: Use Ed25519 signatures from a trusted centralized service
- **Flexible Protocol Configuration**: Define custom input/output parameters for different use cases
- **Borrow Pattern**: Safely borrow capabilities for operations and return them

## Core Components

### Registry
Global registry that prevents duplicate protocol registrations.

### Protocol<T>
Configuration wrapper that defines:
- Centralized signing address
- Required input keys for message construction
- Output keys returned after authentication

### HolderCap<T>
Wrapper that securely stores capabilities using Sui's borrow checker pattern.

### Authentication<T>
Proof object returned after successful signature verification, enables capability borrowing.

## Key Functions

### `default<T, P>`
Initialize a new authentication protocol with a capability.

### `signin<T, P>`
Authenticate using Ed25519 signature verification and receive an Authentication object.

### `take_key<T>` / `return_key<T>`
Borrow and return capabilities safely using the borrow checker pattern.

### `destroy<T, P>`
Cleanup function to destroy the protocol and return the original capability.

## Usage Flow

1. **Initialize**: Create protocol with capability and configuration
2. **Sign In**: Verify signature against centralized service
3. **Borrow**: Use Authentication to borrow capability
4. **Execute**: Perform operations with borrowed capability
5. **Return**: Return capability to wrapper

## Build & Test

```bash
sui move build
sui move test
```

## Error Codes

- `101`: Wrong full signature length
- `102`: Invalid Ed25519 signature  
- `103`: Protocol address doesn't match

## License

MIT License - see LICENSE file for details.

## Author

Carl Klöfverskjöld ([@Reblixt](https://github.com/Reblixt))