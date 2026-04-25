import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NftService } from './nft.service';
import { NftAssetType } from './schemas/nft-asset.schema';

@ApiTags('NFT')
@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Get('metadata/:assetType/:assetId')
  @ApiOperation({ summary: 'Get NFT metadata by asset type and asset id' })
  async getMetadata(
    @Param('assetType') assetType: string,
    @Param('assetId') assetId: string,
  ) {
    if (!Object.values(NftAssetType).includes(assetType as NftAssetType)) {
      throw new BadRequestException('Invalid asset type');
    }

    return this.nftService.getMetadata(assetType as NftAssetType, assetId);
  }
}
