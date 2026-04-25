import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

const ERC721_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function safeMint(address to, string uri) returns (uint256)',
  'function mint(address to, string uri) returns (uint256)',
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
  }

  async ownerOf(tokenId: string): Promise<string> {
    const contract = this.getContractReadOnly();
    const owner = await contract.ownerOf(BigInt(tokenId));
    return owner.toString();
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
    return new ethers.JsonRpcProvider(rpcUrl, this.getChainId());
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
