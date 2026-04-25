import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { WalletChainService } from './wallet-chain.service';

@Module({
    imports: [ConfigModule],
    providers: [WalletService, WalletChainService],
    exports: [WalletService, WalletChainService],
})
export class WalletModule { }
