# Bugfix Requirements Document

## Introduction

User wallets are generated server-side (via `ethers.Wallet.createRandom()`) and stored encrypted in MongoDB. The wallet address is saved on the user record (`walletAddress`, `walletEncryptedPrivateKey`), but the wallet is never anchored on-chain. It only becomes visible on the Polygon blockchain the first time it participates in a transaction (e.g. receiving a minted NFT). This means a wallet can exist in the system for an indefinite period with no on-chain presence, making it impossible to verify or discover the wallet on-chain independently of the backend database.

The fix must register/anchor each wallet on-chain at creation time so that it is immediately visible and verifiable on the Polygon blockchain.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a new user wallet is created via `WalletService.createWallet()` THEN the system only stores the keypair encrypted in MongoDB and does not submit any on-chain transaction
1.2 WHEN a wallet address is queried on the Polygon blockchain immediately after creation THEN the system returns no transaction history and the address has no on-chain footprint
1.3 WHEN a user's wallet has never been involved in an NFT mint or transfer THEN the system has no way to prove the wallet's existence or creation time on-chain

### Expected Behavior (Correct)

2.1 WHEN a new user wallet is created THEN the system SHALL submit an on-chain registration transaction (e.g. a zero-value self-transfer or a dedicated registry contract call) that anchors the wallet address on the Polygon blockchain
2.2 WHEN a wallet address is queried on the Polygon blockchain after registration THEN the system SHALL return at least one transaction confirming the wallet's on-chain existence
2.3 WHEN the on-chain registration transaction is confirmed THEN the system SHALL persist the registration transaction hash (`walletRegistrationTxHash`) and registration timestamp (`walletRegisteredOnChainAt`) on the user record in MongoDB

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a wallet is created THEN the system SHALL CONTINUE TO generate the keypair using `ethers.Wallet.createRandom()` and store the encrypted private key in MongoDB
3.2 WHEN a wallet is created THEN the system SHALL CONTINUE TO assign `walletAddress`, `walletChainId`, and `walletCreatedAt` on the user record
3.3 WHEN an NFT is minted for a user THEN the system SHALL CONTINUE TO mint the NFT to the user's `walletAddress` as before
3.4 WHEN on-chain registration fails (e.g. RPC unavailable, insufficient gas) THEN the system SHALL CONTINUE TO complete wallet creation in MongoDB and SHALL NOT block user registration — the registration attempt SHALL be retried or flagged for later
3.5 WHEN existing wallets that were created before this fix are present in MongoDB THEN the system SHALL CONTINUE TO function normally for those wallets without requiring immediate re-registration

---

## Bug Condition Derivation

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition(W)
  INPUT: W of type WalletCreationEvent
  OUTPUT: boolean

  RETURN W.walletRegistrationTxHash IS NULL
     AND W.walletRegisteredOnChainAt IS NULL
     AND W.walletAddress IS NOT NULL
END FUNCTION
```

**Property: Fix Checking**
```pascal
FOR ALL W WHERE isBugCondition(W) DO
  result ← registerWalletOnChain'(W)
  ASSERT result.txHash IS NOT NULL
     AND result.confirmedOnChain = true
     AND W.walletRegistrationTxHash IS NOT NULL
END FOR
```

**Property: Preservation Checking**
```pascal
FOR ALL W WHERE NOT isBugCondition(W) DO
  ASSERT registerWallet(W) = registerWallet'(W)
  // Existing wallet data, NFT minting, and user records are unaffected
END FOR
```
