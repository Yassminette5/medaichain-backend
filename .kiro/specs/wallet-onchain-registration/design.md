# Wallet On-Chain Registration Bugfix Design

## Overview

User wallets are created server-side via `ethers.Wallet.createRandom()` and stored encrypted in MongoDB, but no on-chain transaction is ever submitted at creation time. This means the wallet has no blockchain footprint until it receives its first NFT mint, making independent on-chain verification impossible.

The fix introduces a `WalletChainService` that sends a zero-value self-transfer from the minter wallet to the new wallet address on Polygon immediately after keypair generation. The result (`txHash`, `confirmedAt`) is persisted on the user record. On-chain failure is non-blocking — wallet creation in MongoDB always completes regardless of chain outcome.

## Glossary

- **Bug_Condition (C)**: A wallet creation event where `walletRegistrationTxHash IS NULL AND walletRegisteredOnChainAt IS NULL AND walletAddress IS NOT NULL` — i.e. the wallet exists in MongoDB but has never been anchored on-chain.
- **Property (P)**: After the fix, for any input satisfying C, `registerWalletOnChain` SHALL return a non-null `txHash` and the user record SHALL have `walletRegistrationTxHash` and `walletRegisteredOnChainAt` set.
- **Preservation**: All behaviors unrelated to on-chain registration — keypair generation, encrypted storage, NFT minting, existing wallet records — must remain exactly as before.
- **WalletService**: `src/wallet/wallet.service.ts` — generates keypairs and encrypts private keys; currently synchronous (`createWallet(): WalletPayload`).
- **WalletChainService**: New service `src/wallet/wallet-chain.service.ts` — responsible solely for submitting the on-chain registration transaction via a zero-value ETH transfer from the minter wallet.
- **NftChainService**: `src/nft/nft-chain.service.ts` — existing service for NFT minting; shares provider/signer setup patterns that `WalletChainService` will replicate.
- **walletOnChainRegistrationStatus**: New enum field on the User schema: `pending | registered | failed`.

## Bug Details

### Bug Condition

The bug manifests whenever `WalletService.createWallet()` is called to provision a new user wallet. The function returns a `WalletPayload` with a valid `address`, but never submits any transaction to Polygon. As a result, `walletRegistrationTxHash` and `walletRegisteredOnChainAt` are always null on newly created user records.

**Formal Specification:**
```
FUNCTION isBugCondition(W)
  INPUT: W of type WalletCreationEvent {
    walletAddress: string | null,
    walletRegistrationTxHash: string | null,
    walletRegisteredOnChainAt: Date | null
  }
  OUTPUT: boolean

  RETURN W.walletAddress IS NOT NULL
     AND W.walletRegistrationTxHash IS NULL
     AND W.walletRegisteredOnChainAt IS NULL
END FUNCTION
```

### Examples

- **New patient registration**: User signs up → `createWallet()` called → wallet address `0xABC...` saved to MongoDB → blockchain query for `0xABC...` returns zero transactions. Expected: at least one transaction visible on Polygon immediately after creation.
- **New doctor registration**: Same flow — wallet created, no on-chain anchor. Expected: `walletRegistrationTxHash` set on user record after creation.
- **RPC unavailable at creation time**: `createWallet()` called → chain call throws → user record saved without `walletRegistrationTxHash`. Expected: user record saved successfully, `walletOnChainRegistrationStatus = 'failed'`, no exception propagated to caller.
- **Existing wallet (pre-fix)**: User record already in MongoDB with `walletAddress` but no `walletRegistrationTxHash`. Expected: system continues to function normally; no automatic re-registration triggered.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `ethers.Wallet.createRandom()` continues to be used for keypair generation.
- The encrypted private key continues to be stored in MongoDB via `walletEncryptedPrivateKey`.
- `walletAddress`, `walletChainId`, and `walletCreatedAt` continue to be assigned on the user record.
- NFT minting via `NftService` / `NftChainService` continues to work exactly as before, unaffected by this change.
- Existing user records without `walletRegistrationTxHash` continue to function normally in all code paths.
- User registration completes successfully even when the on-chain call fails.

**Scope:**
All inputs that do NOT satisfy `isBugCondition` — including mouse/API interactions unrelated to wallet creation, NFT minting flows, and existing wallet records — must be completely unaffected by this fix.

## Hypothesized Root Cause

1. **Missing on-chain call in WalletService**: `createWallet()` is a pure synchronous function that only generates a keypair and encrypts it. There is no call to any chain service, no provider instantiation, and no transaction submission. This is the direct cause.

2. **No chain service dependency in WalletModule**: `wallet.module.ts` only imports `ConfigModule`. There is no `NftModule` or chain service wired in, so even if a chain call were attempted it would fail at the DI level.

3. **No schema fields for registration state**: The `User` schema has no `walletRegistrationTxHash`, `walletRegisteredOnChainAt`, or `walletOnChainRegistrationStatus` fields, so there is nowhere to persist the result even if the call were made.

4. **No error-isolation pattern for chain calls at wallet creation**: Unlike `NftService.mintIfNeeded()` which has a try/catch with fire-and-forget semantics, `WalletService` has no equivalent pattern — adding the chain call without proper isolation would make on-chain failures block user registration.

## Correctness Properties

Property 1: Bug Condition - On-Chain Registration Transaction Submitted

_For any_ wallet creation event W where `isBugCondition(W)` returns true (wallet address is set, no prior registration tx), the fixed `WalletChainService.registerWallet(address)` SHALL submit a zero-value transfer transaction to Polygon and return a result where `txHash` is a non-empty string and `confirmedAt` is a valid Date. The user record SHALL subsequently have `walletRegistrationTxHash` set to that hash, `walletRegisteredOnChainAt` set to that timestamp, and `walletOnChainRegistrationStatus` set to `'registered'`.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Registration Behavior Unchanged

_For any_ input where `isBugCondition` does NOT hold — including NFT minting calls, reads of existing user records, wallet creation events where the chain call throws an error — the fixed code SHALL produce the same observable result as the original code. Specifically: (a) when the chain call fails, `createWallet()` still returns a valid `WalletPayload` and the user record is saved with `walletOnChainRegistrationStatus = 'failed'`; (b) NFT minting via `NftChainService.mintTo()` is unaffected; (c) existing user records without registration fields continue to load and operate without error.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### User Schema Additions

**File**: `src/users/schemas/user.schema.ts`

Add three new fields to the `User` class:

```typescript
export enum WalletOnChainRegistrationStatus {
  PENDING = 'pending',
  REGISTERED = 'registered',
  FAILED = 'failed',
}

// Inside User class:
@Prop()
walletRegistrationTxHash: string;

@Prop()
walletRegisteredOnChainAt: Date;

@Prop({ enum: WalletOnChainRegistrationStatus })
walletOnChainRegistrationStatus: WalletOnChainRegistrationStatus;
```

### New WalletChainService

**File**: `src/wallet/wallet-chain.service.ts`

New injectable service responsible for the zero-value self-transfer. Reuses the same provider/signer pattern as `NftChainService`.

```typescript
type WalletRegistrationResult = {
  txHash: string;
  confirmedAt: Date;
};

@Injectable()
export class WalletChainService {
  async registerWallet(address: string): Promise<WalletRegistrationResult> {
    // 1. Instantiate JsonRpcProvider from POLYGON_RPC_URL
    // 2. Create signer from NFT_MINTER_PRIVATE_KEY
    // 3. Send zero-value tx: { to: address, value: 0 }
    // 4. Await receipt
    // 5. Return { txHash: receipt.hash, confirmedAt: new Date() }
  }
}
```

### WalletModule Update

**File**: `src/wallet/wallet.module.ts`

- Add `ConfigModule` (already present) and register `WalletChainService` as a provider and export.

### WalletService Integration

**File**: `src/wallet/wallet.service.ts`

- Change `createWallet()` to `async createWallet()` returning `Promise<WalletPayload>`.
- After generating the keypair, call `this.walletChainService.registerWallet(address)` inside a `try/catch`.
- On success: include `walletRegistrationTxHash`, `walletRegisteredOnChainAt`, `walletOnChainRegistrationStatus: 'registered'` in the returned payload.
- On failure: log the error, include `walletOnChainRegistrationStatus: 'failed'` in the payload, do not rethrow.

### Callers of createWallet()

Any service that calls `walletService.createWallet()` must be updated to `await` the result and persist the three new fields onto the user record. Identify callers via grep for `createWallet`.

## Testing Strategy

### Validation Approach

Two-phase approach: first run exploratory tests against the unfixed code to confirm the bug condition and root cause, then verify fix-checking and preservation-checking properties after the fix is applied.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples demonstrating the bug on unfixed code. Confirm that `createWallet()` never submits a chain transaction and that the user record has no `walletRegistrationTxHash`.

**Test Plan**: Mock the ethers provider and assert that no `sendTransaction` call is made during `createWallet()`. Inspect the returned payload for absence of `walletRegistrationTxHash`. Run on unfixed code to observe the expected failures.

**Test Cases**:
1. **No chain call on wallet creation**: Call `createWallet()` with a mocked provider spy — assert `sendTransaction` is never called (will pass on unfixed code, confirming the bug).
2. **walletRegistrationTxHash absent**: Assert returned payload has no `walletRegistrationTxHash` field (will pass on unfixed code, confirming the bug).
3. **walletOnChainRegistrationStatus absent**: Assert returned payload has no `walletOnChainRegistrationStatus` field (will pass on unfixed code, confirming the bug).

**Expected Counterexamples**:
- After the fix, tests 1–3 above will fail (i.e. the chain call IS made, the fields ARE present), confirming the fix works.

### Fix Checking

**Goal**: Verify that for all inputs where `isBugCondition(W)` holds, the fixed `WalletChainService.registerWallet()` produces the expected result.

**Pseudocode:**
```
FOR ALL W WHERE isBugCondition(W) DO
  result := WalletChainService.registerWallet(W.walletAddress)
  ASSERT result.txHash IS NOT NULL AND result.txHash.length > 0
  ASSERT result.confirmedAt IS NOT NULL AND result.confirmedAt <= NOW
  ASSERT W.walletRegistrationTxHash = result.txHash
  ASSERT W.walletOnChainRegistrationStatus = 'registered'
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where `isBugCondition` does NOT hold, the fixed code produces the same result as the original.

**Pseudocode:**
```
FOR ALL W WHERE NOT isBugCondition(W) DO
  ASSERT createWallet_original(W) ≈ createWallet_fixed(W)
  // address, chainId, encryptedPrivateKey, createdAt are identical
  // walletOnChainRegistrationStatus = 'failed' when chain throws (non-blocking)
END FOR
```

**Testing Approach**: Property-based testing is recommended because it generates many random wallet addresses and error scenarios automatically, catching edge cases (e.g. malformed addresses, RPC timeouts) that manual tests miss.

**Test Cases**:
1. **Chain failure is non-blocking**: Mock `WalletChainService.registerWallet` to throw — assert `createWallet()` still resolves with a valid `WalletPayload` and `walletOnChainRegistrationStatus = 'failed'`.
2. **Core wallet fields preserved**: For any successful or failed chain call, assert `address`, `chainId`, `encryptedPrivateKey`, and `createdAt` are present and valid.
3. **NFT minting unaffected**: Assert `NftChainService.mintTo()` behavior is identical before and after the fix (no shared state mutation).
4. **Existing user records unaffected**: Load a user document without `walletRegistrationTxHash` — assert no runtime error occurs in any service method.

### Unit Tests

- Test `WalletChainService.registerWallet()` with a mocked ethers provider: verify `sendTransaction` is called with `{ to: address, value: 0 }` and the correct result shape is returned.
- Test `WalletService.createWallet()` success path: mock chain service to resolve — verify all six fields in the returned payload.
- Test `WalletService.createWallet()` failure path: mock chain service to reject — verify payload still returned with `walletOnChainRegistrationStatus = 'failed'` and no exception thrown.
- Test edge case: `registerWallet` called with a valid but unfunded address — verify the minter wallet (not the new wallet) pays gas.

### Property-Based Tests

- **Property 1 (fix-checking)**: Generate random valid Ethereum addresses; for each, call `WalletChainService.registerWallet(address)` against a mock provider that always succeeds — assert `txHash` is non-empty and `confirmedAt` is a valid Date.
- **Property 2 (preservation)**: Generate random error types thrown by the chain service; for each, call `WalletService.createWallet()` — assert the returned payload always contains `address`, `chainId`, `encryptedPrivateKey`, `createdAt`, and `walletOnChainRegistrationStatus = 'failed'`.
- **Property 3 (preservation - NFT unaffected)**: Generate random `(address, tokenUri)` pairs; assert `NftChainService.mintTo()` output is identical regardless of whether `WalletChainService` is present.

### Integration Tests

- Full user registration flow: register a new user, assert the user document in MongoDB has `walletRegistrationTxHash` set (using a testnet or a local Hardhat node).
- Chain failure integration: simulate RPC unavailability during registration — assert user is created successfully in MongoDB with `walletOnChainRegistrationStatus = 'failed'`.
- NFT mint after registration: register a wallet, then mint an NFT — assert both `walletRegistrationTxHash` and `tokenId` are present on the user/asset records.
