# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Wallet Creation Submits No On-Chain Transaction
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples demonstrating that `createWallet()` never submits a chain transaction and returns no `walletRegistrationTxHash`
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — any call to `createWallet()` where `isBugCondition(W)` holds (walletAddress IS NOT NULL, walletRegistrationTxHash IS NULL, walletRegisteredOnChainAt IS NULL)
  - File: `src/wallet/wallet.service.spec.ts`
  - Mock the ethers provider with a spy; assert `sendTransaction` is NEVER called during `createWallet()` (on unfixed code this assertion passes, confirming the bug)
  - Assert the returned payload has no `walletRegistrationTxHash` field (on unfixed code this passes, confirming the bug)
  - Assert the returned payload has no `walletOnChainRegistrationStatus` field (on unfixed code this passes, confirming the bug)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS after fix (i.e. chain IS called, fields ARE present) — failure on fixed code proves the fix works
  - Document counterexamples found (e.g. `createWallet()` returns `{ address: '0xABC...', chainId: 80002, encryptedPrivateKey: '...', createdAt: Date }` with no `walletRegistrationTxHash`)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Registration Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology — run UNFIXED code with non-buggy inputs first
  - File: `src/wallet/wallet.service.spec.ts`
  - Observe: `createWallet()` on unfixed code returns `{ address, chainId, encryptedPrivateKey, createdAt }` — all four fields always present and valid
  - Observe: when chain call throws (simulated), unfixed code still returns a valid payload (no exception propagated)
  - **Property-based test**: For any error type thrown by `WalletChainService.registerWallet` (TypeError, NetworkError, timeout, etc.), `createWallet()` SHALL still resolve with a valid `WalletPayload` containing `address`, `chainId`, `encryptedPrivateKey`, and `createdAt`
  - **Property-based test**: For any successful chain call, the core wallet fields (`address`, `chainId`, `encryptedPrivateKey`, `createdAt`) are identical to what the unfixed code returns
  - Assert `NftChainService.mintTo()` behavior is identical regardless of whether `WalletChainService` is present (no shared state mutation)
  - Assert loading a user document without `walletRegistrationTxHash` causes no runtime error in any service method
  - Verify all preservation tests PASS on UNFIXED code before proceeding
  - **EXPECTED OUTCOME**: Tests PASS on unfixed code (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for wallet on-chain registration missing at creation time

  - [x] 3.1 Add new fields to User schema
    - File: `src/users/schemas/user.schema.ts`
    - Add `WalletOnChainRegistrationStatus` enum with values `pending | registered | failed`
    - Add `@Prop() walletRegistrationTxHash: string` to the `User` class
    - Add `@Prop() walletRegisteredOnChainAt: Date` to the `User` class
    - Add `@Prop({ enum: WalletOnChainRegistrationStatus }) walletOnChainRegistrationStatus: WalletOnChainRegistrationStatus` to the `User` class
    - _Requirements: 2.3_

  - [x] 3.2 Create WalletChainService
    - File: `src/wallet/wallet-chain.service.ts`
    - Replicate provider/signer pattern from `NftChainService` (use `POLYGON_RPC_URL`, `POLYGON_CHAIN_ID`, `NFT_MINTER_PRIVATE_KEY`)
    - Implement `async registerWallet(address: string): Promise<{ txHash: string; confirmedAt: Date }>`
    - Send zero-value transfer: `signer.sendTransaction({ to: address, value: 0 })`
    - Await receipt and return `{ txHash: receipt.hash, confirmedAt: new Date() }`
    - _Bug_Condition: isBugCondition(W) where W.walletAddress IS NOT NULL AND W.walletRegistrationTxHash IS NULL_
    - _Expected_Behavior: result.txHash IS NOT NULL AND result.confirmedAt IS NOT NULL AND result.confirmedAt <= NOW_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Update WalletModule to register WalletChainService
    - File: `src/wallet/wallet.module.ts`
    - Add `WalletChainService` to `providers` and `exports`
    - _Requirements: 2.1_

  - [-] 3.4 Update WalletService.createWallet() to async with fire-and-forget chain call
    - File: `src/wallet/wallet.service.ts`
    - Inject `WalletChainService` via constructor
    - Change signature to `async createWallet(): Promise<WalletPayload>`
    - Extend `WalletPayload` type to include `walletRegistrationTxHash?: string`, `walletRegisteredOnChainAt?: Date`, `walletOnChainRegistrationStatus: WalletOnChainRegistrationStatus`
    - After keypair generation, call `this.walletChainService.registerWallet(address)` inside a `try/catch`
    - On success: set `walletRegistrationTxHash`, `walletRegisteredOnChainAt`, `walletOnChainRegistrationStatus: 'registered'` in returned payload
    - On failure: log the error, set `walletOnChainRegistrationStatus: 'failed'` in payload, do NOT rethrow
    - _Bug_Condition: isBugCondition(W) where W.walletAddress IS NOT NULL AND W.walletRegistrationTxHash IS NULL_
    - _Expected_Behavior: payload.walletRegistrationTxHash IS NOT NULL AND payload.walletOnChainRegistrationStatus = 'registered' on success; walletOnChainRegistrationStatus = 'failed' on chain error, no exception thrown_
    - _Preservation: address, chainId, encryptedPrivateKey, createdAt always present regardless of chain outcome_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4_

  - [ ] 3.5 Update callers of createWallet() to await and persist new fields
    - File: `src/auth/auth.service.ts` — update `createWalletFields()` to `async createWalletFields()`, await `this.walletService.createWallet()`, and include `walletRegistrationTxHash`, `walletRegisteredOnChainAt`, `walletOnChainRegistrationStatus` in the returned object; update all three call sites to `await this.createWalletFields()`
    - File: `src/auth/seed.service.ts` — update the `createWallet()` call to `await this.walletService.createWallet()` and persist the three new fields onto the user create payload
    - _Preservation: walletAddress, walletChainId, walletEncryptedPrivateKey, walletCreatedAt continue to be assigned as before_
    - _Requirements: 2.3, 3.1, 3.2_

  - [ ] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - On-Chain Registration Transaction Submitted
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior (chain IS called, fields ARE present)
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — `sendTransaction` is called, `walletRegistrationTxHash` and `walletOnChainRegistrationStatus` are present in payload)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Registration Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — chain failure is non-blocking, core wallet fields intact, NFT minting unaffected, existing user records load without error)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `npm test -- --testPathPattern=wallet`
  - Confirm Property 1 (bug condition) passes — chain call is made, registration fields are set
  - Confirm Property 2 (preservation) passes — no regressions in wallet creation, NFT minting, or existing user records
  - Ensure all tests pass; ask the user if questions arise
