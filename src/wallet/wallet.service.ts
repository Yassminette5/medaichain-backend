import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import { WalletChainService } from './wallet-chain.service';

type WalletOnChainRegistrationStatus = 'pending' | 'registered' | 'failed';

type WalletPayload = {
    address: string;
    chainId: number;
    encryptedPrivateKey: string;
    createdAt: Date;
    walletRegistrationTxHash?: string;
    walletRegisteredOnChainAt?: Date;
    walletOnChainRegistrationStatus: WalletOnChainRegistrationStatus;
};

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly walletChainService: WalletChainService,
    ) { }

    async createWallet(): Promise<WalletPayload> {
        const wallet = ethers.Wallet.createRandom();
        const chainId = Number(this.configService.get('POLYGON_CHAIN_ID') ?? 80002);

        const payload: WalletPayload = {
            address: wallet.address,
            chainId,
            encryptedPrivateKey: this.encryptPrivateKey(wallet.privateKey),
            createdAt: new Date(),
            walletOnChainRegistrationStatus: 'pending',
        };

        try {
            this.logger.log(`Creating wallet for address: ${wallet.address}`);
            const registrationResult = await this.walletChainService.registerWallet(wallet.address);
            payload.walletRegistrationTxHash = registrationResult.txHash;
            payload.walletRegisteredOnChainAt = registrationResult.confirmedAt;
            payload.walletOnChainRegistrationStatus = 'registered';
            this.logger.log(`Wallet ${wallet.address} created and registered successfully`);
        } catch (error) {
            const formattedError = this.formatChainError(error);
            this.logger.error(`Failed to register wallet ${wallet.address} on-chain during creation`, {
                error: formattedError,
                address: wallet.address,
                chainId,
            });
            payload.walletOnChainRegistrationStatus = 'failed';
        }

        return payload;
    }

    private encryptPrivateKey(privateKey: string): string {
        const key = this.getEncryptionKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const ciphertext = Buffer.concat([
            cipher.update(privateKey, 'utf8'),
            cipher.final(),
        ]);
        const tag = cipher.getAuthTag();

        return [
            'v1',
            iv.toString('base64'),
            tag.toString('base64'),
            ciphertext.toString('base64'),
        ].join(':');
    }

    decryptPrivateKey(encryptedPrivateKey: string): string {
        const [version, ivB64, tagB64, ciphertextB64] = encryptedPrivateKey.split(':');
        if (version !== 'v1' || !ivB64 || !tagB64 || !ciphertextB64) {
            throw new InternalServerErrorException('Invalid encrypted private key format');
        }

        const key = this.getEncryptionKey();
        const iv = Buffer.from(ivB64, 'base64');
        const tag = Buffer.from(tagB64, 'base64');
        const ciphertext = Buffer.from(ciphertextB64, 'base64');

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        const plaintext = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]).toString('utf8');

        if (!plaintext.startsWith('0x')) {
            throw new InternalServerErrorException('Decrypted private key format is invalid');
        }

        return plaintext;
    }

    private formatChainError(error: unknown): string {
        if (!error) {
            return 'Unknown chain error';
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

    private getEncryptionKey(): Buffer {
        const rawKey = this.configService.get<string>('WALLET_ENCRYPTION_KEY');
        if (!rawKey) {
            throw new InternalServerErrorException('WALLET_ENCRYPTION_KEY is not set');
        }

        const isHex = /^[0-9a-fA-F]+$/.test(rawKey);
        const key = rawKey.length === 64 && isHex
            ? Buffer.from(rawKey, 'hex')
            : Buffer.from(rawKey, 'base64');

        if (key.length !== 32) {
            throw new InternalServerErrorException('WALLET_ENCRYPTION_KEY must be 32 bytes (hex or base64)');
        }

        return key;
    }
}
