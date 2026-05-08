import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

const ERC721_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function owner() view returns (address)',
  'function safeMint(address to, string uri) returns (uint256)',
  'function mint(address to, string uri) returns (uint256)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
];

type MintResult = {
  tokenId: string;
  txHash: string;
  contractAddress: string;
  chainId: number;
};

@Injectable()
export class NftChainService {
  private readonly logger = new Logger(NftChainService.name);

  constructor(private readonly configService: ConfigService) {}

  getChainId(): number {
    return Number(this.configService.get('POLYGON_CHAIN_ID') ?? 80002);
  }

  async mintTo(to: string, tokenUri: string | null): Promise<MintResult> {
    const contract = this.getContractWithSigner();
    const mintFunction =
      this.configService.get<string>('NFT_MINT_FUNCTION') ?? 'safeMint';
    const uri = tokenUri ?? '';
    this.logger.log(
      `Mint request: to=${to} mintFunction=${mintFunction} contract=${contract.target.toString()} chainId=${this.getChainId()} tokenUri=${uri || 'null'}`,
    );

    const contractAny = contract as any;

    // Verify signer is contract owner (common cause of require(false) on owner-only mints)
    try {
      const contractOwner = (await contractAny.owner())?.toString?.() ?? null;
      const runner: any = (contract as any).runner;
      const signerAddr =
        runner && typeof runner.getAddress === 'function'
          ? await runner.getAddress()
          : null;
      this.logger.debug(`Contract owner=${contractOwner} signer=${signerAddr}`);
      if (contractOwner && signerAddr && contractOwner.toLowerCase() !== signerAddr.toLowerCase()) {
        throw new Error(`Minter private key does not match contract owner: owner=${contractOwner} signer=${signerAddr}`);
      }
    } catch (err) {
      // Log but continue — some contracts may not expose owner()
      const msg = (err as any)?.message ?? String(err);
      this.logger.debug('Owner check failed or unavailable: ' + msg);
    }

    try {
      const tx = await contractAny[mintFunction](to, uri);
      this.logger.log(`Mint tx submitted: hash=${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(
        `Mint tx confirmed: hash=${receipt.hash} blockNumber=${receipt.blockNumber}`,
      );
      const tokenId = this.extractTokenId(receipt, contract);

      return {
        tokenId,
        txHash: receipt.hash,
        contractAddress: contract.target.toString(),
        chainId: this.getChainId(),
      };
    } catch (err: any) {
      this.logger.error('Mint failed', err?.reason ?? err?.message ?? err);
      // rethrow for upstream handling
      throw err;
    }
  }

  async ownerOf(tokenId: string): Promise<string> {
    const contract = this.getContractReadOnly();
    const owner = await contract.ownerOf(BigInt(tokenId));
    return owner.toString();
  }

  async transferFromSigned(
    ownerPrivateKey: string,
    fromAddress: string,
    toAddress: string,
    tokenId: string,
  ): Promise<{ txHash: string; confirmedAt: Date }> {
    const provider = this.getProvider();
    const signer = new ethers.Wallet(ownerPrivateKey, provider);
    const contract = this.getContract(signer);

    // prefer safeTransferFrom when available
    try {
      const tx = await (contract as any).safeTransferFrom(fromAddress, toAddress, BigInt(tokenId));
      const receipt = await tx.wait();
      return { txHash: receipt.hash, confirmedAt: new Date() };
    } catch (err) {
      // fallback to transferFrom
      const tx = await (contract as any).transferFrom(fromAddress, toAddress, BigInt(tokenId));
      const receipt = await tx.wait();
      return { txHash: receipt.hash, confirmedAt: new Date() };
    }
  }

  private getContractReadOnly(): ethers.Contract {
    const provider = this.getProvider();
    return this.getContract(provider);
  }

  private getContractWithSigner(): ethers.Contract {
    const provider = this.getProvider();
    const privateKey = this.getMinterPrivateKey();
    const signer = new ethers.Wallet(privateKey, provider);
    return this.getContract(signer);
  }

  private getContract(
    signerOrProvider: ethers.Signer | ethers.Provider,
  ): ethers.Contract {
    const address = this.getContractAddress();
    return new ethers.Contract(address, ERC721_ABI, signerOrProvider);
  }

  private getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = this.configService.get<string>('POLYGON_RPC_URL');
    if (!rpcUrl) {
      throw new Error('POLYGON_RPC_URL is not set');
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl, this.getChainId());
    provider.on('error', (err) => {
      this.logger.debug(`Provider background error: ${err?.message || err}`);
    });
    return provider;
  }

  private getContractAddress(): string {
    const address = this.configService.get<string>('NFT_CONTRACT_ADDRESS');
    if (!address) {
      throw new Error('NFT_CONTRACT_ADDRESS is not set');
    }
    return address;
  }

  private getMinterPrivateKey(): string {
    const key = this.configService.get<string>('NFT_MINTER_PRIVATE_KEY');
    if (!key) {
      throw new Error('NFT_MINTER_PRIVATE_KEY is not set');
    }
    return key;
  }

  private extractTokenId(
    receipt: ethers.TransactionReceipt,
    contract: ethers.Contract,
  ): string {
    const transferEvent = contract.interface.getEvent('Transfer');
    const transferTopic = transferEvent?.topicHash;

    if (!transferTopic) {
      throw new Error('Could not resolve Transfer event topic');
    }

    for (const log of receipt.logs) {
      if (log.topics?.[0] !== transferTopic) {
        continue;
      }
      if (log.address?.toLowerCase() !== contract.target.toString().toLowerCase()) {
        continue;
      }

      try {
        const parsed = contract.interface.parseLog(log);
        const tokenId = parsed?.args?.tokenId;
        if (tokenId != null) {
          return tokenId.toString();
        }
      } catch (error) {
        this.logger.warn('Unable to parse Transfer log for tokenId');
      }
    }

    throw new Error('Unable to determine tokenId from transaction receipt');
  }
}
