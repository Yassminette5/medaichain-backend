import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { NftChainService } from './nft-chain.service';
import {
    NftAsset,
    NftAssetDocument,
    NftAssetStatus,
    NftAssetType,
} from './schemas/nft-asset.schema';

@Injectable()
export class NftService {
    private readonly logger = new Logger(NftService.name);

    constructor(
        @InjectModel(NftAsset.name)
        private readonly nftAssetModel: Model<NftAssetDocument>,
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
        private readonly nftChainService: NftChainService,
    ) { }

    async createForPrescription(prescription: {
        _id: any;
        patientId: any;
        doctorId: any;
        diagnosis?: string;
        notes?: string;
        prescriptionDate?: Date;
    }): Promise<NftAssetDocument | null> {
        // Mint prescriptions initially to the doctor's wallet so the doctor
        // can explicitly transfer ownership to the patient later.
        const owner = await this.safeGetUser(prescription.doctorId?.toString());
        if (!owner?.walletAddress) {
            this.logger.warn('Wallet missing for prescription NFT mint (doctor)');
            return null;
        }

        const metadata: any = {
            name: `Prescription #${prescription._id}`,
            description: 'Medical prescription asset',
            assetType: NftAssetType.PRESCRIPTION,
            assetId: prescription._id?.toString(),
            ownerUserId: owner._id?.toString(),
            createdAt: (prescription.prescriptionDate ?? new Date()).toISOString(),
            attributes: [
                { trait_type: 'doctorId', value: prescription.doctorId?.toString() },
                { trait_type: 'diagnosis', value: prescription.diagnosis ?? '' },
            ],
        };

        // If a prescription image URL is available, include it as the primary image
        // and add it to attachments so token metadata consumers can display it.
        if ((prescription as any).prescriptionImageUrl) {
            const imageUrl = (prescription as any).prescriptionImageUrl;
            metadata.image = imageUrl;
            metadata.attachments = metadata.attachments || [];
            metadata.attachments.push(imageUrl);
        }

        const asset = await this.upsertAsset({
            assetType: NftAssetType.PRESCRIPTION,
            assetId: prescription._id,
            ownerUserId: owner._id,
            ownerWallet: owner.walletAddress,
            metadata,
        });

        await this.mintIfNeeded(asset);
        return asset;
    }

    /**
     * Transfer an existing minted asset on-chain from its current owner
     * (provided via ownerPrivateKey) to a new wallet address.
     */
    async transferAssetOnChain(params: {
        assetType: NftAssetType;
        assetId: string;
        ownerPrivateKey: string;
        toWallet: string;
    }) {
        const asset = await this.getAssetByTypeAndId(params.assetType, params.assetId);
        if (!asset) throw new NotFoundException('NFT asset introuvable');

        if (!asset.tokenId) {
            // ensure on-chain mint exists
            await this.mintIfNeeded(asset, { throwOnError: true });
        }

        if (!asset.tokenId) throw new BadRequestException('Token on-chain manquant');

        // perform a signed transfer using the owner's private key
        const transfer = await this.nftChainService.transferFromSigned(
            params.ownerPrivateKey,
            asset.ownerWallet,
            params.toWallet,
            asset.tokenId,
        );

        asset.ownerWallet = params.toWallet;
        asset.txHash = transfer.txHash;
        asset.status = NftAssetStatus.MINTED;
        await asset.save();

        return asset;
    }

    async createForPatientAnalysis(analysis: {
        _id: any;
        userId: any;
        title?: string;
        analysisType?: string;
        analysisTypeOther?: string;
        analysisDate?: Date;
        source?: string;
        centreName?: string;
        resultFile?: string;
    }): Promise<NftAssetDocument | null> {
        const owner = await this.safeGetUser(analysis.userId?.toString());
        if (!owner?.walletAddress) {
            this.logger.warn('Wallet missing for analysis NFT mint');
            return null;
        }

        const assetType = analysis.source === 'centre_analyse'
            ? NftAssetType.LAB_ANALYSIS
            : NftAssetType.MEDICAL_REPORT;

        const metadata = {
            name: analysis.title ? `Analysis: ${analysis.title}` : `Analysis #${analysis._id}`,
            description: 'Medical analysis report asset',
            assetType,
            assetId: analysis._id?.toString(),
            ownerUserId: owner._id?.toString(),
            createdAt: (analysis.analysisDate ?? new Date()).toISOString(),
            attributes: [
                { trait_type: 'analysisType', value: analysis.analysisType ?? '' },
                { trait_type: 'analysisTypeOther', value: analysis.analysisTypeOther ?? '' },
                { trait_type: 'source', value: analysis.source ?? '' },
                { trait_type: 'centreName', value: analysis.centreName ?? '' },
            ],
            attachments: analysis.resultFile ? [analysis.resultFile] : [],
        };

        const asset = await this.upsertAsset({
            assetType,
            assetId: analysis._id,
            ownerUserId: owner._id,
            ownerWallet: owner.walletAddress,
            metadata,
        });

        await this.mintIfNeeded(asset);
        return asset;
    }

    async createForMedicationRequest(request: {
        _id: any;
        patientId: any;
        pharmacyId: any;
        medications?: Array<{ name?: string; dosage?: string; quantity?: number; unit?: string }>;
        requestDate?: Date;
        prescriptionImageUrl?: string;
    }): Promise<NftAssetDocument | null> {
        const owner = await this.safeGetUser(request.patientId?.toString());
        if (!owner?.walletAddress) {
            this.logger.warn('Wallet missing for medication request NFT mint');
            return null;
        }

        const metadata = {
            name: `Prescription Request #${request._id}`,
            description: 'Prescription used to request medications',
            assetType: NftAssetType.PRESCRIPTION,
            assetId: request._id?.toString(),
            ownerUserId: owner._id?.toString(),
            createdAt: (request.requestDate ?? new Date()).toISOString(),
            attributes: [
                { trait_type: 'pharmacyId', value: request.pharmacyId?.toString() },
                { trait_type: 'medicationsCount', value: String((request.medications ?? []).length) },
            ],
            attachments: request.prescriptionImageUrl ? [request.prescriptionImageUrl] : [],
        };

        const asset = await this.upsertAsset({
            assetType: NftAssetType.PRESCRIPTION,
            assetId: request._id,
            ownerUserId: owner._id,
            ownerWallet: owner.walletAddress,
            metadata,
        });

        await this.mintIfNeeded(asset);
        return asset;
    }

    async shareAsset(params: {
        assetType: NftAssetType;
        assetId: string;
        ownerUserId: string;
        entityUserId: string;
        expiresAt?: Date;
    }): Promise<NftAssetDocument> {
        const asset = await this.nftAssetModel
            .findOne({ assetType: params.assetType, assetId: params.assetId })
            .exec();

        if (!asset) {
            throw new NotFoundException('NFT asset introuvable');
        }

        if (asset.ownerUserId.toString() !== params.ownerUserId) {
            throw new ForbiddenException('Accès non autorisé pour partager cet actif');
        }

        if (params.ownerUserId === params.entityUserId) {
            throw new BadRequestException('Le propriétaire ne peut pas se partager lui-même');
        }

        const grantedAt = new Date();
        const expiresAt = params.expiresAt ? new Date(params.expiresAt) : undefined;
        if (expiresAt && Number.isNaN(expiresAt.getTime())) {
            throw new BadRequestException('Date d’expiration invalide');
        }

        const existing = asset.sharedWith.filter(
            (entry) => entry.entityUserId.toString() !== params.entityUserId,
        );
        existing.push({
            entityUserId: params.entityUserId as any,
            grantedAt,
            expiresAt,
        });

        asset.sharedWith = existing as any;
        return asset.save();
    }

    async revokeShare(params: {
        assetType: NftAssetType;
        assetId: string;
        ownerUserId: string;
        entityUserId: string;
    }): Promise<NftAssetDocument> {
        const asset = await this.nftAssetModel
            .findOne({ assetType: params.assetType, assetId: params.assetId })
            .exec();

        if (!asset) {
            throw new NotFoundException('NFT asset introuvable');
        }

        if (asset.ownerUserId.toString() !== params.ownerUserId) {
            throw new ForbiddenException('Accès non autorisé pour retirer le partage');
        }

        asset.sharedWith = asset.sharedWith.filter(
            (entry) => entry.entityUserId.toString() !== params.entityUserId,
        ) as any;

        return asset.save();
    }

    async isEntityAuthorized(params: {
        assetType: NftAssetType;
        assetId: string;
        entityUserId: string;
    }): Promise<boolean> {
        const asset = await this.nftAssetModel
            .findOne({ assetType: params.assetType, assetId: params.assetId })
            .exec();

        if (!asset) {
            return false;
        }

        const now = new Date();
        return asset.sharedWith.some((entry) => {
            if (entry.entityUserId.toString() !== params.entityUserId) return false;
            if (!entry.expiresAt) return true;
            return entry.expiresAt > now;
        });
    }

    async listSharedAssetIds(params: {
        assetType: NftAssetType;
        entityUserId: string;
    }): Promise<string[]> {
        const assets = await this.nftAssetModel
            .find({ assetType: params.assetType, 'sharedWith.entityUserId': params.entityUserId })
            .select({ assetId: 1, sharedWith: 1 })
            .lean()
            .exec();

        const now = new Date();
        return assets
            .filter((asset) => (asset.sharedWith ?? []).some((entry: any) => {
                if (String(entry.entityUserId) !== params.entityUserId) return false;
                if (!entry.expiresAt) return true;
                return new Date(entry.expiresAt) > now;
            }))
            .map((asset) => String(asset.assetId));
    }

    async listSharedAssetIdsOnChain(params: {
        assetType: NftAssetType;
        entityUserId: string;
    }): Promise<string[]> {
        const ids = await this.listSharedAssetIds(params);
        if (!ids.length) return [];

        const objectIds = ids
            .filter((id) => Types.ObjectId.isValid(id))
            .map((id) => new Types.ObjectId(id));
        if (!objectIds.length) return [];

        const assets = await this.nftAssetModel
            .find({ assetType: params.assetType, assetId: { $in: objectIds } })
            .lean()
            .exec();

        const checks = await Promise.all(
            assets.map(async (asset) => {
                const ok = await this.isAssetOnChainOwned(asset as unknown as NftAssetDocument);
                return ok ? String(asset.assetId) : null;
            }),
        );

        return checks.filter((id): id is string => Boolean(id));
    }

    async isAssetOnChainOwned(asset: NftAssetDocument): Promise<boolean> {
        if (!asset?.tokenId || !asset?.ownerWallet) return false;

        try {
            const owner = await this.nftChainService.ownerOf(asset.tokenId);
            return owner.toLowerCase() === asset.ownerWallet.toLowerCase();
        } catch (error) {
            this.logger.warn('On-chain ownership check failed');
            return false;
        }
    }

    async ensureAssetMinted(assetType: NftAssetType, assetId: string) {
        if (!Types.ObjectId.isValid(assetId)) {
            throw new NotFoundException('ID NFT invalide');
        }

        const asset = await this.nftAssetModel
            .findOne({ assetType, assetId: new Types.ObjectId(assetId) })
            .exec();

        if (!asset) {
            throw new NotFoundException('NFT asset introuvable');
        }

        return this.mintIfNeeded(asset, { throwOnError: true });
    }

    async getAssetByTypeAndId(assetType: NftAssetType, assetId: string) {
        if (!Types.ObjectId.isValid(assetId)) {
            return null;
        }
        return this.nftAssetModel
            .findOne({ assetType, assetId: new Types.ObjectId(assetId) })
            .exec();
    }

    async getMetadata(assetType: NftAssetType, assetId: string) {
        const asset = await this.getAssetByTypeAndId(assetType, assetId);
        if (!asset) {
            throw new NotFoundException('NFT asset introuvable');
        }
        if (asset.metadata) return asset.metadata;

        return {
            name: `${assetType} #${asset.assetId}`,
            description: 'Medical NFT asset',
            assetType,
            assetId: asset.assetId?.toString(),
            ownerWallet: asset.ownerWallet,
        };
    }

    private async upsertAsset(payload: {
        assetType: NftAssetType;
        assetId: any;
        ownerUserId: any;
        ownerWallet: string;
        metadata: Record<string, any>;
    }): Promise<NftAssetDocument> {
        const contractAddress = this.configService.get<string>('NFT_CONTRACT_ADDRESS');
        const chainId = Number(this.configService.get('POLYGON_CHAIN_ID') ?? 80002);
        const metadataUri = this.buildMetadataUri(payload.assetType, payload.assetId?.toString());

        return this.nftAssetModel.findOneAndUpdate(
            { assetType: payload.assetType, assetId: payload.assetId },
            {
                $setOnInsert: {
                    assetType: payload.assetType,
                    assetId: payload.assetId,
                    status: NftAssetStatus.PENDING,
                },
                $set: {
                    ownerUserId: payload.ownerUserId,
                    ownerWallet: payload.ownerWallet,
                    contractAddress,
                    chainId,
                    metadata: payload.metadata,
                    metadataUri,
                },
            },
            { new: true, upsert: true }
        ).exec();
    }

    private async mintIfNeeded(
        asset: NftAssetDocument,
        options?: { throwOnError?: boolean },
    ) {
        if (asset.tokenId) {
            if (asset.status !== NftAssetStatus.MINTED) {
                asset.status = NftAssetStatus.MINTED;
                await asset.save();
            }
            return asset;
        }

        if (!asset.ownerWallet) {
            const error = new Error('Missing owner wallet for NFT mint');
            if (options?.throwOnError) throw error;
            this.logger.warn(error.message);
            return asset;
        }

        try {
            this.logger.log(
                `Starting on-chain mint: type=${asset.assetType} assetId=${asset.assetId} ownerWallet=${asset.ownerWallet} contract=${asset.contractAddress ?? 'unset'} chainId=${asset.chainId ?? 'unset'} metadataUri=${asset.metadataUri ?? 'null'}`,
            );

            const result = await this.nftChainService.mintTo(
                asset.ownerWallet,
                asset.metadataUri ?? null,
            );

            asset.tokenId = result.tokenId;
            asset.txHash = result.txHash;
            asset.contractAddress = result.contractAddress;
            asset.chainId = result.chainId;
            asset.status = NftAssetStatus.MINTED;
            asset.mintedAt = new Date();

            const saved = await asset.save();
            this.logger.log(
                `NFT minted on-chain: ${saved.assetType} ${saved.assetId} tokenId=${saved.tokenId}`,
            );
            return saved;
        } catch (error) {
            asset.status = NftAssetStatus.FAILED;
            await asset.save();
            const formattedError = this.formatChainError(error);
            this.logger.error(
                `On-chain mint failed: type=${asset.assetType} assetId=${asset.assetId} ownerWallet=${asset.ownerWallet}`,
                formattedError,
            );
            if (options?.throwOnError) throw error;
            return asset;
        }
    }

    private formatChainError(error: unknown): string {
        if (!error) {
            return 'Unknown chain error';
        }

        if (error instanceof Error) {
            const payload: Record<string, unknown> = {
                name: error.name,
                message: error.message,
            };

            for (const key of ['code', 'reason', 'data', 'body', 'stack']) {
                const value = (error as any)[key];
                if (value !== undefined) payload[key] = value;
            }

            try {
                return JSON.stringify(payload, null, 2);
            } catch {
                return `${error.name}: ${error.message}`;
            }
        }

        if (typeof error === 'object') {
            try {
                return JSON.stringify(error, null, 2);
            } catch {
                return String(error);
            }
        }

        return String(error);
    }

    private buildMetadataUri(assetType: NftAssetType, assetId?: string) {
        if (!assetId) return null;
        const baseUrl = this.configService.get<string>('BACKEND_PUBLIC_URL');
        if (!baseUrl) return null;
        return `${baseUrl.replace(/\/$/, '')}/nft/metadata/${assetType}/${assetId}`;
    }

    private async safeGetUser(userId?: string) {
        if (!userId) return null;
        try {
            return await this.usersService.findById(userId);
        } catch (error) {
            this.logger.warn('Unable to resolve owner for NFT asset');
            return null;
        }
    }
}
