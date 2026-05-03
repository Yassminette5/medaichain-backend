import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TokenService } from './token.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Token (FRYMN)')
@Controller('token')
export class TokenController {
  private readonly logger = new Logger(TokenController.name);

  constructor(private readonly tokenService: TokenService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get FRYMN token information' })
  @ApiResponse({ status: 200, description: 'Token information' })
  async getTokenInfo() {
    return this.tokenService.getTokenInfo();
  }

  @Get('balance/:address')
  @ApiOperation({ summary: 'Get FRYMN token balance for an address' })
  @ApiResponse({ status: 200, description: 'Token balance in base units (wei)' })
  async getBalance(@Param('address') address: string) {
    const balance = await this.tokenService.getBalance(address);
    return {
      address,
      balance,
      formatted: TokenService.formatTokenAmount(balance),
    };
  }

  @Post('mint')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mint FRYMN tokens to a recipient (Admin/Minter only)',
    description: 'Mint new tokens. Amount should be in base units (e.g., wei for 18 decimals).',
  })
  @ApiResponse({ status: 201, description: 'Tokens minted successfully' })
  async mint(
    @Body()
    body: {
      toAddress: string;
      amount: string;
    },
  ) {
    this.logger.log(`Mint request: to=${body.toAddress}, amount=${body.amount}`);
    const result = await this.tokenService.mintTokens(body.toAddress, body.amount);
    return {
      success: true,
      ...result,
      formattedAmount: TokenService.formatTokenAmount(body.amount),
    };
  }

  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Transfer FRYMN tokens from minter wallet to recipient',
    description: 'Transfer tokens. Amount should be in base units (e.g., wei for 18 decimals).',
  })
  @ApiResponse({ status: 201, description: 'Tokens transferred successfully' })
  async transfer(
    @Body()
    body: {
      toAddress: string;
      amount: string;
    },
  ) {
    this.logger.log(`Transfer request: to=${body.toAddress}, amount=${body.amount}`);
    const result = await this.tokenService.transferTokens(body.toAddress, body.amount);
    return {
      success: true,
      ...result,
      formattedAmount: TokenService.formatTokenAmount(body.amount),
    };
  }

  @Post('add-minter')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add minter role to an address (Admin only)',
  })
  @ApiResponse({ status: 201, description: 'Minter added successfully' })
  async addMinter(
    @Body()
    body: {
      minterAddress: string;
    },
  ) {
    this.logger.log(`Add minter request: ${body.minterAddress}`);
    return await this.tokenService.addMinter(body.minterAddress);
  }

  @Get('is-minter/:address')
  @ApiOperation({ summary: 'Check if an address has minter role' })
  @ApiResponse({ status: 200, description: 'Minter status' })
  async isMinter(@Param('address') address: string) {
    const isMinter = await this.tokenService.isMinter(address);
    return {
      address,
      isMinter,
    };
  }

  @Get('minter-address')
  @ApiOperation({ summary: 'Get current minter wallet address' })
  @ApiResponse({ status: 200, description: 'Minter address' })
  async getMinterAddress() {
    return {
      minterAddress: this.tokenService.getMinterAddress(),
    };
  }
}
