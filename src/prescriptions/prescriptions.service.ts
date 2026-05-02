import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Prescription, PrescriptionDocument } from './schemas/prescription.schema';
import { SharedPrescription, SharedPrescriptionDocument } from './schemas/shared-prescription.schema';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.schema';
import { NftService } from '../nft/nft.service';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { UserRole } from '../users/schemas/user.schema';
import { NftAssetType } from '../nft/schemas/nft-asset.schema';

@Injectable()
export class PrescriptionsService {
    constructor(
        @InjectModel(Prescription.name)
        private prescriptionModel: Model<PrescriptionDocument>,
        @InjectModel(SharedPrescription.name)
        private sharedPrescriptionModel: Model<SharedPrescriptionDocument>,
        private notificationService: NotificationService,
        private nftService: NftService,
        private usersService: UsersService,
        private walletService: WalletService,
    ) { }

    // ========== CRÉER UNE ORDONNANCE (MÉDECIN) ==========
    async create(createPrescriptionDto: any, doctorId: string): Promise<PrescriptionDocument> {
        const prescription = new this.prescriptionModel({
            ...createPrescriptionDto,
            doctorId: new Types.ObjectId(doctorId),
            patientId: new Types.ObjectId(createPrescriptionDto.patientId),
            prescriptionDate: new Date(),
            status: 'active',
        });

        const saved = await prescription.save();

        try {
            // Create NFT in doctor's wallet
            await this.nftService.createForPrescription(saved);
            
            // Immediately transfer NFT to patient's wallet
            const doctorUser = await this.usersService.findById(doctorId);
            const patientUser = await this.usersService.findById(String(saved.patientId));
            
            if (doctorUser?.walletEncryptedPrivateKey && patientUser?.walletAddress) {
                const doctorPrivateKey = this.walletService.decryptPrivateKey(doctorUser.walletEncryptedPrivateKey);
                try {
                    const updatedAsset = await this.nftService.transferAssetOnChain({
                        assetType: NftAssetType.PRESCRIPTION,
                        assetId: saved._id.toString(),
                        ownerPrivateKey: doctorPrivateKey,
                        toWallet: patientUser.walletAddress,
                    });
                    
                    // Update prescription with NFT info
                    saved.nftAssetId = updatedAsset._id;
                    saved.nftTokenId = updatedAsset.tokenId;
                    saved.nftMintTxHash = updatedAsset.txHash;
                    saved.nftContractAddress = updatedAsset.contractAddress;
                    saved.nftChainId = updatedAsset.chainId;
                    await saved.save();
                    
                    console.log(`[PrescriptionsService] NFT transferred to patient: ${patientUser.walletAddress}`);
                } catch (transferError) {
                    console.error('[PrescriptionsService] Erreur transfer NFT to patient:', transferError);
                }
            }
        } catch (error) {
            console.error('[PrescriptionsService] Erreur creation NFT ordonnance:', error);
        }

        // Notifier le patient (userId doit être une chaîne pour la notification)
        try {
            const patientUserId = String(createPrescriptionDto.patientId ?? saved.patientId?.toString() ?? '');
            if (patientUserId) {
                await this.notificationService.createNotification({
                    userId: patientUserId,
                    title: 'Nouvelle ordonnance',
                    message: 'Vous avez reçu une nouvelle ordonnance de votre médecin.',
                    type: NotificationType.PRESCRIPTION_UPDATE,
                    relatedId: saved._id.toString(),
                    data: {
                        prescriptionId: saved._id.toString(),
                        status: 'active',
                    },
                });
            }
        } catch (error) {
            console.error('[PrescriptionsService] Erreur notification patient:', error);
        }

        return saved;
    }

    // ========== RÉCUPÉRER LES ORDONNANCES D'UN PATIENT ==========
    async findByPatient(patientId: string): Promise<PrescriptionDocument[]> {
        const prescriptions = await this.prescriptionModel
            .find({ patientId: new Types.ObjectId(patientId) })
            .populate('doctorId', 'fullName email phone')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        // Attach on-chain / NFT metadata if available
        return await Promise.all(prescriptions.map(async (p: any) => {
            if (p && p._id) {
                try {
                    const asset = await this.nftService.getAssetByTypeAndId(NftAssetType.PRESCRIPTION, p._id.toString());
                    if (asset) {
                        (p as any).nft = {
                            tokenId: asset.tokenId,
                            txHash: asset.txHash,
                            contractAddress: asset.contractAddress,
                            chainId: asset.chainId,
                            metadata: asset.metadata,
                            metadataUri: asset.metadataUri,
                        };
                    }
                } catch (err) {
                    // ignore
                }
            }
            return p;
        })) as unknown as PrescriptionDocument[];
    }

    // ========== RÉCUPÉRER LES ORDONNANCES ÉMISES PAR UN MÉDECIN ==========
    async findByDoctor(doctorId: string): Promise<PrescriptionDocument[]> {
        const prescriptions = await this.prescriptionModel
            .find({ doctorId: new Types.ObjectId(doctorId) })
            .populate('patientId', 'email phone')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return await Promise.all(prescriptions.map(async (p: any) => {
            if (p && p._id) {
                try {
                    const asset = await this.nftService.getAssetByTypeAndId(NftAssetType.PRESCRIPTION, p._id.toString());
                    if (asset) {
                        (p as any).nft = {
                            tokenId: asset.tokenId,
                            txHash: asset.txHash,
                            contractAddress: asset.contractAddress,
                            chainId: asset.chainId,
                            metadata: asset.metadata,
                            metadataUri: asset.metadataUri,
                        };
                    }
                } catch (err) {
                    // ignore
                }
            }
            return p;
        })) as unknown as PrescriptionDocument[];
    }

    // ========== RÉCUPÉRER UNE ORDONNANCE PAR ID ==========
    async findOne(id: string): Promise<PrescriptionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('ID ordonnance invalide');
        }
        const prescription = await this.prescriptionModel
            .findById(id)
            .populate('patientId', 'email phone')
            .populate('doctorId', 'email phone')
            .exec();

        if (!prescription) {
            throw new NotFoundException('Ordonnance non trouvée');
        }
        return prescription;
    }

    // ========== METTRE À JOUR LE STATUT D'UNE ORDONNANCE ==========
    async updateStatus(id: string, status: string): Promise<PrescriptionDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('ID ordonnance invalide');
        }

        const normalizedStatus = this.normalizePrescriptionStatus(status);

        const prescription = await this.prescriptionModel
            .findByIdAndUpdate(
                id,
                { status: normalizedStatus },
                { new: true, runValidators: true, context: 'query' },
            )
            .exec();

        if (!prescription) {
            throw new NotFoundException('Ordonnance non trouvée');
        }

        // Notifier le patient du changement de statut
        try {
            const statusMessages: Record<string, string> = {
                completed: 'Votre ordonnance a été marquée comme complétée.',
                cancelled: 'Votre ordonnance a été annulée.',
                active: 'Votre ordonnance est à nouveau active.',
            };
            const message = statusMessages[normalizedStatus] || `Le statut de votre ordonnance a été mis à jour : ${normalizedStatus}`;

            await this.notificationService.createNotification({
                userId: prescription.patientId.toString(),
                title: 'Mise à jour ordonnance',
                message,
                type: NotificationType.PRESCRIPTION_UPDATE,
                relatedId: id,
                data: { prescriptionId: id, status: normalizedStatus },
            });
        } catch (error) {
            console.error('[PrescriptionsService] Erreur notification statut:', error);
        }

        return prescription;
    }

    private normalizePrescriptionStatus(status: string): 'active' | 'completed' | 'cancelled' {
        const lowerStatus = status.toString().trim().toLowerCase();
        switch (lowerStatus) {
            case 'active':
            case 'en cours':
            case 'en_cours':
            case 'pending':
            case 'en attente':
            case 'en_attente':
                return 'active';
            case 'completed':
            case 'complété':
            case 'complétée':
            case 'termine':
            case 'terminé':
            case 'terminée':
            case 'done':
            case 'finished':
                return 'completed';
            case 'cancelled':
            case 'canceled':
            case 'annulé':
            case 'annule':
            case 'annulée':
            case 'rejected':
                return 'cancelled';
            default:
                throw new BadRequestException(`Statut d'ordonnance invalide: ${status}`);
        }
    }

    // ========== SUPPRIMER UNE ORDONNANCE (MÉDECIN SEULEMENT) ==========
    async delete(id: string, doctorId: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('ID ordonnance invalide');
        }

        const prescription = await this.prescriptionModel.findById(id).exec();
        if (!prescription) {
            throw new NotFoundException('Ordonnance non trouvée');
        }
        if (prescription.doctorId.toString() !== doctorId) {
            throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer cette ordonnance');
        }

        await this.prescriptionModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    }

    async shareWithPharmacy(
        prescriptionId: string,
        patientId: string,
        pharmacyId: string,
        expiresAt?: Date,
    ) {
        if (!Types.ObjectId.isValid(prescriptionId)) {
            throw new NotFoundException('ID ordonnance invalide');
        }

        const prescription = await this.prescriptionModel.findById(prescriptionId).exec();
        if (!prescription) {
            throw new NotFoundException('Ordonnance non trouvée');
        }

        if (prescription.patientId.toString() !== patientId) {
            throw new ForbiddenException('Vous ne pouvez pas partager cette ordonnance');
        }

        const pharmacyUser = await this.usersService.findById(pharmacyId);
        if (!pharmacyUser || pharmacyUser.role !== UserRole.PHARMACIE) {
            throw new BadRequestException('Pharmacie invalide');
        }

        const asset = await this.nftService.createForPrescription(prescription);
        if (!asset) {
            throw new BadRequestException('Wallet patient indisponible pour le partage');
        }

        try {
            await this.nftService.ensureAssetMinted(
                NftAssetType.PRESCRIPTION,
                prescriptionId,
            );
        } catch (error) {
            throw new BadRequestException('Mint on-chain échoué pour cette ordonnance');
        }

        return this.nftService.shareAsset({
            assetType: NftAssetType.PRESCRIPTION,
            assetId: prescriptionId,
            ownerUserId: patientId,
            entityUserId: pharmacyId,
            expiresAt,
        });
    }

    async revokeShareWithPharmacy(
        prescriptionId: string,
        patientId: string,
        pharmacyId: string,
    ) {
        return this.nftService.revokeShare({
            assetType: NftAssetType.PRESCRIPTION,
            assetId: prescriptionId,
            ownerUserId: patientId,
            entityUserId: pharmacyId,
        });
    }

    async listSharedForPharmacy(pharmacyId: string): Promise<PrescriptionDocument[]> {
        const sharedIds = await this.nftService.listSharedAssetIdsOnChain({
            assetType: NftAssetType.PRESCRIPTION,
            entityUserId: pharmacyId,
        });

        if (!sharedIds.length) {
            return [];
        }

        return this.prescriptionModel
            .find({ _id: { $in: sharedIds.map((id) => new Types.ObjectId(id)) } })
            .populate('doctorId', 'fullName email phone')
            .populate('patientId', 'email phone')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getSharedByPharmacy(prescriptionId: string, pharmacyId: string) {
        const authorized = await this.nftService.isEntityAuthorized({
            assetType: NftAssetType.PRESCRIPTION,
            assetId: prescriptionId,
            entityUserId: pharmacyId,
        });

        if (!authorized) {
            throw new ForbiddenException('Accès non autorisé à cette ordonnance');
        }

        const asset = await this.nftService.getAssetByTypeAndId(
            NftAssetType.PRESCRIPTION,
            prescriptionId,
        );
        if (!asset) {
            throw new ForbiddenException('NFT associé introuvable');
        }

        const onChainOk = await this.nftService.isAssetOnChainOwned(asset);
        if (!onChainOk) {
            throw new ForbiddenException('Ordonnance non disponible (NFT non on-chain)');
        }

        return this.findOne(prescriptionId);
    }

    // ========== TRANSFERER L'ORDONNANCE DU MÉDECIN AU PATIENT (ON-CHAIN) ==========
    async transferToPatient(prescriptionId: string, doctorId: string) {
        if (!Types.ObjectId.isValid(prescriptionId)) {
            throw new NotFoundException('ID ordonnance invalide');
        }

        const prescription = await this.prescriptionModel.findById(prescriptionId).exec();
        if (!prescription) throw new NotFoundException('Ordonnance non trouvée');

        if (prescription.doctorId.toString() !== doctorId) {
            throw new ForbiddenException('Vous n\'êtes pas autorisé à transférer cette ordonnance');
        }

        const doctorUser = await this.usersService.findById(doctorId);
        const patientUser = await this.usersService.findById(String(prescription.patientId));

        if (!doctorUser || !patientUser) throw new NotFoundException('Utilisateur introuvable');
        if (!doctorUser.walletEncryptedPrivateKey) throw new BadRequestException('Cle privee du medecin indisponible');
        if (!patientUser.walletAddress) throw new BadRequestException('Wallet patient indisponible');

        const asset = await this.nftService.getAssetByTypeAndId(NftAssetType.PRESCRIPTION, prescriptionId);
        if (!asset) {
            // try to create asset record and mint it to the doctor
            await this.nftService.createForPrescription(prescription as any);
        }

        // decrypt doctor's private key
        const doctorPrivateKey = this.walletService.decryptPrivateKey(doctorUser.walletEncryptedPrivateKey);

        // perform the on-chain transfer
        const updatedAsset = await this.nftService.transferAssetOnChain({
            assetType: NftAssetType.PRESCRIPTION,
            assetId: prescriptionId,
            ownerPrivateKey: doctorPrivateKey,
            toWallet: patientUser.walletAddress,
        });

        // store token info on the prescription document if present
        prescription.nftAssetId = updatedAsset._id;
        prescription.nftTokenId = updatedAsset.tokenId;
        prescription.nftMintTxHash = updatedAsset.txHash;
        prescription.nftContractAddress = updatedAsset.contractAddress;
        prescription.nftChainId = updatedAsset.chainId;
        await prescription.save();

        return { success: true, asset: updatedAsset };
    }

    // ========== SIMPLE SHARE (NO ENCRYPTION / NO NFT) ==========
    async simpleShareWithPharmacies(
        prescriptionIds: string[],
        pharmacyIds: string[],
        patientId: string,
    ) {
        // Validate that all prescriptions belong to the patient
        const prescriptions = await this.prescriptionModel.find({
            _id: { $in: prescriptionIds.map((id) => new Types.ObjectId(id)) },
            patientId: new Types.ObjectId(patientId),
        }).exec();

        if (prescriptions.length === 0) {
            throw new BadRequestException('Aucune ordonnance valide trouvée');
        }

        if (prescriptions.length !== prescriptionIds.length) {
            throw new BadRequestException('Certaines ordonnances ne vous appartiennent pas');
        }

        const validPrescriptionIds = prescriptions.map((p) => p._id.toString());

        // Build share records (skip duplicates via upsert)
        const ops = [];
        for (const prescriptionId of validPrescriptionIds) {
            for (const pharmacyId of pharmacyIds) {
                ops.push({
                    updateOne: {
                        filter: {
                            prescriptionId: new Types.ObjectId(prescriptionId),
                            pharmacyId: new Types.ObjectId(pharmacyId),
                        },
                        update: {
                            $setOnInsert: {
                                prescriptionId: new Types.ObjectId(prescriptionId),
                                pharmacyId: new Types.ObjectId(pharmacyId),
                                patientId: new Types.ObjectId(patientId),
                                sharedAt: new Date(),
                            },
                        },
                        upsert: true,
                    },
                });
            }
        }

        if (ops.length > 0) {
            await this.sharedPrescriptionModel.bulkWrite(ops);
        }

        return {
            success: true,
            sharedCount: ops.length,
            prescriptionIds: validPrescriptionIds,
            pharmacyIds,
        };
    }

    async listSimpleSharedForPharmacy(pharmacyId: string): Promise<PrescriptionDocument[]> {
        const shares = await this.sharedPrescriptionModel.find({
            pharmacyId: new Types.ObjectId(pharmacyId),
        }).exec();

        if (!shares.length) return [];

        const prescriptionIds = shares.map((s) => s.prescriptionId);

        return this.prescriptionModel
            .find({ _id: { $in: prescriptionIds } })
            .populate('doctorId', 'fullName email phone')
            .populate('patientId', 'email phone fullName')
            .sort({ createdAt: -1 })
            .exec();
    }
}
