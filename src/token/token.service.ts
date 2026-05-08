import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

const TOKEN_ABI = [
  'function mint(address to, uint256 amount) public',
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function isMinter(address account) public view returns (bool)',
  'function addMinter(address minter) public',
  'function totalSupply() public view returns (uint256)',
  'function decimals() public view returns (uint8)',
  'function symbol() public view returns (string)',
  'function name() public view returns (string)',
];

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private signerWallet: ethers.Wallet;
  private tokenAddress: string;
  private mintLock: Promise<void> = Promise.resolve();

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('POLYGON_RPC_URL');
    const minterPrivateKey = this.configService.get<string>('NFT_MINTER_PRIVATE_KEY');
    this.tokenAddress = this.configService.get<string>('TOKEN_CONTRACT_ADDRESS');

    if (!rpcUrl) {
      throw new Error('POLYGON_RPC_URL not set in .env');
    }

    if (!minterPrivateKey) {
      throw new Error('NFT_MINTER_PRIVATE_KEY not set in .env');
    }

    if (!this.tokenAddress) {
      throw new Error('TOKEN_CONTRACT_ADDRESS not set in .env');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signerWallet = new ethers.Wallet(minterPrivateKey, this.provider);
    this.contract = new ethers.Contract(
      this.tokenAddress,
      TOKEN_ABI,
      this.signerWallet,
    );

    this.logger.log(`TokenService initialized with token: ${this.tokenAddress}`);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /**
   * Mint tokens to a recipient address
   * @param toAddress Recipient wallet address
   * @param amount Amount of tokens to mint (in base units, e.g., wei for 18 decimals)
   * @returns Transaction hash
   */
  async mintTokens(toAddress: string, amount: string): Promise<{
    txHash: string;
    amount: string;
    to: string;
    blockNumber: number;
  }> {
    // Serialize mint calls to avoid nonce collisions ("already known" errors)
    const result = new Promise<{
      txHash: string;
      amount: string;
      to: string;
      blockNumber: number;
    }>((resolve, reject) => {
      this.mintLock = this.mintLock.then(async () => {
        try {
          if (!ethers.isAddress(toAddress)) {
            throw new BadRequestException('Invalid recipient address');
          }

          const amountBigInt = BigInt(amount);
          if (amountBigInt <= 0n) {
            throw new BadRequestException('Amount must be greater than 0');
          }

          this.logger.log(`Minting ${amount} tokens to ${toAddress}`);

          // Call mint function
          const tx = await this.contract.mint(toAddress, amountBigInt);
          const receipt = await tx.wait();

          this.logger.log(`✅ Minting successful. TX: ${receipt.hash}`);

          // Small delay after mint to let the nonce update propagate
          await new Promise(r => setTimeout(r, 1500));

          resolve({
            txHash: receipt.hash,
            amount: amount,
            to: toAddress,
            blockNumber: receipt.blockNumber,
          });
        } catch (error) {
          const message = this.getErrorMessage(error);
          this.logger.error(`Minting failed: ${message}`);
          reject(new InternalServerErrorException(`Failed to mint tokens: ${message}`));
        }
      });
    });

    return result;
  }

  /**
   * Get token balance for an address
   * @param address Wallet address
   * @returns Balance in base units
   */
  async getBalance(address: string): Promise<string> {
    try {
      if (!ethers.isAddress(address)) {
        throw new BadRequestException('Invalid address');
      }

      const balance = await this.contract.balanceOf(address);
      return balance.toString();
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to get balance: ${message}`);
      throw new InternalServerErrorException(`Failed to get balance: ${message}`);
    }
  }

  /**
   * Transfer tokens from minter wallet to recipient
   * @param toAddress Recipient wallet address
   * @param amount Amount of tokens to transfer (in base units)
   * @returns Transaction hash
   */
  async transferTokens(toAddress: string, amount: string): Promise<{
    txHash: string;
    amount: string;
    to: string;
    from: string;
  }> {
    try {
      if (!ethers.isAddress(toAddress)) {
        throw new BadRequestException('Invalid recipient address');
      }

      const amountBigInt = BigInt(amount);
      if (amountBigInt <= 0n) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      this.logger.log(`Transferring ${amount} tokens to ${toAddress}`);

      const tx = await this.contract.transfer(toAddress, amountBigInt);
      const receipt = await tx.wait();

      this.logger.log(`✅ Transfer successful. TX: ${receipt.hash}`);

      return {
        txHash: receipt.hash,
        amount: amount,
        to: toAddress,
        from: this.signerWallet.address,
      };
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Transfer failed: ${message}`);
      throw new InternalServerErrorException(`Failed to transfer tokens: ${message}`);
    }
  }

  async transferTokensFromPrivateKey(
    privateKey: string,
    toAddress: string,
    amount: string,
  ): Promise<{
    txHash: string;
    amount: string;
    to: string;
    from: string;
  }> {
    try {
      if (!ethers.isAddress(toAddress)) {
        throw new BadRequestException('Invalid recipient address');
      }

      const amountBigInt = BigInt(amount);
      if (amountBigInt <= 0n) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contract = new ethers.Contract(this.tokenAddress, TOKEN_ABI, wallet);
      const tx = await contract.transfer(toAddress, amountBigInt);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash,
        amount,
        to: toAddress,
        from: wallet.address,
      };
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Private key transfer failed: ${message}`);
      throw new InternalServerErrorException(`Failed to transfer tokens: ${message}`);
    }
  }

  /**
   * Get token info
   */
  async getTokenInfo(): Promise<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    minterAddress: string;
  }> {
    try {
      const name = await this.contract.name();
      const symbol = await this.contract.symbol();
      const decimals = await this.contract.decimals();
      const totalSupply = await this.contract.totalSupply();

      return {
        address: this.tokenAddress,
        name: String(name),
        symbol: String(symbol),
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        minterAddress: this.signerWallet.address,
      };
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to get token info: ${message}`);
      throw new InternalServerErrorException(`Failed to get token info: ${message}`);
    }
  }

  /**
   * Check if an address is a minter
   * @param address Address to check
   */
  async isMinter(address: string): Promise<boolean> {
    try {
      if (!ethers.isAddress(address)) {
        throw new BadRequestException('Invalid address');
      }

      return await this.contract.isMinter(address);
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to check minter status: ${message}`);
      throw new InternalServerErrorException(`Failed to check minter status: ${message}`);
    }
  }

  /**
   * Add a minter role to an address (only admin)
   * @param minterAddress Address to add as minter
   * @returns Transaction hash
   */
  async addMinter(minterAddress: string): Promise<{
    txHash: string;
    minterAddress: string;
  }> {
    try {
      if (!ethers.isAddress(minterAddress)) {
        throw new BadRequestException('Invalid minter address');
      }

      this.logger.log(`Adding minter role to ${minterAddress}`);

      const tx = await this.contract.addMinter(minterAddress);
      const receipt = await tx.wait();

      this.logger.log(`✅ Minter added. TX: ${receipt.hash}`);

      return {
        txHash: receipt.hash,
        minterAddress,
      };
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to add minter: ${message}`);
      throw new InternalServerErrorException(`Failed to add minter: ${message}`);
    }
  }

  /**
   * Format amount from base units to human-readable format
   * @param amount Amount in base units (wei)
   * @param decimals Token decimals
   */
  static formatTokenAmount(amount: string, decimals: number = 18): string {
    return ethers.formatUnits(amount, decimals);
  }

  /**
   * Parse human-readable amount to base units
   * @param amount Human-readable amount
   * @param decimals Token decimals
   */
  static parseTokenAmount(amount: string, decimals: number = 18): string {
    return ethers.parseUnits(amount, decimals).toString();
  }

  /**
   * Get minter wallet address
   */
  getMinterAddress(): string {
    return this.signerWallet.address;
  }

  /**
   * Get token contract address
   */
  getTokenAddress(): string {
    return this.tokenAddress;
  }
}
