import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

type WalletRegistrationResult = {
  txHash: string;
  confirmedAt: Date;
};

type WalletTransferResult = {
  txHash: string;
  confirmedAt: Date;
};

@Injectable()
export class WalletChainService {
  private readonly logger = new Logger(WalletChainService.name);

  constructor(private readonly configService: ConfigService) {}

  async registerWallet(address: string): Promise<WalletRegistrationResult> {
    this.logger.log(`Starting on-chain registration for wallet: ${address}`);

    try {
      const provider = this.getProvider();
      const signer = this.getSigner(provider);

      this.logger.debug(`Sending zero-value transaction to ${address}`);

      // Send zero-value transfer to register wallet on-chain
      const tx = await signer.sendTransaction({
        to: address,
        value: 0,
      });

      this.logger.debug(`Transaction sent with hash: ${tx.hash}`);

      const receipt = await tx.wait();

      this.logger.log(`Wallet ${address} successfully registered on-chain. TxHash: ${receipt.hash}`);

      return {
        txHash: receipt.hash,
        confirmedAt: new Date(),
      };
    } catch (error) {
      const formattedError = this.formatProviderError(error);
      this.logger.error(`Failed to register wallet ${address} on-chain`, {
        error: formattedError,
        address,
        chainId: this.getChainId(),
      });
      throw new Error(formattedError);
    }
  }

  async sendProofTransaction(
    fromPrivateKey: string,
    toAddress: string,
  ): Promise<WalletTransferResult> {
    try {
      const provider = this.getProvider();
      const signer = new ethers.Wallet(fromPrivateKey, provider);
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: 0,
      });
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash,
        confirmedAt: new Date(),
      };
    } catch (error) {
      const formattedError = this.formatProviderError(error);
      throw new Error(formattedError);
    }
  }

  private getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = this.configService.get<string>('POLYGON_RPC_URL');
    if (!rpcUrl) {
      throw new Error('POLYGON_RPC_URL is not set');
    }
    const chainId = this.getChainId();
    const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
    provider.on('error', (err) => {
      this.logger.debug(`Provider background error: ${err?.message || err}`);
    });
    return provider;
  }

  private getSigner(provider: ethers.JsonRpcProvider): ethers.Wallet {
    const privateKey = this.getMinterPrivateKey();
    return new ethers.Wallet(privateKey, provider);
  }

  private getChainId(): number {
    return Number(this.configService.get('POLYGON_CHAIN_ID') ?? 80002);
  }

  private formatProviderError(error: unknown): string {
    if (!error) {
      return 'Unknown provider error';
    }

    if (error instanceof Error) {
      const errorData: Record<string, unknown> = {
        message: error.message,
        name: error.name,
      };
      const extraKeys = ['code', 'reason', 'transactionHash', 'data', 'body', 'receipt', 'error'];
      for (const key of extraKeys) {
        const value = (error as any)[key];
        if (value !== undefined) {
          errorData[key] = value;
        }
      }
      try {
        return JSON.stringify(errorData, Object.keys(errorData), 2);
      } catch {
        return `${error.name}: ${error.message}`;
      }
    }

    if (typeof error === 'object') {
      try {
        return JSON.stringify(error, Object.keys(error), 2);
      } catch {
        return String(error);
      }
    }

    return String(error);
  }

  private getMinterPrivateKey(): string {
    const key = this.configService.get<string>('NFT_MINTER_PRIVATE_KEY');
    if (!key) {
      throw new Error('NFT_MINTER_PRIVATE_KEY is not set');
    }
    return key;
  }
}
