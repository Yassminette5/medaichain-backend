/**
 * Bug Condition Exploration Test — Task 1
 *
 * Property 1: Bug Condition — Wallet Creation Submits No On-Chain Transaction
 *
 * This test encodes the EXPECTED (fixed) behavior:
 *   - sendTransaction IS called during createWallet()
 *   - The returned payload HAS walletRegistrationTxHash
 *   - The returned payload HAS walletOnChainRegistrationStatus
 *
 * On UNFIXED code these assertions PASS (confirming the bug exists — no chain
 * call is made, no registration fields are present).
 *
 * After the fix is applied (Task 3), this test will FAIL because the chain IS
 * called and the fields ARE present — proving the fix works.
 *
 * Documented counterexample (unfixed code):
 *   createWallet() returns { address: '0xABC...', chainId: 80002,
 *     encryptedPrivateKey: '...', createdAt: <Date> }
 *   with NO walletRegistrationTxHash field.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { WalletChainService } from './wallet-chain.service';

// ---------------------------------------------------------------------------
// Minimal ConfigService stub — provides the env values WalletService needs
// ---------------------------------------------------------------------------
const configServiceStub = {
  get: (key: string) => {
    const values: Record<string, string> = {
      POLYGON_CHAIN_ID: '80002',
      // 32-byte hex key for AES-256-GCM
      WALLET_ENCRYPTION_KEY:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      POLYGON_RPC_URL: 'https://polygon-amoy.g.alchemy.com',
      NFT_MINTER_PRIVATE_KEY:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    };
    return values[key];
  },
};

// ---------------------------------------------------------------------------
// wallet chain registration spy
// ---------------------------------------------------------------------------
const registerWalletSpy = jest.fn().mockResolvedValue({
  txHash: '0xdeadbeef',
  confirmedAt: new Date('2026-01-01T00:00:00Z'),
});

jest.mock('ethers', () => {
  return {
    ethers: {
      Wallet: {
        createRandom: jest.fn(() => ({
          address: '0x0000000000000000000000000000000000000000',
          privateKey: '0x' + '1'.repeat(64),
        })),
      },
    },
  };
});

const walletChainServiceStub = {
  registerWallet: registerWalletSpy,
};

describe('WalletService — Bug Condition Exploration (Task 1)', () => {
  let service: WalletService;

  beforeEach(async () => {
    registerWalletSpy.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: ConfigService, useValue: configServiceStub },
        { provide: WalletChainService, useValue: walletChainServiceStub },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  /**
   * Bug Condition Test 1 — No chain call on wallet creation
   *
   * On UNFIXED code: sendTransaction is never called → assertion PASSES
   * (confirms bug: no on-chain registration happens).
   *
   * After fix: sendTransaction IS called → assertion FAILS
   * (proves the fix works).
   */
  it('should call registerWallet while creating the wallet', async () => {
    await service.createWallet();

    expect(registerWalletSpy).toHaveBeenCalledWith(expect.any(String));
  });

  it('should return walletRegistrationTxHash on the wallet payload', async () => {
    const payload = await service.createWallet();

    expect(payload.walletRegistrationTxHash).toBeDefined();
    expect(typeof payload.walletRegistrationTxHash).toBe('string');
    expect(payload.walletRegistrationTxHash).toBe('0xdeadbeef');
  });

  it('should return walletOnChainRegistrationStatus as registered', async () => {
    const payload = await service.createWallet();

    expect(payload.walletOnChainRegistrationStatus).toBe('registered');
  });
});
