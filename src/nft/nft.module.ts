import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { NftController } from './nft.controller';
import { NftChainService } from './nft-chain.service';
import { NftService } from './nft.service';
import { NftAsset, NftAssetSchema } from './schemas/nft-asset.schema';

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        MongooseModule.forFeature([{ name: NftAsset.name, schema: NftAssetSchema }]),
    ],
    controllers: [NftController],
    providers: [NftService, NftChainService],
    exports: [NftService, NftChainService],
})
export class NftModule { }
